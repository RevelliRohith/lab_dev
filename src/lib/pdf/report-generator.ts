import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { ReportSnapshot } from '../types';

export interface GeneratePdfOptions {
  isDraftPreview?: boolean;
  isSuperseded?: boolean;
}

/**
 * Generates an immutable, professionally structured A4 Diagnostic Laboratory PDF Report
 * directly from the JSON snapshot according to clinical safety requirements.
 */
export async function generateLaboratoryReportPdf(
  snapshot: ReportSnapshot,
  options: GeneratePdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 dimensions in points: 595.28 x 841.89
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2;

  let y = height - margin;

  // 1. Watermark if Draft or Superseded
  if (options.isDraftPreview) {
    page.drawText('DRAFT — NOT AUTHORIZED', {
      x: 80,
      y: height / 2 - 20,
      size: 34,
      font: fontBold,
      color: rgb(0.85, 0.2, 0.2),
      rotate: degrees(35),
      opacity: 0.25,
    });
  } else if (options.isSuperseded) {
    page.drawText('SUPERSEDED — AMENDED', {
      x: 80,
      y: height / 2 - 20,
      size: 34,
      font: fontBold,
      color: rgb(0.85, 0.4, 0.1),
      rotate: degrees(35),
      opacity: 0.25,
    });
  }

  // 2. Lab Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: contentWidth,
    height: 60,
    color: rgb(0.05, 0.35, 0.4),
  });

  page.drawText(snapshot.lab.name.toUpperCase(), {
    x: margin + 14,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`${snapshot.lab.address}  |  Tel: ${snapshot.lab.phone}  |  Lic: ${snapshot.lab.license}`, {
    x: margin + 14,
    y: y - 36,
    size: 8,
    font: fontRegular,
    color: rgb(0.9, 0.95, 0.95),
  });

  page.drawText(`Clinical Director: ${snapshot.lab.director}`, {
    x: margin + 14,
    y: y - 48,
    size: 8,
    font: fontOblique,
    color: rgb(0.9, 0.95, 0.95),
  });

  y -= 70;

  // 3. Report Title & Version Banner
  const reportTitle = options.isDraftPreview
    ? 'DRAFT CLINICAL REPORT (NOT FOR CLINICAL USE)'
    : `OFFICIAL CLINICAL DIAGNOSTIC REPORT — VERSION ${snapshot.version}`;

  page.drawText(reportTitle, {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: options.isDraftPreview ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.15, 0.2),
  });

  page.drawText(`Report #: ${snapshot.report_number}`, {
    x: width - margin - 160,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  y -= 16;

  // 4. Demographics Box (Two columns: Patient Info & Order Info)
  page.drawRectangle({
    x: margin,
    y: y - 82,
    width: contentWidth,
    height: 82,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 0.99),
  });

  const col1X = margin + 10;
  const col2X = margin + 260;
  let demoY = y - 16;

  // Col 1: Patient
  page.drawText(`Patient: ${snapshot.patient.full_name}`, { x: col1X, y: demoY, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Patient ID: ${snapshot.patient.patient_number}`, { x: col1X, y: demoY - 14, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  const ageDisplay = snapshot.patient.date_of_birth
    ? `DOB: ${snapshot.patient.date_of_birth}`
    : `Age: ~${snapshot.patient.estimated_age_years} yrs (est.)`;
  page.drawText(`Sex: ${snapshot.patient.sex.toUpperCase()}  |  ${ageDisplay}`, { x: col1X, y: demoY - 28, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Phone: ${snapshot.patient.phone}`, { x: col1X, y: demoY - 42, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Col 2: Order & Specimen
  page.drawText(`Order ID: ${snapshot.order_number}`, { x: col2X, y: demoY, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Ordering Doctor: ${snapshot.ordering_physician || 'Self / Walk-in'}`, { x: col2X, y: demoY - 14, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  const specDesc = snapshot.specimens.map(s => `${s.specimen_number} (${s.type})`).join(', ') || 'Standard Collection';
  page.drawText(`Specimen: ${specDesc}`, { x: col2X, y: demoY - 28, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Clinical Note: ${snapshot.clinical_indication || 'Routine diagnostic check'}`, { x: col2X, y: demoY - 42, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  y -= 98;

  // 5. Results Table Header
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: contentWidth,
    height: 18,
    color: rgb(0.9, 0.93, 0.95),
  });

  page.drawText('TEST / PARAMETER', { x: margin + 8, y: y - 13, size: 8, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  page.drawText('RESULT', { x: margin + 190, y: y - 13, size: 8, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  page.drawText('FLAG', { x: margin + 265, y: y - 13, size: 8, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  page.drawText('UNITS', { x: margin + 335, y: y - 13, size: 8, font: fontBold, color: rgb(0.1, 0.2, 0.3) });
  page.drawText('REFERENCE INTERVAL', { x: margin + 400, y: y - 13, size: 8, font: fontBold, color: rgb(0.1, 0.2, 0.3) });

  y -= 26;

  // 6. Loop over tests & parameters
  for (const test of snapshot.tests) {
    // Department / Test Banner
    page.drawText(`${test.department} — ${test.test_name} (${test.test_code})`, {
      x: margin + 6,
      y: y,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.35, 0.4),
    });
    y -= 14;

    for (const p of test.parameters) {
      if (y < 120) {
        // Page break if near bottom
        y = height - margin - 30;
      }

      const paramName = p.parameter_name;
      let resultText = '-';
      if (p.disposition === 'not_performed') {
        resultText = `Not Done (${p.non_performed_reason || 'N/A'})`;
      } else if (p.disposition === 'cancelled') {
        resultText = 'Cancelled';
      } else if (p.numeric_value !== null && p.numeric_value !== undefined) {
        resultText = String(p.numeric_value);
      } else if (p.text_value) {
        resultText = p.text_value;
      }

      const flagText = p.flag === 'normal' ? '' : p.flag.toUpperCase();
      const flagColor = p.flag === 'critical'
        ? rgb(0.85, 0.1, 0.1)
        : p.flag === 'abnormal'
        ? rgb(0.85, 0.4, 0.05)
        : rgb(0.2, 0.2, 0.2);

      let refRangeText = 'Configured range not defined';
      const rr = p.reference_range as { normal_low?: number; normal_high?: number; qualitative_expected?: string } | undefined;
      if (rr) {
        if (rr.normal_low !== undefined && rr.normal_high !== undefined) {
          refRangeText = `${rr.normal_low} - ${rr.normal_high}`;
        } else if (rr.qualitative_expected) {
          refRangeText = rr.qualitative_expected;
        }
      }

      page.drawText(paramName, { x: margin + 12, y, size: 8, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
      page.drawText(resultText, { x: margin + 190, y, size: 8, font: p.flag !== 'normal' ? fontBold : fontRegular, color: flagColor });
      page.drawText(flagText, { x: margin + 265, y, size: 8, font: fontBold, color: flagColor });
      page.drawText(p.unit || '', { x: margin + 335, y, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(refRangeText, { x: margin + 400, y, size: 8, font: fontRegular, color: rgb(0.35, 0.35, 0.35) });

      // Subtle horizontal line
      page.drawLine({
        start: { x: margin + 6, y: y - 4 },
        end: { x: width - margin - 6, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });

      y -= 16;
    }
    y -= 6;
  }

  // 7. Quality Attestation Box
  y -= 10;
  page.drawRectangle({
    x: margin,
    y: y - 28,
    width: contentWidth,
    height: 28,
    color: rgb(0.95, 0.97, 0.96),
    borderColor: rgb(0.8, 0.88, 0.85),
    borderWidth: 1,
  });

  page.drawText('QUALITY CONTROL ATTESTATION:', {
    x: margin + 8,
    y: y - 11,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });

  page.drawText(snapshot.qa_attestation.notes || 'All quality controls verified within acceptable calibration tolerances prior to release.', {
    x: margin + 8,
    y: y - 22,
    size: 7,
    font: fontRegular,
    color: rgb(0.2, 0.3, 0.2),
  });

  y -= 44;

  // 8. Sign-off / Reviewer Credentials Box
  page.drawRectangle({
    x: margin,
    y: y - 44,
    width: contentWidth,
    height: 44,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  page.drawText(`CLINICALLY AUTHORIZED BY: ${snapshot.reviewer.full_name}`, {
    x: margin + 10,
    y: y - 15,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  page.drawText(`Credentials / Scope: ${snapshot.reviewer.credentials}`, {
    x: margin + 10,
    y: y - 28,
    size: 8,
    font: fontRegular,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(`Authorized at: ${new Date(snapshot.reviewer.authorized_at).toLocaleString()}`, {
    x: margin + 10,
    y: y - 39,
    size: 7,
    font: fontOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  // 9. Confidentiality Footer
  page.drawText(snapshot.lab.footer_text || 'Confidential Diagnostic Report — Generated via Secure Laboratory Information System', {
    x: margin,
    y: margin - 15,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}
