export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  unitType: 'piece' | 'kg' | 'dozen' | 'liter';
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isQuickSelect?: boolean;
  expiryDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'credit_sale' | 'payment';
  amount: number;
  balanceAfter: number;
  description?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitType: 'piece' | 'kg' | 'dozen' | 'liter';
  salePrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  creditAmount: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'split';
  cashierName?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier';
  dateAdded: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string;
  receiptHeader?: string;
  receiptFooter?: string;
  lowStockAlertEnabled: boolean;
}

export interface Subscription {
  plan: 'Starter' | 'Standard' | 'Pro' | 'Enterprise';
  status: 'trial' | 'active' | 'expired';
  trialEndsAt: string;
  currentPeriodEnd: string;
  price: string;
}

export interface ClientAccount {
  id: string; // Tenant workspace ID, e.g. 'tenant-default' or 'branch-gulshan'
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  inviteLink: string;
  tier: 'Starter' | 'Growth' | 'Restaurant' | 'Enterprise';
  status: 'trial' | 'active' | 'expired' | 'suspended';
  signupDate: string;
  startDate: string;
  renewalDate: string;
  enabledFeatures: string[]; // List of enabled feature keys
  allowedUsers: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  clientId: string;
  details: string;
}
