-- Migration: 20261022000001_initial_schema.sql
-- Description: Core tables, constraints, indexes, and sequential ID counters for Diagnostic LIS.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Labs
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  clinical_director TEXT,
  lab_license_number TEXT,
  report_header_text TEXT,
  report_footer_text TEXT,
  max_staff_discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  critical_alert_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Staff Profiles (links to auth.users)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'invited')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_lab ON staff_profiles(lab_id);

-- 3. Staff Role Assignments
CREATE TABLE IF NOT EXISTS staff_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lab_staff', 'authorized_reviewer')),
  assigned_by UUID REFERENCES staff_profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, role)
);
CREATE INDEX IF NOT EXISTS idx_staff_roles_lookup ON staff_role_assignments(staff_id, role);

-- 4. Reviewer Scopes (Credentials, Specialty Scopes, Validity)
CREATE TABLE IF NOT EXISTS reviewer_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  credentials_title TEXT NOT NULL,
  verified_scopes TEXT[] NOT NULL DEFAULT '{}',
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  verified_by UUID REFERENCES staff_profiles(id),
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_scopes_staff ON reviewer_scopes(staff_id);

-- 5. Patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  patient_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  date_of_birth DATE,
  estimated_age_years INTEGER,
  is_age_estimated BOOLEAN NOT NULL DEFAULT false,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  clinical_notes TEXT,
  created_by UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_lab_search ON patients(lab_id, full_name, phone);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  ordering_physician TEXT,
  clinical_indication TEXT,
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'part_paid', 'paid', 'refunded')),
  created_by UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_lab_status ON orders(lab_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 7. Test Definitions (Catalogue)
CREATE TABLE IF NOT EXISTS test_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  turnaround_hours INTEGER NOT NULL DEFAULT 24,
  specimen_type TEXT NOT NULL,
  container_type TEXT NOT NULL,
  fasting_required BOOLEAN NOT NULL DEFAULT false,
  instructions TEXT,
  is_panel BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, code)
);
CREATE INDEX IF NOT EXISTS idx_test_defs_lab_dept ON test_definitions(lab_id, department);

-- 8. Test Parameters
CREATE TABLE IF NOT EXISTS test_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_definition_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('numeric', 'qualitative', 'text')),
  unit TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (test_definition_id, code)
);

-- 9. Panel Items
CREATE TABLE IF NOT EXISTS panel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_panel_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE CASCADE,
  child_test_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE RESTRICT,
  display_order INTEGER NOT NULL DEFAULT 1,
  UNIQUE (parent_panel_id, child_test_id)
);

-- 10. Reference Ranges
CREATE TABLE IF NOT EXISTS reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_parameter_id UUID NOT NULL REFERENCES test_parameters(id) ON DELETE CASCADE,
  sex TEXT CHECK (sex IN ('male', 'female', 'all')),
  age_min_days INTEGER NOT NULL DEFAULT 0,
  age_max_days INTEGER NOT NULL DEFAULT 43800,
  normal_low NUMERIC(14, 4),
  normal_high NUMERIC(14, 4),
  critical_low NUMERIC(14, 4),
  critical_high NUMERIC(14, 4),
  qualitative_expected TEXT,
  clinical_interpretation TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  approved_by UUID REFERENCES staff_profiles(id),
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_ranges_param ON reference_ranges(test_parameter_id);

-- 11. Order Tests (Snapshots)
CREATE TABLE IF NOT EXISTS order_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  test_definition_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE RESTRICT,
  test_name_snapshot TEXT NOT NULL,
  test_code_snapshot TEXT NOT NULL,
  test_price_snapshot NUMERIC(12, 2) NOT NULL,
  department_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_tests_order ON order_tests(order_id);

-- 12. Order Test Parameters (Snapshots of Ranges & Units)
CREATE TABLE IF NOT EXISTS order_test_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_test_id UUID NOT NULL REFERENCES order_tests(id) ON DELETE CASCADE,
  test_parameter_id UUID NOT NULL REFERENCES test_parameters(id) ON DELETE RESTRICT,
  parameter_name_snapshot TEXT NOT NULL,
  parameter_code_snapshot TEXT NOT NULL,
  result_type_snapshot TEXT NOT NULL,
  unit_snapshot TEXT,
  reference_range_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_otp_order_test ON order_test_parameters(order_test_id);

-- 13. Specimens
CREATE TABLE IF NOT EXISTS specimens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  specimen_number TEXT NOT NULL UNIQUE,
  specimen_type TEXT NOT NULL,
  container_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_collection' CHECK (status IN ('awaiting_collection', 'collected', 'received', 'completed', 'rejected', 'cancelled')),
  collected_at TIMESTAMPTZ,
  collected_by UUID REFERENCES staff_profiles(id),
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES staff_profiles(id),
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  parent_specimen_id UUID REFERENCES specimens(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_specimens_order ON specimens(order_id);
CREATE INDEX IF NOT EXISTS idx_specimens_status ON specimens(lab_id, status);

-- 14. Specimen Tests Junction
CREATE TABLE IF NOT EXISTS specimen_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specimen_id UUID NOT NULL REFERENCES specimens(id) ON DELETE CASCADE,
  order_test_id UUID NOT NULL REFERENCES order_tests(id) ON DELETE CASCADE,
  UNIQUE (specimen_id, order_test_id)
);

-- 15. Specimen Lifecycle Events
CREATE TABLE IF NOT EXISTS specimen_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specimen_id UUID NOT NULL REFERENCES specimens(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID REFERENCES staff_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_specimen_events_specimen ON specimen_events(specimen_id);

-- 16. Results
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_test_parameter_id UUID NOT NULL REFERENCES order_test_parameters(id) ON DELETE CASCADE UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  disposition TEXT NOT NULL DEFAULT 'performed' CHECK (disposition IN ('performed', 'not_performed', 'cancelled')),
  non_performed_reason TEXT,
  numeric_value NUMERIC(14, 4),
  text_value TEXT,
  flag TEXT NOT NULL DEFAULT 'normal' CHECK (flag IN ('normal', 'abnormal', 'critical', 'inconclusive')),
  entered_by UUID REFERENCES staff_profiles(id),
  entered_at TIMESTAMPTZ,
  last_edited_by UUID REFERENCES staff_profiles(id),
  last_edited_at TIMESTAMPTZ,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_results_order ON results(order_id);

-- 17. Result Revisions
CREATE TABLE IF NOT EXISTS result_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  numeric_value NUMERIC(14, 4),
  text_value TEXT,
  flag TEXT NOT NULL,
  disposition TEXT NOT NULL,
  edited_by UUID REFERENCES staff_profiles(id),
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason_for_edit TEXT
);
CREATE INDEX IF NOT EXISTS idx_result_revisions_result ON result_revisions(result_id);

-- 18. Review Submissions
CREATE TABLE IF NOT EXISTS review_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES staff_profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'returned', 'authorized', 'invalidated_by_edit', 'superseded')),
  qa_checks_attested BOOLEAN NOT NULL DEFAULT false,
  qa_attestation_notes TEXT NOT NULL,
  result_revision_snapshots JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_review_submissions_order ON review_submissions(order_id, status);

-- 19. Review Decisions
CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_submission_id UUID NOT NULL REFERENCES review_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES staff_profiles(id),
  decision TEXT NOT NULL CHECK (decision IN ('returned_for_correction', 'authorized')),
  comments TEXT NOT NULL,
  decision_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Critical Notifications
CREATE TABLE IF NOT EXISTS critical_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_test_parameter_id UUID NOT NULL REFERENCES order_test_parameters(id),
  critical_value_summary TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role_phone TEXT NOT NULL,
  notification_method TEXT NOT NULL CHECK (notification_method IN ('phone_call', 'in_person', 'secure_messaging')),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  read_back_confirmed BOOLEAN NOT NULL DEFAULT false,
  escalation_status TEXT NOT NULL DEFAULT 'resolved' CHECK (escalation_status IN ('pending_acknowledgement', 'resolved', 'escalated_to_supervisor')),
  notes TEXT,
  communicated_by UUID NOT NULL REFERENCES staff_profiles(id)
);
CREATE INDEX IF NOT EXISTS idx_crit_notif_order ON critical_notifications(order_id);

-- 21. Report Versions
CREATE TABLE IF NOT EXISTS report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  report_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'authorized' CHECK (status IN ('authorized', 'released', 'superseded')),
  report_snapshot JSONB NOT NULL,
  authorized_by UUID NOT NULL REFERENCES staff_profiles(id),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_storage_path TEXT,
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES staff_profiles(id),
  amendment_reason TEXT,
  prior_report_version_id UUID REFERENCES report_versions(id),
  correction_communication_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_report_versions_order ON report_versions(order_id);

-- 22. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_reason TEXT,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount_refunded NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'part_paid', 'paid', 'refunded')),
  created_by UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_lab_status ON invoices(lab_id, status);

-- 23. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  order_test_id UUID NOT NULL REFERENCES order_tests(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL
);

-- 24. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check')),
  reference_note TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  recorded_by UUID NOT NULL REFERENCES staff_profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 25. Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES staff_profiles(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON refunds(invoice_id);

-- 26. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('reagents', 'consumables', 'utilities', 'maintenance', 'other')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  receipt_reference TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID NOT NULL REFERENCES staff_profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_lab_date ON expenses(lab_id, expense_date);

-- 27. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  actor_id UUID REFERENCES staff_profiles(id),
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_lab_time ON audit_events(lab_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
