/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../contexts/POSContext';
import { Customer, CustomerLedgerEntry } from '../types';
import { 
  Search, 
  UserPlus, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  FileText, 
  Activity,
  UserCheck
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    receivePayment,
    ledger,
    settings
  } = usePOS();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [hasBalanceFilter, setHasBalanceFilter] = useState<boolean | null>(null); // null = all, true = has balance, false = zero balance

  // Selection state for viewing customer ledger
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Payment capture form state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('Cash received in store');

  // Customer form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLimit, setFormLimit] = useState('30000');

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);
      
      let matchesBalance = true;
      if (hasBalanceFilter === true) matchesBalance = c.outstandingBalance > 0;
      else if (hasBalanceFilter === false) matchesBalance = c.outstandingBalance === 0;

      return matchesSearch && matchesBalance;
    });
  }, [customers, searchQuery, hasBalanceFilter]);

  // Overall ledger calculations
  const overallOwedTotal = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  }, [customers]);

  const activeLedgerAccountsCount = useMemo(() => {
    return customers.filter(c => c.outstandingBalance > 0).length;
  }, [customers]);

  // Selected customer specific ledger records
  const selectedCustomerLedger = useMemo(() => {
    if (!selectedCustomer) return [];
    return ledger
      .filter(l => l.customerId === selectedCustomer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, selectedCustomer]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormLimit('30000');
    setAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormAddress(c.address);
    setFormLimit(c.creditLimit.toString());
    setAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    const data = {
      name: formName,
      phone: formPhone,
      address: formAddress || 'Karachi, Pakistan',
      creditLimit: parseFloat(formLimit) || 30000
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
      // Synchronize selection view if editing active customer
      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...data });
      }
    } else {
      addCustomer(data);
    }
    setAddModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;
    
    const amt = parseFloat(paymentAmount) || 0;
    if (amt > 0) {
      receivePayment(selectedCustomer.id, amt, paymentRef);
      
      // Update dynamic selection visual outstanding values
      const updatedOutstanding = Math.max(0, selectedCustomer.outstandingBalance - amt);
      setSelectedCustomer({ ...selectedCustomer, outstandingBalance: updatedOutstanding });
    }

    setPaymentAmount('');
    setPaymentRef('Cash received in store');
    setPaymentModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 flex flex-col md:flex-row gap-6 h-screen overflow-hidden">
      
      {/* LEFT PANEL: CUSTOMER REGISTER DIRECTORY */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Credit (Udhaar) Directory</h2>
            <p className="text-sm text-slate-500 font-sans">Manage customer accounts, custom limits, and balances</p>
          </div>
          
          <button
            id="register-customer-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-primary hover:bg-sage-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Register Customer</span>
          </button>
        </div>

        {/* Aggregate Credit summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Summary Card 1: Outstanding Credit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Outstanding Udhaar</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-0.5">₨ {overallOwedTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Summary Card 2: Active ledgers count */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Active Udhaar Books</span>
              <p className="text-lg font-black text-slate-850 font-mono mt-0.5">{activeLedgerAccountsCount}</p>
            </div>
          </div>

          {/* Summary Card 3: Overall limit warning */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Business Safe Ratio</span>
              <p className="text-lg font-black text-slate-850 font-mono mt-0.5">
                {Math.round(((overallOwedTotal) / (customers.reduce((sum, c) => sum + c.creditLimit, 0) || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Directory Query Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-slate-400 h-4.5 w-4.5" />
            <input
              id="customer-dir-search"
              type="text"
              placeholder="Search by Name or Mobile No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-800 rounded-lg border border-slate-200 outline-none focus:border-primary transition-all font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Toggle outstanding filters */}
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              id="customer-balance-all"
              onClick={() => setHasBalanceFilter(null)}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                hasBalanceFilter === null ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All customers
            </button>
            <button
              id="customer-balance-owed"
              onClick={() => setHasBalanceFilter(true)}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                hasBalanceFilter === true ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              With Owed Udhaar
            </button>
            <button
              id="customer-balance-clear"
              onClick={() => setHasBalanceFilter(false)}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                hasBalanceFilter === false ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Zero Balance
            </button>
          </div>
        </div>

        {/* Customer list table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex-1">
          {filteredCustomers.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-500">No customers registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Add a customer using the "Register Customer" button.</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider sticky top-0 bg-white">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">City Address</th>
                    <th className="p-4 text-right">Owed Balance</th>
                    <th className="p-4 text-right">Credit Limit</th>
                    <th className="p-4 text-center">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {filteredCustomers.map((cust) => {
                    const isOverLimit = cust.outstandingBalance > cust.creditLimit;
                    const isNearLimit = cust.outstandingBalance >= cust.creditLimit * 0.85;
                    const isSelected = selectedCustomer?.id === cust.id;

                    return (
                      <tr 
                        id={`customer-row-${cust.id}`}
                        key={cust.id} 
                        onClick={() => setSelectedCustomer(cust)}
                        className={`hover:bg-slate-50 transition-all cursor-pointer ${
                          isSelected ? 'bg-primary/5 font-medium border-l-4 border-l-primary' : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{cust.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">ID: {cust.id}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-4 font-mono text-slate-600">{cust.phone}</td>

                        {/* Address */}
                        <td className="p-4 text-slate-500 max-w-[150px] truncate">{cust.address}</td>

                        {/* Outstanding Balance */}
                        <td className="p-4 text-right font-mono">
                          <span className={`font-bold text-sm ${
                            cust.outstandingBalance > 0 
                              ? isOverLimit 
                                ? 'text-red-600' 
                                : 'text-rose-600'
                              : 'text-emerald-600'
                          }`}>
                            ₨ {cust.outstandingBalance.toLocaleString()}
                          </span>
                        </td>

                        {/* Credit Limit */}
                        <td className="p-4 text-right font-mono text-slate-500">
                          ₨ {cust.creditLimit.toLocaleString()}
                        </td>

                        {/* Ledger button actions */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`open-ledger-btn-${cust.id}`}
                              onClick={() => setSelectedCustomer(cust)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="h-3 w-3" />
                              <span>View Ledger</span>
                            </button>

                            <button
                              id={`edit-cust-btn-${cust.id}`}
                              onClick={() => handleOpenEdit(cust)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-warning-amber/10 text-warning-amber hover:bg-warning-amber/20 rounded border border-warning-amber/20 transition-colors cursor-pointer"
                            >
                              Edit Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: INTERACTIVE CUSTOMER LEDGER CARD */}
      <div id="customer-ledger-panel" className="w-full md:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-xl shrink-0 flex flex-col justify-between h-screen overflow-hidden">
        {selectedCustomer ? (
          <>
            {/* Customer Details Area */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-extrabold text-slate-855 tracking-tight">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Cell: {selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded bg-slate-200/50 hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Outstanding balance large badge */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Current Udhaar Balance</span>
                  <p className="text-xl font-extrabold font-mono text-rose-400 mt-1">
                    ₨ {selectedCustomer.outstandingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Credit Limit</span>
                  <p className="text-sm font-bold font-mono mt-1 text-slate-300">
                    ₨ {selectedCustomer.creditLimit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Register Payment Trigger button */}
              <button
                id="receive-udhaar-payment-trigger"
                onClick={() => {
                  setPaymentAmount(selectedCustomer.outstandingBalance.toString());
                  setPaymentModalOpen(true);
                }}
                disabled={selectedCustomer.outstandingBalance <= 0}
                className={`w-full mt-4 py-2.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase ${
                  selectedCustomer.outstandingBalance <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                <span>Receive Cash Payment</span>
              </button>
            </div>

            {/* Ledger Transactions logs list */}
            <div className="flex-1 overflow-y-auto p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">Ledger Entries Log</h4>
              {selectedCustomerLedger.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No entries registered in the ledger book.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCustomerLedger.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border flex gap-3 ${
                        item.type === 'credit_sale' 
                          ? 'bg-rose-50/20 border-rose-100' 
                          : 'bg-emerald-50/10 border-emerald-100'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                        item.type === 'credit_sale' 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-emerald-100 text-emerald-750'
                      }`}>
                        {item.type === 'credit_sale' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-800">
                            {item.type === 'credit_sale' ? 'Udhaar Purchase' : 'Payment Received'}
                          </p>
                          <span className={`font-mono font-black ${
                            item.type === 'credit_sale' ? 'text-rose-600' : 'text-emerald-700'
                          }`}>
                            {item.type === 'credit_sale' ? '+' : '-'}₨ {item.amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/60 text-[10px] text-slate-400 font-mono">
                          <span>Balance after: ₨ {item.balanceAfter.toLocaleString()}</span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 opacity-70">
            <UserCheck className="h-12 w-12 text-slate-300 mb-2 stroke-1" />
            <p className="text-sm font-semibold text-slate-500">No customer selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
              Select a customer account on the left to view active ledger entries, credit thresholds, and receive cash payments.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTER NEW CUSTOMER */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-800">
                {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer'}
              </h4>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Customer Name *
                </label>
                <input
                  id="form-customer-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="Mohammad Farhan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Mobile Number (Contact) *
                </label>
                <input
                  id="form-customer-phone"
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Home/Store Address
                </label>
                <input
                  id="form-customer-address"
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="e.g. Flat 302, Phase 5, DHA, Karachi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Udhaar Credit Limit (₨)
                </label>
                <input
                  id="form-customer-limit"
                  type="number"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  min="5000"
                  max="500000"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-customer-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-sage-dark rounded-lg shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT UDHAAR PAYMENT */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-850">Collect Outstanding Udhaar Cash</h4>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-sans leading-relaxed">
                <span className="text-[10px] text-slate-400 font-mono font-semibold block uppercase">Owed Customer</span>
                <p className="font-bold text-sm text-white mt-0.5">{selectedCustomer.name}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 font-mono">
                  <span>Current Outstanding Owed:</span>
                  <span className="text-rose-400 font-bold">₨ {selectedCustomer.outstandingBalance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Payment Amount Collected Now (₨)
                </label>
                <input
                  id="collect-payment-input"
                  type="number"
                  min="1"
                  max={selectedCustomer.outstandingBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base text-slate-850 font-mono outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. 5000"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Payment Bank/Reference Comment
                </label>
                <input
                  id="collect-payment-ref"
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="e.g. Cash paid in store / Bank transfer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount('');
                    setPaymentRef('Cash received in store');
                    setPaymentModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-collect-payment"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Post Payment Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
