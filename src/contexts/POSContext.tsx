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
  isLoading: boolean;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, amount: number, reason: string) => Promise<void>;
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  receivePayment: (customerId: string, amount: number, reference: string) => Promise<void>;
  
  // Billing actions
  checkout: (
    customerId: string,
    cartItems: { product: Product; quantity: number }[],
    discount: number,
    amountPaid: number,
    paymentMethod: PaymentMethod
  ) => Promise<Sale | null>;
  
  // Staff actions
  addStaff: (name: string, email: string, role: 'owner' | 'manager' | 'cashier') => Promise<void>;
  setCurrentUser: (user: StaffUser) => void;
  
  // Subscription actions
  changePlan: (plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise') => Promise<void>;
  resetTrial: () => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<BusinessSettings>) => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "Karachi Super Mart",
    address: "Block 4, Gulshan-e-Iqbal, Karachi",
    phone: "021-34567890",
    currency: "₨",
    taxEnabled: true,
    taxRate: 6.5,
    taxLabel: "SRB/GST",
    receiptHeader: "WELCOME TO KARACHI SUPER MART\nYour One-Stop Shop for Quality Groceries",
    receiptFooter: "Thank you for shopping with us!\nSoftware Powered by ZapPOS (0300-ZAPPOS)",
    lowStockAlertEnabled: true
  });

  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'Standard',
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price: "₨ 5,000"
  });

  // Fetch full data state from Backend on mount
  useEffect(() => {
    const fetchPOSData = async () => {
      try {
        setIsLoading(true);
        setSyncStatus('syncing');
        const res = await fetch('/api/pos-data');
        if (!res.ok) throw new Error("API response error");
        
        const data = await res.json();
        
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setLedger(data.ledger || []);
        setSales(data.sales || []);
        setStaff(data.staff || INITIAL_STAFF);
        setSettings(data.settings || DEFAULT_SETTINGS());
        setSubscription(data.subscription || DEFAULT_SUBSCRIPTION());
        
        // Handle Current User
        const localCurrentUser = localStorage.getItem('zappos_currentUser');
        if (localCurrentUser) {
          const parsed = JSON.parse(localCurrentUser);
          // Verify user still exists
          const exists = (data.staff || INITIAL_STAFF).find((s: StaffUser) => s.id === parsed.id);
          if (exists) {
            setCurrentUser(parsed);
          } else {
            setCurrentUser(data.staff?.[0] || INITIAL_STAFF[0]);
          }
        } else {
          setCurrentUser(data.staff?.[0] || INITIAL_STAFF[0]);
        }
        
        setSyncStatus('synced');
      } catch (err) {
        console.warn("Backend unavailable, loading local offline fallback data.", err);
        setSyncStatus('offline');
        
        // Fallback offline loader from localStorage
        const localProds = localStorage.getItem('zappos_products');
        const localCusts = localStorage.getItem('zappos_customers');
        const localLedger = localStorage.getItem('zappos_ledger');
        const localSales = localStorage.getItem('zappos_sales');
        const localStaff = localStorage.getItem('zappos_staff');
        const localCurrentUser = localStorage.getItem('zappos_currentUser');
        const localSettings = localStorage.getItem('zappos_settings');
        const localSub = localStorage.getItem('zappos_subscription');

        if (localProds) setProducts(JSON.parse(localProds));
        if (localCusts) setCustomers(JSON.parse(localCusts));
        if (localLedger) setLedger(JSON.parse(localLedger));
        if (localSales) setSales(JSON.parse(localSales));
        if (localStaff) setStaff(JSON.parse(localStaff));
        if (localCurrentUser) setCurrentUser(JSON.parse(localCurrentUser));
        if (localSettings) setSettings(JSON.parse(localSettings));
        if (localSub) setSubscription(JSON.parse(localSub));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPOSData();
  }, []);

  const DEFAULT_SETTINGS = () => ({
    businessName: "Karachi Super Mart",
    address: "Block 4, Gulshan-e-Iqbal, Karachi",
    phone: "021-34567890",
    currency: "₨",
    taxEnabled: true,
    taxRate: 6.5,
    taxLabel: "SRB/GST",
    receiptHeader: "WELCOME TO KARACHI SUPER MART\nYour One-Stop Shop for Quality Groceries",
    receiptFooter: "Thank you for shopping with us!\nSoftware Powered by ZapPOS (0300-ZAPPOS)",
    lowStockAlertEnabled: true
  });

  const DEFAULT_SUBSCRIPTION = () => ({
    plan: 'Standard' as const,
    status: 'trial' as const,
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price: "₨ 5,000"
  });

  // Save changes helper with Cloud + local syncing
  const syncWithCloud = async (action: () => Promise<any>, fallbackAction: () => void) => {
    setSyncStatus('syncing');
    try {
      await action();
      setSyncStatus('synced');
    } catch (err) {
      console.error("API update error, executing local action:", err);
      fallbackAction();
      setSyncStatus('offline');
    }
  };

  const triggerSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/pos-data');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products || []);
      setCustomers(data.customers || []);
      setLedger(data.ledger || []);
      setSales(data.sales || []);
      setStaff(data.staff || INITIAL_STAFF);
      setSettings(data.settings || DEFAULT_SETTINGS());
      setSubscription(data.subscription || DEFAULT_SUBSCRIPTION());
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('offline');
    }
  };

  // Product Actions
  const addProduct = async (p: Omit<Product, 'id'>) => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        if (!res.ok) throw new Error();
        const newProduct = await res.json();
        setProducts(prev => [newProduct, ...prev]);
      },
      () => {
        const newProduct: Product = { ...p, id: `prod-${Date.now()}` };
        const updated = [newProduct, ...products];
        setProducts(updated);
        localStorage.setItem('zappos_products', JSON.stringify(updated));
      }
    );
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await syncWithCloud(
      async () => {
        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error();
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      },
      () => {
        const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
        setProducts(updated);
        localStorage.setItem('zappos_products', JSON.stringify(updated));
      }
    );
  };

  const deleteProduct = async (id: string) => {
    await syncWithCloud(
      async () => {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        setProducts(prev => prev.filter(p => p.id !== id));
      },
      () => {
        const updated = products.filter(p => p.id !== id);
        setProducts(updated);
        localStorage.setItem('zappos_products', JSON.stringify(updated));
      }
    );
  };

  const adjustStock = async (productId: string, amount: number, reason: string) => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/products/adjust-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, amount, reason })
        });
        if (!res.ok) throw new Error();
        const updatedProduct = await res.json();
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      },
      () => {
        const updated = products.map(p => {
          if (p.id === productId) {
            return { ...p, stockQuantity: Math.max(0, p.stockQuantity + amount) };
          }
          return p;
        });
        setProducts(updated);
        localStorage.setItem('zappos_products', JSON.stringify(updated));
      }
    );
  };

  // Customer Actions
  const addCustomer = async (c: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c)
        });
        if (!res.ok) throw new Error();
        const newCustomer = await res.json();
        setCustomers(prev => [newCustomer, ...prev]);
      },
      () => {
        const newCustomer: Customer = { ...c, id: `cust-${Date.now()}`, outstandingBalance: 0 };
        const updated = [newCustomer, ...customers];
        setCustomers(updated);
        localStorage.setItem('zappos_customers', JSON.stringify(updated));
      }
    );
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    await syncWithCloud(
      async () => {
        const res = await fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error();
        const updatedCustomer = await res.json();
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      },
      () => {
        const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
        setCustomers(updated);
        localStorage.setItem('zappos_customers', JSON.stringify(updated));
      }
    );
  };

  const receivePayment = async (customerId: string, amount: number, reference: string) => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/customers/receive-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, amount, reference })
        });
        if (!res.ok) throw new Error();
        const payload = await res.json();
        setCustomers(prev => prev.map(c => c.id === customerId ? payload.customer : c));
        setLedger(prev => [payload.ledgerEntry, ...prev]);
      },
      () => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const newBalance = Math.max(0, customer.outstandingBalance - amount);
        const updatedCusts = customers.map(c => c.id === customerId ? { ...c, outstandingBalance: newBalance } : c);
        setCustomers(updatedCusts);
        localStorage.setItem('zappos_customers', JSON.stringify(updatedCusts));

        const ledgerEntry: CustomerLedgerEntry = {
          id: `led-${Date.now()}`,
          customerId,
          date: new Date().toISOString(),
          type: 'payment',
          amount,
          balanceAfter: newBalance,
          description: `Payment received: ${reference}`
        };
        const updatedLedger = [ledgerEntry, ...ledger];
        setLedger(updatedLedger);
        localStorage.setItem('zappos_ledger', JSON.stringify(updatedLedger));
      }
    );
  };

  // Billing & Checkout Actions
  const checkout = async (
    customerId: string,
    cartItems: { product: Product; quantity: number }[],
    discount: number,
    amountPaid: number,
    paymentMethod: PaymentMethod
  ): Promise<Sale | null> => {
    if (cartItems.length === 0) return null;

    let createdSale: Sale | null = null;

    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          cartItems,
          discount,
          amountPaid,
          paymentMethod,
          cashierName: `${currentUser.name} (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})`
        })
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      createdSale = data.sale;
      setSales(data.sales || [createdSale, ...sales]);
      setProducts(data.products || []);
      setCustomers(data.customers || []);
      setLedger(data.ledger || []);
      setSyncStatus('synced');
    } catch (err) {
      console.warn("Backend checkout error, processing checkout purely locally:", err);
      setSyncStatus('offline');

      // Local Fallback Execution
      const subtotal = cartItems.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
      const tax = settings.taxEnabled ? Math.round((subtotal - discount) * (settings.taxRate / 100)) : 0;
      const total = subtotal - discount + tax;

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
            const updatedCusts = customers.map(c => c.id === customerId ? { ...c, outstandingBalance: projectedBalance } : c);
            setCustomers(updatedCusts);
            localStorage.setItem('zappos_customers', JSON.stringify(updatedCusts));

            const newLedgerEntry: CustomerLedgerEntry = {
              id: `led-${Date.now()}`,
              customerId,
              date: new Date().toISOString(),
              type: 'credit_sale',
              amount: creditAmount,
              balanceAfter: projectedBalance,
              description: `Invoice #${sales.length + 1006} (Udhaar Credit Purchase)`
            };
            const updatedLedger = [newLedgerEntry, ...ledger];
            setLedger(updatedLedger);
            localStorage.setItem('zappos_ledger', JSON.stringify(updatedLedger));
          }
        }
      }

      const updatedProds = products.map(p => {
        const cartItem = cartItems.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) };
        }
        return p;
      });
      setProducts(updatedProds);
      localStorage.setItem('zappos_products', JSON.stringify(updatedProds));

      const saleItems: SaleItem[] = cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitType: item.product.unitType,
        salePrice: item.product.salePrice,
        total: item.product.salePrice * item.quantity
      }));

      createdSale = {
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

      const updatedSales = [createdSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem('zappos_sales', JSON.stringify(updatedSales));
    }

    return createdSale;
  };

  // Staff Actions
  const addStaff = async (name: string, email: string, role: 'owner' | 'manager' | 'cashier') => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role })
        });
        if (!res.ok) throw new Error();
        const newMember = await res.json();
        setStaff(prev => [...prev, newMember]);
      },
      () => {
        const newMember: StaffUser = {
          id: `user-${Date.now()}`,
          name,
          email,
          role,
          dateAdded: new Date().toISOString().split('T')[0],
          status: 'invited'
        };
        const updated = [...staff, newMember];
        setStaff(updated);
        localStorage.setItem('zappos_staff', JSON.stringify(updated));
      }
    );
  };

  const handleSetCurrentUser = (user: StaffUser) => {
    setCurrentUser(user);
    localStorage.setItem('zappos_currentUser', JSON.stringify(user));
  };

  // Subscription Actions
  const changePlan = async (plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise') => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/subscription/change-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan })
        });
        if (!res.ok) throw new Error();
        const sub = await res.json();
        setSubscription(sub);
      },
      () => {
        const updated: Subscription = {
          plan,
          status: 'active',
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          price: PLAN_FEATURES[plan].price
        };
        setSubscription(updated);
        localStorage.setItem('zappos_subscription', JSON.stringify(updated));
      }
    );
  };

  const resetTrial = async () => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/subscription/reset-trial', { method: 'POST' });
        if (!res.ok) throw new Error();
        const sub = await res.json();
        setSubscription(sub);
      },
      () => {
        const updated: Subscription = {
          plan: 'Starter',
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          price: "₨ 2,500"
        };
        setSubscription(updated);
        localStorage.setItem('zappos_subscription', JSON.stringify(updated));
      }
    );
  };

  // Settings Actions
  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    await syncWithCloud(
      async () => {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error();
        const sett = await res.json();
        setSettings(sett);
      },
      () => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        localStorage.setItem('zappos_settings', JSON.stringify(updated));
      }
    );
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
        isLoading,
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
