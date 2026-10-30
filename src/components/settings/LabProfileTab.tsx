'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/glass';
import { Building2, Save, Sparkles, CheckCircle2, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

export function LabProfileTab({ isAdmin }: { isAdmin: boolean }) {
  const [form, setForm] = useState({
    name: globalStore.lab.name,
    code: globalStore.lab.code,
    address: globalStore.lab.address,
    city: globalStore.lab.city || 'Choutuppal',
    state: globalStore.lab.state || 'Telangana',
    pincode: globalStore.lab.pincode || '508252',
    phone: globalStore.lab.phone,
    email: globalStore.lab.email,
    logo_url: globalStore.lab.logo_url || '/images/flask-logo.png',
    working_hours: globalStore.lab.working_hours || '7:00 AM - 9:00 PM (Mon-Sat)',
    clinical_director: globalStore.lab.clinical_director,
    lab_license_number: globalStore.lab.lab_license_number,
    report_header_text: globalStore.lab.report_header_text,
    report_footer_text: globalStore.lab.report_footer_text,
    accreditation_details: globalStore.lab.accreditation_details || 'Telangana Clinical Establishment Reg #RL-TS-9848228',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    if (!isAdmin) {
      setErrorMsg('Permission Denied: Only Administrator (Padma) can modify laboratory profile settings.');
      return;
    }

    try {
      globalStore.lab = {
        ...globalStore.lab,
        ...form,
      };
      globalStore.recordAudit('lab_profile_updated', 'labs', globalStore.lab.id, {
        name: form.name,
        director: form.clinical_director,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Laboratory profile and report branding settings saved successfully.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Facility Details */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-200/50">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14213D]">
                Laboratory Profile & General Settings
              </h3>
              <p className="text-xs text-[#64748B]">
                Official clinic identity and contact information for patient communication and invoicing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <GlassInput
              label="Laboratory Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Laboratory Code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Clinical Director / In-Charge"
              required
              value={form.clinical_director}
              onChange={(e) => setForm({ ...form, clinical_director: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Mobile / Phone Number"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Official Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Registration / License Number"
              required
              value={form.lab_license_number}
              onChange={(e) => setForm({ ...form, lab_license_number: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Address / Street"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="City"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="State & Pincode"
              required
              value={`${form.state} - ${form.pincode}`}
              onChange={(e) => {
                const parts = e.target.value.split('-');
                setForm({
                  ...form,
                  state: parts[0]?.trim() || 'Telangana',
                  pincode: parts[1]?.trim() || '508252',
                });
              }}
              disabled={!isAdmin}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <GlassInput
              label="Working Hours"
              value={form.working_hours}
              onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
              disabled={!isAdmin}
            />
            <GlassInput
              label="Accreditation & Approvals"
              value={form.accreditation_details}
              onChange={(e) => setForm({ ...form, accreditation_details: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
        </GlassCard>

        {/* Report Branding & Live A4 Preview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-sm font-bold text-[#14213D]">
                  Official Diagnostic Report Header & Footer
                </h4>
              </div>

              <div className="space-y-4">
                <GlassInput
                  label="Report Header Title"
                  value={form.report_header_text}
                  onChange={(e) => setForm({ ...form, report_header_text: e.target.value })}
                  disabled={!isAdmin}
                  helperText="Appears on every printed A4 diagnostic test report"
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#14213D]">
                    Report Footer & Medical Disclaimer
                  </label>
                  <textarea
                    rows={3}
                    value={form.report_footer_text}
                    onChange={(e) => setForm({ ...form, report_footer_text: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] rounded-xl text-xs sm:text-sm text-[#14213D] p-3 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all"
                  />
                  <p className="text-[11px] text-[#64748B]">
                    Included at the bottom of official diagnostic releases above authorized signatories
                  </p>
                </div>
              </div>
            </GlassCard>

            {isAdmin && (
              <div className="flex justify-end">
                <GlassButton type="submit" variant="primary" size="md">
                  <Save className="w-4 h-4" />
                  <span>Save Laboratory Profile</span>
                </GlassButton>
              </div>
            )}
          </div>

          {/* Live Report Branding Preview (Clean white A4 mini-card) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-200 text-left font-sans space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] text-[#64748B]">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#2563EB]">
                  <Eye className="w-3.5 h-3.5" />
                  Live Printed Report Header Preview
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">Standard A4</span>
              </div>

              <div className="text-center py-2 border-b-2 border-blue-600">
                <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {form.name}
                </h3>
                <p className="text-xs font-semibold text-blue-600 tracking-wide mt-0.5">
                  {form.report_header_text}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {form.address}, {form.city}, {form.state} - {form.pincode} • Phone: {form.phone} • Email: {form.email}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Reg #: {form.lab_license_number} • Director: {form.clinical_director}
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-[11px] grid grid-cols-2 gap-2 text-slate-700">
                <div><span className="font-bold">Patient Name:</span> Sampath Kumar</div>
                <div><span className="font-bold">Patient ID:</span> RL-00125</div>
                <div><span className="font-bold">Age / Gender:</span> 38 Y / Male</div>
                <div><span className="font-bold">Sample Date:</span> 24-Oct-2026 09:15 AM</div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-200">
                <p className="italic">{form.report_footer_text}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
