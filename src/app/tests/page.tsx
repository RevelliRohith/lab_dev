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
  FileSpreadsheet,
  ArrowRight,
  X,
  Layers,
  Sparkles,
  Phone,
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
      setActionSuccess(
        `Specimen ${updated.specimen_number} updated to ${updated.status.replace(/_/g, ' ').toUpperCase()}`
      );
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
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100/80 text-purple-800 border border-purple-200/50">
          🟣 Lavender EDTA
        </span>
      );
    }
    if (container.toLowerCase().includes('gold') || container.toLowerCase().includes('sst')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/50">
          🟡 Gold SST
        </span>
      );
    }
    if (container.toLowerCase().includes('gray')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300/50">
          ⚪ Gray Fluoride
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-[#2563EB] border border-blue-200/50">
        🧪 {container}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill text-[#2563EB] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phlebotomy & Technical Worklist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12234A] tracking-tight">
            Tests & Results Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#526581] mt-1 max-w-xl">
            Specimen intake (Collect & Receive), replacement recollections, clinical result entry, and quality check submissions.
          </p>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="inline-flex glass-card p-1.5 rounded-2xl border border-white/70 shadow-xs max-w-2xl w-full">
        <button
          onClick={() => setActiveTab('specimens')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'specimens'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Specimen Intake Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'results'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Result Entry Worklist</span>
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'catalogue'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Test Catalogue ({globalStore.tests.length})</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {actionError && (
        <div className="p-4 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200/60 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: Specimen Tracking */}
      {activeTab === 'specimens' && (
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
            <div>
              <h2 className="text-sm font-bold text-[#12234A]">Specimen Phlebotomy & Intake Desk</h2>
              <p className="text-xs text-[#526581] mt-0.5">Click &quot;Collect &amp; Receive&quot; for fast on-site phlebotomy receipt</p>
            </div>
            <span className="text-xs font-bold text-[#2563EB] glass-pill px-2.5 py-1">
              On-Site Protocol
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#12234A]">
              <thead className="bg-white/40 text-[#526581] font-bold border-b border-white/60">
                <tr>
                  <th className="px-4 py-3">Specimen #</th>
                  <th className="px-4 py-3">Patient & Order</th>
                  <th className="px-4 py-3">Specimen & Tube Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Collected / Received</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {globalStore.orders.flatMap((o) =>
                  o.specimens.map((s) => (
                    <tr key={s.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#12234A]">
                        {s.specimen_number}
                        {s.parent_specimen_id && (
                          <span className="block text-[10px] text-amber-700 font-sans font-semibold">
                            (Recollection Replacement)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#12234A]">{o.patient?.full_name}</div>
                        <div className="text-[11px] text-[#526581] font-mono">{o.order_number}</div>
                      </td>
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-semibold text-[#12234A]">{s.specimen_type}</div>
                        {getTubeBadge(s.container_type)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'received' || s.status === 'completed'
                              ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
                              : s.status === 'collected'
                              ? 'bg-blue-100/90 text-[#2563EB] border border-blue-200/60'
                              : s.status === 'rejected'
                              ? 'bg-rose-100/90 text-rose-800 border border-rose-200/60'
                              : 'bg-amber-100/90 text-amber-800 border border-amber-200/60'
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
                      <td className="px-4 py-3.5 text-[#526581]">
                        {s.received_at ? (
                          <div className="font-medium text-[#12234A]">
                            Recv: {new Date(s.received_at).toLocaleTimeString()}
                          </div>
                        ) : s.collected_at ? (
                          <div>Coll: {new Date(s.collected_at).toLocaleTimeString()}</div>
                        ) : (
                          <span className="text-amber-700 font-semibold">Pending Collection</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {s.status === 'awaiting_collection' && (
                          <>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect_and_receive')}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-xs glow-blue transition-all hover:brightness-105"
                              title="Collect on-site and immediately receive"
                            >
                              ✓ Collect & Receive
                            </button>
                            <button
                              onClick={() => handleSpecimenAction(s.id, 'collect')}
                              className="px-2.5 py-1.5 text-xs font-bold text-[#12234A] glass-card hover:bg-white rounded-xl"
                            >
                              Collect
                            </button>
                          </>
                        )}
                        {s.status === 'collected' && (
                          <button
                            onClick={() => handleSpecimenAction(s.id, 'receive')}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-xs glow-blue"
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
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50/80 border border-rose-200/60 rounded-xl hover:bg-rose-100"
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
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
            <h2 className="text-sm font-bold text-[#12234A]">Result Entry Worklist</h2>
            <span className="text-xs text-[#526581] font-medium">Orders with received specimens</span>
          </div>

          <div className="divide-y divide-white/40">
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
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-base text-[#12234A]">{ord.order_number}</span>
                      <span className="font-extrabold text-[#12234A] text-sm">{ord.patient?.full_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.priority === 'stat'
                            ? 'bg-rose-100/90 text-rose-800 border border-rose-200/60'
                            : ord.priority === 'urgent'
                            ? 'bg-amber-100/90 text-amber-800 border border-amber-200/60'
                            : 'bg-slate-100/90 text-slate-700'
                        }`}
                      >
                        {ord.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-[#526581] flex flex-wrap items-center gap-2">
                      <span>
                        Tests: <strong className="text-[#12234A] font-bold">{ord.tests.map((t) => t.test_code_snapshot).join(', ')}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Parameters completed:{' '}
                        <strong className="text-[#2563EB] font-bold">
                          {filledParams} / {totalParams}
                        </strong>
                      </span>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/80 text-[#2563EB]">
                          Status: {latestSub.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tests/${ord.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-xs glow-blue transition-all hover:brightness-105"
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
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
            <div>
              <h2 className="text-sm font-bold text-[#12234A]">
                Standard Test Catalogue & Qualified Reference Ranges
              </h2>
              <p className="text-xs text-[#526581] mt-0.5">
                Approved by Clinical Laboratory Director (Vakiti Padma Reddy)
              </p>
            </div>
            <span className="text-xs font-bold text-[#2563EB] glass-pill px-3 py-1">
              Active Catalogue: {globalStore.tests.length} tests
            </span>
          </div>

          <div className="divide-y divide-white/40">
            {globalStore.tests.map((test) => (
              <div key={test.id} className="p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#12234A] text-base">{test.name}</span>
                      <span className="font-mono text-xs text-[#526581] font-bold">({test.code})</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold glass-pill text-[#12234A] uppercase">
                        {test.department}
                      </span>
                    </div>
                    <div className="text-xs text-[#526581] mt-1.5 flex flex-wrap items-center gap-3">
                      <span>
                        Specimen: <strong className="text-[#12234A]">{test.specimen_type}</strong>
                      </span>
                      <span>•</span>
                      {getTubeBadge(test.container_type)}
                      <span>•</span>
                      <span>Turnaround: <strong>{test.turnaround_hours}h</strong></span>
                      <span>•</span>
                      <span>Fasting: <strong>{test.fasting_required ? 'Required' : 'No'}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#12234A]">
                      ₹ {test.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Parameters table */}
                <div className="glass-card rounded-2xl overflow-hidden mt-2 border border-white/60">
                  <table className="w-full text-left text-xs text-[#12234A]">
                    <thead className="bg-white/40 text-[#526581] font-bold border-b border-white/60">
                      <tr>
                        <th className="px-4 py-2.5">Parameter Name</th>
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Unit</th>
                        <th className="px-4 py-2.5">Clinical Reference Limits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {test.parameters.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2.5 font-bold text-[#12234A]">{p.name}</td>
                          <td className="px-4 py-2.5 font-mono text-[#526581]">{p.code}</td>
                          <td className="px-4 py-2.5 capitalize">{p.result_type}</td>
                          <td className="px-4 py-2.5 font-semibold text-[#12234A]">{p.unit || '-'}</td>
                          <td className="px-4 py-2.5 text-[#2563EB] font-medium">
                            Clinical Director Verified
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-base font-extrabold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Reject Specimen & Order Recollection</span>
              </h2>
              <button
                onClick={() => setRejectModalSpecimen(null)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#526581]">
              Specimen:{' '}
              <strong className="text-[#12234A]">{rejectModalSpecimen.specimen_number}</strong> (
              {rejectModalSpecimen.specimen_type}). Rejecting this specimen preserves the audit record and
              automatically creates a new replacement sample for the patient.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">
                  Mandatory Clinical Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Gross hemolysis, clotted blood, insufficient volume (QNS), wrong collection container"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setRejectModalSpecimen(null)}
                  className="px-4 py-2 text-xs font-bold text-[#526581] glass-card hover:bg-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md transition-all"
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
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#526581]">Loading tests & results worklist...</div>}>
      <TestsContent />
    </React.Suspense>
  );
}
