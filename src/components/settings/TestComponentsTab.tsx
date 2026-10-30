'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { LabComponent } from '@/lib/types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassModal,
  GlassBadge,
} from '@/components/ui/glass';
import {
  Plus,
  Search,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export function TestComponentsTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit Component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);

  // Form Fields matching CoreCare Add Components Screenshot
  const [compName, setCompName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [compCode, setCompCode] = useState('');
  const [unit, setUnit] = useState('');
  const [valueType, setValueType] = useState<LabComponent['value_type']>('numeric');
  const [controlType, setControlType] = useState<LabComponent['control_type']>('number_input');
  const [method, setMethod] = useState('');
  const [valueLookup, setValueLookup] = useState('');
  const [rangeDescription, setRangeDescription] = useState('');
  const [genRange, setGenRange] = useState('');
  const [maleRange, setMaleRange] = useState('');
  const [femaleRange, setFemaleRange] = useState('');
  const [childRange, setChildRange] = useState('');
  const [displaySequence, setDisplaySequence] = useState<number>(10);

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const openAddModal = () => {
    setEditingCompId(null);
    setCompName('');
    setDisplayName('');
    setCompCode('');
    setUnit('');
    setValueType('numeric');
    setControlType('number_input');
    setMethod('');
    setValueLookup('');
    setRangeDescription('');
    setGenRange('');
    setMaleRange('');
    setFemaleRange('');
    setChildRange('');
    setDisplaySequence(10);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp: LabComponent) => {
    setEditingCompId(comp.id);
    setCompName(comp.name);
    setDisplayName(comp.display_name || comp.name);
    setCompCode(comp.code);
    setUnit(comp.unit || '');
    setValueType(comp.value_type);
    setControlType(comp.control_type);
    setMethod(comp.method || '');
    setValueLookup(comp.value_lookup || '');
    setRangeDescription(comp.range_description || '');
    setGenRange(comp.gen_range || '');
    setMaleRange(comp.male_range || '');
    setFemaleRange(comp.female_range || '');
    setChildRange(comp.child_range || '');
    setDisplaySequence(comp.display_sequence || 10);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!compName.trim()) {
      setFormError('Component Name is required.');
      return;
    }

    const effectiveCode = compCode.trim() || compName.trim().substring(0, 6).toUpperCase();

    // Check code uniqueness
    const existing = globalStore.components.find(
      (c) => c.code.toLowerCase() === effectiveCode.toLowerCase() && c.id !== editingCompId
    );
    if (existing) {
      setFormError(`A component with code "${effectiveCode}" already exists.`);
      return;
    }

    try {
      const compData = {
        name: compName.trim(),
        display_name: displayName.trim() || compName.trim(),
        code: effectiveCode,
        unit: unit.trim(),
        value_type: valueType,
        control_type: controlType,
        method: method.trim(),
        value_lookup: valueLookup.trim(),
        range_description: rangeDescription.trim(),
        gen_range: genRange.trim(),
        male_range: maleRange.trim(),
        female_range: femaleRange.trim(),
        child_range: childRange.trim(),
        display_sequence: Number(displaySequence) || 10,
        is_active: true,
      };

      if (editingCompId) {
        globalStore.updateComponent(editingCompId, compData);
        setActionSuccess(`Component "${compData.name}" updated successfully.`);
      } else {
        globalStore.addComponent(compData);
        setActionSuccess(`Component "${compData.name}" added to library.`);
      }

      setIsModalOpen(false);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setFormError((err as Error).message);
    }
  };

  const handleToggleStatus = (compId: string) => {
    try {
      const updated = globalStore.toggleComponentStatus(compId);
      setActionSuccess(`Component "${updated.name}" is now ${updated.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Filter components
  const filteredComponents = globalStore.components.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.display_name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.unit && c.unit.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reusable components by name or code..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] placeholder-[#64748B] outline-none focus:border-[#3B82F6]"
          />
        </div>

        {isAdmin && (
          <GlassButton variant="primary" size="md" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>Add Component</span>
          </GlassButton>
        )}
      </div>

      {/* Components Table matching CoreCare screenshot */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Reusable Clinical Component Library ({filteredComponents.length} Components)
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Showing all available analytes & parameters</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14213D]">
            <thead className="bg-white/60 text-[#64748B] font-bold border-b border-slate-200/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">ComponentName</th>
                <th className="px-4 py-3">Display Name</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Range</th>
                <th className="px-4 py-3">Range Description</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">ControlType</th>
                <th className="px-4 py-3">ValueType</th>
                <th className="px-4 py-3">Value LookUp</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {filteredComponents.map((comp) => (
                <tr key={comp.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#14213D]">
                    {comp.name}
                  </td>
                  <td className="px-4 py-3 text-[#2563EB] font-medium">
                    {comp.display_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">
                    {comp.unit || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800 text-[11px]">
                    {comp.gen_range || (comp.male_range ? `M: ${comp.male_range}` : '—')}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-[11px] max-w-xs truncate">
                    {comp.range_description || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-[11px]">
                    {comp.method || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-[11px] capitalize">
                    {comp.control_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#2563EB]">
                    {comp.value_type}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-[11px] max-w-xs truncate">
                    {comp.value_lookup || '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(comp)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(comp.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                          comp.is_active
                            ? 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200/50'
                            : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/50'
                        }`}
                      >
                        {comp.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* CoreCare Style "Add Components" Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompId ? `Edit Component — ${compName}` : 'Add Component'}
        subtitle="Configure reusable component definition, value type, input control, and reference intervals"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveComponent} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <GlassInput
              label="Component Name"
              required
              placeholder="e.g. Hemoglobin"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
            />
            <GlassInput
              label="Display Name"
              placeholder="e.g. Hemoglobin (Hb)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <GlassInput
              label="Component Code"
              placeholder="e.g. HGB"
              value={compCode}
              onChange={(e) => setCompCode(e.target.value.toUpperCase())}
            />

            <GlassInput
              label="Unit"
              placeholder="e.g. g/dL, mg/dL, 10^3/uL"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />

            <GlassSelect
              label="Value Type"
              required
              value={valueType}
              onChange={(e) => setValueType(e.target.value as LabComponent['value_type'])}
            >
              <option value="numeric">numeric</option>
              <option value="text">text</option>
              <option value="positive_negative">positive/negative</option>
              <option value="dropdown">dropdown</option>
              <option value="calculated">calculated</option>
            </GlassSelect>

            <GlassSelect
              label="Control Type"
              required
              value={controlType}
              onChange={(e) => setControlType(e.target.value as LabComponent['control_type'])}
            >
              <option value="number_input">Number Input (TextBox)</option>
              <option value="text_input">Text Input (TextBox)</option>
              <option value="dropdown">Dropdown Selection</option>
              <option value="radio">Radio Selection</option>
            </GlassSelect>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <GlassInput
              label="Method"
              placeholder="e.g. Cyanmethemoglobin / Photometry"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
            <GlassInput
              label="Value LookUp (Options comma-separated)"
              placeholder="e.g. Negative, Positive or A+, B+, O+"
              value={valueLookup}
              onChange={(e) => setValueLookup(e.target.value)}
            />
          </div>

          {/* Reference Interval Row (CoreCare screenshot) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.60] border border-white/[0.80] space-y-3">
            <h4 className="text-xs font-bold text-[#14213D]">
              Clinical Reference Intervals & Demographics
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <GlassInput
                label="Gen. Range"
                placeholder="e.g. 13.0 - 17.0"
                value={genRange}
                onChange={(e) => setGenRange(e.target.value)}
              />
              <GlassInput
                label="Male Range"
                placeholder="e.g. 13.5 - 17.5"
                value={maleRange}
                onChange={(e) => setMaleRange(e.target.value)}
              />
              <GlassInput
                label="Female Range"
                placeholder="e.g. 12.0 - 15.5"
                value={femaleRange}
                onChange={(e) => setFemaleRange(e.target.value)}
              />
              <GlassInput
                label="Child Range"
                placeholder="e.g. 11.0 - 14.0"
                value={childRange}
                onChange={(e) => setChildRange(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#14213D]">
                Range Description & Reference Source
              </label>
              <textarea
                rows={2}
                value={rangeDescription}
                onChange={(e) => setRangeDescription(e.target.value)}
                placeholder="e.g. WHO reference interval for adult population..."
                className="w-full p-2.5 rounded-xl bg-white/[0.70] border border-slate-200/80 text-xs text-[#14213D] outline-none focus:border-[#3B82F6]"
              />
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
              {editingCompId ? 'Save Changes' : 'Add Component'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
