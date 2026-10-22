'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import { Order, ReportVersion } from '@/lib/types';
import {
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  ShieldCheck,
  Send,
  Eye,
  History,
  X,
  User,
  Search,
  Filter,
  Stethoscope,
  Clock,
  Printer,
  ChevronRight,
  Info,
  BadgeAlert,
  ArrowRight,
  FileBadge,
} from 'lucide-react';

export default function ReportsManagementPage() {
  const [, setTick] = useState(0);

  // Active sub-tab: queue vs archive
  const [activeTab, setActiveTab] = useState<'queue' | 'archive'>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  // Return for Correction Modal State
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnComments, setReturnComments] = useState('');

  // Authorize Modal State
  const [authModalOrder, setAuthModalOrder] = useState<Order | null>(null);
  const [authComments, setAuthComments] = useState('Clinically verified and authorized for diagnostic release.');

  // Amendment Modal State
  const [amendModalReport, setAmendModalReport] = useState<ReportVersion | null>(null);
  const [amendReason, setAmendReason] = useState('');
  const [amendNotes, setAmendNotes] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const isReviewer = activeStaff.roles.includes('authorized_reviewer');
  const currency = globalStore.lab.currency_code;

  // Submissions Awaiting Authorization
  const pendingOrders = globalStore.orders.filter((o) =>
    o.submissions.some((s) => s.status === 'pending')
  );

  // Released / Authorized Reports
  const releasedReports = globalStore.orders.flatMap((o) => o.report_versions);

  // Filtered reports for archive
  const filteredReports = releasedReports.filter((rep) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const patientName = rep.report_snapshot.patient.full_name.toLowerCase();
    const repNum = rep.report_number.toLowerCase();
    return patientName.includes(q) || repNum.includes(q);
  });

  // Handle Authorize
  const handleConfirmAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModalOrder) return;
    setActionError('');
    setActionSuccess('');

    try {
      const sub = authModalOrder.submissions.find((s) => s.status === 'pending');
      if (!sub) throw new Error('No pending review submission found for this order');

      const newReport = globalStore.authorizeReport(authModalOrder.id, sub.id, authComments);

      // Immediately trigger release and PDF generation
      globalStore.releaseReport(newReport.id, `reports/${newReport.report_number}.pdf`);

      setActionSuccess(
        `Report ${newReport.report_number} clinically authorized and officially released! Ready for printing and download.`
      );
      setAuthModalOrder(null);
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  // Handle Return for Correction
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    setActionError('');
    setActionSuccess('');

    try {
      const sub = returnModalOrder.submissions.find((s) => s.status === 'pending');
      if (!sub) throw new Error('No pending submission');

      globalStore.returnForCorrection(returnModalOrder.id, sub.id, returnComments);
      setActionSuccess(`Submission returned to lab technologist for correction: "${returnComments}"`);
      setReturnModalOrder(null);
      setReturnComments('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  // Handle Amendment
  const handleConfirmAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendModalReport) return;
    setActionError('');
    setActionSuccess('');

    try {
      if (!amendReason || amendReason.trim().length < 10) {
        throw new Error('A detailed clinical reason (minimum 10 characters) is required for report amendments');
      }
      if (!amendNotes || amendNotes.trim().length < 10) {
        throw new Error('Documented communication to the ordering physician regarding material corrections is required');
      }

      // Mark prior version superseded
      amendModalReport.status = 'superseded';
      amendModalReport.amendment_reason = amendReason;
      amendModalReport.correction_communication_notes = amendNotes;

      // Find order and reset to pending review
      const order = globalStore.orders.find((o) => o.id === amendModalReport.order_id);
      if (order) {
        order.status = 'in_progress';
      }

      globalStore.recordAudit('report_amendment_initiated', 'report_versions', amendModalReport.id, {
        prior_report: amendModalReport.report_number,
        reason: amendReason,
      });

      setActionSuccess(
        `Report ${amendModalReport.report_number} marked SUPERSEDED. Please enter amended results and re-submit for pathologist authorization.`
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Reports & Review</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Pathology Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical pathologist sign-off, independent review enforcement, official A4 PDF generation, and versioned amendments.
          </p>
        </div>

        {/* Pathologist Verification Badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            DR
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Verified Signatory</div>
            <div className="text-xs font-bold text-slate-900">Dr. Rishika (Pathologist)</div>
            <div className="text-[10px] text-teal-700 font-mono">Reg #TSMC-74892 • All Scopes</div>
          </div>
        </div>
      </div>

      {/* Role Notice Banner if active user is not Dr. Rishika / Authorized Reviewer */}
      {!isReviewer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Active Staff: {activeStaff.full_name} ({activeStaff.roles.join(', ')})</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Clinical report authorization is legally restricted to verified staff holding the <strong>Authorized Reviewer</strong> role. You can inspect submissions and download released reports. To authorize or return submissions, switch to <strong>Dr. Rishika</strong> in the top header.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-medium">{actionError}</div>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium">{actionSuccess}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'queue'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Awaiting Clinical Review</span>
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              pendingOrders.length > 0
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {pendingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'archive'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Released Reports Library</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
            {releasedReports.length}
          </span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Review Queue Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no diagnostic orders currently awaiting clinical review or authorization. New submissions will appear here once technologist testing is complete.
              </p>
              <Link
                href="/tests"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                <span>View Result Entry Worklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((ord) => {
                const sub = ord.submissions.find((s) => s.status === 'pending')!;
                const hasCritical = ord.results.some((r) => r.flag === 'critical');
                const critCommunicated = ord.critical_notifications.some((cn) => cn.read_back_confirmed);

                // Self approval check: Can reviewer authorize?
                const isAuthorSelf = ord.results.some((r) => r.entered_by === activeStaff.id);

                return (
                  <div
                    key={ord.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Row: Order Details */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {ord.patient?.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{ord.patient?.full_name}</span>
                            <span className="font-mono text-xs text-slate-500 font-semibold">{ord.order_number}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                ord.priority === 'stat'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {ord.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            MRN: <strong className="text-slate-700">{ord.patient?.patient_number}</strong> • Ordered by: <strong>{ord.ordering_physician || 'Self / Walk-in'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Submitted {new Date(sub.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Tests & Results Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnostic Panels</div>
                        <div className="font-bold text-slate-800">
                          {ord.tests.map((t) => t.test_name_snapshot).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ord.results.length} total parameters tested
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Technologist QC Attestation</div>
                        <div className="text-slate-800 font-medium italic truncate" title={sub.qa_attestation_notes}>
                          "{sub.qa_attestation_notes}"
                        </div>
                        <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                          Daily calibration verified
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Invariants</div>
                        {hasCritical ? (
                          critCommunicated ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Critical call verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Critical read-back pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Standard values within bounds
                          </span>
                        )}

                        {isAuthorSelf && (
                          <div className="text-[11px] text-rose-700 font-bold mt-1">
                            Self-Approval Block: You entered these results
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {/* Preview Draft PDF */}
                        <a
                          href={`/api/reports/${ord.id}/pdf?draft=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preview Clinical Draft PDF</span>
                        </a>

                        <Link
                          href={`/tests/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all"
                        >
                          <span>Inspect Raw Values</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReviewer && (
                          <>
                            <button
                              onClick={() => {
                                setReturnModalOrder(ord);
                                setReturnComments('');
                              }}
                              className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
                            >
                              Return for Correction
                            </button>
                            <button
                              disabled={isAuthorSelf || (hasCritical && !critCommunicated)}
                              onClick={() => {
                                setAuthModalOrder(ord);
                                setAuthComments('Clinically verified and authorized for diagnostic release.');
                              }}
                              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition-all"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Authorize & Release Report</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RELEASED REPORTS ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search released reports by patient name or report number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredReports.length} released clinical documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Report Reference</th>
                  <th className="px-4 py-3 font-semibold">Patient & Order</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Authorizing Reviewer</th>
                  <th className="px-4 py-3 font-semibold">Release Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Official Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((rep) => {
                  const order = globalStore.orders.find((o) => o.id === rep.order_id);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {rep.report_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{rep.report_snapshot.patient.full_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{order?.order_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
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
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rep.status}
                        </span>
                        {rep.amendment_reason && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5 max-w-xs truncate" title={rep.amendment_reason}>
                            Amended: {rep.amendment_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{rep.report_snapshot.reviewer.full_name}</div>
                        <div className="text-[10px] text-teal-700">{rep.report_snapshot.reviewer.credentials}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {rep.released_at ? new Date(rep.released_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {/* Download A4 PDF */}
                        <a
                          href={`/api/reports/${rep.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download A4 PDF</span>
                        </a>

                        {/* Issue Amendment if released and active reviewer */}
                        {rep.status === 'released' && isReviewer && (
                          <button
                            onClick={() => {
                              setAmendModalReport(rep);
                              setAmendReason('');
                              setAmendNotes('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Amend</span>
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
      )}

      {/* MODAL 1: Authorize Report */}
      {authModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Clinical Authorization & Digital Release
                  </h2>
                  <p className="text-xs text-slate-500">Order {authModalOrder.order_number}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are certifying that all clinical values for patient <strong>{authModalOrder.patient?.full_name}</strong> have been reviewed and validated under laboratory accreditation standards.
            </p>

            <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-teal-700" />
                <span>Verified Pathologist Credentials</span>
              </div>
              <p>Authorizing Reviewer: <strong>{activeStaff.full_name}</strong></p>
              <p>Title: {activeStaff.reviewer_scope?.credentials_title || 'Consultant Pathologist'}</p>
              <p>Medical License: {activeStaff.reviewer_scope?.medical_license_number || 'TSMC-74892'}</p>
              <p>Scope: {activeStaff.reviewer_scope?.verified_scopes.join(', ') || 'ALL'}</p>
            </div>

            <form onSubmit={handleConfirmAuthorize} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorization Comments & Interpretation Notes
                </label>
                <textarea
                  rows={2}
                  value={authComments}
                  onChange={(e) => setAuthComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuthModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign & Release Official Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Return for Correction */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-amber-100">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-amber-900">
                    Return for Correction
                  </h2>
                  <p className="text-xs text-amber-700">Order {returnModalOrder.order_number}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Clinical Correction Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Platelet count appears clotted on smear; please re-run with vortex mixing or request new EDTA tube"
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to Technologist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Issue Corrected Report (Amendment) */}
      {amendModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                  <BadgeAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-rose-900">
                    Issue Corrected Diagnostic Report
                  </h2>
                  <p className="text-xs text-rose-700">Superseding {amendModalReport.report_number}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Issuing an amended report archives the original version as <strong>SUPERSEDED</strong> and creates a transparent audit trail detailing the clinical reason and physician communication.
            </p>

            <form onSubmit={handleConfirmAmendment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Justification for Amendment * (min 10 chars)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Clinician requested repeat test due to sudden shift; secondary run confirmed..."
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documented Physician Communication Notes * (min 10 chars)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Communicated corrected value directly to Dr. Ramesh at 14:30 via phone"
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAmendModalReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Supersede & Amend Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
