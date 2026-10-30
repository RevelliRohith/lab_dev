'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { TestDefinition, TestComponentMapping } from '@/lib/types';
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
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Layers,
  ArrowUpDown,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export function TestCatalogueTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Add / Edit Lab Test
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Form Fields matching CoreCare Add Lab Test Screenshot
  const [testName, setTestName] = useState('');
  const [testCode, setTestCode] = useState('');
  const [reportingName, setReportingName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('Hematology');
  const [serviceDept, setServiceDept] = useState('Pathology');
  const [selectedSpecimens, setSelectedSpecimens] = useState<string[]>(['EDTA Blood']);
  const [price, setPrice] = useState<number>(300);
  const [turnaroundHours, setTurnaroundHours] = useState<number>(6);
  const [reportTemplateId, setReportTemplateId] = useState('tmpl-001');
  const [runNoType, setRunNoType] = useState('normal');
  const [displaySequence, setDisplaySequence] = useState<number>(1000);
  const [isSmsApplicable, setIsSmsApplicable] = useState(false);
  const [isLisApplicable, setIsLisApplicable] = useState(true);
  const [isValidForReporting, setIsValidForReporting] = useState(true);
  const [taxApplicable, setTaxApplicable] = useState(false);
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [hasNegativeResults, setHasNegativeResults] = useState(false);
  const [interpretation, setInterpretation] = useState('');

  // Component Mappings for this test
  const [componentMappings, setComponentMappings] = useState<TestComponentMapping[]>([]);
  const [selectedComponentToAdd, setSelectedComponentToAdd] = useState('');

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const openAddModal = () => {
    setEditingTestId(null);
    setTestName('');
    setTestCode('');
    setReportingName('');
    setCategoryName('Hematology');
    setServiceDept('Pathology');
    setSelectedSpecimens(['EDTA Blood']);
    setPrice(300);
    setTurnaroundHours(6);
    setReportTemplateId('tmpl-001');
    setRunNoType('normal');
    setDisplaySequence(1000);
    setIsSmsApplicable(false);
    setIsLisApplicable(true);
    setIsValidForReporting(true);
    setTaxApplicable(false);
    setIsOutsourced(false);
    setHasNegativeResults(false);
    setInterpretation('');
    setComponentMappings([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (test: TestDefinition) => {
    setEditingTestId(test.id);
    setTestName(test.name);
    setTestCode(test.code);
    setReportingName(test.reporting_name || test.name);
    setCategoryName(test.category_name || test.department);
    setServiceDept(test.service_department || 'Pathology');
    setSelectedSpecimens(test.specimens || [test.specimen_type]);
    setPrice(test.price);
    setTurnaroundHours(test.turnaround_hours);
    setReportTemplateId(test.report_template_id || 'tmpl-001');
    setRunNoType(test.run_no_type || 'normal');
    setDisplaySequence(test.display_sequence || 1000);
    setIsSmsApplicable(test.is_sms_applicable ?? false);
    setIsLisApplicable(test.is_lis_applicable ?? true);
    setIsValidForReporting(test.is_valid_for_reporting ?? true);
    setTaxApplicable(test.tax_applicable ?? false);
    setIsOutsourced(test.is_outsourced ?? false);
    setHasNegativeResults(test.has_negative_results ?? false);
    setInterpretation(test.interpretation || '');

    // Map existing parameters / mappings
    if (test.component_mappings && test.component_mappings.length > 0) {
      setComponentMappings([...test.component_mappings]);
    } else if (test.parameters && test.parameters.length > 0) {
      const generated = test.parameters.map((p, idx) => ({
        id: crypto.randomUUID(),
        test_definition_id: test.id,
        component_id: p.id,
        component_name: p.name,
        display_name: p.name,
        unit: p.unit || '',
        value_type: p.result_type,
        range: '',
        display_sequence: (idx + 1) * 10,
        indent: 0,
        sheet: true,
        is_active: p.is_active,
      }));
      setComponentMappings(generated);
    } else {
      setComponentMappings([]);
    }

    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddComponentToMapping = () => {
    if (!selectedComponentToAdd) return;
    const comp = globalStore.components.find((c) => c.id === selectedComponentToAdd);
    if (!comp) return;

    // Check if already mapped
    if (componentMappings.some((m) => m.component_id === comp.id)) {
      setFormError(`Component "${comp.name}" is already mapped to this test.`);
      return;
    }

    const newMapping: TestComponentMapping = {
      id: crypto.randomUUID(),
      test_definition_id: editingTestId || '',
      component_id: comp.id,
      component_name: comp.name,
      display_name: comp.display_name || comp.name,
      unit: comp.unit || '',
      value_type: comp.value_type,
      range: comp.gen_range || comp.range_description || '',
      display_sequence: (componentMappings.length + 1) * 10,
      indent: 0,
      group_val: '',
      sheet: true,
      is_active: true,
    };

    setComponentMappings([...componentMappings, newMapping]);
    setSelectedComponentToAdd('');
    setFormError('');
  };

  const handleRemoveMapping = (mappingId: string) => {
    setComponentMappings(componentMappings.filter((m) => m.id !== mappingId));
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!testName.trim() || !testCode.trim()) {
      setFormError('Test Name and Unique Test Code are required.');
      return;
    }

    // Check uniqueness of code if adding new or renaming
    const existingCode = globalStore.tests.find(
      (t) => t.code.toLowerCase() === testCode.trim().toLowerCase() && t.id !== editingTestId
    );
    if (existingCode) {
      setFormError(`A lab test with code "${testCode}" already exists.`);
      return;
    }

    try {
      const template = globalStore.reportTemplates.find((t) => t.id === reportTemplateId);
      const testData = {
        name: testName.trim(),
        code: testCode.trim().toUpperCase(),
        reporting_name: reportingName.trim() || testName.trim(),
        department: categoryName,
        category_name: categoryName,
        service_department: serviceDept,
        price: Number(price) || 0,
        turnaround_hours: Number(turnaroundHours) || 24,
        specimen_type: selectedSpecimens.join(', ') || 'Whole Blood',
        specimens: selectedSpecimens,
        container_type: 'Standard Container',
        fasting_required: false,
        is_panel: componentMappings.length > 1,
        is_active: true,
        report_template_id: reportTemplateId,
        report_template_name: template?.name || 'Default Template',
        run_no_type: runNoType,
        display_sequence: Number(displaySequence) || 1000,
        is_sms_applicable: isSmsApplicable,
        is_lis_applicable: isLisApplicable,
        is_valid_for_reporting: isValidForReporting,
        tax_applicable: taxApplicable,
        is_outsourced: isOutsourced,
        has_negative_results: hasNegativeResults,
        interpretation: interpretation.trim(),
        component_mappings: componentMappings,
        parameters: componentMappings.map((m, idx) => ({
          id: m.component_id,
          test_definition_id: editingTestId || '',
          code: m.component_name.substring(0, 6).toUpperCase(),
          name: m.component_name,
          result_type: (m.value_type === 'numeric' ? 'numeric' : 'text') as 'numeric' | 'qualitative' | 'text',
          unit: m.unit,
          display_order: idx + 1,
          is_active: m.is_active,
        })),
      };

      if (editingTestId) {
        globalStore.updateTest(editingTestId, testData);
        setActionSuccess(`Test "${testData.name}" updated successfully.`);
      } else {
        globalStore.addTest(testData);
        setActionSuccess(`Test "${testData.name}" added to catalogue successfully.`);
      }

      setIsModalOpen(false);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setFormError((err as Error).message);
    }
  };

  const handleToggleStatus = (testId: string) => {
    try {
      const updated = globalStore.toggleTestStatus(testId);
      setActionSuccess(`Test ${updated.name} is now ${updated.is_active ? 'ACTIVE' : 'DEACTIVATED'}`);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Filter tests
  const filteredTests = globalStore.tests.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      categoryFilter === 'ALL' ||
      (t.category_name && t.category_name.toLowerCase() === categoryFilter.toLowerCase()) ||
      t.department.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      {/* Action and feedback notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Controls: Search, Category Filter, and Add Test Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by name or code..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] placeholder-[#64748B] outline-none focus:border-[#3B82F6]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {globalStore.categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <GlassButton variant="primary" size="md" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>Add Lab Test</span>
          </GlassButton>
        )}
      </div>

      {/* Test Catalogue Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Database Test Catalogue ({filteredTests.length} Tests)
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Configured laboratory offerings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14213D]">
            <thead className="bg-white/60 text-[#64748B] font-bold border-b border-slate-200/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Lab Test Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Specimen</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Turnaround</th>
                <th className="px-4 py-3">Components</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#2563EB]">
                    {test.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#14213D]">{test.name}</div>
                    {test.reporting_name && test.reporting_name !== test.name && (
                      <div className="text-[10px] text-[#64748B]">
                        Rep: {test.reporting_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#14213D]">
                    {test.category_name || test.department}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-[11px]">
                    {test.specimen_type}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                    ₹ {Number(test.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">
                    {test.turnaround_hours}h
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200/50 text-[10px]">
                      {test.component_mappings?.length || test.parameters?.length || 1} param
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <GlassBadge variant={test.is_active ? 'mint' : 'slate'} size="sm" dot>
                      {test.is_active ? 'Active' : 'Inactive'}
                    </GlassBadge>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(test)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(test.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                          test.is_active
                            ? 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200/50'
                            : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/50'
                        }`}
                      >
                        {test.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* CoreCare Style "Add Lab Test" Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTestId ? `Edit Lab Test — ${testCode}` : 'Add Lab Test'}
        subtitle="Configure clinical test parameters, turnaround time, specimen requirements, and mapped components"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveTest} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form grid matching CoreCare Add Lab Test screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <GlassInput
              label="Lab Test Name"
              required
              placeholder="e.g. Complete Blood Count"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
            <GlassInput
              label="Lab Test Code"
              required
              placeholder="e.g. CBC-01"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            />
            <GlassInput
              label="Reporting Name"
              placeholder="e.g. Complete Blood Count with Differential"
              value={reportingName}
              onChange={(e) => setReportingName(e.target.value)}
            />

            <GlassSelect
              label="Lab Category"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            >
              {globalStore.categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </GlassSelect>

            <GlassInput
              label="Service Department"
              value={serviceDept}
              onChange={(e) => setServiceDept(e.target.value)}
            />

            <GlassSelect
              label="Report Template Name"
              required
              value={reportTemplateId}
              onChange={(e) => setReportTemplateId(e.target.value)}
            >
              {globalStore.reportTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.short_name})
                </option>
              ))}
            </GlassSelect>

            <GlassInput
              label="Price (₹ INR)"
              type="number"
              min="0"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />

            <GlassInput
              label="Turnaround Time (Hours)"
              type="number"
              min="1"
              value={turnaroundHours}
              onChange={(e) => setTurnaroundHours(Number(e.target.value))}
            />

            <GlassInput
              label="Display Sequence"
              type="number"
              value={displaySequence}
              onChange={(e) => setDisplaySequence(Number(e.target.value))}
            />
          </div>

          {/* Specimen selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">
              Select Specimen(s) <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white/[0.60] border border-white/[0.80]">
              {globalStore.specimenTypes.map((spec) => {
                const isSelected = selectedSpecimens.includes(spec.name);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedSpecimens.length > 1) {
                          setSelectedSpecimens(selectedSpecimens.filter((s) => s !== spec.name));
                        }
                      } else {
                        setSelectedSpecimens([...selectedSpecimens, spec.name]);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white/80 text-[#64748B] hover:bg-white hover:text-[#14213D] border border-slate-200/60'
                    }`}
                  >
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checkboxes matching CoreCare screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/[0.50] border border-white/[0.70] text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={isSmsApplicable}
                onChange={(e) => setIsSmsApplicable(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Is SMS Applicable?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={isLisApplicable}
                onChange={(e) => setIsLisApplicable(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Is LIS Applicable?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={isValidForReporting}
                onChange={(e) => setIsValidForReporting(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Is Valid for Reporting</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={taxApplicable}
                onChange={(e) => setTaxApplicable(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Tax Applicable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={isOutsourced}
                onChange={(e) => setIsOutsourced(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Is Outsourced Test?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14213D]">
              <input
                type="checkbox"
                checked={hasNegativeResults}
                onChange={(e) => setHasNegativeResults(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-blue-500"
              />
              <span>Has Negative Results</span>
            </label>
          </div>

          {/* Clinical Interpretation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">
              Clinical Interpretation & Reporting Guidelines
            </label>
            <textarea
              rows={2}
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="e.g. Fasting plasma glucose levels > 126 mg/dL indicate diabetes mellitus..."
              className="w-full p-2.5 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] outline-none focus:border-[#3B82F6]"
            />
          </div>

          {/* Component Mapping Section (CoreCare screenshot) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#14213D] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2563EB]" />
                  <span>Select Components For this Lab Test</span>
                </h4>
                <p className="text-[11px] text-[#64748B]">
                  Link reusable clinical parameters that are measured and reported for this test
                </p>
              </div>

              {/* Add component picker */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedComponentToAdd}
                  onChange={(e) => setSelectedComponentToAdd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.80] border border-slate-200/80 text-xs text-[#14213D] outline-none"
                >
                  <option value="">-- Choose Component to Map --</option>
                  {globalStore.components
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - {c.unit || 'no unit'}
                      </option>
                    ))}
                </select>
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddComponentToMapping}
                  disabled={!selectedComponentToAdd}
                >
                  <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Map</span>
                </GlassButton>
              </div>
            </div>

            {/* Mapped Components Table */}
            {componentMappings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white/40">
                <table className="w-full text-left text-xs text-[#14213D]">
                  <thead className="bg-slate-100/70 text-[#64748B] text-[11px] font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2">ComponentName</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Value Type</th>
                      <th className="px-3 py-2">Range</th>
                      <th className="px-3 py-2">Disp. Seq</th>
                      <th className="px-3 py-2 text-center">Sheet</th>
                      <th className="px-3 py-2 text-center">Active</th>
                      <th className="px-3 py-2 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40">
                    {componentMappings.map((map, idx) => (
                      <tr key={map.id} className="hover:bg-white/60">
                        <td className="px-3 py-2 font-bold text-[#14213D]">
                          {map.component_name}
                        </td>
                        <td className="px-3 py-2 text-[#64748B] font-mono">
                          {map.unit || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px]">
                          {map.value_type}
                        </td>
                        <td className="px-3 py-2 text-[#64748B] text-[11px]">
                          {map.range || 'Configured in intervals'}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={map.display_sequence}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = [...componentMappings];
                              updated[idx].display_sequence = val;
                              setComponentMappings(updated);
                            }}
                            className="w-16 px-1.5 py-0.5 rounded border border-slate-200 text-xs font-mono"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={map.sheet}
                            onChange={(e) => {
                              const updated = [...componentMappings];
                              updated[idx].sheet = e.target.checked;
                              setComponentMappings(updated);
                            }}
                            className="rounded text-[#2563EB]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={map.is_active}
                            onChange={(e) => {
                              const updated = [...componentMappings];
                              updated[idx].is_active = e.target.checked;
                              setComponentMappings(updated);
                            }}
                            className="rounded text-[#2563EB]"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMapping(map.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Remove mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-[#64748B]">
                No components mapped yet. Select components from the dropdown above to add them to this test.
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
            <GlassButton
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="md">
              {editingTestId ? 'Save Changes' : 'Add Test to Catalogue'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
