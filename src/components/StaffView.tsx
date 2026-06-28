/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  UserCheck, 
  ShieldAlert, 
  Plus, 
  X, 
  Mail, 
  Trash2, 
  Calendar,
  Lock,
  Unlock,
  Users
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, addStaff, currentUser } = usePOS();
  
  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'cashier'>('cashier');

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    addStaff(inviteName, inviteEmail, inviteRole);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('cashier');
    setInviteModalOpen(false);
  };

  // Matrix showing permission scopes for educational value
  const permissionGrid = [
    { module: 'Sales Billing Checkout', owner: true, manager: true, cashier: true, desc: 'Ring up sales, accept cash/split payment, write receipts' },
    { module: 'Add & Edit Products', owner: true, manager: true, cashier: false, desc: 'Create items, set cost vs sale pricing in catalog' },
    { module: 'Stock In & Adjustments', owner: true, manager: true, cashier: false, desc: 'Restock, apply physical counts adjustments audits' },
    { module: 'Customer Credit Udhaar Limit Management', owner: true, manager: true, cashier: true, desc: 'Register accounts, view outstanding ledger logs' },
    { module: 'Reports & Financial Analytics', owner: true, manager: true, cashier: false, desc: 'View revenue totals, margin COGS, graphs' },
    { module: 'Staff Management & Inviting', owner: true, manager: false, cashier: false, desc: 'Invite team, assign Roles clearance' },
    { module: 'SaaS Plan Subscriptions', owner: true, manager: false, cashier: false, desc: 'Upgrade pricing tier, check billing history' },
    { module: 'Tax Configuration & Headers', owner: true, manager: true, cashier: false, desc: 'Modify GST rate, receipt footer watermark' }
  ];

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-screen">
      
      {/* Header section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">Staff Roles & Clearances</h2>
          <p className="text-sm text-slate-500 font-sans">Grant team scopes, restrict access levels, and invite staff</p>
        </div>

        <button
          id="invite-staff-btn"
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-sage-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Invite Teammate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STAFF DIRECTORY LIST */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Active Staff Directory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Teammates with active backend authorization keys</p>
            </div>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
              {staff.length} Members
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {staff.map((member) => (
              <div 
                key={member.id} 
                className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-750 flex items-center justify-center font-bold font-sans">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-850 flex items-center gap-2">
                      {member.name}
                      {currentUser.id === member.id && (
                        <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
                          You
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    member.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-indigo-50 text-indigo-700 animate-pulse'
                  }`}>
                    {member.status === 'active' ? 'Active' : 'Invited'}
                  </span>

                  {/* Role Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded capitalize ${
                    member.role === 'owner' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                      : member.role === 'manager'
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                      : 'bg-slate-100 text-slate-600 border border-slate-250'
                  }`}>
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: PERMISSIONS GATING DETAILS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Clearance Permissions Guide</h3>
            <p className="text-xs text-slate-400 leading-normal">
              ZapPOS uses Role-Based Access Control (RBAC). Standard cashiers are restricted from financial spreadsheets and stock cost-audit values to prevent leakages and data theft.
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-xs text-slate-600 space-y-2 mt-4">
            <h4 className="font-bold text-primary flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" /> Sandboxing Simulator Notice
            </h4>
            <p className="leading-relaxed">
              To preview the software exactly as a Cashier or Manager would, use the **"Role Sandbox Switcher"** selector inside the Sidebar bottom footer at any time!
            </p>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <span className="text-[10px] text-slate-400 font-mono">ZapPOS Enterprise Role Engine v1.1</span>
          </div>
        </div>

      </div>

      {/* Permissions matrix spreadsheet list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs mt-6 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Role Clearance Matrix Ledger</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono font-bold uppercase tracking-wider">
                <th className="p-3">Module Scopes</th>
                <th className="p-3 text-center">Owner Clearance</th>
                <th className="p-3 text-center">Manager Clearance</th>
                <th className="p-3 text-center">Cashier Clearance</th>
                <th className="p-3">Description Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {permissionGrid.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="p-3 font-bold text-slate-800">{row.module}</td>
                  <td className="p-3 text-center">
                    <span className="inline-block p-1 rounded-full bg-rose-50 text-rose-600"><Unlock className="h-3.5 w-3.5" /></span>
                  </td>
                  <td className="p-3 text-center">
                    {row.manager ? (
                      <span className="inline-block p-1 rounded-full bg-cyan-50 text-cyan-600"><Unlock className="h-3.5 w-3.5" /></span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400"><Lock className="h-3.5 w-3.5" /></span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.cashier ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-50 text-emerald-600"><Unlock className="h-3.5 w-3.5" /></span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400"><Lock className="h-3.5 w-3.5" /></span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INVITE TEAM MEMBER */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-800">Invite New Staff Teammate</h4>
              <button 
                onClick={() => setInviteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Full Name *
                </label>
                <input
                  id="invite-name-input"
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="Zubair Malik"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Teammate Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                  <input
                    id="invite-email-input"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                    placeholder="zubair@zappos.pk"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Assign Clearance Role *
                </label>
                <select
                  id="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'owner' | 'manager' | 'cashier')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                >
                  <option value="cashier">Cashier (Billing sales, Customers ledger ONLY)</option>
                  <option value="manager">Manager (Inventory control, Reports & pricing logs)</option>
                  <option value="owner">Co-Owner (Full admin privileges billing access)</option>
                </select>
              </div>

              <div className="bg-indigo-50/20 text-[10px] text-slate-500 p-3 rounded-lg border border-indigo-100 leading-normal">
                *The invited staff will receive a verification link to log in and sync their terminal database locally.
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-invite-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-sage-dark rounded-lg shadow-sm cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
