'use client';

import React from 'react';
import { globalStore } from '@/lib/store';
import { ShieldCheck, User, Building2, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuToggle?: () => void;
  onStaffChange?: () => void;
}

export function TopBar({ onMenuToggle, onStaffChange }: TopBarProps) {
  const currentStaff = globalStore.getActiveStaff();
  const lab = globalStore.lab;

  const handleSwitchStaff = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      globalStore.setActiveStaffId(e.target.value);
      if (onStaffChange) onStaffChange();
      // Force page re-render to reflect new permissions
      window.dispatchEvent(new Event('staff-changed'));
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'authorized_reviewer':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Authorized Reviewer</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">Lab Staff</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm md:px-6">
      {/* Mobile Menu Button & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-slate-600 rounded-lg md:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-sm shadow-sm">
            RL
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {lab.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">{lab.timezone}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{lab.currency_code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Role / User Switcher */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>CLIA: <span className="font-mono font-medium text-slate-800">{lab.lab_license_number}</span></span>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1">
          <div className="hidden lg:flex items-center gap-1 pl-2 text-xs text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">Active User:</span>
          </div>
          <select
            value={currentStaff.id}
            onChange={handleSwitchStaff}
            className="text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Switch current active staff account"
          >
            {globalStore.staff
              .filter((s) => s.status === 'active')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.roles.join(', ')})
                </option>
              ))}
          </select>

          <div className="hidden sm:flex items-center gap-1">
            {currentStaff.roles.map((r) => (
              <span key={r}>{getRoleBadge(r)}</span>
            ))}
          </div>

          {currentStaff.mfa_enabled && (
            <span title="MFA Verified" className="hidden md:inline-flex text-emerald-600 pr-1">
              <ShieldCheck className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
