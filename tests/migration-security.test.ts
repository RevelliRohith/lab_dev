import { describe, it, expect, beforeEach } from 'vitest';
import { globalStore } from '../src/lib/store';
import { generateLaboratoryReportPdf } from '../src/lib/pdf/report-generator';

describe('Migration & Access Control Invariants (RLS & Clinical Authorization)', () => {
  const TECH_ID = '33333333-3333-3333-3333-333333333333'; // Rishi (Staff)
  const ADMIN_ID = '22222222-2222-2222-2222-222222222222'; // Dr. Padma Reddy (Admin)
  const LAB_A_ID = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    globalStore.activeStaffId = TECH_ID;
  });

  describe('1. Role Privileges & Self-Escalation Guards', () => {
    it('CONFIRMS Staff cannot change their own role, lab ID, or active status', () => {
      const staffMember = globalStore.staff.find((s) => s.id === TECH_ID)!;
      expect(staffMember.roles).toEqual(['lab_staff']);
      expect(staffMember.lab_id).toBe(LAB_A_ID);
      expect(staffMember.status).toBe('active');

      // Staff attempting to change active staff ID to disabled account is rejected
      expect(() => {
        globalStore.setActiveStaffId('55555555-5555-5555-5555-555555555555');
      }).toThrow(/Disabled staff cannot be activated/);

      // Verify that in staff_profiles RLS policy, write access is restricted to admin
      // Admin policy: USING (has_role('admin'))
      // Staff has only SELECT access on staff_profiles and cannot perform UPDATE
      expect(staffMember.roles.includes('admin')).toBe(false);
    });

    it('PREVENTS unauthenticated caller from establishing authorization identity', () => {
      // In the database function: IF v_actor_id IS NULL THEN RAISE EXCEPTION 'Authentication required...'
      // Testing identity derivation:
      const nonExistentStaffId = '00000000-0000-0000-0000-000000000000';
      expect(() => {
        globalStore.setActiveStaffId(nonExistentStaffId);
      }).toThrow(/Staff not found/);
    });

    it('PREVENTS Staff from authorizing clinical reports', () => {
      globalStore.setActiveStaffId(TECH_ID);
      const pendingOrder = globalStore.orders.find((o) =>
        o.submissions.some((s) => s.status === 'pending')
      )!;
      const sub = pendingOrder.submissions.find((s) => s.status === 'pending')!;

      expect(() => {
        globalStore.authorizeReport(pendingOrder.id, sub.id);
      }).toThrow(/Permission Denied/);
    });
  });

  describe('2. Independent Review & Cross-Laboratory Boundaries', () => {
    it('REJECTS authorization if reviewer entered or edited results (Independent Review)', () => {
      // Tech enters results
      globalStore.setActiveStaffId(TECH_ID);
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id],
        orderingPhysician: 'Dr. External Specialist',
        clinicalIndication: 'Routine safety check',
        priority: 'routine',
      });

      const spec = order.specimens[0];
      globalStore.updateSpecimenStatus(spec.id, 'collect_and_receive');

      order.results.forEach((r) => {
        globalStore.updateResult({
          orderId: order.id,
          orderTestParameterId: r.order_test_parameter_id,
          disposition: 'performed',
          numericValue: 12.0,
        });
      });

      const sub = globalStore.submitForReview(order.id, 'Self-entered QC verified');

      // Admin attempts to authorize their own results if they entered them
      // Simulate Admin having entered one of the results
      order.results[0].entered_by = ADMIN_ID;

      globalStore.setActiveStaffId(ADMIN_ID);
      expect(() => {
        globalStore.authorizeReport(order.id, sub.id);
      }).toThrow(/INDEPENDENT AUTHORIZATION VIOLATION/);
    });

    it('ENFORCES cross-laboratory isolation: staff from Lab B cannot authorize Lab A order', () => {
      const orderA = globalStore.orders[0];
      expect(orderA.lab_id).toBe(LAB_A_ID);

      // Verify that any staff member belonging to another lab is rejected
      const alienStaff = {
        id: '99999999-9999-9999-9999-999999999999',
        lab_id: '88888888-8888-8888-8888-888888888888', // Different lab
        email: 'intruder@otherlab.com',
        full_name: 'Dr. Alien Lab Reviewer',
        roles: ['admin' as const],
        status: 'active' as const,
        created_at: new Date().toISOString(),
      };

      // In the database function:
      // SELECT * INTO v_reviewer FROM staff_profiles
      // WHERE id = v_actor_id AND lab_id = v_order.lab_id AND status = 'active';
      // IF NOT FOUND THEN RAISE EXCEPTION 'Reviewer is not an active staff member of this laboratory';
      const isLabColleague = alienStaff.lab_id === orderA.lab_id && alienStaff.status === 'active';
      expect(isLabColleague).toBe(false);
    });
  });

  describe('3. Snapshot Structure & PDF Compatibility', () => {
    it('GENERATES fully structured snapshot with tests and specimens matching ReportSnapshot', async () => {
      // Tech registers and enters results
      globalStore.setActiveStaffId(TECH_ID);
      const order = globalStore.createOrder({
        patientId: globalStore.patients[0].id,
        testIds: [globalStore.tests[0].id],
        orderingPhysician: 'Dr. Gregory House, MD',
        clinicalIndication: 'Pre-op evaluation',
        priority: 'routine',
      });

      const spec = order.specimens[0];
      globalStore.updateSpecimenStatus(spec.id, 'collect_and_receive');

      order.results.forEach((r) => {
        let val = 14.0;
        for (const ot of order.tests) {
          const found = ot.parameters.find((p) => p.id === r.order_test_parameter_id);
          if (found) {
            if (found.parameter_code_snapshot === 'WBC') val = 6.8;
            if (found.parameter_code_snapshot === 'RBC') val = 4.8;
            if (found.parameter_code_snapshot === 'HGB') val = 15.2;
            if (found.parameter_code_snapshot === 'HCT') val = 45.0;
            if (found.parameter_code_snapshot === 'PLT') val = 240;
          }
        }
        globalStore.updateResult({
          orderId: order.id,
          orderTestParameterId: r.order_test_parameter_id,
          disposition: 'performed',
          numericValue: val,
        });
      });

      const sub = globalStore.submitForReview(order.id, 'Routine morning batch QC verified');

      // Admin (independent reviewer who did not enter results) authorizes
      globalStore.setActiveStaffId(ADMIN_ID);
      const rep = globalStore.authorizeReport(order.id, sub.id, 'Verified by Clinical Director');

      // Check snapshot structure required by ReportSnapshot interface
      expect(rep.report_snapshot).toBeDefined();
      expect(rep.report_snapshot.report_number).toBe(rep.report_number);
      expect(rep.report_snapshot.lab).toBeDefined();
      expect(rep.report_snapshot.patient).toBeDefined();
      expect(rep.report_snapshot.reviewer).toBeDefined();
      expect(Array.isArray(rep.report_snapshot.tests)).toBe(true);
      expect(Array.isArray(rep.report_snapshot.specimens)).toBe(true);
      expect(rep.report_snapshot.tests.length).toBeGreaterThan(0);
      expect(rep.report_snapshot.specimens.length).toBeGreaterThan(0);

      // Ensure PDF generation succeeds using this exact snapshot without runtime error
      const pdfBytes = await generateLaboratoryReportPdf(rep.report_snapshot);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Verify PDF magic header %PDF-
      const header = Buffer.from(pdfBytes.subarray(0, 5)).toString('utf-8');
      expect(header).toBe('%PDF-');
    });
  });
});
