'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { globalStore } from '@/lib/store';
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
  const [paramValues, setParamValues] = useState<Record<string, {
    disposition: 'performed' | 'not_performed' | 'cancelled';
    numeric?: number | null;
    text?: string;
    reason?: string;
  }>>({});

  // Critical Notification Modal State
  const [showCritModal, setShowCritModal] = useState(false);
  const [critParamId, setCritParamId] = useState('');
  const [critRecipient, setCritRecipient] = useState('');
  const [critPhone, setCritPhone] = useState('');
  const [critMethod, setCritMethod] = useState<'phone_call' | 'in_person' | 'secure_messaging'>('phone_call');
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
  }, [orderId]);

  if (!order || !order.patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-600">Order not found.</p>
        <Link href="/tests" className="text-teal-600 text-xs font-semibold underline">
          Return to Tests & Results
        </Link>
      </div>
    );
  }

  const patient = order.patient;
  const pendingSubmission = order.submissions.find((s) => s.status === 'pending');
  const isAuthorized = order.report_versions.length > 0;

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
      setSuccessMessage('Draft results saved successfully.');
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
      setSuccessMessage('Results successfully submitted for Pathologist / Reviewer authorization!');
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
      if (!critRecipient || !critPhone) throw new Error('Recipient details are required');

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
      setSuccessMessage('Critical result communication recorded with read-back confirmation.');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Patient Demographics Always Visible */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Link
              href="/tests"
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-slate-900">{order.order_number}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.priority === 'stat'
                      ? 'bg-rose-100 text-rose-800'
                      : order.priority === 'urgent'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {order.priority.toUpperCase()}
                </span>
                {isAuthorized && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    AUTHORIZED
                  </span>
                )}
                {pendingSubmission && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    AWAITING REVIEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ordered: {new Date(order.created_at).toLocaleString()} • Physician: {order.ordering_physician || 'None'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => {
                setShowSubmitModal(true);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-slate-500 text-[11px]">Patient Name:</span>
            <p className="font-bold text-slate-900">{patient.full_name}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Patient ID:</span>
            <p className="font-mono font-medium text-slate-800">{patient.patient_number}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Sex / Age:</span>
            <p className="font-medium text-slate-800">
              {patient.sex.toUpperCase()} • {patient.date_of_birth ? patient.date_of_birth : `~${patient.estimated_age_years} yrs (est.)`}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Indication:</span>
            <p className="text-slate-800 truncate">{order.clinical_indication || 'Routine diagnosis'}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Critical Communication Log banner if any critical values logged */}
      {order.critical_notifications.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-amber-700" />
              <span>Critical Result Communication Records ({order.critical_notifications.length})</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {order.critical_notifications.map((cn) => (
              <div key={cn.id} className="text-xs text-amber-900 bg-white/80 p-2.5 rounded border border-amber-200">
                <span className="font-bold">{cn.parameter_name}:</span> {cn.critical_value_summary} communicated to{' '}
                <strong>{cn.recipient_name} ({cn.recipient_role_phone})</strong> via {cn.notification_method}.
                Read-back confirmed: <strong>{cn.read_back_confirmed ? 'YES (Verified)' : 'NO (Pending)'}</strong>.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parameter Entry Grids */}
      {order.tests.map((test) => (
        <div key={test.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {test.department_snapshot} — {test.test_name_snapshot} ({test.test_code_snapshot})
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Price: {globalStore.lab.currency_code} {test.test_price_snapshot.toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Parameter</th>
                  <th className="px-4 py-2.5">Disposition</th>
                  <th className="px-4 py-2.5">Result Value</th>
                  <th className="px-4 py-2.5">Units</th>
                  <th className="px-4 py-2.5">Reference Range</th>
                  <th className="px-4 py-2.5">Flag / Interpretation</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {test.parameters.map((param) => {
                  const state = paramValues[param.id] || { disposition: 'performed' };
                  const rr = param.reference_range_snapshot;

                  // Calculate flag live
                  let flag = 'normal';
                  if (state.disposition === 'performed' && state.numeric !== null && state.numeric !== undefined) {
                    if (rr.critical_low !== undefined && state.numeric <= rr.critical_low) flag = 'critical';
                    else if (rr.critical_high !== undefined && state.numeric >= rr.critical_high) flag = 'critical';
                    else if (rr.normal_low !== undefined && state.numeric < rr.normal_low) flag = 'abnormal';
                    else if (rr.normal_high !== undefined && state.numeric > rr.normal_high) flag = 'abnormal';
                  }

                  return (
                    <tr key={param.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {param.parameter_name_snapshot}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">
                          {param.parameter_code_snapshot}
                        </span>
                      </td>

                      {/* Disposition */}
                      <td className="px-4 py-3">
                        <select
                          value={state.disposition}
                          onChange={(e) =>
                            handleValueChange(
                              param.id,
                              'disposition',
                              e.target.value as 'performed' | 'not_performed' | 'cancelled'
                            )
                          }
                          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        >
                          <option value="performed">Performed</option>
                          <option value="not_performed">Not Performed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Value Input */}
                      <td className="px-4 py-3">
                        {state.disposition === 'performed' ? (
                          param.result_type_snapshot === 'numeric' ? (
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
                              className="w-28 px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 font-mono"
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder="Text result"
                              value={state.text ?? ''}
                              onChange={(e) => handleValueChange(param.id, 'text', e.target.value)}
                              className="w-40 px-2.5 py-1 text-xs border border-slate-300 rounded"
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder="Reason not performed (mandatory)"
                            value={state.reason ?? ''}
                            onChange={(e) => handleValueChange(param.id, 'reason', e.target.value)}
                            className="w-48 px-2.5 py-1 text-xs border border-amber-300 bg-amber-50 rounded"
                          />
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3 text-slate-700">{param.unit_snapshot || '-'}</td>

                      {/* Reference Range */}
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {rr.normal_low !== undefined && rr.normal_high !== undefined ? (
                          <span>
                            {rr.normal_low} - {rr.normal_high}
                            {rr.critical_low !== undefined && (
                              <span className="block text-rose-600 text-[10px]">
                                Crit: &lt;{rr.critical_low} or &gt;{rr.critical_high}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>Qualitative reference</span>
                        )}
                      </td>

                      {/* Flag Badge */}
                      <td className="px-4 py-3">
                        {flag === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>CRITICAL</span>
                          </span>
                        ) : flag === 'abnormal' ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            ABNORMAL
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Action: Log Critical Call */}
                      <td className="px-4 py-3 text-right">
                        {flag === 'critical' && (
                          <button
                            onClick={() => {
                              setCritParamId(param.id);
                              setShowCritModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Log Critical Alert</span>
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

      {/* MODAL 1: Submit for Review & QA Attestation */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Documented Quality Check Attestation</span>
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Before submitting clinical results to the Authorized Reviewer queue, you must confirm that all internal quality control (QC) checks, calibrations, and instrument operating parameters are satisfactory.
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documented Attestation Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qaAttestationNotes}
                  onChange={(e) => setQaAttestationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                <div className="font-bold">Notice on Result Immutability:</div>
                <p>
                  Editing results after submission invalidates the pending submission and requires fresh quality attestation.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Attest & Submit to Review Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Critical Result Communication */}
      {showCritModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Log Critical Result Communication</span>
              </h2>
            </div>

            <p className="text-xs text-slate-600">
              Laboratory safety requires rapid notification of critical results to the ordering physician or authorized clinical staff with verbatim read-back confirmation.
            </p>

            <form onSubmit={handleSaveCriticalNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Watson / Nurse Triage"
                  value={critRecipient}
                  onChange={(e) => setCritRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Role & Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attending Physician (+1 555-882-9910)"
                  value={critPhone}
                  onChange={(e) => setCritPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Method of Communication *
                </label>
                <select
                  value={critMethod}
                  onChange={(e) => setCritMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="phone_call">Telephone Call</option>
                  <option value="in_person">In Person</option>
                  <option value="secure_messaging">Direct Secure Messaging</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={critReadBack}
                    onChange={(e) => setCritReadBack(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Verbatim Read-Back Confirmed by Recipient</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  A documented note alone is not sufficient; explicit read-back confirmation is required for report release.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Clinic informed patient has been directed to urgent care"
                  value={critNotes}
                  onChange={(e) => setCritNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCritModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                >
                  Save Critical Notification Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
