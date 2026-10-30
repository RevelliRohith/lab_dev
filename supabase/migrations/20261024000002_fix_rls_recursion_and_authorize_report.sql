-- Migration: 20261024000002_fix_rls_recursion_and_authorize_report.sql
-- Description: Corrective migration resolving:
--   1. Self-referencing RLS recursion on staff_profiles using SECURITY DEFINER helper.
--   2. Function name and overload cleanup (dropping orphaned authorize_clinical_report and legacy 4-param authorize_report).
--   3. Caller session binding (deriving reviewer actor strictly from auth.uid() rather than untrusted parameter).
--   4. Explicit search_path = public on all SECURITY DEFINER functions.
--   5. Explicit REVOKE EXECUTE FROM PUBLIC and GRANT TO authenticated, service_role.
--   6. Complete structured JSON snapshot (tests + specimens) compatible with ReportSnapshot and PDF generation.
--   7. Full amendment lineage tracking (linking prior_report_version_id and storing amendment_reason).
--   8. Department scope validation for non-admin clinical reviewers.
--
-- STATUS: PREPARED FOR REVIEW (DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL)

-- 1. Helper Function: Current User Lab ID (eliminates RLS recursion)
CREATE OR REPLACE FUNCTION current_user_lab_id()
RETURNS UUID AS $$
  SELECT lab_id FROM staff_profiles
  WHERE id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION current_user_lab_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_lab_id() TO authenticated, service_role;

-- 2. Correct staff_profiles RLS policy to use non-recursive helper
DROP POLICY IF EXISTS "Active staff can view lab colleagues" ON staff_profiles;
CREATE POLICY "Active staff can view lab colleagues" ON staff_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR lab_id = current_user_lab_id());

-- 3. Drop legacy orphaned functions and legacy overloads
DROP FUNCTION IF EXISTS authorize_clinical_report(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS authorize_clinical_report(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS authorize_report(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS authorize_report(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS authorize_report(UUID, UUID, TEXT);

-- 4. Unified, Secure authorize_report function
-- Binds reviewer to auth.uid(), checks Admin or Reviewer role, validates scopes, builds full snapshot, links prior versions
CREATE OR REPLACE FUNCTION authorize_report(
  p_order_id UUID,
  p_submission_id UUID,
  p_comments TEXT DEFAULT 'Authorized for release'
)
RETURNS report_versions AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_order orders;
  v_lab labs;
  v_patient patients;
  v_submission review_submissions;
  v_reviewer staff_profiles;
  v_scope reviewer_scopes;
  v_is_admin BOOLEAN := false;
  v_is_reviewer BOOLEAN := false;
  v_unresolved_criticals INTEGER;
  v_version_count INTEGER;
  v_new_version_num INTEGER;
  v_report_number TEXT;
  v_year TEXT := to_char(now(), 'YYYY');
  v_seq BIGINT;
  v_prior_version_id UUID := NULL;
  v_full_snapshot JSONB;
  v_new_report report_versions;
BEGIN
  -- Verify caller is authenticated
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller identity not established';
  END IF;

  -- 1. Fetch Order and Lab with locking
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT * INTO v_lab FROM labs WHERE id = v_order.lab_id;

  -- 2. Fetch Patient
  SELECT * INTO v_patient FROM patients WHERE id = v_order.patient_id;

  -- 3. Verify Active Submission
  SELECT * INTO v_submission FROM review_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND OR v_submission.order_id != p_order_id OR v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Review submission is not in pending status or does not match order';
  END IF;

  -- 4. Verify Reviewer Profile and Active Status within the same lab
  SELECT * INTO v_reviewer FROM staff_profiles
  WHERE id = v_actor_id AND lab_id = v_order.lab_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer is not an active staff member of this laboratory';
  END IF;

  -- Check roles
  SELECT EXISTS (
    SELECT 1 FROM staff_role_assignments
    WHERE staff_id = v_actor_id AND role = 'admin'
  ) INTO v_is_admin;

  SELECT EXISTS (
    SELECT 1 FROM staff_role_assignments
    WHERE staff_id = v_actor_id AND role = 'authorized_reviewer'
  ) INTO v_is_reviewer;

  IF NOT (v_is_admin OR v_is_reviewer) THEN
    RAISE EXCEPTION 'Permission Denied: Only Admin or Authorized Reviewer may sign off clinical reports';
  END IF;

  -- 5. Scope check for non-admin reviewers (validity period and department coverage)
  IF NOT v_is_admin THEN
    SELECT * INTO v_scope FROM reviewer_scopes
    WHERE staff_id = v_actor_id
      AND is_active = true
      AND CURRENT_DATE BETWEEN valid_from AND valid_to
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reviewer does not have valid, active professional credentials or scopes for today';
    END IF;

    IF NOT ('ALL' = ANY(v_scope.verified_scopes)) THEN
      IF EXISTS (
        SELECT 1 FROM order_tests ot
        WHERE ot.order_id = p_order_id
          AND NOT (ot.department_snapshot = ANY(v_scope.verified_scopes))
      ) THEN
        RAISE EXCEPTION 'Reviewer scope does not cover all test departments in this order';
      END IF;
    END IF;
  END IF;

  -- 6. Independent Review Check: Reviewer cannot authorize results they entered or edited
  IF EXISTS (
    SELECT 1 FROM results
    WHERE order_id = p_order_id
      AND (entered_by = v_actor_id OR last_edited_by = v_actor_id)
  ) THEN
    RAISE EXCEPTION 'Independent Review Violation: Reviewer cannot authorize results they personally entered or edited';
  END IF;

  -- 7. Critical panic results check: All critical results must have documented read-back
  SELECT COUNT(*) INTO v_unresolved_criticals
  FROM results r
  WHERE r.order_id = p_order_id
    AND r.flag = 'critical'
    AND NOT EXISTS (
      SELECT 1 FROM critical_notifications cn
      WHERE cn.order_test_parameter_id = r.order_test_parameter_id
        AND cn.read_back_confirmed = true
        AND cn.escalation_status = 'resolved'
    );

  IF v_unresolved_criticals > 0 THEN
    RAISE EXCEPTION 'Cannot authorize: % critical result(s) lack documented physician read-back confirmation', v_unresolved_criticals;
  END IF;

  -- 8. Versioning & Report Numbering
  SELECT COUNT(*) INTO v_version_count FROM report_versions WHERE order_id = p_order_id;
  v_new_version_num := v_version_count + 1;

  IF v_new_version_num = 1 THEN
    SELECT nextval('report_number_seq') INTO v_seq;
    v_report_number := 'REP-' || v_year || '-' || lpad(v_seq::text, 4, '0') || '-v1';
  ELSE
    SELECT id, split_part(report_number, '-v', 1) INTO v_prior_version_id, v_report_number
    FROM report_versions WHERE order_id = p_order_id ORDER BY version_number DESC LIMIT 1;
    v_report_number := v_report_number || '-v' || v_new_version_num;

    -- Mark prior versions as superseded
    UPDATE report_versions SET status = 'superseded' WHERE order_id = p_order_id;
  END IF;

  -- 9. Build Tamper-Evident Structured Clinical Snapshot (matching ReportSnapshot interface)
  SELECT jsonb_build_object(
    'report_number', v_report_number,
    'version', v_new_version_num,
    'order_number', v_order.order_number,
    'ordering_physician', COALESCE(v_order.ordering_physician, 'Self / Walk-in'),
    'clinical_indication', COALESCE(v_order.clinical_indication, 'Routine diagnostic check'),
    'lab', jsonb_build_object(
      'name', v_lab.name,
      'code', v_lab.code,
      'address', v_lab.address,
      'phone', v_lab.phone,
      'email', v_lab.email,
      'director', v_lab.clinical_director,
      'license', v_lab.lab_license_number,
      'header_text', v_lab.report_header_text,
      'footer_text', v_lab.report_footer_text,
      'timezone', COALESCE(v_lab.timezone, 'Asia/Kolkata')
    ),
    'patient', jsonb_build_object(
      'patient_number', v_patient.patient_number,
      'full_name', v_patient.full_name,
      'sex', v_patient.sex,
      'date_of_birth', v_patient.date_of_birth,
      'estimated_age_years', v_patient.estimated_age_years,
      'is_age_estimated', v_patient.is_age_estimated,
      'phone', v_patient.phone
    ),
    'reviewer', jsonb_build_object(
      'full_name', v_reviewer.full_name,
      'email', v_reviewer.email,
      'credentials', COALESCE(v_reviewer.designation, 'Authorized Clinical Reviewer'),
      'authorized_at', now()
    ),
    'qa_attestation', jsonb_build_object(
      'attested', v_submission.qa_checks_attested,
      'notes', v_submission.qa_attestation_notes,
      'submitted_at', v_submission.submitted_at
    ),
    'tests', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'test_name', ot.test_name_snapshot,
          'test_code', ot.test_code_snapshot,
          'department', ot.department_snapshot,
          'parameters', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'parameter_name', otp.parameter_name_snapshot,
                'parameter_code', otp.parameter_code_snapshot,
                'result_type', otp.result_type_snapshot,
                'unit', otp.unit_snapshot,
                'reference_range', otp.reference_range_snapshot,
                'disposition', r.disposition,
                'non_performed_reason', r.non_performed_reason,
                'numeric_value', r.numeric_value,
                'text_value', r.text_value,
                'flag', r.flag
              ) ORDER BY otp.display_order
            )
            FROM order_test_parameters otp
            LEFT JOIN results r ON r.order_test_parameter_id = otp.id
            WHERE otp.order_test_id = ot.id
          )
        )
      )
      FROM order_tests ot
      WHERE ot.order_id = p_order_id
    ),
    'specimens', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'specimen_number', s.specimen_number,
          'type', s.specimen_type,
          'container', s.container_type,
          'collected_at', s.collected_at,
          'received_at', s.received_at
        )
      )
      FROM specimens s
      WHERE s.order_id = p_order_id
    )
  ) INTO v_full_snapshot;

  -- 10. Insert Report Version with full amendment lineage
  INSERT INTO report_versions (
    order_id, version_number, report_number, status, report_snapshot,
    authorized_by, authorized_at, amendment_reason, prior_report_version_id
  ) VALUES (
    p_order_id, v_new_version_num, v_report_number, 'authorized',
    v_full_snapshot, v_actor_id, now(),
    CASE WHEN v_new_version_num > 1 THEN p_comments ELSE NULL END,
    v_prior_version_id
  ) RETURNING * INTO v_new_report;

  -- 11. Mark Submission as Authorized
  UPDATE review_submissions
  SET status = 'authorized', reviewed_by = v_actor_id, reviewed_at = now()
  WHERE id = p_submission_id;

  -- 12. Record Immutable Audit Event
  INSERT INTO audit_events (
    lab_id, actor_id, event_type, target_entity, target_id, details
  ) VALUES (
    v_order.lab_id, v_actor_id, 'report_authorized', 'report_versions', v_new_report.id,
    jsonb_build_object(
      'report_number', v_report_number,
      'version', v_new_version_num,
      'comments', p_comments,
      'prior_version_id', v_prior_version_id
    )
  );

  RETURN v_new_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly revoke from PUBLIC and grant to authenticated and service_role
REVOKE EXECUTE ON FUNCTION authorize_report(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authorize_report(UUID, UUID, TEXT) TO authenticated, service_role;
