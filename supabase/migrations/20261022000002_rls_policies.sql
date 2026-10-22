-- Migration: 20261022000002_rls_policies.sql
-- Description: Row Level Security (RLS) policies and helper functions.

-- Helper function: Get current staff profile
CREATE OR REPLACE FUNCTION current_staff_profile()
RETURNS staff_profiles AS $$
  SELECT * FROM staff_profiles
  WHERE id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Check if current user has an active role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_role_assignments sra
    JOIN staff_profiles sp ON sp.id = sra.staff_id
    WHERE sp.id = auth.uid()
      AND sp.status = 'active'
      AND sra.role = required_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Check if current user is active reviewer with valid scope for a test department
CREATE OR REPLACE FUNCTION has_valid_reviewer_scope(dept TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM reviewer_scopes rs
    JOIN staff_profiles sp ON sp.id = rs.staff_id
    WHERE sp.id = auth.uid()
      AND sp.status = 'active'
      AND rs.is_active = true
      AND CURRENT_DATE BETWEEN rs.valid_from AND rs.valid_to
      AND (dept = ANY(rs.verified_scopes) OR 'ALL' = ANY(rs.verified_scopes))
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE specimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE specimen_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE specimen_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Labs Policies
CREATE POLICY "Staff can view their lab" ON labs
  FOR SELECT TO authenticated
  USING (id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can update their lab" ON labs
  FOR UPDATE TO authenticated
  USING (has_role('admin') AND id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

-- 2. Staff Profiles Policies
CREATE POLICY "Active staff can view lab colleagues" ON staff_profiles
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can manage staff profiles" ON staff_profiles
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 3. Staff Role Assignments Policies
CREATE POLICY "Staff can view role assignments" ON staff_role_assignments
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can manage role assignments" ON staff_role_assignments
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 4. Reviewer Scopes Policies
CREATE POLICY "Staff can view reviewer scopes" ON reviewer_scopes
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can manage reviewer scopes" ON reviewer_scopes
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 5. Patients Policies
CREATE POLICY "Active staff can view patients" ON patients
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Active staff can insert and update patients" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Active staff can update patients" ON patients
  FOR UPDATE TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

-- 6. Orders Policies
CREATE POLICY "Active staff can view orders" ON orders
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Staff and admin can insert orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Staff and admin can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

-- 7. Test Definitions & Catalogue
CREATE POLICY "Active staff can view catalogue" ON test_definitions
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can manage catalogue" ON test_definitions
  FOR ALL TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Active staff can view parameters" ON test_parameters
  FOR SELECT TO authenticated
  USING (test_definition_id IN (SELECT id FROM test_definitions WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Admin can manage parameters" ON test_parameters
  FOR ALL TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Active staff can view reference ranges" ON reference_ranges
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage reference ranges" ON reference_ranges
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 8. Order Tests & Parameters
CREATE POLICY "Active staff can view order tests" ON order_tests
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Active staff can insert order tests" ON order_tests
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Active staff can view order test parameters" ON order_test_parameters
  FOR SELECT TO authenticated
  USING (order_test_id IN (SELECT id FROM order_tests WHERE order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'))));

CREATE POLICY "Active staff can insert order test parameters" ON order_test_parameters
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 9. Specimens & Events
CREATE POLICY "Active staff can view specimens" ON specimens
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Staff can manage specimens" ON specimens
  FOR ALL TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Active staff can view specimen events" ON specimen_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Active staff can insert specimen events" ON specimen_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 10. Results & Revisions
CREATE POLICY "Active staff can view results" ON results
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Staff and admin can edit results" ON results
  FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Active staff can view result revisions" ON result_revisions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Active staff can insert result revisions" ON result_revisions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 11. Review Submissions & Decisions
CREATE POLICY "Active staff can view review submissions" ON review_submissions
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Staff can insert review submissions" ON review_submissions
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Reviewers can manage decisions" ON review_decisions
  FOR ALL TO authenticated
  USING (has_role('authorized_reviewer'));

-- 12. Critical Notifications
CREATE POLICY "Active staff can view and insert critical notifications" ON critical_notifications
  FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

-- 13. Report Versions
CREATE POLICY "Active staff can view report versions" ON report_versions
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active')));

CREATE POLICY "Reviewer can insert and update report versions" ON report_versions
  FOR ALL TO authenticated
  USING (has_role('authorized_reviewer'));

-- 14. Billing, Invoices, Payments, Refunds
CREATE POLICY "Staff and admin can view invoices" ON invoices
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Staff and admin can manage invoices" ON invoices
  FOR ALL TO authenticated
  USING (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Staff and admin can view invoice items" ON invoice_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff and admin can view payments" ON payments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff and admin can record payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin only can view and issue refunds" ON refunds
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 15. Expenses
CREATE POLICY "Admin only can view and manage expenses" ON expenses
  FOR ALL TO authenticated
  USING (has_role('admin'));

-- 16. Audit Events: append-only for authenticated staff; SELECT for admin; NO UPDATE OR DELETE!
CREATE POLICY "Staff can record audit events" ON audit_events
  FOR INSERT TO authenticated
  WITH CHECK (lab_id IN (SELECT lab_id FROM staff_profiles WHERE id = auth.uid() AND status = 'active'));

CREATE POLICY "Admin can view audit events" ON audit_events
  FOR SELECT TO authenticated
  USING (has_role('admin'));

-- Deny any user from updating or deleting audit records
CREATE POLICY "No one can update audit events" ON audit_events
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No one can delete audit events" ON audit_events
  FOR DELETE TO authenticated
  USING (false);
