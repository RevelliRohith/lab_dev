'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import { ReportVersion } from '@/lib/types';
import {
  downloadReportPdfBlob,
  openReportPdfInNewTab,
} from '@/lib/pdf/report-generator';
import {
  FileCheck2,
  Download,
  Printer,
  Search,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

export default function ReportsManagementPage() {
  const [, setTick] = useState(0);

  // Active filter tab: 'ready' vs 'pending'
  const [filterTab, setFilterTab] = useState<'ready' | 'pending'>('ready');
  const [searchQuery, setSearchQuery] = useState('');

  // Amendment Modal State (preserves clinical audit trail)
  const [amendModalReport, setAmendModalReport] = useState<ReportVersion | null>(null);
  const [amendReason, setAmendReason] = useState('');
  const [amendNotes, setAmendNotes] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const isAdmin = activeStaff.roles.includes('admin');
  const lab = globalStore.lab;

  // Released / Finalized Reports
  const releasedReports = globalStore.orders.flatMap((o) => o.report_versions);

  // Filtered released reports
  const filteredReports = releasedReports.filter((rep) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const patientName = rep.report_snapshot.patient.full_name.toLowerCase();
    const repNum = rep.report_number.toLowerCase();
    const ordNum = rep.report_snapshot.order_number?.toLowerCase() || '';
    return patientName.includes(q) || repNum.includes(q) || ordNum.includes(q);
  });

  // Orders awaiting final sign-off
  const pendingOrders = globalStore.orders.filter(
    (o) =>
      o.submissions.some((s) => s.status === 'pending') && o.report_versions.length === 0
  );

  // Handle Client-side PDF Download
  const handleDownloadPdf = async (rep: ReportVersion) => {
    setActionError('');
    setIsGeneratingPdf(rep.id);
    try {
      await downloadReportPdfBlob(rep.report_snapshot, `${rep.report_number}.pdf`, {
        isSuperseded: rep.status === 'superseded',
      });
      setActionSuccess(`Report ${rep.report_number}.pdf downloaded successfully.`);
    } catch (err: unknown) {
      setActionError(`Error generating PDF: ${(err as Error).message}`);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  // Handle Client-side PDF View in new tab
  const handleViewPdf = async (rep: ReportVersion) => {
    setActionError('');
    setIsGeneratingPdf(rep.id);
    try {
      await openReportPdfInNewTab(rep.report_snapshot, {
        isSuperseded: rep.status === 'superseded',
      });
    } catch (err: unknown) {
      setActionError(`Error opening PDF: ${(err as Error).message}`);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  // Handle Amendment (Admin only)
  const handleConfirmAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendModalReport) return;
    setActionError('');
    setActionSuccess('');

    try {
      if (!amendReason || amendReason.trim().length < 5) {
        throw new Error('A detailed clinical reason is required for report amendments');
      }

      // Record audit and notify
      globalStore.recordAudit('report_amended', 'report_versions', amendModalReport.id, {
        report_number: amendModalReport.report_number,
        amendment_reason: amendReason,
        amendment_notes: amendNotes,
      });

      amendModalReport.amendment_reason = amendReason;
      amendModalReport.status = 'superseded';

      setActionSuccess(
        `Report ${amendModalReport.report_number} marked superseded. Proceed to test entry to record amended values.`
      );
      setAmendModalReport(null);
      setAmendReason('');
      setAmendNotes('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill text-[#2563EB] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Diagnostic Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12234A] tracking-tight">
            Diagnostic Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#526581] mt-1 max-w-xl">
            Print, download, and review officially finalized laboratory reports. Clinical Laboratory Director: {lab.clinical_director || 'Vakiti Padma Reddy'}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#526581] glass-card px-3.5 py-2 rounded-2xl border border-white/60 shadow-xs">
          <FlaskConical className="w-4 h-4 text-[#2563EB]" />
          <span>
            {lab.name} • {lab.address}
          </span>
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="p-4 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200/60 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two-Tab Filter in Liquid Glass Card */}
      <div className="inline-flex glass-card p-1.5 rounded-2xl border border-white/70 shadow-xs max-w-md w-full">
        <button
          type="button"
          onClick={() => setFilterTab('ready')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            filterTab === 'ready'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Reports Ready ({releasedReports.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            filterTab === 'pending'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Sign-off ({pendingOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS READY (Released Archive) */}
      {filterTab === 'ready' && (
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-[#526581] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, MRN, or report number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 text-xs text-[#12234A] rounded-xl outline-none"
              />
            </div>
            <span className="text-xs text-[#526581]">
              Showing {filteredReports.length} finalized diagnostic documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#12234A]">
              <thead className="bg-white/40 text-[#526581] font-semibold border-b border-white/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Report Reference</th>
                  <th className="px-4 py-3 font-semibold">Patient & Order</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Release Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredReports.length > 0 ? (
                  filteredReports.map((rep) => {
                    const order = globalStore.orders.find((o) => o.id === rep.order_id);
                    return (
                      <tr key={rep.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#12234A]">
                          {rep.report_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#12234A]">
                            {rep.report_snapshot.patient.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-[#526581]">
                            {order?.order_number || rep.report_snapshot.order_number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold glass-pill text-[#12234A]">
                            v{rep.version_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rep.status === 'released'
                                ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
                                : rep.status === 'superseded'
                                ? 'bg-amber-100/90 text-amber-800 border border-amber-200/60'
                                : 'bg-blue-100/90 text-[#2563EB] border border-blue-200/60'
                            }`}
                          >
                            {rep.status}
                          </span>
                          {rep.amendment_reason && (
                            <div
                              className="text-[10px] text-amber-800 italic mt-0.5 max-w-xs truncate"
                              title={rep.amendment_reason}
                            >
                              Amended: {rep.amendment_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#526581]" suppressHydrationWarning>
                          {rep.released_at
                            ? new Date(rep.released_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Released'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          {/* View / Print in Tab */}
                          <button
                            type="button"
                            onClick={() => handleViewPdf(rep)}
                            disabled={isGeneratingPdf === rep.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#12234A] glass-card hover:bg-white rounded-xl border border-white/60 transition-all disabled:opacity-50"
                            title="Open A4 PDF to print"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Print</span>
                          </button>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(rep)}
                            disabled={isGeneratingPdf === rep.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-all disabled:opacity-50"
                            title="Download finalized A4 PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>

                          {/* Inspect / Open Order */}
                          {order && (
                            <Link
                              href={`/tests/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#526581] hover:text-[#12234A] glass-card hover:bg-white rounded-xl transition-all"
                              title="Open result entry screen"
                            >
                              <span>View Order</span>
                            </Link>
                          )}

                          {/* Issue Amendment if released and Admin */}
                          {rep.status === 'released' && isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setAmendModalReport(rep);
                                setAmendReason('');
                                setAmendNotes('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/60 rounded-xl transition-all"
                              title="Record material correction or amendment"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Amend</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#526581]">
                      No released diagnostic reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING SIGN-OFF */}
      {filterTab === 'pending' && (
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-2 border-b border-white/60">
            <div>
              <h2 className="text-sm font-bold text-[#12234A]">
                Orders Awaiting Final Report Sign-off
              </h2>
              <p className="text-xs text-[#526581]">
                Results have been entered and submitted. Click to open result entry and finalize report.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50/80 text-amber-800 rounded-full border border-amber-200/60">
              {pendingOrders.length} Pending
            </span>
          </div>

          <div className="divide-y divide-white/40">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#12234A]">
                        {ord.order_number}
                      </span>
                      <span className="font-bold text-sm text-[#12234A]">
                        {ord.patient?.full_name}
                      </span>
                    </div>
                    <div className="text-xs text-[#526581] mt-1">
                      Tests: {ord.tests.map((t) => t.test_code_snapshot).join(', ')}
                    </div>
                  </div>
                  <Link
                    href={`/tests/${ord.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-xs glow-blue hover:brightness-105 transition-all"
                  >
                    <span>Open & Finalize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#526581]">
                No orders are currently waiting for sign-off.
              </div>
            )}
          </div>
        </div>
      )}

      {/* AMENDMENT MODAL */}
      {amendModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-base font-bold text-[#12234A]">
                Amend Report: {amendModalReport.report_number}
              </h2>
              <button
                type="button"
                onClick={() => setAmendModalReport(null)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAmendment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Mandatory Clinical Amendment Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Dilution factor correction, retested sample confirmed, clerical adjustment"
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Corrective Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional audit commentary"
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setAmendModalReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#526581] glass-card hover:bg-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all"
                >
                  Confirm & Supersede Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
