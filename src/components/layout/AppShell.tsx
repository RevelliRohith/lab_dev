'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopBar } from '@/components/navigation/TopBar';
import { MobileNav } from '@/components/navigation/MobileNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setRefreshTick] = useState(0);

  return (
    <div className="min-h-screen flex w-full bg-[#F8FAFC]">
      {/* 1. Mobile Drawer Navigation */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* 2. Desktop In-Flow Sidebar Column (takes exactly 16rem / 256px) */}
      <div className="hidden md:flex w-64 shrink-0 flex-col p-3">
        <Sidebar className="sticky top-3 h-[calc(100vh-1.5rem)] w-full" />
      </div>

      {/* 3. Main Column (in-flow, starts cleanly after sidebar) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Floating Glass TopBar Header */}
        <div className="sticky top-0 z-30 pt-3 pb-2 px-3 sm:px-6 lg:px-8 mb-4 bg-transparent">
          <TopBar
            onMenuToggle={() => setMobileMenuOpen(true)}
            onStaffChange={() => setRefreshTick((t) => t + 1)}
          />
        </div>

        {/* Page Content Area */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 pb-16 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
