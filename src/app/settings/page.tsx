'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import {
  Users,
  Building2,
  History,
  CheckCircle2,
  AlertTriangle,
  FileBadge,
  Phone,
  Save,
  UserPlus,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export default function SettingsAndStaffPage() {
  const [, setTick] = useState(0);

  // Lab settings state
  const [labForm, setLabForm] = useState({ ...globalStore.lab });

  // New staff modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
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
      setErrorMessage(
        'Permission Denied: Only Administrator (Padma) can modify laboratory facility settings.'
      );
      return;
    }

    try {
      globalStore.lab = { ...labForm };
      globalStore.recordAudit('lab_settings_updated', 'labs', globalStore.lab.id, {
        director: labForm.clinical_director,
        discount_limit: labForm.max_staff_discount_percentage,
        name: labForm.name,
      });
      setSuccessMessage('Laboratory profile and report branding updated successfully.');
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
      setErrorMessage('Permission Denied: Only Admin can modify staff status.');
      return;
    }

    const target = globalStore.staff.find((s) => s.id === staffId);
    if (!target) return;

    if (target.id === activeStaff.id) {
      setErrorMessage('Security Rule: Cannot deactivate your own active session.');
      return;
    }

    const newStatus = target.status === 'active' ? 'disabled' : 'active';
    target.status = newStatus;
    globalStore.recordAudit('staff_status_changed', 'staff_profiles', target.id, {
      name: target.full_name,
      new_status: newStatus,
    });
    setSuccessMessage(
      `Staff member ${target.full_name} status updated to ${newStatus.toUpperCase()}`
    );
    setTick((t) => t + 1);
  };

  // Toggle Staff Role
  const handleToggleStaffRole = (staffId: string, role: UserRole) => {
    if (!isAdmin) {
      setErrorMessage('Permission Denied: Only Admin can assign staff roles.');
      return;
    }

    const target = globalStore.staff.find((s) => s.id === staffId);
    if (!target) return;

    if (target.roles.includes(role)) {
      if (target.roles.length === 1) {
        setErrorMessage('Staff member must have at least one role assigned.');
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
    setSuccessMessage(`Updated roles for ${target.full_name} to: ${target.roles.join(', ')}`);
    setTick((t) => t + 1);
  };

  // Handle Add New Staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    try {
      const newId = `staff-${Date.now()}`;
      globalStore.staff.push({
        id: newId,
        lab_id: globalStore.lab.id,
        full_name: newStaffName,
        email: newStaffEmail,
        phone: newStaffPhone || '9848228971',
        roles: [newStaffRole],
        status: 'active',
        mfa_enabled: false,
      });

      globalStore.recordAudit('staff_member_added', 'staff_profiles', newId, {
        name: newStaffName,
        role: newStaffRole,
      });

      setSuccessMessage(`Staff profile for ${newStaffName} created successfully.`);
      setShowInviteModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill text-[#2563EB] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facility Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12234A] tracking-tight">
            Laboratory Settings &amp; Staff
          </h1>
          <p className="text-xs sm:text-sm text-[#526581] mt-1 max-w-xl">
            Laboratory branding, clinical credentials, staff role permissions, and immutable security audit logs.
          </p>
        </div>

        {isAdmin && activeTab === 'staff' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-2xl shadow-md glow-blue hover:brightness-105 active:scale-98 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200/60 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* Segmented Tab Controls */}
      <div className="inline-flex flex-wrap glass-card p-1.5 rounded-2xl border border-white/70 shadow-xs max-w-3xl w-full">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'general'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Lab Profile &amp; Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts ({globalStore.staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviewers')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reviewers'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <FileBadge className="w-3.5 h-3.5" />
          <span>Director &amp; Licenses</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log ({globalStore.auditEvents.length})</span>
        </button>
      </div>

      {/* TAB 1: General & Lab Branding */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <form
            onSubmit={handleSaveLabSettings}
            className="lg:col-span-2 glass-panel border border-white/80 rounded-3xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(37,99,235,0.05)] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-sm font-bold text-[#12234A] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>Laboratory Facility Profile</span>
              </h2>
              {!isAdmin && (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-full border border-amber-200">
                  Read Only (Admin Required to Edit)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#12234A] mb-1">
                  Laboratory Facility Name *
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12234A] mb-1">
                  Clinical Laboratory Director *
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.clinical_director}
                  onChange={(e) => setLabForm({ ...labForm, clinical_director: e.target.value })}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12234A] mb-1">
                  Laboratory License / Registration #
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.lab_license_number}
                  onChange={(e) => setLabForm({ ...labForm, lab_license_number: e.target.value })}
                  className="glass-input w-full px-3 py-2 text-xs font-mono rounded-xl disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12234A] mb-1">
                  Max Staff Discount Permitted (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!isAdmin}
                  value={labForm.max_staff_discount_percentage}
                  onChange={(e) =>
                    setLabForm({
                      ...labForm,
                      max_staff_discount_percentage: Number(e.target.value),
                    })
                  }
                  className="glass-input w-full px-3 py-2 text-xs font-mono font-bold rounded-xl disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12234A] mb-1">Operating Timezone *</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.timezone}
                  onChange={(e) => setLabForm({ ...labForm, timezone: e.target.value })}
                  className="glass-input w-full px-3 py-2 text-xs font-mono rounded-xl disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12234A] mb-1">Base Currency Code *</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.currency_code}
                  onChange={(e) => setLabForm({ ...labForm, currency_code: e.target.value })}
                  className="glass-input w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-xl disabled:opacity-60 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12234A] mb-1">
                Physical Facility Address
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.address}
                onChange={(e) => setLabForm({ ...labForm, address: e.target.value })}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl disabled:opacity-60 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12234A] mb-1">
                Official Report Header Banner Text
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={labForm.report_header_text}
                onChange={(e) => setLabForm({ ...labForm, report_header_text: e.target.value })}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl disabled:opacity-60 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12234A] mb-1">
                Official Report Footer Accreditation Note
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={labForm.report_footer_text}
                onChange={(e) => setLabForm({ ...labForm, report_footer_text: e.target.value })}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl disabled:opacity-60 outline-none"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-3 border-t border-white/60">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-md glow-blue hover:brightness-105 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Laboratory Profile</span>
                </button>
              </div>
            )}
          </form>

          {/* Report Branding Visual Preview */}
          <div className="glass-panel border border-white/80 rounded-3xl p-6 shadow-[0_8px_32px_rgba(37,99,235,0.05)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/60">
              <Eye className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#12234A]">A4 Report Branding Preview</h3>
            </div>

            <p className="text-xs text-[#526581]">
              This is how your laboratory branding appears at the top and bottom of generated patient diagnostic reports.
            </p>

            {/* Simulated Report Header */}
            <div className="p-4 glass-card border border-white/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    RL
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-[#12234A]">{labForm.name}</div>
                    <div className="text-[10px] text-[#526581]">
                      {labForm.address} • Ph: 9848228971
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-[#526581]">
                  <div className="font-semibold text-[#12234A]">CLINICAL REPORT</div>
                  <div>{labForm.lab_license_number || 'REG-PENDING'}</div>
                </div>
              </div>
              <div className="text-[10px] text-[#2563EB] italic font-medium">
                {labForm.report_header_text}
              </div>
            </div>

            {/* Simulated Signatory */}
            <div className="p-4 glass-card border border-white/60 rounded-2xl space-y-2">
              <div className="text-[10px] text-[#526581] font-semibold uppercase tracking-wider">
                Report Signatories
              </div>
              <div className="flex justify-between items-end pt-3">
                <div className="text-[10px]">
                  <div className="font-bold text-[#12234A]">{labForm.clinical_director}</div>
                  <div className="text-[#526581]">Clinical Laboratory Director</div>
                </div>
                <div className="text-[10px] text-right">
                  <div className="font-bold text-[#2563EB]">Dr. Rishika</div>
                  <div className="text-[#526581]">Authorized Pathologist</div>
                </div>
              </div>
            </div>

            {/* Simulated Footer */}
            <div className="p-3 glass-card rounded-2xl text-center text-[10px] text-[#12234A] font-medium border border-white/60">
              {labForm.report_footer_text}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Staff Accounts & Roles */}
      {activeTab === 'staff' && (
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
            <div>
              <h2 className="text-base font-bold text-[#12234A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>Authorized Staff Directory &amp; Role Assignments</span>
              </h2>
              <p className="text-xs text-[#526581] mt-0.5">
                Two primary operational roles: <strong>Admin</strong> and <strong>Staff</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {globalStore.staff.map((st) => {
              return (
                <div
                  key={st.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    st.status === 'active'
                      ? 'glass-card border-white/70 shadow-xs hover:shadow-md'
                      : 'bg-slate-100/40 border-slate-200/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {st.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#12234A] text-sm">{st.full_name}</div>
                        <div className="text-[11px] text-[#526581]">{st.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        st.status === 'active'
                          ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60'
                          : 'bg-rose-100/90 text-rose-800 border border-rose-200/60'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#526581] flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{st.phone || '9848228971'}</span>
                  </div>

                  {/* Role Pills */}
                  <div className="space-y-1.5 pt-2 border-t border-white/60">
                    <div className="text-[11px] font-semibold text-[#526581] uppercase tracking-wider">
                      Assigned Capabilities
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['admin', 'lab_staff'] as UserRole[]).map((r) => {
                        const hasRole = st.roles.includes(r);
                        return (
                          <button
                            key={r}
                            disabled={!isAdmin}
                            onClick={() => handleToggleStaffRole(st.id, r)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                              hasRole
                                ? 'bg-blue-100/80 text-[#2563EB] border-blue-300/60 shadow-2xs'
                                : 'glass-card text-[#526581] border-white/50 hover:text-[#12234A]'
                            }`}
                            title={isAdmin ? 'Click to toggle role' : ''}
                          >
                            {r === 'admin' ? 'Admin' : 'Staff'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && st.id !== activeStaff.id && (
                    <div className="pt-2 border-t border-white/60 flex justify-end">
                      <button
                        onClick={() => handleToggleStaffStatus(st.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all ${
                          st.status === 'active'
                            ? 'text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {st.status === 'active' ? 'Deactivate Access' : 'Reactivate Access'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Reviewer Scopes & Credentials */}
      {activeTab === 'reviewers' && (
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] p-6 space-y-4">
          <div className="pb-3 border-b border-white/60">
            <h2 className="text-base font-bold text-[#12234A] flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-[#2563EB]" />
              <span>Qualified Reviewer Scopes &amp; Credential Governance</span>
            </h2>
            <p className="text-xs text-[#526581] mt-0.5">
              Clinical eligibility requires recorded medical qualifications, license registration, specialty scopes, and validity dates.
            </p>
          </div>

          <div className="space-y-4">
            {globalStore.staff
              .filter((s) => s.roles.includes('authorized_reviewer'))
              .map((reviewer) => {
                const scope = reviewer.reviewer_scope;
                return (
                  <div
                    key={reviewer.id}
                    className="p-5 glass-card border border-white/60 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          DR
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#12234A]">
                            {reviewer.full_name}
                          </div>
                          <div className="text-xs text-[#526581]">
                            {reviewer.email} • Ph: {reviewer.phone}
                          </div>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB] border border-blue-200 self-start sm:self-auto">
                        {scope?.is_active ? 'VERIFIED SCOPE ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/70 p-4 rounded-xl border border-white/60">
                      <div>
                        <div className="text-[#526581] text-[11px] uppercase tracking-wider font-semibold">
                          Medical License #
                        </div>
                        <div className="font-mono font-bold text-[#12234A] mt-0.5">
                          {scope?.medical_license_number || 'TSMC-74892'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[#526581] text-[11px] uppercase tracking-wider font-semibold">
                          Credentials / Qualification
                        </div>
                        <div className="font-bold text-[#12234A] mt-0.5">
                          {scope?.credentials_title || 'Consultant Pathologist (MD)'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[#526581] text-[11px] uppercase tracking-wider font-semibold">
                          Validity Period
                        </div>
                        <div className="font-mono text-[#12234A] mt-0.5">
                          {scope?.valid_from} to {scope?.valid_to}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[#12234A] mb-1.5">
                        Authorized Specialty Scopes:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {scope?.verified_scopes.map((sc) => (
                          <span
                            key={sc}
                            className="px-2.5 py-1 rounded-md text-xs font-mono font-bold glass-pill text-[#12234A] shadow-2xs"
                          >
                            {sc === 'HEM'
                              ? 'HEM (Hematology)'
                              : sc === 'BIO'
                              ? 'BIO (Clinical Biochemistry)'
                              : sc === 'MICRO'
                              ? 'MICRO (Microbiology)'
                              : sc}
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
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
            <div>
              <h2 className="text-base font-bold text-[#12234A] flex items-center gap-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <span>Security &amp; Clinical Audit Trail</span>
              </h2>
              <p className="text-xs text-[#526581] mt-0.5">
                Tamper-evident logs of logins, patient entries, test status changes, and report sign-offs.
              </p>
            </div>
            <span className="text-xs font-bold glass-pill text-[#2563EB] px-3 py-1">
              {globalStore.auditEvents.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#12234A]">
              <thead className="bg-white/40 text-[#526581] font-semibold border-b border-white/60">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Actor Email</th>
                  <th className="px-4 py-3">Payload Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {[...globalStore.auditEvents].reverse().map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#526581] whitespace-nowrap" suppressHydrationWarning>
                      {new Date(ev.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#12234A]">
                      <span className="glass-pill px-2 py-0.5">
                        {ev.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#526581]">{ev.entity_type}</td>
                    <td className="px-4 py-3 font-mono text-[#12234A]">{ev.actor_email}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#526581] max-w-xs truncate">
                      {JSON.stringify(ev.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-base font-bold text-[#12234A]">Add Staff Profile</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rishi / Rishika"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@rishilab.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9848228971"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12234A] mb-1">
                  Primary Role Assignment *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-xl font-medium"
                >
                  <option value="lab_staff">Lab Staff (Technician / Phlebotomist)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#526581] glass-card hover:bg-white rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-md glow-blue hover:brightness-105 transition-all"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
