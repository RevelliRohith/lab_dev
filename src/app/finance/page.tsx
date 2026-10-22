'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import { generateCsv } from '@/lib/export';
import {
  IndianRupee,
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
  Banknote,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Check,
  Building,
} from 'lucide-react';

export default function FinancePage() {
  const [, setTick] = useState(0);

  // Active filter tab
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'part_paid' | 'unpaid' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Quick Pay Modal State
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card'>('upi');

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

  // Handle Quick Pay
  const handleQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');
      globalStore.recordPayment({
        invoiceId: payInvoiceId,
        amount: payAmount,
        paymentMethod: payMethod === 'upi' ? 'bank_transfer' : payMethod,
        referenceNote: `Settled via ${payMethod.toUpperCase()}`,
        idempotencyKey: `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setSuccessMessage(`Payment of ₹${payAmount.toFixed(2)} recorded successfully via ${payMethod.toUpperCase()}.`);
      setPayInvoiceId(null);
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  // Handle Refund (Admin Only)
  const handleRecordRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!refundInvoiceId) throw new Error('Invoice is required');
      if (refundAmount <= 0) throw new Error('Refund amount must be greater than zero');
      if (!refundReason || refundReason.trim().length < 5) {
        throw new Error('A documented reason is mandatory for processing patient refunds');
      }

      const ref = globalStore.recordRefund({
        invoiceId: refundInvoiceId,
        amount: Number(refundAmount),
        reason: refundReason,
        idempotencyKey: `REFUND-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setSuccessMessage(`Refund of ₹${ref.amount.toFixed(2)} recorded successfully.`);
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

      setSuccessMessage(`Expense of ₹${exp.amount.toFixed(2)} for ${exp.vendor} (${exp.category}) recorded.`);
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
    link.setAttribute('download', `rishi-lab-finance-reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Finance Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You are signed in as <strong>{activeStaff.full_name} ({activeStaff.roles.join(', ')})</strong>.
          Aggregate laboratory finance, refund authorization, expense recording, and CSV accounting exports are strictly reserved for the <strong>Admin</strong> role.
        </p>
        <p className="text-xs text-slate-500">
          Switch to <strong>Padma (Administrator)</strong> in the top-bar profile switcher to inspect and manage laboratory accounts.
        </p>
      </div>
    );
  }

  // Filter invoices
  const filteredInvoices = globalStore.invoices.filter((inv) => {
    const order = globalStore.orders.find((o) => o.id === inv.order_id);
    const patientName = order?.patient?.full_name.toLowerCase() || '';
    const invNum = inv.invoice_number.toLowerCase();
    const matchesSearch = !searchQuery || patientName.includes(searchQuery.toLowerCase()) || invNum.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance & Daily Reconciliation</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Admin Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collections, dues, refunds, lab reagent operational expenses, and permission-controlled CSV ledger exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Record Lab Expense</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Protected CSV</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* Aggregate Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Gross diagnostic fees billed</span>
        </div>

        {/* Collections */}
        <div className="p-5 bg-white border border-emerald-200/90 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Collections (Cash/UPI)</span>
            <div className="p-1.5 bg-emerald-100/80 text-emerald-700 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-800 tracking-tight">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            Refunds: -₹{totalRefunded.toFixed(2)}
          </span>
        </div>

        {/* Outstanding Dues */}
        <div className="p-5 bg-white border border-amber-200/90 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Outstanding Dues</span>
            <div className="p-1.5 bg-amber-100/80 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-800 tracking-tight">
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block font-medium">
            Pending patient receivables
          </span>
        </div>

        {/* Net Operating Income */}
        <div className="p-5 bg-white border border-indigo-200/90 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Net Cash Flow</span>
            <div className="p-1.5 bg-indigo-100/80 text-indigo-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-900 tracking-tight">
            ₹{netOperatingIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-indigo-600 mt-1 block font-medium">
            Expenses: ₹{totalExpenses.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Main Section: Invoice Reconciliation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>Billing Ledger & Reconciliation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time settlement, partial collections, and refund tracking</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient or invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {(['all', 'paid', 'part_paid', 'unpaid', 'refunded'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'all' && `All Invoices (${globalStore.invoices.length})`}
              {filter === 'paid' && 'Paid in Full'}
              {filter === 'part_paid' && 'Partially Paid'}
              {filter === 'unpaid' && 'Unpaid Dues'}
              {filter === 'refunded' && 'Refunded'}
            </button>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold">Patient Name</th>
                <th className="px-4 py-3 font-semibold">Subtotal</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Net Total</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Balance Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const order = globalStore.orders.find((o) => o.id === inv.order_id);
                const netPaid = inv.amount_paid - inv.amount_refunded;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order?.patient?.full_name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 font-mono">₹{inv.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-amber-700 font-mono">
                      {inv.discount_amount > 0 ? `-₹${inv.discount_amount.toFixed(2)} (${inv.discount_percentage}%)` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">₹{inv.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold font-mono">₹{inv.amount_paid.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">
                      {inv.balance_due > 0 ? (
                        <span className="font-bold text-rose-700">₹{inv.balance_due.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.status === 'part_paid'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : inv.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {/* Settle Due Button */}
                      {inv.balance_due > 0 && (
                        <button
                          onClick={() => {
                            setPayInvoiceId(inv.id);
                            setPayAmount(inv.balance_due);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                        >
                          <IndianRupee className="w-3 h-3" />
                          <span>Collect ₹{inv.balance_due.toFixed(0)}</span>
                        </button>
                      )}

                      {/* Issue Refund Button */}
                      {netPaid > 0 && (
                        <button
                          onClick={() => {
                            setRefundInvoiceId(inv.id);
                            setRefundAmount(netPaid);
                            setShowRefundModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                        >
                          Refund
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

      {/* Operational Expenses Log */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Laboratory Operational Expenses</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Reagents, test tubes, consumables & analyzer maintenance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Expense Category</th>
                <th className="px-4 py-3 font-semibold">Vendor / Supplier</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Receipt Ref</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalStore.expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono">{exp.expense_date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{exp.vendor}</td>
                  <td className="px-4 py-3 text-slate-700">{exp.description}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{exp.receipt_reference || '—'}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 font-mono">
                    ₹{exp.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Quick Pay Settlement */}
      {payInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Collect Balance Due</span>
              </h2>
              <button onClick={() => setPayInvoiceId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('upi')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      payMethod === 'upi'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                    <span className="text-xs">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      payMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      payMethod === 'card'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs">Card</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayInvoiceId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Controlled Refund */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h2 className="text-base font-bold text-rose-800">Issue Controlled Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Patient refunds are recorded on the billing ledger, preserve initial payment history, and auto-adjust net balances.
            </p>

            <form onSubmit={handleRecordRefund} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Justification Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Duplicate payment adjustment / test cancelled prior to blood collection"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all"
                >
                  Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Lab Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="reagents">Reagents (Analyzer reagents & controls)</option>
                  <option value="consumables">Consumables (Vacutainers, needles, gloves)</option>
                  <option value="utilities">Utilities (Electricity, Internet)</option>
                  <option value="maintenance">Analyzer Maintenance & Servicing</option>
                  <option value="other">Other Operational Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Erba Diagnostics Hyderabad / Sri Sai Surgicals"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC Diluent pack & Lyse reagent"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice / Receipt Bill #</label>
                <input
                  type="text"
                  placeholder="e.g. BILL-44910"
                  value={expRef}
                  onChange={(e) => setExpRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all"
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
