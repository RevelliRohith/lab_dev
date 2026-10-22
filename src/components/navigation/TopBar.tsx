'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import {
  ShieldCheck,
  User,
  MapPin,
  Menu,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';

interface TopBarProps {
  onMenuToggle?: () => void;
  onStaffChange?: () => void;
}

export function TopBar({ onMenuToggle, onStaffChange }: TopBarProps) {
  const [currentStaff, setCurrentStaff] = useState(globalStore.getActiveStaff());
  const [currentTime, setCurrentTime] = useState('');
  const lab = globalStore.lab;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchStaff = (staffId: string) => {
    try {
      globalStore.setActiveStaffId(staffId);
      setCurrentStaff(globalStore.getActiveStaff());
      if (onStaffChange) onStaffChange();
      window.dispatchEvent(new Event('staff-changed'));
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Admin
          </span>
        );
      case 'authorized_reviewer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Pathologist Reviewer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Lab Technologist
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .replace(/Dr\./i, '')
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs md:px-6">
      {/* Left: Mobile Menu + Lab Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-slate-600 rounded-lg md:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white font-black text-sm shadow-sm ring-2 ring-teal-500/20">
            RL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 leading-tight">
                {lab.name}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{lab.address}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Director: <strong className="text-slate-700">{lab.clinical_director}</strong></span>
              <span>•</span>
              <span className="text-teal-700 font-medium">Currency: {lab.currency_code} (₹)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Clock & Staff Switcher */}
      <div className="flex items-center gap-3">
        {currentTime && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">{currentTime}</span>
          </div>
        )}

        {/* Staff Switcher Card */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {getInitials(currentStaff.full_name)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-none flex items-center gap-1">
                <span>{currentStaff.full_name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {currentStaff.roles.map((r) => (
                  <React.Fragment key={r}>{getRoleBadge(r)}</React.Fragment>
                ))}
              </div>
            </div>

            {/* Quick dropdown select */}
            <select
              value={currentStaff.id}
              onChange={(e) => handleSwitchStaff(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Switch active staff member"
            >
              {globalStore.staff
                .filter((s) => s.status === 'active')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.roles.join(', ')})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
