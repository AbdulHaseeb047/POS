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
import { Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser, isLoading } = usePOS();

  // Role gating mapping
  const renderView = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    switch (activeTab) {
      case 'billing':
        return <BillingView />;
      
      case 'inventory':
        if (currentUser.role === 'cashier') {
          return <UnauthorizedFallback requiredRoles={['owner', 'manager']} />;
        }
        return <InventoryView />;
      
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
