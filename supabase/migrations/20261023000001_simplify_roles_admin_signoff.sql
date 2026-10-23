-- Migration: 20261023000001_simplify_roles_admin_signoff.sql
-- Description: Safe simplification to two operational roles (Admin and Staff).
-- Allows Admin (Clinical Laboratory Director) to finalize and release diagnostic reports directly,
-- while preserving all historical reviewer records, signed reports, and immutable audit logs.

-- 1. Update RLS policy on report_versions to permit Admin in addition to Authorized Reviewer
DROP POLICY IF EXISTS "Reviewer can insert and update report versions" ON report_versions;

CREATE POLICY "Admin and Reviewer can manage report versions" ON report_versions
  FOR ALL TO authenticated
  USING (has_role('admin') OR has_role('authorized_reviewer'));

-- 2. Update RLS policy on review_decisions to permit Admin in addition to Authorized Reviewer
DROP POLICY IF EXISTS "Reviewers can manage decisions" ON review_decisions;

CREATE POLICY "Admin and Reviewers can manage decisions" ON review_decisions
  FOR ALL TO authenticated
  USING (has_role('admin') OR has_role('authorized_reviewer'));

-- 3. Update authorize_report transactional function to permit Admin (Clinical Director) sign-off
CREATE OR REPLACE FUNCTION authorize_report(
  p_order_id UUID,
  p_submission_id UUID,
  p_reviewer_id UUID,
  p_comments TEXT DEFAULT 'Authorized for release'
)
RETURNS report_versions AS $$
DECLARE
  v_order orders;
  v_lab labs;
  v_patient patients;
  v_submission review_submissions;
  v_reviewer staff_profiles;
  v_scope reviewer_scopes;
  v_author_conflict BOOLEAN;
  v_unresolved_criticals INTEGER;
  v_current_version_count INTEGER;
  v_new_version_num INTEGER;
  v_report_number TEXT;
  v_year TEXT := to_char(now(), 'YYYY');
  v_seq BIGINT;
  v_full_snapshot JSONB;
  v_new_report report_versions;
  v_is_admin BOOLEAN;
BEGIN
  -- 1. Fetch Order and Lab
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

  -- 4. Verify Reviewer Profile and Role (Admin or Authorized Reviewer)
  SELECT * INTO v_reviewer FROM staff_profiles WHERE id = p_reviewer_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer is not an active staff member';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM staff_role_assignments
    WHERE staff_id = p_reviewer_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin AND NOT EXISTS (
    SELECT 1 FROM staff_role_assignments
    WHERE staff_id = p_reviewer_id AND role = 'authorized_reviewer'
  ) THEN
    RAISE EXCEPTION 'Staff member does not hold an active Admin or Authorized Reviewer role';
  END IF;

  -- 5. Scope check (if not admin, check reviewer scopes)
  IF NOT v_is_admin THEN
    SELECT * INTO v_scope FROM reviewer_scopes
    WHERE staff_id = p_reviewer_id
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

  -- 6. STRICT INDEPENDENT AUTHORIZATION: Reviewer/Admin cannot authorize results they personally entered!
  SELECT EXISTS (
    SELECT 1 FROM results r
    WHERE r.order_id = p_order_id
      AND (r.entered_by = p_reviewer_id OR r.last_edited_by = p_reviewer_id)
  ) INTO v_author_conflict;

  IF v_author_conflict THEN
    RAISE EXCEPTION 'INDEPENDENT AUTHORIZATION VIOLATION: Reviewer/Admin cannot authorize results they entered or edited';
  END IF;

  -- 7. Verify Critical Result Notifications: All criticals must have acknowledged/resolved communication
  SELECT count(*)
  INTO v_unresolved_criticals
  FROM results r
  JOIN order_test_parameters otp ON otp.id = r.order_test_parameter_id
  LEFT JOIN critical_notifications cn ON cn.order_test_parameter_id = otp.id AND cn.order_id = p_order_id
  WHERE r.order_id = p_order_id
    AND r.flag = 'critical'
    AND (cn.id IS NULL OR cn.read_back_confirmed IS NOT TRUE OR cn.escalation_status != 'resolved');

  IF v_unresolved_criticals > 0 THEN
    RAISE EXCEPTION 'Cannot authorize: % critical result(s) lack confirmed read-back / documented communication', v_unresolved_criticals;
  END IF;

  -- 8. Compute version number
  SELECT count(*) INTO v_current_version_count FROM report_versions WHERE order_id = p_order_id;
  v_new_version_num := v_current_version_count + 1;

  IF v_new_version_num = 1 THEN
    v_seq := get_next_sequence_number('REP-' || v_year);
    v_report_number := 'REP-' || v_year || '-' || lpad(v_seq::text, 4, '0') || '-v1';
  ELSE
    SELECT regexp_replace(report_number, '-v[0-9]+$', '') || '-v' || v_new_version_num
    INTO v_report_number
    FROM report_versions
    WHERE order_id = p_order_id AND version_number = 1;
  END IF;

  -- 9. Assemble Complete Immutable Report Snapshot
  SELECT jsonb_build_object(
    'report_number', v_report_number,
    'version', v_new_version_num,
    'order_number', v_order.order_number,
    'ordering_physician', v_order.ordering_physician,
    'clinical_indication', v_order.clinical_indication,
    'lab', jsonb_build_object(
      'name', v_lab.name,
      'address', v_lab.address,
      'phone', v_lab.phone,
      'email', v_lab.email,
      'director', COALESCE(v_lab.clinical_director, 'Vakiti Padma Reddy'),
      'license', v_lab.lab_license_number,
      'header_text', v_lab.report_header_text,
      'footer_text', v_lab.report_footer_text,
      'timezone', v_lab.timezone
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
      'credentials', CASE WHEN v_is_admin THEN 'Clinical Laboratory Director' ELSE COALESCE(v_scope.credentials_title, 'Authorized Reviewer') END,
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
            JOIN results r ON r.order_test_parameter_id = otp.id
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

  -- 10. Insert Immutable Report Version
  INSERT INTO report_versions (
    order_id,
    version_number,
    report_number,
    status,
    report_snapshot,
    authorized_by,
    authorized_at
  ) VALUES (
    p_order_id,
    v_new_version_num,
    v_report_number,
    'authorized',
    v_full_snapshot,
    p_reviewer_id,
    now()
  ) RETURNING * INTO v_new_report;

  -- 11. Update Review Submission Status
  UPDATE review_submissions
  SET status = 'authorized'
  WHERE id = p_submission_id;

  RETURN v_new_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
