/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../contexts/POSContext';
import { Product, UnitType } from '../types';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  ArrowUpRight,
  ShieldAlert,
  Archive,
  RefreshCw,
  Users
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    settings,
    suppliers,
    brands,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addBrand,
    updateBrand,
    deleteBrand
  } = usePOS();

  // Sub-tabs: 'products', 'suppliers', 'brands'
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'suppliers' | 'brands'>('products');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [selectedProdForStockIn, setSelectedProdForStockIn] = useState<Product | null>(null);
  const [stockInAmount, setStockInAmount] = useState<string>('');

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProdForAdjust, setSelectedProdForAdjust] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Inventory Count Recount');

  // Product Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Groceries');
  const [formUnit, setFormUnit] = useState<UnitType>('piece');
  const [formCost, setFormCost] = useState('0');
  const [formSale, setFormSale] = useState('0');
  const [formQty, setFormQty] = useState('10');
  const [formThreshold, setFormThreshold] = useState('5');
  const [formExpiry, setFormExpiry] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formDiscountPercentage, setFormDiscountPercentage] = useState('0');

  // Supplier form states
  const [supplierNameInput, setSupplierNameInput] = useState('');
  const [supplierContactInput, setSupplierContactInput] = useState('');
  const [supplierPhoneInput, setSupplierPhoneInput] = useState('');
  const [supplierEmailInput, setSupplierEmailInput] = useState('');
  const [supplierAddressInput, setSupplierAddressInput] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Brand form states
  const [brandNameInput, setBrandNameInput] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Inventory Stats calculations
  const totalItems = products.length;
  const lowStockItemsCount = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stockQuantity <= 0).length;
  }, [products]);

  const totalCostAssetValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  }, [products]);

  const totalSaleValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockQuantity * p.salePrice), 0);
  }, [products]);

  const projectedProfit = totalSaleValue - totalCostAssetValue;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
        
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      
      const isLow = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
      const isOut = p.stockQuantity <= 0;
      
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = isLow;
      else if (stockFilter === 'out') matchesStock = isOut;
      else if (stockFilter === 'healthy') matchesStock = !isLow && !isOut;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Form Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormBarcode(Math.floor(8964000000000 + Math.random() * 999999).toString());
    setFormCategory('Groceries');
    setFormUnit('piece');
    setFormCost('100');
    setFormSale('130');
    setFormQty('50');
    setFormThreshold('10');
    setFormExpiry('');
    setFormSupplier('');
    setFormBrand('');
    setFormDiscountPercentage('0');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormUnit(p.unitType);
    setFormCost(p.costPrice.toString());
    setFormSale(p.salePrice.toString());
    setFormQty(p.stockQuantity.toString());
    setFormThreshold(p.lowStockThreshold.toString());
    setFormExpiry(p.expiryDate || '');
    setFormSupplier(p.supplier || '');
    setFormBrand(p.brand || '');
    setFormDiscountPercentage((p.discountPercentage || 0).toString());
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku) return;

    const data = {
      name: formName,
      sku: formSku,
      barcode: formBarcode || '000000000000',
      category: formCategory,
      unitType: formUnit,
      costPrice: parseFloat(formCost) || 0,
      salePrice: parseFloat(formSale) || 0,
      stockQuantity: parseFloat(formQty) || 0,
      lowStockThreshold: parseFloat(formThreshold) || 0,
      expiryDate: formExpiry || undefined,
      isQuickSelect: editingProduct ? editingProduct.isQuickSelect : false,
      supplier: formSupplier || undefined,
      brand: formBrand || undefined,
      discountPercentage: parseFloat(formDiscountPercentage) || 0
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
    setProductModalOpen(false);
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForStockIn || !stockInAmount) return;
    const qtyToAdd = parseFloat(stockInAmount) || 0;
    if (qtyToAdd > 0) {
      await adjustStock(selectedProdForStockIn.id, qtyToAdd, `Purchase Restock batch - ${new Date().toLocaleDateString()}`);
    }
    setStockInAmount('');
    setSelectedProdForStockIn(null);
    setStockInModalOpen(false);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForAdjust || !adjustAmount) return;
    const qtyToAdjust = parseFloat(adjustAmount) || 0;
    if (qtyToAdjust !== 0) {
      await adjustStock(selectedProdForAdjust.id, qtyToAdjust, adjustReason);
    }
    setAdjustAmount('');
    setAdjustReason('Inventory Count Recount');
    setSelectedProdForAdjust(null);
    setAdjustModalOpen(false);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Are you absolutely sure you want to delete "${name}"? This operation cannot be undone.`);
    if (confirm) {
      await deleteProduct(id);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierNameInput) return;

    const supData = {
      name: supplierNameInput,
      contactPerson: supplierContactInput || undefined,
      phone: supplierPhoneInput || undefined,
      email: supplierEmailInput || undefined,
      address: supplierAddressInput || undefined
    };

    if (editingSupplierId) {
      await updateSupplier(editingSupplierId, supData);
      setEditingSupplierId(null);
    } else {
      await addSupplier(supData);
    }

    setSupplierNameInput('');
    setSupplierContactInput('');
    setSupplierPhoneInput('');
    setSupplierEmailInput('');
    setSupplierAddressInput('');
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandNameInput) return;

    const brandData = {
      name: brandNameInput
    };

    if (editingBrandId) {
      await updateBrand(editingBrandId, brandData);
      setEditingBrandId(null);
    } else {
      await addBrand(brandData);
    }

    setBrandNameInput('');
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-screen">
      {/* Header section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Stock & Inventory Management</h2>
          <p className="text-sm text-slate-500 font-sans">Track and audit warehouse items, restocks, and pricing logs</p>
        </div>
        
        {activeSubTab === 'products' && (
          <button
            id="add-product-btn"
            onClick={handleOpenAddProduct}
            className="flex items-center gap-2 bg-primary hover:bg-sage-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-slate-200 mb-6 font-sans">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'products'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Products Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'suppliers'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('brands')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'brands'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Brands Directory ({brands.length})
        </button>
      </div>

      {activeSubTab === 'products' && (
        <>
        {/* Stats Summary Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Stat 1: Total Catalog Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Catalog Count</span>
            <p className="text-xl font-extrabold text-slate-850 font-mono mt-0.5">{totalItems}</p>
          </div>
        </div>

        {/* Stat 2: Stock alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${lowStockItemsCount > 0 ? 'bg-warning-amber/10 text-warning-amber' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Low Stock Items</span>
            <p className={`text-xl font-extrabold font-mono mt-0.5 ${lowStockItemsCount > 0 ? 'text-warning-amber animate-pulse' : 'text-slate-850'}`}>
              {lowStockItemsCount}
            </p>
          </div>
        </div>

        {/* Stat 3: Out of Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${outOfStockCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Out of Stock</span>
            <p className={`text-xl font-extrabold font-mono mt-0.5 ${outOfStockCount > 0 ? 'text-rose-600 font-black' : 'text-slate-850'}`}>
              {outOfStockCount}
            </p>
          </div>
        </div>

        {/* Stat 4: Cost Asset Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Cost Valuation Asset</span>
            <p className="text-xl font-extrabold text-slate-850 font-mono mt-0.5">₨ {totalCostAssetValue.toLocaleString()}</p>
          </div>
        </div>

      </div>

      {/* Filtering Actions Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400 h-4.5 w-4.5" />
            <input
              id="inventory-search-input"
              type="text"
              placeholder="Search by SKU, Name or Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-800 rounded-lg border border-slate-200 outline-none focus:border-primary transition-all font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
            {/* Category Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-mono font-bold">CAT:</span>
              <select
                id="inventory-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-semibold outline-none cursor-pointer text-xs"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Stock Levels Filter badges */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs">
              {(['all', 'low', 'out', 'healthy'] as const).map((filter) => (
                <button
                  id={`stock-filter-btn-${filter}`}
                  key={filter}
                  onClick={() => setStockFilter(filter)}
                  className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all ${
                    stockFilter === filter
                      ? 'bg-slate-800 text-white shadow-inner'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'low' ? 'Low Stock' : filter === 'out' ? 'Out of Stock' : filter}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Products Table container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <Archive className="h-12 w-12 text-slate-300 mx-auto mb-2 stroke-1" />
            <p className="text-sm font-semibold text-slate-500">No inventory products found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters or registering a new product above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider">
                  <th className="p-4">SKU / Item Name</th>
                  <th className="p-4">Barcode</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock Quantity</th>
                  <th className="p-4 text-right">Cost Price</th>
                  <th className="p-4 text-right">Sale Price</th>
                  <th className="p-4 text-center">Gross Profit Margin</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stockQuantity <= prod.lowStockThreshold && prod.stockQuantity > 0;
                  const isOut = prod.stockQuantity <= 0;
                  
                  // Margin math
                  const grossMargin = prod.salePrice > 0 
                    ? Math.round(((prod.salePrice - prod.costPrice) / prod.salePrice) * 100)
                    : 0;

                  return (
                    <tr 
                      id={`inventory-row-${prod.id}`}
                      key={prod.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isOut ? 'bg-rose-50/20' : isLow ? 'bg-warning-amber/5' : ''
                      }`}
                    >
                      {/* Name / SKU */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{prod.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.sku}</p>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="p-4 font-mono text-slate-500">{prod.barcode}</td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {prod.category}
                        </span>
                      </td>

                      {/* Stock Quantity level */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${
                            isOut ? 'text-rose-600' : isLow ? 'text-warning-amber' : 'text-slate-850'
                          }`}>
                            {prod.stockQuantity}
                            <span className="text-xs text-slate-400 font-normal ml-0.5 lowercase">
                              {prod.unitType}s
                            </span>
                          </span>

                          {/* Level pill */}
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-black uppercase font-mono">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded bg-warning-amber/10 text-warning-amber border border-warning-amber/20 text-[9px] font-black uppercase font-mono animate-pulse">
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="p-4 text-right font-mono text-slate-500">
                        ₨ {prod.costPrice.toLocaleString()}
                      </td>

                      {/* Sale */}
                      <td className="p-4 text-right font-mono font-bold text-slate-850">
                        ₨ {prod.salePrice.toLocaleString()}
                      </td>

                      {/* Gross profit margin */}
                      <td className="p-4 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          grossMargin >= 25 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : grossMargin >= 15
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {grossMargin}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock-In button */}
                          <button
                            id={`stock-in-btn-${prod.id}`}
                            onClick={() => {
                              setSelectedProdForStockIn(prod);
                              setStockInAmount('50');
                              setStockInModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Restock: Add inventory items"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            <span>Stock In</span>
                          </button>

                          {/* Stock Adjustment corrections button */}
                          <button
                            id={`adjust-btn-${prod.id}`}
                            onClick={() => {
                              setSelectedProdForAdjust(prod);
                              setAdjustAmount('-1');
                              setAdjustReason('Damaged Transit Box');
                              setAdjustModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Manual stock count adjust corrections"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Adjust</span>
                          </button>

                          {/* Edit Product */}
                          <button
                            id={`edit-prod-btn-${prod.id}`}
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Product Fields"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            id={`delete-prod-btn-${prod.id}`}
                            onClick={() => handleDeleteClick(prod.id, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Delete Product from Register"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </>
      )}

      {/* activeSubTab === 'suppliers' Bento Section */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Suppliers List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
              Registered Suppliers ({suppliers.length})
            </h3>
            
            {suppliers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans">
                <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No suppliers registered yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the form on the right to add your first supplier.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                      <th className="p-3">Company Name</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Products</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map(sup => {
                      const prodCount = products.filter(p => p.supplier === sup.name).length;
                      return (
                        <tr key={sup.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{sup.name}</span>
                            {sup.address && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{sup.address}</p>}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span>{sup.contactPerson || '-'}</span>
                            {sup.email && <p className="text-[10px] text-slate-400 mt-0.5">{sup.email}</p>}
                          </td>
                          <td className="p-3 font-mono text-slate-700">{sup.phone || '-'}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prodCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {prodCount} items
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingSupplierId(sup.id);
                                  setSupplierNameInput(sup.name);
                                  setSupplierContactInput(sup.contactPerson || '');
                                  setSupplierPhoneInput(sup.phone || '');
                                  setSupplierEmailInput(sup.email || '');
                                  setSupplierAddressInput(sup.address || '');
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                                title="Edit Supplier"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${sup.name}?`)) {
                                    deleteSupplier(sup.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete Supplier"
                              >
                                <X className="h-3.5 w-3.5" />
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
              {editingSupplierId ? '✍️ Edit Supplier' : '➕ Register New Supplier'}
            </h3>
            <form onSubmit={handleSupplierSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Supplier / Distributor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shan Foods Karachi Ltd"
                  value={supplierNameInput}
                  onChange={(e) => setSupplierNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Khurram Shahzad"
                  value={supplierContactInput}
                  onChange={(e) => setSupplierContactInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Phone / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0321-1234567"
                  value={supplierPhoneInput}
                  onChange={(e) => setSupplierPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. khurram@shanfoods.com"
                  value={supplierEmailInput}
                  onChange={(e) => setSupplierEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Warehouse Address
                </label>
                <textarea
                  placeholder="e.g. F-265, S.I.T.E., Karachi"
                  value={supplierAddressInput}
                  onChange={(e) => setSupplierAddressInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
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
                    className="flex-1 py-2 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-sage-dark text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingSupplierId ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* activeSubTab === 'brands' Bento Section */}
      {activeSubTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Brands List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
              Registered Brands ({brands.length})
            </h3>
            
            {brands.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans">
                <Archive className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No brands registered yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the form on the right to add your first brand.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold font-mono border-b border-slate-200">
                      <th className="p-3">Logo Initial</th>
                      <th className="p-3">Brand Name</th>
                      <th className="p-3">Products Associated</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brands.map(br => {
                      const prodCount = products.filter(p => p.brand === br.name).length;
                      return (
                        <tr key={br.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-indigo-700 uppercase font-mono shadow-xs">
                              {br.name.slice(0, 2)}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">{br.name}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prodCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {prodCount} items
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingBrandId(br.id);
                                  setBrandNameInput(br.name);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                                title="Edit Brand"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${br.name}?`)) {
                                    deleteBrand(br.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete Brand"
                              >
                                <X className="h-3.5 w-3.5" />
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
              {editingBrandId ? '✍️ Edit Brand' : '➕ Register New Brand'}
            </h3>
            <form onSubmit={handleBrandSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tapal"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
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
                    className="flex-1 py-2 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-sage-dark text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingBrandId ? 'Save Changes' : 'Register Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-850">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Inventory Product'}
              </h4>
              <button 
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Product Title / Brand Name *
                  </label>
                  <input
                    id="form-product-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tapal Danedar Tea 450g"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    SKU Code *
                  </label>
                  <input
                    id="form-product-sku"
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Barcode number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Barcode EAN-13
                  </label>
                  <input
                    id="form-product-barcode"
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Department Category
                  </label>
                  <select
                    id="form-product-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Spices">Spices</option>
                    <option value="Cooking Essentials">Cooking Essentials</option>
                    <option value="Sauces">Sauces</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Household">Household</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                {/* Unit type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Inventory Sales Unit
                  </label>
                  <select
                    id="form-product-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                  >
                    <option value="piece">Piece / Packet / Bottle</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="meter">Meter (m)</option>
                  </select>
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Cost Price (₨) *
                  </label>
                  <input
                    id="form-product-cost"
                    type="number"
                    min="0"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Retail Sale Price (₨) *
                  </label>
                  <input
                    id="form-product-sale"
                    type="number"
                    min="0"
                    required
                    value={formSale}
                    onChange={(e) => setFormSale(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Initial Stock Level */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    In-Stock Quantity *
                  </label>
                  <input
                    id="form-product-qty"
                    type="number"
                    min="0"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Low stock threshold */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Low Stock Threshold *
                  </label>
                  <input
                    id="form-product-threshold"
                    type="number"
                    min="1"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  />
                </div>

                {/* Expiry Date */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Batch Expiration Date (Optional)
                  </label>
                  <input
                    id="form-product-expiry"
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono cursor-pointer"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Product Brand (Optional)
                  </label>
                  <select
                    id="form-product-brand"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                  >
                    <option value="">-- No Brand Selected --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Product Supplier (Optional)
                  </label>
                  <select
                    id="form-product-supplier"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                  >
                    <option value="">-- No Supplier Selected --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Offer Discount Percentage */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                    Item-Specific Offer Discount Percentage (%)
                  </label>
                  <input
                    id="form-product-discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formDiscountPercentage}
                    onChange={(e) => setFormDiscountPercentage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                    placeholder="e.g. 5, 10, 15"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="save-product-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-sage-dark rounded-lg shadow-sm cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK STOCK-IN RESTOCK */}
      {stockInModalOpen && selectedProdForStockIn && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-850">Purchase Restock (Stock In)</h4>
              <button 
                onClick={() => setSelectedProdForStockIn(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="p-5 space-y-4">
              <div className="bg-slate-900 text-white p-3.5 rounded-lg text-xs leading-relaxed font-sans">
                <span className="text-[10px] text-slate-400 font-mono font-semibold block uppercase">Active Product</span>
                <p className="font-bold text-sm mt-0.5">{selectedProdForStockIn.name}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 font-mono">
                  <span>Current Stock:</span>
                  <span>{selectedProdForStockIn.stockQuantity} {selectedProdForStockIn.unitType}s</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Restock Amount ({selectedProdForStockIn.unitType}s)
                </label>
                <input
                  id="stock-in-amount-input"
                  type="number"
                  min="1"
                  required
                  value={stockInAmount}
                  onChange={(e) => setStockInAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base text-slate-850 font-mono outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="e.g. 50"
                  autoFocus
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStockInAmount('');
                    setSelectedProdForStockIn(null);
                    setStockInModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-stock-in-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-750 rounded-lg shadow-sm"
                >
                  Apply Stock-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL ADJUSTMENT CORRECTION */}
      {adjustModalOpen && selectedProdForAdjust && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-850">Inventory Count Adjustment Correction</h4>
              <button 
                onClick={() => setSelectedProdForAdjust(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="bg-slate-950 text-slate-300 p-3.5 rounded-lg text-xs font-sans leading-relaxed">
                <span className="text-[10px] text-slate-400 font-mono font-semibold block uppercase">Correction Product</span>
                <p className="font-bold text-sm text-white mt-0.5">{selectedProdForAdjust.name}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-850 font-mono">
                  <span>Current Physical Stock:</span>
                  <span>{selectedProdForAdjust.stockQuantity} {selectedProdForAdjust.unitType}s</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Adjust Stock Amount (Positive or Negative)
                </label>
                <input
                  id="adjust-amount-input"
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-base text-slate-850 font-mono outline-none focus:border-primary focus:bg-white"
                  placeholder="e.g. -5, +3"
                  autoFocus
                />
                <span className="block text-[10px] text-slate-400 mt-1">
                  *Enter negative numbers for shrinkage, theft, breakage, or expired goods.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Audit Correction Reason *
                </label>
                <select
                  id="adjust-reason-select"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary focus:bg-white cursor-pointer font-sans"
                >
                  <option value="Inventory Count Recount">Physical Recount (Audit Correction)</option>
                  <option value="Damaged Transit Box">Damaged Transit / Broken Box</option>
                  <option value="Expired Product Disposal">Expired / Expiring Goods Disposal</option>
                  <option value="Customer Return Stock-In">Customer Return (Restock)</option>
                  <option value="Theft or Shrinkage Box">Theft / Shrinkage Box</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustAmount('');
                    setSelectedProdForAdjust(null);
                    setAdjustModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-adjust-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-lg shadow-sm"
                >
                  Apply Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
