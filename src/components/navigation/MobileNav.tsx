'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from './Sidebar';
import { X, FlaskConical, MapPin } from 'lucide-react';
import { globalStore } from '@/lib/store';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const lab = globalStore.lab;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#10213B]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white text-[#172B4D] shadow-2xl">
        <div className="flex items-center justify-between h-17 px-4 border-b border-[#E3EAF3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1565D8] text-white flex items-center justify-center shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-[#10213B] text-sm block">
                {lab.name}
              </span>
              <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {lab.address}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#10213B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1565D8] text-white shadow-sm'
                    : 'text-[#172B4D] hover:bg-[#F5F8FC] hover:text-[#1565D8]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E3EAF3] bg-[#F5F8FC] text-xs text-[#64748B]">
          <p className="font-bold text-[#10213B]">{lab.name}</p>
          <p className="text-[11px] mt-0.5">Diagnostic Laboratory Management</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">● Online (Port 3005)</p>
        </div>
      </div>
    </div>
  );
}
