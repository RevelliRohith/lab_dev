'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import {
  Users,
  FlaskConical,
  FileCheck2,
  AlertCircle,
  PlusCircle,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
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
  const currency = globalStore.lab.currency_code;

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Operations Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time diagnostic queues, specimen intake, and workflow tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm focus:ring-2 focus:ring-teal-500"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Patient / Order</span>
          </Link>
        </div>
      </div>

      {/* Operational Worklist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Orders */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <span className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{todayOrders}</div>
          <p className="mt-1 text-xs text-slate-500">Registered laboratory visits</p>
        </div>

        {/* Card 2: Awaiting Collection */}
        <Link
          href="/tests?tab=specimens"
          className="p-5 bg-white rounded-xl border border-amber-200 hover:border-amber-300 transition-all shadow-sm hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Awaiting Collection</span>
            <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <FlaskConical className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-900">{specimensAwaiting}</div>
          <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
            <span>Pending phlebotomy / receipt</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Card 3: Results Awaiting Entry */}
        <Link
          href="/tests?tab=results"
          className="p-5 bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Awaiting Result Entry</span>
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-indigo-900">{resultsAwaiting}</div>
          <p className="mt-1 text-xs text-indigo-700 flex items-center gap-1">
            <span>Specimens received in lab</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Card 4: Reports Awaiting Review */}
        <Link
          href="/reports"
          className="p-5 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Awaiting Authorization</span>
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileCheck2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-blue-900">{reportsAwaiting}</div>
          <p className="mt-1 text-xs text-blue-700 flex items-center gap-1">
            <span>Submitted for pathologist sign-off</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Financial Overview (Admin Only) */}
      {isAdmin ? (
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Financial Summary (Admin Only)</h2>
            </div>
            <Link
              href="/finance"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium underline"
            >
              <span>View Full Financial Records</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-slate-400">Total Invoiced</p>
              <p className="text-xl font-bold text-white mt-1">
                {currency} {totalBilled.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-emerald-400">Total Collected</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">
                {currency} {totalCollected.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-amber-400">Outstanding Dues</p>
              <p className="text-xl font-bold text-amber-300 mt-1">
                {currency} {totalOutstanding.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-rose-400">Recorded Expenses</p>
              <p className="text-xl font-bold text-rose-300 mt-1">
                {currency} {totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Aggregate financial summaries are restricted to Administrator roles.</span>
          </div>
          <span className="font-semibold text-slate-700">Role: {staff.roles.join(', ')}</span>
        </div>
      )}

      {/* Operational Queues Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Active Patient Visits & Orders</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Sorted by latest order</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Tests Ordered</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Specimen Status</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Report Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalStore.orders.map((ord) => {
                const latestRep = ord.report_versions[0];
                const hasPendingSub = ord.submissions.some((s) => s.status === 'pending');
                const specSummary = ord.specimens.map((s) => s.status).join(', ');

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ord.patient?.full_name}</div>
                      <div className="text-[11px] text-slate-500">{ord.patient?.patient_number}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate">
                      {ord.tests.map((t) => t.test_code_snapshot).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          ord.priority === 'stat'
                            ? 'bg-rose-100 text-rose-800'
                            : ord.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">
                      <span className="text-slate-800">{specSummary.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          {latestRep.status.toUpperCase()} ({latestRep.report_number})
                        </span>
                      ) : hasPendingSub ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                          Awaiting Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/tests/${ord.id}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800 underline"
                      >
                        Manage
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
