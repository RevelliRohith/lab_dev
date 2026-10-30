'use client';

import React from 'react';
import clsx from 'clsx';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface GlassTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function GlassTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: GlassTabsProps<T>) {
  return (
    <div
      className={clsx(
        'inline-flex flex-wrap p-1.5 gap-1.5 bg-white/[0.60] backdrop-blur-[16px] border border-white/[0.80] rounded-2xl shadow-xs',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 select-none cursor-pointer',
              isActive
                ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/20 border border-white/30'
                : 'text-[#64748B] hover:text-[#14213D] hover:bg-white/60'
            )}
          >
            {Icon && <Icon className={clsx('w-3.5 h-3.5', isActive ? 'text-white' : 'text-[#64748B]')} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-[#14213D]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
