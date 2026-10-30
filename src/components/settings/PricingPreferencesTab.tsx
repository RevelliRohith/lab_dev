'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { LabCategory, SpecimenType } from '@/lib/types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  GlassBadge,
} from '@/components/ui/glass';
import {
  Tag,
  TestTube,
  Percent,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Save,
} from 'lucide-react';

export function PricingPreferencesTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);

  // Discount Preferences State
  const [maxDiscount, setMaxDiscount] = useState<number>(globalStore.lab.max_staff_discount_percentage || 15);
  const [alertPhone, setAlertPhone] = useState(globalStore.lab.critical_alert_phone || '9848228971');

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDept, setCatDept] = useState('');

  // Specimen Modal
  const [isSpecimenModalOpen, setIsSpecimenModalOpen] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [specName, setSpecName] = useState('');
  const [specCode, setSpecCode] = useState('');
  const [specContainer, setSpecContainer] = useState('');
  const [specColor, setSpecColor] = useState('#8B5CF6');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!isAdmin) {
      setActionError('Permission Denied: Only Administrator can alter billing policies.');
      return;
    }

    try {
      globalStore.lab.max_staff_discount_percentage = Number(maxDiscount);
      globalStore.lab.critical_alert_phone = alertPhone.trim();
      globalStore.recordAudit('pricing_preferences_updated', 'labs', globalStore.lab.id, {
        maxDiscount,
        alertPhone,
      });
      setActionSuccess('Pricing and notification policies updated successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!catName.trim() || !catCode.trim()) {
      setActionError('Category Name and Code are required.');
      return;
    }

    try {
      if (editingCatId) {
        globalStore.updateCategory(editingCatId, {
          name: catName.trim(),
          code: catCode.trim().toUpperCase(),
          department: catDept.trim(),
        });
        setActionSuccess(`Category "${catName}" updated.`);
      } else {
        globalStore.addCategory({
          name: catName.trim(),
          code: catCode.trim().toUpperCase(),
          department: catDept.trim() || catName.trim(),
          display_order: globalStore.categories.length + 1,
          is_active: true,
        });
        setActionSuccess(`Category "${catName}" added.`);
      }

      setIsCategoryModalOpen(false);
      setCatName('');
      setCatCode('');
      setCatDept('');
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleSaveSpecimen = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!specName.trim() || !specContainer.trim()) {
      setActionError('Specimen Name and Container Type are required.');
      return;
    }

    try {
      if (editingSpecId) {
        globalStore.updateSpecimenType(editingSpecId, {
          name: specName.trim(),
          code: specCode.trim().toUpperCase(),
          container: specContainer.trim(),
          color_code: specColor,
        });
        setActionSuccess(`Specimen "${specName}" updated.`);
      } else {
        globalStore.addSpecimenType({
          name: specName.trim(),
          code: specCode.trim() || specName.substring(0, 4).toUpperCase(),
          container: specContainer.trim(),
          color_code: specColor,
          is_active: true,
        });
        setActionSuccess(`Specimen "${specName}" added.`);
      }

      setIsSpecimenModalOpen(false);
      setSpecName('');
      setSpecCode('');
      setSpecContainer('');
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setActionError((err as Error).message);
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

      {/* 1. Global Pricing & Policy Limits */}
      <GlassCard className="p-6">
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="border-b border-slate-200/50 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#14213D]">
                Billing Rules & Operational Policy Limits
              </h3>
            </div>
            {isAdmin && (
              <GlassButton type="submit" variant="primary" size="sm">
                <Save className="w-3.5 h-3.5" />
                <span>Save Policies</span>
              </GlassButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Maximum Staff Walk-in Discount (%)"
              type="number"
              min="0"
              max="100"
              required
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              disabled={!isAdmin}
              helperText="Maximum discount Staff role can apply without explicit Admin authorization"
            />

            <GlassInput
              label="Critical Result Alert Phone"
              required
              value={alertPhone}
              onChange={(e) => setAlertPhone(e.target.value)}
              disabled={!isAdmin}
              helperText="Phone number alerted when panic/critical analyte levels are flagged"
            />
          </div>
        </form>
      </GlassCard>

      {/* 2. Laboratory Categories Management */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Laboratory Categories ({globalStore.categories.length})
            </h3>
          </div>
          {isAdmin && (
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingCatId(null);
                setCatName('');
                setCatCode('');
                setCatDept('');
                setIsCategoryModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </GlassButton>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {globalStore.categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-xl bg-white/[0.60] border border-white/[0.80] flex items-center justify-between hover:bg-white/80 transition-all shadow-xs"
            >
              <div>
                <div className="font-bold text-xs text-[#14213D] flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="font-mono text-[10px] text-[#2563EB] bg-blue-50 px-1.5 py-0.2 rounded">
                    {cat.code}
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{cat.department || 'General'}</div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCatId(cat.id);
                    setCatName(cat.name);
                    setCatCode(cat.code);
                    setCatDept(cat.department || '');
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 3. Specimen Types Management */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Specimen Types & Containers ({globalStore.specimenTypes.length})
            </h3>
          </div>
          {isAdmin && (
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingSpecId(null);
                setSpecName('');
                setSpecCode('');
                setSpecContainer('');
                setIsSpecimenModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Specimen</span>
            </GlassButton>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {globalStore.specimenTypes.map((spec) => (
            <div
              key={spec.id}
              className="p-3.5 rounded-xl bg-white/[0.60] border border-white/[0.80] flex items-center justify-between hover:bg-white/80 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: spec.color_code || '#8B5CF6' }}
                />
                <div>
                  <div className="font-bold text-xs text-[#14213D]">{spec.name}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{spec.container}</div>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSpecId(spec.id);
                    setSpecName(spec.name);
                    setSpecCode(spec.code);
                    setSpecContainer(spec.container);
                    setSpecColor(spec.color_code || '#8B5CF6');
                    setIsSpecimenModalOpen(true);
                  }}
                  className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add / Edit Category Modal */}
      <GlassModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCatId ? 'Edit Category' : 'Add Laboratory Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <GlassInput
            label="Category Name"
            required
            placeholder="e.g. Hematology"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <GlassInput
            label="Category Code"
            required
            placeholder="e.g. HEM"
            value={catCode}
            onChange={(e) => setCatCode(e.target.value.toUpperCase())}
          />
          <GlassInput
            label="Department"
            placeholder="e.g. Pathology"
            value={catDept}
            onChange={(e) => setCatDept(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Category
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Add / Edit Specimen Modal */}
      <GlassModal
        isOpen={isSpecimenModalOpen}
        onClose={() => setIsSpecimenModalOpen(false)}
        title={editingSpecId ? 'Edit Specimen Type' : 'Add Specimen Type'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSpecimen} className="space-y-4">
          <GlassInput
            label="Specimen Name"
            required
            placeholder="e.g. EDTA Blood"
            value={specName}
            onChange={(e) => setSpecName(e.target.value)}
          />
          <GlassInput
            label="Specimen Code"
            placeholder="e.g. EDTA"
            value={specCode}
            onChange={(e) => setSpecCode(e.target.value.toUpperCase())}
          />
          <GlassInput
            label="Collection Container Type"
            required
            placeholder="e.g. Lavender Top (K2-EDTA)"
            value={specContainer}
            onChange={(e) => setSpecContainer(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">Tube Color Indicator</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={specColor}
                onChange={(e) => setSpecColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
              />
              <span className="font-mono text-xs text-[#64748B]">{specColor}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsSpecimenModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Specimen
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
