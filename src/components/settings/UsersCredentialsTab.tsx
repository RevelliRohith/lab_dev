'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { StaffProfile, UserRole } from '@/lib/types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassModal,
  GlassBadge,
} from '@/components/ui/glass';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
} from 'lucide-react';

export function UsersCredentialsTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);

  // Invite User Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'lab_staff'>('lab_staff');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const activeStaff = globalStore.getActiveStaff();

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!isAdmin) {
      setActionError('Permission Denied: Only Administrator can invite new staff members.');
      return;
    }

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setActionError('Full Name and valid email address are required.');
      return;
    }

    // Check duplicate email
    if (globalStore.staff.some((s) => s.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setActionError(`An account with email "${inviteEmail}" already exists.`);
      return;
    }

    try {
      const newStaff: StaffProfile = {
        id: crypto.randomUUID(),
        lab_id: globalStore.lab.id,
        email: inviteEmail.trim().toLowerCase(),
        full_name: inviteName.trim(),
        phone: invitePhone.trim() || '9848228971',
        status: 'active',
        mfa_enabled: false,
        roles: [inviteRole],
      };

      globalStore.staff.push(newStaff);
      globalStore.recordAudit('staff_invited', 'staff_profiles', newStaff.id, {
        name: newStaff.full_name,
        email: newStaff.email,
        role: inviteRole,
      });

      setActionSuccess(`User ${newStaff.full_name} (${inviteRole === 'admin' ? 'Admin' : 'Staff'}) added successfully. Verification link dispatched.`);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleToggleStatus = (staffId: string) => {
    setActionError('');
    setActionSuccess('');

    if (!isAdmin) {
      setActionError('Permission Denied: Only Administrator can modify account status.');
      return;
    }

    if (staffId === activeStaff.id) {
      setActionError('Security Policy: You cannot deactivate your own active session.');
      return;
    }

    const target = globalStore.staff.find((s) => s.id === staffId);
    if (!target) return;

    target.status = target.status === 'active' ? 'disabled' : 'active';
    globalStore.recordAudit('staff_status_toggled', 'staff_profiles', staffId, {
      name: target.full_name,
      status: target.status,
    });

    setActionSuccess(`Account for ${target.full_name} is now ${target.status.toUpperCase()}.`);
    setTick((t) => t + 1);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleSendResetLink = (email: string) => {
    setActionSuccess(`Password reset instruction link dispatched to ${email}.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Role Architecture Information Card */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs text-[#14213D] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#2563EB]">
          <ShieldCheck className="w-4 h-4" />
          <span>Two Operational Roles Policy (Admin & Staff)</span>
        </div>
        <p className="text-[#64748B]">
          In accordance with the Rishi Laboratory system architecture, all operations are managed under strictly two roles:
          <span className="font-bold text-[#14213D]"> ADMIN</span> (Full facility configuration, pricing, staff management, and clinical release) and 
          <span className="font-bold text-[#14213D]"> STAFF</span> (Patient registration, billing, sample tracking, and analyte result entry).
        </p>
      </div>

      {/* User Accounts List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Authenticated Laboratory Users ({globalStore.staff.length} Accounts)
            </h3>
          </div>
          {isAdmin && (
            <GlassButton variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite New User</span>
            </GlassButton>
          )}
        </div>

        <div className="divide-y divide-slate-200/40">
          {globalStore.staff.map((member) => {
            const isUserAdmin = member.roles.includes('admin');
            const isCurrent = member.id === activeStaff.id;

            return (
              <div
                key={member.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#14213D] text-white font-bold text-xs flex items-center justify-center">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#14213D]">
                          {member.full_name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] flex items-center gap-2">
                        <span>{member.email}</span>
                        {member.phone && <span>• {member.phone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 pl-10">
                    <GlassBadge variant={isUserAdmin ? 'blue' : 'mint'} size="sm">
                      {isUserAdmin ? 'ADMIN' : 'STAFF'}
                    </GlassBadge>
                    <GlassBadge variant={member.status === 'active' ? 'mint' : 'rose'} size="sm" dot>
                      {member.status.toUpperCase()}
                    </GlassBadge>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendResetLink(member.email)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200/50 inline-flex items-center gap-1"
                      title="Send password reset link"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Reset Password</span>
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                          member.status === 'active'
                            ? 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200/50'
                            : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/50'
                        }`}
                      >
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Invite User Modal */}
      <GlassModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Laboratory User"
        subtitle="Create authenticated access credentials for Rishi Laboratory team members"
        maxWidth="lg"
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <GlassInput
            label="Full Name"
            required
            placeholder="e.g. Ramesh Reddy"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <GlassInput
            label="Email Address"
            type="email"
            required
            placeholder="e.g. ramesh@rishilab.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <GlassInput
            label="Mobile / Phone Number"
            placeholder="e.g. 9848228971"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
          />

          <GlassSelect
            label="Operational Role"
            required
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'lab_staff')}
          >
            <option value="lab_staff">STAFF (Patient Registration, Billing, Specimen, Results)</option>
            <option value="admin">ADMIN (Full Laboratory Control, Pricing, Templates, Signatories)</option>
          </GlassSelect>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
            <GlassButton
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="md">
              Send Invitation & Create Account
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
