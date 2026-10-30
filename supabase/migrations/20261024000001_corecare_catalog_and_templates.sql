-- Migration: 20261024000001_corecare_catalog_and_templates.sql
-- Description: CoreCare-aligned schema extensions: lab categories, specimen types,
-- reusable components, component mappings, report templates, and authorized signatories.
-- Non-destructive: preserves existing tables, data, and RLS policies.

-- 1. Laboratory Profile Extensions
ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Choutuppal',
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Telangana',
  ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '508252',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '7:00 AM - 9:00 PM (Mon-Sat), 7:00 AM - 2:00 PM (Sun)',
  ADD COLUMN IF NOT EXISTS accreditation_details TEXT DEFAULT 'Government of Telangana Clinical Establishment Reg #RL-TS-9848228';

-- 2. Laboratory Categories
CREATE TABLE IF NOT EXISTS lab_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, code)
);
CREATE INDEX IF NOT EXISTS idx_lab_categories_lab ON lab_categories(lab_id, display_order);

-- 3. Specimen Types
CREATE TABLE IF NOT EXISTS specimen_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  container TEXT NOT NULL,
  color_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, code)
);
CREATE INDEX IF NOT EXISTS idx_specimen_types_lab ON specimen_types(lab_id);

-- 4. Reusable Laboratory Components
CREATE TABLE IF NOT EXISTS lab_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  unit TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('numeric', 'text', 'positive_negative', 'dropdown', 'calculated')),
  control_type TEXT NOT NULL CHECK (control_type IN ('number_input', 'text_input', 'dropdown', 'radio')),
  method TEXT,
  value_lookup TEXT,
  range_description TEXT,
  gen_range TEXT,
  male_range TEXT,
  female_range TEXT,
  child_range TEXT,
  display_sequence INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, code)
);
CREATE INDEX IF NOT EXISTS idx_lab_components_lab ON lab_components(lab_id, display_sequence);

-- 5. Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'normal',
  description TEXT,
  column_settings JSONB NOT NULL DEFAULT '{"name": true, "result": true, "range": true, "method": true, "unit": true, "remarks": true}',
  header_text TEXT,
  footer_text TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_sequence INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, short_name)
);
CREATE INDEX IF NOT EXISTS idx_report_templates_lab ON report_templates(lab_id, display_sequence);

-- 6. Authorized Signatories
CREATE TABLE IF NOT EXISTS authorized_signatories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  registration_authority TEXT NOT NULL,
  signature_image_url TEXT,
  authorized_categories TEXT[] NOT NULL DEFAULT '{}',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default_normal BOOLEAN NOT NULL DEFAULT false,
  is_default_histo_cyto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signatories_lab ON authorized_signatories(lab_id);

-- 7. Test Definitions Extensions
ALTER TABLE test_definitions
  ADD COLUMN IF NOT EXISTS reporting_name TEXT,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES lab_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_name TEXT,
  ADD COLUMN IF NOT EXISTS service_department TEXT,
  ADD COLUMN IF NOT EXISTS report_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_template_name TEXT,
  ADD COLUMN IF NOT EXISTS run_no_type TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS display_sequence INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS is_sms_applicable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_lis_applicable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_valid_for_reporting BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tax_applicable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_outsourced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_negative_results BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS interpretation TEXT;

-- 8. Test Component Mappings
CREATE TABLE IF NOT EXISTS test_component_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_definition_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES lab_components(id) ON DELETE RESTRICT,
  display_sequence INTEGER NOT NULL DEFAULT 10,
  indent INTEGER NOT NULL DEFAULT 0,
  group_val TEXT,
  sheet BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_definition_id, component_id)
);
CREATE INDEX IF NOT EXISTS idx_test_comp_map ON test_component_mappings(test_definition_id, display_sequence);

-- 9. Row Level Security Policies
ALTER TABLE lab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE specimen_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_component_mappings ENABLE ROW LEVEL SECURITY;

-- Read policies: Any authenticated staff member can view
CREATE POLICY "Staff can view lab categories" ON lab_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can view specimen types" ON specimen_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can view lab components" ON lab_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can view report templates" ON report_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can view authorized signatories" ON authorized_signatories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can view test component mappings" ON test_component_mappings FOR SELECT TO authenticated USING (true);

-- Write policies: Only Admin role can insert, update, or delete configuration
CREATE POLICY "Admin can manage lab categories" ON lab_categories FOR ALL TO authenticated USING (has_role('admin'));
CREATE POLICY "Admin can manage specimen types" ON specimen_types FOR ALL TO authenticated USING (has_role('admin'));
CREATE POLICY "Admin can manage lab components" ON lab_components FOR ALL TO authenticated USING (has_role('admin'));
CREATE POLICY "Admin can manage report templates" ON report_templates FOR ALL TO authenticated USING (has_role('admin'));
CREATE POLICY "Admin can manage authorized signatories" ON authorized_signatories FOR ALL TO authenticated USING (has_role('admin'));
CREATE POLICY "Admin can manage test component mappings" ON test_component_mappings FOR ALL TO authenticated USING (has_role('admin'));
