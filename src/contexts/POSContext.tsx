/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  CustomerLedgerEntry,
  Sale,
  BusinessSettings,
  StaffUser,
  Subscription,
  PaymentMethod,
  SaleItem,
  PLAN_FEATURES
} from '../types';

interface POSContextType {
  products: Product[];
  customers: Customer[];
  ledger: CustomerLedgerEntry[];
  sales: Sale[];
  settings: BusinessSettings;
  staff: StaffUser[];
  currentUser: StaffUser;
  subscription: Subscription;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
  triggerSync: () => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, amount: number, reason: string) => void;
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  receivePayment: (customerId: string, amount: number, reference: string) => void;
  
  // Billing actions
  checkout: (
    customerId: string,
    cartItems: { product: Product; quantity: number }[],
    discount: number,
    amountPaid: number,
    paymentMethod: PaymentMethod
  ) => Sale | null;
  
  // Staff actions
  addStaff: (name: string, email: string, role: 'owner' | 'manager' | 'cashier') => void;
  setCurrentUser: (user: StaffUser) => void;
  
  // Subscription actions
  changePlan: (plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise') => void;
  resetTrial: () => void;
  
  // Settings actions
  updateSettings: (updates: Partial<BusinessSettings>) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Seeds for product catalog
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Tapal Danedar Tea 950g',
    sku: 'TAP-DAN-950',
    barcode: '8964000123456',
    category: 'Groceries',
    unitType: 'piece',
    costPrice: 1100,
    salePrice: 1350,
    stockQuantity: 45,
    lowStockThreshold: 10,
    isQuickSelect: true
  },
  {
    id: 'prod-2',
    name: 'Shan Biryani Masala 50g',
    sku: 'SHN-BRY-050',
    barcode: '8964000123412',
    category: 'Spices',
    unitType: 'piece',
    costPrice: 90,
    salePrice: 120,
    stockQuantity: 120,
    lowStockThreshold: 15,
    isQuickSelect: true
  },
  {
    id: 'prod-3',
    name: 'Habib Cooking Oil 5L',
    sku: 'HAB-OIL-05L',
    barcode: '8964000123511',
    category: 'Cooking Essentials',
    unitType: 'piece',
    costPrice: 2450,
    salePrice: 2750,
    stockQuantity: 18,
    lowStockThreshold: 5,
    expiryDate: '2027-04-12',
    isQuickSelect: true
  },
  {
    id: 'prod-4',
    name: 'National Chilli Garlic Sauce 500g',
    sku: 'NAT-CGS-500',
    barcode: '8964000123610',
    category: 'Sauces',
    unitType: 'piece',
    costPrice: 310,
    salePrice: 380,
    stockQuantity: 8,
    lowStockThreshold: 10,
    isQuickSelect: true
  },
  {
    id: 'prod-5',
    name: 'Dawn Bread Large',
    sku: 'DWN-BRD-LRG',
    barcode: '8964000123719',
    category: 'Bakery',
    unitType: 'piece',
    costPrice: 160,
    salePrice: 190,
    stockQuantity: 25,
    lowStockThreshold: 8,
    expiryDate: '2026-07-04',
    isQuickSelect: true
  },
  {
    id: 'prod-6',
    name: 'Knorr Noodles Chatpatta 1-Pack',
    sku: 'KNR-NDL-CHT',
    barcode: '8964000123818',
    category: 'Snacks',
    unitType: 'piece',
    costPrice: 45,
    salePrice: 60,
    stockQuantity: 150,
    lowStockThreshold: 20,
    isQuickSelect: true
  },
  {
    id: 'prod-7',
    name: 'Olper\'s Milk 1L',
    sku: 'OLP-MLK-01L',
    barcode: '8964000123917',
    category: 'Dairy',
    unitType: 'piece',
    costPrice: 240,
    salePrice: 290,
    stockQuantity: 60,
    lowStockThreshold: 12,
    isQuickSelect: true
  },
  {
    id: 'prod-8',
    name: 'Surf Excel Powder 1kg',
    sku: 'SRF-EXC-01K',
    barcode: '8964000124013',
    category: 'Household',
    unitType: 'piece',
    costPrice: 520,
    salePrice: 640,
    stockQuantity: 30,
    lowStockThreshold: 8,
    isQuickSelect: true
  },
  {
    id: 'prod-9',
    name: 'Loose Basmati Rice (Premium)',
    sku: 'RIC-BAS-LSE',
    barcode: '0000000000009',
    category: 'Groceries',
    unitType: 'kg',
    costPrice: 280,
    salePrice: 350,
    stockQuantity: 240,
    lowStockThreshold: 50,
    isQuickSelect: false
  },
  {
    id: 'prod-10',
    name: 'Mitchell\'s Mixed Fruit Jam 340g',
    sku: 'MIT-JAM-340',
    barcode: '8964000124112',
    category: 'Bakery',
    unitType: 'piece',
    costPrice: 290,
    salePrice: 360,
    stockQuantity: 4,
    lowStockThreshold: 6,
    expiryDate: '2026-12-18',
    isQuickSelect: false
  }
];

// Seeds for customers list
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mohammad Farooq',
    phone: '0300-1234567',
    address: 'Apartment B-12, Gulshan-e-Iqbal, Karachi',
    creditLimit: 25000,
    outstandingBalance: 12450
  },
  {
    id: 'cust-2',
    name: 'Ayesha Khan',
    phone: '0321-7654321',
    address: 'House 45-C, Lane 4, DHA Phase 6, Karachi',
    creditLimit: 50000,
    outstandingBalance: 0
  },
  {
    id: 'cust-3',
    name: 'Kamran Kirana Store',
    phone: '0333-9876543',
    address: 'Shop No. 4, Jodia Bazar, Karachi',
    creditLimit: 150000,
    outstandingBalance: 84300
  },
  {
    id: 'cust-4',
    name: 'Zahid Ahmed',
    phone: '0312-4455667',
    address: 'Flat 402, Block 13-D, Gulistan-e-Johar, Karachi',
    creditLimit: 15000,
    outstandingBalance: 1200
  }
];

// Seeds for customer ledger history
const INITIAL_LEDGER: CustomerLedgerEntry[] = [
  {
    id: 'led-1',
    customerId: 'cust-1',
    date: '2026-06-20T11:30:00Z',
    type: 'credit_sale',
    amount: 15450,
    balanceAfter: 15450,
    description: 'Sale invoice #INV-1001 (Udhaar purchase)'
  },
  {
    id: 'led-2',
    customerId: 'cust-1',
    date: '2026-06-22T16:45:00Z',
    type: 'payment',
    amount: 3000,
    balanceAfter: 12450,
    description: 'Cash payment received - Farooq'
  },
  {
    id: 'led-3',
    customerId: 'cust-3',
    date: '2026-06-15T10:00:00Z',
    type: 'credit_sale',
    amount: 114300,
    balanceAfter: 114300,
    description: 'Bulk order invoice #INV-1002'
  },
  {
    id: 'led-4',
    customerId: 'cust-3',
    date: '2026-06-19T14:15:00Z',
    type: 'payment',
    amount: 30000,
    balanceAfter: 84300,
    description: 'Bank transfer received - Kamran Store'
  },
  {
    id: 'led-5',
    customerId: 'cust-4',
    date: '2026-06-25T19:20:00Z',
    type: 'credit_sale',
    amount: 3200,
    balanceAfter: 3200,
    description: 'Sale invoice #INV-1003'
  },
  {
    id: 'led-6',
    customerId: 'cust-4',
    date: '2026-06-27T11:10:00Z',
    type: 'payment',
    amount: 2000,
    balanceAfter: 1200,
    description: 'Cash payment received - Zahid'
  }
];

// Seeds for previous sales
const INITIAL_SALES: Sale[] = [
  {
    id: 'INV-1001',
    date: '2026-06-20T11:30:00Z',
    customerId: 'cust-1',
    customerName: 'Mohammad Farooq',
    items: [
      { productId: 'prod-1', productName: 'Tapal Danedar Tea 950g', quantity: 2, unitType: 'piece', salePrice: 1350, total: 2700 },
      { productId: 'prod-3', productName: 'Habib Cooking Oil 5L', quantity: 4, unitType: 'piece', salePrice: 2750, total: 11000 },
      { productId: 'prod-8', productName: 'Surf Excel Powder 1kg', quantity: 2, unitType: 'piece', salePrice: 640, total: 1280 }
    ],
    subtotal: 14980,
    discount: 500,
    tax: 970, // ~6.5% standard tax simulation
    total: 15450,
    amountPaid: 0,
    creditAmount: 15450,
    paymentMethod: 'credit',
    cashierName: 'Ammar (Cashier)'
  },
  {
    id: 'INV-1004',
    date: '2026-06-27T15:40:00Z',
    customerId: 'walk-in',
    customerName: 'Walk-in Customer',
    items: [
      { productId: 'prod-2', productName: 'Shan Biryani Masala 50g', quantity: 5, unitType: 'piece', salePrice: 120, total: 600 },
      { productId: 'prod-6', productName: 'Knorr Noodles Chatpatta 1-Pack', quantity: 10, unitType: 'piece', salePrice: 60, total: 600 },
      { productId: 'prod-7', productName: 'Olper\'s Milk 1L', quantity: 3, unitType: 'piece', salePrice: 290, total: 870 }
    ],
    subtotal: 2070,
    discount: 0,
    tax: 130,
    total: 2200,
    amountPaid: 2200,
    creditAmount: 0,
    paymentMethod: 'cash',
    cashierName: 'Ammar (Cashier)'
  },
  {
    id: 'INV-1005',
    date: '2026-06-28T09:15:00Z',
    customerId: 'walk-in',
    customerName: 'Walk-in Customer',
    items: [
      { productId: 'prod-1', productName: 'Tapal Danedar Tea 950g', quantity: 1, unitType: 'piece', salePrice: 1350, total: 1350 },
      { productId: 'prod-5', productName: 'Dawn Bread Large', quantity: 2, unitType: 'piece', salePrice: 190, total: 380 }
    ],
    subtotal: 1730,
    discount: 50,
    tax: 110,
    total: 1790,
    amountPaid: 1790,
    creditAmount: 0,
    paymentMethod: 'card',
    cashierName: 'Zainab (Manager)'
  }
];

// Staff users
const INITIAL_STAFF: StaffUser[] = [
  { id: 'user-1', name: 'Abdul Haseeb', email: 'owner@zappos.pk', role: 'owner', dateAdded: '2026-06-01', status: 'active' },
  { id: 'user-2', name: 'Zainab Fatima', email: 'zainab@zappos.pk', role: 'manager', dateAdded: '2026-06-10', status: 'active' },
  { id: 'user-3', name: 'Ammar Siddiqui', email: 'ammar@zappos.pk', role: 'cashier', dateAdded: '2026-06-15', status: 'active' }
];

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser>(INITIAL_STAFF[0]);
  const [activeTab, setActiveTab] = useState<string>('billing');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "Karachi Super Mart",
    address: "Block 4, Gulshan-e-Iqbal, Karachi",
    phone: "021-34567890",
    currency: "₨",
    taxEnabled: true,
    taxRate: 6.5, // % GST standard retail Karachi
    taxLabel: "SRB/GST",
    receiptHeader: "WELCOME TO KARACHI SUPER MART\nYour One-Stop Shop for Quality Groceries",
    receiptFooter: "Thank you for shopping with us!\nSoftware Powered by ZapPOS (0300-ZAPPOS)",
    lowStockAlertEnabled: true
  });

  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'Standard',
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days left
    currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price: "₨ 5,000"
  });

  // Load from localStorage on mount
  useEffect(() => {
    const localProds = localStorage.getItem('zappos_products');
    const localCusts = localStorage.getItem('zappos_customers');
    const localLedger = localStorage.getItem('zappos_ledger');
    const localSales = localStorage.getItem('zappos_sales');
    const localStaff = localStorage.getItem('zappos_staff');
    const localCurrentUser = localStorage.getItem('zappos_currentUser');
    const localSettings = localStorage.getItem('zappos_settings');
    const localSub = localStorage.getItem('zappos_subscription');

    if (localProds) setProducts(JSON.parse(localProds));
    else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('zappos_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (localCusts) setCustomers(JSON.parse(localCusts));
    else {
      setCustomers(INITIAL_CUSTOMERS);
      localStorage.setItem('zappos_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }

    if (localLedger) setLedger(JSON.parse(localLedger));
    else {
      setLedger(INITIAL_LEDGER);
      localStorage.setItem('zappos_ledger', JSON.stringify(INITIAL_LEDGER));
    }

    if (localSales) setSales(JSON.parse(localSales));
    else {
      setSales(INITIAL_SALES);
      localStorage.setItem('zappos_sales', JSON.stringify(INITIAL_SALES));
    }

    if (localStaff) setStaff(JSON.parse(localStaff));
    else {
      setStaff(INITIAL_STAFF);
      localStorage.setItem('zappos_staff', JSON.stringify(INITIAL_STAFF));
    }

    if (localCurrentUser) {
      setCurrentUser(JSON.parse(localCurrentUser));
    } else {
      setCurrentUser(INITIAL_STAFF[0]);
    }

    if (localSettings) setSettings(JSON.parse(localSettings));
    if (localSub) setSubscription(JSON.parse(localSub));
  }, []);

  // Save changes helper
  const saveToLocal = (key: string, value: any, setter: Function) => {
    setter(value);
    localStorage.setItem(key, JSON.stringify(value));
    
    // Simulate active Cloud syncing animation
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 800);
  };

  const triggerSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 1500);
  };

  // Product Actions
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`
    };
    const updated = [newProduct, ...products];
    saveToLocal('zappos_products', updated, setProducts);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    saveToLocal('zappos_products', updated, setProducts);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveToLocal('zappos_products', updated, setProducts);
  };

  const adjustStock = (productId: string, amount: number, reason: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity + amount)
        };
      }
      return p;
    });
    saveToLocal('zappos_products', updated, setProducts);
  };

  // Customer Actions
  const addCustomer = (c: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...c,
      id: `cust-${Date.now()}`,
      outstandingBalance: 0
    };
    const updated = [newCustomer, ...customers];
    saveToLocal('zappos_customers', updated, setCustomers);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    saveToLocal('zappos_customers', updated, setCustomers);
  };

  const receivePayment = (customerId: string, amount: number, reference: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newBalance = Math.max(0, customer.outstandingBalance - amount);
    
    // Update Customer Balance
    const updatedCusts = customers.map(c => 
      c.id === customerId ? { ...c, outstandingBalance: newBalance } : c
    );
    saveToLocal('zappos_customers', updatedCusts, setCustomers);

    // Create Ledger Entry
    const newLedgerEntry: CustomerLedgerEntry = {
      id: `led-${Date.now()}`,
      customerId,
      date: new Date().toISOString(),
      type: 'payment',
      amount,
      balanceAfter: newBalance,
      description: `Payment received: ${reference}`
    };
    const updatedLedger = [newLedgerEntry, ...ledger];
    saveToLocal('zappos_ledger', updatedLedger, setLedger);
  };

  // Billing & Checkout Actions
  const checkout = (
    customerId: string,
    cartItems: { product: Product; quantity: number }[],
    discount: number,
    amountPaid: number,
    paymentMethod: PaymentMethod
  ): Sale | null => {
    if (cartItems.length === 0) return null;

    // 1. Calculate totals
    const subtotal = cartItems.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
    const tax = settings.taxEnabled ? Math.round((subtotal - discount) * (settings.taxRate / 100)) : 0;
    const total = subtotal - discount + tax;

    // Double check Udhaar limits & update customer profile
    let creditAmount = 0;
    let customerName = "Walk-in Customer";

    if (customerId !== 'walk-in') {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        customerName = customer.name;
        
        if (paymentMethod === 'credit') {
          creditAmount = total;
        } else if (paymentMethod === 'split') {
          creditAmount = Math.max(0, total - amountPaid);
        }

        if (creditAmount > 0) {
          const projectedBalance = customer.outstandingBalance + creditAmount;
          // Check credit limit
          if (projectedBalance > customer.creditLimit) {
            // Warn, but for POS ease we'll block or allow with notification
          }

          // Update Customer
          const updatedCusts = customers.map(c => 
            c.id === customerId ? { ...c, outstandingBalance: projectedBalance } : c
          );
          saveToLocal('zappos_customers', updatedCusts, setCustomers);

          // Add Ledger entry
          const newLedgerEntry: CustomerLedgerEntry = {
            id: `led-${Date.now()}`,
            customerId,
            date: new Date().toISOString(),
            type: 'credit_sale',
            amount: creditAmount,
            balanceAfter: projectedBalance,
            description: `Invoice #${sales.length + 1006} (Udhaar Credit Purchase)`
          };
          // Save ledger below
          setLedger(prev => {
            const up = [newLedgerEntry, ...prev];
            localStorage.setItem('zappos_ledger', JSON.stringify(up));
            return up;
          });
        }
      }
    }

    // 2. Decrement stock quantities atomically
    const updatedProds = products.map(p => {
      const cartItem = cartItems.find(item => item.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity)
        };
      }
      return p;
    });
    saveToLocal('zappos_products', updatedProds, setProducts);

    // 3. Register Sale record
    const saleItems: SaleItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitType: item.product.unitType,
      salePrice: item.product.salePrice,
      total: item.product.salePrice * item.quantity
    }));

    const newSale: Sale = {
      id: `INV-${sales.length + 1006}`,
      date: new Date().toISOString(),
      customerId,
      customerName,
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      amountPaid: paymentMethod === 'credit' ? 0 : (paymentMethod === 'split' ? amountPaid : total),
      creditAmount,
      paymentMethod,
      cashierName: `${currentUser.name} (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})`
    };

    const updatedSales = [newSale, ...sales];
    saveToLocal('zappos_sales', updatedSales, setSales);

    return newSale;
  };

  // Staff User Actions
  const addStaff = (name: string, email: string, role: 'owner' | 'manager' | 'cashier') => {
    const newMember: StaffUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'invited'
    };
    const updated = [...staff, newMember];
    saveToLocal('zappos_staff', updated, setStaff);
  };

  const handleSetCurrentUser = (user: StaffUser) => {
    setCurrentUser(user);
    localStorage.setItem('zappos_currentUser', JSON.stringify(user));
  };

  // Subscription Actions
  const changePlan = (plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise') => {
    const updated: Subscription = {
      plan,
      status: 'active',
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: PLAN_FEATURES[plan].price
    };
    saveToLocal('zappos_subscription', updated, setSubscription);
  };

  const resetTrial = () => {
    const updated: Subscription = {
      plan: 'Starter',
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      price: "₨ 2,500"
    };
    saveToLocal('zappos_subscription', updated, setSubscription);
  };

  // Settings Actions
  const updateSettings = (updates: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...updates };
    saveToLocal('zappos_settings', updated, setSettings);
  };

  return (
    <POSContext.Provider
      value={{
        products,
        customers,
        ledger,
        sales,
        settings,
        staff,
        currentUser,
        subscription,
        activeTab,
        setActiveTab,
        syncStatus,
        triggerSync,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        receivePayment,
        checkout,
        addStaff,
        setCurrentUser: handleSetCurrentUser,
        changePlan,
        resetTrial,
        updateSettings
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
