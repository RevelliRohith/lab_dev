'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import { generateCsv } from '@/lib/export';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ShieldAlert,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';

export default function FinancePage() {
  const [, setTick] = useState(0);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInvoiceId, setRefundInvoiceId] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<'reagents' | 'consumables' | 'utilities' | 'maintenance' | 'other'>('reagents');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expVendor, setExpVendor] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expRef, setExpRef] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const isAdmin = activeStaff.roles.includes('admin');
  const currency = globalStore.lab.currency_code;

  // Aggregates
  const totalInvoiced = globalStore.invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = globalStore.invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const totalRefunded = globalStore.invoices.reduce((acc, i) => acc + i.amount_refunded, 0);
  const totalOutstanding = globalStore.invoices.reduce((acc, i) => acc + i.balance_due, 0);
  const totalExpenses = globalStore.expenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingIncome = totalCollected - totalRefunded - totalExpenses;

  // Handle Refund (Admin Only)
  const handleRecordRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!refundInvoiceId) throw new Error('Invoice is required');
      if (refundAmount <= 0) throw new Error('Refund amount must be greater than zero');
      if (!refundReason || refundReason.trim().length < 5) {
        throw new Error('Documented reason is mandatory for refunds');
      }

      const ref = globalStore.recordRefund({
        invoiceId: refundInvoiceId,
        amount: Number(refundAmount),
        reason: refundReason,
        idempotencyKey: `REFUND-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setSuccessMessage(`Refund of ${currency} ${ref.amount.toFixed(2)} recorded successfully.`);
      setShowRefundModal(false);
      setRefundAmount(0);
      setRefundReason('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Handle Expense (Admin Only)
  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (expAmount <= 0) throw new Error('Expense amount must be positive');
      if (!expVendor || !expDesc) throw new Error('Vendor and Description are required');

      const exp = globalStore.recordExpense({
        category: expCategory,
        amount: Number(expAmount),
        vendor: expVendor,
        description: expDesc,
        receiptReference: expRef,
        expenseDate: new Date().toISOString().split('T')[0],
      });

      setSuccessMessage(`Expense of ${currency} ${exp.amount.toFixed(2)} (${exp.vendor}) recorded.`);
      setShowExpenseModal(false);
      setExpAmount(0);
      setExpVendor('');
      setExpDesc('');
      setExpRef('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Permission-controlled and CSV Injection-Safe Export
  const handleExportCsv = () => {
    if (!isAdmin) {
      alert('Only Admin can export financial records.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Order Number',
      'Patient Name',
      'Subtotal',
      'Discount Amount',
      'Total Amount',
      'Amount Paid',
      'Amount Refunded',
      'Balance Due',
      'Status',
      'Date',
    ];

    const rows = globalStore.invoices.map((inv) => {
      const order = globalStore.orders.find((o) => o.id === inv.order_id);
      return [
        inv.invoice_number,
        order?.order_number || '',
        order?.patient?.full_name || '',
        inv.subtotal,
        inv.discount_amount,
        inv.total_amount,
        inv.amount_paid,
        inv.amount_refunded,
        inv.balance_due,
        inv.status,
        inv.created_at.split('T')[0],
      ];
    });

    const csvContent = generateCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Finance Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You are signed in as <strong>{activeStaff.full_name} ({activeStaff.roles.join(', ')})</strong>.
          Aggregate laboratory finance, refund authorization, expense recording, and CSV accounting exports are strictly reserved for the <strong>Admin</strong> role.
        </p>
        <p className="text-xs text-slate-500">
          Switch to <strong>Sarah Jenkins (Administrator)</strong> in the top-bar profile switcher to inspect and test the finance module.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Reconciliation</h1>
          <p className="text-sm text-slate-600 mt-1">
            Collections, refunds, lab reagent expenses, daily reconciliation, and safe CSV exports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Protected CSV</span>
          </button>
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

      {/* Aggregate Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {currency} {totalInvoiced.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Gross billed tests</span>
        </div>

        <div className="p-5 bg-white border border-emerald-200 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Collections</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-800">
            {currency} {totalCollected.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            Refunds: -{currency} {totalRefunded.toFixed(2)}
          </span>
        </div>

        <div className="p-5 bg-white border border-amber-200 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Outstanding Dues</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-800">
            {currency} {totalOutstanding.toFixed(2)}
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">Receivables from patients</span>
        </div>

        <div className="p-5 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Net Operating Income</span>
          <div className="mt-2 text-2xl font-extrabold text-indigo-900">
            {currency} {netOperatingIncome.toFixed(2)}
          </div>
          <span className="text-[11px] text-indigo-600 mt-1 block">
            Expenses: {currency} {totalExpenses.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Reconciliation Table: Invoices, Payments, Refunds */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Invoice Reconciliation & Refunds</h2>
          </div>
          <span className="text-xs text-slate-500">Source of truth: billing ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Refunded</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalStore.invoices.map((inv) => {
                const order = globalStore.orders.find((o) => o.id === inv.order_id);
                const netPaid = inv.amount_paid - inv.amount_refunded;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{order?.patient?.full_name}</td>
                    <td className="px-4 py-3">{currency} {inv.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-amber-600">
                      {inv.discount_amount > 0 ? `-${currency} ${inv.discount_amount.toFixed(2)} (${inv.discount_percentage}%)` : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{currency} {inv.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{currency} {inv.amount_paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-rose-700 font-medium">
                      {inv.amount_refunded > 0 ? `-${currency} ${inv.amount_refunded.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{currency} {inv.balance_due.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'part_paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {netPaid > 0 && (
                        <button
                          onClick={() => {
                            setRefundInvoiceId(inv.id);
                            setRefundAmount(netPaid);
                            setShowRefundModal(true);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
                        >
                          Issue Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Laboratory Operational Expenses</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Reagents, consumables & maintenance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Receipt Ref</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalStore.expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-500">{exp.expense_date}</td>
                  <td className="px-4 py-3 capitalize font-semibold text-slate-800">{exp.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                  <td className="px-4 py-3">{exp.description}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{exp.receipt_reference || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {currency} {exp.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Issue Refund (Admin Only) */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-rose-700">Issue Controlled Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Refunds are strictly audited, retain original payment records, and adjust the balance due.
            </p>

            <form onSubmit={handleRecordRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Test cancelled prior to analysis / duplicate payment adjustment"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                >
                  Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Record Operational Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="reagents">Reagents</option>
                  <option value="consumables">Consumables / Tubes</option>
                  <option value="utilities">Utilities</option>
                  <option value="maintenance">Analyzer Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bio-Chem Supplies LLC"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC Calibrator pack"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Reference</label>
                <input
                  type="text"
                  placeholder="e.g. INV-99014"
                  value={expRef}
                  onChange={(e) => setExpRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
