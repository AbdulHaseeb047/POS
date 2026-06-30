/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UnitType = 'piece' | 'kg' | 'liter' | 'meter';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unitType: UnitType;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  isQuickSelect: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
}

export type LedgerEntryType = 'credit_sale' | 'payment';

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  description: string;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'split';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitType: UnitType;
  salePrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string; // 'walk-in' if none
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  creditAmount: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  taxLabel: string; // GST, SRB, etc.
  receiptHeader: string;
  receiptFooter: string;
  lowStockAlertEnabled: boolean;
}

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateAdded: string;
  status: 'active' | 'invited';
}

export type SubscriptionPlan = 'Starter' | 'Standard' | 'Pro' | 'Enterprise';

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'trial' | 'active' | 'expired';
  trialEndsAt: string;
  currentPeriodEnd: string;
  price: string;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, {
  price: string;
  billing: string;
  maxProducts: number;
  maxStaff: number;
  analytics: 'basic' | 'standard' | 'advanced';
  features: string[];
}> = {
  Starter: {
    price: "₨ 2,500",
    billing: "per month",
    maxProducts: 200,
    maxStaff: 1,
    analytics: 'basic',
    features: [
      "Up to 200 products",
      "1 staff user account",
      "Standard billing & receipt layout",
      "Local sales reports",
      "Offline database support"
    ]
  },
  Standard: {
    price: "₨ 5,000",
    billing: "per month",
    maxProducts: 1000,
    maxStaff: 3,
    analytics: 'standard',
    features: [
      "Up to 1,000 products",
      "3 staff user accounts",
      "Udhaar (credit) ledger module",
      "Standard analytics & charts",
      "Auto local-backup",
      "CSV Export/Import"
    ]
  },
  Pro: {
    price: "₨ 8,000",
    billing: "per month",
    maxProducts: 5000,
    maxStaff: 10,
    analytics: 'advanced',
    features: [
      "Up to 5,000 products",
      "10 staff accounts with role-scoping",
      "Advanced sales dashboard & forecasting",
      "WhatsApp receipt sharing integration (simulation)",
      "Daily automated cloud sync",
      "Low-stock email alerts (simulation)"
    ]
  },
  Enterprise: {
    price: "₨ 15,000",
    billing: "per month",
    maxProducts: 100000,
    maxStaff: 100,
    analytics: 'advanced',
    features: [
      "Unlimited products & stock operations",
      "Unlimited staff user accounts",
      "Multi-store sync & inventory transfers",
      "Priority 24/7 technical support",
      "Dedicated account manager",
      "API access & custom integrations"
    ]
  }
};

export interface ClientAccount {
  id: string;
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
  enabledFeatures: string[];
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

