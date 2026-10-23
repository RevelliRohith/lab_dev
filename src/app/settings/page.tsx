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
  Phone,
  Mail,
  MapPin,
  Save,
  UserPlus,
  Shield,
  Eye,
  Check,
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3EAF3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#10213B] tracking-tight">
              Laboratory Settings &amp; Staff
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1565D8] border border-blue-200">
              System Configuration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Laboratory branding, clinical credentials, staff role permissions, and immutable security audit logs.
          </p>
        </div>

        {isAdmin && activeTab === 'staff' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E3EAF3] gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'general'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Lab Profile &amp; Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'staff'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({globalStore.staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviewers')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reviewers'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>Director & Medical Licenses</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-[#1565D8] text-[#1565D8]'
              : 'border-transparent text-[#64748B] hover:text-[#10213B]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* TAB 1: General & Lab Branding */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <form
            onSubmit={handleSaveLabSettings}
            className="lg:col-span-2 bg-white border border-[#E3EAF3] rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,33,59,0.04)] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <h2 className="text-sm font-bold text-[#10213B] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1565D8]" />
                <span>Laboratory Facility Profile</span>
              </h2>
              {!isAdmin && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Read Only (Admin Required to Edit)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#10213B] mb-1">
                  Laboratory Facility Name *
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#10213B] mb-1">
                  Clinical Laboratory Director *
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.clinical_director}
                  onChange={(e) => setLabForm({ ...labForm, clinical_director: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#10213B] mb-1">
                  Laboratory License / Registration #
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.lab_license_number}
                  onChange={(e) => setLabForm({ ...labForm, lab_license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] font-mono focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#10213B] mb-1">
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
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#10213B] mb-1">Operating Timezone *</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.timezone}
                  onChange={(e) => setLabForm({ ...labForm, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] font-mono focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#10213B] mb-1">Base Currency Code *</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={labForm.currency_code}
                  onChange={(e) => setLabForm({ ...labForm, currency_code: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] font-mono uppercase font-bold focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10213B] mb-1">
                Physical Facility Address
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={labForm.address}
                onChange={(e) => setLabForm({ ...labForm, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10213B] mb-1">
                Official Report Header Banner Text
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={labForm.report_header_text}
                onChange={(e) => setLabForm({ ...labForm, report_header_text: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10213B] mb-1">
                Official Report Footer Accreditation Note
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={labForm.report_footer_text}
                onChange={(e) => setLabForm({ ...labForm, report_footer_text: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl disabled:bg-[#F5F8FC] focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-3 border-t border-[#E3EAF3]">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Laboratory Profile</span>
                </button>
              </div>
            )}
          </form>

          {/* Report Branding Visual Preview */}
          <div className="bg-white border border-[#E3EAF3] rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,33,59,0.04)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E3EAF3]">
              <Eye className="w-4 h-4 text-[#1565D8]" />
              <h3 className="text-sm font-bold text-[#10213B]">A4 Report Branding Preview</h3>
            </div>

            <p className="text-xs text-[#64748B]">
              This is how your laboratory branding appears at the top and bottom of generated patient diagnostic reports.
            </p>

            {/* Simulated Report Header */}
            <div className="p-4 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#E3EAF3]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1565D8] text-white flex items-center justify-center font-black text-xs">
                    RL
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-[#10213B]">{labForm.name}</div>
                    <div className="text-[10px] text-[#64748B]">
                      {labForm.address} • Ph: 9848228971
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-[#64748B]">
                  <div className="font-semibold text-[#10213B]">CLINICAL REPORT</div>
                  <div>{labForm.lab_license_number || 'REG-PENDING'}</div>
                </div>
              </div>
              <div className="text-[10px] text-[#1565D8] italic font-medium">
                {labForm.report_header_text}
              </div>
            </div>

            {/* Simulated Signatory */}
            <div className="p-4 bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl space-y-2">
              <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                Report Signatories
              </div>
              <div className="flex justify-between items-end pt-3">
                <div className="text-[10px]">
                  <div className="font-bold text-[#10213B]">{labForm.clinical_director}</div>
                  <div className="text-[#64748B]">Clinical Laboratory Director</div>
                </div>
                <div className="text-[10px] text-right">
                  <div className="font-bold text-[#1565D8]">Dr. Rishika</div>
                  <div className="text-[#64748B]">Authorized Pathologist</div>
                </div>
              </div>
            </div>

            {/* Simulated Footer */}
            <div className="p-3 bg-slate-100 rounded-xl text-center text-[10px] text-[#172B4D] font-medium">
              {labForm.report_footer_text}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Staff Accounts & Roles */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3EAF3]">
            <div>
              <h2 className="text-base font-bold text-[#10213B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1565D8]" />
                <span>Authorized Staff Directory &amp; Role Assignments</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Exactly three role types: <strong>Admin</strong>, <strong>Lab Staff</strong>,{' '}
                <strong>Authorized Reviewer</strong>. One person may hold multiple roles.
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
                      ? 'bg-white border-[#E3EAF3] shadow-xs hover:shadow-md'
                      : 'bg-slate-50 border-[#E3EAF3] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] font-bold flex items-center justify-center text-sm">
                        {st.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#10213B] text-sm">{st.full_name}</div>
                        <div className="text-[11px] text-[#64748B]">{st.email}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        st.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#64748B] flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{st.phone || '9848228971'}</span>
                  </div>

                  {/* Role Pills */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E3EAF3]">
                    <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Assigned Role Capabilities
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['admin', 'lab_staff', 'authorized_reviewer'] as UserRole[]).map((r) => {
                        const hasRole = st.roles.includes(r);
                        return (
                          <button
                            key={r}
                            disabled={!isAdmin}
                            onClick={() => handleToggleStaffRole(st.id, r)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              hasRole
                                ? 'bg-blue-50 text-[#1565D8] border-blue-300'
                                : 'bg-[#F5F8FC] text-[#64748B] border-[#E3EAF3] hover:text-[#10213B]'
                            }`}
                            title={isAdmin ? 'Click to toggle role' : ''}
                          >
                            {r === 'admin'
                              ? 'Admin'
                              : r === 'lab_staff'
                              ? 'Lab Staff'
                              : 'Pathologist'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && st.id !== activeStaff.id && (
                    <div className="pt-2 border-t border-[#E3EAF3] flex justify-end">
                      <button
                        onClick={() => handleToggleStaffStatus(st.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
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
        <div className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] p-6 space-y-4">
          <div className="pb-3 border-b border-[#E3EAF3]">
            <h2 className="text-base font-bold text-[#10213B] flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-[#1565D8]" />
              <span>Qualified Reviewer Scopes &amp; Credential Governance</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
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
                    className="p-5 bg-[#F5F8FC] border border-[#E3EAF3] rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1565D8] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          DR
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#10213B]">
                            {reviewer.full_name}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {reviewer.email} • Ph: {reviewer.phone}
                          </div>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-[#1565D8] border border-blue-200 self-start sm:self-auto">
                        {scope?.is_active ? 'VERIFIED SCOPE ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E3EAF3]">
                      <div>
                        <div className="text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                          Medical License #
                        </div>
                        <div className="font-mono font-bold text-[#10213B] mt-0.5">
                          {scope?.medical_license_number || 'TSMC-74892'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                          Credentials / Qualification
                        </div>
                        <div className="font-bold text-[#10213B] mt-0.5">
                          {scope?.credentials_title || 'Consultant Pathologist (MD)'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                          Validity Period
                        </div>
                        <div className="font-mono text-[#10213B] mt-0.5">
                          {scope?.valid_from} to {scope?.valid_to}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[#10213B] mb-1.5">
                        Authorized Specialty Scopes:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {scope?.verified_scopes.map((sc) => (
                          <span
                            key={sc}
                            className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white border border-[#E3EAF3] text-[#10213B] shadow-2xs"
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
        <div className="bg-white border border-[#E3EAF3] rounded-2xl shadow-[0_1px_3px_rgba(16,33,59,0.04)] overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3EAF3]">
            <div>
              <h2 className="text-base font-bold text-[#10213B] flex items-center gap-2">
                <History className="w-4 h-4 text-[#1565D8]" />
                <span>Security &amp; Clinical Audit Trail</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Append-only log of sensitive clinical, permission, and financial events.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#10213B] bg-[#F5F8FC] border border-[#E3EAF3] px-2.5 py-1 rounded-full">
              {globalStore.auditEvents.length} events logged
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-[#172B4D]">
              <thead className="bg-[#F5F8FC] text-[#64748B] font-semibold border-b border-[#E3EAF3] sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Staff Actor</th>
                  <th className="px-4 py-2.5 font-semibold">Action</th>
                  <th className="px-4 py-2.5 font-semibold">Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Metadata Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF3]">
                {globalStore.auditEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F5F8FC]/80 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      {new Date(ev.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-[#10213B]">{ev.actor_email}</span>
                      <span className="block text-[10px] text-[#64748B] uppercase font-mono">
                        {ev.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#1565D8]">
                      {ev.action}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#64748B]">
                      {ev.entity_type} ({ev.entity_id.substring(0, 8)}...)
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono text-[10px] text-[#64748B] max-w-xs truncate"
                      title={JSON.stringify(ev.metadata)}
                    >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10213B]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-[#E3EAF3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAF3]">
              <h2 className="text-base font-bold text-[#10213B] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1565D8]" />
                <span>Create Staff Account</span>
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-[#10213B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Suresh"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. suresh@gmail.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="9848228971"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10213B] mb-1">
                  Primary Role *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-[#E3EAF3] rounded-xl bg-white font-medium"
                >
                  <option value="lab_staff">Lab Staff (Technologist / Phlebotomist)</option>
                  <option value="authorized_reviewer">Authorized Reviewer (Pathologist)</option>
                  <option value="admin">Admin (Laboratory Administrator)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E3EAF3]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1565D8] hover:bg-[#104fad] rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
