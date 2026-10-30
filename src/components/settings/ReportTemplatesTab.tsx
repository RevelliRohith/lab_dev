'use client';

import React, { useState } from 'react';
import { globalStore } from '@/lib/store';
import { ReportTemplate } from '@/lib/types';
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
  FileText,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
} from 'lucide-react';

export function ReportTemplatesTab({ isAdmin }: { isAdmin: boolean }) {
  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form Fields matching CoreCare Report Template Screenshot
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [templateType, setTemplateType] = useState('normal');
  const [description, setDescription] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [displaySequence, setDisplaySequence] = useState<number>(100);

  // Column settings
  const [colSettings, setColSettings] = useState({
    name: true,
    result: true,
    range: true,
    method: true,
    unit: true,
    remarks: true,
  });

  // Live A4 Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const openAddModal = () => {
    setEditingTemplateId(null);
    setName('');
    setShortName('');
    setTemplateType('normal');
    setDescription('');
    setHeaderText('Rishi Laboratory — Diagnostic & Pathology Services');
    setFooterText('Clinical correlation advised. This report is verified electronically.');
    setIsDefault(false);
    setDisplaySequence(100);
    setColSettings({
      name: true,
      result: true,
      range: true,
      method: true,
      unit: true,
      remarks: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tmpl: ReportTemplate) => {
    setEditingTemplateId(tmpl.id);
    setName(tmpl.name);
    setShortName(tmpl.short_name);
    setTemplateType(tmpl.template_type);
    setDescription(tmpl.description || '');
    setHeaderText(tmpl.header_text || '');
    setFooterText(tmpl.footer_text || '');
    setIsDefault(tmpl.is_default);
    setDisplaySequence(tmpl.display_sequence || 100);
    setColSettings(tmpl.column_settings || {
      name: true,
      result: true,
      range: true,
      method: true,
      unit: true,
      remarks: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSelectAllColumns = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setColSettings({
      name: val,
      result: val,
      range: val,
      method: val,
      unit: val,
      remarks: val,
    });
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !shortName.trim()) {
      setFormError('Report Template Name and Short Name are required.');
      return;
    }

    try {
      const templateData = {
        name: name.trim(),
        short_name: shortName.trim(),
        template_type: templateType,
        description: description.trim(),
        column_settings: colSettings,
        header_text: headerText.trim(),
        footer_text: footerText.trim(),
        is_default: isDefault,
        display_sequence: Number(displaySequence) || 100,
        is_active: true,
      };

      if (editingTemplateId) {
        globalStore.updateReportTemplate(editingTemplateId, templateData);
        setActionSuccess(`Template "${templateData.name}" updated successfully.`);
      } else {
        globalStore.addReportTemplate(templateData);
        setActionSuccess(`Template "${templateData.name}" created successfully.`);
      }

      setIsModalOpen(false);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      setFormError((err as Error).message);
    }
  };

  const handleToggleStatus = (templateId: string) => {
    try {
      const updated = globalStore.toggleReportTemplateStatus(templateId);
      setActionSuccess(`Template "${updated.name}" is now ${updated.is_active ? 'ACTIVE' : 'DEACTIVATED'}`);
      setTick((t) => t + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const filteredTemplates = globalStore.reportTemplates.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.short_name.toLowerCase().includes(q) ||
      t.template_type.toLowerCase().includes(q)
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
            placeholder="Search report templates..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] placeholder-[#64748B] outline-none focus:border-[#3B82F6]"
          />
        </div>

        {isAdmin && (
          <GlassButton variant="primary" size="md" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>+Add New Lab Template</span>
          </GlassButton>
        )}
      </div>

      {/* Templates Table matching CoreCare screenshot */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200/50 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#14213D]">
              Report Template Management ({filteredTemplates.length} Templates)
            </h3>
          </div>
          <span className="text-[11px] text-[#64748B]">Showing configurable A4 report structures</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14213D]">
            <thead className="bg-white/60 text-[#64748B] font-bold border-b border-slate-200/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Report Template ShortName</th>
                <th className="px-4 py-3">Template Name</th>
                <th className="px-4 py-3">Template Type</th>
                <th className="px-4 py-3">Display Sequence</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {filteredTemplates.map((tmpl) => (
                <tr key={tmpl.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#2563EB]">
                    {tmpl.short_name}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#14213D]">
                    {tmpl.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">
                    {tmpl.template_type}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">
                    {tmpl.display_sequence}
                  </td>
                  <td className="px-4 py-3">
                    {tmpl.is_default ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB] border border-blue-200/50">
                        DEFAULT
                      </span>
                    ) : (
                      <span className="text-[#64748B] text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <GlassBadge variant={tmpl.is_active ? 'mint' : 'slate'} size="sm" dot>
                      {tmpl.is_active ? 'Active' : 'Inactive'}
                    </GlassBadge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(tmpl)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/50 inline-flex items-center gap-1"
                      title="Live A4 Preview"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(tmpl)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tmpl.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                            tmpl.is_active
                              ? 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200/50'
                              : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/50'
                          }`}
                        >
                          {tmpl.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* CoreCare Style "Add Lab Report Template" Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplateId ? `Edit Lab Report Template` : 'Add Lab Report Template'}
        subtitle="Configure template name, printable columns, header text, and clinical footer"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Report Template Name"
              required
              placeholder="e.g. Hematology Report Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <GlassInput
              label="Report Template Short Name"
              required
              placeholder="e.g. Hematology"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassSelect
              label="Report Template Type"
              required
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
            >
              <option value="normal">normal</option>
              <option value="culture">culture</option>
              <option value="fluid">fluid</option>
              <option value="urine">urine</option>
            </GlassSelect>

            <GlassInput
              label="Display Sequence"
              type="number"
              value={displaySequence}
              onChange={(e) => setDisplaySequence(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard multi-parameter template with IFCC reference intervals"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] outline-none"
            />
          </div>

          {/* Column Settings Checkboxes matching CoreCare screenshot */}
          <div className="p-3.5 rounded-2xl bg-white/[0.60] border border-white/[0.80] space-y-2">
            <label className="block text-xs font-bold text-[#14213D]">
              Column Settings:
            </label>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#2563EB]">
                <input
                  type="checkbox"
                  onChange={handleSelectAllColumns}
                  checked={Object.values(colSettings).every(Boolean)}
                  className="rounded text-[#2563EB]"
                />
                <span>Select All</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.name}
                  onChange={(e) => setColSettings({ ...colSettings, name: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Name</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.result}
                  onChange={(e) => setColSettings({ ...colSettings, result: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Result</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.range}
                  onChange={(e) => setColSettings({ ...colSettings, range: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Range</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.method}
                  onChange={(e) => setColSettings({ ...colSettings, method: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Method</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.unit}
                  onChange={(e) => setColSettings({ ...colSettings, unit: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Unit</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#14213D]">
                <input
                  type="checkbox"
                  checked={colSettings.remarks}
                  onChange={(e) => setColSettings({ ...colSettings, remarks: e.target.checked })}
                  className="rounded text-[#2563EB]"
                />
                <span>Remarks</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <GlassInput
              label="Header Text"
              placeholder="e.g. Department of Clinical Pathology & Hematology"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#14213D]">Footer Text</label>
            <textarea
              rows={2}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. Kindly correlate clinically. Tests performed on calibrated automated systems."
              className="w-full p-2.5 rounded-xl bg-white/[0.68] backdrop-blur-[12px] border border-white/[0.80] text-xs text-[#14213D] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-[#14213D]">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded text-[#2563EB]"
              />
              <span>Set as Default Report Template</span>
            </label>
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
              {editingTemplateId ? 'Save Changes' : 'Add Template'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Live A4 Document Preview Modal (Clean White Printable A4 Document) */}
      {previewTemplate && (
        <GlassModal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Live A4 Report Preview — ${previewTemplate.name}`}
          subtitle="Exact printable white A4 document output (no glass effects applied to clinical report)"
          maxWidth="4xl"
        >
          <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl flex justify-center">
            {/* White A4 Sheet Container */}
            <div className="bg-white text-slate-900 shadow-xl rounded-sm p-8 max-w-2xl w-full border border-slate-300 font-sans text-xs space-y-4">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-3 text-center">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {globalStore.lab.name}
                </h2>
                <p className="text-xs font-bold text-blue-700 mt-0.5">
                  {previewTemplate.header_text || globalStore.lab.report_header_text}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {globalStore.lab.address}, Choutuppal, Telangana • Phone: {globalStore.lab.phone} • Email: {globalStore.lab.email}
                </p>
                <p className="text-[10px] text-slate-500">
                  Reg #: {globalStore.lab.lab_license_number} • Director: {globalStore.lab.clinical_director}
                </p>
              </div>

              {/* Patient Meta Box */}
              <div className="border border-slate-300 rounded p-3 bg-slate-50/50 grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="font-bold">Patient Name:</span> Sampath Kumar</div>
                <div><span className="font-bold">Patient ID / MRN:</span> RL-00125</div>
                <div><span className="font-bold">Age / Gender:</span> 38 Y / Male</div>
                <div><span className="font-bold">Order Number:</span> ORD-2026-0001</div>
                <div><span className="font-bold">Sample Collected:</span> 24-Oct-2026 09:15 AM</div>
                <div><span className="font-bold">Report Released:</span> 24-Oct-2026 11:30 AM</div>
                <div><span className="font-bold">Ref Doctor:</span> Self Walk-in</div>
                <div><span className="font-bold">Template Type:</span> {previewTemplate.template_type}</div>
              </div>

              {/* Section Header */}
              <div className="bg-slate-800 text-white font-bold px-3 py-1 text-xs uppercase tracking-wider">
                Complete Blood Count (CBC)
              </div>

              {/* Dynamic Parameter Columns based on template settings */}
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="border-b-2 border-slate-400 font-bold text-slate-800">
                  <tr>
                    {previewTemplate.column_settings.name && <th className="py-1.5 px-2">Investigation</th>}
                    {previewTemplate.column_settings.result && <th className="py-1.5 px-2">Observed Result</th>}
                    {previewTemplate.column_settings.unit && <th className="py-1.5 px-2">Unit</th>}
                    {previewTemplate.column_settings.range && <th className="py-1.5 px-2">Biological Ref. Interval</th>}
                    {previewTemplate.column_settings.method && <th className="py-1.5 px-2">Method</th>}
                    {previewTemplate.column_settings.remarks && <th className="py-1.5 px-2">Remarks</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    {previewTemplate.column_settings.name && <td className="py-1.5 px-2 font-bold">Hemoglobin (Hb)</td>}
                    {previewTemplate.column_settings.result && <td className="py-1.5 px-2 font-bold font-mono">14.8</td>}
                    {previewTemplate.column_settings.unit && <td className="py-1.5 px-2 font-mono text-slate-600">g/dL</td>}
                    {previewTemplate.column_settings.range && <td className="py-1.5 px-2 text-slate-600">13.0 - 17.0</td>}
                    {previewTemplate.column_settings.method && <td className="py-1.5 px-2 text-slate-500">Photometry</td>}
                    {previewTemplate.column_settings.remarks && <td className="py-1.5 px-2 text-emerald-600 font-semibold">Normal</td>}
                  </tr>
                  <tr>
                    {previewTemplate.column_settings.name && <td className="py-1.5 px-2 font-bold">Total Leucocyte Count (WBC)</td>}
                    {previewTemplate.column_settings.result && <td className="py-1.5 px-2 font-bold font-mono">7.2</td>}
                    {previewTemplate.column_settings.unit && <td className="py-1.5 px-2 font-mono text-slate-600">10^3/uL</td>}
                    {previewTemplate.column_settings.range && <td className="py-1.5 px-2 text-slate-600">4.5 - 11.0</td>}
                    {previewTemplate.column_settings.method && <td className="py-1.5 px-2 text-slate-500">Impedance</td>}
                    {previewTemplate.column_settings.remarks && <td className="py-1.5 px-2 text-emerald-600 font-semibold">Normal</td>}
                  </tr>
                  <tr>
                    {previewTemplate.column_settings.name && <td className="py-1.5 px-2 font-bold">Platelet Count</td>}
                    {previewTemplate.column_settings.result && <td className="py-1.5 px-2 font-bold font-mono">245</td>}
                    {previewTemplate.column_settings.unit && <td className="py-1.5 px-2 font-mono text-slate-600">10^3/uL</td>}
                    {previewTemplate.column_settings.range && <td className="py-1.5 px-2 text-slate-600">150 - 450</td>}
                    {previewTemplate.column_settings.method && <td className="py-1.5 px-2 text-slate-500">Impedance</td>}
                    {previewTemplate.column_settings.remarks && <td className="py-1.5 px-2 text-emerald-600 font-semibold">Normal</td>}
                  </tr>
                </tbody>
              </table>

              {/* End of report divider */}
              <div className="text-center text-[10px] text-slate-400 tracking-widest pt-4">
                *** END OF DIAGNOSTIC REPORT ***
              </div>

              {/* Signatory Box */}
              <div className="pt-6 border-t border-slate-300 flex items-end justify-between">
                <div className="text-[10px] text-slate-500 max-w-xs">
                  <p className="font-bold text-slate-700">Clinical Laboratory Notes:</p>
                  <p>{previewTemplate.footer_text || 'Kindly correlate with clinical findings.'}</p>
                </div>
                <div className="text-right">
                  <div className="h-10 flex items-center justify-end">
                    <span className="font-serif italic text-blue-800 text-sm font-bold">
                      Dr. Rishika, MD
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">Dr. Rishika</p>
                  <p className="text-[10px] text-slate-600">MBBS, MD (Pathology)</p>
                  <p className="text-[10px] text-slate-500">Reg # TSMC-74892</p>
                </div>
              </div>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
