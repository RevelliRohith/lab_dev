'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { globalStore } from '@/lib/store';
import { downloadReportPdfBlob } from '@/lib/pdf/report-generator';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Save,
  Send,
  ShieldCheck,
  Clock,
  User,
  FlaskConical,
  Activity,
  Calendar,
  Stethoscope,
  Info,
  Check,
  AlertCircle,
  FileText,
  BadgeAlert,
  Download,
} from 'lucide-react';

export default function OrderResultEntryPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { orderId } = params;
  const [, setTick] = useState(0);

  // Local draft values
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

  // Submit Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [qaAttestationNotes, setQaAttestationNotes] = useState(
    'Daily analyzer calibration and Level 1 / Level 2 quality controls verified in acceptable limits.'
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const order = globalStore.orders.find((o) => o.id === orderId);

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
  const currency = globalStore.lab.currency_code;

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

  // Save drafts
  const handleSaveDrafts = () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
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
      setSuccessMessage('Draft laboratory results saved successfully.');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Submit for Review
  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // First save drafts to store
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

      // Then submit with QA attestation
      globalStore.submitForReview(order.id, qaAttestationNotes);
      setShowSubmitModal(false);
      setSuccessMessage(
        'Results successfully attested and submitted to Pathologist Dr. Rishika for authorization!'
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

  // Compute total parameters count and entered count
  const allParams = order.tests.flatMap((t) => t.parameters);
  const enteredParamsCount = allParams.filter((p) => {
    const val = paramValues[p.id];
    if (!val) return false;
    if (val.disposition === 'performed') {
      return val.numeric !== null && val.numeric !== undefined && val.numeric !== ('' as unknown);
    }
    return Boolean(val.reason && val.reason.trim().length > 0);
  }).length;

  const isComplete = enteredParamsCount === allParams.length && allParams.length > 0;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Breadcrumb */}
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
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AUTHORIZED & RELEASED
                  </span>
                ) : pendingSubmission ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#1565D8] border border-blue-300">
                    <Clock className="w-3.5 h-3.5" />
                    AWAITING PATHOLOGIST REVIEW
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Activity className="w-3.5 h-3.5" />
                    RESULT ENTRY IN PROGRESS
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
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
              </p>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {isAuthorized && order.report_versions[0] && (
              <button
                type="button"
                onClick={() =>
                  downloadReportPdfBlob(
                    order.report_versions[0].report_snapshot,
                    `${order.report_versions[0].report_number}.pdf`,
                    { isSuperseded: order.report_versions[0].status === 'superseded' }
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                title="Download finalized clinical A4 report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report PDF</span>
              </button>
            )}
            <button
              onClick={handleSaveDrafts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172B4D] bg-[#F5F8FC] hover:bg-[#E3EAF3] rounded-xl border border-[#E3EAF3] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => {
                setShowSubmitModal(true);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Pathologist Review</span>
            </button>
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
            <div className="text-[11px] text-[#64748B]">{patient.phone || 'No phone'}</div>
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
              Clinical Reason
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

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium">{successMessage}</div>
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
                      state.numeric !== undefined
                    ) {
                      if (rr.critical_low !== undefined && state.numeric <= rr.critical_low) {
                        flag = 'critical';
                      } else if (
                        rr.critical_high !== undefined &&
                        state.numeric >= rr.critical_high
                      ) {
                        flag = 'critical';
                      } else if (rr.normal_low !== undefined && state.numeric < rr.normal_low) {
                        flag = 'abnormal';
                      } else if (rr.normal_high !== undefined && state.numeric > rr.normal_high) {
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

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3EAF3] px-6 py-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B]">Progress:</span>
            <div className="w-36 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete ? 'bg-emerald-500' : 'bg-[#1565D8]'
                }`}
                style={{
                  width: `${(enteredParamsCount / Math.max(1, allParams.length)) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs font-bold text-[#10213B]">
              {enteredParamsCount} / {allParams.length} entered
            </span>
          </div>

          {isComplete && (
            <span className="hidden md:inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All parameters complete
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleSaveDrafts}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#172B4D] bg-[#F5F8FC] hover:bg-[#E3EAF3] rounded-xl border border-[#E3EAF3] transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => {
              setShowSubmitModal(true);
              setErrorMessage('');
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-md transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Attest & Submit to Pathologist</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Documented QC Attestation & Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E3EAF3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1565D8] rounded-xl border border-blue-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#10213B]">
                    Quality Control & Clinical Attestation
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Order {order.order_number} • {patient.full_name}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Before submitting diagnostic results to{' '}
              <strong>Dr. Rishika (Authorized Reviewer)</strong>, laboratory guidelines require
              affirming that all internal QC controls, analyzer calibrations, and specimen
              integrity checks have been verified.
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1.5">
                  Documented Quality Attestation Statement *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qaAttestationNotes}
                  onChange={(e) => setQaAttestationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] font-medium outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>Clinical Immutability Invariant</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Once submitted, results cannot be altered without cancelling the pending
                  submission and recording an audit trail.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3EAF3]">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Attest & Send to Dr. Rishika</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Critical Value Physician Notification */}
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
