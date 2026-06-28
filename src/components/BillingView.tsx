/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../contexts/POSContext';
import { Product, Customer, PaymentMethod, Sale } from '../types';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  Printer, 
  X, 
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  DollarSign,
  UserCheck
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const {
    products,
    customers,
    addCustomer,
    checkout,
    settings,
    currentUser
  } = usePOS();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  
  // Payment Panel States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // New Customer Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState(30000);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Get active selected customer details
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    if (!settings.taxEnabled) return 0;
    const base = cartSubtotal - discount;
    return Math.max(0, Math.round(base * (settings.taxRate / 100)));
  }, [cartSubtotal, discount, settings.taxEnabled, settings.taxRate]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discount + cartTax);
  }, [cartSubtotal, discount, cartTax]);

  // Split payment remainder
  const splitUdhaarRemainder = useMemo(() => {
    if (paymentMethod !== 'split') return 0;
    const rec = parseFloat(cashReceived) || 0;
    return Math.max(0, cartTotal - rec);
  }, [paymentMethod, cashReceived, cartTotal]);

  // Trigger quick scan simulation
  const simulateBarcodeScan = () => {
    // Select a random product
    if (products.length === 0) return;
    const randProd = products[Math.floor(Math.random() * products.length)];
    setSearchQuery(randProd.barcode);
    
    // Add directly to cart or prompt
    addToCart(randProd);
    
    // Temporarily trigger visual effect
    const btn = document.getElementById('barcode-scan-btn');
    if (btn) {
      btn.classList.add('bg-amber-600', 'text-white');
      setTimeout(() => btn.classList.remove('bg-amber-600', 'text-white'), 500);
    }
  };

  // Add to cart helper
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) return; // out of stock
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Check if exceeding stock limit
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + (product.unitType === 'piece' ? 1 : 0.5) } 
            : item
        );
      }
      return [...prev, { product, quantity: product.unitType === 'piece' ? 1 : 0.5 }];
    });
  };

  const updateCartQuantity = (productId: string, val: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(0, item.quantity + val);
          // Check stock limit
          if (newQty > item.product.stockQuantity) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleAddNewCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    addCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress || 'Karachi, Pakistan',
      creditLimit: newCustLimit
    });
    // Reset state
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustLimit(30000);
    setCustomerModalOpen(false);
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaymentMethod(selectedCustomerId === 'walk-in' ? 'cash' : 'split');
    setCashReceived('');
    setCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = () => {
    const cashVal = parseFloat(cashReceived) || 0;
    
    // Gating checks
    if (paymentMethod === 'credit' && selectedCustomerId === 'walk-in') {
      alert("Udhaar Credit payment is only available for registered customers.");
      return;
    }
    if (paymentMethod === 'split' && selectedCustomerId === 'walk-in') {
      alert("Split Payment is only available for registered customers.");
      return;
    }

    if (paymentMethod === 'split' && (cashVal < 0 || cashVal >= cartTotal)) {
      alert(`For Split Payment, Cash Collected must be between ₨ 1 and ₨ ${cartTotal - 1}`);
      return;
    }

    // Verify Credit Limit
    if (selectedCustomerId !== 'walk-in' && activeCustomer) {
      let addedUdhaar = 0;
      if (paymentMethod === 'credit') addedUdhaar = cartTotal;
      else if (paymentMethod === 'split') addedUdhaar = cartTotal - cashVal;

      if (addedUdhaar > 0) {
        const potentialTotal = activeCustomer.outstandingBalance + addedUdhaar;
        if (potentialTotal > activeCustomer.creditLimit) {
          const proceed = window.confirm(`Warning: Outstanding Udhaar balance for ${activeCustomer.name} will reach ₨ ${potentialTotal}, exceeding their credit limit of ₨ ${activeCustomer.creditLimit}. Do you still want to authorize this sale?`);
          if (!proceed) return;
        }
      }
    }

    // Call checkout from global state
    const sale = checkout(
      selectedCustomerId,
      cart,
      discount,
      cashVal,
      paymentMethod
    );

    if (sale) {
      setCompletedSale(sale);
      setCheckoutModalOpen(false);
      setCart([]);
      setDiscount(0);
      setSelectedCustomerId('walk-in');
      setShowReceipt(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      
      {/* LEFT PANEL: PRODUCTS & FILTERS */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Header Block */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Register</h2>
            <p className="text-sm text-slate-500 font-sans">Quickly search and ring up customer products</p>
          </div>
          
          {/* Barcode scanner action button */}
          <div className="flex gap-2">
            <button
              id="barcode-scan-btn"
              onClick={simulateBarcodeScan}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-slate-300 shadow-sm"
              title="Simulate scanning a random barcode from retail inventory"
            >
              <Barcode className="h-4.5 w-4.5 text-slate-600" />
              <span>Simulate Barcode Scan</span>
            </button>
          </div>
        </div>

        {/* Search bar & Categories filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400 h-5 w-5" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search by Name, SKU code or scan Barcode (e.g. Shan, Tapal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm text-slate-800 rounded-lg border border-slate-200 outline-none focus:border-primary transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 font-semibold"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {/* Categories bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                id={`category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500 font-sans">No products match your search</p>
              <p className="text-xs text-slate-400 mt-1 font-sans">Try another keyword or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {filteredProducts.map((prod) => {
                const isLowStock = prod.stockQuantity <= prod.lowStockThreshold;
                const isOutOfStock = prod.stockQuantity <= 0;
                
                return (
                  <button
                    id={`product-card-${prod.id}`}
                    key={prod.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(prod)}
                    className={`bg-white border text-left p-4 rounded-xl shadow-xs transition-all flex flex-col justify-between h-40 select-none relative group ${
                      isOutOfStock 
                        ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed' 
                        : 'border-slate-200 hover:border-primary/50 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Expiry Tag */}
                    {prod.expiryDate && (
                      <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold font-mono border border-purple-100">
                        Exp: {prod.expiryDate}
                      </span>
                    )}

                    {/* Stock Alert Badge */}
                    {isOutOfStock ? (
                      <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black font-mono border border-rose-100">
                        Sold Out
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-md bg-warning-amber/10 text-warning-amber font-black font-mono border border-warning-amber/20 animate-pulse">
                        Low Stock ({prod.stockQuantity})
                      </span>
                    ) : null}

                    <div className="mt-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-1 group-hover:text-primary transition-colors">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Price</span>
                        <p className="text-sm font-black text-slate-900 font-mono leading-none mt-1">
                          ₨ {prod.salePrice.toLocaleString()}
                          <span className="text-[11px] text-slate-500 font-normal ml-0.5 font-sans">
                            /{prod.unitType}
                          </span>
                        </p>
                      </div>
                      
                      <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 group-hover:bg-primary group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-sm">
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT PANEL */}
      <div id="cart-panel-container" className="w-full md:w-[420px] bg-white border-l border-slate-200 flex flex-col justify-between shadow-2xl shrink-0 h-screen">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-800">Shopping Cart</h3>
            <span className="bg-slate-200 text-slate-800 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + (item.product.unitType === 'piece' ? item.quantity : 1), 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])} 
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 font-sans cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
          )}
        </div>

        {/* Customer Select Bar */}
        <div className="p-4 border-b border-slate-100 bg-primary/5 flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">
              Customer Account
            </label>
            <select
              id="customer-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs font-medium bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="walk-in">Walk-in Customer (Cash Sale)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — Bal: ₨ {c.outstandingBalance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="mt-5 p-2 rounded-xl bg-primary text-white hover:bg-sage-dark transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            title="Register new customer"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <ShoppingCart className="h-12 w-12 text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-500 font-sans">Your Cart is Empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Tap on product cards on the left or scan barcodes to begin a sale.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id} 
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-xl"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h5 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h5>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ₨ {item.product.salePrice.toLocaleString()} / {item.product.unitType}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-inner overflow-hidden h-8">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.product.unitType === 'piece' ? -1 : -0.5)}
                      className="px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 h-full"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold font-mono text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.product.unitType === 'piece' ? 1 : 0.5)}
                      className="px-2 text-slate-500 hover:text-slate-850 hover:bg-slate-50 h-full"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Pricing */}
                  <div className="w-20 text-right">
                    <p className="text-xs font-extrabold text-slate-900 font-mono">
                      ₨ {(item.product.salePrice * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shadow-lg">
          <div className="space-y-2 border-b border-slate-200/80 pb-3 mb-3">
            
            {/* Subtotal */}
            <div className="flex justify-between text-xs font-medium text-slate-600 font-sans">
              <span>Subtotal</span>
              <span className="font-mono text-slate-800">₨ {cartSubtotal.toLocaleString()}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 font-sans">
              <span className="flex items-center gap-1.5">
                Discount (₨)
              </span>
              <input
                id="discount-input"
                type="number"
                min="0"
                max={cartSubtotal}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.min(cartSubtotal, Math.max(0, parseInt(e.target.value) || 0)))}
                placeholder="0"
                className="w-20 text-right font-mono bg-white text-xs border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Tax Row */}
            {settings.taxEnabled && (
              <div className="flex justify-between text-xs font-medium text-slate-600 font-sans">
                <span>Tax ({settings.taxLabel} {settings.taxRate}%)</span>
                <span className="font-mono text-slate-850">₨ {cartTax.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Grand Total</span>
            <span className="text-xl font-black text-slate-950 font-mono">
              ₨ {cartTotal.toLocaleString()}
            </span>
          </div>

          {/* Action Trigger Button */}
          <button
            id="pay-button"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className={`w-full py-3.5 text-center font-bold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md uppercase tracking-wider ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-primary hover:bg-sage-dark text-white cursor-pointer hover:shadow-lg active:scale-98'
            }`}
          >
            <span>Proceed to Payment</span>
            <CheckCircle className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* MODAL 1: ADD NEW CUSTOMER */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-800">Register New Customer</h4>
              <button 
                onClick={() => setCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddNewCustomerSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Customer Name *
                </label>
                <input
                  id="new-customer-name"
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="Mohammad Farhan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Mobile Number *
                </label>
                <input
                  id="new-customer-phone"
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="03XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Home/Shop Address
                </label>
                <input
                  id="new-customer-address"
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white"
                  placeholder="Street 3, Gulshan, Karachi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
                  Udhaar Credit Limit (₨)
                </label>
                <input
                  id="new-customer-limit"
                  type="number"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(parseInt(e.target.value) || 10000)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white font-mono"
                  min="5000"
                  max="500000"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="save-new-customer"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-sage-dark rounded-lg shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE PAYMENT PANEL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-150 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-base font-bold text-slate-800">Payment Checkout</h4>
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Bill Details Banner */}
              <div className="flex justify-between items-center bg-slate-gray text-white p-4 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-200 tracking-wider font-mono">Invoice Total</span>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">Customer: {activeCustomer?.name || 'Walk-in (Cash)'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono">₨ {cartTotal.toLocaleString()}</p>
                </div>
              </div>

              {/* Select Payment Method Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">
                  Select Payment Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Cash */}
                  <button
                    id="payment-mode-cash"
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setCashReceived('');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs font-bold">Cash Sale</span>
                  </button>

                  {/* Card */}
                  <button
                    id="payment-mode-card"
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setCashReceived('');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-tertiary bg-tertiary/10 text-tertiary ring-2 ring-tertiary/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-bold">Card/POS</span>
                  </button>

                  {/* Udhaar (Credit) */}
                  <button
                    id="payment-mode-credit"
                    type="button"
                    disabled={selectedCustomerId === 'walk-in'}
                    onClick={() => {
                      setPaymentMethod('credit');
                      setCashReceived('');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                      selectedCustomerId === 'walk-in'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : paymentMethod === 'credit'
                        ? 'border-warning-amber bg-warning-amber/10 text-warning-amber ring-2 ring-warning-amber/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 cursor-pointer'
                    }`}
                    title={selectedCustomerId === 'walk-in' ? 'Register a customer first to use Udhaar' : ''}
                  >
                    <UserCheck className="h-5 w-5" />
                    <span className="text-xs font-bold">Full Udhaar</span>
                  </button>

                  {/* Split (Part Cash, Part Udhaar) */}
                  <button
                    id="payment-mode-split"
                    type="button"
                    disabled={selectedCustomerId === 'walk-in'}
                    onClick={() => {
                      setPaymentMethod('split');
                      setCashReceived('');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                      selectedCustomerId === 'walk-in'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : paymentMethod === 'split'
                        ? 'border-warning-amber bg-warning-amber/10 text-warning-amber ring-2 ring-warning-amber/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 cursor-pointer'
                    }`}
                    title={selectedCustomerId === 'walk-in' ? 'Register a customer first to use split checkout' : ''}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-xs font-bold">Split Udhaar</span>
                  </button>

                </div>
              </div>

              {/* Conditional Inputs based on mode */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Cash Received from Customer (₨)
                    </label>
                    <input
                      id="cash-received-input"
                      type="number"
                      placeholder={`Total: ₨ ${cartTotal}`}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base text-slate-800 font-mono outline-none focus:border-emerald-500"
                    />
                    {parseFloat(cashReceived) >= cartTotal && (
                      <div className="flex justify-between text-sm font-semibold text-emerald-700 pt-1">
                        <span>Change Due back:</span>
                        <span>₨ {(parseFloat(cashReceived) - cartTotal).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <p className="text-xs text-slate-500 font-sans text-center py-2">
                    Please swipe/tap the customer card on the Bank Terminal device. Press **Confirm** once authorized.
                  </p>
                )}

                {paymentMethod === 'credit' && activeCustomer && (
                  <div className="text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Outstanding balance:</span>
                      <span className="font-mono font-semibold text-slate-800">₨ {activeCustomer.outstandingBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Udhaar added after this purchase:</span>
                      <span className="font-mono font-bold text-rose-600">₨ {cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-1.5 font-semibold text-slate-800">
                      <span>Projected Udhaar balance:</span>
                      <span className="font-mono">₨ {(activeCustomer.outstandingBalance + cartTotal).toLocaleString()} / ₨ {activeCustomer.creditLimit.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'split' && activeCustomer && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Cash Amount Collected Now (₨)
                      </label>
                      <input
                        id="split-cash-received"
                        type="number"
                        placeholder="e.g. 1000"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base text-slate-800 font-mono outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between text-slate-600 font-sans">
                        <span>Remaining Balance to add to Udhaar:</span>
                        <span className="font-mono font-bold text-rose-600">₨ {splitUdhaarRemainder.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-sans">
                        <span>Current Customer Owed:</span>
                        <span className="font-mono font-semibold text-slate-800">₨ {activeCustomer.outstandingBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200/30 pt-1.5">
                        <span>New Projected Udhaar balance:</span>
                        <span className="font-mono">₨ {(activeCustomer.outstandingBalance + splitUdhaarRemainder).toLocaleString()} / ₨ {activeCustomer.creditLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Warning label if over-limit */}
              {selectedCustomerId !== 'walk-in' && activeCustomer && paymentMethod !== 'card' && (
                (() => {
                  const addedVal = paymentMethod === 'credit' ? cartTotal : splitUdhaarRemainder;
                  if (activeCustomer.outstandingBalance + addedVal > activeCustomer.creditLimit) {
                    return (
                      <div className="flex gap-2.5 items-start bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-100 text-xs">
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                        <div>
                          <p className="font-bold">Over Limit Warning!</p>
                          <p className="mt-0.5 leading-relaxed text-rose-600">This customer will exceed their authorized credit limit of ₨ {activeCustomer.creditLimit.toLocaleString()}. Requires supervisor check.</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="confirm-checkout-btn"
                  onClick={handleConfirmCheckout}
                  className="px-6 py-2.5 text-xs font-bold bg-slate-gray hover:bg-slate-700 text-white rounded-lg shadow-md uppercase tracking-wider cursor-pointer"
                >
                  Authorize Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVOICE THERMAL RECEIPT SLIDE-IN */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-slate-100 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-150 overflow-hidden flex flex-col h-[90vh]">
            
            {/* Header Dialog Controls */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Sale Completed!
              </span>
              <button 
                onClick={() => {
                  setShowReceipt(false);
                  setCompletedSale(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Printed Thermal Receipt */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div 
                id="thermal-receipt" 
                className="w-full bg-white p-5 border border-slate-200 shadow-sm rounded-lg font-mono text-xs text-slate-800 leading-relaxed flex flex-col"
                style={{ fontFamily: 'monospace' }}
              >
                {/* Header info */}
                <div className="text-center space-y-1 mb-4 border-b border-dashed border-slate-300 pb-4">
                  <h5 className="font-extrabold text-base tracking-tighter text-slate-900">{settings.businessName}</h5>
                  <p className="text-[10px] text-slate-500 whitespace-pre-wrap">{settings.receiptHeader}</p>
                  <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
                  <p className="text-[10px] text-slate-500">{settings.address}</p>
                </div>

                {/* Receipt metadata */}
                <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span>{completedSale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date/Time:</span>
                    <span>{new Date(completedSale.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{completedSale.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                </div>

                {/* Sales list table */}
                <div className="border-b border-dashed border-slate-300 pb-3 mb-3 text-[10px]">
                  <div className="flex font-bold pb-1.5 mb-1.5 border-b border-slate-200">
                    <span className="flex-1">Item Name</span>
                    <span className="w-12 text-center">Qty</span>
                    <span className="w-16 text-right">Total</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {completedSale.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-slate-900">{it.productName}</p>
                          <p className="text-[9px] text-slate-500">₨ {it.salePrice.toLocaleString()} / {it.unitType}</p>
                        </div>
                        <span className="w-12 text-center">{it.quantity}</span>
                        <span className="w-16 text-right font-bold">₨ {it.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculations summary */}
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₨ {completedSale.subtotal.toLocaleString()}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span>-₨ {completedSale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {settings.taxEnabled && (
                    <div className="flex justify-between">
                      <span>{settings.taxLabel} ({settings.taxRate}%):</span>
                      <span>₨ {completedSale.tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                    <span>TOTAL:</span>
                    <span>₨ {completedSale.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Ledger balances if any */}
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-3 mb-3 bg-slate-50 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="uppercase font-bold text-slate-900">{completedSale.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>₨ {completedSale.amountPaid.toLocaleString()}</span>
                  </div>
                  {completedSale.creditAmount > 0 && (
                    <>
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Added to Udhaar:</span>
                        <span>₨ {completedSale.creditAmount.toLocaleString()}</span>
                      </div>
                      {activeCustomer && (
                        <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-700">
                          <span>Updated Outstanding Owed:</span>
                          <span>₨ {activeCustomer.outstandingBalance.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer details */}
                <div className="text-center text-[10px] text-slate-500 mt-auto pt-4 space-y-1">
                  <p className="whitespace-pre-wrap">{settings.receiptFooter}</p>
                  <p className="text-[8px] font-bold tracking-wider text-slate-400 mt-2">*** CUSTOMER COPY ***</p>
                </div>
              </div>
            </div>

            {/* Controls panel */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setCompletedSale(null);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-sage-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase tracking-wide cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
