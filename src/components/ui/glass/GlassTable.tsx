'use client';

import React from 'react';
import clsx from 'clsx';

export interface GlassTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function GlassTable({ children, className, ...props }: GlassTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/[0.75] bg-white/[0.60] backdrop-blur-[16px] shadow-sm">
      <table className={clsx('w-full text-left border-collapse text-xs sm:text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function GlassTableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx(
        'bg-white/[0.70] border-b border-slate-200/60 text-[11px] font-bold text-[#64748B] uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function GlassTableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx('divide-y divide-slate-200/40 text-[#14213D]', className)} {...props}>
      {children}
    </tbody>
  );
}

export function GlassTableRow({
  children,
  className,
  isClickable = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { isClickable?: boolean }) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-150',
        isClickable ? 'hover:bg-blue-50/40 cursor-pointer' : 'hover:bg-white/40',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function GlassTableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export function GlassTableHeaderCell({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={clsx('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </th>
  );
}
