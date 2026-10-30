'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5 font-medium',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 font-semibold',
    lg: 'px-6 py-2.5 text-sm sm:text-base rounded-2xl gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#4F46E5] text-white shadow-md shadow-blue-500/25 border border-white/25 hover:shadow-lg hover:shadow-blue-500/35 hover:brightness-105 active:scale-[0.98]',
    secondary:
      'bg-white/[0.72] text-[#14213D] border border-white/[0.85] shadow-xs hover:bg-white/[0.90] hover:text-[#2563EB] active:scale-[0.98]',
    outline:
      'bg-transparent border border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB]/10 active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20 border border-white/20 hover:brightness-105 active:scale-[0.98]',
    ghost:
      'bg-transparent text-[#64748B] hover:text-[#14213D] hover:bg-white/50 active:scale-[0.98]',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 border border-white/20 hover:brightness-105 active:scale-[0.98]',
  }[variant];

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150 backdrop-blur-[12px] select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        sizeStyles,
        variantStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
