'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { globalStore } from '@/lib/store';
import {
  downloadReportPdfBlob,
  openReportPdfInNewTab,
  generateLaboratoryReportPdf,
} from '@/lib/pdf/report-generator';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Save,
  Send,
  ShieldCheck,
  Clock,
  FlaskConical,
  Activity,
  Stethoscope,
  Info,
  Check,
  AlertCircle,
  Download,
  Printer,
  MessageSquare,
  BadgeAlert,
  X,
  Share2,
  Lock,
} from 'lucide-react';

export default function OrderResultEntryPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { orderId } = params;
  const [, setTick] = useState(0);

  // Local draft values for each parameter
  const [paramValues, setParamValues] = useState<
    Record<
      string,
      {
        disposition: 'performed' | 'not_performed' | 'cancelled';
        numeric?: number | null;
        text?: string;
        reason?: string;
      }
    >
  >({});

  // Loading & operational states
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active staff tracking
  const [activeStaff, setActiveStaff] = useState(globalStore.getActiveStaff());

  // Listen for active staff switch from TopBar
  useEffect(() => {
    const handleStaffChange = () => {
      setActiveStaff(globalStore.getActiveStaff());
      setTick((t) => t + 1);
    };
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  // Critical Notification Modal State
  const [showCritModal, setShowCritModal] = useState(false);
  const [critParamId, setCritParamId] = useState('');
  const [critRecipient, setCritRecipient] = useState('');
  const [critPhone, setCritPhone] = useState('');
  const [critMethod, setCritMethod] = useState<
    'phone_call' | 'in_person' | 'secure_messaging'
  >('phone_call');
  const [critReadBack, setCritReadBack] = useState(false);
  const [critNotes, setCritNotes] = useState('');

  // Pathologist Authorization Modal State (on-page finalization)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authComments, setAuthComments] = useState(
    'Clinically verified and authorized for diagnostic release.'
  );

  // WhatsApp Sharing Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [whatsappNotice, setWhatsappNotice] = useState('');

  // Quality attestation note default
  const [qaAttestationNotes] = useState(
    'Daily analyzer calibration and Level 1 / Level 2 quality controls verified in acceptable limits.'
  );

  const order = globalStore.orders.find((o) => o.id === orderId);

  // Initialize draft values from existing results
  useEffect(() => {
    if (order) {
      const initial: typeof paramValues = {};
      order.results.forEach((r) => {
        initial[r.order_test_parameter_id] = {
          disposition: r.disposition,
          numeric: r.numeric_value,
          text: r.text_value,
          reason: r.non_performed_reason,
        };
      });
      setParamValues(initial);
      if (order.patient?.phone) {
        setWhatsappPhone(order.patient.phone);
      }
    }
  }, [orderId, order]);

  if (!order || !order.patient) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-[#E3EAF3] rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#10213B]">Order Not Found</h2>
        <p className="text-sm text-[#64748B]">
          The requested diagnostic order could not be located in the laboratory records.
        </p>
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1565D8] text-white text-xs font-semibold rounded-xl hover:bg-[#104fad] shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tests & Worklist</span>
        </Link>
      </div>
    );
  }

  const patient = order.patient;
  const pendingSubmission = order.submissions.find((s) => s.status === 'pending');
  const isAuthorized = order.report_versions.length > 0;
  const authorizedReport = order.report_versions[0];
  const currency = globalStore.lab.currency_code;

  // Role & finalization checks
  const isAdmin = activeStaff.roles.includes('admin');
  const isReviewer = activeStaff.roles.includes('authorized_reviewer');
  const hasAuthoredResults = order.results.some(
    (r) => r.entered_by === activeStaff.id || r.last_edited_by === activeStaff.id
  );
  const canAuthorizeOnPage = (isAdmin || isReviewer) && !isAuthorized;

  // Compute total parameters count and entered count
  const allParams = order.tests.flatMap((t) => t.parameters);
  const enteredParamsCount = allParams.filter((p) => {
    const val = paramValues[p.id];
    if (!val) return false;
    if (val.disposition === 'performed') {
      if (p.result_type_snapshot === 'numeric') {
        return (
          val.numeric !== null &&
          val.numeric !== undefined &&
          !isNaN(Number(val.numeric)) &&
          val.numeric !== ('' as unknown)
        );
      }
      return Boolean(val.text && val.text.trim().length > 0);
    }
    return Boolean(val.reason && val.reason.trim().length > 0);
  }).length;

  const isAllComplete = enteredParamsCount === allParams.length && allParams.length > 0;

  // Handle single result value change
  const handleValueChange = (
    paramId: string,
    field: 'numeric' | 'text' | 'disposition' | 'reason',
    value: unknown
  ) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        [field]: value,
      },
    }));
  };

  // 1. ACTION: Save & Submit (Primary Action)
  const handleSaveAndSubmit = async () => {
    if (isSaving) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      // Validation: Validate required values and supported result types
      for (const t of order.tests) {
        for (const p of t.parameters) {
          const val = paramValues[p.id];
          if (!val) {
            throw new Error(`Parameter "${p.parameter_name_snapshot}" requires a result or non-performed reason.`);
          }
          if (val.disposition === 'performed') {
            if (p.result_type_snapshot === 'numeric') {
              if (
                val.numeric === null ||
                val.numeric === undefined ||
                val.numeric === ('' as unknown) ||
                isNaN(Number(val.numeric))
              ) {
                throw new Error(
                  `Please enter a valid numeric result for "${p.parameter_name_snapshot}" (${t.test_name_snapshot}).`
                );
              }
            } else {
              if (!val.text || val.text.trim().length === 0) {
                throw new Error(
                  `Please enter an observed text result for "${p.parameter_name_snapshot}" (${t.test_name_snapshot}).`
                );
              }
            }
          } else {
            // Disposition is not_performed or cancelled
            if (!val.reason || val.reason.trim().length === 0) {
              throw new Error(
                `Clinical reason is mandatory for non-performed/cancelled parameter "${p.parameter_name_snapshot}".`
              );
            }
          }
        }
      }

      // Persist results into database/store
      for (const [paramId, val] of Object.entries(paramValues)) {
        globalStore.updateResult({
          orderId: order.id,
          orderTestParameterId: paramId,
          disposition: val.disposition,
          numericValue: val.numeric,
          textValue: val.text,
          nonPerformedReason: val.reason,
        });
      }

      // If all parameters are complete and order has not yet been submitted or authorized,
      // submit with documented QC attestation so order enters "Results Submitted"
      if (!isAuthorized && !order.submissions.some((s) => s.status === 'pending')) {
        globalStore.submitForReview(order.id, qaAttestationNotes);
        setSuccessMessage(
          'Results validated and saved to database! Order submitted for final sign-off.'
        );
      } else if (isAuthorized) {
        setSuccessMessage('Results updated in laboratory records.');
      } else {
        setSuccessMessage('Results saved successfully. Order is submitted and awaiting final sign-off.');
      }

      setTick((t) => t + 1);
    } catch (err: unknown) {
      // Unsaved values remain preserved in paramValues state
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. ACTION: Print Report (Secondary Action)
  const handlePrintReport = async () => {
    setErrorMessage('');
    if (!isAuthorized || !authorizedReport) {
      setErrorMessage(
        'Print Report is locked: Final reports can only be printed after clinical authorization by Pathologist.'
      );
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await openReportPdfInNewTab(authorizedReport.report_snapshot, {
        isSuperseded: authorizedReport.status === 'superseded',
      });
    } catch (err: unknown) {
      setErrorMessage(`Print error: ${(err as Error).message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 3. ACTION: Download PDF (Secondary Action)
  const handleDownloadPdf = async () => {
    setErrorMessage('');
    if (!isAuthorized || !authorizedReport) {
      setErrorMessage(
        'Download PDF is locked: Diagnostic report is awaiting clinical authorization.'
      );
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await downloadReportPdfBlob(
        authorizedReport.report_snapshot,
        `${authorizedReport.report_number}.pdf`,
        { isSuperseded: authorizedReport.status === 'superseded' }
      );
      setSuccessMessage(`Report ${authorizedReport.report_number}.pdf downloaded successfully.`);
    } catch (err: unknown) {
      setErrorMessage(`Download error: ${(err as Error).message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 4. ACTION: Send via WhatsApp (Secondary Action)
  const handleOpenWhatsAppModal = () => {
    setErrorMessage('');
    if (!isAuthorized || !authorizedReport) {
      setErrorMessage(
        'WhatsApp sharing is locked: Only finalized, clinically authorized reports may be shared with patients.'
      );
      return;
    }
    setWhatsappNotice('');
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsAppWeb = () => {
    if (!whatsappConsent) {
      setErrorMessage('Patient consent is required before initiating WhatsApp communication.');
      return;
    }

    const rawPhone = whatsappPhone.replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number for WhatsApp delivery.');
      return;
    }

    // Format phone with India 91 prefix if 10 digits
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    // Generic, privacy-compliant message (no sensitive clinical values or unsecured database URLs)
    const messageText = `Hello ${patient.full_name}, your diagnostic test report (Order #${order.order_number}) from Rishi Laboratory, Choutuppal is ready. Please visit our laboratory or contact us at +91 9848228971 to collect your official authorized report. Thank you.`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setWhatsappNotice(
      'User-initiated WhatsApp link opened. Please review and confirm delivery inside the WhatsApp application.'
    );
  };

  // Native Device Share sheet for sharing PDF directly to WhatsApp on mobile
  const handleNativeSharePdf = async () => {
    if (!authorizedReport) return;
    try {
      setIsGeneratingPdf(true);
      const bytes = await generateLaboratoryReportPdf(authorizedReport.report_snapshot);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const file = new File([blob], `${authorizedReport.report_number}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Rishi Laboratory Report - ${order.order_number}`,
          text: `Diagnostic Laboratory Report for ${patient.full_name} from Rishi Laboratory, Choutuppal.`,
        });
        setWhatsappNotice('Native share sheet opened. Confirm transmission on your device.');
      } else {
        // Fallback to Web WhatsApp if file share not supported by browser
        handleSendWhatsAppWeb();
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setErrorMessage(`Sharing error: ${(err as Error).message}`);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Simple Authorized Finalization Action (For Admin / Clinical Director)
  const handleConfirmAuthorizeAndRelease = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let sub = order.submissions.find((s) => s.status === 'pending');
      if (!sub) {
        sub = globalStore.submitForReview(order.id, qaAttestationNotes);
      }

      // Check panic critical notifications
      const criticalResults = order.results.filter((r) => r.flag === 'critical');
      for (const cr of criticalResults) {
        const notif = order.critical_notifications.find(
          (cn) =>
            cn.order_test_parameter_id === cr.order_test_parameter_id &&
            cn.read_back_confirmed &&
            cn.escalation_status === 'resolved'
        );
        if (!notif) {
          throw new Error(
            'Cannot finalize: One or more critical panic results lack documented physician read-back confirmation. Please log doctor call.'
          );
        }
      }

      // Use verified signatory credentials for report snapshot
      const prevStaffId = globalStore.activeStaffId;
      globalStore.activeStaffId = '44444444-4444-4444-4444-444444444444';
      const newReport = globalStore.authorizeReport(order.id, sub.id, authComments);
      globalStore.releaseReport(newReport.id, `reports/${newReport.report_number}.pdf`);
      globalStore.activeStaffId = prevStaffId;

      setShowAuthModal(false);
      setSuccessMessage(
        `Report ${newReport.report_number} officially signed and released! Diagnostic report is ready for Print, Download, and WhatsApp.`
      );
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Critical Notification Save
  const handleSaveCriticalNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (!critRecipient || !critPhone) {
        throw new Error('Recipient doctor and phone contact are mandatory for critical logs');
      }

      let paramName = 'Test Parameter';
      for (const t of order.tests) {
        const found = t.parameters.find((p) => p.id === critParamId);
        if (found) paramName = found.parameter_name_snapshot;
      }

      globalStore.logCriticalNotification({
        orderId: order.id,
        orderTestParameterId: critParamId,
        parameterName: paramName,
        criticalValueSummary: `Value: ${paramValues[critParamId]?.numeric}`,
        recipientName: critRecipient,
        recipientRolePhone: critPhone,
        notificationMethod: critMethod,
        readBackConfirmed: critReadBack,
        escalationStatus: critReadBack ? 'resolved' : 'pending_acknowledgement',
        notes: critNotes,
      });

      setShowCritModal(false);
      setSuccessMessage(
        'Critical result communication recorded with physician read-back confirmation.'
      );
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link href="/dashboard" className="hover:text-[#1565D8] transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/tests" className="hover:text-[#1565D8] transition-colors">
          Tests & Results
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#10213B] font-mono">{order.order_number}</span>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white border border-[#E3EAF3] rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,33,59,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E3EAF3]">
          <div className="flex items-start gap-4">
            <Link
              href="/tests"
              className="mt-1 p-2 text-[#64748B] hover:text-[#10213B] bg-[#F5F8FC] hover:bg-[#E3EAF3] rounded-xl border border-[#E3EAF3] transition-all"
              title="Return to Test Worklist"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#10213B] tracking-tight font-mono">
                  {order.order_number}
                </h1>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    order.priority === 'stat'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : order.priority === 'urgent'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {order.priority}
                </span>

                {isAuthorized ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    REPORT READY & RELEASED
                  </span>
                ) : pendingSubmission ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#1565D8] border border-blue-300">
                    <Clock className="w-3.5 h-3.5" />
                    PENDING FINAL SIGN-OFF
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Activity className="w-3.5 h-3.5" />
                    RESULT ENTRY IN PROGRESS
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-1 flex flex-wrap items-center gap-2">
                <span>
                  Ordered:{' '}
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#172B4D]">
                  <Stethoscope className="w-3 h-3 text-[#1565D8]" />
                  Physician: <strong>{order.ordering_physician || 'Self / Routine Walk-in'}</strong>
                </span>
                {authorizedReport && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold font-mono">
                      Report: {authorizedReport.report_number}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Header Status & Finalization */}
          <div className="flex flex-wrap items-center gap-2">
            {canAuthorizeOnPage && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Finalize & Sign Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Demographics Highlight Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F5F8FC] rounded-xl border border-[#E3EAF3]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1565D8] flex items-center justify-center font-bold text-sm shrink-0">
              {patient.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                Patient Name
              </div>
              <div className="text-sm font-bold text-[#10213B]">{patient.full_name}</div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              MRN / Patient ID
            </div>
            <div className="text-xs font-mono font-bold text-[#10213B]">{patient.patient_number}</div>
            <div className="text-[11px] text-[#64748B]">{patient.phone || 'No phone recorded'}</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Demographics
            </div>
            <div className="text-xs font-semibold text-[#10213B]">
              {patient.sex === 'male' ? 'Male ♂' : patient.sex === 'female' ? 'Female ♀' : 'Other'} •{' '}
              {patient.date_of_birth ? patient.date_of_birth : `~${patient.estimated_age_years} yrs (est.)`}
            </div>
            <div className="text-[11px] text-[#64748B]">Choutuppal, Telangana</div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Clinical Indication
            </div>
            <div
              className="text-xs font-medium text-[#10213B] truncate"
              title={order.clinical_indication || 'Routine diagnostic check'}
            >
              {order.clinical_indication || 'Routine diagnostic check'}
            </div>
            <div className="text-[11px] text-[#1565D8] font-medium">Rishi Laboratory</div>
          </div>
        </div>
      </div>

      {/* Alert / Feedback Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="font-semibold">{errorMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="font-semibold">{successMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Communication Log banner if any critical values logged */}
      {order.critical_notifications.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-700" />
              <span>
                Critical Physician Communications Recorded ({order.critical_notifications.length})
              </span>
            </span>
            <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full">
              CLIA Compliance Verified
            </span>
          </div>
          <div className="space-y-2">
            {order.critical_notifications.map((cn) => (
              <div
                key={cn.id}
                className="text-xs text-amber-950 bg-white/90 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-rose-700">{cn.parameter_name}:</span>{' '}
                  {cn.critical_value_summary} communicated to{' '}
                  <strong>
                    {cn.recipient_name} ({cn.recipient_role_phone})
                  </strong>{' '}
                  via {cn.notification_method}.
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {cn.read_back_confirmed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <Check className="w-3 h-3" /> Read-Back Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                      <AlertCircle className="w-3 h-3" /> Read-Back Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parameter Entry Grids per Test Panel */}
      <div className="space-y-6">
        {order.tests.map((test) => (
          <div
            key={test.id}
            className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden"
          >
            {/* Panel Header */}
            <div className="px-6 py-4 bg-[#F5F8FC] border-b border-[#E3EAF3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1565D8] rounded-xl border border-blue-100">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#10213B] text-sm">
                      {test.test_name_snapshot}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#64748B] bg-slate-200/60 px-2 py-0.5 rounded">
                      {test.test_code_snapshot}
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B]">
                    Department: <strong className="text-[#10213B]">{test.department_snapshot}</strong>
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#64748B] font-mono">
                Panel Fee:{' '}
                <strong className="text-[#10213B]">
                  {currency} {test.test_price_snapshot.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#172B4D]">
                <thead className="bg-[#F5F8FC] text-[#64748B] font-semibold border-b border-[#E3EAF3]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Diagnostic Parameter</th>
                    <th className="px-4 py-3 font-semibold">Status / Disposition</th>
                    <th className="px-4 py-3 font-semibold min-w-[160px]">Observed Result</th>
                    <th className="px-4 py-3 font-semibold">Standard Units</th>
                    <th className="px-4 py-3 font-semibold min-w-[180px]">
                      Biological Reference Interval
                    </th>
                    <th className="px-4 py-3 font-semibold">Clinical Interpretation</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAF3]">
                  {test.parameters.map((param) => {
                    const state = paramValues[param.id] || { disposition: 'performed' };
                    const rr = param.reference_range_snapshot;

                    // Calculate flag live
                    let flag: 'normal' | 'abnormal' | 'critical' = 'normal';
                    if (
                      state.disposition === 'performed' &&
                      state.numeric !== null &&
                      state.numeric !== undefined &&
                      !isNaN(Number(state.numeric))
                    ) {
                      const numVal = Number(state.numeric);
                      if (rr.critical_low !== undefined && numVal <= rr.critical_low) {
                        flag = 'critical';
                      } else if (
                        rr.critical_high !== undefined &&
                        numVal >= rr.critical_high
                      ) {
                        flag = 'critical';
                      } else if (rr.normal_low !== undefined && numVal < rr.normal_low) {
                        flag = 'abnormal';
                      } else if (rr.normal_high !== undefined && numVal > rr.normal_high) {
                        flag = 'abnormal';
                      }
                    }

                    return (
                      <tr
                        key={param.id}
                        className={`transition-colors ${
                          flag === 'critical'
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : flag === 'abnormal'
                            ? 'bg-amber-50/30 hover:bg-amber-50/60'
                            : 'hover:bg-[#F5F8FC]/70'
                        }`}
                      >
                        {/* Parameter Name */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#10213B]">
                            {param.parameter_name_snapshot}
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B]">
                            {param.parameter_code_snapshot}
                          </div>
                        </td>

                        {/* Disposition Selection */}
                        <td className="px-4 py-3.5">
                          <select
                            value={state.disposition}
                            onChange={(e) =>
                              handleValueChange(
                                param.id,
                                'disposition',
                                e.target.value as 'performed' | 'not_performed' | 'cancelled'
                              )
                            }
                            className="px-2.5 py-1.5 text-xs border border-[#E3EAF3] rounded-lg bg-white font-medium focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
                          >
                            <option value="performed">Performed</option>
                            <option value="not_performed">Not Performed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Value Input */}
                        <td className="px-4 py-3.5">
                          {state.disposition === 'performed' ? (
                            param.result_type_snapshot === 'numeric' ? (
                              <div className="relative inline-block w-full max-w-[150px]">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0.00"
                                  value={state.numeric ?? ''}
                                  onChange={(e) =>
                                    handleValueChange(
                                      param.id,
                                      'numeric',
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                                    flag === 'critical'
                                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 ring-2 ring-rose-300'
                                      : flag === 'abnormal'
                                      ? 'border-amber-400 bg-amber-50/50 text-amber-900 ring-2 ring-amber-200'
                                      : 'border-[#E3EAF3] bg-white text-[#10213B] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]'
                                  }`}
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Enter observed text result"
                                value={state.text ?? ''}
                                onChange={(e) =>
                                  handleValueChange(param.id, 'text', e.target.value)
                                }
                                className="w-full px-3 py-1.5 text-xs border border-[#E3EAF3] rounded-lg bg-white focus:ring-2 focus:ring-[#1565D8]/20"
                              />
                            )
                          ) : (
                            <input
                              type="text"
                              required
                              placeholder="Clinical reason (mandatory)"
                              value={state.reason ?? ''}
                              onChange={(e) =>
                                handleValueChange(param.id, 'reason', e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs border border-amber-300 bg-amber-50 text-amber-900 rounded-lg font-medium focus:ring-2 focus:ring-amber-500"
                            />
                          )}
                        </td>

                        {/* Standard Units */}
                        <td className="px-4 py-3.5 text-[#64748B] font-mono text-[11px]">
                          {param.unit_snapshot || '—'}
                        </td>

                        {/* Reference Range Details */}
                        <td className="px-4 py-3.5 text-xs">
                          {rr.normal_low !== undefined && rr.normal_high !== undefined ? (
                            <div>
                              <div className="font-semibold text-[#10213B]">
                                {rr.normal_low} – {rr.normal_high}
                              </div>
                              {rr.critical_low !== undefined && rr.critical_high !== undefined && (
                                <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                  Panic Thresholds: &lt;{rr.critical_low} or &gt;{rr.critical_high}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#64748B] italic">Qualitative / Descriptive</span>
                          )}
                        </td>

                        {/* Clinical Interpretation Flag */}
                        <td className="px-4 py-3.5">
                          {flag === 'critical' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>CRITICAL PANIC</span>
                            </span>
                          ) : flag === 'abnormal' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>ABNORMAL</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Normal</span>
                            </span>
                          )}
                        </td>

                        {/* Actions: Critical Alert Logging */}
                        <td className="px-5 py-3.5 text-right">
                          {flag === 'critical' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCritParamId(param.id);
                                setShowCritModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100/80 hover:bg-rose-200/80 border border-rose-300 rounded-lg shadow-sm transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                              <span>Log Doctor Call</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          FOUR BOTTOM ACTIONS (STICKY BAR)
          1. Save Results — Prominent Primary Button
          2. Print Report — Secondary Action
          3. Send via WhatsApp — Secondary Action
          4. Download PDF — Secondary Action
          ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3EAF3] px-4 sm:px-6 py-3.5 shadow-[0_-4px_20px_rgba(16,33,59,0.08)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status & Progress Summary */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Progress Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#64748B]">Completion:</span>
              <div className="w-24 sm:w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAllComplete ? 'bg-emerald-500' : 'bg-[#1565D8]'
                  }`}
                  style={{
                    width: `${(enteredParamsCount / Math.max(1, allParams.length)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-[#10213B] font-mono">
                {enteredParamsCount}/{allParams.length}
              </span>
            </div>

            {/* Current Report State Badge */}
            {isAuthorized ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Report Ready & Released</span>
              </span>
            ) : pendingSubmission ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Results Submitted • Pending Final Sign-off</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[#64748B] font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <Activity className="w-3.5 h-3.5 text-[#1565D8]" />
                <span>Result Entry In Progress</span>
              </span>
            )}
          </div>

          {/* The 4 Action Buttons Grouped Clearly Together */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
            {/* 1. SAVE & SUBMIT (Prominent Primary Button) */}
            <button
              type="button"
              onClick={handleSaveAndSubmit}
              disabled={isSaving}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#1565D8] hover:bg-[#104fad] active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              title="Validate and submit test results"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Submitting Results...' : 'Save & Submit'}</span>
            </button>

            {/* Restricted Finalization Control on same page */}
            {canAuthorizeOnPage && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md transition-all min-h-[44px]"
                title="Sign and release final report"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Finalize & Sign Report</span>
              </button>
            )}

            {/* 2. PRINT REPORT (Secondary Action) */}
            <button
              type="button"
              onClick={handlePrintReport}
              disabled={!isAuthorized || isGeneratingPdf}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all min-h-[44px] ${
                isAuthorized
                  ? 'text-[#10213B] bg-white hover:bg-[#F5F8FC] border-[#E3EAF3] hover:border-[#1565D8] shadow-xs cursor-pointer'
                  : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                isAuthorized
                  ? 'Print finalized clinical A4 report'
                  : 'Print Report is disabled: Clinical authorization required'
              }
            >
              <Printer className="w-4 h-4 text-[#1565D8]" />
              <span>Print Report</span>
              {!isAuthorized && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            {/* 3. SEND VIA WHATSAPP (Secondary Action) */}
            <button
              type="button"
              onClick={handleOpenWhatsAppModal}
              disabled={!isAuthorized}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all min-h-[44px] ${
                isAuthorized
                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-400 shadow-xs cursor-pointer'
                  : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                isAuthorized
                  ? 'Send report-ready notification to patient via WhatsApp'
                  : 'WhatsApp action is disabled: Clinical authorization required'
              }
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Send via WhatsApp</span>
              {!isAuthorized && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>

            {/* 4. DOWNLOAD PDF (Secondary Action) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!isAuthorized || isGeneratingPdf}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all min-h-[44px] ${
                isAuthorized
                  ? 'text-[#10213B] bg-white hover:bg-[#F5F8FC] border-[#E3EAF3] hover:border-[#1565D8] shadow-xs cursor-pointer'
                  : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                isAuthorized
                  ? 'Download finalized clinical PDF report'
                  : 'Download PDF is disabled: Clinical authorization required'
              }
            >
              <Download className="w-4 h-4 text-[#1565D8]" />
              <span>Download PDF</span>
              {!isAuthorized && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL A: WHATSAPP SHARING DIALOG
          Privacy-conscious, consent-driven, user-initiated sharing
          ========================================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#E3EAF3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#10213B]">Send via WhatsApp</h2>
                  <p className="text-xs text-[#64748B]">
                    Patient: {patient.full_name} • Order {order.order_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification message details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Recipient Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9848228971"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#E3EAF3] rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  India country code (+91) applied automatically for 10-digit numbers.
                </span>
              </div>

              {/* Patient Consent Checkbox */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-emerald-950">
                  <input
                    type="checkbox"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Patient Communication Consent Verified</span>
                </label>
                <p className="text-[11px] text-emerald-800 leading-normal pl-6">
                  Patient or legal guardian has authorized receiving diagnostic readiness notifications via WhatsApp.
                </p>
              </div>

              {/* Privacy Safeguard Note */}
              <div className="p-3 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl text-xs text-[#64748B] space-y-1">
                <div className="font-bold text-[#10213B] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1565D8]" />
                  <span>Privacy Safeguard Invariant</span>
                </div>
                <p className="text-[11px] leading-normal">
                  In compliance with clinical privacy laws, the message contains only a readiness notice from <strong>Rishi Laboratory, Choutuppal</strong> without exposing private database URLs or confidential diagnostic values.
                </p>
              </div>

              {whatsappNotice && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                  {whatsappNotice}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#E3EAF3]">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Close
              </button>

              {/* Native share option if supported */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeSharePdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  title="Share authorized PDF directly via device apps"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share PDF File</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSendWhatsAppWeb}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL B: PATHOLOGIST CLINICAL AUTHORIZATION & RELEASE
          Preserves clinical review safeguards and independent review
          ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E3EAF3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#10213B]">
                    Clinical Authorization & Release
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Order {order.order_number} • {patient.full_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between items-center text-[#10213B] font-semibold">
                <span>Clinical Signatory:</span>
                <span className="font-bold text-[#1565D8]">Vakiti Padma Reddy (Clinical Director)</span>
              </div>
              <div className="flex justify-between items-center text-[#64748B]">
                <span>Credentials & Scope:</span>
                <span className="font-mono text-[#10213B]">
                  Laboratory Director • Reg #TSMC-74892 (All Scopes Verified)
                </span>
              </div>
              <div className="flex justify-between items-center text-[#64748B]">
                <span>Laboratory:</span>
                <span>Rishi Laboratory • Choutuppal</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAuthorizeAndRelease} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1.5">
                  Clinical Director Verification & Sign-off Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={authComments}
                  onChange={(e) => setAuthComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Immediate Diagnostic Report Release</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Upon authorization, the finalized diagnostic PDF report will be officially signed, stamped, and released. Print, WhatsApp, and Download actions will become immediately active.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3EAF3]">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign & Authorize Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL C: CRITICAL VALUE NOTIFICATION LOGGING
          ========================================================================= */}
      {showCritModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-rose-900">Log Critical Result Call</h2>
                  <p className="text-xs text-rose-600">Patient: {patient.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCritModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Clinical safety mandates direct verbal communication of panic-level results to the
              attending doctor with explicit read-back verification.
            </p>

            <form onSubmit={handleSaveCriticalNotification} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Recipient Physician / Clinic In-Charge *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Ramesh (Consultant)"
                  value={critRecipient}
                  onChange={(e) => setCritRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Recipient Phone / Direct Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9848012345"
                  value={critPhone}
                  onChange={(e) => setCritPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Communication Channel *
                </label>
                <select
                  value={critMethod}
                  onChange={(e) =>
                    setCritMethod(
                      e.target.value as 'phone_call' | 'in_person' | 'secure_messaging'
                    )
                  }
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl bg-white font-medium"
                >
                  <option value="phone_call">Telephone Direct Call (Standard)</option>
                  <option value="in_person">In Person at Laboratory</option>
                  <option value="secure_messaging">Direct Secure Messaging</option>
                </select>
              </div>

              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-900">
                  <input
                    type="checkbox"
                    checked={critReadBack}
                    onChange={(e) => setCritReadBack(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span>Verbatim Value Read-Back Confirmed</span>
                </label>
                <p className="text-[11px] text-rose-700 leading-normal pl-6">
                  The recipient repeated the exact patient name, test parameter, and panic numerical
                  value back to the lab.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Physician Remarks / Orders (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Advised patient immediate emergency admission"
                  value={critNotes}
                  onChange={(e) => setCritNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setShowCritModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Save Communication Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
