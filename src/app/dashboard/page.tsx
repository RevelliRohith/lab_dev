'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import { downloadReportPdfBlob } from '@/lib/pdf/report-generator';
import {
  Users,
  FlaskConical,
  FileCheck2,
  Receipt,
  UserPlus,
  FileEdit,
  Printer,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Download,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const staff = globalStore.getActiveStaff();
  const isAdmin = staff.roles.includes('admin');
  const lab = globalStore.lab;
  const currency = lab.currency_code;

  // Operational Counts (driven by real database/store data)
  const todayOrders = globalStore.orders.length;
  const samplesCollected = globalStore.orders.reduce((acc, o) => {
    return (
      acc +
      o.specimens.filter((s) => ['collected', 'received', 'completed'].includes(s.status)).length
    );
  }, 0);
  const resultsPending = globalStore.orders.filter((o) => {
    const hasSpecimen = o.specimens.some((s) =>
      ['collected', 'received', 'completed'].includes(s.status)
    );
    const isReleased = o.report_versions.length > 0;
    return hasSpecimen && !isReleased;
  }).length;
  const reportsReady = globalStore.orders.filter((o) => o.report_versions.length > 0).length;

  // Financial aggregates (Admin only)
  const totalBilled = globalStore.invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = globalStore.invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const totalOutstanding = globalStore.invoices.reduce((acc, i) => acc + i.balance_due, 0);
  const totalExpenses = globalStore.expenses.reduce((acc, e) => acc + e.amount, 0);

  // Recent audit events
  const recentActivities = [...globalStore.auditEvents].reverse().slice(0, 6);

  const formatActivityText = (event: typeof recentActivities[0]) => {
    const action = event.action.replace(/_/g, ' ');
    const entity = event.entity_type.replace(/_/g, ' ');
    return `${action.charAt(0).toUpperCase() + action.slice(1)} • ${entity}`;
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Compact Professional Welcome Banner (140px-170px) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10213B] via-[#1565D8] to-[#104fad] text-white p-6 sm:p-7 shadow-[0_4px_16px_rgba(21,101,216,0.15)]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <FlaskConical className="w-56 h-56 text-white stroke-[1.2]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>{lab.name} • Choutuppal, Telangana</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome! Rishi Laboratory — Accurate Results. Healthier Lives.
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Diagnostic laboratory operational overview. Phlebotomy, result entries, and official reports are synced in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#10213B] bg-white rounded-xl hover:bg-blue-50 shadow-sm transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-white/30"
            >
              <UserPlus className="w-4 h-4 text-[#1565D8]" />
              <span>+ Register Patient & Bill</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Operational Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <Link
          href="/patients"
          className="bg-white p-5 rounded-2xl border border-[#E3EAF3] shadow-[0_1px_3px_rgba(16,33,59,0.04)] hover:border-[#1565D8] hover:shadow-[0_4px_12px_rgba(21,101,216,0.08)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Patients Today
            </span>
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center group-hover:bg-[#1565D8] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#10213B]">{todayOrders}</div>
          <p className="mt-1 text-xs text-[#64748B] flex items-center gap-1 font-medium">
            <span>Registered laboratory visits</span>
            <ArrowRight className="w-3 h-3 text-[#1565D8] group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Samples Collected */}
        <Link
          href="/tests?tab=specimens"
          className="bg-white p-5 rounded-2xl border border-teal-200/90 shadow-[0_1px_3px_rgba(16,33,59,0.04)] hover:border-teal-400 hover:shadow-[0_4px_12px_rgba(13,148,136,0.08)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Samples Collected
            </span>
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <FlaskConical className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-teal-900">{samplesCollected}</div>
          <p className="mt-1 text-xs text-teal-700 flex items-center gap-1 font-medium">
            <span>Collected / received in laboratory</span>
            <ArrowRight className="w-3 h-3 text-teal-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Results Pending */}
        <Link
          href="/tests?tab=results"
          className="bg-white p-5 rounded-2xl border border-indigo-200/90 shadow-[0_1px_3px_rgba(16,33,59,0.04)] hover:border-indigo-400 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Results Pending
            </span>
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-indigo-900">{resultsPending}</div>
          <p className="mt-1 text-xs text-indigo-700 flex items-center gap-1 font-medium">
            <span>Awaiting result entry & submission</span>
            <ArrowRight className="w-3 h-3 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 4: Reports Ready */}
        <Link
          href="/reports"
          className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-[0_1px_3px_rgba(16,33,59,0.04)] hover:border-emerald-400 hover:shadow-[0_4px_12px_rgba(16,185,129,0.08)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Reports Ready
            </span>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-900">{reportsReady}</div>
          <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <span>Official reports ready to print & share</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* 3. Exactly Six Quick Action Tiles */}
      <div className="bg-white rounded-2xl border border-[#E3EAF3] p-5 shadow-[0_1px_3px_rgba(16,33,59,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1565D8]" />
            <h2 className="text-sm font-extrabold text-[#10213B] uppercase tracking-wider">
              Quick Operations Desk
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#64748B]">Common staff actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: New Patient */}
          <Link
            href="/patients"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-blue-50/80 border border-[#E3EAF3] hover:border-[#1565D8]/40 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#1565D8] flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-[#1565D8] group-hover:text-white transition-all shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-[#1565D8]">
              New Patient
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Register & MRN</span>
          </Link>

          {/* Tile 2: Create Bill */}
          <Link
            href="/patients"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-emerald-50/80 border border-[#E3EAF3] hover:border-emerald-300 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-emerald-700">
              Create Bill
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Order & Invoicing</span>
          </Link>

          {/* Tile 3: Collect Sample */}
          <Link
            href="/tests?tab=specimens"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-amber-50/80 border border-[#E3EAF3] hover:border-amber-300 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-amber-800">
              Collect Sample
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Phlebotomy desk</span>
          </Link>

          {/* Tile 4: Enter Results */}
          <Link
            href="/tests?tab=results"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-indigo-50/80 border border-[#E3EAF3] hover:border-indigo-300 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <FileEdit className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-indigo-800">
              Enter Results
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Analyte entries</span>
          </Link>

          {/* Tile 5: View Reports */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-teal-50/80 border border-[#E3EAF3] hover:border-teal-300 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-teal-800">
              View Reports
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Diagnostic reports</span>
          </Link>

          {/* Tile 6: Print Report */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F8FC] hover:bg-blue-50/80 border border-[#E3EAF3] hover:border-[#1565D8]/40 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#1565D8] flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-[#1565D8] group-hover:text-white transition-all shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#10213B] group-hover:text-[#1565D8]">
              Print Report
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Official A4 PDF</span>
          </Link>
        </div>
      </div>

      {/* 4. Financial Summary (Admin Only for Padma) */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl border border-[#E3EAF3] p-5 shadow-[0_1px_3px_rgba(16,33,59,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#10213B]">
                  Financial Overview (Administrator Desk)
                </h3>
                <p className="text-xs text-[#64748B]">Real-time laboratory revenue & dues</p>
              </div>
            </div>
            <Link
              href="/finance"
              className="text-xs text-[#1565D8] hover:text-[#104fad] flex items-center gap-1 font-bold underline"
            >
              <span>Manage Billing & Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#E3EAF3]">
              <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
                Total Billed
              </span>
              <div className="text-xl font-extrabold text-[#10213B] mt-1">
                ₹ {totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Total Collected
              </span>
              <div className="text-xl font-extrabold text-emerald-800 mt-1">
                ₹ {totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                Pending Patient Dues
              </span>
              <div className="text-xl font-extrabold text-amber-800 mt-1">
                ₹ {totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-800 font-bold uppercase tracking-wider">
                Lab Expenses
              </span>
              <div className="text-xl font-extrabold text-rose-800 mt-1">
                ₹ {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-white border border-[#E3EAF3] rounded-2xl text-xs text-[#64748B] flex items-center justify-between shadow-[0_1px_3px_rgba(16,33,59,0.04)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#1565D8]" />
            <span>Aggregate financial figures are restricted to the Administrator account (Padma).</span>
          </div>
          <span className="font-bold text-[#10213B]">Signed in as: {staff.full_name}</span>
        </div>
      )}

      {/* 5. Main Split: Today's Orders (Left 8-col) + Real Recent Activities (Right 4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Patient Orders Table */}
        <div className="lg:col-span-8 bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3EAF3] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1565D8]" />
              <h3 className="text-sm font-extrabold text-[#10213B]">
                Today&apos;s Patient Orders & Worklist
              </h3>
            </div>
            <Link
              href="/patients"
              className="text-xs font-bold text-[#1565D8] hover:underline"
            >
              View All Orders ({globalStore.orders.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F5F8FC] text-[#64748B] font-bold border-b border-[#E3EAF3]">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Tests Ordered</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Specimen Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Report Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF3]">
                {globalStore.orders.map((ord) => {
                  const latestRep = ord.report_versions[0];
                  const hasPendingSub = ord.submissions.some((s) => s.status === 'pending');
                  const specSummary = ord.specimens.map((s) => s.status).join(', ');

                  return (
                    <tr key={ord.id} className="hover:bg-[#F5F8FC]/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#10213B]">
                        {ord.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#10213B]">{ord.patient?.full_name}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          {ord.patient?.patient_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#172B4D]">
                        {ord.tests.map((t) => t.test_code_snapshot).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.priority === 'stat'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : ord.priority === 'urgent'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium capitalize text-[#64748B]">
                        {specSummary.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.payment_status === 'part_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {latestRep ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>RELEASED</span>
                          </span>
                        ) : hasPendingSub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1565D8] border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>Review Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {latestRep && (
                          <button
                            type="button"
                            onClick={() =>
                              downloadReportPdfBlob(latestRep.report_snapshot, `${latestRep.report_number}.pdf`, {
                                isSuperseded: latestRep.status === 'superseded',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1565D8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            title="Download official A4 PDF report"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        )}
                        <Link
                          href={`/tests/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#172B4D] bg-[#F5F8FC] hover:bg-[#E3EAF3] border border-[#E3EAF3] rounded-lg transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real Recent Activities Feed */}
        <div className="lg:col-span-4 bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3] mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1565D8]" />
                <h3 className="text-sm font-extrabold text-[#10213B]">
                  Recent Activity Trail
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>

            <div className="space-y-3.5">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F5F8FC] border border-[#E3EAF3]/70 hover:border-[#1565D8]/30 transition-all text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#1565D8] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#10213B] truncate">
                        {formatActivityText(act)}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 font-mono truncate">
                        {act.actor_email || 'Staff user'}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-[#64748B] shrink-0">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#64748B]">
                  No audit activities recorded today yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E3EAF3] flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Audit events logged:</span>
            <span className="font-mono font-bold text-[#10213B]">
              {globalStore.auditEvents.length} events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
