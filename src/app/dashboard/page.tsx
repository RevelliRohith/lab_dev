'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { globalStore } from '@/lib/store';
import {
  Users,
  FlaskConical,
  FileCheck2,
  FileText,
  UserPlus,
  FileEdit,
  Printer,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  IndianRupee,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const staff = globalStore.getActiveStaff();
  const isAdmin = staff.roles.includes('admin');

  // Operational Counts driven by real Supabase / store data
  const patientsToday = globalStore.patients.length;
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

  // Recent audit activities formatted cleanly
  const recentActivities = [...globalStore.auditEvents].reverse().slice(0, 6);

  const getActivityIcon = (action: string) => {
    if (action.includes('patient')) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('specimen') || action.includes('sample')) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <FlaskConical className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('result')) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <FileEdit className="w-4 h-4" />
        </div>
      );
    }
    if (action.includes('report') || action.includes('release')) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <FileCheck2 className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
        <IndianRupee className="w-4 h-4" />
      </div>
    );
  };

  const formatActivityTitle = (action: string) => {
    if (action === 'patient_registered') return 'New patient registered';
    if (action === 'specimen_status_changed') return 'Sample collected';
    if (action === 'result_saved') return 'Results entered';
    if (action === 'report_released' || action === 'report_authorized') return 'Report generated';
    if (action === 'payment_recorded') return 'Payment received';
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getOrderStatusPill = (ord: typeof globalStore.orders[0]) => {
    if (ord.report_versions.length > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
          Report Ready
        </span>
      );
    }
    const allCollected = ord.specimens.every((s) => ['collected', 'received', 'completed'].includes(s.status));
    const anyCollected = ord.specimens.some((s) => ['collected', 'received', 'completed'].includes(s.status));

    if (allCollected) {
      const hasResults = ord.results.some((r) => r.numeric_value !== null || !!r.text_value);
      if (hasResults) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100/90 text-purple-800 border border-purple-200/60">
            Result Entry
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
          Collected
        </span>
      );
    }

    if (anyCollected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200/60">
          Partial Collection
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200/60">
        Pending Collection
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Banner matching Liquid Glass Reference Mockup */}
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.68] backdrop-blur-[20px] border border-white/[0.85] p-6 sm:p-8 shadow-[0_8px_32px_rgba(37,99,235,0.06)] bg-gradient-to-r from-blue-50/50 via-white/80 to-indigo-50/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2563EB]">
              Welcome!
            </h2>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#14213D]">
              Rishi Laboratory
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#64748B]">
              Accurate Results. Healthier Lives.
            </p>
          </div>

          {/* Right illustration / graphic from reference mockup */}
          <div className="relative shrink-0 hidden lg:flex items-center justify-center">
            <div className="w-64 lg:w-80 h-28 lg:h-32 rounded-2xl overflow-hidden bg-white/70 border border-white/90 shadow-sm flex items-center justify-center p-1.5">
              <Image
                src="/images/hero-lab.png"
                alt="Rishi Diagnostic Laboratory"
                width={360}
                height={120}
                className="w-full h-full object-cover rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Live Statistics Cards matching Reference Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Patients Today */}
        <Link
          href="/patients"
          className="p-5 rounded-2xl bg-white/[0.68] backdrop-blur-[16px] border border-white/[0.80] shadow-[0_4px_20px_rgba(37,99,235,0.04)] hover:shadow-md hover:bg-white/[0.85] transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100/90 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] leading-none">
              {patientsToday}
            </div>
            <div className="text-xs font-semibold text-[#64748B] mt-1">
              Patients Today
            </div>
          </div>
        </Link>

        {/* Stat 2: Samples Collected */}
        <Link
          href="/tests?tab=specimens"
          className="p-5 rounded-2xl bg-white/[0.68] backdrop-blur-[16px] border border-amber-200/50 shadow-[0_4px_20px_rgba(245,158,11,0.04)] hover:shadow-md hover:bg-white/[0.85] transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100/90 text-amber-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] leading-none">
              {samplesCollected}
            </div>
            <div className="text-xs font-semibold text-[#64748B] mt-1">
              Samples Collected
            </div>
          </div>
        </Link>

        {/* Stat 3: Results Pending */}
        <Link
          href="/tests?tab=results"
          className="p-5 rounded-2xl bg-white/[0.68] backdrop-blur-[16px] border border-purple-200/50 shadow-[0_4px_20px_rgba(168,85,247,0.04)] hover:shadow-md hover:bg-white/[0.85] transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100/90 text-purple-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] leading-none">
              {resultsPending}
            </div>
            <div className="text-xs font-semibold text-[#64748B] mt-1">
              Results Pending
            </div>
          </div>
        </Link>

        {/* Stat 4: Reports Ready */}
        <Link
          href="/reports"
          className="p-5 rounded-2xl bg-white/[0.68] backdrop-blur-[16px] border border-emerald-200/50 shadow-[0_4px_20px_rgba(16,185,129,0.04)] hover:shadow-md hover:bg-white/[0.85] transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] leading-none">
              {reportsReady}
            </div>
            <div className="text-xs font-semibold text-[#64748B] mt-1">
              Reports Ready
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Six Quick Actions matching Reference Mockup */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#14213D] px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Action 1: New Patient */}
          <Link
            href="/patients?action=new"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 shadow-xs hover:bg-blue-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-[#2563EB] flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#2563EB]">New Patient</span>
          </Link>

          {/* Action 2: Create Bill */}
          <Link
            href="/patients?tab=billing"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-xs hover:bg-emerald-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-emerald-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700">Create Bill</span>
          </Link>

          {/* Action 3: Collect Sample */}
          <Link
            href="/tests?tab=specimens"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-xs hover:bg-amber-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-amber-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-700">Collect Sample</span>
          </Link>

          {/* Action 4: Enter Results */}
          <Link
            href="/tests?tab=results"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 shadow-xs hover:bg-purple-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-purple-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <FileEdit className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-700">Enter Results</span>
          </Link>

          {/* Action 5: View Reports */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-teal-50/70 border border-teal-200/60 shadow-xs hover:bg-teal-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-teal-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-teal-700">View Reports</span>
          </Link>

          {/* Action 6: Print Report */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 shadow-xs hover:bg-slate-100/80 hover:-translate-y-0.5 transition-all group text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/90 text-slate-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#14213D]">Print Report</span>
          </Link>
        </div>
      </div>

      {/* 4. Two Column Layout: Today's Orders (approx 65%) vs Recent Activities (approx 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Orders Table */}
        <div className="lg:col-span-8 rounded-3xl bg-white/[0.68] backdrop-blur-[16px] border border-white/[0.80] shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/50 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#14213D]">Today&apos;s Orders</h3>
            <Link
              href="/tests"
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14213D]">
              <thead className="bg-white/50 text-[#64748B] font-bold border-b border-slate-200/50">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Tests</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {globalStore.orders.map((ord) => {
                  const testsSummary = ord.tests.map((t) => t.test_code_snapshot).join(', ');
                  const orderTime = new Date(ord.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={ord.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#14213D]">
                        {ord.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#14213D]">{ord.patient?.full_name}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          {ord.patient?.patient_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#14213D]">
                        {testsSummary}
                      </td>
                      <td className="px-4 py-3">
                        {getOrderStatusPill(ord)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#64748B]">
                        {orderTime}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/tests/${ord.id}`}
                          className="inline-flex items-center px-3 py-1 text-xs font-bold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/60 rounded-xl transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Activities Feed */}
        <div className="lg:col-span-4 rounded-3xl bg-white/[0.68] backdrop-blur-[16px] border border-white/[0.80] shadow-[0_8px_32px_rgba(37,99,235,0.05)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-4">
              <h3 className="text-sm font-extrabold text-[#14213D]">Recent Activities</h3>
              <Link
                href="/settings?tab=audit"
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/[0.50] border border-white/[0.70] hover:bg-white/[0.80] transition-all text-xs"
                  >
                    {getActivityIcon(act.action)}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#14213D] truncate">
                        {formatActivityTitle(act.action)}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                        {act.metadata?.name ? String(act.metadata.name) : act.entity_id ? `ID: ${String(act.entity_id).substring(0, 10)}...` : 'System event'}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold text-[#64748B] shrink-0"
                      suppressHydrationWarning
                    >
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#64748B]">
                  No activities recorded yet today.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">System Audit Events:</span>
            <span className="font-mono font-bold text-[#2563EB] bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200/50">
              {globalStore.auditEvents.length} recorded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
