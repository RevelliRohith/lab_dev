'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#14213D]">
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-[#64748B] flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={clsx(
              'w-full bg-white/[0.68] backdrop-blur-[12px] border rounded-xl text-xs sm:text-sm text-[#14213D] placeholder-[#64748B] transition-all duration-200 outline-none',
              'hover:bg-white/[0.80] focus:bg-white/[0.95] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20',
              leftIcon ? 'pl-9' : 'pl-3.5',
              rightIcon ? 'pr-9' : 'pr-3.5',
              'py-2',
              error ? 'border-rose-400 bg-rose-50/30' : 'border-white/[0.80]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#64748B] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
