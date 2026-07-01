/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Users, 
  Plus, 
  Edit, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Search
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = usePOS();
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierNameInput, setSupplierNameInput] = useState('');
  const [supplierContactInput, setSupplierContactInput] = useState('');
  const [supplierPhoneInput, setSupplierPhoneInput] = useState('');
  const [supplierEmailInput, setSupplierEmailInput] = useState('');
  const [supplierAddressInput, setSupplierAddressInput] = useState('');

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierNameInput.trim() || !supplierPhoneInput.trim()) {
      alert("Name and Phone fields are required.");
      return;
    }

    const payload = {
      name: supplierNameInput.trim(),
      contactPerson: supplierContactInput.trim() || undefined,
      phone: supplierPhoneInput.trim(),
      email: supplierEmailInput.trim() || undefined,
      address: supplierAddressInput.trim() || undefined,
    };

    if (editingSupplierId) {
      updateSupplier(editingSupplierId, payload);
      setEditingSupplierId(null);
    } else {
      addSupplier(payload);
    }

    // Reset Form
    setSupplierNameInput('');
    setSupplierContactInput('');
    setSupplierPhoneInput('');
    setSupplierEmailInput('');
    setSupplierAddressInput('');
  };

  const filteredSuppliers = suppliers.filter(sup => 
    sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sup.contactPerson && sup.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (sup.phone && sup.phone.includes(searchQuery))
  );

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col h-full overflow-y-auto select-none">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Supplier Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage distributor profiles, supplier contact coordinates, and check inventory stock relations.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-primary shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Suppliers List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center justify-between">
            <span>Registered Distributors ({filteredSuppliers.length})</span>
          </h3>
          
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-sans">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No suppliers found.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search or use the form on the right to add a supplier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                    <th className="p-3">Company Details</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Phone & Email</th>
                    <th className="p-3 text-center">Items Stocked</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map(sup => {
                    const prodCount = products.filter(p => p.supplier === sup.name).length;
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <div>
                            <span className="font-bold text-slate-800 text-sm">{sup.name}</span>
                            {sup.address && (
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-xs">{sup.address}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 font-medium font-sans">
                          {sup.contactPerson || <span className="text-slate-350 italic">None specified</span>}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="space-y-1 font-mono">
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{sup.phone}</span>
                            </p>
                            {sup.email && (
                              <p className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Mail className="h-3 w-3" />
                                <span>{sup.email}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                            prodCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {prodCount} Products
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingSupplierId(sup.id);
                                setSupplierNameInput(sup.name);
                                setSupplierContactInput(sup.contactPerson || '');
                                setSupplierPhoneInput(sup.phone || '');
                                setSupplierEmailInput(sup.email || '');
                                setSupplierAddressInput(sup.address || '');
                              }}
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Supplier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${sup.name}? This will clear supplier ties from inventory.`)) {
                                  deleteSupplier(sup.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Supplier"
                            >
                              <X className="h-4 w-4" />
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

        {/* Right: Add/Edit Supplier Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-1.5 rounded-lg ${editingSupplierId ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-primary/10 text-primary'}`}>
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              {editingSupplierId ? '✍️ Edit Supplier' : '➕ Register Supplier'}
            </h3>
          </div>
          
          <form onSubmit={handleSupplierSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Supplier / Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shan Foods Pakistan"
                value={supplierNameInput}
                onChange={(e) => setSupplierNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Khurram Shahzad (Sales Rep)"
                value={supplierContactInput}
                onChange={(e) => setSupplierContactInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Phone / Mobile Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 0321-1234567"
                value={supplierPhoneInput}
                onChange={(e) => setSupplierPhoneInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. khurram@shanfoods.com"
                value={supplierEmailInput}
                onChange={(e) => setSupplierEmailInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Warehouse / Office Address
              </label>
              <textarea
                placeholder="e.g. Plot F-265, S.I.T.E. Phase 2, Karachi, Pakistan"
                value={supplierAddressInput}
                onChange={(e) => setSupplierAddressInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {editingSupplierId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplierId(null);
                    setSupplierNameInput('');
                    setSupplierContactInput('');
                    setSupplierPhoneInput('');
                    setSupplierEmailInput('');
                    setSupplierAddressInput('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 bg-primary hover:bg-sage-dark text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer font-sans"
              >
                {editingSupplierId ? 'Save Changes' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
