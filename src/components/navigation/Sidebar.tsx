'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export function Sidebar({ className }: { className?: string } = {}) {
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

  const getBadge = (name: string, isActive: boolean) => {
    if (name === 'Tests & Results' && awaitingSpecimens > 0) {
      return (
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isActive
              ? 'bg-white/25 text-white border border-white/30'
              : 'bg-amber-100/80 text-amber-900 border border-amber-200/60'
          }`}
        >
          {awaitingSpecimens}
        </span>
      );
    }
    if (name === 'Reports' && awaitingReview > 0) {
      return (
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isActive
              ? 'bg-white/25 text-white border border-white/30'
              : 'bg-blue-100/80 text-[#2563EB] border border-blue-200/60'
          }`}
        >
          {awaitingReview}
        </span>
      );
    }
    if (name === 'Patients & Billing' && unpaidInvoices > 0) {
      return (
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isActive
              ? 'bg-white/25 text-white border border-white/30'
              : 'bg-rose-100/80 text-rose-800 border border-rose-200/60'
          }`}
        >
          {unpaidInvoices}
        </span>
      );
    }
    return null;
  };

  return (
    <aside
      className={`glass-panel rounded-2xl shadow-[0_8px_32px_rgba(37,99,235,0.06)] border border-white/60 overflow-hidden transition-all flex flex-col ${
        className || 'h-[calc(100vh-1.5rem)] sticky top-3 w-full'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0 p-3.5 justify-between overflow-y-auto">
        {/* Top: Laboratory Branding */}
        <div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/50 transition-all group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm glow-blue flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src="/images/flask-logo.png"
                alt="Rishi Laboratory Logo"
                width={26}
                height={26}
                className="object-contain drop-shadow"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-[#12234A] tracking-tight truncate group-hover:text-[#2563EB] transition-colors">
                  Rishi Lab
                </span>
                <span className="text-[9px] font-bold text-[#2563EB] bg-blue-50/80 border border-blue-200/50 px-1.5 py-0.2 rounded-full">
                  LIS
                </span>
              </div>
              <p className="text-[11px] text-[#526581] truncate">Diagnostic Suite</p>
            </div>
          </Link>

          {/* Section Divider with Pill Label */}
          <div className="px-2 mt-4 mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
              Clinical Modules
            </p>
            <span className="text-[10px] font-semibold text-[#2563EB] glass-pill px-2 py-0.5">
              6 Modules
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1" aria-label="Sidebar Navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] text-white shadow-md glow-blue border border-white/30'
                      : 'text-[#2C3E50] hover:bg-white/60 hover:text-[#2563EB]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-[#64748B]'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                  {getBadge(item.name, isActive)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-3 rounded-xl glass-card text-xs space-y-2 mt-auto">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-extrabold text-[#12234A] text-xs">Rishi Laboratory</p>
            </div>
            <p className="text-[11px] text-[#526581] mt-0.5">Choutuppal, Telangana</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#0D9488] font-bold">
            <Phone className="w-3 h-3 text-[#0D9488]" />
            <span>+91 98482 28971</span>
          </div>
          <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-[#64748B]">
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
              Port 3005
            </span>
            <span className="font-mono text-[#526581]">v1.0 Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
