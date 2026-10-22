import { NextRequest, NextResponse } from 'next/server';
import { globalStore } from '@/lib/store';
import {
  generateLaboratoryReportPdf,
  buildDraftSnapshot,
  cleanText,
} from '@/lib/pdf/report-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isDraft = request.nextUrl.searchParams.get('draft') === 'true';

  // 1. If draft preview requested for an order that is awaiting authorization
  if (isDraft) {
    const order = globalStore.orders.find(
      (o) => o.id === id || o.order_number === id || o.order_number.toLowerCase() === id.toLowerCase()
    );
    if (order && order.patient) {
      const draftSnapshot = buildDraftSnapshot(order, globalStore.lab);
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

  // 2. Find report version in globalStore
  let reportVersion = undefined;
  for (const o of globalStore.orders) {
    const found = o.report_versions.find(
      (r) =>
        r.id === id ||
        r.report_number === id ||
        r.report_number.toLowerCase() === id.toLowerCase() ||
        r.report_number.replace(/-v\d+$/, '').toLowerCase() === id.toLowerCase()
    );
    if (found) {
      reportVersion = found;
      break;
    }
  }

  // 3. If not found by report ID or report number, check if id is an order ID that has a report
  if (!reportVersion) {
    const order = globalStore.orders.find(
      (o) => o.id === id || o.order_number === id || o.order_number.toLowerCase() === id.toLowerCase()
    );
    if (order && order.report_versions.length > 0) {
      reportVersion = order.report_versions[0];
    }
  }

  // 4. If still not found, return 404
  if (!reportVersion) {
    return NextResponse.json(
      {
        error: 'Report not found',
        message: `No clinical report matched identifier "${id}". If this report was authorized in a client session, please download directly from the browser reports view.`,
      },
      { status: 404 }
    );
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { snapshot, options } = body;
    if (!snapshot) {
      return NextResponse.json({ error: 'Missing snapshot in request body' }, { status: 400 });
    }

    const pdfBytes = await generateLaboratoryReportPdf(snapshot, options);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${snapshot.report_number || 'report'}.pdf"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
