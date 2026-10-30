-- Rollback Migration: 20261024000002_rollback_fix_rls_recursion.sql
-- Description: Safely reverts 20261024000002_fix_rls_recursion_and_authorize_report.sql
-- Restores previous state in case of unexpected migration behavior.

-- 1. Drop the updated authorize_report function
DROP FUNCTION IF EXISTS authorize_report(UUID, UUID, TEXT);

-- 2. Drop the helper function
DROP FUNCTION IF EXISTS current_user_lab_id();

-- 3. Restore staff_profiles RLS policy to pre-migration definition
DROP POLICY IF EXISTS "Active staff can view lab colleagues" ON staff_profiles;
CREATE POLICY "Active staff can view lab colleagues" ON staff_profiles
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

-- 4. Restore the 4-argument authorize_report function from 20261023000001
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

  -- 6. Independent Review Check
  IF EXISTS (
    SELECT 1 FROM results
    WHERE order_id = p_order_id
      AND (entered_by = p_reviewer_id OR last_edited_by = p_reviewer_id)
  ) THEN
    RAISE EXCEPTION 'INDEPENDENT AUTHORIZATION VIOLATION: Reviewer cannot authorize results they entered or edited';
  END IF;

  -- 7. Critical panic results check
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
    RAISE EXCEPTION 'Cannot authorize: % critical result(s) lack documented and acknowledged communication/read-back', v_unresolved_criticals;
  END IF;

  -- 8. Versioning & Report Numbering
  SELECT COUNT(*) INTO v_current_version_count FROM report_versions WHERE order_id = p_order_id;
  v_new_version_num := v_current_version_count + 1;

  IF v_new_version_num = 1 THEN
    SELECT nextval('report_number_seq') INTO v_seq;
    v_report_number := 'REP-' || v_year || '-' || lpad(v_seq::text, 4, '0') || '-v1';
  ELSE
    SELECT split_part(report_number, '-v', 1) INTO v_report_number
    FROM report_versions WHERE order_id = p_order_id ORDER BY version_number ASC LIMIT 1;
    v_report_number := v_report_number || '-v' || v_new_version_num;
  END IF;

  -- 9. Insert Report Version
  INSERT INTO report_versions (
    order_id, version_number, report_number, status, report_snapshot,
    authorized_by, authorized_at
  ) VALUES (
    p_order_id, v_new_version_num, v_report_number, 'authorized',
    '{}'::jsonb, p_reviewer_id, now()
  ) RETURNING * INTO v_new_report;

  RETURN v_new_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
