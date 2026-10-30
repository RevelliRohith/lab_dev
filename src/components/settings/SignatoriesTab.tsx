'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { AuthorizedSignatory } from '@/lib/types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  GlassBadge,
} from '@/components/ui/glass';
import {
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Edit,
  Sparkles,
} from 'lucide-react';

export function SignatoriesTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);

  // Default Signatories Selection matching CoreCare Screenshot
  const [selectedNormal, setSelectedNormal] = useState<string[]>(
    globalStore.signatories.filter((s) => s.is_default_normal).map((s) => s.id)
  );
  const [selectedHistoCyto, setSelectedHistoCyto] = useState<string[]>(
    globalStore.signatories.filter((s) => s.is_default_histo_cyto).map((s) => s.id)
  );

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSigId, setEditingSigId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regAuthority, setRegAuthority] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('/images/signature-dr-rishika.png');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Hematology', 'Biochemistry']);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const openAddModal = () => {
    setEditingSigId(null);
    setFullName('');
    setDesignation('Consultant Pathologist');
    setQualifications('MBBS, MD (Pathology)');
    setRegNumber('');
    setRegAuthority('Telangana State Medical Council (TSMC)');
    setSignatureUrl('/images/signature-dr-rishika.png');
    setSelectedCategories(['Hematology', 'Biochemistry', 'Clinical Pathology']);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setActionError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sig: AuthorizedSignatory) => {
    setEditingSigId(sig.id);
    setFullName(sig.full_name);
    setDesignation(sig.designation);
    setQualifications(sig.qualifications);
    setRegNumber(sig.registration_number);
    setRegAuthority(sig.registration_authority);
    setSignatureUrl(sig.signature_image_url || '');
    setSelectedCategories(sig.authorized_categories || []);
    setEffectiveDate(sig.effective_date);
    setActionError('');
    setIsModalOpen(true);
  };

  const handleUpdateDefaultSignatories = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!isAdmin) {
      setActionError('Permission Denied: Only Administrator can update default signatories.');
      return;
    }

    try {
      globalStore.updateDefaultSignatories(selectedNormal, selectedHistoCyto);
      setActionSuccess('Default signatories updated successfully.');
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleSaveSignatory = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!fullName.trim() || !regNumber.trim()) {
      setActionError('Full Name and Medical Registration Number are mandatory.');
      return;
    }

    try {
      const data = {
        full_name: fullName.trim(),
        designation: designation.trim(),
        qualifications: qualifications.trim(),
        registration_number: regNumber.trim(),
        registration_authority: regAuthority.trim(),
        signature_image_url: signatureUrl.trim(),
        authorized_categories: selectedCategories,
        effective_date: effectiveDate,
        is_active: true,
        is_default_normal: selectedNormal.includes(editingSigId || ''),
        is_default_histo_cyto: selectedHistoCyto.includes(editingSigId || ''),
      };

      if (editingSigId) {
        globalStore.updateSignatory(editingSigId, data);
        setActionSuccess(`Signatory profile "${data.full_name}" updated.`);
      } else {
        globalStore.addSignatory(data);
        setActionSuccess(`Signatory profile "${data.full_name}" created.`);
      }

      setIsModalOpen(false);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleToggleStatus = (sigId: string) => {
    try {
      const updated = globalStore.toggleSignatoryStatus(sigId);
      setActionSuccess(`Signatory "${updated.full_name}" is now ${updated.is_active ? 'ACTIVE' : 'DEACTIVATED'}`);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
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

      {/* 1. CoreCare "Default Signatories" Configuration Box */}
      <GlassCard className="p-6">
        <form onSubmit={handleUpdateDefaultSignatories} className="space-y-6">
          <div className="border-b border-slate-200/50 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#14213D]">
                Default Signatories Configuration
              </h3>
              <p className="text-xs text-[#64748B]">
                Select default credentialed signatories automatically assigned to routine and specialized reports
              </p>
            </div>
            {isAdmin && (
              <GlassButton variant="primary" size="sm" type="button" onClick={openAddModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Signatory Profile</span>
              </GlassButton>
            )}
          </div>

          {/* Default Signatories for Normal Tests (CoreCare screenshot) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#14213D]">
              Default Signatories for Normal Tests:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {globalStore.signatories.map((sig) => {
                const isChecked = selectedNormal.includes(sig.id);
                return (
                  <label
                    key={sig.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-white/60 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isAdmin || !sig.is_active}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNormal([...selectedNormal, sig.id]);
                        } else {
                          setSelectedNormal(selectedNormal.filter((id) => id !== sig.id));
                        }
                      }}
                      className="mt-0.5 rounded text-[#2563EB]"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#14213D]">{sig.full_name}</div>
                      <div className="text-[11px] text-[#64748B]">{sig.designation}</div>
                      <div className="text-[10px] font-mono text-[#2563EB]">{sig.registration_number}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Default Histo/Cyto Signatories (CoreCare screenshot) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/50">
            <h4 className="text-xs font-bold text-[#14213D]">
              Default Histo/Cyto Signatories:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {globalStore.signatories.map((sig) => {
                const isChecked = selectedHistoCyto.includes(sig.id);
                return (
                  <label
                    key={sig.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-white/60 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isAdmin || !sig.is_active}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHistoCyto([...selectedHistoCyto, sig.id]);
                        } else {
                          setSelectedHistoCyto(selectedHistoCyto.filter((id) => id !== sig.id));
                        }
                      }}
                      className="mt-0.5 rounded text-[#2563EB]"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#14213D]">{sig.full_name}</div>
                      <div className="text-[11px] text-[#64748B]">{sig.designation}</div>
                      <div className="text-[10px] font-mono text-[#2563EB]">{sig.registration_number}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Exact button from CoreCare screenshot */}
          {isAdmin && (
            <div className="pt-2">
              <GlassButton type="submit" variant="success" size="md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Update Default Signatories</span>
              </GlassButton>
            </div>
          )}
        </form>
      </GlassCard>

      {/* 2. Signatory Profiles Detailed List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Authorized Clinical Signatories & Verified Credentials
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Professional regulatory compliance</span>
        </div>

        <div className="divide-y divide-slate-200/40">
          {globalStore.signatories.map((sig) => (
            <div
              key={sig.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-[#14213D]">{sig.full_name}</h4>
                  <GlassBadge variant={sig.is_active ? 'mint' : 'slate'} size="sm" dot>
                    {sig.is_active ? 'Active' : 'Inactive'}
                  </GlassBadge>
                  {sig.is_default_normal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/60">
                      Default Normal
                    </span>
                  )}
                  {sig.is_default_histo_cyto && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200/60">
                      Default Histo/Cyto
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B]">
                  <span className="font-semibold text-slate-800">{sig.designation}</span> • {sig.qualifications}
                </p>
                <p className="text-[11px] font-mono text-[#2563EB]">
                  Reg #: {sig.registration_number} ({sig.registration_authority})
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {sig.authorized_categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(sig)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200/50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(sig.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border ${
                      sig.is_active
                        ? 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200/50'
                        : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/50'
                    }`}
                  >
                    {sig.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add / Edit Signatory Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSigId ? 'Edit Authorized Signatory' : 'Add Authorized Signatory'}
        subtitle="Clinical credentials and registration details for diagnostic report sign-off"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveSignatory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Full Name & Title"
              required
              placeholder="e.g. Dr. Rishika"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <GlassInput
              label="Designation"
              required
              placeholder="e.g. Consultant Pathologist"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
            <GlassInput
              label="Medical / Clinical Qualifications"
              required
              placeholder="e.g. MBBS, MD (Pathology)"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
            />
            <GlassInput
              label="Professional Registration Number"
              required
              placeholder="e.g. TSMC-74892"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Registration Authority"
              required
              placeholder="e.g. Telangana State Medical Council (TSMC)"
              value={regAuthority}
              onChange={(e) => setRegAuthority(e.target.value)}
            />
            <GlassInput
              label="Effective Date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">
              Authorized Test Categories
            </label>
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white/[0.60] border border-white/[0.80]">
              {globalStore.categories.map((c) => {
                const isSelected = selectedCategories.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter((cat) => cat !== c.name));
                      } else {
                        setSelectedCategories([...selectedCategories, c.name]);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white/80 text-[#64748B] border border-slate-200/60'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
            <GlassButton
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="md">
              {editingSigId ? 'Save Changes' : 'Add Signatory'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
