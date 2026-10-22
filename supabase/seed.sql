-- Seed: supabase/seed.sql
-- Synthetic, non-production test laboratory data for validation and testing

-- 1. Create Default Lab
INSERT INTO labs (
  id, name, code, address, phone, email, currency_code, timezone,
  clinical_director, lab_license_number, report_header_text, report_footer_text,
  max_staff_discount_percentage, critical_alert_phone
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Apex Diagnostic Pathology Laboratory',
  'APEX-01',
  '742 Evergreen Medical Pavilion, Suite 400, Springfield',
  '+1 (555) 234-5678',
  'ops@apexdiagnostic.test',
  'USD',
  'America/New_York',
  'Dr. Eleanor Vance, MD, FCAP',
  'CLIA-99D2084512',
  'APEX DIAGNOSTIC LABORATORY - ACCREDITED CLINICAL SERVICES',
  'This document contains confidential medical data. Released under authorized review.',
  15.00,
  '+1 (555) 999-STAT'
) ON CONFLICT (code) DO NOTHING;

-- 2. Staff Profiles (Synthetically mapped)
-- Admin
INSERT INTO staff_profiles (id, lab_id, email, full_name, status, mfa_enabled, phone)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'admin@apexdiagnostic.test',
  'Sarah Jenkins (Lab Administrator)',
  'active',
  true,
  '+1 (555) 001-0001'
) ON CONFLICT (email) DO NOTHING;

-- Lab Staff
INSERT INTO staff_profiles (id, lab_id, email, full_name, status, mfa_enabled, phone)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'tech@apexdiagnostic.test',
  'David Chen, MLS(ASCP) (Lab Technologist)',
  'active',
  false,
  '+1 (555) 001-0002'
) ON CONFLICT (email) DO NOTHING;

-- Authorized Reviewer
INSERT INTO staff_profiles (id, lab_id, email, full_name, status, mfa_enabled, phone)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'reviewer@apexdiagnostic.test',
  'Dr. Eleanor Vance, MD (Chief Pathologist)',
  'active',
  true,
  '+1 (555) 001-0003'
) ON CONFLICT (email) DO NOTHING;

-- Disabled Staff member for testing access revocation
INSERT INTO staff_profiles (id, lab_id, email, full_name, status, mfa_enabled, phone)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'former.staff@apexdiagnostic.test',
  'Mark Wood (Former Tech - Disabled)',
  'disabled',
  false,
  '+1 (555) 001-0004'
) ON CONFLICT (email) DO NOTHING;

-- 3. Staff Role Assignments
INSERT INTO staff_role_assignments (staff_id, lab_id, role)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'lab_staff'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'authorized_reviewer')
ON CONFLICT (staff_id, role) DO NOTHING;

-- 4. Reviewer Scopes for Pathologist
INSERT INTO reviewer_scopes (
  id, staff_id, lab_id, credentials_title, verified_scopes, valid_from, valid_to, is_active
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'MD, FCAP, Board Certified Anatomic & Clinical Pathology (State Lic #MED-94021)',
  ARRAY['HEM', 'BIO', 'IMM', 'MICRO', 'GEN', 'ALL'],
  '2024-01-01',
  '2028-12-31',
  true
) ON CONFLICT DO NOTHING;

-- 5. Test Catalogue
-- Test 1: Complete Blood Count (CBC)
INSERT INTO test_definitions (
  id, lab_id, code, name, department, price, turnaround_hours, specimen_type, container_type, fasting_required, is_panel
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'CBC',
  'Complete Blood Count with 3-Part Diff',
  'HEM',
  35.00,
  6,
  'Whole Blood (EDTA)',
  'Lavender Top (K2-EDTA)',
  false,
  true
) ON CONFLICT (lab_id, code) DO NOTHING;

-- CBC Parameters
INSERT INTO test_parameters (id, test_definition_id, code, name, result_type, unit, display_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'WBC', 'White Blood Cells', 'numeric', '10^3/uL', 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'RBC', 'Red Blood Cells', 'numeric', '10^6/uL', 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'HGB', 'Hemoglobin', 'numeric', 'g/dL', 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'HCT', 'Hematocrit', 'numeric', '%', 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'PLT', 'Platelet Count', 'numeric', '10^3/uL', 5)
ON CONFLICT (test_definition_id, code) DO NOTHING;

-- Reference ranges for CBC Hemoglobin
INSERT INTO reference_ranges (test_parameter_id, sex, normal_low, normal_high, critical_low, critical_high, version)
VALUES
  ('b0000000-0000-0000-0000-000000000003', 'male', 13.5, 17.5, 7.0, 20.0, 1),
  ('b0000000-0000-0000-0000-000000000003', 'female', 12.0, 15.5, 7.0, 20.0, 1);

-- Reference ranges for WBC
INSERT INTO reference_ranges (test_parameter_id, sex, normal_low, normal_high, critical_low, critical_high, version)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'all', 4.5, 11.0, 2.0, 30.0, 1);

-- Reference ranges for Platelets
INSERT INTO reference_ranges (test_parameter_id, sex, normal_low, normal_high, critical_low, critical_high, version)
VALUES
  ('b0000000-0000-0000-0000-000000000005', 'all', 150, 450, 50, 1000, 1);

-- Test 2: Fasting Blood Glucose (FBG)
INSERT INTO test_definitions (
  id, lab_id, code, name, department, price, turnaround_hours, specimen_type, container_type, fasting_required, is_panel
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'GLU',
  'Glucose, Fasting Plasma',
  'BIO',
  18.00,
  4,
  'Plasma (Fluoride Oxalate)',
  'Gray Top',
  true,
  false
) ON CONFLICT (lab_id, code) DO NOTHING;

INSERT INTO test_parameters (id, test_definition_id, code, name, result_type, unit, display_order)
VALUES
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'GLUF', 'Fasting Plasma Glucose', 'numeric', 'mg/dL', 1)
ON CONFLICT (test_definition_id, code) DO NOTHING;

INSERT INTO reference_ranges (test_parameter_id, sex, normal_low, normal_high, critical_low, critical_high, version)
VALUES
  ('b0000000-0000-0000-0000-000000000010', 'all', 70.0, 99.0, 45.0, 400.0, 1);

-- Test 3: Lipid Profile
INSERT INTO test_definitions (
  id, lab_id, code, name, department, price, turnaround_hours, specimen_type, container_type, fasting_required, is_panel
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'LIPID',
  'Lipid Panel (Standard)',
  'BIO',
  45.00,
  12,
  'Serum',
  'Gold SST',
  true,
  true
) ON CONFLICT (lab_id, code) DO NOTHING;

INSERT INTO test_parameters (id, test_definition_id, code, name, result_type, unit, display_order)
VALUES
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'CHOL', 'Total Cholesterol', 'numeric', 'mg/dL', 1),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000003', 'TRIG', 'Triglycerides', 'numeric', 'mg/dL', 2),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003', 'HDL', 'HDL Cholesterol', 'numeric', 'mg/dL', 3),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000003', 'LDL', 'Calculated LDL Cholesterol', 'numeric', 'mg/dL', 4)
ON CONFLICT (test_definition_id, code) DO NOTHING;

INSERT INTO reference_ranges (test_parameter_id, sex, normal_low, normal_high, critical_low, critical_high, version)
VALUES
  ('b0000000-0000-0000-0000-000000000020', 'all', 125.0, 200.0, NULL, 350.0, 1),
  ('b0000000-0000-0000-0000-000000000021', 'all', 30.0, 150.0, NULL, 500.0, 1),
  ('b0000000-0000-0000-0000-000000000022', 'male', 40.0, 70.0, NULL, NULL, 1),
  ('b0000000-0000-0000-0000-000000000022', 'female', 50.0, 80.0, NULL, NULL, 1),
  ('b0000000-0000-0000-0000-000000000023', 'all', 50.0, 100.0, NULL, 190.0, 1);

-- 6. Seed Synthetic Patients
INSERT INTO patients (
  id, lab_id, patient_number, full_name, sex, date_of_birth, phone, email, address
) VALUES
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'PAT-2026-0001', 'Arthur Morgan', 'male', '1984-05-12', '+1 (555) 723-9182', 'a.morgan@example.com', '124 Cattleman Road, Valentine'),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'PAT-2026-0002', 'Sadie Adler', 'female', '1991-09-24', '+1 (555) 891-2041', 's.adler@example.com', '88 Rancher Way, Rhodes'),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'PAT-2026-0003', 'Charles Smith', 'male', '1979-11-03', '+1 (555) 412-9843', 'c.smith@example.com', '405 Timberline Trail, Wapiti')
ON CONFLICT (patient_number) DO NOTHING;

-- 7. Initialize Sequences
INSERT INTO system_sequences (id, current_val)
VALUES
  ('PAT-2026', 3),
  ('ORD-2026', 3),
  ('SPEC-2026', 4),
  ('INV-2026', 3),
  ('PAY-2026', 2),
  ('REP-2026', 1)
ON CONFLICT (id) DO NOTHING;
