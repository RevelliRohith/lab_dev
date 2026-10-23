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
  Sparkles,
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
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {awaitingSpecimens}
        </span>
      );
    }
    if (name === 'Reports' && awaitingReview > 0) {
      return (
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1565D8] border border-blue-200">
          {awaitingReview}
        </span>
      );
    }
    if (name === 'Patients & Billing' && unpaidInvoices > 0) {
      return (
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          {unpaidInvoices}
        </span>
      );
    }
    return null;
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-17 bg-white border-r border-[#E3EAF3] text-[#172B4D] shadow-[1px_0_4px_rgba(16,33,59,0.02)]">
      <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4">
        {/* Module Header */}
        <div className="px-5 mb-2.5 flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
            Clinical Modules
          </p>
          <span className="text-[10px] font-bold text-[#1565D8] bg-blue-50 px-2 py-0.5 rounded-full">
            6 Modules
          </span>
        </div>

        {/* Navigation Items */}
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1565D8] text-white shadow-sm ring-1 ring-[#1565D8]'
                    : 'text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#1565D8]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-[#64748B]'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {getBadge(item.name)}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info Card */}
        <div className="p-3.5 mx-3 rounded-2xl bg-[#F5F8FC] border border-[#E3EAF3] text-xs space-y-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-extrabold text-[#10213B] text-xs">Rishi Laboratory</p>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Choutuppal, Telangana</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#0D9488] font-bold">
            <Phone className="w-3 h-3 text-[#0D9488]" />
            <span>+91 98482 28971</span>
          </div>
          <div className="pt-2 border-t border-[#E3EAF3] flex items-center justify-between text-[10px] text-[#64748B]">
            <span className="font-semibold text-emerald-600">Online • Port 3005</span>
            <span className="font-mono">LIS v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
