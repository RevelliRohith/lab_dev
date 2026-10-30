'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { globalStore } from '@/lib/store';
import { Patient } from '@/lib/types';
import {
  Search,
  MapPin,
  Menu,
  ChevronDown,
  Clock,
  Shield,
  FlaskConical,
  X,
  Sparkles,
  Bell,
  Calendar,
} from 'lucide-react';

interface TopBarProps {
  onMenuToggle?: () => void;
  onStaffChange?: () => void;
  className?: string;
}

export function TopBar({ onMenuToggle, onStaffChange, className }: TopBarProps) {
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState(globalStore.getActiveStaff());
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lab = globalStore.lab;

  // Restore staff from localStorage and listen to staff changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rishi_active_staff_id');
      if (saved && globalStore.staff.some((s) => s.id === saved && s.status === 'active')) {
        globalStore.activeStaffId = saved;
        setCurrentStaff(globalStore.getActiveStaff());
      }
    } catch {}

    const handleStaffChange = () => {
      setCurrentStaff(globalStore.getActiveStaff());
    };
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

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

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/80 text-[#2563EB] border border-blue-200/60">
          <Shield className="w-2.5 h-2.5 text-[#2563EB]" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/80 text-[#0D9488] border border-teal-200/60">
        <FlaskConical className="w-2.5 h-2.5 text-[#0D9488]" />
        Staff
      </span>
    );
  };

  return (
    <header
      className={`h-16 rounded-2xl glass-panel shadow-[0_8px_32px_rgba(37,99,235,0.06)] border border-white/60 flex items-center justify-between px-3.5 sm:px-5 transition-all w-full ${
        className || ''
      }`}
    >
      {/* 1. Left: Mobile Menu + Rishi Laboratory Branding */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-[#526581] hover:text-[#12234A] rounded-xl md:hidden glass-pill hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm glow-blue flex items-center justify-center group-hover:scale-105 transition-transform">
            <Image
              src="/images/flask-logo.png"
              alt="Logo"
              width={22}
              height={22}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#12234A] tracking-tight group-hover:text-[#2563EB] transition-colors leading-tight">
                {lab.name}
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold text-[#0D9488] bg-teal-50/80 border border-teal-200/50 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {lab.address}
              </span>
            </div>
            <p className="text-[10px] text-[#526581] hidden xl:block">
              Diagnostic Healthcare Laboratory
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center: Global Patient Quick Search with Glass Input */}
      <div className="flex-1 max-w-md mx-4 relative hidden lg:block" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-[#526581] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true);
            }}
            placeholder="Search patient by name, phone or Patient ID..."
            className="glass-input w-full pl-9 pr-14 py-2 text-xs text-[#14213D] placeholder-[#64748B] rounded-xl outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-[#64748B] hover:text-[#14213D] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold text-[#64748B] bg-white/70 border border-slate-200/80 rounded shadow-2xs pointer-events-none">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        {/* Live Search Results Dropdown in Glass Card */}
        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 glass-panel rounded-2xl shadow-xl overflow-hidden z-50 border border-white/80 animate-fade-in">
            {searchResults.length > 0 ? (
              <div className="py-2">
                <div className="px-3.5 py-1 text-[10px] font-bold text-[#526581] uppercase tracking-wider bg-white/40 border-b border-white/50 flex items-center justify-between">
                  <span>Matching Patients</span>
                  <span className="font-mono text-[#2563EB]">{searchResults.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-white/40 glass-scrollbar">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/70 flex items-center justify-between transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#12234A] group-hover:text-[#2563EB]">
                          {p.full_name}
                        </div>
                        <div className="text-[11px] text-[#526581] flex items-center gap-2 mt-0.5 font-mono">
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
                      <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50/90 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        View Visit
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#526581]">
                No patients found matching &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right: Date/Time, Notifications & Authenticated Account Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Live IST Date & Time with Calendar Icon */}
        {currentTime && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#14213D] bg-white/[0.60] backdrop-blur-[12px] border border-white/[0.80] rounded-xl px-3 py-1.5 font-medium shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="font-semibold text-xs text-[#14213D]">{currentTime}</span>
          </div>
        )}

        {/* Notification Bell with Red Badge */}
        <div className="relative cursor-pointer p-2 rounded-xl bg-white/[0.60] backdrop-blur-[12px] border border-white/[0.80] hover:bg-white/80 transition-all text-[#64748B] hover:text-[#14213D] shadow-xs">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
            2
          </span>
        </div>

        {/* Authenticated Account Profile Dropdown (Admin / Staff) */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 bg-white/[0.68] hover:bg-white/[0.88] rounded-xl px-2.5 py-1.5 cursor-pointer transition-all border border-white/[0.85] shadow-xs">
            <div className="w-7 h-7 rounded-full bg-[#14213D] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentStaff.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#14213D]">
                {currentStaff.roles.includes('admin') ? 'Padma (Admin)' : 'Rishi (Staff)'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </div>

            {/* Role indicator badge */}
            <div className="hidden xl:block">
              {getPrimaryRoleBadge(currentStaff.roles)}
            </div>

            {/* Select for switching active account: strictly Admin vs Staff */}
            <select
              value={currentStaff.id}
              onChange={(e) => handleSwitchStaff(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Switch authenticated account"
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
