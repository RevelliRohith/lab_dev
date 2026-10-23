'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { globalStore } from '@/lib/store';
import { Patient, OrderPriority } from '@/lib/types';
import {
  Search,
  UserPlus,
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  User,
  PlusCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

function PatientsContent() {
  const searchParams = useSearchParams();
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

  // Check for selected patient in URL query params
  useEffect(() => {
    const selId = searchParams.get('selected');
    if (selId) {
      const match = globalStore.patients.find((p) => p.id === selId);
      if (match) {
        setSelectedPatient(match);
        setSearchQuery(match.patient_number);
      }
    }
    const tabParam = searchParams.get('tab');
    if (tabParam === 'billing') {
      setActiveTab('billing');
    }
  }, [searchParams]);

  const activeStaff = globalStore.getActiveStaff();
  const lab = globalStore.lab;

  // Filtered patients
  const filteredPatients = globalStore.patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_number.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q))
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
        throw new Error('Valid mobile phone number is required');
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

      setReceiptSuccess(
        `Payment of ₹ ${payment.amount.toFixed(2)} recorded! Receipt #: ${payment.payment_number}`
      );
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
  const orderDiscountAmount =
    Math.round(((orderSubtotal * (Number(orderDiscount) || 0)) / 100) * 100) / 100;
  const orderTotal = Math.max(0, orderSubtotal - orderDiscountAmount);

  const getTubeBadge = (container: string) => {
    if (container.toLowerCase().includes('lavender')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100/80 text-purple-800 border border-purple-200/50">
          🟣 Lavender EDTA
        </span>
      );
    }
    if (container.toLowerCase().includes('gold') || container.toLowerCase().includes('sst')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/50">
          🟡 Gold SST
        </span>
      );
    }
    if (container.toLowerCase().includes('gray')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300/50">
          ⚪ Gray Fluoride
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-[#2563EB] border border-blue-200/50">
        🧪 {container}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold glass-pill text-[#2563EB] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Registration & Financial Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12234A] tracking-tight">
            Patients & Billing Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#526581] mt-1 max-w-xl">
            Search patient records, prevent duplicate registrations, order diagnostic tests, and record payments.
          </p>
        </div>
        <button
          onClick={() => {
            setRegWarnings([]);
            setRegError('');
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] rounded-2xl shadow-md glow-blue hover:brightness-105 active:scale-98 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Segmented Controls / Tabs */}
      <div className="inline-flex glass-card p-1.5 rounded-2xl border border-white/70 shadow-xs max-w-md w-full">
        <button
          onClick={() => setActiveTab('patients')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'patients'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Patients Directory ({globalStore.patients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'billing'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-sm glow-blue'
              : 'text-[#526581] hover:text-[#12234A]'
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
            <Search className="w-5 h-5 text-[#526581] absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by patient name, mobile number (e.g. 9848228971), or ID (e.g. PAT-2026-0001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-12 pr-4 py-3.5 text-sm text-[#12234A] rounded-2xl outline-none"
            />
          </div>

          {/* Patients List Card */}
          <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
              <span className="text-xs font-bold text-[#526581] uppercase tracking-wider">
                Matching Patients ({filteredPatients.length})
              </span>
              <span className="text-[11px] text-[#526581] font-medium">
                Search-first duplicate detection active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#12234A]">
                <thead className="bg-white/40 text-[#526581] font-bold border-b border-white/60">
                  <tr>
                    <th className="px-4 py-3">Patient ID</th>
                    <th className="px-4 py-3">Full Name & Demographics</th>
                    <th className="px-4 py-3">Phone & Location</th>
                    <th className="px-4 py-3">Order History</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {filteredPatients.map((p) => {
                    const patientOrders = globalStore.orders.filter((o) => o.patient_id === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#12234A]">{p.patient_number}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#12234A] text-sm">{p.full_name}</div>
                          <div className="text-[11px] text-[#526581] mt-0.5">
                            {p.sex.toUpperCase()} •{' '}
                            {p.date_of_birth
                              ? `DOB: ${p.date_of_birth}`
                              : `Age: ~${p.estimated_age_years} yrs (est.)`}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-[#12234A] font-semibold">
                            <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>{p.phone}</span>
                          </div>
                          <div className="text-[11px] text-[#526581] mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{p.address || 'Choutuppal'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold glass-pill text-[#12234A]">
                            {patientOrders.length} test order(s)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowOrderModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl transition-all shadow-xs glow-blue hover:brightness-105"
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
        <div className="glass-panel border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(37,99,235,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#12234A]">Billing & Payment Ledger</h2>
            </div>
            <span className="text-xs text-[#526581] font-medium">Source of truth for all collections</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#12234A]">
              <thead className="bg-white/40 text-[#526581] font-bold border-b border-white/60">
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
              <tbody className="divide-y divide-white/40">
                {globalStore.invoices.map((inv) => {
                  const order = globalStore.orders.find((o) => o.id === inv.order_id);
                  return (
                    <tr key={inv.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#12234A]">{inv.invoice_number}</td>
                      <td className="px-4 py-3.5 font-mono text-[#526581]">{order?.order_number}</td>
                      <td className="px-4 py-3.5 font-bold text-[#12234A]">{order?.patient?.full_name}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#12234A]">
                        ₹ {inv.total_amount.toFixed(2)}
                        {inv.discount_amount > 0 && (
                          <span className="text-[10px] text-amber-700 block">(-₹ {inv.discount_amount.toFixed(2)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">₹ {inv.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-bold text-[#12234A]">₹ {inv.balance_due.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100/80 text-emerald-800'
                              : inv.status === 'part_paid'
                              ? 'bg-amber-100/80 text-amber-800'
                              : 'bg-rose-100/80 text-rose-800'
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-xs glow-blue hover:brightness-105"
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

      {/* MODAL 1: Register New Patient in Liquid Glass Dialog */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-base font-extrabold text-[#12234A]">Patient Registration Desk</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regWarnings.length > 0 && (
              <div className="p-3 bg-amber-50/90 border border-amber-200/60 rounded-2xl text-xs text-amber-900 space-y-1">
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
                <label className="block text-xs font-bold text-[#12234A] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Anitha Reddy"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 text-xs text-[#12234A] rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#12234A] mb-1">Sex *</label>
                  <select
                    value={regForm.sex}
                    onChange={(e) =>
                      setRegForm({
                        ...regForm,
                        sex: e.target.value as 'male' | 'female' | 'other',
                      })
                    }
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-[#12234A] rounded-xl"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#12234A] mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9848228971"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-[#12234A] rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* DOB vs Estimated Age */}
              <div className="p-3.5 glass-card border border-white/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#12234A]">Age Identification</span>
                  <label className="flex items-center gap-1.5 text-xs text-[#526581] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={regForm.isAgeEstimated}
                      onChange={(e) => setRegForm({ ...regForm, isAgeEstimated: e.target.checked })}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>DOB unknown (Specify age)</span>
                  </label>
                </div>

                {regForm.isAgeEstimated ? (
                  <div>
                    <label className="block text-[11px] text-[#526581] mb-1 font-semibold">
                      Estimated Age (Years) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="125"
                      value={regForm.estimatedAgeYears}
                      onChange={(e) => setRegForm({ ...regForm, estimatedAgeYears: Number(e.target.value) })}
                      className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-[#526581] mb-1 font-semibold">Date of Birth *</label>
                    <input
                      type="date"
                      value={regForm.dateOfBirth}
                      onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                      className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">Address / Town</label>
                <input
                  type="text"
                  placeholder="e.g. Choutuppal, Telangana"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 text-xs text-[#12234A] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#526581] glass-card hover:bg-white/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-md glow-blue hover:brightness-105"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div>
                <h2 className="text-base font-extrabold text-[#12234A]">Order Diagnostic Tests</h2>
                <p className="text-xs text-[#526581]">
                  Patient: <strong className="text-[#12234A]">{selectedPatient.full_name}</strong> (
                  {selectedPatient.patient_number})
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderError && (
              <div className="p-3 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800">
                {orderError}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Test Selection with Tube badges */}
              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">
                  Select Tests from Catalogue *
                </label>
                <div className="max-h-52 overflow-y-auto glass-card rounded-2xl divide-y divide-white/50 p-1 glass-scrollbar">
                  {globalStore.tests.map((t) => {
                    const isChecked = selectedTestIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs ${
                          isChecked ? 'bg-blue-50/80 border border-blue-200/60' : 'hover:bg-white/60'
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
                            className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                          />
                          <div>
                            <span className="font-bold text-[#12234A]">{t.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {getTubeBadge(t.container_type)}
                              <span className="text-[10px] text-[#526581] font-mono">({t.code})</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-extrabold text-[#12234A] text-sm">
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
                  <label className="block text-xs font-bold text-[#12234A] mb-1">Priority</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as OrderPriority)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#12234A] mb-1">Ordering Physician</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rao / Self"
                    value={orderPhysician}
                    onChange={(e) => setOrderPhysician(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Permitted Discount */}
              <div className="p-3 glass-card rounded-2xl space-y-2 border border-white/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12234A]">Staff Permitted Discount (%)</label>
                  <span className="text-[11px] text-[#2563EB] font-semibold">
                    Limit:{' '}
                    {activeStaff.roles.includes('admin')
                      ? '100% (Admin)'
                      : `${lab.max_staff_discount_percentage}% (Staff)`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    max={activeStaff.roles.includes('admin') ? 100 : lab.max_staff_discount_percentage}
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(Number(e.target.value))}
                    className="glass-input w-full px-3 py-1.5 text-xs rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Discount reason (optional)"
                    value={orderDiscountReason}
                    onChange={(e) => setOrderDiscountReason(e.target.value)}
                    className="glass-input w-full px-3 py-1.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-2 border-t border-white/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#526581] font-medium">
                    Subtotal: ₹ {orderSubtotal.toFixed(2)}
                  </span>
                  {orderDiscountAmount > 0 && (
                    <span className="text-xs text-amber-700 font-bold block">
                      Discount: -₹ {orderDiscountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#526581] font-medium">Total Billed:</span>
                  <p className="text-lg font-black text-[#12234A]">₹ {orderTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#526581] glass-card hover:bg-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedTestIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-md glow-blue hover:brightness-105 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel border border-white/90 shadow-2xl rounded-3xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h2 className="text-base font-extrabold text-[#12234A]">Collect Patient Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#526581] hover:text-[#12234A] p-1.5 rounded-xl glass-pill"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-50/90 border border-rose-200/60 rounded-2xl text-xs text-rose-800">
                {payError}
              </div>
            )}

            {receiptSuccess && (
              <div className="p-3 bg-emerald-50/90 border border-emerald-200/60 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{receiptSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">
                  Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="glass-input w-full px-3.5 py-2.5 text-sm font-bold rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) =>
                    setPayMethod(
                      e.target.value as 'cash' | 'card' | 'bank_transfer' | 'check'
                    )
                  }
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl"
                >
                  <option value="cash">💵 Cash Payment</option>
                  <option value="bank_transfer">📱 UPI / QR Code / Bank Transfer</option>
                  <option value="card">💳 Credit / Debit Card (POS)</option>
                  <option value="check">📄 Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#12234A] mb-1">
                  Transaction Ref (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / GPay / Card last 4"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#526581] glass-card hover:bg-white rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#6366F1] rounded-xl shadow-md glow-blue hover:brightness-105"
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

export default function PatientsAndBillingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#526581]">
          Loading patient directory & billing ledger...
        </div>
      }
    >
      <PatientsContent />
    </React.Suspense>
  );
}
