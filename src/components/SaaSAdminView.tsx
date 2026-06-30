import React, { useState, useEffect } from 'react';
import { usePOS } from '../contexts/POSContext';
import { ClientAccount, AuditLog } from '../types';
import {
  Users,
  ShieldCheck,
  Building,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Smartphone,
  Calendar,
  Lock,
  Unlock,
  ClipboardList,
  Search,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Info
} from 'lucide-react';

const SAAS_FEATURES_INFO = [
  { key: 'billing_sales', label: 'Billing & Sales', desc: 'Core billing and sales receipt printer' },
  { key: 'basic_inventory', label: 'Basic Inventory', desc: 'Core product list & stock adjustment' },
  { key: 'udhaar', label: 'Udhaar / Credit Ledger', desc: 'Customer outstanding debt tracking' },
  { key: 'full_reports', label: 'Full Reports & Analytics', desc: 'Detailed profit, margins and advanced charts' },
  { key: 'kot_module', label: 'Restaurant / KOT Module', desc: 'Kitchen Order Tickets and table management' },
  { key: 'mobile_terminal', label: 'Mobile-as-Terminal', desc: 'Use smartphones as portable POS devices' },
  { key: 'multi_sync', label: 'Multi-Branch Sync', desc: 'Live multi-location stock & transaction syncing' },
  { key: 'fbr_integration', label: 'FBR Integration', desc: 'Live invoice submission to tax authority (FBR)' },
  { key: 'offline_sync', label: 'Offline Resilience', desc: 'Service-worker based PWA sync and offline billing' },
];

const PRESETS = {
  Starter: {
    features: ['billing_sales', 'basic_inventory'],
    users: 1
  },
  Growth: {
    features: ['billing_sales', 'basic_inventory', 'udhaar', 'full_reports', 'mobile_terminal', 'offline_sync'],
    users: 3
  },
  Restaurant: {
    features: ['billing_sales', 'basic_inventory', 'udhaar', 'full_reports', 'mobile_terminal', 'offline_sync', 'kot_module'],
    users: 5
  },
  Enterprise: {
    features: ['billing_sales', 'basic_inventory', 'udhaar', 'full_reports', 'mobile_terminal', 'offline_sync', 'kot_module', 'multi_sync', 'fbr_integration'],
    users: 99
  }
};

export const SaaSAdminView: React.FC = () => {
  const {
    saasClients,
    saasLogs,
    fetchSaaSClients,
    fetchSaaSLogs,
    createSaaSClient,
    updateSaaSClient,
    suspendSaaSClient,
    deleteSaaSClient,
    changeTenant,
    tenantId
  } = usePOS();

  // Navigation sub-tabs: 'clients' | 'create' | 'audit'
  const [subTab, setSubTab] = useState<'clients' | 'create' | 'audit'>('clients');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit / Details form state
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);

  // New Client form state
  const [newWorkspaceId, setNewWorkspaceId] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newInviteLink, setNewInviteLink] = useState('');
  const [newTier, setNewTier] = useState<'Starter' | 'Growth' | 'Restaurant' | 'Enterprise'>('Starter');
  const [newStatus, setNewStatus] = useState<'trial' | 'active' | 'expired' | 'suspended'>('trial');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Initial fetch on mount
  useEffect(() => {
    fetchSaaSClients();
    fetchSaaSLogs();
  }, []);

  // Sync templates on tier dropdown select (for create client)
  const handleNewTierSelect = (tier: 'Starter' | 'Growth' | 'Restaurant' | 'Enterprise') => {
    setNewTier(tier);
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newWorkspaceId || !newBusinessName || !newOwnerName) {
      setFormError('Workspace ID, Business Name and Owner Name are required');
      return;
    }

    const cleanWorkspaceId = newWorkspaceId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanWorkspaceId) {
      setFormError('Invalid Workspace ID format');
      return;
    }

    const preset = PRESETS[newTier];
    const clientData = {
      id: cleanWorkspaceId,
      businessName: newBusinessName,
      ownerName: newOwnerName,
      phone: newPhone || 'N/A',
      email: newEmail || `${cleanWorkspaceId}@zappos.pk`,
      inviteLink: newInviteLink || `https://zappos.pk/invite/${cleanWorkspaceId}`,
      tier: newTier,
      status: newStatus,
      enabledFeatures: preset.features,
      allowedUsers: preset.users
    };

    try {
      await createSaaSClient(clientData);
      setFormSuccess(`Successfully registered workspace: ${cleanWorkspaceId}`);
      // Clear inputs
      setNewWorkspaceId('');
      setNewBusinessName('');
      setNewOwnerName('');
      setNewPhone('');
      setNewEmail('');
      setNewInviteLink('');
      // Redirect to list
      setTimeout(() => {
        setSubTab('clients');
        fetchSaaSClients();
        fetchSaaSLogs();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create workspace account');
    }
  };

  const handleUpdateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      await updateSaaSClient(editingClient.id, {
        businessName: editingClient.businessName,
        ownerName: editingClient.ownerName,
        phone: editingClient.phone,
        email: editingClient.email,
        inviteLink: editingClient.inviteLink,
        tier: editingClient.tier,
        status: editingClient.status,
        enabledFeatures: editingClient.enabledFeatures,
        allowedUsers: editingClient.allowedUsers,
        renewalDate: editingClient.renewalDate
      });
      setEditingClient(null);
      fetchSaaSClients();
      fetchSaaSLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to apply update');
    }
  };

  // Toggle single feature in editor
  const handleFeatureToggle = (featureKey: string) => {
    if (!editingClient) return;
    const current = editingClient.enabledFeatures || [];
    let updated: string[];
    if (current.includes(featureKey)) {
      // Billing & Sales + Basic Inventory can never be turned off (Core features)
      if (featureKey === 'billing_sales' || featureKey === 'basic_inventory') return;
      updated = current.filter(f => f !== featureKey);
    } else {
      updated = [...current, featureKey];
    }
    setEditingClient({
      ...editingClient,
      enabledFeatures: updated
    });
  };

  // Apply preset tier in editor
  const handleApplyPresetInEditor = (tier: 'Starter' | 'Growth' | 'Restaurant' | 'Enterprise') => {
    if (!editingClient) return;
    const preset = PRESETS[tier];
    setEditingClient({
      ...editingClient,
      tier,
      enabledFeatures: preset.features,
      allowedUsers: preset.users
    });
  };

  const handleSuspend = async (clientId: string) => {
    if (window.confirm(`Are you sure you want to suspend workspace: ${clientId}?`)) {
      await suspendSaaSClient(clientId);
      fetchSaaSClients();
      fetchSaaSLogs();
    }
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete client workspace: ${clientId}? All data, invoices, and settings will be permanently lost.`)) {
      await deleteSaaSClient(clientId);
      fetchSaaSClients();
      fetchSaaSLogs();
    }
  };

  // Filter clients
  const filteredClients = saasClients.filter(c => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div id="saas-admin-panel" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 px-6 py-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <span>ZapPOS SaaS Global Admin Suite</span>
          </h2>
          <p className="text-xxs font-mono text-slate-400 mt-0.5">
            PLATFORM LICENSE & MULTI-TENANCY CONTROL ENGINE • LOCAL TIME {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Global tab controllers */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => { setSubTab('clients'); setEditingClient(null); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'clients' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Accounts
          </button>
          <button
            onClick={() => { setSubTab('create'); setEditingClient(null); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'create' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Provisioning
          </button>
          <button
            onClick={() => { setSubTab('audit'); setEditingClient(null); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              subTab === 'audit' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs ({saasLogs.length})
          </button>
        </div>
      </header>

      {/* Main Content Arena */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {subTab === 'clients' && !editingClient && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search business name, owner name or workspace ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                {/* Tier Filter */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="all">All Tiers</option>
                  <option value="Starter">Starter</option>
                  <option value="Growth">Growth</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Enterprise">Enterprise</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Clients Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      <th className="py-4.5 px-5">Workspace Details</th>
                      <th className="py-4.5 px-4">Owner & Profile</th>
                      <th className="py-4.5 px-4">License Tier</th>
                      <th className="py-4.5 px-4">Status & Dates</th>
                      <th className="py-4.5 px-4">Enabled Features</th>
                      <th className="py-4.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-sans">
                          No matching active client workspaces found. Add a new client or reset filters.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const isCurrent = tenantId === client.id;
                        return (
                          <tr key={client.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrent ? 'bg-indigo-50/20' : ''}`}>
                            {/* Workspace IDs */}
                            <td className="py-4.5 px-5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  {client.businessName}
                                  {isCurrent && (
                                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase">
                                      Active Session
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 mt-1">
                                  ID: {client.id}
                                </span>
                              </div>
                            </td>

                            {/* Owner profile */}
                            <td className="py-4.5 px-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">{client.ownerName}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">{client.email}</span>
                              </div>
                            </td>

                            {/* Tier Badge */}
                            <td className="py-4.5 px-4">
                              <div className="flex flex-col">
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-md border text-center uppercase tracking-wide inline-block w-fit ${
                                  client.tier === 'Enterprise'
                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                    : client.tier === 'Restaurant'
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : client.tier === 'Growth'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-slate-50 text-slate-700 border-slate-150'
                                }`}>
                                  {client.tier}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 mt-1">
                                  Allowed Users: {client.allowedUsers}
                                </span>
                              </div>
                            </td>

                            {/* Status and Dates */}
                            <td className="py-4.5 px-4">
                              <div className="flex flex-col">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase w-fit ${
                                  client.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : client.status === 'trial'
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                    : client.status === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                  {client.status}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Renews: {new Date(client.renewalDate).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </td>

                            {/* Enabled features visualization */}
                            <td className="py-4.5 px-4 max-w-[280px]">
                              <div className="flex flex-wrap gap-1">
                                {(client.enabledFeatures || []).map((feat) => {
                                  const info = SAAS_FEATURES_INFO.find(f => f.key === feat);
                                  return (
                                    <span
                                      key={feat}
                                      title={info?.desc || ''}
                                      className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-200 transition-colors"
                                    >
                                      {info?.label || feat}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="py-4.5 px-5 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingClient(client)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                                  title="Edit Client Features & Details"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => changeTenant(client.id)}
                                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isCurrent 
                                      ? 'border-indigo-100 bg-indigo-50 text-indigo-700 cursor-default' 
                                      : 'border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-600'
                                  }`}
                                  disabled={isCurrent}
                                  title="Switch Live Session to Tenant"
                                >
                                  <span>Inspect</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleSuspend(client.id)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-yellow-400 text-slate-500 hover:text-yellow-600 transition-all cursor-pointer"
                                  disabled={client.status === 'suspended'}
                                  title="Suspend Workspace Access"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(client.id)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-400 text-slate-500 hover:text-rose-600 transition-all cursor-pointer"
                                  title="Permanently Delete Workspace"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Client editing detail view */}
        {editingClient && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Feature Flags & Workspace Gating: {editingClient.businessName}
                </h3>
                <p className="text-xxs font-mono text-slate-400 mt-1">
                  WORKSPACE_ID: {editingClient.id} • SIGNED UP {new Date(editingClient.signupDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-800 transition-all cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdateClientSubmit} className="space-y-6">
              {/* Profile Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={editingClient.businessName}
                    onChange={(e) => setEditingClient({ ...editingClient, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={editingClient.ownerName}
                    onChange={(e) => setEditingClient({ ...editingClient, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Email Address
                  </label>
                  <input
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    License Expiry / Renewal Date
                  </label>
                  <input
                    type="datetime-local"
                    value={editingClient.renewalDate ? editingClient.renewalDate.substring(0, 16) : ''}
                    onChange={(e) => setEditingClient({ ...editingClient, renewalDate: new Date(e.target.value).toISOString() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Subscription Status Gating
                  </label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="trial">Trial Status</option>
                    <option value="active">Active Status</option>
                    <option value="expired">Expired License Restriction</option>
                    <option value="suspended">Suspended Blockade</option>
                  </select>
                </div>
              </div>

              {/* Preset Template Gating and Speed Apply */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-600" />
                    <span>Apply Preset Tier Template</span>
                  </h4>
                  <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase">*Saves Time</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Starter', 'Growth', 'Restaurant', 'Enterprise'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleApplyPresetInEditor(tier)}
                      className={`text-[10px] font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer text-center ${
                        editingClient.tier === tier
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tier} Preset
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Allowed Users/Devices Gating */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                  Allowed User / Device Limit (Strict Backend Enforcement)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editingClient.allowedUsers}
                    onChange={(e) => setEditingClient({ ...editingClient, allowedUsers: parseInt(e.target.value) || 1 })}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    *Restricts the total number of staff operators that can be added inside this client's workspace database.
                  </span>
                </div>
              </div>

              {/* Interactive Checklist feature flags */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Smartphone className="h-4 w-4 text-slate-500" />
                  <span>Interactive Checklist Feature Flags</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SAAS_FEATURES_INFO.map((feat) => {
                    const isCore = feat.key === 'billing_sales' || feat.key === 'basic_inventory';
                    const isEnabled = (editingClient.enabledFeatures || []).includes(feat.key);

                    return (
                      <div
                        key={feat.key}
                        onClick={() => handleFeatureToggle(feat.key)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isEnabled
                            ? 'bg-indigo-50/45 border-indigo-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isEnabled ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                            {feat.label}
                            {isCore && (
                              <span className="text-[8px] bg-slate-100 border border-slate-250 text-slate-450 px-1 py-0.2 rounded font-mono font-bold uppercase">
                                Core Feature
                              </span>
                            )}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">{feat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save & Reset buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  Save Feature Policies
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manual workspace registration view */}
        {subTab === 'create' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Manually Register Client Workspace (Tenant)
              </h3>
              <p className="text-xxs font-mono text-slate-400 mt-1">
                INSTANTLY SPINS UP A COMPLETELY ISOLATED WORKSPACE CONTAINER RECORD
              </p>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="h-4.5 w-4.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateClientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Workspace Identifier ID (Strict Alphanumeric)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. branch-gulshan"
                    value={newWorkspaceId}
                    onChange={(e) => setNewWorkspaceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulshan Branch Superstore"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdul Haseeb"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    SaaS License Tier Template
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => handleNewTierSelect(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="Starter">Starter Tier (2 standard features, 1 user)</option>
                    <option value="Growth">Growth Tier (6 features, 3 users)</option>
                    <option value="Restaurant">Restaurant Tier (7 features, 5 users)</option>
                    <option value="Enterprise">Enterprise Tier (All features, 99 users)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="owner@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Owner Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                  Invite link or Invite Passcode/Password
                </label>
                <input
                  type="text"
                  placeholder="Invite password/link (e.g. https://zappos.pk/invite/branch-gulshan)"
                  value={newInviteLink}
                  onChange={(e) => setNewInviteLink(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Provision Workspace</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Audit Log View */}
        {subTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">SaaS Administrative Audit Trails</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Immutable, timestamped logs of all administrative tenant provisioning, feature flag changes, client suspensions, and database adjustments.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Target Workspace</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {saasLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                          No SaaS administrative activities logged yet.
                        </td>
                      </tr>
                    ) : (
                      saasLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-700 font-mono text-[10px]">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {log.performedBy}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-650">
                            {log.clientId}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-sans text-xs">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
