'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Activity,
  Zap,
  ShieldCheck,
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
      {/* 1. Wide Liquid Glass Hero Banner with 3D Lab Illustration */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/80 p-6 sm:p-8 shadow-[0_12px_40px_rgba(37,99,235,0.08)] bg-gradient-to-br from-white/75 via-blue-50/40 to-indigo-50/50">
        {/* Soft background light orb */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill text-[#2563EB] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{lab.name} • Choutuppal, Telangana</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12234A] leading-tight">
              Welcome! Rishi Laboratory —{' '}
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                Accurate Results. Healthier Lives.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#526581] leading-relaxed max-w-xl">
              Diagnostic laboratory operational overview. Phlebotomy, result entries, and official reports are synced in real time.
            </p>

            {/* 3 Feature Indicators */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#12234A] glass-pill px-2.5 py-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Fast Workflow
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#12234A] glass-pill px-2.5 py-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Reliable Reports
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#12234A] glass-pill px-2.5 py-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Simple & Modern
              </span>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Link
                href="/patients"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] rounded-2xl shadow-md glow-blue hover:brightness-105 active:scale-98 transition-all"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>+ Register Patient & Bill</span>
              </Link>
            </div>
          </div>

          {/* Right: Laboratory 3D Visual */}
          <div className="relative shrink-0 hidden md:flex items-center justify-center">
            <div className="relative w-56 h-56 lg:w-64 lg:h-64 rounded-3xl p-3 flex items-center justify-center">
              <Image
                src="/images/hero-lab.png"
                alt="Rishi Diagnostic Laboratory"
                width={250}
                height={250}
                className="object-contain drop-shadow-xl hover:scale-103 transition-transform duration-500"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Operational Stat Cards with iOS Liquid Glass Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <Link
          href="/patients"
          className="glass-card-hover p-5 rounded-2xl border border-white/70 shadow-[0_4px_20px_rgba(37,99,235,0.04)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#526581] uppercase tracking-wider">
              Patients Today
            </span>
            <span className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors glow-blue">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#12234A]">{todayOrders}</div>
          <p className="mt-1 text-xs text-[#526581] flex items-center gap-1 font-medium">
            <span>Registered laboratory visits</span>
            <ArrowRight className="w-3 h-3 text-[#2563EB] group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 2: Samples Collected */}
        <Link
          href="/tests?tab=specimens"
          className="glass-card-hover p-5 rounded-2xl border border-teal-200/50 shadow-[0_4px_20px_rgba(13,148,136,0.04)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Samples Collected
            </span>
            <span className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
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
          className="glass-card-hover p-5 rounded-2xl border border-indigo-200/50 shadow-[0_4px_20px_rgba(99,102,241,0.04)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Results Pending
            </span>
            <span className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors glow-purple">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-indigo-950">{resultsPending}</div>
          <p className="mt-1 text-xs text-indigo-700 flex items-center gap-1 font-medium">
            <span>Awaiting result entry & submission</span>
            <ArrowRight className="w-3 h-3 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Card 4: Reports Ready */}
        <Link
          href="/reports"
          className="glass-card-hover p-5 rounded-2xl border border-emerald-200/50 shadow-[0_4px_20px_rgba(16,185,129,0.04)] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Reports Ready
            </span>
            <span className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-950">{reportsReady}</div>
          <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <span>Official reports ready to print & share</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* 3. Exactly Six Quick Action Tiles in Liquid Glass Cards */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-extrabold text-[#12234A] uppercase tracking-wider">
              Quick Operations Desk
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#526581]">Routine staff actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: New Patient */}
          <Link
            href="/patients"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-[#2563EB] flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-xs glow-blue">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-[#2563EB]">
              New Patient
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Register & MRN</span>
          </Link>

          {/* Tile 2: Create Bill */}
          <Link
            href="/patients"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-emerald-700">
              Create Bill
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Order & Invoicing</span>
          </Link>

          {/* Tile 3: Collect Sample */}
          <Link
            href="/tests?tab=specimens"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-amber-800">
              Collect Sample
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Phlebotomy desk</span>
          </Link>

          {/* Tile 4: Enter Results */}
          <Link
            href="/tests?tab=results"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs glow-purple">
              <FileEdit className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-indigo-800">
              Enter Results
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Analyte entries</span>
          </Link>

          {/* Tile 5: View Reports */}
          <Link
            href="/reports"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-teal-800">
              View Reports
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Diagnostic reports</span>
          </Link>

          {/* Tile 6: Print Report */}
          <Link
            href="/reports"
            className="glass-card-hover flex flex-col items-center justify-center p-4 rounded-2xl text-center group border border-white/60"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-[#2563EB] flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-xs glow-blue">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#12234A] group-hover:text-[#2563EB]">
              Print Report
            </span>
            <span className="text-[10px] text-[#526581] mt-0.5">Official A4 PDF</span>
          </Link>
        </div>
      </div>

      {/* 4. Financial Summary (Admin Only for Padma) */}
      {isAdmin ? (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200/50">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#12234A]">
                  Financial Overview (Administrator Desk)
                </h3>
                <p className="text-xs text-[#526581]">Real-time laboratory revenue & dues</p>
              </div>
            </div>
            <Link
              href="/finance"
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-bold underline"
            >
              <span>Manage Billing & Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="glass-card p-4 rounded-2xl border border-white/60">
              <span className="text-xs text-[#526581] font-bold uppercase tracking-wider">
                Total Billed
              </span>
              <div className="text-xl font-extrabold text-[#12234A] mt-1">
                ₹ {totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/40">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Total Collected
              </span>
              <div className="text-xl font-extrabold text-emerald-900 mt-1">
                ₹ {totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-amber-200/60 bg-amber-50/40">
              <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                Pending Patient Dues
              </span>
              <div className="text-xl font-extrabold text-amber-900 mt-1">
                ₹ {totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-rose-200/60 bg-rose-50/40">
              <span className="text-xs text-rose-800 font-bold uppercase tracking-wider">
                Lab Expenses
              </span>
              <div className="text-xl font-extrabold text-rose-900 mt-1">
                ₹ {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 glass-panel border border-white/60 rounded-2xl text-xs text-[#526581] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
            <span>Aggregate financial figures are restricted to the Administrator account (Padma).</span>
          </div>
          <span className="font-bold text-[#12234A]">Signed in as: {staff.full_name}</span>
        </div>
      )}

      {/* 5. Main Split: Today's Orders (Left 8-col) + Real Recent Activities (Right 4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Patient Orders Table */}
        <div className="lg:col-span-8 glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-extrabold text-[#12234A]">
                Today&apos;s Patient Orders & Worklist
              </h3>
            </div>
            <Link
              href="/patients"
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              View All Orders ({globalStore.orders.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#12234A]">
              <thead className="bg-white/40 text-[#526581] font-bold border-b border-white/60">
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
              <tbody className="divide-y divide-white/40">
                {globalStore.orders.map((ord) => {
                  const latestRep = ord.report_versions[0];
                  const hasPendingSub = ord.submissions.some((s) => s.status === 'pending');
                  const specSummary = ord.specimens.map((s) => s.status).join(', ');

                  return (
                    <tr key={ord.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#12234A]">
                        {ord.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#12234A]">{ord.patient?.full_name}</div>
                        <div className="text-[11px] text-[#526581] font-mono">
                          {ord.patient?.patient_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#12234A]">
                        {ord.tests.map((t) => t.test_code_snapshot).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.priority === 'stat'
                              ? 'bg-rose-100/90 text-rose-800 border border-rose-200/60'
                              : ord.priority === 'urgent'
                              ? 'bg-amber-100/90 text-amber-800 border border-amber-200/60'
                              : 'bg-slate-100/90 text-slate-700'
                          }`}
                        >
                          {ord.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium capitalize text-[#526581]">
                        {specSummary.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-100/90 text-emerald-800'
                              : ord.payment_status === 'part_paid'
                              ? 'bg-amber-100/90 text-amber-800'
                              : 'bg-rose-100/90 text-rose-800'
                          }`}
                        >
                          {ord.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {latestRep ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>RELEASED</span>
                          </span>
                        ) : hasPendingSub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/90 text-[#2563EB] border border-blue-200/60">
                            <Clock className="w-3 h-3" />
                            <span>Review Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100/80 text-slate-600">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/60 rounded-xl transition-colors"
                            title="Download official A4 PDF report"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        )}
                        <Link
                          href={`/tests/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#12234A] glass-card hover:bg-white rounded-xl transition-colors"
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
        <div className="lg:col-span-4 glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/60 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-extrabold text-[#12234A]">
                  Recent Activity Trail
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>

            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl glass-card border border-white/60 hover:bg-white/80 transition-all text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0 glow-blue" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#12234A] truncate">
                        {formatActivityText(act)}
                      </p>
                      <p className="text-[11px] text-[#526581] mt-0.5 font-mono truncate">
                        {act.actor_email || 'Staff user'}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-[#526581] shrink-0">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#526581]">
                  No audit activities recorded today yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/60 flex items-center justify-between text-[11px]">
            <span className="text-[#526581]">Audit events logged:</span>
            <span className="font-mono font-bold text-[#12234A] glass-pill px-2 py-0.5">
              {globalStore.auditEvents.length} events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
