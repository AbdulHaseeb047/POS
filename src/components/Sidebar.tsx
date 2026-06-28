/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  CreditCard, 
  Settings, 
  Database,
  CloudLightning,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  UserMinus
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    staff, 
    setCurrentUser, 
    syncStatus, 
    triggerSync,
    subscription,
    settings
  } = usePOS();

  // Role permissions:
  // Owner: Access all tabs
  // Manager: Access everything EXCEPT Staff and Admin
  // Cashier: Access Billing, Customers and Settings ONLY.
  const menuItems = [
    { id: 'billing', label: 'Sales Billing', icon: ShoppingBag, roles: ['owner', 'manager', 'cashier'] },
    { id: 'inventory', label: 'Inventory Management', icon: Package, roles: ['owner', 'manager'] },
    { id: 'customers', label: 'Customer Ledger (Udhaar)', icon: Users, roles: ['owner', 'manager', 'cashier'] },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp, roles: ['owner', 'manager'] },
    { id: 'staff', label: 'Staff & Role Control', icon: UserCheck, roles: ['owner'] },
    { id: 'subscription', label: 'Subscription Hub', icon: CreditCard, roles: ['owner', 'manager'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['owner', 'manager'] },
  ];

  // Calculate days remaining on Trial
  const getTrialDaysLeft = () => {
    const end = new Date(subscription.trialEndsAt).getTime();
    const now = Date.now();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDays = getTrialDaysLeft();

  return (
    <aside id="sidebar-container" className="w-72 bg-white text-slate-700 flex flex-col justify-between h-screen border-r border-slate-200/85 shrink-0">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2.5 rounded-xl font-black tracking-tighter text-xl shadow-md flex items-center justify-center">
              Z
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                ZapPOS
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Karachi Retail v1.4</p>
            </div>
          </div>
          {/* Real-time sync status indicator */}
          <button 
            onClick={triggerSync}
            title="Force Cloud Database Sync"
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors flex items-center justify-center border border-slate-100"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            ) : syncStatus === 'synced' ? (
              <CloudLightning className="h-4 w-4 text-emerald-600" />
            ) : (
              <Database className="h-4 w-4 text-rose-500" />
            )}
          </button>
        </div>

        {/* Business Mini Badge */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Business</span>
            <span className="text-xs font-bold text-slate-800 truncate">{settings.businessName}</span>
            <span className="text-[10px] text-warning-amber font-mono mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning-amber animate-pulse"></span>
              SaaS Plan: {subscription.plan} {subscription.status === 'trial' && `(${trialDays}d Trial)`}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = item.roles.includes(currentUser.role);
            
            if (!hasAccess) {
              return (
                <div 
                  key={item.id} 
                  className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none bg-slate-50 rounded-xl group relative border border-dashed border-slate-200"
                  title={`Requires ${item.roles.join('/')} clearance`}
                >
                  <Icon className="h-4 w-4 opacity-40 text-slate-400" />
                  <span className="opacity-60">{item.label}</span>
                  <span className="absolute right-3 top-2 text-[9px] font-mono font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                    Locked
                  </span>
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                id={`sidebar-nav-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-xl transition-all duration-150 font-semibold ${
                  isActive 
                    ? 'bg-primary text-white font-bold shadow-sm shadow-primary/15' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area with Quick Staff Simulator Switcher */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        {/* User Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary font-sans shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-850 truncate">{currentUser.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                currentUser.role === 'owner' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                  : currentUser.role === 'manager'
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Staff Switcher Box */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
            Role Sandbox Switcher
          </label>
          <select 
            value={currentUser.id}
            onChange={(e) => {
              const selected = staff.find(s => s.id === e.target.value);
              if (selected) {
                setCurrentUser(selected);
                // If switching roles restricts the active tab, fall back to billing
                const menuItem = menuItems.find(m => m.id === activeTab);
                if (menuItem && !menuItem.roles.includes(selected.role)) {
                  setActiveTab('billing');
                }
              }
            }}
            className="w-full text-xs bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-primary cursor-pointer font-sans"
          >
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
          <span className="block text-[9px] text-slate-400 mt-1.5 leading-normal italic font-sans">
            *Test other roles to view dynamic permissions gating!
          </span>
        </div>
      </div>
    </aside>
  );
};
