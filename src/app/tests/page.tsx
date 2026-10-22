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
  Sparkles,
  Search,
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

  const handleSpecimenAction = (
    specimenId: string,
    action: 'collect' | 'receive' | 'collect_and_receive' | 'complete' | 'cancel',
    reason?: string
  ) => {
    setActionError('');
    setActionSuccess('');
    try {
      const updated = globalStore.updateSpecimenStatus(specimenId, action, reason);
      setActionSuccess(`Specimen ${updated.specimen_number} updated to ${updated.status.replace(/_/g, ' ').toUpperCase()}`);
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

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
        `Specimen ${rejectModalSpecimen.specimen_number} marked REJECTED. Replacement recollection specimen automatically scheduled.`
      );
      setRejectModalSpecimen(null);
      setRejectionReason('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const getTubeBadge = (container: string) => {
    if (container.toLowerCase().includes('lavender')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">🟣 Lavender EDTA</span>;
    }
    if (container.toLowerCase().includes('gold') || container.toLowerCase().includes('sst')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">🟡 Gold SST</span>;
    }
    if (container.toLowerCase().includes('gray')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300">⚪ Gray Fluoride</span>;
    }
    return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800">🧪 {container}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tests & Results Operations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Specimen intake (Collect & Receive), replacement recollections, clinical result entry, and quality check submissions.
          </p>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl max-w-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('specimens')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'specimens'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Specimen Intake Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'results'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Result Entry Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'catalogue'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Test Catalogue ({globalStore.tests.length})</span>
        </button>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: Specimen Tracking */}
      {activeTab === 'specimens' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Specimen Phlebotomy & Intake Desk</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click "Collect & Receive" for fast on-site phlebotomy receipt</p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              On-Site Protocol
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Specimen #</th>
                  <th className="px-4 py-3">Patient & Order</th>
                  <th className="px-4 py-3">Specimen & Tube Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Collected / Received</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalStore.orders.flatMap((o) =>
                  o.specimens.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {s.specimen_number}
                        {s.parent_specimen_id && (
                          <span className="block text-[10px] text-amber-700 font-sans font-semibold">
                            (Recollection Replacement)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{o.patient?.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.order_number}</div>
                      </td>
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-semibold text-slate-800">{s.specimen_type}</div>
                        {getTubeBadge(s.container_type)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'received' || s.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : s.status === 'collected'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : s.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {s.status.toUpperCase().replace(/_/g, ' ')}
                        </span>
                        {s.rejection_reason && (
                          <div className="text-[10px] text-rose-700 mt-1 italic">
                            Reason: {s.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {s.received_at ? (
                          <div className="font-medium text-slate-800">
                            Recv: {new Date(s.received_at).toLocaleTimeString()}
                          </div>
                        ) : s.collected_at ? (
                          <div>Coll: {new Date(s.collected_at).toLocaleTimeString()}</div>
                        ) : (
                          <span className="text-amber-700 font-semibold">Pending Collection</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {s.status === 'awaiting_collection' && (
                          <>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect_and_receive')}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-2xs transition-colors"
                              title="Collect on-site and immediately receive"
                            >
                              ✓ Collect & Receive
                            </button>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect')}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                            >
                              Collect
                            </button>
                          </>
                        )}
                        {s.status === 'collected' && (
                          <button
                            onClick={() => handleSpecimenAction(s.id, 'receive')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs"
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
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
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
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Result Entry Worklist</h2>
            <span className="text-xs text-slate-500 font-medium">Orders with received specimens</span>
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
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-base text-slate-900">{ord.order_number}</span>
                      <span className="font-extrabold text-slate-800 text-sm">{ord.patient?.full_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.priority === 'stat'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : ord.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>Tests: <strong className="text-slate-800 font-bold">{ord.tests.map((t) => t.test_code_snapshot).join(', ')}</strong></span>
                      <span>•</span>
                      <span>Parameters completed: <strong className="text-teal-800 font-bold">{filledParams} / {totalParams}</strong></span>
                    </div>

                    {/* Flags */}
                    <div className="flex items-center gap-2 pt-1">
                      {hasCritical && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>CRITICAL ALERT DETECTED</span>
                        </span>
                      )}
                      {hasAbnormal && !hasCritical && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Abnormal Values
                        </span>
                      )}
                      {latestSub && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Status: {latestSub.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tests/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-all"
                    >
                      <span>Open Result Entry Grid</span>
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
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Standard Test Catalogue & Qualified Reference Ranges</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approved by Clinical Laboratory Director (Vakiti Padma Reddy)</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              Active Catalogue: {globalStore.tests.length} tests
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {globalStore.tests.map((test) => (
              <div key={test.id} className="p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{test.name}</span>
                      <span className="font-mono text-xs text-slate-500 font-bold">({test.code})</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {test.department}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-3">
                      <span>Specimen: <strong className="text-slate-800">{test.specimen_type}</strong></span>
                      <span>•</span>
                      {getTubeBadge(test.container_type)}
                      <span>•</span>
                      <span>Turnaround: <strong>{test.turnaround_hours}h</strong></span>
                      <span>•</span>
                      <span>Fasting: <strong>{test.fasting_required ? 'Required' : 'No'}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">
                      ₹ {test.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Parameters table */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden mt-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80">
                      <tr>
                        <th className="px-4 py-2.5">Parameter Name</th>
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Unit</th>
                        <th className="px-4 py-2.5">Clinical Reference Limits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {test.parameters.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{p.code}</td>
                          <td className="px-4 py-2.5 capitalize">{p.result_type}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-700">{p.unit || '-'}</td>
                          <td className="px-4 py-2.5 text-teal-800 font-medium">
                            Consultant Pathologist Verified
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Reject Specimen & Order Recollection</span>
              </h2>
              <button
                onClick={() => setRejectModalSpecimen(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specimen: <strong className="text-slate-800">{rejectModalSpecimen.specimen_number}</strong> ({rejectModalSpecimen.specimen_type}).
              Rejecting this specimen preserves the audit record and automatically creates a new replacement sample for the patient.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Clinical Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Gross hemolysis, clotted blood, insufficient volume (QNS), wrong collection container"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalSpecimen(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
                >
                  Confirm Rejection & Reorder
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
