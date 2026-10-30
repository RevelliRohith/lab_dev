import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Rishi Laboratory — Diagnostic Laboratory Management',
  description: 'Premium diagnostic laboratory management system with iOS Liquid Glass UI.',
  icons: {
    icon: '/images/flask-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans selection:bg-blue-200 selection:text-[#12234A] text-[#12234A] bg-[#F8FAFC] overflow-x-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
