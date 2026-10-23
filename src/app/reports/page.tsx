'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import { Order, ReportVersion } from '@/lib/types';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3EAF3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#10213B] tracking-tight">
              Diagnostic Reports
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1565D8] border border-blue-200">
              Official A4 Archive
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Print, download, and review officially finalized laboratory reports. Clinical Laboratory Director: {lab.clinical_director || 'Vakiti Padma Reddy'}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] bg-white border border-[#E3EAF3] px-3.5 py-2 rounded-xl shadow-xs">
          <FlaskConical className="w-4 h-4 text-[#1565D8]" />
          <span>
            {lab.name} • {lab.address}
          </span>
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3 shadow-xs">
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Simple Two-Tab Filter: Reports Ready vs. Pending Sign-off */}
      <div className="flex border-b border-[#E3EAF3] gap-6">
        <button
          type="button"
          onClick={() => setFilterTab('ready')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            filterTab === 'ready'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Reports Ready ({releasedReports.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            filterTab === 'pending'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Sign-off ({pendingOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS READY (Released Archive) */}
      {filterTab === 'ready' && (
        <div className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden space-y-4 p-5">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, MRN, or report number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
              />
            </div>
            <span className="text-xs text-[#64748B]">
              Showing {filteredReports.length} finalized diagnostic documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F5F8FC] text-[#64748B] font-semibold border-b border-[#E3EAF3]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Report Reference</th>
                  <th className="px-4 py-3 font-semibold">Patient & Order</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Release Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF3]">
                {filteredReports.length > 0 ? (
                  filteredReports.map((rep) => {
                    const order = globalStore.orders.find((o) => o.id === rep.order_id);
                    return (
                      <tr key={rep.id} className="hover:bg-[#F5F8FC]/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#10213B]">
                          {rep.report_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#10213B]">
                            {rep.report_snapshot.patient.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-[#64748B]">
                            {order?.order_number || rep.report_snapshot.order_number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F8FC] text-[#172B4D] border border-[#E3EAF3]">
                            v{rep.version_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rep.status === 'released'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : rep.status === 'superseded'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-[#1565D8] border border-blue-200'
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
                        <td className="px-4 py-3 text-[#64748B]">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#10213B] bg-white hover:bg-[#F5F8FC] rounded-lg border border-[#E3EAF3] transition-all disabled:opacity-50"
                            title="Open A4 PDF to print"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#1565D8]" />
                            <span>Print</span>
                          </button>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(rep)}
                            disabled={isGeneratingPdf === rep.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1565D8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all disabled:opacity-50"
                            title="Download finalized A4 PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>

                          {/* Inspect / Open Order */}
                          {order && (
                            <Link
                              href={`/tests/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#10213B] bg-[#F5F8FC] rounded-lg border border-[#E3EAF3] transition-all"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all"
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
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#64748B]">
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
        <div className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF3]">
            <div>
              <h2 className="text-sm font-bold text-[#10213B]">
                Orders Awaiting Final Report Sign-off
              </h2>
              <p className="text-xs text-[#64748B]">
                Results have been entered and submitted. Click to open result entry and finalize report.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              {pendingOrders.length} Pending
            </span>
          </div>

          <div className="divide-y divide-[#E3EAF3]">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F8FC]/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#10213B]">
                        {ord.order_number}
                      </span>
                      <span className="font-bold text-sm text-[#10213B]">
                        {ord.patient?.full_name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {ord.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Tests: {ord.tests.map((t) => t.test_name_snapshot).join(', ')} • MRN:{' '}
                      <span className="font-mono">{ord.patient?.patient_number}</span>
                    </p>
                  </div>

                  <Link
                    href={`/tests/${ord.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-xs transition-all self-start sm:self-auto"
                  >
                    <span>Open Result Entry & Finalize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No orders are currently pending sign-off. All submitted orders are released!
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Issue Report Amendment */}
      {amendModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E3EAF3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#10213B]">
                    Document Clinical Amendment
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Report {amendModalReport.report_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmendModalReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Clinical Laboratory guidelines require documenting material corrections, reason for amendment, and communication with ordering physician before issuing a revised version.
            </p>

            <form onSubmit={handleConfirmAmendment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Material Reason for Clinical Amendment *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Specimen re-analyzed due to dilution correction."
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Physician Communication Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Notified ordering physician of updated analytical values."
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3EAF3]">
                <button
                  type="button"
                  onClick={() => setAmendModalReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Mark Superseded & Amend</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
