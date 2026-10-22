'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { globalStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  FileCheck2,
  Receipt,
  Settings,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients & Billing', href: '/patients', icon: Users },
  { name: 'Tests & Results', href: '/tests', icon: FlaskConical },
  { name: 'Reports', href: '/reports', icon: FileCheck2 },
  { name: 'Finance', href: '/finance', icon: Receipt },
  { name: 'Settings & Staff', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  // Compute live queue badges
  const awaitingSpecimens = globalStore.orders.reduce((acc, o) => {
    return acc + o.specimens.filter((s) => s.status === 'awaiting_collection').length;
  }, 0);

  const awaitingReview = globalStore.orders.filter((o) =>
    o.submissions.some((s) => s.status === 'pending')
  ).length;

  const unpaidInvoices = globalStore.invoices.filter((i) => i.balance_due > 0).length;

  const getBadge = (name: string) => {
    if (name === 'Tests & Results' && awaitingSpecimens > 0) {
      return (
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {awaitingSpecimens}
        </span>
      );
    }
    if (name === 'Reports' && awaitingReview > 0) {
      return (
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
          {awaitingReview}
        </span>
      );
    }
    if (name === 'Patients & Billing' && unpaidInvoices > 0) {
      return (
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {unpaidInvoices}
        </span>
      );
    }
    return null;
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16 bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4">
        {/* Section Title */}
        <div className="px-5 mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Clinical Modules
          </p>
          <span className="text-[10px] font-semibold text-teal-400">6 Core</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1.5" aria-label="Sidebar Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {getBadge(item.name)}
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 mx-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 space-y-2">
          <div>
            <p className="font-bold text-slate-200">Rishi Laboratory</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Choutuppal, Telangana</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-300 font-medium">
            <Phone className="w-3 h-3 text-teal-400" />
            <span>9848228971</span>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online (Port 3005)
            </span>
            <span className="text-slate-400">LIS v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
