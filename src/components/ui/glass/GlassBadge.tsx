'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'cyan' | 'mint' | 'lavender' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function GlassBadge({
  children,
  className,
  variant = 'blue',
  size = 'md',
  dot = false,
  ...props
}: GlassBadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  }[size];

  const variantStyles = {
    blue: 'bg-blue-50/80 text-[#2563EB] border-blue-200/60',
    cyan: 'bg-cyan-50/80 text-[#0284C7] border-cyan-200/60',
    mint: 'bg-emerald-50/80 text-[#059669] border-emerald-200/60',
    lavender: 'bg-purple-50/80 text-[#7C3AED] border-purple-200/60',
    amber: 'bg-amber-50/80 text-[#D97706] border-amber-200/60',
    rose: 'bg-rose-50/80 text-[#E11D48] border-rose-200/60',
    slate: 'bg-slate-100/80 text-[#475569] border-slate-200/60',
  }[variant];

  const dotColors = {
    blue: 'bg-[#2563EB]',
    cyan: 'bg-[#0284C7]',
    mint: 'bg-[#059669]',
    lavender: 'bg-[#7C3AED]',
    amber: 'bg-[#D97706]',
    rose: 'bg-[#E11D48]',
    slate: 'bg-[#475569]',
  }[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-bold border backdrop-blur-[8px]',
        sizeStyles,
        variantStyles,
        className
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors)} />}
      {children}
    </span>
  );
}
