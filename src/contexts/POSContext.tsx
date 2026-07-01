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
  PLAN_FEATURES,
  ClientAccount,
  AuditLog,
  Supplier,
  Brand,
  Category
} from '../types';

interface POSContextType {
  products: Product[];
  customers: Customer[];
  ledger: CustomerLedgerEntry[];
  sales: Sale[];
  settings: BusinessSettings;
  staff: StaffUser[];
  currentUser: StaffUser | null;
  loginUser: (user: StaffUser) => void;
  logoutUser: () => void;
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

  // Supplier & Brand actions
  suppliers: Supplier[];
  brands: Brand[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addBrand: (brand: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  // Category actions
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Multi-Tenant workspace support
  tenantId: string;
  changeTenant: (id: string) => void;

  // SaaS Admin actions
  clientAccount: ClientAccount | null;
  saasClients: ClientAccount[];
  saasLogs: AuditLog[];
  fetchSaaSClients: () => Promise<void>;
  fetchSaaSLogs: () => Promise<void>;
  createSaaSClient: (data: any) => Promise<void>;
  updateSaaSClient: (id: string, updates: Partial<ClientAccount>) => Promise<void>;
  suspendSaaSClient: (id: string) => Promise<void>;
  deleteSaaSClient: (id: string) => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const INITIAL_STAFF: StaffUser[] = [
  { id: 'user-1', name: 'Abdul Haseeb', email: 'owner@zappos.pk', role: 'owner', dateAdded: '2026-06-01', status: 'active' },
  { id: 'user-2', name: 'Zainab Fatima', email: 'zainab@zappos.pk', role: 'manager', dateAdded: '2026-06-10', status: 'active' },
  { id: 'user-3', name: 'Ammar Siddiqui', email: 'ammar@zappos.pk', role: 'cashier', dateAdded: '2026-06-15', status: 'active' }
];

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantId] = useState<string>(() => localStorage.getItem('zappos_tenant_id') || 'tenant-default');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('zappos_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
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
    lowStockAlertEnabled: true,
    fbrEnabled: false,
    fbrPosId: "101006",
    fbrNtn: "42301-789456-1",
    fbrApiUrl: "https://api.fbr.gov.pk/ims/v1/invoice"
  });

  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'Standard',
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price: "₨ 5,000"
  });

  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [saasClients, setSaaSClients] = useState<ClientAccount[]>([]);
  const [saasLogs, setSaaSLogs] = useState<AuditLog[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('zappos_suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 'sup-1', name: 'Shan Foods Karachi Ltd', contactPerson: 'Khurram Shahzad', phone: '0321-1234567', email: 'khurram@shanfoods.com', address: 'F-265, S.I.T.E., Karachi' },
      { id: 'sup-2', name: 'Tapal Tea Distribution', contactPerson: 'Adeel Malik', phone: '0333-7654321', email: 'adeel@tapaltea.com.pk', address: 'Plot 40, Korangi Industrial Area, Karachi' },
      { id: 'sup-3', name: 'Nestle Pakistan Dist', contactPerson: 'Sajid Mehmood', phone: '0300-9876543', email: 'sajid@nestle.com', address: 'Block C, North Nazimabad, Karachi' }
    ];
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('zappos_brands');
    return saved ? JSON.parse(saved) : [
      { id: 'br-1', name: 'Shan' },
      { id: 'br-2', name: 'Tapal' },
      { id: 'br-3', name: 'Nestle' },
      { id: 'br-4', name: 'National Foods' },
      { id: 'br-5', name: 'Lipton' }
    ];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('zappos_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat-1', name: 'Groceries', description: 'Daily staple items and foods' },
      { id: 'cat-2', name: 'Beverages', description: 'Cold drinks, juices, tea, coffee' },
      { id: 'cat-3', name: 'Snacks', description: 'Chips, biscuits, cookies, chocolates' },
      { id: 'cat-4', name: 'Dairy', description: 'Milk, butter, cheese, yogurt' },
      { id: 'cat-5', name: 'Pharmacy', description: 'Over the counter medicines and healthcare' }
    ];
  });

  const getOfflineClientAccount = (tId: string): ClientAccount => {
    const local = localStorage.getItem(`zappos_client_account_${tId}`);
    if (local) return JSON.parse(local);
    
    const created: ClientAccount = {
      id: tId,
      businessName: "Karachi Super Mart",
      ownerName: "Abdul Haseeb",
      phone: "021-34567890",
      email: `${tId}@zappos.pk`,
      inviteLink: `https://zappos.pk/invite/${tId}`,
      tier: 'Enterprise',
      status: 'active',
      signupDate: new Date().toISOString(),
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      enabledFeatures: ["billing_sales", "basic_inventory", "udhaar", "full_reports", "mobile_terminal", "offline_sync", "kot_module", "multi_sync", "fbr_integration"],
      allowedUsers: 100
    };
    localStorage.setItem(`zappos_client_account_${tId}`, JSON.stringify(created));
    return created;
  };

  const fetchSaaSClients = async () => {
    try {
      const res = await posFetch('/api/saas/clients');
      if (res.ok) {
        const data = await res.json();
        setSaaSClients(data);
        localStorage.setItem('zappos_saas_clients', JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Offline: loading local saas clients list");
      const local = localStorage.getItem('zappos_saas_clients');
      if (local) setSaaSClients(JSON.parse(local));
    }
  };

  const fetchSaaSLogs = async () => {
    try {
      const res = await posFetch('/api/saas/logs');
      if (res.ok) {
        const data = await res.json();
        setSaaSLogs(data);
        localStorage.setItem('zappos_saas_logs', JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Offline: loading local saas audit logs");
      const local = localStorage.getItem('zappos_saas_logs');
      if (local) setSaaSLogs(JSON.parse(local));
    }
  };

  const createSaaSClient = async (data: any) => {
    await syncWithCloud(
      async () => {
        const res = await posFetch('/api/saas/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create client");
        }
        const created = await res.json();
        setSaaSClients(prev => [created, ...prev]);
        
        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "CREATE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: created.id,
          details: `Manually provisioned workspace with tier: ${created.tier}`
        };
        setSaaSLogs(prev => [newLog, ...prev]);
      },
      () => {
        const created: ClientAccount = {
          ...data,
          signupDate: new Date().toISOString(),
          startDate: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          enabledFeatures: data.enabledFeatures || ["billing_sales", "basic_inventory"],
          allowedUsers: data.allowedUsers || 1
        };
        const updatedList = [created, ...saasClients];
        setSaaSClients(updatedList);
        localStorage.setItem('zappos_saas_clients', JSON.stringify(updatedList));

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "CREATE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: created.id,
          details: `Manually provisioned workspace (Offline) with tier: ${created.tier}`
        };
        const updatedLogs = [newLog, ...saasLogs];
        setSaaSLogs(updatedLogs);
        localStorage.setItem('zappos_saas_logs', JSON.stringify(updatedLogs));
      }
    );
  };

  const updateSaaSClient = async (id: string, updates: Partial<ClientAccount>) => {
    await syncWithCloud(
      async () => {
        const res = await posFetch(`/api/saas/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Failed to update features");
        const updated = await res.json();
        setSaaSClients(prev => prev.map(c => c.id === id ? updated : c));
        
        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "UPDATE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: `Updated workspace properties`
        };
        setSaaSLogs(prev => [newLog, ...prev]);

        if (id === tenantId) {
          setClientAccount(updated);
          localStorage.setItem(`zappos_client_account_${tenantId}`, JSON.stringify(updated));
        }
      },
      () => {
        const updatedList = saasClients.map(c => {
          if (c.id === id) {
            const updated = { ...c, ...updates };
            if (id === tenantId) {
              setClientAccount(updated);
              localStorage.setItem(`zappos_client_account_${tenantId}`, JSON.stringify(updated));
            }
            return updated;
          }
          return c;
        });
        setSaaSClients(updatedList);
        localStorage.setItem('zappos_saas_clients', JSON.stringify(updatedList));

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "UPDATE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: "Updated workspace properties (Offline)"
        };
        const updatedLogs = [newLog, ...saasLogs];
        setSaaSLogs(updatedLogs);
        localStorage.setItem('zappos_saas_logs', JSON.stringify(updatedLogs));
      }
    );
  };

  const suspendSaaSClient = async (id: string) => {
    await syncWithCloud(
      async () => {
        const res = await posFetch(`/api/saas/clients/${id}/suspend`, {
          method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to suspend");
        setSaaSClients(prev => prev.map(c => c.id === id ? { ...c, status: 'suspended' } : c));

        if (id === tenantId) {
          setClientAccount(prev => prev ? { ...prev, status: 'suspended' } : null);
        }

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "SUSPEND_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: "Suspended client workspace access"
        };
        setSaaSLogs(prev => [newLog, ...prev]);
      },
      () => {
        const updatedList = saasClients.map(c => c.id === id ? { ...c, status: 'suspended' as const } : c);
        setSaaSClients(updatedList);
        localStorage.setItem('zappos_saas_clients', JSON.stringify(updatedList));

        if (id === tenantId) {
          setClientAccount(prev => prev ? { ...prev, status: 'suspended' } : null);
        }

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "SUSPEND_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: "Suspended client workspace access (Offline)"
        };
        const updatedLogs = [newLog, ...saasLogs];
        setSaaSLogs(updatedLogs);
        localStorage.setItem('zappos_saas_logs', JSON.stringify(updatedLogs));
      }
    );
  };

  const deleteSaaSClient = async (id: string) => {
    await syncWithCloud(
      async () => {
        const res = await posFetch(`/api/saas/clients/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete client");
        setSaaSClients(prev => prev.filter(c => c.id !== id));

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "DELETE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: "Deleted client workspace"
        };
        setSaaSLogs(prev => [newLog, ...prev]);
      },
      () => {
        const updatedList = saasClients.filter(c => c.id !== id);
        setSaaSClients(updatedList);
        localStorage.setItem('zappos_saas_clients', JSON.stringify(updatedList));

        const newLog: AuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "DELETE_CLIENT",
          performedBy: "SaaS Owner",
          clientId: id,
          details: "Deleted client workspace (Offline)"
        };
        const updatedLogs = [newLog, ...saasLogs];
        setSaaSLogs(updatedLogs);
        localStorage.setItem('zappos_saas_logs', JSON.stringify(updatedLogs));
      }
    );
  };

  // Custom fetch helper that automatically injects the tenant ID header
  const posFetch = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-tenant-id': tenantId,
      },
    });
  };

  // Fetch full data state from Backend on mount & when tenantId shifts
  useEffect(() => {
    const fetchPOSData = async () => {
      try {
        setIsLoading(true);
        setSyncStatus('syncing');
        const res = await posFetch('/api/pos-data');
        if (!res.ok) throw new Error("API response error");
        
        const data = await res.json();
        
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setLedger(data.ledger || []);
        setSales(data.sales || []);
        setStaff(data.staff || INITIAL_STAFF);
        setSettings(data.settings || DEFAULT_SETTINGS());
        setSubscription(data.subscription || DEFAULT_SUBSCRIPTION());
        setClientAccount(data.clientAccount || null);
        if (data.clientAccount) {
          localStorage.setItem(`zappos_client_account_${tenantId}`, JSON.stringify(data.clientAccount));
        }
        
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

        const localClientAccount = getOfflineClientAccount(tenantId);
        setClientAccount(localClientAccount);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPOSData();
  }, [tenantId]);

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
    lowStockAlertEnabled: true,
    fbrEnabled: false,
    fbrPosId: "101006",
    fbrNtn: "42301-789456-1",
    fbrApiUrl: "https://api.fbr.gov.pk/ims/v1/invoice"
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
      const res = await posFetch('/api/pos-data');
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
        const res = await posFetch('/api/products', {
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
        const res = await posFetch(`/api/products/${id}`, {
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
        const res = await posFetch(`/api/products/${id}`, { method: 'DELETE' });
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
        const res = await posFetch('/api/products/adjust-stock', {
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
        const res = await posFetch('/api/customers', {
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
        const res = await posFetch(`/api/customers/${id}`, {
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
        const res = await posFetch('/api/customers/receive-payment', {
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
      const res = await posFetch('/api/sales/checkout', {
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

      const invoiceId = `INV-${sales.length + 1006}`;
      const hasFbr = settings.fbrEnabled ?? false;
      const fbrInvNum = hasFbr ? `FBR-${settings.fbrPosId || '101006'}-${sales.length + 101006}-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
      const fbrVerId = hasFbr ? `FBR-VER-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined;
      const fbrQr = hasFbr ? `https://authorities.gov.pk/fbr-verify?invoice=${invoiceId}&fbr_id=${fbrInvNum}&code=${fbrVerId}` : undefined;

      createdSale = {
        id: invoiceId,
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
        cashierName: `${currentUser.name} (${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})`,
        fbrInvoiceNumber: fbrInvNum,
        fbrVerificationId: fbrVerId,
        fbrStatus: hasFbr ? "SUBMITTED_SUCCESSFULLY" : undefined,
        fbrQrCodeUrl: fbrQr
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
        const res = await posFetch('/api/staff', {
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

  const handleSetCurrentUser = (user: StaffUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('zappos_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('zappos_currentUser');
    }
  };

  const loginUser = (user: StaffUser) => {
    handleSetCurrentUser(user);
  };

  const logoutUser = () => {
    handleSetCurrentUser(null);
  };

  // Subscription Actions
  const changePlan = async (plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise') => {
    await syncWithCloud(
      async () => {
        const res = await posFetch('/api/subscription/change-plan', {
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
        const res = await posFetch('/api/subscription/reset-trial', { method: 'POST' });
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

  // Multi-Tenant Business Switching
  const changeTenant = (id: string) => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'tenant-default';
    setTenantId(cleanId);
    localStorage.setItem('zappos_tenant_id', cleanId);
  };

  // Settings Actions
  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    await syncWithCloud(
      async () => {
        const res = await posFetch('/api/settings', {
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

  // Supplier & Brand Actions
  const addSupplier = async (data: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...data, id: `sup-${Date.now()}` };
    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    localStorage.setItem('zappos_suppliers', JSON.stringify(updated));
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    setSuppliers(updated);
    localStorage.setItem('zappos_suppliers', JSON.stringify(updated));
  };

  const deleteSupplier = async (id: string) => {
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    localStorage.setItem('zappos_suppliers', JSON.stringify(updated));
  };

  const addBrand = async (data: Omit<Brand, 'id'>) => {
    const newBrand: Brand = { ...data, id: `br-${Date.now()}` };
    const updated = [...brands, newBrand];
    setBrands(updated);
    localStorage.setItem('zappos_brands', JSON.stringify(updated));
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    const updated = brands.map(b => b.id === id ? { ...b, ...updates } : b);
    setBrands(updated);
    localStorage.setItem('zappos_brands', JSON.stringify(updated));
  };

  const deleteBrand = async (id: string) => {
    const updated = brands.filter(b => b.id !== id);
    setBrands(updated);
    localStorage.setItem('zappos_brands', JSON.stringify(updated));
  };

  const addCategory = async (data: Omit<Category, 'id'>) => {
    const newCat: Category = { ...data, id: `cat-${Date.now()}` };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('zappos_categories', JSON.stringify(updated));
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(updated);
    localStorage.setItem('zappos_categories', JSON.stringify(updated));
  };

  const deleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem('zappos_categories', JSON.stringify(updated));
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
        loginUser,
        logoutUser,
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
        updateSettings,
        tenantId,
        changeTenant,
        clientAccount,
        saasClients,
        saasLogs,
        fetchSaaSClients,
        fetchSaaSLogs,
        createSaaSClient,
        updateSaaSClient,
        suspendSaaSClient,
        deleteSaaSClient,
        suppliers,
        brands,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addBrand,
        updateBrand,
        deleteBrand,
        categories,
        addCategory,
        updateCategory,
        deleteCategory
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
