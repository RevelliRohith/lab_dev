'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassActionBar({ children, className }: GlassActionBarProps) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <div
        className={clsx(
          'pointer-events-auto flex flex-wrap items-center justify-between gap-3 px-5 py-3.5',
          'bg-white/[0.85] backdrop-blur-[24px] border border-white/[0.90] rounded-2xl sm:rounded-full',
          'shadow-[0_16px_40px_rgba(15,23,42,0.18)] max-w-4xl w-full transition-all duration-200',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
