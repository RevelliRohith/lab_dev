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
    this.recordAudit('staff_session_switched', 'staff_profiles', id, { name: target.full_name });
  }

  hasRole(role: UserRole): boolean {
    const staff = this.getActiveStaff();
    return staff.status === 'active' && staff.roles.includes(role);
  }

  // Audit recording
  recordAudit(action: string, entity_type: string, entity_id: string, metadata: Record<string, unknown> = {}) {
    const staff = this.getActiveStaff();
    this.auditEvents.unshift({
      id: crypto.randomUUID(),
      lab_id: this.lab.id,
      actor_id: staff.id,
      actor_email: staff.email,
      actor_role: staff.roles.join(','),
      action,
      entity_type,
      entity_id,
      metadata,
      timestamp: new Date().toISOString(),
    });
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
    const orderId = crypto.randomUUID();

    // Group tests by required specimen type to create specimens
    const specimenMap = new Map<string, { type: string; container: string }>();
    selectedTests.forEach((t) => {
      const key = `${t.specimen_type}__${t.container_type}`;
      if (!specimenMap.has(key)) {
        specimenMap.set(key, { type: t.specimen_type, container: t.container_type });
      }
    });

    const specimens: Specimen[] = [];
    specimenMap.forEach((val) => {
      this.seqSpecimen += 1;
      const specimenNumber = `SPEC-${year}-${String(this.seqSpecimen).padStart(4, '0')}`;
      specimens.push({
        id: crypto.randomUUID(),
        lab_id: this.lab.id,
        order_id: orderId,
        specimen_number: specimenNumber,
        specimen_type: val.type,
        container_type: val.container,
        status: 'awaiting_collection',
        created_at: new Date().toISOString(),
      });
    });

    // Create Order Test Snapshots
    const orderTests = selectedTests.map((t) => {
      const otId = crypto.randomUUID();
      return {
        id: otId,
        order_id: orderId,
        test_definition_id: t.id,
        test_name_snapshot: t.name,
        test_code_snapshot: t.code,
        test_price_snapshot: t.price,
        department_snapshot: t.department,
        parameters: t.parameters.map((p) => ({
          id: crypto.randomUUID(),
          order_test_id: otId,
          test_parameter_id: p.id,
          parameter_name_snapshot: p.name,
          parameter_code_snapshot: p.code,
          result_type_snapshot: p.result_type,
          unit_snapshot: p.unit,
          reference_range_snapshot: this.getReferenceRangeSnapshot(p.id, patient.sex),
          display_order: p.display_order,
        })),
      };
    });

    // Create Results for each parameter initialized to pending
    const results: Result[] = [];
    orderTests.forEach((ot) => {
      ot.parameters.forEach((param) => {
        results.push({
          id: crypto.randomUUID(),
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

    const invoice: Invoice = {
      id: crypto.randomUUID(),
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
      items: orderTests.map((ot) => ({
        id: crypto.randomUUID(),
        invoice_id: '',
        order_test_id: ot.id,
        description: `${ot.test_name_snapshot} (${ot.test_code_snapshot})`,
        unit_price: ot.test_price_snapshot,
        quantity: 1,
        amount: ot.test_price_snapshot,
      })),
      payments: [],
      refunds: [],
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  private getReferenceRangeSnapshot(paramId: string, sex: string): { normal_low?: number; normal_high?: number; critical_low?: number; critical_high?: number; description?: string } {
    // Configured ranges from clinical pathologist
    if (paramId === 'b0000000-0000-0000-0000-000000000001') {
      return { normal_low: 4.5, normal_high: 11.0, critical_low: 2.0, critical_high: 30.0, description: 'Adult Reference Interval' };
    }
    if (paramId === 'b0000000-0000-0000-0000-000000000003') {
      if (sex === 'female') return { normal_low: 12.0, normal_high: 15.5, critical_low: 7.0, critical_high: 20.0, description: 'Adult Female Range' };
      return { normal_low: 13.5, normal_high: 17.5, critical_low: 7.0, critical_high: 20.0, description: 'Adult Male Range' };
    }
    if (paramId === 'b0000000-0000-0000-0000-000000000005') {
      return { normal_low: 150, normal_high: 450, critical_low: 50, critical_high: 1000, description: 'Platelets' };
    }
    if (paramId === 'b0000000-0000-0000-0000-000000000010') {
      return { normal_low: 70.0, normal_high: 99.0, critical_low: 45.0, critical_high: 400.0, description: 'Fasting Glucose' };
    }
    if (paramId === 'b0000000-0000-0000-0000-000000000020') {
      return { normal_low: 125.0, normal_high: 200.0, critical_high: 350.0, description: 'Total Cholesterol' };
    }
    return { normal_low: 10, normal_high: 100 };
  }

  // Specimen Actions
  updateSpecimenStatus(specimenId: string, action: 'collect' | 'receive' | 'collect_and_receive' | 'complete' | 'reject' | 'cancel', reason?: string, notes?: string): Specimen {
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

    const now = new Date().toISOString();

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
  }): CriticalNotification {
    const order = this.orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Order not found');

    const staff = this.getActiveStaff();
    const notif: CriticalNotification = {
      id: crypto.randomUUID(),
      order_id: data.orderId,
      order_test_parameter_id: data.orderTestParameterId,
      parameter_name: data.parameterName,
      critical_value_summary: data.criticalValueSummary,
      recipient_name: data.recipientName,
      recipient_role_phone: data.recipientRolePhone,
      notification_method: data.notificationMethod,
      attempted_at: new Date().toISOString(),
      acknowledged_at: data.readBackConfirmed ? new Date().toISOString() : undefined,
      read_back_confirmed: data.readBackConfirmed,
      escalation_status: data.escalationStatus,
      notes: data.notes,
      communicated_by: staff.id,
    };

    order.critical_notifications.unshift(notif);
    this.recordAudit('critical_result_communicated', 'critical_notifications', notif.id, {
      order_number: order.order_number,
      recipient: data.recipientName,
      read_back_confirmed: data.readBackConfirmed,
    });

    return notif;
  }

  // Submit for Review
  submitForReview(orderId: string, qaAttestationNotes: string): ReviewSubmission {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

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

    const newSub: ReviewSubmission = {
      id: crypto.randomUUID(),
      order_id: order.id,
      submitted_by: staff.id,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      qa_checks_attested: true,
      qa_attestation_notes: qaAttestationNotes,
      result_revision_snapshots: subSnapshot,
    };

    order.submissions.unshift(newSub);
    this.recordAudit('review_submitted', 'review_submissions', newSub.id, {
      order_number: order.order_number,
    });

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
  authorizeReport(orderId: string, submissionId: string, comments: string = 'Authorized'): ReportVersion {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const sub = order.submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'pending') {
      throw new Error('Submission is not pending review or is stale');
    }

    const reviewer = this.getActiveStaff();
    // 1. Role Check
    if (!reviewer.roles.includes('authorized_reviewer')) {
      throw new Error('Permission Denied: Only staff holding the Authorized Reviewer role may authorize reports');
    }

    // 2. Scope & Validity Check
    const scope = reviewer.reviewer_scope;
    if (!scope || !scope.is_active) {
      throw new Error('Reviewer lacks active professional credentials or scopes');
    }
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
        credentials: scope.credentials_title,
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

    const newReport: ReportVersion = {
      id: crypto.randomUUID(),
      order_id: order.id,
      version_number: versionNum,
      report_number: reportNumber,
      status: 'authorized',
      report_snapshot: snapshot,
      authorized_by: reviewer.id,
      authorized_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    sub.status = 'authorized';
    order.report_versions.unshift(newReport);

    this.recordAudit('report_authorized', 'report_versions', newReport.id, {
      report_number: reportNumber,
      version: versionNum,
      reviewer: reviewer.full_name,
      comments,
    });

    return newReport;
  }

  // Release Report (requires stored PDF)
  releaseReport(reportVersionId: string, pdfStoragePath: string): ReportVersion {
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
    const now = new Date().toISOString();

    targetReport.status = 'released';
    targetReport.pdf_storage_path = pdfStoragePath;
    targetReport.released_at = now;
    targetReport.released_by = staff.id;

    targetOrder.status = 'completed';
    targetOrder.updated_at = now;

    this.recordAudit('report_released', 'report_versions', targetReport.id, {
      report_number: targetReport.report_number,
      pdf_path: pdfStoragePath,
    });

    return targetReport;
  }

  // Record Payment
  recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check';
    referenceNote?: string;
    idempotencyKey: string;
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

    const payment: Payment = {
      id: crypto.randomUUID(),
      invoice_id: invoice.id,
      payment_number: paymentNumber,
      amount: data.amount,
      payment_method: data.paymentMethod,
      reference_note: data.referenceNote,
      idempotency_key: data.idempotencyKey,
      recorded_by: staff.id,
      recorded_at: new Date().toISOString(),
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
      order.updated_at = new Date().toISOString();
    }

    this.recordAudit('payment_recorded', 'payments', payment.id, {
      payment_number: paymentNumber,
      amount: data.amount,
      invoice_number: invoice.invoice_number,
      balance_remaining: invoice.balance_due,
    });

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
    });

    // Mark specimen collected & received
    const spec1 = ord1.specimens[0];
    this.updateSpecimenStatus(spec1.id, 'collect_and_receive');

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
    });

    // Submit for review
    const sub1 = this.submitForReview(ord1.id, 'Routine daily QC for hematology analyzer verified within +/- 1.5 SD.');

    // Switch to reviewer to authorize (Independent: David entered results, Dr Vance authorizes)
    this.activeStaffId = this.staff[2].id; // Dr Vance
    const rep1 = this.authorizeReport(ord1.id, sub1.id, 'All clinical indices normal. Released.');
    this.releaseReport(rep1.id, `reports/${rep1.report_number}.pdf`);

    // 2. Order in "awaiting review" state with a CRITICAL value + documented communication
    this.activeStaffId = this.staff[1].id; // Tech David
    const p2 = this.patients[1]; // Sadie Adler
    const ord2 = this.createOrder({
      patientId: p2.id,
      testIds: [this.tests[1].id], // Fasting Glucose
      orderingPhysician: 'Dr. John Watson, MD',
      clinicalIndication: 'Severe fatigue, hypoglycemia rule-out',
      priority: 'urgent',
    });

    this.updateSpecimenStatus(ord2.specimens[0].id, 'collect_and_receive');
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
    });

    this.submitForReview(
      ord2.id,
      'Glucose hexokinase calibration run and verified with Level 1 & Level 2 controls.'
    );

    // 3. Order in "awaiting collection" state (Lipid panel)
    const p3 = this.patients[2];
    this.createOrder({
      patientId: p3.id,
      testIds: [this.tests[2].id], // Lipid Panel
      orderingPhysician: 'Dr. Sarah Connor, MD',
      clinicalIndication: 'Annual wellness check',
      priority: 'routine',
    });

    // Reset default active staff to Lab Staff
    this.activeStaffId = this.staff[1].id;
  }
}

// Global singleton instance
const globalStore = new DiagnosticLabStore();
export { globalStore };
