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
} from 'lucide-react';

export default function ReportsManagementPage() {
  const [, setTick] = useState(0);

  // Return for Correction Modal State
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnComments, setReturnComments] = useState('');

  // Authorize Modal State
  const [authModalOrder, setAuthModalOrder] = useState<Order | null>(null);
  const [authComments, setAuthComments] = useState('Authorized for clinical release');

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

  // Submissions Awaiting Authorization
  const pendingOrders = globalStore.orders.filter((o) =>
    o.submissions.some((s) => s.status === 'pending')
  );

  // Released / Authorized Reports
  const releasedReports = globalStore.orders.flatMap((o) => o.report_versions);

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
        `Order ${authModalOrder.order_number} clinically authorized and released as ${newReport.report_number}!`
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
      setActionSuccess(`Submission returned for correction: "${returnComments}"`);
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
        throw new Error('A detailed clinical reason (minimum 10 characters) is required for amendments');
      }
      if (!amendNotes || amendNotes.trim().length < 10) {
        throw new Error('Documented communication of material corrections is required');
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic Reports & Review</h1>
          <p className="text-sm text-slate-600 mt-1">
            Clinical pathologist sign-off, independent authorization, A4 PDF generation, and versioned amendments.
          </p>
        </div>
      </div>

      {/* Role Restriction Banner if user is not Authorized Reviewer */}
      {!isReviewer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Note:</strong> You are signed in as <strong>{activeStaff.full_name} ({activeStaff.roles.join(', ')})</strong>.
              Clinical authorization and return-for-correction are strictly restricted to staff holding the active <strong>Authorized Reviewer</strong> credential.
              You can view and download released reports. To authorize, switch to <strong>Dr. Eleanor Vance</strong> in the top bar.
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
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

      {/* 1. Review Queue: Submissions Awaiting Authorization */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Review Queue: Submissions Awaiting Authorization ({pendingOrders.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Pathologist scope & independent authorization verified</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No submissions currently awaiting clinical review.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingOrders.map((ord) => {
              const sub = ord.submissions.find((s) => s.status === 'pending')!;
              const hasCritical = ord.results.some((r) => r.flag === 'critical');
              const critCommunicated = ord.critical_notifications.some((cn) => cn.read_back_confirmed);

              return (
                <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-1.5">
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

                    <div className="text-xs text-slate-600">
                      Tests: <strong className="text-slate-800">{ord.tests.map((t) => t.test_code_snapshot).join(', ')}</strong>
                      {' • '}Submitted: {new Date(sub.submitted_at).toLocaleTimeString()}
                    </div>

                    {/* QA Attestation Notes */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700">
                      <span className="font-semibold text-teal-800">Quality Attestation: </span>
                      {sub.qa_attestation_notes}
                    </div>

                    {hasCritical && (
                      <div className="flex items-center gap-2 text-xs">
                        {critCommunicated ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Critical communication confirmed with read-back</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Critical alert communication NOT yet confirmed (Authorization blocked)</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Draft Preview Link */}
                    <a
                      href={`/api/reports/${ord.id}/pdf?draft=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Draft PDF</span>
                    </a>

                    {isReviewer && (
                      <>
                        <button
                          onClick={() => {
                            setReturnModalOrder(ord);
                            setReturnComments('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                        >
                          Return for Correction
                        </button>
                        <button
                          onClick={() => {
                            setAuthModalOrder(ord);
                            setAuthComments('Authorized for clinical release');
                          }}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Authorize & Release</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Released Clinical Reports History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Released Reports & Version History</h2>
          </div>
          <span className="text-xs text-slate-500">Immutable JSON snapshots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Report Number</th>
                <th className="px-4 py-3">Patient & Order</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Authorized By</th>
                <th className="px-4 py-3">Released At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {releasedReports.map((rep) => {
                const order = globalStore.orders.find((o) => o.id === rep.order_id);
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{rep.report_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{rep.report_snapshot.patient.full_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{order?.order_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        v{rep.version_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          rep.status === 'released'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.status === 'superseded'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rep.status.toUpperCase()}
                      </span>
                      {rep.amendment_reason && (
                        <div className="text-[10px] text-amber-800 italic mt-0.5">
                          Amended: {rep.amendment_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{rep.report_snapshot.reviewer.full_name}</div>
                      <div className="text-[10px] text-slate-400">{rep.report_snapshot.reviewer.credentials}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {rep.released_at ? new Date(rep.released_at).toLocaleString() : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {/* Download PDF */}
                      <a
                        href={`/api/reports/${rep.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100"
                      >
                        <Download className="w-3 h-3" />
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
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

      {/* MODAL 1: Authorize Report */}
      {authModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Clinical Report Authorization</span>
              </h2>
            </div>

            <p className="text-xs text-slate-600">
              You are authorizing order <strong>{authModalOrder.order_number}</strong> for patient{' '}
              <strong>{authModalOrder.patient?.full_name}</strong>.
            </p>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 space-y-1">
              <div className="font-bold">Reviewer Verification Check:</div>
              <p>Reviewer: {activeStaff.full_name}</p>
              <p>Credentials: {activeStaff.reviewer_scope?.credentials_title}</p>
              <p>Verified Scopes: {activeStaff.reviewer_scope?.verified_scopes.join(', ')}</p>
            </div>

            <form onSubmit={handleConfirmAuthorize} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorization Comments
                </label>
                <textarea
                  rows={2}
                  value={authComments}
                  onChange={(e) => setAuthComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuthModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Confirm Authorization & Release PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Return for Correction */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-amber-800 flex items-center gap-1.5">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>Return Results for Correction</span>
              </h2>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Clinical Correction Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Discrepancy between RBC and Hematocrit; please re-run sample on analyzer #2"
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                >
                  Return to Technologist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Issue Amendment */}
      {amendModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>Issue Report Amendment</span>
              </h2>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-bold">Clinical Amendment Standard:</div>
              <p>
                Earlier released versions ({amendModalReport.report_number}) cannot be recalled from external physical possession.
                This workflow marks version {amendModalReport.version_number} SUPERSEDED and creates a new version requiring fresh review and authorization.
              </p>
            </div>

            <form onSubmit={handleConfirmAmendment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Amendment Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Corrected clinical indication from ordering clinic; re-verified calibration"
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documented Communication of Material Correction *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Dr. House Clinic notified by telephone of amended report issuance at 14:30"
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAmendModalReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                >
                  Supersede & Unlock for Amendment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
