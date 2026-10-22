'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { globalStore } from '@/lib/store';
import { Specimen } from '@/lib/types';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';

function TestsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'specimens';
  const [activeTab, setActiveTab] = useState<'specimens' | 'results' | 'catalogue'>(
    initialTab as 'specimens' | 'results' | 'catalogue'
  );

  const [, setTick] = useState(0);
  const [rejectModalSpecimen, setRejectModalSpecimen] = useState<Specimen | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  // Specimen Quick Action
  const handleSpecimenAction = (
    specimenId: string,
    action: 'collect' | 'receive' | 'collect_and_receive' | 'complete' | 'cancel',
    reason?: string
  ) => {
    setActionError('');
    setActionSuccess('');
    try {
      const updated = globalStore.updateSpecimenStatus(specimenId, action, reason);
      setActionSuccess(`Specimen ${updated.specimen_number} updated to ${updated.status.replace(/_/g, ' ')}`);
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  // Specimen Rejection & Recollection
  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalSpecimen) return;
    setActionError('');

    try {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Mandatory rejection reason required');
      }

      globalStore.updateSpecimenStatus(rejectModalSpecimen.id, 'reject', rejectionReason);
      setActionSuccess(
        `Specimen ${rejectModalSpecimen.specimen_number} marked REJECTED. Replacement recollection specimen automatically generated.`
      );
      setRejectModalSpecimen(null);
      setRejectionReason('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tests & Results</h1>
          <p className="text-sm text-slate-600 mt-1">
            Specimen tracking, replacement recollections, clinical result entry, and quality check submissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('specimens')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'specimens'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Specimen Tracking Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'results'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Result Entry Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalogue'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Test Catalogue & Reference Limits</span>
        </button>
      </div>

      {/* Alert Messages */}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: Specimen Tracking */}
      {activeTab === 'specimens' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Laboratory Specimen Intake & Tracking</h2>
            <span className="text-xs text-slate-500">Collect & Receive support for on-site phlebotomy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Specimen #</th>
                  <th className="px-4 py-3">Order / Patient</th>
                  <th className="px-4 py-3">Type & Container</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Collected / Received</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalStore.orders.flatMap((o) =>
                  o.specimens.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {s.specimen_number}
                        {s.parent_specimen_id && (
                          <span className="block text-[10px] text-amber-600">
                            (Recollection replacement)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{o.patient?.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.order_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{s.specimen_type}</div>
                        <div className="text-[11px] text-slate-500">{s.container_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.status === 'received' || s.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'collected'
                              ? 'bg-blue-100 text-blue-800'
                              : s.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status.toUpperCase().replace(/_/g, ' ')}
                        </span>
                        {s.rejection_reason && (
                          <div className="text-[10px] text-rose-700 mt-0.5 italic">
                            Reason: {s.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {s.received_at ? (
                          <div>Recv: {new Date(s.received_at).toLocaleTimeString()}</div>
                        ) : s.collected_at ? (
                          <div>Coll: {new Date(s.collected_at).toLocaleTimeString()}</div>
                        ) : (
                          <span>Pending collection</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {s.status === 'awaiting_collection' && (
                          <>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect_and_receive')}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 rounded hover:bg-teal-700 shadow-sm"
                              title="Collect on-site and immediately receive"
                            >
                              Collect & Receive
                            </button>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect')}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200"
                            >
                              Collect
                            </button>
                          </>
                        )}
                        {s.status === 'collected' && (
                          <button
                            onClick={() => handleSpecimenAction(s.id, 'receive')}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Receive in Lab
                          </button>
                        )}
                        {['awaiting_collection', 'collected', 'received'].includes(s.status) && (
                          <button
                            onClick={() => {
                              setRejectModalSpecimen(s);
                              setRejectionReason('');
                            }}
                            className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
                          >
                            Reject & Recollect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Result Entry Worklist */}
      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Result Entry Worklist</h2>
            <span className="text-xs text-slate-500">Orders with specimens received awaiting testing</span>
          </div>

          <div className="divide-y divide-slate-100">
            {globalStore.orders.map((ord) => {
              const totalParams = ord.tests.reduce((acc, t) => acc + t.parameters.length, 0);
              const filledParams = ord.results.filter(
                (r) =>
                  (r.numeric_value !== null && r.numeric_value !== undefined) ||
                  (r.text_value && r.text_value.trim().length > 0) ||
                  r.disposition !== 'performed'
              ).length;
              const hasCritical = ord.results.some((r) => r.flag === 'critical');
              const hasAbnormal = ord.results.some((r) => r.flag === 'abnormal');
              const latestSub = ord.submissions[0];

              return (
                <div
                  key={ord.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">{ord.order_number}</span>
                      <span className="font-semibold text-slate-800">{ord.patient?.full_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.priority === 'stat'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>Tests: <strong className="text-slate-700">{ord.tests.map((t) => t.test_code_snapshot).join(', ')}</strong></span>
                      <span>•</span>
                      <span>Completion: <strong>{filledParams} / {totalParams} parameters</strong></span>
                    </div>

                    {/* Flags */}
                    <div className="flex items-center gap-2 pt-1">
                      {hasCritical && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>CRITICAL VALUE DETECTED</span>
                        </span>
                      )}
                      {hasAbnormal && !hasCritical && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Abnormal Values
                        </span>
                      )}
                      {latestSub && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                          Status: {latestSub.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tests/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
                    >
                      <span>Open Result Grid</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Catalogue & Reference Limits */}
      {activeTab === 'catalogue' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Standard Test Catalogue & Qualified Reference Ranges</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approved by Clinical Laboratory Director</p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              Active Catalogue: {globalStore.tests.length} tests
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {globalStore.tests.map((test) => (
              <div key={test.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{test.name}</span>
                      <span className="font-mono text-xs text-slate-500">({test.code})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {test.department}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Specimen: <strong>{test.specimen_type}</strong> ({test.container_type})</span>
                      <span>•</span>
                      <span>Turnaround: <strong>{test.turnaround_hours}h</strong></span>
                      <span>•</span>
                      <span>Fasting: <strong>{test.fasting_required ? 'Required' : 'No'}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900">
                      {globalStore.lab.currency_code} {test.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Parameters table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Parameter</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Reference Limits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {test.parameters.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 font-medium text-slate-900">{p.name}</td>
                          <td className="px-3 py-2 font-mono">{p.code}</td>
                          <td className="px-3 py-2 capitalize">{p.result_type}</td>
                          <td className="px-3 py-2">{p.unit || '-'}</td>
                          <td className="px-3 py-2 text-slate-700">
                            Pathologist Verified & Versioned
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Reject Specimen with Mandatory Reason */}
      {rejectModalSpecimen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Reject Specimen & Order Recollection</span>
              </h2>
              <button
                onClick={() => setRejectModalSpecimen(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specimen: <strong>{rejectModalSpecimen.specimen_number}</strong> ({rejectModalSpecimen.specimen_type}).
              Rejecting this specimen preserves the rejection history in audit logs and automatically orders a replacement recollection specimen for the patient.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Gross hemolysis, clotted sample, insufficient volume (QNS), improper container"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectModalSpecimen(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                >
                  Confirm Rejection & Trigger Recollection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsAndResultsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading tests & results worklist...</div>}>
      <TestsContent />
    </React.Suspense>
  );
}
