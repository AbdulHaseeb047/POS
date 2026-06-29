/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Settings, 
  Percent, 
  Receipt, 
  Building, 
  Save, 
  Volume2, 
  VolumeX, 
  CheckCircle,
  Smartphone,
  Check
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = usePOS();
  
  // Local state for forms
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [currency, setCurrency] = useState(settings.currency);
  
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [taxLabel, setTaxLabel] = useState(settings.taxLabel);

  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  
  const [lowStockAlertEnabled, setLowStockAlertEnabled] = useState(settings.lowStockAlertEnabled);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      businessName,
      address,
      phone,
      currency,
      taxEnabled,
      taxRate: parseFloat(taxRate) || 0,
      taxLabel,
      receiptHeader,
      receiptFooter,
      lowStockAlertEnabled
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-screen">
      
      {/* Header section */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">System Settings & Configurations</h2>
          <p className="text-sm text-slate-500 font-sans">Modify store profiles, print receipt parameters, and active tax rules</p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold animate-fade-in shadow-xs">
            <CheckCircle className="h-4.5 w-4.5" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettingsSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        
        {/* COLUMN 1: BUSINESS PROFILE & ALERTS */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Building className="h-4.5 w-4.5 text-slate-500" />
              <span>Business Demographics</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Business Name *
                </label>
                <input
                  id="settings-business-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Store Contact Number *
                </label>
                <input
                  id="settings-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Physical Store Address
                </label>
                <textarea
                  id="settings-address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Currency Symbol
                </label>
                <input
                  id="settings-currency"
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Operational Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              {lowStockAlertEnabled ? <Volume2 className="h-4.5 w-4.5 text-slate-500" /> : <VolumeX className="h-4.5 w-4.5 text-slate-400" />}
              <span>System Sound Alerts</span>
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5pr-4">
                <p className="text-xs font-bold text-slate-700">Low Stock Warning Sound</p>
                <p className="text-[10px] text-slate-400 font-sans">Trigger beep sound effects if items touch warning stock levels during cashier checkout</p>
              </div>
              <button
                id="toggle-low-stock-alert"
                type="button"
                onClick={() => setLowStockAlertEnabled(!lowStockAlertEnabled)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer ${
                  lowStockAlertEnabled ? 'bg-primary flex justify-end' : 'bg-slate-200 flex justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md"></span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: ACTIVE TAX LAWS (GST/SRB) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Percent className="h-4.5 w-4.5 text-slate-500" />
            <span>Tax Rates Configuration</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700">Apply Tax on Sales Billing</p>
                <p className="text-[10px] text-slate-400 font-sans">Toggle to add tax rates automatically on invoice checkout</p>
              </div>
              <button
                id="toggle-tax-enabled"
                type="button"
                onClick={() => setTaxEnabled(!taxEnabled)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer ${
                  taxEnabled ? 'bg-emerald-500 flex justify-end' : 'bg-slate-200 flex justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md"></span>
              </button>
            </div>

            {taxEnabled && (
              <div className="space-y-3 pt-2 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Tax Agency Label
                  </label>
                  <input
                    id="settings-tax-label"
                    type="text"
                    required
                    value={taxLabel}
                    onChange={(e) => setTaxLabel(e.target.value)}
                    placeholder="e.g. GST or SRB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                  />
                  <span className="block text-[9px] text-slate-400 mt-1">
                    *SRB represents Sindh Revenue Board tax. GST represents federal General Sales Tax.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Active Tax Rate percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      id="settings-tax-rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                    />
                    <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-mono font-bold">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: PRINT RECEIPT WATERMARK templates */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Receipt className="h-4.5 w-4.5 text-slate-500" />
            <span>Thermal Receipt Customizer</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                Printed Receipt Header Note
              </label>
              <textarea
                id="settings-receipt-header"
                rows={4}
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="WELCOME TO KARACHI MART..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono leading-relaxed"
              />
              <span className="block text-[9px] text-slate-400 mt-1">
                *Appears at the very top of printed customer slips.
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                Printed Receipt Footer Note
              </label>
              <textarea
                id="settings-receipt-footer"
                rows={4}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for shopping..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono leading-relaxed"
              />
              <span className="block text-[9px] text-slate-400 mt-1">
                *Appears at the very bottom of printed customer slips.
              </span>
            </div>
          </div>
        </div>

        {/* Form Submission actions */}
        <div className="col-span-1 lg:col-span-3 pt-4 border-t border-slate-200 flex gap-3 justify-end">
          <button
            id="save-settings-submit"
            type="submit"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings Configurations</span>
          </button>
        </div>

      </form>

    </div>
  );
};
