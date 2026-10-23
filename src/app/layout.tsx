'use client';

import React, { useState } from 'react';
import './globals.css';
import { TopBar } from '@/components/navigation/TopBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { MobileNav } from '@/components/navigation/MobileNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setRefreshTick] = useState(0);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans selection:bg-blue-200 selection:text-[#12234A] text-[#12234A]">
        {/* Floating Glass Navigation */}
        <TopBar
          onMenuToggle={() => setMobileMenuOpen(true)}
          onStaffChange={() => setRefreshTick((t) => t + 1)}
        />
        <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <div className="flex min-h-screen">
          {/* Floating Glass Sidebar (Desktop) */}
          <Sidebar />

          {/* Main View Area with Floating Offsets */}
          <main className="flex-1 md:pl-71 pt-23 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
