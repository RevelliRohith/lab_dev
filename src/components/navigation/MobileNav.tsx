'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { navigationItems } from './Sidebar';
import { X, MapPin, Sparkles, Phone } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full glass-panel border-r border-white/80 text-[#12234A] shadow-2xl p-4 justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm glow-blue flex items-center justify-center">
                <Image
                  src="/images/flask-logo.png"
                  alt="Logo"
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-[#12234A] text-sm block">
                  {lab.name}
                </span>
                <span className="text-[10px] text-[#526581] flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {lab.address}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#526581] hover:text-[#12234A] rounded-xl glass-pill focus:outline-none"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="py-4 space-y-1.5 overflow-y-auto">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] text-white shadow-md glow-blue border border-white/30'
                      : 'text-[#2C3E50] hover:bg-white/60 hover:text-[#2563EB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 rounded-xl glass-card text-xs text-[#526581] space-y-1 mt-auto">
          <p className="font-bold text-[#12234A]">{lab.name}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#0D9488] font-bold">
            <Phone className="w-3 h-3 text-[#0D9488]" />
            <span>+91 98482 28971</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold pt-1 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Online • Port 3005
          </p>
        </div>
      </div>
    </div>
  );
}
