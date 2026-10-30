'use client';

import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, helperText, className, id, required, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-[#14213D]">
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={clsx(
              'w-full appearance-none bg-white/[0.68] backdrop-blur-[12px] border rounded-xl text-xs sm:text-sm text-[#14213D] pl-3.5 pr-9 py-2 transition-all duration-200 outline-none cursor-pointer',
              'hover:bg-white/[0.80] focus:bg-white/[0.95] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20',
              error ? 'border-rose-400 bg-rose-50/30' : 'border-white/[0.80]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 pointer-events-none text-[#64748B] flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
