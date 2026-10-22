'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import {
  Settings,
  Users,
  ShieldCheck,
  Building2,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  FileBadge,
} from 'lucide-react';

export default function SettingsAndStaffPage() {
  const [, setTick] = useState(0);

  // Lab settings state
  const [labForm, setLabForm] = useState({ ...globalStore.lab });

  // New staff modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('lab_staff');

  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'reviewers' | 'audit'>('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const isAdmin = activeStaff.roles.includes('admin');

  // Handle Lab Settings Save
  const handleSaveLabSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isAdmin) {
      setErrorMessage('Permission Denied: Only Admin can modify laboratory settings');
      return;
    }

    try {
      globalStore.lab = { ...labForm };
      globalStore.recordAudit('lab_settings_updated', 'labs', globalStore.lab.id, {
        director: labForm.clinical_director,
        discount_limit: labForm.max_staff_discount_percentage,
      });
      setSuccessMessage('Laboratory settings and report branding saved successfully.');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Toggle Staff status (active <-> disabled)
  const handleToggleStaffStatus = (staffId: string) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!isAdmin) {
      setErrorMessage('Permission Denied: Only Admin can modify staff status');
      return;
    }

    const target = globalStore.staff.find((s) => s.id === staffId);
    if (!target) return;

    if (target.id === activeStaff.id) {
      setErrorMessage('Cannot deactivate your own active session');
      return;
    }

    const newStatus = target.status === 'active' ? 'disabled' : 'active';
    target.status = newStatus;
    globalStore.recordAudit('staff_status_changed', 'staff_profiles', target.id, {
      name: target.full_name,
      new_status: newStatus,
    });
    setSuccessMessage(`Staff member ${target.full_name} status updated to ${newStatus.toUpperCase()}`);
    setTick((t) => t + 1);
  };

  // Toggle Staff Role
  const handleToggleStaffRole = (staffId: string, role: UserRole) => {
    if (!isAdmin) {
      setErrorMessage('Permission Denied: Only Admin can assign staff roles');
      return;
    }

    const target = globalStore.staff.find((s) => s.id === staffId);
    if (!target) return;

    if (target.roles.includes(role)) {
      if (target.roles.length === 1) {
        setErrorMessage('Staff member must have at least one role assigned');
        return;
      }
      target.roles = target.roles.filter((r) => r !== role);
    } else {
      target.roles.push(role);
    }

    globalStore.recordAudit('staff_role_assigned', 'staff_profiles', target.id, {
      name: target.full_name,
      updated_roles: target.roles,
    });
    setSuccessMessage(`Updated roles for ${target.full_name}`);
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Settings & Staff</h1>
          <p className="text-sm text-slate-600 mt-1">
            Laboratory profile, CLIA accreditation branding, staff role assignments, reviewer scopes, and audit trail.
          </p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Lab & Report Branding</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts & Roles</span>
        </button>
        <button
          onClick={() => setActiveTab('reviewers')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reviewers'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>Reviewer Scopes & Credentials</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: General & Lab Branding */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveLabSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Laboratory Profile & Configuration</h2>
            {!isAdmin && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                View Only (Admin Required to Edit)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Laboratory Facility Name *</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.name}
                onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CLIA / Accreditation License # *</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.lab_license_number}
                onChange={(e) => setLabForm({ ...labForm, lab_license_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Laboratory Director *</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.clinical_director}
                onChange={(e) => setLabForm({ ...labForm, clinical_director: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Staff Discount Permitted (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!isAdmin}
                value={labForm.max_staff_discount_percentage}
                onChange={(e) => setLabForm({ ...labForm, max_staff_discount_percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timezone *</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.timezone}
                onChange={(e) => setLabForm({ ...labForm, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Code *</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.currency_code}
                onChange={(e) => setLabForm({ ...labForm, currency_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={labForm.address}
              onChange={(e) => setLabForm({ ...labForm, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Header Banner Text</label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={labForm.report_header_text}
              onChange={(e) => setLabForm({ ...labForm, report_header_text: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
            />
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
              >
                Save Laboratory Settings
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: Staff Accounts & Roles */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Staff Accounts & Role Assignments</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exactly three role types: Admin, Lab Staff, Authorized Reviewer. One staff member may hold multiple roles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Email & Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Role Assignments</th>
                  <th className="px-4 py-3">MFA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalStore.staff.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">{st.full_name}</td>
                    <td className="px-4 py-3">
                      <div>{st.email}</div>
                      <div className="text-[11px] text-slate-400">{st.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          st.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(['admin', 'lab_staff', 'authorized_reviewer'] as UserRole[]).map((r) => {
                          const hasRole = st.roles.includes(r);
                          return (
                            <button
                              key={r}
                              disabled={!isAdmin}
                              onClick={() => handleToggleStaffRole(st.id, r)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                hasRole
                                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700'
                              }`}
                              title={isAdmin ? 'Click to toggle role' : ''}
                            >
                              {r.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {st.mfa_enabled ? (
                        <span className="text-emerald-700 font-medium text-[11px]">Enforced</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Optional</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && st.id !== activeStaff.id && (
                        <button
                          onClick={() => handleToggleStaffStatus(st.id)}
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            st.status === 'active'
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {st.status === 'active' ? 'Deactivate Access' : 'Activate Access'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Reviewer Scopes & Credentials */}
      {activeTab === 'reviewers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Qualified Reviewer Scopes & Credential Governance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Role assignment alone is not proof of professional eligibility. Reviewers require verified specialty credentials, scope limits, and validity dates.
            </p>
          </div>

          <div className="space-y-4">
            {globalStore.staff
              .filter((s) => s.roles.includes('authorized_reviewer'))
              .map((reviewer) => {
                const scope = reviewer.reviewer_scope;
                return (
                  <div key={reviewer.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{reviewer.full_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {scope?.is_active ? 'VERIFIED SCOPE ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400">Professional Credentials / Board Certification:</span>
                        <p className="font-semibold text-slate-800">{scope?.credentials_title || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Validity Period:</span>
                        <p className="font-mono text-slate-800">
                          {scope?.valid_from} to {scope?.valid_to}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Authorized Clinical Specialty Scopes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scope?.verified_scopes.map((sc) => (
                          <span key={sc} className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white border border-slate-300 text-slate-800">
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Append-only log of sensitive clinical, permission, and financial mutations. Modifications are blocked in database policies.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">{globalStore.auditEvents.length} events logged</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalStore.auditEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()} {new Date(ev.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-slate-800">{ev.actor_email}</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono">({ev.actor_role})</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-medium text-teal-700">{ev.action}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">
                      {ev.entity_type} ({ev.entity_id.substring(0, 8)}...)
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(ev.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
