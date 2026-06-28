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
  const { activeTab, currentUser } = usePOS();

  // Role gating mapping
  const renderView = () => {
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
