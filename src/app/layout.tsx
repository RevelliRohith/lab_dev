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
      <body className="bg-[#F5F8FC] text-[#172B4D] antialiased min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen(true)}
          onStaffChange={() => setRefreshTick((t) => t + 1)}
        />
        <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:pl-64 min-h-[calc(100vh-4.25rem)] p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
