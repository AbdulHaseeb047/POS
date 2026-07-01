/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { POSProvider, usePOS } from './contexts/POSContext';
import { Sidebar } from './components/Sidebar';
import { BillingView } from './components/BillingView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { ReportsView } from './components/ReportsView';
import { StaffView } from './components/StaffView';
import { SubscriptionView } from './components/SubscriptionView';
import { SettingsView } from './components/SettingsView';
import { SaaSAdminView } from './components/SaaSAdminView';
import { LoginSignupView } from './components/LoginSignupView';
import { SuppliersView } from './components/SuppliersView';
import { BrandsView } from './components/BrandsView';
import { DiscountsView } from './components/DiscountsView';
import { Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser, isLoading, clientAccount } = usePOS();

  if (!currentUser) {
    return <LoginSignupView />;
  }

  // Role gating mapping
  const renderView = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    // Check if the current workspace is suspended or expired
    const isLocked = clientAccount && (clientAccount.status === 'suspended' || clientAccount.status === 'expired');

    // If locked, restrict access to any view except the SaaS Owner console itself (so owners can reactivate)
    if (isLocked && activeTab !== 'saas-admin') {
      return <SubscriptionBlockedFallback />;
    }

    switch (activeTab) {
      case 'saas-admin':
        if (currentUser.role !== 'owner') {
          return <UnauthorizedFallback requiredRoles={['owner']} />;
        }
        return <SaaSAdminView />;

      case 'billing':
        return <BillingView />;
      
      case 'inventory':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <InventoryView />;
      
      case 'suppliers':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <SuppliersView />;
      
      case 'brands':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <BrandsView />;
      
      case 'discounts':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <DiscountsView />;
      
      case 'customers':
        return <CustomersView />;
      
      case 'reports':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <ReportsView />;
      
      case 'staff':
        if (currentUser.role !== 'owner') {
          return <UnauthorizedFallback requiredRoles={['owner']} />;
        }
        return <StaffView />;
      
      case 'subscription':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <SubscriptionView />;
      
      case 'settings':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <SettingsView />;
      
      default:
        return <BillingView />;
    }
  };

  return (
    <div id="app-workspace-layout" className="flex h-screen w-screen overflow-hidden font-sans antialiased text-slate-800 bg-slate-100">
      <Sidebar />
      <main id="main-content-canvas" className="flex-1 flex flex-col h-full overflow-hidden relative">
        {renderView()}
      </main>
    </div>
  );
};

const SubscriptionBlockedFallback: React.FC = () => {
  const { clientAccount } = usePOS();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center select-none">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-150 text-rose-600 flex items-center justify-center shadow-xs mb-5 animate-bounce">
        <Lock className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight">Workspace Suspended / Subscription Expired</h3>
      <p className="text-xs text-slate-500 mt-2 max-w-[480px] leading-relaxed">
        Access to your ZapPOS retail store workspace <strong>{clientAccount?.businessName || 'Current Store'}</strong> has been temporarily frozen due to an unpaid balance, expired license, or custom owner suspension.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-6 max-w-sm w-full text-left space-y-2 shadow-xs">
        <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
          <span className="text-slate-400">Workspace Tenant ID:</span>
          <span className="font-mono font-bold text-slate-700">{clientAccount?.id}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
          <span className="text-slate-400">Owner Registered Name:</span>
          <span className="font-semibold text-slate-700">{clientAccount?.ownerName}</span>
        </div>
        <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
          <span className="text-slate-400">License Expiry Date:</span>
          <span className="font-mono text-slate-650">{clientAccount?.renewalDate ? new Date(clientAccount.renewalDate).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Current Status Tag:</span>
          <span className="font-mono font-black text-rose-600 uppercase tracking-wide">{clientAccount?.status}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200/60 pt-5 max-w-[420px]">
        <p className="text-[11px] text-slate-400 leading-normal italic">
          *If you are the platform administrator, you can reactivate this workspace by clicking <strong>"SaaS Owner Console"</strong> at the bottom of the left sidebar, entering passcode <strong>admin123</strong>, and toggling the status to Active.
        </p>
      </div>
    </div>
  );
};


// Shimmer Loader for Premium UX
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 bg-slate-50 overflow-hidden h-full flex flex-col justify-start">
      <div className="flex justify-between items-center animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-3 w-32 bg-slate-200/80 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-xs animate-pulse">
                <div className="h-20 bg-slate-100 rounded-xl"></div>
                <div className="h-3.5 bg-slate-200 rounded w-4/5"></div>
                <div className="h-2.5 bg-slate-150 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded-lg w-1/3 animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 bg-slate-150 rounded w-2/5 animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/5 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="h-11 bg-slate-200 rounded-xl w-full animate-pulse"></div>
            <div className="h-11 bg-slate-300 rounded-xl w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback for role restriction
const UnauthorizedFallback: React.FC<{ requiredRoles: string[] }> = ({ requiredRoles }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm mb-4">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-850">Access Denied (Clearance Error)</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-[340px] leading-relaxed">
        This panel is protected by role-based locks. It requires **{requiredRoles.join(' or ')}** privileges.
      </p>
      <p className="text-xxs text-amber-500 font-mono mt-3 uppercase tracking-wider font-bold">
        *Hint: Use the "Role Sandbox Switcher" at the bottom of the sidebar to test higher roles!
      </p>
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
