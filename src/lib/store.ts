import {
  LabProfile,
  StaffProfile,
  Patient,
  TestDefinition,
  Order,
  OrderPriority,
  Specimen,
  Result,
  ReviewSubmission,
  ReportVersion,
  Invoice,
  Payment,
  Refund,
  Expense,
  AuditEvent,
  UserRole,
  CriticalNotification,
  ReportSnapshot,
  LabCategory,
  SpecimenType,
  LabComponent,
  TestComponentMapping,
  ReportTemplate,
  AuthorizedSignatory,
} from './types';

// Initial synthetic lab profile
const initialLab: LabProfile = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Rishi Laboratory',
  code: 'RISHI-01',
  address: 'Choutuppal',
  phone: '9848228971',
  email: 'padma@gmail.com',
  currency_code: 'INR',
  timezone: 'Asia/Kolkata',
  clinical_director: 'Vakiti Padma Reddy',
  lab_license_number: 'RL-TS-9848228',
  report_header_text: 'Rishi Laboratory',
  report_footer_text: 'Rishi Laboratory',
  max_staff_discount_percentage: 15.0,
  critical_alert_phone: '9848228971',
};

// Initial Categories
const initialCategories: LabCategory[] = [
  { id: 'cat-001', code: 'HEM', name: 'Hematology', department: 'Hematology', display_order: 1, is_active: true },
  { id: 'cat-002', code: 'BIO', name: 'Biochemistry', department: 'Biochemistry', display_order: 2, is_active: true },
  { id: 'cat-003', code: 'SER', name: 'Serology', department: 'Serology', display_order: 3, is_active: true },
  { id: 'cat-004', code: 'PATH', name: 'Clinical Pathology', department: 'Pathology', display_order: 4, is_active: true },
  { id: 'cat-005', code: 'MICRO', name: 'Microbiology', department: 'Microbiology', display_order: 5, is_active: true },
  { id: 'cat-006', code: 'IMM', name: 'Immunology', department: 'Immunology', display_order: 6, is_active: true },
];

// Initial Specimen Types
const initialSpecimenTypes: SpecimenType[] = [
  { id: 'spec-001', code: 'EDTA', name: 'EDTA Blood', container: 'Lavender Top (K2-EDTA)', color_code: '#8B5CF6', is_active: true },
  { id: 'spec-002', code: 'SERUM', name: 'Serum', container: 'Gold SST (Gel Separator)', color_code: '#F59E0B', is_active: true },
  { id: 'spec-003', code: 'PLASMA', name: 'Plasma (Fluoride)', container: 'Gray Top (Fluoride Oxalate)', color_code: '#94A3B8', is_active: true },
  { id: 'spec-004', code: 'URINE', name: 'Urine', container: 'Sterile Urine Container', color_code: '#10B981', is_active: true },
  { id: 'spec-005', code: 'STOOL', name: 'Stool', container: 'Wide Mouth Stool Container', color_code: '#D97706', is_active: true },
  { id: 'spec-006', code: 'SWAB', name: 'Swab', container: 'Sterile Transport Swab', color_code: '#06B6D4', is_active: true },
];

// Initial Reusable Test Components
const initialComponents: LabComponent[] = [
  { id: 'comp-001', code: 'HGB', name: 'Hemoglobin', display_name: 'Hemoglobin (Hb)', unit: 'g/dL', value_type: 'numeric', control_type: 'number_input', method: 'Cyanmethemoglobin / Photometry', gen_range: '13.0 - 17.0', male_range: '13.5 - 17.5', female_range: '12.0 - 15.5', child_range: '11.0 - 14.0', display_sequence: 10, is_active: true },
  { id: 'comp-002', code: 'WBC', name: 'White Blood Cell Count', display_name: 'Total Leucocyte Count (TLC)', unit: '10^3/uL', value_type: 'numeric', control_type: 'number_input', method: 'Electrical Impedance', gen_range: '4.5 - 11.0', male_range: '4.5 - 11.0', female_range: '4.5 - 11.0', child_range: '5.0 - 15.0', display_sequence: 20, is_active: true },
  { id: 'comp-003', code: 'RBC', name: 'Red Blood Cell Count', display_name: 'Total RBC Count', unit: '10^6/uL', value_type: 'numeric', control_type: 'number_input', method: 'Electrical Impedance', gen_range: '4.5 - 5.9', male_range: '4.5 - 5.9', female_range: '4.0 - 5.2', child_range: '4.0 - 5.2', display_sequence: 30, is_active: true },
  { id: 'comp-004', code: 'PLT', name: 'Platelet Count', display_name: 'Platelet Count', unit: '10^3/uL', value_type: 'numeric', control_type: 'number_input', method: 'Electrical Impedance', gen_range: '150 - 450', male_range: '150 - 450', female_range: '150 - 450', child_range: '150 - 450', display_sequence: 40, is_active: true },
  { id: 'comp-005', code: 'HCT', name: 'Hematocrit', display_name: 'PCV / Hematocrit', unit: '%', value_type: 'numeric', control_type: 'number_input', method: 'Calculated / Centrifugation', gen_range: '40 - 50', male_range: '41 - 50', female_range: '36 - 46', child_range: '35 - 45', display_sequence: 50, is_active: true },
  { id: 'comp-006', code: 'GLUF', name: 'Fasting Blood Sugar', display_name: 'Fasting Plasma Glucose (FBS)', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'GOD-POD', gen_range: '70 - 99', male_range: '70 - 99', female_range: '70 - 99', child_range: '70 - 100', display_sequence: 60, is_active: true },
  { id: 'comp-007', code: 'PPBS', name: 'Post Prandial Blood Sugar', display_name: '2 hr PP Blood Sugar', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'GOD-POD', gen_range: '70 - 140', male_range: '70 - 140', female_range: '70 - 140', child_range: '70 - 140', display_sequence: 70, is_active: true },
  { id: 'comp-008', code: 'CHOL', name: 'Total Cholesterol', display_name: 'Total Cholesterol', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'CHOD-PAP', gen_range: '125 - 200', male_range: '125 - 200', female_range: '125 - 200', child_range: '120 - 170', display_sequence: 80, is_active: true },
  { id: 'comp-009', code: 'TRIG', name: 'Triglycerides', display_name: 'Serum Triglycerides', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'GPO-PAP', gen_range: '< 150', male_range: '< 150', female_range: '< 150', child_range: '< 100', display_sequence: 90, is_active: true },
  { id: 'comp-010', code: 'HDL', name: 'HDL Cholesterol', display_name: 'HDL (Good Cholesterol)', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'Direct Enzymatic', gen_range: '40 - 60', male_range: '40 - 50', female_range: '50 - 60', child_range: '35 - 55', display_sequence: 100, is_active: true },
  { id: 'comp-011', code: 'BIL-T', name: 'Total Bilirubin', display_name: 'Bilirubin Total', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'Diazo / Jendrassik-Grof', gen_range: '0.2 - 1.2', male_range: '0.2 - 1.2', female_range: '0.2 - 1.2', child_range: '0.2 - 1.0', display_sequence: 110, is_active: true },
  { id: 'comp-012', code: 'BIL-D', name: 'Direct Bilirubin', display_name: 'Bilirubin Direct', unit: 'mg/dL', value_type: 'numeric', control_type: 'number_input', method: 'Diazo', gen_range: '0.0 - 0.4', male_range: '0.0 - 0.4', female_range: '0.0 - 0.4', child_range: '0.0 - 0.3', display_sequence: 120, is_active: true },
  { id: 'comp-013', code: 'ALP', name: 'Alkaline Phosphatase', display_name: 'ALKALINE PHOSPHATASE (ALP)', unit: 'IU/L', value_type: 'numeric', control_type: 'number_input', method: 'p-NPP Kinetic', gen_range: '44 - 147', male_range: '44 - 147', female_range: '44 - 147', child_range: '100 - 350', display_sequence: 130, is_active: true },
  { id: 'comp-014', code: 'ABO', name: 'Blood Group & Rh', display_name: 'Blood Grouping & Rh Typing', unit: '', value_type: 'dropdown', control_type: 'dropdown', method: 'Slide / Tube Agglutination', value_lookup: 'A Positive, B Positive, O Positive, AB Positive, A Negative, B Negative, O Negative, AB Negative', range_description: 'Reported phenotype', display_sequence: 140, is_active: true },
  { id: 'comp-015', code: 'DENGUE-NS1', name: 'Dengue NS1 Antigen', display_name: 'Dengue NS1 Rapid Antigen', unit: '', value_type: 'positive_negative', control_type: 'radio', method: 'Immunochromatography', value_lookup: 'NEGATIVE, POSITIVE', gen_range: 'NEGATIVE', range_description: 'Negative for acute dengue infection', display_sequence: 150, is_active: true },
  { id: 'comp-016', code: 'WIDAL', name: 'Widal Agglutination', display_name: 'Widal Slide / Tube Agglutination', unit: '', value_type: 'text', control_type: 'text_input', method: 'Agglutination', gen_range: 'Titre < 1:80', range_description: 'O: <1:80, H: <1:80 considered non-significant', display_sequence: 160, is_active: true },
];

// Initial Report Templates
const initialReportTemplates: ReportTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Default Laboratory Template',
    short_name: 'Default',
    template_type: 'normal',
    description: 'Standard diagnostic multi-column report with reference intervals',
    column_settings: { name: true, result: true, range: true, method: true, unit: true, remarks: true },
    header_text: 'Rishi Laboratory — Accurate & Timely Diagnostic Services',
    footer_text: 'Medical Interpretation: Clinical correlation advised. Not for medico-legal use.',
    is_default: true,
    display_sequence: 1,
    is_active: true,
  },
  {
    id: 'tmpl-002',
    name: 'Hematology Report Template',
    short_name: 'Hematology',
    template_type: 'normal',
    description: 'Detailed hematology template with instrument methodology & differential counts',
    column_settings: { name: true, result: true, range: true, method: true, unit: true, remarks: true },
    header_text: 'Rishi Laboratory — Department of Hematology & Hemopathology',
    footer_text: 'CBC performed on 5-Part Automated Hematology Analyzer. Abnormal flags visually confirmed.',
    is_default: false,
    display_sequence: 2,
    is_active: true,
  },
  {
    id: 'tmpl-003',
    name: 'Biochemistry Report Template',
    short_name: 'Biochemistry',
    template_type: 'normal',
    description: 'Clinical biochemistry & metabolic panels with IFCC standardized reference intervals',
    column_settings: { name: true, result: true, range: true, method: true, unit: true, remarks: true },
    header_text: 'Rishi Laboratory — Clinical Biochemistry & Immunoassay',
    footer_text: 'Enzymatic and photometric assays performed with fully automated calibrators.',
    is_default: false,
    display_sequence: 3,
    is_active: true,
  },
  {
    id: 'tmpl-004',
    name: 'Complete Blood Count (CBC) Template',
    short_name: 'CBC-TEMPLATE',
    template_type: 'normal',
    description: 'Full automated CBC with red cell indices and peripheral smear review',
    column_settings: { name: true, result: true, range: true, method: true, unit: true, remarks: true },
    header_text: 'Rishi Laboratory — Complete Hemogram',
    footer_text: 'Kindly correlate with clinical findings and history.',
    is_default: false,
    display_sequence: 4,
    is_active: true,
  },
  {
    id: 'tmpl-005',
    name: 'Clinical Pathology & Urine Examination',
    short_name: 'Urine Examination',
    template_type: 'normal',
    description: 'Complete physical, chemical, and microscopic urine analysis report',
    column_settings: { name: true, result: true, range: true, method: false, unit: true, remarks: true },
    header_text: 'Rishi Laboratory — Clinical Pathology',
    footer_text: 'Microscopic examination performed on centrifuged urine deposit at 400x.',
    is_default: false,
    display_sequence: 5,
    is_active: true,
  },
];

// Initial Authorized Signatories
const initialSignatories: AuthorizedSignatory[] = [
  {
    id: 'sig-001',
    full_name: 'Dr. Rishika',
    designation: 'Consultant Pathologist',
    qualifications: 'MBBS, MD (Pathology)',
    registration_number: 'TSMC-74892',
    registration_authority: 'Telangana State Medical Council (TSMC)',
    signature_image_url: '/images/signature-dr-rishika.png',
    authorized_categories: ['Hematology', 'Biochemistry', 'Serology', 'Clinical Pathology', 'Microbiology', 'Immunology'],
    effective_date: '2024-01-01',
    is_active: true,
    is_default_normal: true,
    is_default_histo_cyto: true,
  },
  {
    id: 'sig-002',
    full_name: 'Vakiti Padma Reddy',
    designation: 'Clinical Laboratory Director',
    qualifications: 'M.Sc (Medical Biochemistry)',
    registration_number: 'RL-TS-9848228',
    registration_authority: 'Directorate of Public Health, Telangana',
    signature_image_url: '/images/signature-director-padma.png',
    authorized_categories: ['Biochemistry', 'Hematology', 'Clinical Pathology'],
    effective_date: '2023-01-01',
    is_active: true,
    is_default_normal: false,
    is_default_histo_cyto: false,
  },
];

// Staff profiles
const initialStaff: StaffProfile[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    lab_id: initialLab.id,
    email: 'padma@gmail.com',
    full_name: 'Padma (Administrator)',
    status: 'active',
    mfa_enabled: true,
    phone: '9848228971',
    roles: ['admin'],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    lab_id: initialLab.id,
    email: 'rishi@gmail.com',
    full_name: 'Rishi (Lab Technologist)',
    status: 'active',
    mfa_enabled: false,
    phone: '9848228971',
    roles: ['lab_staff'],
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    lab_id: initialLab.id,
    email: 'rishika@gmail.com',
    full_name: 'Dr. Rishika (Consultant Pathologist)',
    status: 'active',
    mfa_enabled: true,
    phone: '9848228971',
    roles: ['authorized_reviewer'],
    reviewer_scope: {
      id: '66666666-6666-6666-6666-666666666666',
      staff_id: '44444444-4444-4444-4444-444444444444',
      credentials_title: 'MBBS, MD (Pathology), Pathologist',
      medical_license_number: 'TSMC-74892',
      verified_scopes: ['HEM', 'BIO', 'IMM', 'MICRO', 'GEN', 'ALL'],
      valid_from: '2024-01-01',
      valid_to: '2029-12-31',
      is_active: true,
    },
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    lab_id: initialLab.id,
    email: 'former.staff@rishilab.com',
    full_name: 'Mark Wood (Disabled Staff)',
    status: 'disabled',
    mfa_enabled: false,
    phone: '+1 (555) 001-0004',
    roles: ['lab_staff'],
  },
];

// Catalogue tests & parameters
const initialTests: TestDefinition[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    lab_id: initialLab.id,
    code: 'CBC',
    name: 'Complete Blood Count with Differential',
    department: 'HEM',
    price: 35.0,
    turnaround_hours: 6,
    specimen_type: 'Whole Blood (EDTA)',
    container_type: 'Lavender Top (K2-EDTA)',
    fasting_required: false,
    is_panel: true,
    is_active: true,
    parameters: [
      { id: 'b0000000-0000-0000-0000-000000000001', test_definition_id: 'a0000000-0000-0000-0000-000000000001', code: 'WBC', name: 'White Blood Cell Count', result_type: 'numeric', unit: '10^3/uL', display_order: 1, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000002', test_definition_id: 'a0000000-0000-0000-0000-000000000001', code: 'RBC', name: 'Red Blood Cell Count', result_type: 'numeric', unit: '10^6/uL', display_order: 2, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000003', test_definition_id: 'a0000000-0000-0000-0000-000000000001', code: 'HGB', name: 'Hemoglobin', result_type: 'numeric', unit: 'g/dL', display_order: 3, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000004', test_definition_id: 'a0000000-0000-0000-0000-000000000001', code: 'HCT', name: 'Hematocrit', result_type: 'numeric', unit: '%', display_order: 4, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000005', test_definition_id: 'a0000000-0000-0000-0000-000000000001', code: 'PLT', name: 'Platelet Count', result_type: 'numeric', unit: '10^3/uL', display_order: 5, is_active: true },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    lab_id: initialLab.id,
    code: 'GLU',
    name: 'Glucose, Fasting Plasma',
    department: 'BIO',
    price: 18.0,
    turnaround_hours: 4,
    specimen_type: 'Plasma (Fluoride Oxalate)',
    container_type: 'Gray Top',
    fasting_required: true,
    is_panel: false,
    is_active: true,
    parameters: [
      { id: 'b0000000-0000-0000-0000-000000000010', test_definition_id: 'a0000000-0000-0000-0000-000000000002', code: 'GLUF', name: 'Fasting Plasma Glucose', result_type: 'numeric', unit: 'mg/dL', display_order: 1, is_active: true },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    lab_id: initialLab.id,
    code: 'LIPID',
    name: 'Lipid Panel (Standard)',
    department: 'BIO',
    price: 45.0,
    turnaround_hours: 12,
    specimen_type: 'Serum',
    container_type: 'Gold SST',
    fasting_required: true,
    is_panel: true,
    is_active: true,
    parameters: [
      { id: 'b0000000-0000-0000-0000-000000000020', test_definition_id: 'a0000000-0000-0000-0000-000000000003', code: 'CHOL', name: 'Total Cholesterol', result_type: 'numeric', unit: 'mg/dL', display_order: 1, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000021', test_definition_id: 'a0000000-0000-0000-0000-000000000003', code: 'TRIG', name: 'Triglycerides', result_type: 'numeric', unit: 'mg/dL', display_order: 2, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000022', test_definition_id: 'a0000000-0000-0000-0000-000000000003', code: 'HDL', name: 'HDL Cholesterol', result_type: 'numeric', unit: 'mg/dL', display_order: 3, is_active: true },
      { id: 'b0000000-0000-0000-0000-000000000023', test_definition_id: 'a0000000-0000-0000-0000-000000000003', code: 'LDL', name: 'Calculated LDL Cholesterol', result_type: 'numeric', unit: 'mg/dL', display_order: 4, is_active: true },
    ],
  },
];

// Initial Patients
const initialPatients: Patient[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    lab_id: initialLab.id,
    patient_number: 'PAT-2026-0001',
    full_name: 'Arthur Morgan',
    sex: 'male',
    date_of_birth: '1984-05-12',
    is_age_estimated: false,
    phone: '+1 (555) 723-9182',
    email: 'a.morgan@example.com',
    address: '124 Cattleman Road, Valentine',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    lab_id: initialLab.id,
    patient_number: 'PAT-2026-0002',
    full_name: 'Sadie Adler',
    sex: 'female',
    date_of_birth: '1991-09-24',
    is_age_estimated: false,
    phone: '+1 (555) 891-2041',
    email: 's.adler@example.com',
    address: '88 Rancher Way, Rhodes',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    lab_id: initialLab.id,
    patient_number: 'PAT-2026-0003',
    full_name: 'Charles Smith',
    sex: 'male',
    date_of_birth: '1979-11-03',
    is_age_estimated: false,
    phone: '+1 (555) 412-9843',
    email: 'c.smith@example.com',
    address: '405 Timberline Trail, Wapiti',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// Initial Expenses
const initialExpenses: Expense[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    lab_id: initialLab.id,
    category: 'reagents',
    amount: 320.0,
    vendor: 'Bio-Chem Reagent Supplies LLC',
    description: 'CBC Calibrator & Hematology Diluent 20L',
    receipt_reference: 'REC-BC-9041',
    expense_date: new Date().toISOString().split('T')[0],
    recorded_by: initialStaff[0].id,
    recorded_at: new Date().toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    lab_id: initialLab.id,
    category: 'consumables',
    amount: 145.5,
    vendor: 'MedSupply Direct',
    description: 'Vacutainer tubes (Lavender, SST) & safety needles',
    receipt_reference: 'MS-8812',
    expense_date: new Date().toISOString().split('T')[0],
    recorded_by: initialStaff[0].id,
    recorded_at: new Date().toISOString(),
  },
];

class DiagnosticLabStore {
  lab: LabProfile = { ...initialLab };
  staff: StaffProfile[] = [...initialStaff];
  activeStaffId: string = initialStaff[1].id; // Default: David Chen (Lab Staff)
  patients: Patient[] = [...initialPatients];
  tests: TestDefinition[] = [...initialTests];
  categories: LabCategory[] = [...initialCategories];
  specimenTypes: SpecimenType[] = [...initialSpecimenTypes];
  components: LabComponent[] = [...initialComponents];
  reportTemplates: ReportTemplate[] = [...initialReportTemplates];
  signatories: AuthorizedSignatory[] = [...initialSignatories];
  orders: Order[] = [];
  invoices: Invoice[] = [];
  expenses: Expense[] = [...initialExpenses];
  auditEvents: AuditEvent[] = [];

  // Sequential counters
  private seqPatient = 3;
  private seqOrder = 0;
  private seqSpecimen = 0;
  private seqInvoice = 0;
  private seqPayment = 0;
  private seqReport = 0;

  constructor() {
    this.seedInitialOrders();
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rishi_active_staff_id');
        if (saved && this.staff.some((s) => s.id === saved)) {
          this.activeStaffId = saved;
        }
      } catch {}
    }
  }

  // Active User / Role context
  getActiveStaff(): StaffProfile {
    const s = this.staff.find((st) => st.id === this.activeStaffId);
    return s || this.staff[0];
  }

  setActiveStaffId(id: string) {
    const target = this.staff.find((st) => st.id === id);
    if (!target) throw new Error('Staff not found');
    if (target.status === 'disabled') throw new Error('Disabled staff cannot be activated');
    this.activeStaffId = id;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rishi_active_staff_id', id);
      } catch {}
    }
    this.recordAudit('staff_session_switched', 'staff_profiles', id, { name: target.full_name });
  }

  hasRole(role: UserRole): boolean {
    const staff = this.getActiveStaff();
    return staff.status === 'active' && staff.roles.includes(role);
  }

  // Audit recording
  recordAudit(
    action: string,
    entity_type: string,
    entity_id: string,
    metadata: Record<string, unknown> = {},
    customId?: string,
    customTimestamp?: string
  ) {
    const staff = this.getActiveStaff();
    this.auditEvents.unshift({
      id: customId || crypto.randomUUID(),
      lab_id: this.lab.id,
      actor_id: staff.id,
      actor_email: staff.email,
      actor_role: staff.roles.join(','),
      action,
      entity_type,
      entity_id,
      metadata,
      timestamp: customTimestamp || new Date().toISOString(),
    });
  }

  // Category management
  addCategory(data: Omit<LabCategory, 'id'>) {
    const newCat: LabCategory = {
      id: crypto.randomUUID(),
      ...data,
    };
    this.categories.push(newCat);
    this.recordAudit('category_created', 'lab_categories', newCat.id, { name: newCat.name });
    return newCat;
  }

  updateCategory(id: string, updates: Partial<LabCategory>) {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');
    Object.assign(cat, updates);
    this.recordAudit('category_updated', 'lab_categories', id, { name: cat.name });
    return cat;
  }

  // Specimen management
  addSpecimenType(data: Omit<SpecimenType, 'id'>) {
    const newSpec: SpecimenType = {
      id: crypto.randomUUID(),
      ...data,
    };
    this.specimenTypes.push(newSpec);
    this.recordAudit('specimen_type_created', 'specimen_types', newSpec.id, { name: newSpec.name });
    return newSpec;
  }

  updateSpecimenType(id: string, updates: Partial<SpecimenType>) {
    const spec = this.specimenTypes.find((s) => s.id === id);
    if (!spec) throw new Error('Specimen type not found');
    Object.assign(spec, updates);
    this.recordAudit('specimen_type_updated', 'specimen_types', id, { name: spec.name });
    return spec;
  }

  // Component management
  addComponent(data: Omit<LabComponent, 'id'>) {
    const newComp: LabComponent = {
      id: crypto.randomUUID(),
      ...data,
    };
    this.components.push(newComp);
    this.recordAudit('component_created', 'lab_components', newComp.id, { name: newComp.name });
    return newComp;
  }

  updateComponent(id: string, updates: Partial<LabComponent>) {
    const comp = this.components.find((c) => c.id === id);
    if (!comp) throw new Error('Component not found');
    Object.assign(comp, updates);
    this.recordAudit('component_updated', 'lab_components', id, { name: comp.name });
    return comp;
  }

  toggleComponentStatus(id: string) {
    const comp = this.components.find((c) => c.id === id);
    if (!comp) throw new Error('Component not found');
    comp.is_active = !comp.is_active;
    this.recordAudit('component_status_toggled', 'lab_components', id, { is_active: comp.is_active });
    return comp;
  }

  // Report Template management
  addReportTemplate(data: Omit<ReportTemplate, 'id'>) {
    const newTmpl: ReportTemplate = {
      id: crypto.randomUUID(),
      ...data,
    };
    if (newTmpl.is_default) {
      this.reportTemplates.forEach((t) => (t.is_default = false));
    }
    this.reportTemplates.push(newTmpl);
    this.recordAudit('report_template_created', 'report_templates', newTmpl.id, { name: newTmpl.name });
    return newTmpl;
  }

  updateReportTemplate(id: string, updates: Partial<ReportTemplate>) {
    const tmpl = this.reportTemplates.find((t) => t.id === id);
    if (!tmpl) throw new Error('Report template not found');
    if (updates.is_default) {
      this.reportTemplates.forEach((t) => (t.is_default = false));
    }
    Object.assign(tmpl, updates);
    this.recordAudit('report_template_updated', 'report_templates', id, { name: tmpl.name });
    return tmpl;
  }

  toggleReportTemplateStatus(id: string) {
    const tmpl = this.reportTemplates.find((t) => t.id === id);
    if (!tmpl) throw new Error('Report template not found');
    tmpl.is_active = !tmpl.is_active;
    this.recordAudit('report_template_status_toggled', 'report_templates', id, { is_active: tmpl.is_active });
    return tmpl;
  }

  // Signatory management
  addSignatory(data: Omit<AuthorizedSignatory, 'id'>) {
    const newSig: AuthorizedSignatory = {
      id: crypto.randomUUID(),
      ...data,
    };
    this.signatories.push(newSig);
    this.recordAudit('signatory_created', 'authorized_signatories', newSig.id, { name: newSig.full_name });
    return newSig;
  }

  updateSignatory(id: string, updates: Partial<AuthorizedSignatory>) {
    const sig = this.signatories.find((s) => s.id === id);
    if (!sig) throw new Error('Signatory not found');
    Object.assign(sig, updates);
    this.recordAudit('signatory_updated', 'authorized_signatories', id, { name: sig.full_name });
    return sig;
  }

  toggleSignatoryStatus(id: string) {
    const sig = this.signatories.find((s) => s.id === id);
    if (!sig) throw new Error('Signatory not found');
    sig.is_active = !sig.is_active;
    this.recordAudit('signatory_status_toggled', 'authorized_signatories', id, { is_active: sig.is_active });
    return sig;
  }

  updateDefaultSignatories(normalIds: string[], histoCytoIds: string[]) {
    this.signatories.forEach((s) => {
      s.is_default_normal = normalIds.includes(s.id);
      s.is_default_histo_cyto = histoCytoIds.includes(s.id);
    });
    this.recordAudit('default_signatories_updated', 'authorized_signatories', 'default_selection', {
      normal: normalIds,
      histoCyto: histoCytoIds,
    });
  }

  // Test Catalogue management
  addTest(data: Omit<TestDefinition, 'id' | 'lab_id'>) {
    const newTest: TestDefinition = {
      id: crypto.randomUUID(),
      lab_id: this.lab.id,
      ...data,
    };
    this.tests.push(newTest);
    this.recordAudit('test_created', 'test_definitions', newTest.id, { name: newTest.name, code: newTest.code });
    return newTest;
  }

  updateTest(id: string, updates: Partial<TestDefinition>) {
    const test = this.tests.find((t) => t.id === id);
    if (!test) throw new Error('Test not found');
    Object.assign(test, updates);
    this.recordAudit('test_updated', 'test_definitions', id, { name: test.name, code: test.code });
    return test;
  }

  toggleTestStatus(id: string) {
    const test = this.tests.find((t) => t.id === id);
    if (!test) throw new Error('Test not found');
    test.is_active = !test.is_active;
    this.recordAudit('test_status_toggled', 'test_definitions', id, { is_active: test.is_active });
    return test;
  }

  // Patient Registration with duplicate check
  registerPatient(data: {
    fullName: string;
    sex: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    estimatedAgeYears?: number;
    isAgeEstimated?: boolean;
    phone: string;
    email?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    clinicalNotes?: string;
  }): { patient: Patient; duplicateWarnings: string[] } {
    const duplicateWarnings: string[] = [];

    // Duplicate check on phone or exact name + DOB
    const existingByPhone = this.patients.find(
      (p) => p.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, '')
    );
    if (existingByPhone) {
      duplicateWarnings.push(
        `A patient with this phone number already exists: ${existingByPhone.full_name} (${existingByPhone.patient_number})`
      );
    }

    const existingByNameDob = this.patients.find(
      (p) =>
        p.full_name.trim().toLowerCase() === data.fullName.trim().toLowerCase() &&
        p.date_of_birth &&
        data.dateOfBirth &&
        p.date_of_birth === data.dateOfBirth
    );
    if (existingByNameDob) {
      duplicateWarnings.push(
        `A patient with identical name and Date of Birth already exists: ${existingByNameDob.patient_number}`
      );
    }

    this.seqPatient += 1;
    const year = new Date().getFullYear();
    const patientNumber = `PAT-${year}-${String(this.seqPatient).padStart(4, '0')}`;

    const newPatient: Patient = {
      id: crypto.randomUUID(),
      lab_id: this.lab.id,
      patient_number: patientNumber,
      full_name: data.fullName.trim(),
      sex: data.sex,
      date_of_birth: data.dateOfBirth,
      estimated_age_years: data.estimatedAgeYears,
      is_age_estimated: !!data.isAgeEstimated,
      phone: data.phone.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
      emergency_contact_name: data.emergencyContactName?.trim(),
      emergency_contact_phone: data.emergencyContactPhone?.trim(),
      clinical_notes: data.clinicalNotes?.trim(),
      created_at: new Date().toISOString(),
    };

    this.patients.unshift(newPatient);
    this.recordAudit('patient_created', 'patients', newPatient.id, {
      patient_number: patientNumber,
      warnings_count: duplicateWarnings.length,
    });

    return { patient: newPatient, duplicateWarnings };
  }

  // Order & Invoice Creation
  createOrder(data: {
    patientId: string;
    testIds: string[];
    orderingPhysician?: string;
    clinicalIndication?: string;
    priority?: OrderPriority;
    discountPercentage?: number;
    discountReason?: string;
    customId?: string;
    customCreatedAt?: string;
  }): Order {
    const patient = this.patients.find((p) => p.id === data.patientId);
    if (!patient) throw new Error('Patient not found');

    const selectedTests = this.tests.filter((t) => data.testIds.includes(t.id));
    if (selectedTests.length === 0) throw new Error('At least one test must be selected');

    // Discount permission check: Lab Staff cannot exceed lab.max_staff_discount_percentage
    const discountPct = data.discountPercentage || 0;
    const staff = this.getActiveStaff();
    if (!staff.roles.includes('admin') && discountPct > this.lab.max_staff_discount_percentage) {
      throw new Error(
        `Staff discount limit exceeded. Maximum permitted for Lab Staff is ${this.lab.max_staff_discount_percentage}% (requested ${discountPct}%)`
      );
    }

    const year = new Date().getFullYear();
    this.seqOrder += 1;
    const orderNumber = `ORD-${year}-${String(this.seqOrder).padStart(4, '0')}`;
    const orderId = data.customId || crypto.randomUUID();
    const createdAt = data.customCreatedAt || new Date().toISOString();

    // Group tests by required specimen type to create specimens
    const specimenMap = new Map<string, { type: string; container: string }>();
    selectedTests.forEach((t) => {
      const key = `${t.specimen_type}__${t.container_type}`;
      if (!specimenMap.has(key)) {
        specimenMap.set(key, { type: t.specimen_type, container: t.container_type });
      }
    });

    const specimens: Specimen[] = [];
    let specIdx = 0;
    specimenMap.forEach((val) => {
      this.seqSpecimen += 1;
      specIdx += 1;
      const specimenNumber = `SPEC-${year}-${String(this.seqSpecimen).padStart(4, '0')}`;
      specimens.push({
        id: data.customId ? `${data.customId}-spec-${specIdx}` : crypto.randomUUID(),
        lab_id: this.lab.id,
        order_id: orderId,
        specimen_number: specimenNumber,
        specimen_type: val.type,
        container_type: val.container,
        status: 'awaiting_collection',
        created_at: createdAt,
      });
    });

    let ageYears: number | undefined = patient.estimated_age_years;
    if (patient.date_of_birth) {
      const diffMs = Date.now() - new Date(patient.date_of_birth).getTime();
      ageYears = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Create Order Test Snapshots
    const orderTests = selectedTests.map((t, tIdx) => {
      const otId = data.customId ? `${data.customId}-ot-${tIdx + 1}` : crypto.randomUUID();
      return {
        id: otId,
        order_id: orderId,
        test_definition_id: t.id,
        test_name_snapshot: t.name,
        test_code_snapshot: t.code,
        test_price_snapshot: t.price,
        department_snapshot: t.department,
        parameters: t.parameters.map((p, pIdx) => ({
          id: data.customId ? `${otId}-p-${pIdx + 1}` : crypto.randomUUID(),
          order_test_id: otId,
          test_parameter_id: p.id,
          parameter_name_snapshot: p.name,
          parameter_code_snapshot: p.code,
          result_type_snapshot: p.result_type,
          unit_snapshot: p.unit,
          reference_range_snapshot: this.getReferenceRangeSnapshot(p.id, p.code, patient.sex, ageYears),
          display_order: p.display_order,
        })),
      };
    });

    // Create Results for each parameter initialized to pending
    const results: Result[] = [];
    orderTests.forEach((ot) => {
      ot.parameters.forEach((param, rIdx) => {
        results.push({
          id: data.customId ? `${ot.id}-res-${rIdx + 1}` : crypto.randomUUID(),
          order_test_parameter_id: param.id,
          order_id: orderId,
          disposition: 'performed',
          numeric_value: undefined,
          text_value: undefined,
          flag: 'normal',
          revision: 1,
        });
      });
    });

    // Create Invoice
    this.seqInvoice += 1;
    const invoiceNumber = `INV-${year}-${String(this.seqInvoice).padStart(4, '0')}`;
    const subtotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
    const discountAmount = Math.round(((subtotal * discountPct) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

    const invoiceId = data.customId ? `${data.customId}-inv` : crypto.randomUUID();
    const invoice: Invoice = {
      id: invoiceId,
      lab_id: this.lab.id,
      order_id: orderId,
      invoice_number: invoiceNumber,
      subtotal,
      discount_percentage: discountPct,
      discount_amount: discountAmount,
      discount_reason: data.discountReason,
      total_amount: totalAmount,
      amount_paid: 0,
      amount_refunded: 0,
      balance_due: totalAmount,
      status: 'unpaid',
      items: orderTests.map((ot, itemIdx) => ({
        id: data.customId ? `${invoiceId}-item-${itemIdx + 1}` : crypto.randomUUID(),
        invoice_id: invoiceId,
        order_test_id: ot.id,
        description: `${ot.test_name_snapshot} (${ot.test_code_snapshot})`,
        unit_price: ot.test_price_snapshot,
        quantity: 1,
        amount: ot.test_price_snapshot,
      })),
      payments: [],
      refunds: [],
      created_at: createdAt,
    };
    invoice.items.forEach((it) => (it.invoice_id = invoice.id));

    const newOrder: Order = {
      id: orderId,
      lab_id: this.lab.id,
      order_number: orderNumber,
      patient_id: patient.id,
      ordering_physician: data.orderingPhysician,
      clinical_indication: data.clinicalIndication,
      priority: data.priority || 'routine',
      status: 'created',
      payment_status: 'unpaid',
      created_by: staff.id,
      created_at: createdAt,
      updated_at: createdAt,
      patient,
      tests: orderTests,
      specimens,
      results,
      submissions: [],
      report_versions: [],
      critical_notifications: [],
      invoice,
    };

    this.orders.unshift(newOrder);
    this.invoices.unshift(invoice);

    this.recordAudit('order_created', 'orders', newOrder.id, {
      order_number: orderNumber,
      tests_count: selectedTests.length,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
    });

    return newOrder;
  }

  private getReferenceRangeSnapshot(
    paramId: string,
    paramCode?: string,
    sex?: string,
    ageYears?: number
  ): {
    normal_low?: number;
    normal_high?: number;
    critical_low?: number;
    critical_high?: number;
    qualitative_expected?: string;
    description?: string;
    is_unspecified?: boolean;
    raw_range_text?: string;
  } {
    // 1. Find matching component in catalogue component library
    const comp = this.components.find(
      (c) =>
        (paramCode && c.code.toLowerCase() === paramCode.toLowerCase()) ||
        c.id === paramId ||
        c.code === paramId
    );

    // 2. Resolve demographic-specific text range
    let rangeText: string | undefined = undefined;
    let demographicDesc = 'Adult Reference Interval';

    if (comp) {
      const isChild = ageYears !== undefined && ageYears < 18;
      if (isChild && comp.child_range) {
        rangeText = comp.child_range;
        demographicDesc = `Pediatric Range (<18 yrs)`;
      } else if (sex === 'female' && comp.female_range) {
        rangeText = comp.female_range;
        demographicDesc = `Adult Female Range`;
      } else if (sex === 'male' && comp.male_range) {
        rangeText = comp.male_range;
        demographicDesc = `Adult Male Range`;
      } else if (comp.gen_range) {
        rangeText = comp.gen_range;
        demographicDesc = `General Reference Interval`;
      }
    }

    // 3. Fallback to existing parameter definition if not found in component library
    if (!rangeText) {
      if (paramId === 'b0000000-0000-0000-0000-000000000001' || paramCode === 'WBC') {
        return { normal_low: 4.5, normal_high: 11.0, critical_low: 2.0, critical_high: 30.0, description: 'Adult Reference Interval', raw_range_text: '4.5 - 11.0' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000002' || paramCode === 'RBC') {
        const isFem = sex === 'female';
        return isFem
          ? { normal_low: 4.0, normal_high: 5.2, description: 'Adult Female Range', raw_range_text: '4.0 - 5.2' }
          : { normal_low: 4.5, normal_high: 5.9, description: 'Adult Male Range', raw_range_text: '4.5 - 5.9' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000003' || paramCode === 'HGB') {
        const isFem = sex === 'female';
        return isFem
          ? { normal_low: 12.0, normal_high: 15.5, critical_low: 7.0, critical_high: 20.0, description: 'Adult Female Range', raw_range_text: '12.0 - 15.5' }
          : { normal_low: 13.5, normal_high: 17.5, critical_low: 7.0, critical_high: 20.0, description: 'Adult Male Range', raw_range_text: '13.5 - 17.5' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000004' || paramCode === 'HCT') {
        const isFem = sex === 'female';
        return isFem
          ? { normal_low: 36.0, normal_high: 46.0, description: 'Adult Female Range', raw_range_text: '36.0 - 46.0' }
          : { normal_low: 41.0, normal_high: 50.0, description: 'Adult Male Range', raw_range_text: '41.0 - 50.0' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000005' || paramCode === 'PLT') {
        return { normal_low: 150, normal_high: 450, critical_low: 50, critical_high: 1000, description: 'Platelets', raw_range_text: '150 - 450' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000010' || paramCode === 'GLUF' || paramCode === 'GLU') {
        return { normal_low: 70.0, normal_high: 99.0, critical_low: 45.0, critical_high: 400.0, description: 'Fasting Plasma Glucose', raw_range_text: '70.0 - 99.0' };
      }
      if (paramId === 'b0000000-0000-0000-0000-000000000020' || paramCode === 'CHOL') {
        return { normal_low: 125.0, normal_high: 200.0, critical_high: 350.0, description: 'Total Cholesterol', raw_range_text: '125.0 - 200.0' };
      }
    }

    if (!rangeText) {
      // NEVER return fake 10-100 fallback! Return explicit unconfigured status
      return {
        is_unspecified: true,
        description: 'Reference interval not configured',
      };
    }

    // Parse rangeText (e.g. "70 - 99", "< 150", "> 40", "NEGATIVE")
    const cleanRange = rangeText.trim();
    const result: {
      normal_low?: number;
      normal_high?: number;
      critical_low?: number;
      critical_high?: number;
      qualitative_expected?: string;
      description?: string;
      is_unspecified?: boolean;
      raw_range_text?: string;
    } = {
      description: comp?.range_description || demographicDesc,
      raw_range_text: cleanRange,
    };

    // Range like "70 - 99" or "13.5 - 17.5"
    const dashMatch = cleanRange.match(/^([0-9.]+)\s*[-–]\s*([0-9.]+)$/);
    if (dashMatch) {
      result.normal_low = parseFloat(dashMatch[1]);
      result.normal_high = parseFloat(dashMatch[2]);
    } else if (cleanRange.startsWith('<')) {
      const val = parseFloat(cleanRange.replace('<', '').trim());
      if (!isNaN(val)) result.normal_high = val;
    } else if (cleanRange.startsWith('>')) {
      const val = parseFloat(cleanRange.replace('>', '').trim());
      if (!isNaN(val)) result.normal_low = val;
    } else {
      // Qualitative
      result.qualitative_expected = cleanRange;
    }

    // Attach analyte-specific panic/critical thresholds
    const code = (paramCode || comp?.code || '').toUpperCase();
    if (code.includes('GLU')) {
      result.critical_low = 45.0;
      result.critical_high = 400.0;
    } else if (code === 'HGB') {
      result.critical_low = 7.0;
      result.critical_high = 20.0;
    } else if (code === 'WBC') {
      result.critical_low = 2.0;
      result.critical_high = 30.0;
    } else if (code === 'PLT') {
      result.critical_low = 50;
      result.critical_high = 1000;
    } else if (code === 'CHOL') {
      result.critical_high = 350.0;
    } else if (code === 'TRIG') {
      result.critical_high = 500.0;
    } else if (code === 'K') {
      result.critical_low = 2.8;
      result.critical_high = 6.2;
    } else if (code === 'NA') {
      result.critical_low = 120;
      result.critical_high = 160;
    }

    return result;
  }

  // Specimen Actions
  updateSpecimenStatus(
    specimenId: string,
    action: 'collect' | 'receive' | 'collect_and_receive' | 'complete' | 'reject' | 'cancel',
    reason?: string,
    notes?: string,
    customTimestamp?: string
  ): Specimen {
    const staff = this.getActiveStaff();
    let targetSpecimen: Specimen | undefined;
    let targetOrder: Order | undefined;

    for (const order of this.orders) {
      const sp = order.specimens.find((s) => s.id === specimenId);
      if (sp) {
        targetSpecimen = sp;
        targetOrder = order;
        break;
      }
    }

    if (!targetSpecimen || !targetOrder) throw new Error('Specimen not found');

    const now = customTimestamp || new Date().toISOString();

    if (action === 'collect_and_receive') {
      if (['rejected', 'cancelled', 'completed'].includes(targetSpecimen.status)) {
        throw new Error(`Cannot collect/receive specimen in ${targetSpecimen.status} status`);
      }
      targetSpecimen.status = 'received';
      targetSpecimen.collected_at = targetSpecimen.collected_at || now;
      targetSpecimen.collected_by = staff.id;
      targetSpecimen.received_at = now;
      targetSpecimen.received_by = staff.id;
    } else if (action === 'collect') {
      if (targetSpecimen.status !== 'awaiting_collection') {
        throw new Error(`Specimen is already in ${targetSpecimen.status} state`);
      }
      targetSpecimen.status = 'collected';
      targetSpecimen.collected_at = now;
      targetSpecimen.collected_by = staff.id;
    } else if (action === 'receive') {
      if (targetSpecimen.status !== 'collected') {
        throw new Error('Specimen must be collected before receiving');
      }
      targetSpecimen.status = 'received';
      targetSpecimen.received_at = now;
      targetSpecimen.received_by = staff.id;
    } else if (action === 'complete') {
      if (targetSpecimen.status !== 'received') {
        throw new Error('Only received specimens can be marked completed');
      }
      targetSpecimen.status = 'completed';
      targetSpecimen.completed_at = now;
    } else if (action === 'reject') {
      if (!reason || reason.trim() === '') {
        throw new Error('Rejection reason is mandatory');
      }
      targetSpecimen.status = 'rejected';
      targetSpecimen.rejection_reason = reason;

      // Automatically create replacement recollection specimen
      const year = new Date().getFullYear();
      this.seqSpecimen += 1;
      const newNumber = `SPEC-${year}-${String(this.seqSpecimen).padStart(4, '0')}`;
      const replacementSpecimen: Specimen = {
        id: crypto.randomUUID(),
        lab_id: this.lab.id,
        order_id: targetOrder.id,
        specimen_number: newNumber,
        specimen_type: targetSpecimen.specimen_type,
        container_type: targetSpecimen.container_type,
        status: 'awaiting_collection',
        parent_specimen_id: targetSpecimen.id,
        created_at: now,
      };
      targetOrder.specimens.push(replacementSpecimen);
      this.recordAudit('specimen_recollection_ordered', 'specimens', replacementSpecimen.id, {
        parent_specimen: targetSpecimen.specimen_number,
        rejection_reason: reason,
      });
    } else if (action === 'cancel') {
      if (!reason || reason.trim() === '') throw new Error('Cancellation reason is mandatory');
      targetSpecimen.status = 'cancelled';
      targetSpecimen.cancellation_reason = reason;
    }

    if (targetOrder.status === 'created' && ['collected', 'received'].includes(targetSpecimen.status)) {
      targetOrder.status = 'in_progress';
      targetOrder.updated_at = now;
    }

    this.recordAudit(`specimen_${action}`, 'specimens', targetSpecimen.id, {
      specimen_number: targetSpecimen.specimen_number,
      new_status: targetSpecimen.status,
      notes,
    });

    return targetSpecimen;
  }

  // Result Entry & Revisions
  updateResult(data: {
    orderId: string;
    orderTestParameterId: string;
    disposition: 'performed' | 'not_performed' | 'cancelled';
    numericValue?: number | null;
    textValue?: string | null;
    nonPerformedReason?: string;
  }): Result {
    const order = this.orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Order not found');

    const result = order.results.find((r) => r.order_test_parameter_id === data.orderTestParameterId);
    if (!result) throw new Error('Result record not found');

    const staff = this.getActiveStaff();
    const now = new Date().toISOString();

    // Check if any pending review submission exists; if so, invalidate it!
    const pendingSub = order.submissions.find((s) => s.status === 'pending');
    if (pendingSub) {
      pendingSub.status = 'invalidated_by_edit';
      this.recordAudit('review_invalidated_by_edit', 'review_submissions', pendingSub.id, {
        order_number: order.order_number,
      });
    }

    // Determine flag if numeric
    let flag: 'normal' | 'abnormal' | 'critical' | 'inconclusive' = 'normal';
    if (data.disposition === 'performed' && data.numericValue !== null && data.numericValue !== undefined) {
      let paramRef: { normal_low?: number; normal_high?: number; critical_low?: number; critical_high?: number } | undefined;
      for (const ot of order.tests) {
        const found = ot.parameters.find((p) => p.id === data.orderTestParameterId);
        if (found) {
          paramRef = found.reference_range_snapshot;
          break;
        }
      }

      if (paramRef) {
        if (paramRef.critical_low !== undefined && data.numericValue <= paramRef.critical_low) {
          flag = 'critical';
        } else if (paramRef.critical_high !== undefined && data.numericValue >= paramRef.critical_high) {
          flag = 'critical';
        } else if (paramRef.normal_low !== undefined && data.numericValue < paramRef.normal_low) {
          flag = 'abnormal';
        } else if (paramRef.normal_high !== undefined && data.numericValue > paramRef.normal_high) {
          flag = 'abnormal';
        }
      }
    }

    result.disposition = data.disposition;
    result.non_performed_reason = data.nonPerformedReason;
    result.numeric_value = data.numericValue ?? undefined;
    result.text_value = data.textValue ?? undefined;
    result.flag = flag;
    result.revision += 1;
    if (!result.entered_by) {
      result.entered_by = staff.id;
      result.entered_at = now;
    } else {
      result.last_edited_by = staff.id;
      result.last_edited_at = now;
    }

    this.recordAudit('result_updated', 'results', result.id, {
      revision: result.revision,
      flag,
      disposition: data.disposition,
    });

    return result;
  }

  // Critical Notification Logging
  logCriticalNotification(data: {
    orderId: string;
    orderTestParameterId: string;
    parameterName: string;
    criticalValueSummary: string;
    recipientName: string;
    recipientRolePhone: string;
    notificationMethod: 'phone_call' | 'in_person' | 'secure_messaging';
    readBackConfirmed: boolean;
    escalationStatus: 'pending_acknowledgement' | 'resolved' | 'escalated_to_supervisor';
    notes?: string;
    customId?: string;
    customAttemptedAt?: string;
  }): CriticalNotification {
    const order = this.orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Order not found');

    const staff = this.getActiveStaff();
    const attemptedAt = data.customAttemptedAt || new Date().toISOString();
    const notif: CriticalNotification = {
      id: data.customId || crypto.randomUUID(),
      order_id: data.orderId,
      order_test_parameter_id: data.orderTestParameterId,
      parameter_name: data.parameterName,
      critical_value_summary: data.criticalValueSummary,
      recipient_name: data.recipientName,
      recipient_role_phone: data.recipientRolePhone,
      notification_method: data.notificationMethod,
      attempted_at: attemptedAt,
      acknowledged_at: data.readBackConfirmed ? attemptedAt : undefined,
      read_back_confirmed: data.readBackConfirmed,
      escalation_status: data.escalationStatus,
      notes: data.notes,
      communicated_by: staff.id,
    };

    order.critical_notifications.unshift(notif);
    this.recordAudit(
      'critical_result_communicated',
      'critical_notifications',
      notif.id,
      {
        order_number: order.order_number,
        recipient: data.recipientName,
        read_back_confirmed: data.readBackConfirmed,
      },
      data.customId ? `${data.customId}-audit` : undefined,
      attemptedAt
    );

    return notif;
  }

  // Submit for Review
  submitForReview(
    orderId: string,
    qaAttestationNotes: string,
    customId?: string,
    customSubmittedAt?: string
  ): ReviewSubmission {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // 1. Specimen readiness check
    const rejected = order.specimens.find((s) => s.status === 'rejected');
    if (rejected) {
      throw new Error(
        `Cannot submit for review: Specimen ${rejected.specimen_number} was rejected (${rejected.rejection_reason}). Replacement recollection must be received.`
      );
    }
    const uncollected = order.specimens.find((s) => s.status === 'awaiting_collection');
    if (uncollected) {
      throw new Error(
        `Cannot submit for review: Specimen ${uncollected.specimen_number} (${uncollected.specimen_type}) has not been collected and received.`
      );
    }

    if (!qaAttestationNotes || qaAttestationNotes.trim().length < 5) {
      throw new Error('Documented Quality Check Attestation is mandatory before submitting for review');
    }

    // Completeness check
    let totalParams = 0;
    order.tests.forEach((t) => (totalParams += t.parameters.length));
    const completedResults = order.results.filter((r) => {
      if (r.disposition === 'not_performed' || r.disposition === 'cancelled') return true;
      return (r.numeric_value !== null && r.numeric_value !== undefined) || !!r.text_value;
    });

    if (completedResults.length < totalParams) {
      throw new Error(
        `Cannot submit for review: ${totalParams - completedResults.length} parameter(s) are missing results or dispositions`
      );
    }

    const staff = this.getActiveStaff();
    const subSnapshot: Record<string, unknown> = {};
    order.results.forEach((r) => {
      subSnapshot[r.order_test_parameter_id] = {
        numeric: r.numeric_value,
        text: r.text_value,
        disposition: r.disposition,
        flag: r.flag,
        revision: r.revision,
      };
    });

    // Invalidate earlier pending
    order.submissions.forEach((s) => {
      if (s.status === 'pending') s.status = 'invalidated_by_edit';
    });

    const submittedAt = customSubmittedAt || new Date().toISOString();
    const newSub: ReviewSubmission = {
      id: customId || crypto.randomUUID(),
      order_id: order.id,
      submitted_by: staff.id,
      submitted_at: submittedAt,
      status: 'pending',
      qa_checks_attested: true,
      qa_attestation_notes: qaAttestationNotes,
      result_revision_snapshots: subSnapshot,
    };

    order.submissions.unshift(newSub);
    this.recordAudit(
      'review_submitted',
      'review_submissions',
      newSub.id,
      {
        order_number: order.order_number,
      },
      customId ? `${customId}-audit` : undefined,
      submittedAt
    );

    return newSub;
  }

  // Return for Correction
  returnForCorrection(orderId: string, submissionId: string, comments: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const sub = order.submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'pending') throw new Error('Submission is not pending review');

    if (!comments || comments.trim().length < 5) {
      throw new Error('Clinical comments are required when returning results for correction');
    }

    const reviewer = this.getActiveStaff();
    if (!reviewer.roles.includes('authorized_reviewer')) {
      throw new Error('Only Authorized Reviewers can return submissions for correction');
    }

    sub.status = 'returned';
    this.recordAudit('review_returned_for_correction', 'review_submissions', sub.id, {
      order_number: order.order_number,
      reviewer: reviewer.full_name,
      comments,
    });
  }

  // Authorize Clinical Report (Transaction)
  authorizeReport(
    orderId: string,
    submissionId: string,
    comments: string = 'Authorized',
    customId?: string,
    customAuthorizedAt?: string
  ): ReportVersion {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const sub = order.submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'pending') {
      throw new Error('Submission is not pending review or is stale');
    }

    const reviewer = this.getActiveStaff();
    // 1. Role Check: Strictly Admin or Authorized Clinical Signatory
    if (!reviewer.roles.includes('admin') && !reviewer.roles.includes('authorized_reviewer')) {
      throw new Error('Permission Denied: Only Admin (Clinical Director) or Authorized Clinical Reviewer may authorize reports');
    }

    // 2. Scope & Validity Check (if reviewer profile has explicit reviewer_scope)
    const scope = reviewer.reviewer_scope;
    if (scope && scope.is_active) {
      const today = new Date().toISOString().split('T')[0];
      if (today < scope.valid_from || today > scope.valid_to) {
        throw new Error('Reviewer scope has expired or is not yet valid');
      }

      // Check department scopes
      if (!scope.verified_scopes.includes('ALL')) {
        const orderDepts = order.tests.map((t) => t.department_snapshot);
        const uncovered = orderDepts.find((d) => !scope.verified_scopes.includes(d));
        if (uncovered) {
          throw new Error(`Reviewer scope does not cover department: ${uncovered}`);
        }
      }
    }

    // 3. INDEPENDENT AUTHORIZATION CHECK:
    // A reviewer cannot authorize a report containing results they entered or clinically edited!
    const authorConflict = order.results.some(
      (r) => r.entered_by === reviewer.id || r.last_edited_by === reviewer.id
    );
    if (authorConflict) {
      throw new Error(
        'INDEPENDENT AUTHORIZATION VIOLATION: A reviewer cannot authorize results they entered or edited. Independent review is mandatory.'
      );
    }

    // 4. Critical Results Check: All criticals must have documented communication
    const criticalResults = order.results.filter((r) => r.flag === 'critical');
    for (const cr of criticalResults) {
      const notif = order.critical_notifications.find(
        (cn) => cn.order_test_parameter_id === cr.order_test_parameter_id && cn.read_back_confirmed && cn.escalation_status === 'resolved'
      );
      if (!notif) {
        throw new Error(
          'Cannot authorize: One or more critical results lack documented and acknowledged communication/read-back'
        );
      }
    }

    const versionNum = order.report_versions.length + 1;
    const year = new Date().getFullYear();
    let reportNumber: string;
    if (versionNum === 1) {
      this.seqReport += 1;
      reportNumber = `REP-${year}-${String(this.seqReport).padStart(4, '0')}-v1`;
    } else {
      const base = order.report_versions[0].report_number.replace(/-v\d+$/, '');
      reportNumber = `${base}-v${versionNum}`;
    }

    // Build immutable snapshot
    const snapshot: ReportSnapshot = {
      report_number: reportNumber,
      version: versionNum,
      order_number: order.order_number,
      ordering_physician: order.ordering_physician,
      clinical_indication: order.clinical_indication,
      lab: {
        name: this.lab.name,
        address: this.lab.address,
        phone: this.lab.phone,
        email: this.lab.email,
        director: this.lab.clinical_director,
        license: this.lab.lab_license_number,
        header_text: this.lab.report_header_text,
        footer_text: this.lab.report_footer_text,
        timezone: this.lab.timezone,
      },
      patient: {
        patient_number: order.patient!.patient_number,
        full_name: order.patient!.full_name,
        sex: order.patient!.sex,
        date_of_birth: order.patient!.date_of_birth,
        estimated_age_years: order.patient!.estimated_age_years,
        is_age_estimated: order.patient!.is_age_estimated,
        phone: order.patient!.phone,
      },
      reviewer: {
        full_name: reviewer.full_name,
        credentials:
          scope?.credentials_title ||
          (this.lab.clinical_director
            ? `${this.lab.clinical_director}, Clinical Director (Reg: ${this.lab.lab_license_number})`
            : 'Authorized Laboratory Signatory'),
        authorized_at: new Date().toISOString(),
      },
      qa_attestation: {
        attested: sub.qa_checks_attested,
        notes: sub.qa_attestation_notes,
        submitted_at: sub.submitted_at,
      },
      tests: order.tests.map((ot) => ({
        test_name: ot.test_name_snapshot,
        test_code: ot.test_code_snapshot,
        department: ot.department_snapshot,
        parameters: ot.parameters.map((p) => {
          const res = order.results.find((r) => r.order_test_parameter_id === p.id);
          return {
            parameter_name: p.parameter_name_snapshot,
            parameter_code: p.parameter_code_snapshot,
            result_type: p.result_type_snapshot,
            unit: p.unit_snapshot,
            reference_range: p.reference_range_snapshot,
            disposition: res?.disposition || 'performed',
            non_performed_reason: res?.non_performed_reason,
            numeric_value: res?.numeric_value,
            text_value: res?.text_value,
            flag: res?.flag || 'normal',
          };
        }),
      })),
      specimens: order.specimens.map((s) => ({
        specimen_number: s.specimen_number,
        type: s.specimen_type,
        container: s.container_type,
        collected_at: s.collected_at,
        received_at: s.received_at,
      })),
    };

    const authAt = customAuthorizedAt || new Date().toISOString();
    const newReport: ReportVersion = {
      id: customId || crypto.randomUUID(),
      order_id: order.id,
      version_number: versionNum,
      report_number: reportNumber,
      status: 'authorized',
      report_snapshot: snapshot,
      authorized_by: reviewer.id,
      authorized_at: authAt,
      created_at: authAt,
    };

    sub.status = 'authorized';

    // Mark previous released/authorized version as superseded
    if (order.report_versions.length > 0) {
      const prior = order.report_versions[0];
      prior.status = 'superseded';
      newReport.prior_report_version_id = prior.id;
    }

    order.report_versions.unshift(newReport);

    this.recordAudit(
      'report_authorized',
      'report_versions',
      newReport.id,
      {
        report_number: reportNumber,
        version: versionNum,
        reviewer: reviewer.full_name,
        comments,
      },
      customId ? `${customId}-audit` : undefined,
      authAt
    );

    return newReport;
  }

  // Release Report (requires stored PDF)
  releaseReport(
    reportVersionId: string,
    pdfStoragePath: string,
    customReleasedAt?: string
  ): ReportVersion {
    let targetReport: ReportVersion | undefined;
    let targetOrder: Order | undefined;

    for (const o of this.orders) {
      const rep = o.report_versions.find((r) => r.id === reportVersionId);
      if (rep) {
        targetReport = rep;
        targetOrder = o;
        break;
      }
    }

    if (!targetReport || !targetOrder) throw new Error('Report version not found');
    if (targetReport.status !== 'authorized') {
      throw new Error(`Report is in ${targetReport.status} status and cannot be released`);
    }

    const staff = this.getActiveStaff();
    const now = customReleasedAt || new Date().toISOString();

    targetReport.status = 'released';
    targetReport.pdf_storage_path = pdfStoragePath;
    targetReport.released_at = now;
    targetReport.released_by = staff.id;

    targetOrder.status = 'completed';
    targetOrder.updated_at = now;

    this.recordAudit(
      'report_released',
      'report_versions',
      targetReport.id,
      {
        report_number: targetReport.report_number,
        pdf_path: pdfStoragePath,
      },
      undefined,
      now
    );

    return targetReport;
  }

  // Initiate Controlled Report Amendment
  createAmendment(data: {
    orderId: string;
    amendmentReason: string;
    notes?: string;
  }): void {
    const order = this.orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Order not found');
    if (order.report_versions.length === 0) {
      throw new Error('Only released or authorized orders can be amended');
    }
    if (!data.amendmentReason || data.amendmentReason.trim().length < 5) {
      throw new Error('A documented clinical amendment reason (minimum 5 characters) is mandatory.');
    }
    const staff = this.getActiveStaff();
    const latestReport = order.report_versions[0];

    // Invalidate any existing pending submissions so results can be adjusted under amendment
    order.submissions.forEach((s) => {
      if (s.status === 'pending') s.status = 'invalidated_by_edit';
    });

    // Record amendment audit entry
    this.recordAudit('report_amendment_initiated', 'orders', order.id, {
      order_number: order.order_number,
      latest_report_number: latestReport.report_number,
      reason: data.amendmentReason,
      notes: data.notes,
      initiated_by: staff.full_name,
    });
  }

  // Record Payment
  recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check';
    referenceNote?: string;
    idempotencyKey: string;
    customId?: string;
    customRecordedAt?: string;
  }): Payment {
    const invoice = this.invoices.find((inv) => inv.id === data.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    // Check idempotency
    const existing = invoice.payments.find((p) => p.idempotency_key === data.idempotencyKey);
    if (existing) return existing;

    if (data.amount <= 0) throw new Error('Payment amount must be greater than zero');

    const year = new Date().getFullYear();
    this.seqPayment += 1;
    const paymentNumber = `PAY-${year}-${String(this.seqPayment).padStart(4, '0')}`;
    const staff = this.getActiveStaff();
    const recordedAt = data.customRecordedAt || new Date().toISOString();

    const payment: Payment = {
      id: data.customId || crypto.randomUUID(),
      invoice_id: invoice.id,
      payment_number: paymentNumber,
      amount: data.amount,
      payment_method: data.paymentMethod,
      reference_note: data.referenceNote,
      idempotency_key: data.idempotencyKey,
      recorded_by: staff.id,
      recorded_at: recordedAt,
    };

    invoice.payments.push(payment);
    invoice.amount_paid += data.amount;
    invoice.balance_due = Math.max(0, invoice.total_amount - (invoice.amount_paid - invoice.amount_refunded));

    if (invoice.balance_due <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'part_paid';
    }

    // Update order payment status
    const order = this.orders.find((o) => o.id === invoice.order_id);
    if (order) {
      order.payment_status = invoice.status;
      order.updated_at = recordedAt;
    }

    this.recordAudit(
      'payment_recorded',
      'payments',
      payment.id,
      {
        payment_number: paymentNumber,
        amount: data.amount,
        invoice_number: invoice.invoice_number,
        balance_remaining: invoice.balance_due,
      },
      data.customId ? `${data.customId}-audit` : undefined,
      recordedAt
    );

    return payment;
  }

  // Record Refund (Admin Only)
  recordRefund(data: {
    invoiceId: string;
    paymentId?: string;
    amount: number;
    reason: string;
    idempotencyKey: string;
  }): Refund {
    const staff = this.getActiveStaff();
    if (!staff.roles.includes('admin')) {
      throw new Error('Permission Denied: Only Admin can authorize refunds');
    }

    const invoice = this.invoices.find((inv) => inv.id === data.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const existing = invoice.refunds.find((r) => r.idempotency_key === data.idempotencyKey);
    if (existing) return existing;

    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('Mandatory documented reason required for issuing refund');
    }

    const netPaid = invoice.amount_paid - invoice.amount_refunded;
    if (data.amount > netPaid) {
      throw new Error(`Refund amount ($${data.amount}) cannot exceed net paid balance ($${netPaid})`);
    }

    const refund: Refund = {
      id: crypto.randomUUID(),
      invoice_id: invoice.id,
      payment_id: data.paymentId,
      amount: data.amount,
      reason: data.reason,
      authorized_by: staff.id,
      idempotency_key: data.idempotencyKey,
      recorded_at: new Date().toISOString(),
    };

    invoice.refunds.push(refund);
    invoice.amount_refunded += data.amount;
    invoice.balance_due = invoice.total_amount - (invoice.amount_paid - invoice.amount_refunded);

    if (invoice.amount_paid - invoice.amount_refunded <= 0) {
      invoice.status = 'refunded';
    } else if (invoice.balance_due <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'part_paid';
    }

    const order = this.orders.find((o) => o.id === invoice.order_id);
    if (order) {
      order.payment_status = invoice.status;
      order.updated_at = new Date().toISOString();
    }

    this.recordAudit('refund_recorded', 'refunds', refund.id, {
      amount: data.amount,
      reason: data.reason,
      invoice_number: invoice.invoice_number,
    });

    return refund;
  }

  // Record Expense (Admin Only)
  recordExpense(data: {
    category: 'reagents' | 'consumables' | 'utilities' | 'maintenance' | 'other';
    amount: number;
    vendor: string;
    description: string;
    receiptReference?: string;
    expenseDate: string;
  }): Expense {
    const staff = this.getActiveStaff();
    if (!staff.roles.includes('admin')) {
      throw new Error('Permission Denied: Only Admin can record laboratory expenses');
    }

    const exp: Expense = {
      id: crypto.randomUUID(),
      lab_id: this.lab.id,
      category: data.category,
      amount: data.amount,
      vendor: data.vendor.trim(),
      description: data.description.trim(),
      receipt_reference: data.receiptReference?.trim(),
      expense_date: data.expenseDate,
      recorded_by: staff.id,
      recorded_at: new Date().toISOString(),
    };

    this.expenses.unshift(exp);
    this.recordAudit('expense_recorded', 'expenses', exp.id, {
      amount: data.amount,
      category: data.category,
      vendor: data.vendor,
    });

    return exp;
  }

  // Helper to pre-populate realistic initial orders
  private seedInitialOrders() {
    // 1. Order in "completed / released" state
    const p1 = this.patients[0];
    const t1 = this.tests[0]; // CBC
    const ord1 = this.createOrder({
      patientId: p1.id,
      testIds: [t1.id],
      orderingPhysician: 'Dr. Gregory House, MD',
      clinicalIndication: 'Pre-op baseline evaluation',
      priority: 'routine',
      customId: 'd0000000-0000-0000-0000-000000000001',
      customCreatedAt: '2026-10-23T08:00:00.000Z',
    });

    // Mark specimen collected & received
    const spec1 = ord1.specimens[0];
    this.updateSpecimenStatus(
      spec1.id,
      'collect_and_receive',
      undefined,
      undefined,
      '2026-10-23T08:15:00.000Z'
    );

    // Fill results (normal)
    ord1.results.forEach((r) => {
      let val = 14.5;
      for (const ot of ord1.tests) {
        const found = ot.parameters.find((p) => p.id === r.order_test_parameter_id);
        if (found) {
          if (found.parameter_code_snapshot === 'WBC') val = 6.8;
          if (found.parameter_code_snapshot === 'RBC') val = 4.8;
          if (found.parameter_code_snapshot === 'HGB') val = 15.2;
          if (found.parameter_code_snapshot === 'HCT') val = 45.0;
          if (found.parameter_code_snapshot === 'PLT') val = 240;
        }
      }
      this.updateResult({
        orderId: ord1.id,
        orderTestParameterId: r.order_test_parameter_id,
        disposition: 'performed',
        numericValue: val,
      });
    });

    // Pay full
    this.recordPayment({
      invoiceId: ord1.invoice!.id,
      amount: ord1.invoice!.total_amount,
      paymentMethod: 'card',
      idempotencyKey: 'SEED-PAY-001',
      referenceNote: 'Visa ending 4120',
      customId: 'pay-seed-001',
      customRecordedAt: '2026-10-23T08:30:00.000Z',
    });

    // Submit for review
    const sub1 = this.submitForReview(
      ord1.id,
      'Routine daily QC for hematology analyzer verified within +/- 1.5 SD.',
      'sub-seed-001',
      '2026-10-23T09:00:00.000Z'
    );

    // Switch to reviewer to authorize (Independent: David entered results, Dr Vance authorizes)
    this.activeStaffId = this.staff[2].id; // Dr Vance
    const rep1 = this.authorizeReport(
      ord1.id,
      sub1.id,
      'All clinical indices normal. Released.',
      'rep-seed-001',
      '2026-10-23T09:15:00.000Z'
    );
    this.releaseReport(
      rep1.id,
      `reports/${rep1.report_number}.pdf`,
      '2026-10-23T09:20:00.000Z'
    );

    // 2. Order in "awaiting review" state with a CRITICAL value + documented communication
    this.activeStaffId = this.staff[1].id; // Tech David
    const p2 = this.patients[1]; // Sadie Adler
    const ord2 = this.createOrder({
      patientId: p2.id,
      testIds: [this.tests[1].id], // Fasting Glucose
      orderingPhysician: 'Dr. John Watson, MD',
      clinicalIndication: 'Severe fatigue, hypoglycemia rule-out',
      priority: 'urgent',
      customId: 'd0000000-0000-0000-0000-000000000002',
      customCreatedAt: '2026-10-23T09:30:00.000Z',
    });

    this.updateSpecimenStatus(
      ord2.specimens[0].id,
      'collect_and_receive',
      undefined,
      undefined,
      '2026-10-23T09:45:00.000Z'
    );
    const gluRes = ord2.results[0];
    this.updateResult({
      orderId: ord2.id,
      orderTestParameterId: gluRes.order_test_parameter_id,
      disposition: 'performed',
      numericValue: 42.0, // Critical low (<45.0)
    });

    // Log critical result communication
    this.logCriticalNotification({
      orderId: ord2.id,
      orderTestParameterId: gluRes.order_test_parameter_id,
      parameterName: 'Glucose, Fasting Plasma',
      criticalValueSummary: 'Critical low: 42.0 mg/dL (Normal 70.0 - 99.0)',
      recipientName: 'Nurse Jackie / Dr. Watson Clinic',
      recipientRolePhone: 'Clinic Triage Nurse (+1 555-882-9910)',
      notificationMethod: 'phone_call',
      readBackConfirmed: true,
      escalationStatus: 'resolved',
      notes: 'Read-back confirmed verbatim. Clinic staff preparing stat oral glucose protocol.',
      customId: 'crit-seed-001',
      customAttemptedAt: '2026-10-23T10:00:00.000Z',
    });

    this.submitForReview(
      ord2.id,
      'Glucose hexokinase calibration run and verified with Level 1 & Level 2 controls.',
      'sub-seed-002',
      '2026-10-23T10:15:00.000Z'
    );

    // 3. Order in "awaiting collection" state (Lipid panel)
    const p3 = this.patients[2];
    this.createOrder({
      patientId: p3.id,
      testIds: [this.tests[2].id], // Lipid Panel
      orderingPhysician: 'Dr. Sarah Connor, MD',
      clinicalIndication: 'Annual wellness check',
      priority: 'routine',
      customId: 'd0000000-0000-0000-0000-000000000003',
      customCreatedAt: '2026-10-23T10:30:00.000Z',
    });

    // Reset default active staff to Lab Staff
    this.activeStaffId = this.staff[1].id;
  }
}

// Global singleton instance
const globalStore = new DiagnosticLabStore();
export { globalStore };
