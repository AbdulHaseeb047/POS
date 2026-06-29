import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
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
  UnitType
} from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Types for DB structure
interface DBStructure {
  products: Product[];
  customers: Customer[];
  ledger: CustomerLedgerEntry[];
  sales: Sale[];
  staff: StaffUser[];
  settings: BusinessSettings;
  subscription: Subscription;
}

// Initial Seeds
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
    tax: 970,
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

const INITIAL_STAFF: StaffUser[] = [
  { id: 'user-1', name: 'Abdul Haseeb', email: 'owner@zappos.pk', role: 'owner', dateAdded: '2026-06-01', status: 'active' },
  { id: 'user-2', name: 'Zainab Fatima', email: 'zainab@zappos.pk', role: 'manager', dateAdded: '2026-06-10', status: 'active' },
  { id: 'user-3', name: 'Ammar Siddiqui', email: 'ammar@zappos.pk', role: 'cashier', dateAdded: '2026-06-15', status: 'active' }
];

const DEFAULT_SETTINGS: BusinessSettings = {
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
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'Standard',
  status: 'trial',
  trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  price: "₨ 5,000"
};

// Database utility functions
async function readDB(): Promise<DBStructure> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If doesn't exist, seed and write
    const initialDB: DBStructure = {
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      ledger: INITIAL_LEDGER,
      sales: INITIAL_SALES,
      staff: INITIAL_STAFF,
      settings: DEFAULT_SETTINGS,
      subscription: DEFAULT_SUBSCRIPTION,
    };
    await writeDB(initialDB);
    return initialDB;
  }
}

async function writeDB(data: DBStructure): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get all POS data at once for streamlined load
  app.get("/api/pos-data", async (req, res) => {
    try {
      const db = await readDB();
      res.json(db);
    } catch (error) {
      res.status(500).json({ error: "Failed to read database state" });
    }
  });

  // Product CRUD
  app.post("/api/products", async (req, res) => {
    try {
      const db = await readDB();
      const newProduct: Product = {
        ...req.body,
        id: `prod-${Date.now()}`
      };
      db.products.unshift(newProduct);
      await writeDB(db);
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(500).json({ error: "Failed to save product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDB();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: "Product not found" });

      db.products[idx] = { ...db.products[idx], ...req.body };
      await writeDB(db);
      res.json(db.products[idx]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDB();
      db.products = db.products.filter(p => p.id !== id);
      await writeDB(db);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.post("/api/products/adjust-stock", async (req, res) => {
    try {
      const { productId, amount, reason } = req.body;
      const db = await readDB();
      const product = db.products.find(p => p.id === productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      product.stockQuantity = Math.max(0, product.stockQuantity + amount);
      await writeDB(db);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  });

  // Customer CRUD
  app.post("/api/customers", async (req, res) => {
    try {
      const db = await readDB();
      const newCustomer: Customer = {
        ...req.body,
        id: `cust-${Date.now()}`,
        outstandingBalance: 0
      };
      db.customers.unshift(newCustomer);
      await writeDB(db);
      res.status(201).json(newCustomer);
    } catch (err) {
      res.status(500).json({ error: "Failed to save customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDB();
      const idx = db.customers.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: "Customer not found" });

      db.customers[idx] = { ...db.customers[idx], ...req.body };
      await writeDB(db);
      res.json(db.customers[idx]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.post("/api/customers/receive-payment", async (req, res) => {
    try {
      const { customerId, amount, reference } = req.body;
      const db = await readDB();
      const customer = db.customers.find(c => c.id === customerId);
      if (!customer) return res.status(404).json({ error: "Customer not found" });

      const newBalance = Math.max(0, customer.outstandingBalance - amount);
      customer.outstandingBalance = newBalance;

      // Add Ledger record
      const ledgerEntry: CustomerLedgerEntry = {
        id: `led-${Date.now()}`,
        customerId,
        date: new Date().toISOString(),
        type: "payment",
        amount,
        balanceAfter: newBalance,
        description: `Payment received: ${reference}`
      };
      db.ledger.unshift(ledgerEntry);
      await writeDB(db);

      res.json({ customer, ledgerEntry });
    } catch (err) {
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Checkout sale
  app.post("/api/sales/checkout", async (req, res) => {
    try {
      const { customerId, cartItems, discount, amountPaid, paymentMethod, cashierName } = req.body;
      const db = await readDB();

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate checkout values
      const subtotal = cartItems.reduce((acc: number, item: any) => acc + (item.product.salePrice * item.quantity), 0);
      const tax = db.settings.taxEnabled ? Math.round((subtotal - discount) * (db.settings.taxRate / 100)) : 0;
      const total = subtotal - discount + tax;

      let creditAmount = 0;
      let customerName = "Walk-in Customer";

      if (customerId !== 'walk-in') {
        const customer = db.customers.find(c => c.id === customerId);
        if (customer) {
          customerName = customer.name;
          if (paymentMethod === 'credit') {
            creditAmount = total;
          } else if (paymentMethod === 'split') {
            creditAmount = Math.max(0, total - amountPaid);
          }

          if (creditAmount > 0) {
            customer.outstandingBalance += creditAmount;

            // Create ledger entry
            const ledgerEntry: CustomerLedgerEntry = {
              id: `led-${Date.now()}`,
              customerId,
              date: new Date().toISOString(),
              type: 'credit_sale',
              amount: creditAmount,
              balanceAfter: customer.outstandingBalance,
              description: `Invoice #${db.sales.length + 1006} (Udhaar Credit Purchase)`
            };
            db.ledger.unshift(ledgerEntry);
          }
        }
      }

      // Decrement stock levels
      for (const item of cartItems) {
        const product = db.products.find(p => p.id === item.product.id);
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        }
      }

      // Record Sale
      const saleItems: SaleItem[] = cartItems.map((item: any) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitType: item.product.unitType as UnitType,
        salePrice: item.product.salePrice,
        total: item.product.salePrice * item.quantity
      }));

      const newSale: Sale = {
        id: `INV-${db.sales.length + 1006}`,
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
        paymentMethod: paymentMethod as PaymentMethod,
        cashierName
      };

      db.sales.unshift(newSale);
      await writeDB(db);

      res.status(201).json({ sale: newSale, products: db.products, customers: db.customers, ledger: db.ledger });
    } catch (err) {
      res.status(500).json({ error: "Failed to checkout order" });
    }
  });

  // Staff CRUD
  app.post("/api/staff", async (req, res) => {
    try {
      const { name, email, role } = req.body;
      const db = await readDB();
      const newStaff: StaffUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        dateAdded: new Date().toISOString().split('T')[0],
        status: 'invited'
      };
      db.staff.push(newStaff);
      await writeDB(db);
      res.status(201).json(newStaff);
    } catch (err) {
      res.status(500).json({ error: "Failed to add staff" });
    }
  });

  // Settings PUT
  app.put("/api/settings", async (req, res) => {
    try {
      const db = await readDB();
      db.settings = { ...db.settings, ...req.body };
      await writeDB(db);
      res.json(db.settings);
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Subscription Actions
  app.post("/api/subscription/change-plan", async (req, res) => {
    try {
      const { plan } = req.body;
      const db = await readDB();
      db.subscription = {
        plan,
        status: "active",
        trialEndsAt: db.subscription.trialEndsAt,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price: PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]?.price || "₨ 0"
      };
      await writeDB(db);
      res.json(db.subscription);
    } catch (err) {
      res.status(500).json({ error: "Failed to change subscription plan" });
    }
  });

  app.post("/api/subscription/reset-trial", async (req, res) => {
    try {
      const db = await readDB();
      db.subscription = {
        plan: 'Starter',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: "₨ 2,500"
      };
      await writeDB(db);
      res.json(db.subscription);
    } catch (err) {
      res.status(500).json({ error: "Failed to reset trial plan" });
    }
  });


  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer();
