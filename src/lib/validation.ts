import { z } from 'zod';

// Patient Validation Schema
export const patientSchema = z.object({
  fullName: z.string().min(2, 'Patient full name is required').max(150),
  sex: z.enum(['male', 'female', 'other'], { required_error: 'Sex is required' }),
  isAgeEstimated: z.boolean().default(false),
  dateOfBirth: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Date of birth cannot be in the future'),
  estimatedAgeYears: z.number().int().min(0).max(125).optional(),
  phone: z.string().min(6, 'Valid phone number is required').max(30),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  clinicalNotes: z.string().max(1000).optional(),
}).refine((data) => {
  if (data.isAgeEstimated) {
    return data.estimatedAgeYears !== undefined && data.estimatedAgeYears >= 0;
  }
  return !!data.dateOfBirth;
}, {
  message: 'Either Date of Birth or an Estimated Age is required',
  path: ['dateOfBirth'],
});

// Order Creation Schema
export const orderSchema = z.object({
  patientId: z.string().uuid('Valid patient selection is required'),
  testIds: z.array(z.string().uuid()).min(1, 'At least one test must be selected'),
  orderingPhysician: z.string().max(120).optional(),
  clinicalIndication: z.string().max(300).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountReason: z.string().max(250).optional(),
});

// Specimen Transition Schema
export const specimenActionSchema = z.object({
  specimenId: z.string().uuid(),
  action: z.enum(['collect', 'receive', 'collect_and_receive', 'complete', 'reject', 'cancel']),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.action === 'reject' || data.action === 'cancel') {
    return !!data.reason && data.reason.trim().length > 0;
  }
  return true;
}, {
  message: 'Reason is mandatory when rejecting or cancelling a specimen',
  path: ['reason'],
});

// Result Entry Schema
export const resultEntrySchema = z.object({
  orderTestParameterId: z.string().uuid(),
  disposition: z.enum(['performed', 'not_performed', 'cancelled']),
  numericValue: z.number().nullable().optional(),
  textValue: z.string().nullable().optional(),
  nonPerformedReason: z.string().max(250).optional(),
  flag: z.enum(['normal', 'abnormal', 'critical', 'inconclusive']).default('normal'),
}).refine((data) => {
  if (data.disposition === 'not_performed' || data.disposition === 'cancelled') {
    return !!data.nonPerformedReason && data.nonPerformedReason.trim().length > 0;
  }
  if (data.disposition === 'performed') {
    return (data.numericValue !== null && data.numericValue !== undefined) ||
           (!!data.textValue && data.textValue.trim().length > 0);
  }
  return true;
}, {
  message: 'Performed results require a numeric or text value; non-performed results require a documented reason',
  path: ['numericValue'],
});

// Submit for Review Schema
export const submitForReviewSchema = z.object({
  orderId: z.string().uuid(),
  qaChecksAttested: z.literal(true, {
    errorMap: () => ({ message: 'Documented Quality Check Attestation is mandatory before submitting' }),
  }),
  qaAttestationNotes: z.string().min(5, 'Quality attestation details must be documented'),
});

// Critical Notification Schema
export const criticalNotificationSchema = z.object({
  orderId: z.string().uuid(),
  orderTestParameterId: z.string().uuid(),
  parameterName: z.string(),
  criticalValueSummary: z.string().min(1, 'Critical value summary is required'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientRolePhone: z.string().min(3, 'Recipient role and phone are required'),
  notificationMethod: z.enum(['phone_call', 'in_person', 'secure_messaging']),
  readBackConfirmed: z.boolean().default(false),
  escalationStatus: z.enum(['pending_acknowledgement', 'resolved', 'escalated_to_supervisor']),
  notes: z.string().optional(),
});

// Authorize Report Schema
export const authorizeReportSchema = z.object({
  orderId: z.string().uuid(),
  submissionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  comments: z.string().max(500).default('Authorized for release'),
});

// Return for Correction Schema
export const returnForCorrectionSchema = z.object({
  submissionId: z.string().uuid(),
  comments: z.string().min(5, 'Mandatory clinical reason is required when returning results for correction'),
});

// Payment Recording Schema
export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'check']),
  referenceNote: z.string().max(100).optional(),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

// Refund Recording Schema
export const refundSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
  amount: z.number().positive('Refund amount must be greater than 0'),
  reason: z.string().min(5, 'A documented reason is mandatory for processing a refund'),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

// Expense Recording Schema
export const expenseSchema = z.object({
  category: z.enum(['reagents', 'consumables', 'utilities', 'maintenance', 'other']),
  amount: z.number().positive('Expense amount must be greater than 0'),
  vendor: z.string().min(2, 'Vendor name is required').max(120),
  description: z.string().min(3, 'Description is required').max(250),
  receiptReference: z.string().max(100).optional(),
  expenseDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), 'Valid date is required'),
});

// Amendment Schema
export const amendmentSchema = z.object({
  priorReportVersionId: z.string().uuid(),
  amendmentReason: z.string().min(10, 'A detailed clinical reason is mandatory when issuing an amendment'),
  correctionCommunicationNotes: z.string().min(10, 'Documented communication of material correction is required'),
});
