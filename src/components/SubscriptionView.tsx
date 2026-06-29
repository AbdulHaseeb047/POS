/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../contexts/POSContext';
import { PLAN_FEATURES, SubscriptionPlan } from '../types';
import { 
  Check, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  ArrowUpRight, 
  Lock,
  Gift
} from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const { subscription, changePlan, resetTrial } = usePOS();

  // Simulated invoice list
  const invoiceHistory = [
    { id: 'INV-SUB-003', date: '2026-06-01', amount: '₨ 5,000', plan: 'Standard Plan', status: 'Paid', method: 'Visa ending 4022' },
    { id: 'INV-SUB-002', date: '2026-05-01', amount: '₨ 5,000', plan: 'Standard Plan', status: 'Paid', method: 'Visa ending 4022' },
    { id: 'INV-SUB-001', date: '2026-04-01', amount: '₨ 2,500', plan: 'Starter Plan', status: 'Paid', method: 'EasyPaisa Mobile' }
  ];

  // Helper to check trial days remaining
  const getTrialDaysLeft = () => {
    const end = new Date(subscription.trialEndsAt).getTime();
    const now = Date.now();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDays = getTrialDaysLeft();

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    const confirm = window.confirm(`Would you like to switch your active subscription plan to the "${plan}" tier for ${PLAN_FEATURES[plan].price} / month? This will apply to your active business profile immediately.`);
    if (confirm) {
      await changePlan(plan);
    }
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-screen">
      
      {/* Header section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-850 tracking-tight">SaaS Subscription & Gating Hub</h2>
        <p className="text-sm text-slate-500 font-sans">Manage business plans, invoice cycles, and unlock enterprise scaling features</p>
      </div>

      {/* Trial Countdown Card or Active Subscription Status */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-primary-fixed tracking-wider font-mono">Subscription Details</span>
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            Active Tier: <span className="text-primary-fixed font-black">{subscription.plan} Plan</span>
            {subscription.status === 'trial' && (
              <span className="bg-primary/20 text-primary-fixed text-xs font-mono font-bold px-2 py-0.5 rounded border border-primary/20">
                Trial Period
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed font-sans">
            Your offline-first terminal is linked to the SaaS Cloud Syncing server under the {subscription.plan} license. Automated daily cloud sync triggers are active.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
          {/* Trial countdown */}
          {subscription.status === 'trial' ? (
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex items-center gap-3 w-full sm:w-48">
              <Gift className="h-6 w-6 text-primary-fixed shrink-0" />
              <div>
                <p className="text-xxs uppercase tracking-wider text-slate-400 font-mono font-bold">Trial Days Left</p>
                <p className="text-sm font-black font-mono text-white mt-0.5">{trialDays} Days remaining</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex items-center gap-3 w-full sm:w-48">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xxs uppercase tracking-wider text-slate-400 font-mono font-bold">Renew Date</p>
                <p className="text-sm font-black font-mono text-white mt-0.5">July 28, 2026</p>
              </div>
            </div>
          )}

          {/* Simulate reset trial */}
          <button
            onClick={async () => {
              await resetTrial();
              alert("Sandbox Notice: 7-Day trial period has been reset successfully! You can now test Starter-tier gating limitations.");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center border border-slate-700 hover:text-white"
          >
            Reset Trial Period
          </button>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
        <Sparkles className="h-4.5 w-4.5 text-primary" />
        <span>Compare Licensing Tiers & Gated Features</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {(['Starter', 'Standard', 'Pro', 'Enterprise'] as const).map((plan) => {
          const detail = PLAN_FEATURES[plan];
          const isActive = subscription.plan === plan;

          return (
            <div 
              key={plan}
              className={`bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-xs transition-all relative ${
                isActive 
                  ? 'border-2 border-primary ring-4 ring-primary/10' 
                  : 'border-slate-200 hover:border-slate-350'
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono tracking-wider shadow-md">
                  Active Subscription
                </span>
              )}

              <div>
                {/* Plan Header */}
                <div className="pb-4 border-b border-slate-100">
                  <h4 className="text-base font-black text-slate-850">{plan}</h4>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-950 font-mono">{detail.price}</span>
                    <span className="text-xs text-slate-400 font-sans">/{detail.billing}</span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="py-4 space-y-2 text-xs leading-relaxed text-slate-600">
                  <li className="flex items-start gap-1.5 font-semibold text-slate-800">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Max Products: {detail.maxProducts.toLocaleString()}</span>
                  </li>
                  <li className="flex items-start gap-1.5 font-semibold text-slate-800">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Max Staff Accounts: {detail.maxStaff}</span>
                  </li>
                  {detail.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                id={`plan-select-btn-${plan.toLowerCase()}`}
                disabled={isActive}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all mt-4 uppercase tracking-wider flex items-center justify-center gap-1 ${
                  isActive 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-xs'
                }`}
              >
                {isActive ? 'Current Active License' : `Upgrade to ${plan}`}
                {!isActive && <ArrowUpRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Billing Invoice history table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Invoice Billing History</h3>
          <span className="text-xxs text-slate-400 flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Automatic recurring debit enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono font-bold uppercase tracking-wider">
                <th className="p-3">Invoice Code</th>
                <th className="p-3">Billing Cycle Date</th>
                <th className="p-3">Invoice Amount</th>
                <th className="p-3">Charged License</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-center">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {invoiceHistory.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/45">
                  <td className="p-3 font-bold font-mono text-slate-900">{inv.id}</td>
                  <td className="p-3 font-mono text-slate-500">{inv.date}</td>
                  <td className="p-3 font-mono font-bold text-slate-850">{inv.amount}</td>
                  <td className="p-3 font-semibold text-slate-800">{inv.plan}</td>
                  <td className="p-3 text-slate-500 font-mono text-xxs">{inv.method}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => alert(`Downloading Invoice Receipt PDF for cycle: ${inv.date}`)}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                    >
                      Download Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
