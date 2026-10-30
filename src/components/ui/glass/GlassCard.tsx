'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'surface' | 'subtle' | 'elevated' | 'tint-blue' | 'tint-green' | 'tint-purple' | 'tint-amber';
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'surface',
  interactive = false,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    surface: 'bg-white/[0.68] border-white/[0.75] shadow-[0_4px_24px_rgba(37,99,235,0.06)]',
    subtle: 'bg-white/[0.50] border-white/[0.60] shadow-[0_2px_12px_rgba(37,99,235,0.03)]',
    elevated: 'bg-white/[0.80] border-white/[0.90] shadow-[0_12px_36px_rgba(37,99,235,0.10)]',
    'tint-blue': 'bg-blue-50/[0.65] border-blue-200/[0.60] shadow-[0_4px_20px_rgba(37,99,235,0.08)]',
    'tint-green': 'bg-emerald-50/[0.65] border-emerald-200/[0.60] shadow-[0_4px_20px_rgba(16,185,129,0.08)]',
    'tint-purple': 'bg-purple-50/[0.65] border-purple-200/[0.60] shadow-[0_4px_20px_rgba(168,85,247,0.08)]',
    'tint-amber': 'bg-amber-50/[0.65] border-amber-200/[0.60] shadow-[0_4px_20px_rgba(245,158,11,0.08)]',
  }[variant];

  return (
    <div
      className={clsx(
        'backdrop-blur-[16px] border rounded-2xl transition-all duration-200 relative overflow-hidden',
        variantStyles,
        interactive &&
          'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.12)] hover:bg-white/[0.82] hover:border-white cursor-pointer active:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
