'use client';

import React, { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';
import { Patient, OrderPriority } from '@/lib/types';
import {
  Search,
  UserPlus,
  Receipt,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  Phone,
  User,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function PatientsAndBillingPage() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'patients' | 'billing'>('patients');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    sex: 'male' as 'male' | 'female' | 'other',
    isAgeEstimated: false,
    dateOfBirth: '',
    estimatedAgeYears: 30,
    phone: '',
    email: '',
    address: 'Choutuppal',
    emergencyContactName: '',
    emergencyContactPhone: '',
    clinicalNotes: '',
  });
  const [regWarnings, setRegWarnings] = useState<string[]>([]);
  const [regError, setRegError] = useState('');

  // Order Creation State
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [orderPhysician, setOrderPhysician] = useState('');
  const [orderIndication, setOrderIndication] = useState('');
  const [orderPriority, setOrderPriority] = useState<OrderPriority>('routine');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderDiscountReason, setOrderDiscountReason] = useState('');
  const [orderError, setOrderError] = useState('');

  // Payment Recording State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'check'>('cash');
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleStaffChange = () => setTick((t) => t + 1);
    window.addEventListener('staff-changed', handleStaffChange);
    return () => window.removeEventListener('staff-changed', handleStaffChange);
  }, []);

  const activeStaff = globalStore.getActiveStaff();
  const lab = globalStore.lab;
  const currency = lab.currency_code;

  // Filtered patients
  const filteredPatients = globalStore.patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_number.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  // Handle Patient Registration
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegWarnings([]);

    try {
      if (!regForm.fullName || regForm.fullName.trim().length < 2) {
        throw new Error('Patient name must have at least 2 characters');
      }
      if (!regForm.phone || regForm.phone.trim().length < 6) {
        throw new Error('Valid phone number is required');
      }
      if (!regForm.isAgeEstimated && !regForm.dateOfBirth) {
        throw new Error('Date of birth is required if age is not estimated');
      }

      const result = globalStore.registerPatient({
        fullName: regForm.fullName,
        sex: regForm.sex,
        dateOfBirth: regForm.isAgeEstimated ? undefined : regForm.dateOfBirth,
        estimatedAgeYears: regForm.isAgeEstimated ? Number(regForm.estimatedAgeYears) : undefined,
        isAgeEstimated: regForm.isAgeEstimated,
        phone: regForm.phone,
        email: regForm.email,
        address: regForm.address,
        emergencyContactName: regForm.emergencyContactName,
        emergencyContactPhone: regForm.emergencyContactPhone,
        clinicalNotes: regForm.clinicalNotes,
      });

      if (result.duplicateWarnings.length > 0) {
        setRegWarnings(result.duplicateWarnings);
      } else {
        setShowRegisterModal(false);
      }
      setSelectedPatient(result.patient);
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setRegError((err as Error).message);
    }
  };

  // Handle Order Creation
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    try {
      if (!selectedPatient) throw new Error('Patient is required');
      if (selectedTestIds.length === 0) throw new Error('Select at least one test from catalogue');

      globalStore.createOrder({
        patientId: selectedPatient.id,
        testIds: selectedTestIds,
        orderingPhysician: orderPhysician,
        clinicalIndication: orderIndication,
        priority: orderPriority,
        discountPercentage: Number(orderDiscount),
        discountReason: orderDiscountReason,
      });

      setShowOrderModal(false);
      setSelectedTestIds([]);
      setOrderPhysician('');
      setOrderIndication('');
      setOrderDiscount(0);
      setOrderDiscountReason('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setOrderError((err as Error).message);
    }
  };

  // Handle Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setReceiptSuccess(null);

    try {
      if (!selectedInvoiceId) throw new Error('Invoice not selected');
      if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');

      const payment = globalStore.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNote: payNote,
        idempotencyKey: `MANUAL-PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setReceiptSuccess(`Payment of ₹ ${payment.amount.toFixed(2)} recorded! Receipt #: ${payment.payment_number}`);
      setPayAmount(0);
      setPayNote('');
      setTick((t) => t + 1);
    } catch (err: unknown) {
      setPayError((err as Error).message);
    }
  };

  // Calculate order preview totals
  const orderSubtotal = globalStore.tests
    .filter((t) => selectedTestIds.includes(t.id))
    .reduce((acc, t) => acc + t.price, 0);
  const orderDiscountAmount = Math.round(((orderSubtotal * (Number(orderDiscount) || 0)) / 100) * 100) / 100;
  const orderTotal = Math.max(0, orderSubtotal - orderDiscountAmount);

  const getTubeBadge = (container: string) => {
    if (container.toLowerCase().includes('lavender')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">🟣 Lavender EDTA</span>;
    }
    if (container.toLowerCase().includes('gold') || container.toLowerCase().includes('sst')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🟡 Gold SST</span>;
    }
    if (container.toLowerCase().includes('gray')) {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">⚪ Gray Fluoride</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">🧪 {container}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patients & Billing Desk</h1>
          <p className="text-sm text-slate-600 mt-1">
            Search patient records, prevent duplicate registrations, order diagnostic tests, and record payments.
          </p>
        </div>
        <button
          onClick={() => {
            setRegWarnings([]);
            setRegError('');
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-sm transition-all focus:ring-4 focus:ring-teal-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Segmented Controls / Tabs */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl max-w-md border border-slate-200/80">
        <button
          onClick={() => setActiveTab('patients')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'patients'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Patients Directory ({globalStore.patients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'billing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoices & Payments ({globalStore.invoices.length})</span>
        </button>
      </div>

      {/* TAB 1: Patients Directory */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          {/* Patient Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by patient name, mobile number (e.g. 9848228971), or ID (e.g. PAT-2026-0001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-2xl shadow-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Patients List Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Matching Patients ({filteredPatients.length})
              </span>
              <span className="text-xs text-slate-400">Search-first registration enforced</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Patient ID</th>
                    <th className="px-4 py-3">Full Name & Demographics</th>
                    <th className="px-4 py-3">Phone & Location</th>
                    <th className="px-4 py-3">Order History</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => {
                    const patientOrders = globalStore.orders.filter((o) => o.patient_id === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{p.patient_number}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{p.full_name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.sex.toUpperCase()} • {p.date_of_birth ? `DOB: ${p.date_of_birth}` : `Age: ~${p.estimated_age_years} yrs (est.)`}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-teal-600" />
                            <span>{p.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.address || 'Choutuppal'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {patientOrders.length} test order(s)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowOrderModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Order Tests</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Billing & Payment Ledger</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Source of truth for all collections</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Billed (₹)</th>
                  <th className="px-4 py-3">Paid (₹)</th>
                  <th className="px-4 py-3">Balance (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalStore.invoices.map((inv) => {
                  const order = globalStore.orders.find((o) => o.id === inv.order_id);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">{order?.order_number}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{order?.patient?.full_name}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        ₹ {inv.total_amount.toFixed(2)}
                        {inv.discount_amount > 0 && (
                          <span className="text-[10px] text-amber-700 block">(-₹ {inv.discount_amount.toFixed(2)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">₹ {inv.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">₹ {inv.balance_due.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'part_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {inv.balance_due > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceId(inv.id);
                              setPayAmount(inv.balance_due);
                              setReceiptSuccess(null);
                              setShowPaymentModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect Payment</span>
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
      )}

      {/* MODAL 1: Register New Patient */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Patient Registration Desk</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Duplicate Warnings Detected (Check before registering):</span>
                </div>
                {regWarnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Anitha Reddy"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sex *</label>
                  <select
                    value={regForm.sex}
                    onChange={(e) => setRegForm({ ...regForm, sex: e.target.value as 'male' | 'female' | 'other' })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9848228971"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* DOB vs Estimated Age */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Age Identification</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={regForm.isAgeEstimated}
                      onChange={(e) => setRegForm({ ...regForm, isAgeEstimated: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>DOB unknown (Specify age)</span>
                  </label>
                </div>

                {regForm.isAgeEstimated ? (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Estimated Age (Years) *</label>
                    <input
                      type="number"
                      min="0"
                      max="125"
                      value={regForm.estimatedAgeYears}
                      onChange={(e) => setRegForm({ ...regForm, estimatedAgeYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Date of Birth *</label>
                    <input
                      type="date"
                      value={regForm.dateOfBirth}
                      onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Town</label>
                <input
                  type="text"
                  placeholder="e.g. Choutuppal, Telangana"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-sm"
                >
                  Save & Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Order */}
      {showOrderModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Order Diagnostic Tests</h2>
                <p className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-800">{selectedPatient.full_name}</strong> ({selectedPatient.patient_number})
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {orderError}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Test Selection with Tube badges */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tests from Catalogue *</label>
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {globalStore.tests.map((t) => {
                    const isChecked = selectedTestIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs ${
                          isChecked ? 'bg-teal-50/80 border border-teal-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTestIds([...selectedTestIds, t.id]);
                              } else {
                                setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id));
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <div>
                            <span className="font-bold text-slate-900">{t.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {getTubeBadge(t.container_type)}
                              <span className="text-[10px] text-slate-500 font-mono">({t.code})</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹ {t.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Order Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as OrderPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ordering Physician</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rao / Self"
                    value={orderPhysician}
                    onChange={(e) => setOrderPhysician(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Permitted Discount */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Staff Permitted Discount (%)</label>
                  <span className="text-[11px] text-teal-700 font-semibold">
                    Limit: {activeStaff.roles.includes('admin') ? '100% (Admin)' : `${lab.max_staff_discount_percentage}% (Staff)`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    max={activeStaff.roles.includes('admin') ? 100 : lab.max_staff_discount_percentage}
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Discount reason (optional)"
                    value={orderDiscountReason}
                    onChange={(e) => setOrderDiscountReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Subtotal: ₹ {orderSubtotal.toFixed(2)}</span>
                  {orderDiscountAmount > 0 && (
                    <span className="text-xs text-amber-700 font-bold block">
                      Discount: -₹ {orderDiscountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Total Billed:</span>
                  <p className="text-lg font-black text-slate-900">₹ {orderTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedTestIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-sm disabled:opacity-50"
                >
                  Confirm Order & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Payment */}
      {showPaymentModal && selectedInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Collect Patient Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {payError}
              </div>
            )}

            {receiptSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{receiptSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as 'cash' | 'card' | 'bank_transfer' | 'check')}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
                >
                  <option value="cash">💵 Cash Payment</option>
                  <option value="bank_transfer">📱 UPI / QR Code / Bank Transfer</option>
                  <option value="card">💳 Credit / Debit Card (POS)</option>
                  <option value="check">📄 Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / GPay / Card last 4"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-sm"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
