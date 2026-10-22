import { NextRequest, NextResponse } from 'next/server';
import { globalStore } from '@/lib/store';
import { generateLaboratoryReportPdf } from '@/lib/pdf/report-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isDraft = request.nextUrl.searchParams.get('draft') === 'true';

  // Find order or report version
  let reportVersion = undefined;
  for (const o of globalStore.orders) {
    const found = o.report_versions.find((r) => r.id === id || r.report_number === id);
    if (found) {
      reportVersion = found;
      break;
    }
  }

  // If draft preview requested for an order that is awaiting authorization
  if (!reportVersion && isDraft) {
    const order = globalStore.orders.find((o) => o.id === id || o.order_number === id);
    if (order && order.patient) {
      // Build draft snapshot
      const draftSnapshot = {
        report_number: 'DRAFT-PREVIEW',
        version: 0,
        order_number: order.order_number,
        ordering_physician: order.ordering_physician,
        clinical_indication: order.clinical_indication,
        lab: {
          name: globalStore.lab.name,
          address: globalStore.lab.address,
          phone: globalStore.lab.phone,
          email: globalStore.lab.email,
          director: globalStore.lab.clinical_director,
          license: globalStore.lab.lab_license_number,
          header_text: globalStore.lab.report_header_text,
          footer_text: globalStore.lab.report_footer_text,
          timezone: globalStore.lab.timezone,
        },
        patient: {
          patient_number: order.patient.patient_number,
          full_name: order.patient.full_name,
          sex: order.patient.sex,
          date_of_birth: order.patient.date_of_birth,
          estimated_age_years: order.patient.estimated_age_years,
          is_age_estimated: order.patient.is_age_estimated,
          phone: order.patient.phone,
        },
        reviewer: {
          full_name: 'PENDING CLINICAL AUTHORIZATION',
          credentials: 'UNASSIGNED',
          authorized_at: new Date().toISOString(),
        },
        qa_attestation: {
          attested: order.submissions[0]?.qa_checks_attested || false,
          notes: order.submissions[0]?.qa_attestation_notes || 'Preliminary unverified values',
          submitted_at: order.submissions[0]?.submitted_at || new Date().toISOString(),
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

      const pdfBytes = await generateLaboratoryReportPdf(draftSnapshot, { isDraftPreview: true });
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="draft-report.pdf"',
          'Cache-Control': 'no-store, private',
        },
      });
    }
  }

  if (!reportVersion) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const pdfBytes = await generateLaboratoryReportPdf(reportVersion.report_snapshot, {
    isDraftPreview: false,
    isSuperseded: reportVersion.status === 'superseded',
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${reportVersion.report_number}.pdf"`,
      'Cache-Control': 'no-store, private',
    },
  });
}
