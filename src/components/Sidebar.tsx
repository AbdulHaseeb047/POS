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
  UserMinus,
  LogOut,
  Archive,
  Percent,
  Truck,
  Tags
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    logoutUser, 
    syncStatus, 
    triggerSync,
    subscription,
    settings,
    clientAccount,
    tenantId
  } = usePOS();

  // Role permissions:
  // Owner: Access all tabs
  // Manager: Access everything EXCEPT Staff and Admin
  // Cashier: Access Billing, Customers and Settings ONLY.
  const menuItems = [
    { id: 'billing', label: 'Sales Billing', icon: ShoppingBag, roles: ['owner', 'manager', 'cashier'], feature: 'billing_sales' },
    { id: 'inventory', label: 'Inventory Management', icon: Package, roles: ['owner', 'manager'], feature: 'basic_inventory' },
    { id: 'suppliers', label: 'Suppliers Directory', icon: Truck, roles: ['owner', 'manager'] },
    { id: 'brands', label: 'Brand Registry', icon: Archive, roles: ['owner', 'manager'] },
    { id: 'categories', label: 'Category Manager', icon: Tags, roles: ['owner', 'manager'] },
    { id: 'discounts', label: 'Item Discounts', icon: Percent, roles: ['owner', 'manager'] },
    { id: 'customers', label: 'Customer Ledger (Udhaar)', icon: Users, roles: ['owner', 'manager', 'cashier'], feature: 'udhaar' },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp, roles: ['owner', 'manager'], feature: 'full_reports' },
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

  const handleOpenSaaSAdmin = () => {
    const code = prompt("Enter SaaS Owner Security Passcode to access Global Tenant & Gating Console:", "admin123");
    if (code === "admin123") {
      setActiveTab("saas-admin");
    } else if (code !== null) {
      alert("Unauthorized Access Attempt Blocked! Invalid Passcode.");
    }
  };

  return (
    <aside id="sidebar-container" className="w-72 min-w-[288px] max-w-[288px] h-screen sticky left-0 top-0 bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/85 shrink-0 select-none z-40">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand & Store Status Block (Top Info) */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-white h-9.5 w-9.5 rounded-xl font-black tracking-tighter text-lg shadow-sm flex items-center justify-center">
                Z
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900">
                  ZapPOS
                </h1>
                <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-bold">Karachi Retail v1.4</p>
              </div>
            </div>
            
            {/* Sync trigger button */}
            <button 
              onClick={triggerSync}
              title="Force Cloud Database Sync"
              className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-200/60 shadow-xxs bg-slate-50 cursor-pointer"
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : syncStatus === 'synced' ? (
                <CloudLightning className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Database className="h-3.5 w-3.5 text-rose-500" />
              )}
            </button>
          </div>

          {/* Active Workspace / Store Card */}
          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xxs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-mono">Registered Store</span>
              <span className="text-xs font-bold text-slate-800 truncate leading-tight">{settings.businessName}</span>
              <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] text-slate-400 font-medium">SaaS Node:</span>
                <span className="text-[9px] text-indigo-650 font-mono font-bold uppercase truncate max-w-[120px]" title={clientAccount?.id || tenantId}>
                  {clientAccount?.id || tenantId}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] text-slate-400 font-medium">Status Tag:</span>
                <span className="text-[9px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1 rounded-sm border border-emerald-100">
                  {clientAccount?.status || subscription.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = item.roles.includes(currentUser.role);
            
            // Feature gating check
            const hasFeature = !item.feature || !clientAccount || !clientAccount.enabledFeatures || clientAccount.enabledFeatures.includes(item.feature);

            if (!hasAccess || !hasFeature) {
              return null; // Completely hide unauthorized or disabled features to show tailored dashboard version
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

        {/* Gated SaaS Owner Key Console Button */}
        {currentUser.role === 'owner' && (
          <div className="px-4 mt-1 pb-4">
            <button
              onClick={handleOpenSaaSAdmin}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] rounded-xl border font-bold font-mono transition-all uppercase cursor-pointer ${
                activeTab === 'saas-admin'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                  : 'bg-indigo-50/50 text-indigo-700 border-indigo-100/70 hover:bg-indigo-100/60 hover:text-indigo-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>SaaS Owner Console</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Profile / Account Indicator - Minimal & Google-like */}
      <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold font-sans shadow-sm shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser?.name}</h4>
            <span className={`inline-block text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded mt-1 ${
              currentUser?.role === 'owner' 
                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                : currentUser?.role === 'manager'
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {currentUser?.role}
            </span>
          </div>
        </div>

        <button
          onClick={() => logoutUser()}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer shrink-0"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </aside>
  );
};
