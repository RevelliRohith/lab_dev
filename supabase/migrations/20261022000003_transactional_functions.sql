-- Migration: 20261022000003_transactional_functions.sql
-- Description: Transactional functions enforcing clinical safety invariants, sequential IDs, and audit triggers.

-- Sequence generator table for atomic concurrent human-readable IDs
CREATE TABLE IF NOT EXISTS system_sequences (
  id TEXT PRIMARY KEY, -- e.g. 'PAT', 'ORD-2026', 'INV-2026', 'SPEC-2026', 'PAY-2026', 'REP-2026'
  current_val BIGINT NOT NULL DEFAULT 0
);

-- Function to safely generate unique sequential numbers under concurrency
CREATE OR REPLACE FUNCTION get_next_sequence_number(seq_prefix TEXT)
RETURNS BIGINT AS $$
DECLARE
  v_next BIGINT;
BEGIN
  INSERT INTO system_sequences (id, current_val)
  VALUES (seq_prefix, 1)
  ON CONFLICT (id)
  DO UPDATE SET current_val = system_sequences.current_val + 1
  RETURNING current_val INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Function: Collect & Receive Specimen in one step (On-site collection)
CREATE OR REPLACE FUNCTION collect_and_receive_specimen(
  p_specimen_id UUID,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS specimens AS $$
DECLARE
  v_specimen specimens;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_specimen FROM specimens WHERE id = p_specimen_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Specimen not found: %', p_specimen_id;
  END IF;

  IF v_specimen.status IN ('rejected', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Cannot collect/receive specimen in status: %', v_specimen.status;
  END IF;

  UPDATE specimens
  SET status = 'received',
      collected_at = COALESCE(collected_at, v_now),
      collected_by = COALESCE(collected_by, p_actor_id),
      received_at = v_now,
      received_by = p_actor_id,
      updated_at = v_now
  WHERE id = p_specimen_id
  RETURNING * INTO v_specimen;

  INSERT INTO specimen_events (specimen_id, event_type, previous_status, new_status, actor_id, notes)
  VALUES (p_specimen_id, 'collect_and_receive', 'awaiting_collection', 'received', p_actor_id, p_notes);

  RETURN v_specimen;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function: Reject specimen and order replacement recollection
CREATE OR REPLACE FUNCTION reject_specimen_and_recollect(
  p_specimen_id UUID,
  p_rejection_reason TEXT,
  p_actor_id UUID
)
RETURNS specimens AS $$
DECLARE
  v_old specimens;
  v_new specimens;
  v_seq BIGINT;
  v_new_number TEXT;
  v_year TEXT := to_char(now(), 'YYYY');
BEGIN
  IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is mandatory';
  END IF;

  SELECT * INTO v_old FROM specimens WHERE id = p_specimen_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Specimen not found: %', p_specimen_id;
  END IF;

  -- Mark old specimen rejected
  UPDATE specimens
  SET status = 'rejected',
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE id = p_specimen_id;

  INSERT INTO specimen_events (specimen_id, event_type, previous_status, new_status, actor_id, notes)
  VALUES (p_specimen_id, 'rejected', v_old.status, 'rejected', p_actor_id, p_rejection_reason);

  -- Generate replacement specimen
  v_seq := get_next_sequence_number('SPEC-' || v_year);
  v_new_number := 'SPEC-' || v_year || '-' || lpad(v_seq::text, 4, '0');

  INSERT INTO specimens (
    lab_id, order_id, specimen_number, specimen_type, container_type,
    status, parent_specimen_id
  ) VALUES (
    v_old.lab_id, v_old.order_id, v_new_number, v_old.specimen_type, v_old.container_type,
    'awaiting_collection', v_old.id
  ) RETURNING * INTO v_new;

  -- Link order tests from rejected specimen to new specimen
  INSERT INTO specimen_tests (specimen_id, order_test_id)
  SELECT v_new.id, order_test_id
  FROM specimen_tests
  WHERE specimen_id = v_old.id;

  INSERT INTO specimen_events (specimen_id, event_type, previous_status, new_status, actor_id, notes)
  VALUES (v_new.id, 'recollection_created', NULL, 'awaiting_collection', p_actor_id, 'Replacement for ' || v_old.specimen_number);

  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: Submit Results for Review with QA attestation
CREATE OR REPLACE FUNCTION submit_results_for_review(
  p_order_id UUID,
  p_submitted_by UUID,
  p_qa_attestation_notes TEXT
)
RETURNS review_submissions AS $$
DECLARE
  v_incomplete_count INTEGER;
  v_snapshot JSONB;
  v_submission review_submissions;
BEGIN
  IF p_qa_attestation_notes IS NULL OR trim(p_qa_attestation_notes) = '' THEN
    RAISE EXCEPTION 'Documented Quality Check Attestation is mandatory before review submission';
  END IF;

  -- Check completeness: every parameter for tests in order must have a result
  SELECT count(*)
  INTO v_incomplete_count
  FROM order_test_parameters otp
  JOIN order_tests ot ON ot.id = otp.order_test_id
  LEFT JOIN results r ON r.order_test_parameter_id = otp.id
  WHERE ot.order_id = p_order_id
    AND (r.id IS NULL OR (r.disposition = 'performed' AND r.numeric_value IS NULL AND (r.text_value IS NULL OR trim(r.text_value) = '')));

  IF v_incomplete_count > 0 THEN
    RAISE EXCEPTION 'Cannot submit: % ordered parameters are incomplete without a result or valid disposition', v_incomplete_count;
  END IF;

  -- Build snapshot of current results and revisions
  SELECT jsonb_object_agg(r.order_test_parameter_id::text, jsonb_build_object(
    'result_id', r.id,
    'revision', r.revision,
    'disposition', r.disposition,
    'numeric_value', r.numeric_value,
    'text_value', r.text_value,
    'flag', r.flag
  ))
  INTO v_snapshot
  FROM results r
  WHERE r.order_id = p_order_id;

  -- Invalidate any previous pending review submissions
  UPDATE review_submissions
  SET status = 'invalidated_by_edit'
  WHERE order_id = p_order_id AND status = 'pending';

  -- Create fresh review submission
  INSERT INTO review_submissions (
    order_id, submitted_by, status, qa_checks_attested, qa_attestation_notes, result_revision_snapshots
  ) VALUES (
    p_order_id, p_submitted_by, 'pending', true, p_qa_attestation_notes, v_snapshot
  ) RETURNING * INTO v_submission;

  RETURN v_submission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Authorize Clinical Report (Strict Clinical Transaction)
CREATE OR REPLACE FUNCTION authorize_clinical_report(
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

  -- 4. Verify Reviewer Profile and Role
  SELECT * INTO v_reviewer FROM staff_profiles WHERE id = p_reviewer_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer is not an active staff member';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM staff_role_assignments
    WHERE staff_id = p_reviewer_id AND role = 'authorized_reviewer'
  ) THEN
    RAISE EXCEPTION 'Staff member does not hold an active Authorized Reviewer role';
  END IF;

  -- 5. Verify Reviewer Professional Scope and Validity
  SELECT * INTO v_scope FROM reviewer_scopes
  WHERE staff_id = p_reviewer_id
    AND is_active = true
    AND CURRENT_DATE BETWEEN valid_from AND valid_to
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer does not have valid, active professional credentials or scopes for today';
  END IF;

  -- Verify department scope covers all ordered tests
  IF NOT ('ALL' = ANY(v_scope.verified_scopes)) THEN
    IF EXISTS (
      SELECT 1 FROM order_tests ot
      WHERE ot.order_id = p_order_id
        AND NOT (ot.department_snapshot = ANY(v_scope.verified_scopes))
    ) THEN
      RAISE EXCEPTION 'Reviewer scope does not cover all test departments in this order';
    END IF;
  END IF;

  -- 6. STRICT INDEPENDENT AUTHORIZATION: Reviewer cannot be author of ANY entered or edited result!
  SELECT EXISTS (
    SELECT 1 FROM results r
    WHERE r.order_id = p_order_id
      AND (r.entered_by = p_reviewer_id OR r.last_edited_by = p_reviewer_id)
  ) INTO v_author_conflict;

  IF v_author_conflict THEN
    RAISE EXCEPTION 'INDEPENDENT AUTHORIZATION VIOLATION: Reviewer cannot authorize results they entered or edited';
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

  -- Generate human-readable report number if v1, or append version
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
      'director', v_lab.clinical_director,
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
      'credentials', v_scope.credentials_title,
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

  -- 10. Insert Report Version record
  INSERT INTO report_versions (
    order_id, version_number, report_number, status, report_snapshot,
    authorized_by, authorized_at
  ) VALUES (
    p_order_id, v_new_version_num, v_report_number, 'authorized', v_full_snapshot,
    p_reviewer_id, now()
  ) RETURNING * INTO v_new_report;

  -- 11. Update submission and record decision
  UPDATE review_submissions SET status = 'authorized' WHERE id = p_submission_id;

  INSERT INTO review_decisions (review_submission_id, reviewer_id, decision, comments)
  VALUES (p_submission_id, p_reviewer_id, 'authorized', p_comments);

  RETURN v_new_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Release Authorized Report Version (Locks in PDF Storage)
CREATE OR REPLACE FUNCTION release_report_version(
  p_report_version_id UUID,
  p_pdf_storage_path TEXT,
  p_released_by UUID
)
RETURNS report_versions AS $$
DECLARE
  v_report report_versions;
BEGIN
  IF p_pdf_storage_path IS NULL OR trim(p_pdf_storage_path) = '' THEN
    RAISE EXCEPTION 'Release requires valid PDF storage path';
  END IF;

  SELECT * INTO v_report FROM report_versions WHERE id = p_report_version_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report version not found: %', p_report_version_id;
  END IF;

  IF v_report.status != 'authorized' THEN
    RAISE EXCEPTION 'Report version is not in authorized status (current: %)', v_report.status;
  END IF;

  UPDATE report_versions
  SET status = 'released',
      pdf_storage_path = p_pdf_storage_path,
      released_at = now(),
      released_by = p_released_by
  WHERE id = p_report_version_id
  RETURNING * INTO v_report;

  -- Mark order as completed
  UPDATE orders SET status = 'completed', updated_at = now() WHERE id = v_report.order_id;

  RETURN v_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function: Record Refund with Financial Invariants
CREATE OR REPLACE FUNCTION record_refund_transaction(
  p_invoice_id UUID,
  p_payment_id UUID,
  p_amount NUMERIC(12, 2),
  p_reason TEXT,
  p_authorized_by UUID,
  p_idempotency_key TEXT
)
RETURNS refunds AS $$
DECLARE
  v_invoice invoices;
  v_refund refunds;
  v_new_refunded NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_new_status TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Mandatory reason required for issuing refund';
  END IF;

  -- Check idempotency
  SELECT * INTO v_refund FROM refunds WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_refund;
  END IF;

  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF (v_invoice.amount_paid - v_invoice.amount_refunded) < p_amount THEN
    RAISE EXCEPTION 'Refund amount (%) exceeds net paid balance (%)', p_amount, (v_invoice.amount_paid - v_invoice.amount_refunded);
  END IF;

  -- Insert refund
  INSERT INTO refunds (
    invoice_id, payment_id, amount, reason, authorized_by, idempotency_key
  ) VALUES (
    p_invoice_id, p_payment_id, p_amount, p_reason, p_authorized_by, p_idempotency_key
  ) RETURNING * INTO v_refund;

  -- Recalculate invoice
  v_new_refunded := v_invoice.amount_refunded + p_amount;
  v_new_balance := v_invoice.total_amount - (v_invoice.amount_paid - v_new_refunded);

  IF (v_invoice.amount_paid - v_new_refunded) <= 0 THEN
    v_new_status := 'refunded';
  ELSIF v_new_balance <= 0 THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'part_paid';
  END IF;

  UPDATE invoices
  SET amount_refunded = v_new_refunded,
      balance_due = v_new_balance,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_invoice_id;

  -- Update order payment status
  UPDATE orders SET payment_status = v_new_status, updated_at = now() WHERE id = v_invoice.order_id;

  RETURN v_refund;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
