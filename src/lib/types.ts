// Core domain types for Diagnostic Laboratory Management System

export type UserRole = 'admin' | 'lab_staff' | 'authorized_reviewer';

export type SpecimenStatus =
  | 'awaiting_collection'
  | 'collected'
  | 'received'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ResultFlag = 'normal' | 'abnormal' | 'critical' | 'inconclusive';

export type ResultDisposition = 'performed' | 'not_performed' | 'cancelled';

export type SubmissionStatus =
  | 'pending'
  | 'returned'
  | 'authorized'
  | 'invalidated_by_edit'
  | 'superseded';

export type ReportStatus = 'authorized' | 'released' | 'superseded';

export type PaymentStatus = 'unpaid' | 'part_paid' | 'paid' | 'refunded';

export type OrderPriority = 'routine' | 'urgent' | 'stat';

export interface LabProfile {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  currency_code: string;
  timezone: string;
  clinical_director: string;
  lab_license_number: string;
  report_header_text: string;
  report_footer_text: string;
  max_staff_discount_percentage: number;
  critical_alert_phone: string;
}

export interface StaffProfile {
  id: string;
  lab_id: string;
  email: string;
  full_name: string;
  status: 'active' | 'disabled' | 'invited';
  mfa_enabled: boolean;
  phone?: string;
  roles: UserRole[];
  reviewer_scope?: ReviewerScope;
}

export interface ReviewerScope {
  id: string;
  staff_id: string;
  credentials_title: string;
  verified_scopes: string[]; // e.g. ['HEM', 'BIO', 'MICRO', 'ALL']
  valid_from: string; // YYYY-MM-DD
  valid_to: string; // YYYY-MM-DD
  is_active: boolean;
}

export interface Patient {
  id: string;
  lab_id: string;
  patient_number: string; // PAT-2026-0001
  full_name: string;
  sex: 'male' | 'female' | 'other';
  date_of_birth?: string; // YYYY-MM-DD
  estimated_age_years?: number;
  is_age_estimated: boolean;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  clinical_notes?: string;
  created_at: string;
}

export interface TestParameter {
  id: string;
  test_definition_id: string;
  code: string; // HGB, WBC
  name: string;
  result_type: 'numeric' | 'qualitative' | 'text';
  unit?: string;
  display_order: number;
  is_active: boolean;
}

export interface ReferenceRange {
  id: string;
  test_parameter_id: string;
  sex?: 'male' | 'female' | 'all';
  age_min_days: number;
  age_max_days: number;
  normal_low?: number;
  normal_high?: number;
  critical_low?: number;
  critical_high?: number;
  qualitative_expected?: string;
  clinical_interpretation?: string;
  version: number;
  is_active: boolean;
}

export interface TestDefinition {
  id: string;
  lab_id: string;
  code: string; // CBC, GLU, LIPID
  name: string;
  department: string; // HEM, BIO, MICRO, etc.
  price: number;
  turnaround_hours: number;
  specimen_type: string;
  container_type: string;
  fasting_required: boolean;
  instructions?: string;
  is_panel: boolean;
  is_active: boolean;
  parameters: TestParameter[];
}

export interface OrderTestParameterInstance {
  id: string;
  order_test_id: string;
  test_parameter_id: string;
  parameter_name_snapshot: string;
  parameter_code_snapshot: string;
  result_type_snapshot: 'numeric' | 'qualitative' | 'text';
  unit_snapshot?: string;
  reference_range_snapshot: {
    normal_low?: number;
    normal_high?: number;
    critical_low?: number;
    critical_high?: number;
    qualitative_expected?: string;
    description?: string;
  };
  display_order: number;
}

export interface OrderTestInstance {
  id: string;
  order_id: string;
  test_definition_id: string;
  test_name_snapshot: string;
  test_code_snapshot: string;
  test_price_snapshot: number;
  department_snapshot: string;
  parameters: OrderTestParameterInstance[];
}

export interface Specimen {
  id: string;
  lab_id: string;
  order_id: string;
  specimen_number: string; // SPEC-2026-0001
  specimen_type: string;
  container_type: string;
  status: SpecimenStatus;
  collected_at?: string;
  collected_by?: string;
  received_at?: string;
  received_by?: string;
  completed_at?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  parent_specimen_id?: string;
  created_at: string;
}

export interface SpecimenEvent {
  id: string;
  specimen_id: string;
  event_type: string;
  previous_status?: string;
  new_status: string;
  actor_id?: string;
  notes?: string;
  created_at: string;
}

export interface Result {
  id: string;
  order_test_parameter_id: string;
  order_id: string;
  disposition: ResultDisposition;
  non_performed_reason?: string;
  numeric_value?: number;
  text_value?: string;
  flag: ResultFlag;
  entered_by?: string;
  entered_at?: string;
  last_edited_by?: string;
  last_edited_at?: string;
  revision: number;
}

export interface ResultRevision {
  id: string;
  result_id: string;
  revision_number: number;
  numeric_value?: number;
  text_value?: string;
  flag: ResultFlag;
  disposition: ResultDisposition;
  edited_by?: string;
  edited_at: string;
  reason_for_edit?: string;
}

export interface ReviewSubmission {
  id: string;
  order_id: string;
  submitted_by: string;
  submitted_at: string;
  status: SubmissionStatus;
  qa_checks_attested: boolean;
  qa_attestation_notes: string;
  result_revision_snapshots: Record<string, unknown>;
}

export interface ReviewDecision {
  id: string;
  review_submission_id: string;
  reviewer_id: string;
  decision: 'returned_for_correction' | 'authorized';
  comments: string;
  decision_at: string;
}

export interface CriticalNotification {
  id: string;
  order_id: string;
  order_test_parameter_id: string;
  parameter_name: string;
  critical_value_summary: string;
  recipient_name: string;
  recipient_role_phone: string;
  notification_method: 'phone_call' | 'in_person' | 'secure_messaging';
  attempted_at: string;
  acknowledged_at?: string;
  read_back_confirmed: boolean;
  escalation_status: 'pending_acknowledgement' | 'resolved' | 'escalated_to_supervisor';
  notes?: string;
  communicated_by: string;
}

export interface ReportVersion {
  id: string;
  order_id: string;
  version_number: number;
  report_number: string; // REP-2026-0001-v1
  status: ReportStatus;
  report_snapshot: ReportSnapshot;
  authorized_by: string;
  authorized_at: string;
  pdf_storage_path?: string;
  released_at?: string;
  released_by?: string;
  amendment_reason?: string;
  prior_report_version_id?: string;
  correction_communication_notes?: string;
  created_at: string;
}

export interface ReportSnapshot {
  report_number: string;
  version: number;
  order_number: string;
  ordering_physician?: string;
  clinical_indication?: string;
  lab: {
    name: string;
    address: string;
    phone: string;
    email: string;
    director: string;
    license: string;
    header_text: string;
    footer_text: string;
    timezone: string;
  };
  patient: {
    patient_number: string;
    full_name: string;
    sex: string;
    date_of_birth?: string;
    estimated_age_years?: number;
    is_age_estimated: boolean;
    phone: string;
  };
  reviewer: {
    full_name: string;
    credentials: string;
    authorized_at: string;
  };
  qa_attestation: {
    attested: boolean;
    notes: string;
    submitted_at: string;
  };
  tests: {
    test_name: string;
    test_code: string;
    department: string;
    parameters: {
      parameter_name: string;
      parameter_code: string;
      result_type: string;
      unit?: string;
      reference_range: Record<string, unknown>;
      disposition: ResultDisposition;
      non_performed_reason?: string;
      numeric_value?: number;
      text_value?: string;
      flag: ResultFlag;
    }[];
  }[];
  specimens: {
    specimen_number: string;
    type: string;
    container: string;
    collected_at?: string;
    received_at?: string;
  }[];
}

export interface Order {
  id: string;
  lab_id: string;
  order_number: string; // ORD-2026-0001
  patient_id: string;
  ordering_physician?: string;
  clinical_indication?: string;
  priority: OrderPriority;
  status: 'created' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: PaymentStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joins
  patient?: Patient;
  tests: OrderTestInstance[];
  specimens: Specimen[];
  results: Result[];
  submissions: ReviewSubmission[];
  report_versions: ReportVersion[];
  critical_notifications: CriticalNotification[];
  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  lab_id: string;
  order_id: string;
  invoice_number: string; // INV-2026-0001
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  discount_reason?: string;
  total_amount: number;
  amount_paid: number;
  amount_refunded: number;
  balance_due: number;
  status: PaymentStatus;
  items: InvoiceItem[];
  payments: Payment[];
  refunds: Refund[];
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  order_test_id: string;
  description: string;
  unit_price: number;
  quantity: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_number: string; // PAY-2026-0001
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check';
  reference_note?: string;
  idempotency_key: string;
  recorded_by: string;
  recorded_at: string;
}

export interface Refund {
  id: string;
  invoice_id: string;
  payment_id?: string;
  amount: number;
  reason: string;
  authorized_by: string;
  idempotency_key: string;
  recorded_at: string;
}

export interface Expense {
  id: string;
  lab_id: string;
  category: 'reagents' | 'consumables' | 'utilities' | 'maintenance' | 'other';
  amount: number;
  vendor: string;
  description: string;
  receipt_reference?: string;
  expense_date: string;
  recorded_by: string;
  recorded_at: string;
}

export interface AuditEvent {
  id: string;
  lab_id: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}
