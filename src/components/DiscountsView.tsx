/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Percent, 
  Search, 
  Archive, 
  Users, 
  Sparkles, 
  Trash2, 
  Check, 
  Tag, 
  AlertCircle 
} from 'lucide-react';

export const DiscountsView: React.FC = () => {
  const { products, brands, suppliers, updateProduct } = usePOS();
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');

  // Bulk Discount States
  const [bulkType, setBulkType] = useState<'brand' | 'supplier'>('brand');
  const [bulkTarget, setBulkTarget] = useState('');
  const [bulkDiscountVal, setBulkDiscountVal] = useState<number>(0);
  
  // Notification State
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Apply Bulk Discount
  const handleApplyBulkDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);

    if (!bulkTarget) {
      setNotif({ type: 'error', msg: `Please select a target ${bulkType}.` });
      return;
    }

    if (bulkDiscountVal < 0 || bulkDiscountVal > 100) {
      setNotif({ type: 'error', msg: 'Discount percentage must be between 0 and 100.' });
      return;
    }

    let affectedCount = 0;
    try {
      // Find matching products
      const targets = products.filter(p => {
        if (bulkType === 'brand') {
          return p.brand?.toLowerCase() === bulkTarget.toLowerCase();
        } else {
          return p.supplier?.toLowerCase() === bulkTarget.toLowerCase();
        }
      });

      if (targets.length === 0) {
        setNotif({ type: 'error', msg: `No products found belonging to selected ${bulkType}.` });
        return;
      }

      // Update each product
      for (const prod of targets) {
        await updateProduct(prod.id, { discountPercentage: bulkDiscountVal });
        affectedCount++;
      }

      setNotif({ 
        type: 'success', 
        msg: `Successfully applied ${bulkDiscountVal}% discount to all ${affectedCount} products of ${bulkType} "${bulkTarget}"!` 
      });
      setBulkDiscountVal(0);
      setBulkTarget('');
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Failed to apply bulk discount.' });
    }
  };

  // Clear all active discounts
  const handleClearAllDiscounts = async () => {
    if (!window.confirm('Are you sure you want to remove discounts from ALL items in your inventory?')) {
      return;
    }
    setNotif(null);

    let clearedCount = 0;
    try {
      const activeDiscounts = products.filter(p => (p.discountPercentage || 0) > 0);
      for (const prod of activeDiscounts) {
        await updateProduct(prod.id, { discountPercentage: 0 });
        clearedCount++;
      }
      setNotif({ type: 'success', msg: `Successfully cleared promotional discounts from ${clearedCount} products.` });
    } catch (err: any) {
      setNotif({ type: 'error', msg: err.message || 'Failed to clear discounts.' });
    }
  };

  // Inline individual discount update
  const handleInlineDiscountChange = async (productId: string, val: number) => {
    if (val < 0 || val > 100 || isNaN(val)) return;
    await updateProduct(productId, { discountPercentage: val });
  };

  // Filters logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery) ||
                          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBrand = selectedBrandFilter === 'all' || p.brand === selectedBrandFilter;
    const matchesSupplier = selectedSupplierFilter === 'all' || p.supplier === selectedSupplierFilter;
    return matchesSearch && matchesBrand && matchesSupplier;
  });

  const totalDiscountedItems = products.filter(p => (p.discountPercentage || 0) > 0).length;

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col h-full overflow-y-auto select-none">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Percent className="h-6 w-6 text-primary" />
            <span>Smart Promotional Discounts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Apply brand-specific, supplier-specific, or direct item-specific discount percentages. Offers compile live on Sales billing screens.
          </p>
        </div>
        
        {totalDiscountedItems > 0 && (
          <button 
            onClick={handleClearAllDiscounts}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All Active Discounts ({totalDiscountedItems})</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {notif && (
        <div className={`p-4 rounded-2xl mb-6 text-xs flex items-start gap-3 border ${
          notif.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {notif.type === 'success' ? (
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Campaigns Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Bulk Campaigns Setup Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
              Apply Bulk Campaigns
            </h3>
          </div>

          <form onSubmit={handleApplyBulkDiscount} className="space-y-4 text-xs font-sans">
            
            {/* Choose Campaign Scope */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                1. Campaign Scope
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setBulkType('brand'); setBulkTarget(''); }}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-lg transition-all ${
                    bulkType === 'brand' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Archive className="h-3 w-3 inline mr-1.5" />
                  Brand-Specific
                </button>
                <button
                  type="button"
                  onClick={() => { setBulkType('supplier'); setBulkTarget(''); }}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-lg transition-all ${
                    bulkType === 'supplier' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="h-3 w-3 inline mr-1.5" />
                  Supplier-Specific
                </button>
              </div>
            </div>

            {/* Target Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                2. Select Target {bulkType === 'brand' ? 'Brand' : 'Supplier'}
              </label>
              <select
                required
                value={bulkTarget}
                onChange={(e) => setBulkTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary"
              >
                <option value="">-- Choose {bulkType === 'brand' ? 'Brand' : 'Supplier'} --</option>
                {bulkType === 'brand' ? (
                  brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))
                ) : (
                  suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Discount Percentage Value */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                3. Promotional Discount Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  value={bulkDiscountVal || ''}
                  onChange={(e) => setBulkDiscountVal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-800 font-mono focus:border-primary"
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400 font-bold font-mono">%</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-sage-dark text-white font-bold rounded-xl shadow-md transition-colors font-sans uppercase tracking-wider text-[11px]"
            >
              Apply Campaign Offer
            </button>
          </form>
        </div>

        {/* Catalog List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[420px]">
          
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Itemized Promo Rates
            </h3>

            {/* List Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250/60 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 outline-none"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 outline-none"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Brand / Supplier</th>
                  <th className="p-2.5">Original Price</th>
                  <th className="p-2.5">Promo Discount %</th>
                  <th className="p-2.5 text-right">Sale Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-sans">
                      No matching products found in catalog.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => {
                    const discount = prod.discountPercentage || 0;
                    const finalPrice = prod.salePrice * (1 - discount / 100);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {discount > 0 && (
                              <div className="p-1 rounded-md bg-rose-50 text-rose-500">
                                <Tag className="h-3 w-3" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800">{prod.name}</span>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {prod.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500">
                          <div>
                            <span className="font-semibold block text-slate-700">{prod.brand || '-'}</span>
                            <span className="text-[10px] text-slate-400">{prod.supplier || '-'}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-slate-650">
                          ₨ {prod.salePrice.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={discount || ''}
                              onChange={(e) => handleInlineDiscountChange(prod.id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-center text-xs text-slate-800 font-mono focus:border-primary focus:bg-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {discount > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-emerald-700">₨ {finalPrice.toLocaleString()}</span>
                              <span className="text-[9px] line-through text-slate-400">₨ {prod.salePrice.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-800">₨ {prod.salePrice.toLocaleString()}</span>
                          )}
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
    </div>
  );
};
