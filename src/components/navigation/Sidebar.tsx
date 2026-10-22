'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  FileCheck2,
  Receipt,
  Settings,
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

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16 bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="flex flex-col flex-1 min-h-0 pt-4 pb-4">
        <div className="px-4 mb-3">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Clinical Operations
          </p>
        </div>
        <nav className="flex-1 px-3 space-y-1.5" aria-label="Sidebar Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 mx-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Rishi Laboratory LIS v1.0</p>
          <p className="text-[11px] mt-0.5">Clinical Diagnostic LIS</p>
          <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-medium">● RLS Active</span>
            <span>CLIA Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
