'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { globalStore } from '@/lib/store';
import { GlassTabs, TabItem } from '@/components/ui/glass';
import { LabProfileTab } from '@/components/settings/LabProfileTab';
import { TestCatalogueTab } from '@/components/settings/TestCatalogueTab';
import { TestComponentsTab } from '@/components/settings/TestComponentsTab';
import { ReportTemplatesTab } from '@/components/settings/ReportTemplatesTab';
import { SignatoriesTab } from '@/components/settings/SignatoriesTab';
import { UsersCredentialsTab } from '@/components/settings/UsersCredentialsTab';
import { PricingPreferencesTab } from '@/components/settings/PricingPreferencesTab';
import {
  Building2,
  FlaskConical,
  Layers,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  History,
  Sparkles,
} from 'lucide-react';

type SettingsTab =
  | 'profile'
  | 'catalogue'
  | 'components'
  | 'templates'
  | 'signatories'
  | 'users'
  | 'pricing'
  | 'audit';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const isAdmin = activeStaff.roles.includes('admin');

  const tabs: TabItem<SettingsTab>[] = [
    { id: 'profile', label: '1. Laboratory Profile', icon: Building2 },
    { id: 'catalogue', label: '2. Test Catalogue', count: globalStore.tests.length, icon: FlaskConical },
    { id: 'components', label: '3. Test Components', count: globalStore.components.length, icon: Layers },
    { id: 'templates', label: '4. Report Templates', count: globalStore.reportTemplates.length, icon: FileText },
    { id: 'signatories', label: '5. Authorized Signatories', count: globalStore.signatories.length, icon: ShieldCheck },
    { id: 'users', label: '6. Users & Credentials', count: globalStore.staff.length, icon: Users },
    { id: 'pricing', label: '7. Pricing & Preferences', icon: Settings },
    { id: 'audit', label: 'Audit Trail', count: globalStore.auditEvents.length, icon: History },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.68] backdrop-blur-[20px] border border-white/[0.85] shadow-[0_8px_32px_rgba(37,99,235,0.06)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50/80 text-[#2563EB] border border-blue-200/50 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facility Management & Clinical Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#14213D] tracking-tight">
            Settings & Staff
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure laboratory master data, test catalog, report templates, signatories, and user credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              isAdmin
                ? 'bg-blue-100/80 text-[#2563EB] border-blue-200/60'
                : 'bg-teal-100/80 text-teal-800 border-teal-200/60'
            }`}
          >
            {isAdmin ? 'ADMIN ACCESS' : 'STAFF ACCESS (Read Only)'}
          </span>
        </div>
      </div>

      {/* Exactly 7 Clean Internal Tabs (Matching Master Architecture Part 2) */}
      <div className="overflow-x-auto pb-1">
        <GlassTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t)}
          className="w-full flex-wrap"
        />
      </div>

      {/* Tab Panels */}
      <div className="animate-fade-in">
        {activeTab === 'profile' && <LabProfileTab isAdmin={isAdmin} />}
        {activeTab === 'catalogue' && <TestCatalogueTab isAdmin={isAdmin} />}
        {activeTab === 'components' && <TestComponentsTab isAdmin={isAdmin} />}
        {activeTab === 'templates' && <ReportTemplatesTab isAdmin={isAdmin} />}
        {activeTab === 'signatories' && <SignatoriesTab isAdmin={isAdmin} />}
        {activeTab === 'users' && <UsersCredentialsTab isAdmin={isAdmin} />}
        {activeTab === 'pricing' && <PricingPreferencesTab isAdmin={isAdmin} />}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl bg-white/[0.68] backdrop-blur-[16px] border border-white/[0.80] p-0 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#14213D]">
                  Immutable Clinical & System Audit Log ({globalStore.auditEvents.length} Events)
                </h3>
              </div>
              <span className="text-[11px] text-[#64748B]">Tamper-evident operational trail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#14213D]">
                <thead className="bg-white/60 text-[#64748B] font-bold border-b border-slate-200/50 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Actor Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40">
                  {globalStore.auditEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/50">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#2563EB]">
                        {evt.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {evt.entity_type}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {evt.actor_email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {evt.actor_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#64748B] max-w-xs truncate">
                        {JSON.stringify(evt.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsAndStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading settings & laboratory profile...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

