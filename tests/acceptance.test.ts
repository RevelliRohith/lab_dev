import { describe, it, expect, beforeEach } from 'vitest';
import { globalStore } from '../src/lib/store';
import { sanitizeCsvCell, generateCsv } from '../src/lib/export';
import { generateLaboratoryReportPdf } from '../src/lib/pdf/report-generator';

describe('Diagnostic Laboratory Safety & Invariants', () => {
  beforeEach(() => {
    // Reset to tech David Chen
    globalStore.activeStaffId = '33333333-3333-3333-3333-333333333333';
  });

  describe('1. Role Boundaries & Authorization Integrity (Strict Two-Role Architecture: Admin & Staff)', () => {
    it('prevents Lab Staff from authorizing clinical reports', () => {
      // Active user is Lab Staff (Rishi)
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');

      // Find an order awaiting review
      const orderAwaiting = globalStore.orders.find((o) =>
        o.submissions.some((s) => s.status === 'pending')
      );
      expect(orderAwaiting).toBeDefined();
      const sub = orderAwaiting!.submissions.find((s) => s.status === 'pending')!;

      // Staff cannot authorize reports
      expect(() => {
        globalStore.authorizeReport(orderAwaiting!.id, sub.id);
      }).toThrow(/Permission Denied: Only Admin \(Clinical Director\) or Authorized Clinical Reviewer may authorize reports/);
    });

    it('permits Admin (Clinical Director) to authorize clinical reports', () => {
      // Switch to Admin (Padma Reddy)
      globalStore.setActiveStaffId('22222222-2222-2222-2222-222222222222');

      const orderAwaiting = globalStore.orders.find((o) =>
        o.submissions.some((s) => s.status === 'pending')
      );
      expect(orderAwaiting).toBeDefined();
      const sub = orderAwaiting!.submissions.find((s) => s.status === 'pending')!;

      // Admin authorizes report directly
      const rep = globalStore.authorizeReport(orderAwaiting!.id, sub.id, 'Clinical Director review verified');
      expect(rep.status).toBe('authorized');
      expect(rep.authorized_by).toBe('22222222-2222-2222-2222-222222222222');
      expect(rep.report_snapshot.reviewer.full_name).toContain('Padma');
    });

    it('enforces INDEPENDENT clinical authorization: reviewer cannot authorize results they entered', () => {
      // Tech creates an order
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[1].id], // Glucose
      });
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');

      // Now suppose Admin (Padma) enters the result herself
      globalStore.setActiveStaffId('22222222-2222-2222-2222-222222222222');
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 92,
      });

      // Submit for review
      const sub = globalStore.submitForReview(order.id, 'Daily glucose QC verified in control.');

      // Admin attempts to authorize results that she personally entered
      expect(() => {
        globalStore.authorizeReport(order.id, sub.id);
      }).toThrow(/INDEPENDENT AUTHORIZATION VIOLATION/);
    });

    it('rejects access from disabled staff members', () => {
      // Try activating Mark Wood (disabled)
      expect(() => {
        globalStore.setActiveStaffId('55555555-5555-5555-5555-555555555555');
      }).toThrow(/Disabled staff cannot be activated/);
    });
  });

  describe('2. Specimen Lifecycle & Recollection Safety', () => {
    it('requires a mandatory reason when rejecting a specimen and links recollection', () => {
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id],
      });
      const spec = order.specimens[0];

      // Empty rejection reason must fail
      expect(() => {
        globalStore.updateSpecimenStatus(spec.id, 'reject', '');
      }).toThrow(/Rejection reason is mandatory/);

      // Valid rejection creates linked replacement
      globalStore.updateSpecimenStatus(spec.id, 'reject', 'Severely hemolyzed specimen');
      expect(spec.status).toBe('rejected');
      expect(spec.rejection_reason).toBe('Severely hemolyzed specimen');

      // A replacement specimen should exist in order linked to parent
      const replacement = order.specimens.find((s) => s.parent_specimen_id === spec.id);
      expect(replacement).toBeDefined();
      expect(replacement!.status).toBe('awaiting_collection');
    });

    it('prevents invalid specimen transitions', () => {
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id],
      });
      const spec = order.specimens[0];

      // Cannot receive a specimen before it is collected
      expect(() => {
        globalStore.updateSpecimenStatus(spec.id, 'receive');
      }).toThrow(/Specimen must be collected before receiving/);
    });
  });

  describe('3. Completeness & Critical Result Safeguards', () => {
    it('blocks submission for review if parameters are missing results or dispositions', () => {
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id], // CBC (5 parameters)
      });
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');

      // Only enter 1 out of 5 parameters
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 5.5,
      });

      expect(() => {
        globalStore.submitForReview(order.id, 'QC verified');
      }).toThrow(/Cannot submit for review: 4 parameter\(s\) are missing results/);
    });

    it('blocks authorization if a critical result lacks confirmed communication', () => {
      // Tech creates urgent test with critical glucose (35 mg/dL)
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[1].id,
        testIds: [globalStore.tests[1].id],
      });
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 35.0, // Critical
      });

      const sub = globalStore.submitForReview(order.id, 'QC verified.');

      // Reviewer tries to authorize without critical notification recorded
      globalStore.setActiveStaffId('44444444-4444-4444-4444-444444444444');
      expect(() => {
        globalStore.authorizeReport(order.id, sub.id);
      }).toThrow(/critical results lack documented and acknowledged communication/);

      // Now record confirmed communication
      globalStore.logCriticalNotification({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        parameterName: 'Glucose',
        criticalValueSummary: '35.0 mg/dL',
        recipientName: 'Dr. Gregory House',
        recipientRolePhone: 'Attending Physician (+1 555-900-1122)',
        notificationMethod: 'phone_call',
        readBackConfirmed: true,
        escalationStatus: 'resolved',
      });

      // Authorization now succeeds cleanly!
      const report = globalStore.authorizeReport(order.id, sub.id);
      expect(report.status).toBe('authorized');
      expect(report.version_number).toBe(1);
    });
  });

  describe('4. Financial Invariants & Refund Controls', () => {
    it('recalculates balances accurately on partial payments and refunds', () => {
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id], // $35
      });
      const inv = order.invoice!;
      expect(inv.balance_due).toBe(35);
      expect(inv.status).toBe('unpaid');

      // Record partial payment of $20
      globalStore.recordPayment({
        invoiceId: inv.id,
        amount: 20,
        paymentMethod: 'cash',
        idempotencyKey: 'PAY-TEST-001',
      });
      expect(inv.amount_paid).toBe(20);
      expect(inv.balance_due).toBe(15);
      expect(inv.status).toBe('part_paid');

      // Pay remaining $15
      globalStore.recordPayment({
        invoiceId: inv.id,
        amount: 15,
        paymentMethod: 'card',
        idempotencyKey: 'PAY-TEST-002',
      });
      expect(inv.amount_paid).toBe(35);
      expect(inv.balance_due).toBe(0);
      expect(inv.status).toBe('paid');

      // Non-admin cannot issue refunds
      expect(() => {
        globalStore.recordRefund({
          invoiceId: inv.id,
          amount: 10,
          reason: 'Patient cancellation of single parameter',
          idempotencyKey: 'REF-TEST-001',
        });
      }).toThrow(/Permission Denied: Only Admin can authorize refunds/);

      // Switch to Admin
      globalStore.setActiveStaffId('22222222-2222-2222-2222-222222222222');

      // Refund cannot exceed net paid
      expect(() => {
        globalStore.recordRefund({
          invoiceId: inv.id,
          amount: 50, // exceeds $35
          reason: 'Excessive refund test',
          idempotencyKey: 'REF-TEST-002',
        });
      }).toThrow(/exceed net paid balance/);

      // Valid refund of $10
      globalStore.recordRefund({
        invoiceId: inv.id,
        amount: 10,
        reason: 'Duplicate billing adjustment',
        idempotencyKey: 'REF-TEST-003',
      });
      expect(inv.amount_refunded).toBe(10);
      expect(inv.balance_due).toBe(10);
      expect(inv.status).toBe('part_paid');
    });
  });

  describe('5. CSV Formula Injection Protection', () => {
    it('escapes cells starting with =, +, -, @, \\t, \\r', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      expect(sanitizeCsvCell('+12345')).toBe('"\'+12345"');
      expect(sanitizeCsvCell('-cmd|calc')).toBe('"\'-cmd|calc"');
      expect(sanitizeCsvCell('@cmd')).toBe('"\'@cmd"');
      expect(sanitizeCsvCell('Normal Text')).toBe('"Normal Text"');
      expect(sanitizeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    it('generates compliant CSV table with headers and rows', () => {
      const headers = ['Order Number', 'Patient', 'Amount'];
      const rows = [
        ['ORD-001', 'John Doe', 35.0],
        ['ORD-002', '=2+2', 18.0],
      ];
      const csv = generateCsv(headers, rows);
      expect(csv).toContain('"Order Number","Patient","Amount"');
      expect(csv).toContain('"ORD-002","\'=2+2","18"');
    });
  });

  describe('6. Report Snapshot & PDF Generation', () => {
    it('generates an A4 PDF from snapshot with valid headers and watermark', async () => {
      const order = globalStore.orders.find((o) => o.report_versions.length > 0);
      expect(order).toBeDefined();
      const rep = order!.report_versions[0];
      expect(rep).toBeDefined();

      const pdfBytes = await generateLaboratoryReportPdf(rep.report_snapshot, {
        isDraftPreview: false,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000); // Standard A4 PDF size
    });
  });

  describe('7. Result Entry Workflow & Authorization Safeguards', () => {
    it('saves parameter results and requires independent clinical review before release', async () => {
      // 1. Staff creates a fresh order for Glucose
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333'); // Staff David
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[1].id], // Glucose
      });
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');

      // 2. Staff enters test result (Save Results)
      const paramId = order.results[0].order_test_parameter_id;
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: paramId,
        disposition: 'performed',
        numericValue: 88.5,
      });

      // Assert result is saved in store
      expect(order.results[0].numeric_value).toBe(88.5);
      expect(order.results[0].disposition).toBe('performed');
      expect(order.results[0].flag).toBe('normal');

      // 3. Submit for review (QA attestation)
      const sub = globalStore.submitForReview(
        order.id,
        'Daily analyzer calibration and controls verified in acceptable limits.'
      );
      expect(sub.status).toBe('pending');

      // Safeguard: Order must NOT have a report released yet
      expect(order.report_versions.length).toBe(0);

      // 4. Authorized reviewer (Dr. Rishika) clinically authorizes and releases report
      globalStore.setActiveStaffId('44444444-4444-4444-4444-444444444444');
      const newReport = globalStore.authorizeReport(
        order.id,
        sub.id,
        'Clinically verified and authorized for diagnostic release.'
      );
      expect(newReport.status).toBe('authorized');
      expect(newReport.report_snapshot.reviewer.full_name).toContain('Dr. Rishika');

      // Release report
      const released = globalStore.releaseReport(newReport.id, `reports/${newReport.report_number}.pdf`);
      expect(released.status).toBe('released');
      expect(order.status).toBe('completed');
      expect(order.report_versions.length).toBe(1);

      // 5. Verify PDF generation for the finalized authorized report
      const pdfBytes = await generateLaboratoryReportPdf(released.report_snapshot);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });
  });

  describe('8. Dynamic Catalogue Range Resolution & Regression Protection', () => {
    it('resolves ranges dynamically from configured component library without 10-100 fallback', () => {
      // Create order with Fasting Glucose for an adult male
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id, // Arthur Morgan (Male)
        testIds: [globalStore.tests[1].id], // Glucose Fasting
      });

      const gluParam = order.tests[0].parameters[0];
      const rr = gluParam.reference_range_snapshot;

      // Assert it resolves from component library (70.0 - 99.0, NOT 10 - 100!)
      expect(rr.normal_low).toBe(70.0);
      expect(rr.normal_high).toBe(99.0);
      expect(rr.critical_low).toBe(45.0);
      expect(rr.critical_high).toBe(400.0);
      expect(rr.is_unspecified).toBeFalsy();

      // REGRESSION CASE: 35 mg/dL was previously considered "normal" under 10-100 fallback!
      // Must be flagged as CRITICAL under configured glucose range!
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');
      const res = globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: gluParam.id,
        disposition: 'performed',
        numericValue: 35.0,
      });

      expect(res.flag).toBe('critical'); // 35 <= critical_low (45.0)
    });

    it('resolves demographic female-specific ranges correctly', () => {
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[1].id, // Sadie Adler (Female)
        testIds: [globalStore.tests[0].id], // CBC
      });

      // Find Hemoglobin parameter
      const hgbParam = order.tests[0].parameters.find((p) => p.parameter_code_snapshot === 'HGB');
      expect(hgbParam).toBeDefined();
      const rr = hgbParam!.reference_range_snapshot;

      // Female normal range is 12.0 - 15.5 g/dL
      expect(rr.normal_low).toBe(12.0);
      expect(rr.normal_high).toBe(15.5);
      expect(rr.description).toContain('Female');
    });
  });

  describe('9. Specimen Readiness Guard on Result Submission', () => {
    it('blocks submission for review when specimen has not been collected and received', () => {
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[1].id],
      });

      // Enter result while specimen is still in awaiting_collection
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 85,
      });

      // Submitting must throw specimen readiness error
      expect(() => {
        globalStore.submitForReview(order.id, 'Attestation notes for test');
      }).toThrow(/has not been collected and received/);
    });

    it('blocks submission for review when specimen is rejected', () => {
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[1].id],
      });

      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect');
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'reject', 'Insufficient quantity');

      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 85,
      });

      expect(() => {
        globalStore.submitForReview(order.id, 'Attestation notes for test');
      }).toThrow(/was rejected.*recollection must be received/i);
    });
  });

  describe('10. Complete Report Amendment Flow (v1 -> v2 Replacement)', () => {
    it('executes full amendment lifecycle: release v1 -> amend reason -> edit -> v2 supersedes v1', () => {
      // 1. Staff creates and completes order
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[1].id], // Glucose
      });
      globalStore.updateSpecimenStatus(order.specimens[0].id, 'collect_and_receive');
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 95.0,
      });

      const sub1 = globalStore.submitForReview(order.id, 'Pre-release QC verified');

      // 2. Admin authorizes and releases v1
      globalStore.setActiveStaffId('22222222-2222-2222-2222-222222222222');
      const rep1 = globalStore.authorizeReport(order.id, sub1.id, 'Initial sign-off');
      const rel1 = globalStore.releaseReport(rep1.id, `reports/${rep1.report_number}.pdf`);
      expect(rel1.status).toBe('released');
      expect(rel1.version_number).toBe(1);

      // 3. Initiate Amendment
      globalStore.createAmendment({
        orderId: order.id,
        amendmentReason: 'Physician requested repeat test verification from primary sample',
      });

      // 4. Update result with re-run value (91.0)
      globalStore.setActiveStaffId('33333333-3333-3333-3333-333333333333');
      globalStore.updateResult({
        orderId: order.id,
        orderTestParameterId: order.results[0].order_test_parameter_id,
        disposition: 'performed',
        numericValue: 91.0,
      });

      const sub2 = globalStore.submitForReview(order.id, 'Re-run on secondary channel confirmed at 91.0 mg/dL');

      // 5. Admin authorizes replacement version (v2)
      globalStore.setActiveStaffId('22222222-2222-2222-2222-222222222222');
      const rep2 = globalStore.authorizeReport(order.id, sub2.id, 'Amended report released');
      const rel2 = globalStore.releaseReport(rep2.id, `reports/${rep2.report_number}.pdf`);

      // 6. Verify versioning invariants
      expect(rel2.version_number).toBe(2);
      expect(rel2.status).toBe('released');
      expect(rel2.prior_report_version_id).toBe(rep1.id);

      // Verify v1 is marked superseded
      expect(rep1.status).toBe('superseded');

      // Both versions preserved in history
      expect(order.report_versions.length).toBe(2);
      expect(order.report_versions[0].version_number).toBe(2);
      expect(order.report_versions[1].version_number).toBe(1);
    });
  });
});
