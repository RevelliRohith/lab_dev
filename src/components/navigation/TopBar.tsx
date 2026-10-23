'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { globalStore } from '@/lib/store';
import { Patient } from '@/lib/types';
import {
  FlaskConical,
  Search,
  MapPin,
  Menu,
  ChevronDown,
  User,
  Clock,
  Phone,
  Check,
  Shield,
  X,
} from 'lucide-react';

interface TopBarProps {
  onMenuToggle?: () => void;
  onStaffChange?: () => void;
}

export function TopBar({ onMenuToggle, onStaffChange }: TopBarProps) {
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState(globalStore.getActiveStaff());
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
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
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle global search input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const clean = query.trim().toLowerCase();
    const matches = globalStore.patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(clean) ||
        p.patient_number.toLowerCase().includes(clean) ||
        (p.phone && p.phone.includes(clean))
    );
    setSearchResults(matches);
    setIsSearchOpen(true);
  };

  const handleSelectPatient = (patient: Patient) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(`/patients?selected=${patient.id}`);
  };

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

  // Exactly Two Operational Roles: Admin and Staff
  const getPrimaryRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#1565D8] border border-blue-200">
          <Shield className="w-3 h-3 text-[#1565D8]" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-[#0D9488] border border-teal-200">
        <FlaskConical className="w-3 h-3 text-[#0D9488]" />
        Staff
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-17 px-4 bg-white border-b border-[#E3EAF3] shadow-[0_1px_3px_rgba(16,33,59,0.04)] md:px-6">
      {/* 1. Left: Mobile Menu + Rishi Laboratory Flask Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-slate-600 rounded-lg md:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1565D8]"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1565D8] text-white shadow-sm ring-2 ring-[#1565D8]/20 group-hover:scale-105 transition-transform">
            <FlaskConical className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#10213B] tracking-tight group-hover:text-[#1565D8] transition-colors leading-tight">
                {lab.name}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D9488] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {lab.address}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] hidden sm:block">
              Telangana • Diagnostic LIS
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center: Global Patient Quick Search */}
      <div className="flex-1 max-w-md mx-4 relative hidden sm:block" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true);
            }}
            placeholder="Search patient by name, MRN, or phone..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-[#F5F8FC] hover:bg-[#EDF2F9] focus:bg-white text-[#172B4D] placeholder-slate-400 border border-[#E3EAF3] rounded-xl focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-[#E3EAF3] shadow-lg overflow-hidden z-50">
            {searchResults.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  Matching Patients ({searchResults.length})
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#F5F8FC] flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#10213B] group-hover:text-[#1565D8]">
                          {p.full_name}
                        </div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5 font-mono">
                          <span>{p.patient_number}</span>
                          <span>•</span>
                          <span>
                            {p.sex.toUpperCase()}
                            {p.date_of_birth
                              ? ` • ${p.date_of_birth}`
                              : p.estimated_age_years
                              ? ` • ~${p.estimated_age_years}y`
                              : ''}
                          </span>
                          {p.phone && (
                            <>
                              <span>•</span>
                              <span>{p.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#1565D8] bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        View Visit
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#64748B]">
                No patients found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right: Clock & Staff Switcher */}
      <div className="flex items-center gap-3">
        {/* Live IST Clock */}
        {currentTime && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B] bg-[#F5F8FC] border border-[#E3EAF3] px-3 py-1.5 rounded-xl font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[#172B4D] font-bold">{currentTime}</span>
          </div>
        )}

        {/* Staff Switcher Badge */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 bg-[#F5F8FC] hover:bg-[#EDF2F9] border border-[#E3EAF3] rounded-xl px-3 py-1.5 cursor-pointer transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#1565D8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentStaff.full_name
                .replace(/Dr\./i, '')
                .trim()
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[#10213B] flex items-center gap-1.5">
                <span>{currentStaff.full_name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </div>
              <div className="mt-0.5">
                {getPrimaryRoleBadge(currentStaff.roles)}
              </div>
            </div>

            {/* Quick dropdown select to change active user: ONLY Admin and Staff */}
            <select
              value={currentStaff.id}
              onChange={(e) => handleSwitchStaff(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Switch active staff member"
            >
              {globalStore.staff
                .filter(
                  (s) =>
                    s.status === 'active' &&
                    (s.roles.includes('admin') || s.roles.includes('lab_staff'))
                )
                .map((s) => {
                  const roleLabel = s.roles.includes('admin') ? 'Admin' : 'Staff';
                  return (
                    <option key={s.id} value={s.id}>
                      {s.full_name.split('(')[0].trim()} — {roleLabel}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
