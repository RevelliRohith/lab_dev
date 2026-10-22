'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import {
  Users,
  FlaskConical,
  FileCheck2,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  UserPlus,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
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
  const isReviewer = staff.roles.includes('authorized_reviewer');
  const lab = globalStore.lab;
  const currency = lab.currency_code;

  // Operational Counts
  const todayOrders = globalStore.orders.length;
  const specimensAwaiting = globalStore.orders.reduce((acc, o) => {
    return acc + o.specimens.filter((s) => s.status === 'awaiting_collection').length;
  }, 0);
  const resultsAwaiting = globalStore.orders.filter((o) => {
    const hasReceived = o.specimens.some((s) => ['received', 'completed'].includes(s.status));
    const isCompleted = o.submissions.some((s) => ['authorized', 'released'].includes(s.status));
    return hasReceived && !isCompleted;
  }).length;
  const reportsAwaiting = globalStore.orders.filter((o) =>
    o.submissions.some((s) => s.status === 'pending')
  ).length;

  // Financial aggregates (Admin only)
  const totalBilled = globalStore.invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = globalStore.invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const totalOutstanding = globalStore.invoices.reduce((acc, i) => acc + i.balance_due, 0);
  const totalExpenses = globalStore.expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome & Shift Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-200 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>{lab.name} • {lab.address}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {staff.full_name}
            </h1>
            <p className="text-sm text-teal-100 max-w-xl">
              Laboratory operational overview. All modules and clinical queues are updated in real-time.
            </p>
          </div>

          {/* Primary Quick Button */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-teal-900 bg-white rounded-xl hover:bg-teal-50 shadow-sm transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-white/30"
            >
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>+ Register Patient & Order Tests</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Operational Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Visits */}
        <Link
          href="/patients"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{todayOrders}</div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1 font-medium">
            <span>Registered laboratory visits</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Awaiting Specimen Collection */}
        <Link
          href="/tests?tab=specimens"
          className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Awaiting Collection
            </span>
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <FlaskConical className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-900">{specimensAwaiting}</div>
          <p className="mt-1 text-xs text-amber-700 flex items-center gap-1 font-medium">
            <span>Pending phlebotomy / intake</span>
            <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Results Awaiting Entry */}
        <Link
          href="/tests?tab=results"
          className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Awaiting Result Entry
            </span>
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-indigo-900">{resultsAwaiting}</div>
          <p className="mt-1 text-xs text-indigo-700 flex items-center gap-1 font-medium">
            <span>Specimens received in lab</span>
            <ArrowRight className="w-3 h-3 text-indigo-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 4: Reports Awaiting Doctor Review */}
        <Link
          href="/reports"
          className="bg-white p-5 rounded-2xl border border-teal-200/80 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Awaiting Authorization
            </span>
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <FileCheck2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-teal-900">{reportsAwaiting}</div>
          <p className="mt-1 text-xs text-teal-700 flex items-center gap-1 font-medium">
            <span>Submitted for pathologist sign-off</span>
            <ArrowRight className="w-3 h-3 text-teal-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* 3. Daily Workflow Stepper (User-Friendly Guide for Staff) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Standard Daily Patient Workflow</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/patients"
            className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200/70 transition-all text-center group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center mx-auto transition-colors">
              1
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">Register Patient</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Duplicate check & orders</p>
          </Link>

          <Link
            href="/tests?tab=specimens"
            className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200/70 transition-all text-center group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center mx-auto transition-colors">
              2
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">Collect Specimen</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Collect & Receive desk</p>
          </Link>

          <Link
            href="/tests?tab=results"
            className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200/70 transition-all text-center group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center mx-auto transition-colors">
              3
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">Enter Test Results</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Values & abnormal flags</p>
          </Link>

          <Link
            href="/reports"
            className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200/70 transition-all text-center group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center mx-auto transition-colors">
              4
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">Doctor Review</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pathologist authorization</p>
          </Link>

          <Link
            href="/reports"
            className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200/70 transition-all text-center group col-span-2 sm:col-span-1"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center mx-auto transition-colors">
              5
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">Print & Release</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Official A4 PDF report</p>
          </Link>
        </div>
      </div>

      {/* 4. Financial Summary (Admin Only for Padma) */}
      {isAdmin ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Financial Summary (Administrator Desk)</h3>
                <p className="text-xs text-slate-400">Source of truth: patient billing records</p>
              </div>
            </div>
            <Link
              href="/finance"
              className="text-xs text-teal-300 hover:text-white flex items-center gap-1 font-semibold underline"
            >
              <span>Manage Billing & Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <span className="text-xs text-slate-400 font-medium">Total Billed</span>
              <div className="text-xl font-bold text-white mt-1">₹ {totalBilled.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-medium">Total Collected</span>
              <div className="text-xl font-bold text-emerald-300 mt-1">₹ {totalCollected.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-amber-500/30">
              <span className="text-xs text-amber-400 font-medium">Pending Patient Dues</span>
              <div className="text-xl font-bold text-amber-300 mt-1">₹ {totalOutstanding.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-rose-500/30">
              <span className="text-xs text-rose-400 font-medium">Laboratory Expenses</span>
              <div className="text-xl font-bold text-rose-300 mt-1">₹ {totalExpenses.toFixed(2)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Aggregate financial figures are restricted to the Administrator account (Padma).</span>
          </div>
          <span className="font-semibold text-slate-700">Signed in as: {staff.full_name}</span>
        </div>
      )}

      {/* 5. Recent Patient Orders Worklist */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Current Patient Visits & Test Orders</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Sorted by latest visit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-100">
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
            <tbody className="divide-y divide-slate-100">
              {globalStore.orders.map((ord) => {
                const latestRep = ord.report_versions[0];
                const hasPendingSub = ord.submissions.some((s) => s.status === 'pending');
                const specSummary = ord.specimens.map((s) => s.status).join(', ');

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{ord.patient?.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ord.patient?.patient_number}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {ord.tests.map((t) => t.test_code_snapshot).join(', ')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    <td className="px-4 py-3.5 font-medium capitalize">
                      <span className="text-slate-800">{specSummary.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5">
                      {latestRep ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>RELEASED ({latestRep.report_number})</span>
                        </span>
                      ) : hasPendingSub ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          <span>Awaiting Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/tests/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
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
    </div>
  );
}
