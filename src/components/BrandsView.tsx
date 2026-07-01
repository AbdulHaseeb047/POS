/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Archive, 
  Plus, 
  Edit, 
  X, 
  FileText,
  Search,
  CheckCircle2
} from 'lucide-react';

export const BrandsView: React.FC = () => {
  const { brands, products, addBrand, updateBrand, deleteBrand } = usePOS();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandNameInput, setBrandNameInput] = useState('');

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandNameInput.trim()) {
      alert("Brand name is required.");
      return;
    }

    const payload = {
      name: brandNameInput.trim()
    };

    if (editingBrandId) {
      updateBrand(editingBrandId, payload);
      setEditingBrandId(null);
    } else {
      addBrand(payload);
    }

    setBrandNameInput('');
  };

  const filteredBrands = brands.filter(br => 
    br.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col h-full overflow-y-auto select-none">
      
      {/* Title Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6 text-primary" />
            <span>Brand Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage product manufacturers, consumer brands, and associate catalog collections dynamically.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-primary shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Brands List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center justify-between">
            <span>Registered Brands ({filteredBrands.length})</span>
          </h3>

          {filteredBrands.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-sans">
              <Archive className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No brands found.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search or register a new brand on the right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                    <th className="p-3 w-16">Icon Code</th>
                    <th className="p-3">Brand Name</th>
                    <th className="p-3">Assigned Products</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBrands.map(br => {
                    const prodCount = products.filter(p => p.brand === br.name).length;
                    return (
                      <tr key={br.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center font-black text-primary uppercase font-mono shadow-inner text-xs">
                            {br.name.slice(0, 2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 text-sm">{br.name}</span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                            prodCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {prodCount} Items Associated
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingBrandId(br.id);
                                setBrandNameInput(br.name);
                              }}
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Brand"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete brand: ${br.name}? This removes brand mapping from associated products.`)) {
                                  deleteBrand(br.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Brand"
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

        {/* Right: Add/Edit Brand Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-1.5 rounded-lg ${editingBrandId ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-primary/10 text-primary'}`}>
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              {editingBrandId ? '✍️ Edit Brand' : '➕ Register Brand'}
            </h3>
          </div>

          <form onSubmit={handleBrandSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tapal, National, Shan"
                value={brandNameInput}
                onChange={(e) => setBrandNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all font-sans"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {editingBrandId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBrandId(null);
                    setBrandNameInput('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 bg-primary hover:bg-sage-dark text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {editingBrandId ? 'Save Changes' : 'Register Brand'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
