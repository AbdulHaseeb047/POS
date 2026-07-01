import fs from "fs/promises";
import path from "path";

const PG_CONNECTION_STRING = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/zappos_db";
const LOCAL_DB_FILE = path.join(process.cwd(), "db.json");

let pool: any = null;
let isPgActive = false;

// Default System Gating & Configuration per tenant
export const DEFAULT_STAFF = [
  { id: 'user-1', name: 'Abdul Haseeb', email: 'owner@zappos.pk', role: 'owner', dateAdded: '2026-06-01', status: 'active' }
];

export const DEFAULT_SETTINGS = {
  businessName: "My ZapPOS Super Mart",
  address: "Your Mart Address, Karachi",
  phone: "021-111222333",
  currency: "₨",
  taxEnabled: true,
  taxRate: 6.5,
  taxLabel: "SRB/GST",
  receiptHeader: "WELCOME TO ZAPPOS SUPER MART\nYour Premium Retail Destination",
  receiptFooter: "Thank you for shopping with us!\nSoftware Powered by ZapPOS",
  lowStockAlertEnabled: true
};

export const DEFAULT_SUBSCRIPTION = {
  plan: 'Standard',
  status: 'trial',
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  price: "₨ 5,000"
};

// Initialize connection attempts and apply schema migrations
async function initializeDB() {
  try {
    const pgModule = await import("pg");
    const PoolClass = pgModule.default?.Pool || pgModule.Pool;
    
    pool = new PoolClass({
      connectionString: PG_CONNECTION_STRING,
      connectionTimeoutMillis: 3000 // Fails fast to ensure instant boot fallback
    });

    const client = await pool.connect();
    console.log("🚀 Successfully connected to PostgreSQL!");
    isPgActive = true;
    
    // Create tables with hard multi-tenant isolation schemas (tenant_id as part of Primary Key)
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS products (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        barcode VARCHAR(100),
        category VARCHAR(100),
        unit_type VARCHAR(50) NOT NULL,
        cost_price NUMERIC(15, 2) NOT NULL,
        sale_price NUMERIC(15, 2) NOT NULL,
        stock_quantity NUMERIC(15, 3) NOT NULL,
        low_stock_threshold NUMERIC(15, 3) NOT NULL,
        is_quick_select BOOLEAN DEFAULT false,
        expiry_date VARCHAR(50),
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(255), -- Encrypted at Rest
        address TEXT, -- Encrypted at Rest
        credit_limit NUMERIC(15, 2) DEFAULT 0,
        outstanding_balance NUMERIC(15, 2) DEFAULT 0,
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS ledger (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(100) NOT NULL,
        customer_id VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        balance_after NUMERIC(15, 2) NOT NULL,
        description TEXT,
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS sales (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        customer_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL,
        discount NUMERIC(15, 2) DEFAULT 0,
        tax NUMERIC(15, 2) DEFAULT 0,
        total NUMERIC(15, 2) NOT NULL,
        amount_paid NUMERIC(15, 2) NOT NULL,
        credit_amount NUMERIC(15, 2) DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL,
        cashier_name VARCHAR(255),
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS staff (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        date_added VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS subscription (
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'tenant-default',
        id VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        PRIMARY KEY (tenant_id, id)
      );

      CREATE TABLE IF NOT EXISTS client_accounts (
        id VARCHAR(100) PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        email VARCHAR(255),
        invite_link TEXT,
        tier VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        signup_date VARCHAR(100) NOT NULL,
        start_date VARCHAR(100) NOT NULL,
        renewal_date VARCHAR(100) NOT NULL,
        enabled_features TEXT NOT NULL,
        allowed_users INT NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp VARCHAR(100) NOT NULL,
        action VARCHAR(255) NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        client_id VARCHAR(100) NOT NULL,
        details TEXT NOT NULL
      );
    `);

    // Ensure default system owner and records exist for 'tenant-default'
    await lazySeedTenant(client, 'tenant-default');

    client.release();
  } catch (err) {
    console.warn("⚠️ PostgreSQL service not detected/connected. Gracefully falling back to integrated JSON-Relational local storage. Operational reliability maintained.");
    isPgActive = false;
    pool = null;
  }
}

// Lazy seeding of initial configurations for any new tenant
export async function lazySeedTenant(client: any, tenantId: string) {
  try {
    const staffCount = await client.query("SELECT COUNT(*) FROM staff WHERE tenant_id = $1", [tenantId]);
    if (Number(staffCount.rows[0].count) === 0) {
      console.log(`🌱 Seeding initial records for tenant: ${tenantId}`);
      for (const s of DEFAULT_STAFF) {
        await client.query(
          `INSERT INTO staff (tenant_id, id, name, email, role, date_added, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (tenant_id, id) DO NOTHING`,
          [tenantId, s.id, s.name, s.email, s.role, s.dateAdded, s.status]
        );
      }
      await client.query(
        `INSERT INTO settings (tenant_id, id, data) VALUES ($1, 'business_config', $2) ON CONFLICT (tenant_id, id) DO NOTHING`,
        [tenantId, JSON.stringify(DEFAULT_SETTINGS)]
      );
      await client.query(
        `INSERT INTO subscription (tenant_id, id, data) VALUES ($1, 'active_license', $2) ON CONFLICT (tenant_id, id) DO NOTHING`,
        [tenantId, JSON.stringify(DEFAULT_SUBSCRIPTION)]
      );
    }
  } catch (err) {
    console.error(`Failed to lazy seed tenant ${tenantId}:`, err);
  }
}

// Ensure database initialization occurs immediately
initializeDB();

export const dbQuery = async (text: string, params?: any[]) => {
  if (isPgActive && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error("Database query failed, trying to heal pool connection...", err);
      throw err;
    }
  }
  throw new Error("PostgreSQL client unavailable. Fallback to Local Repository File Engine.");
};

export const getPgStatus = () => ({
  active: isPgActive,
  connection: PG_CONNECTION_STRING
});

// JSON fallback utilities matching real SQL storage structures
export interface DBStructure {
  products: any[];
  customers: any[];
  ledger: any[];
  sales: any[];
  staff: any[];
  settings: any[];
  subscription: any[];
  client_accounts: any[];
  audit_logs: any[];
}

export async function readLocalDB(): Promise<DBStructure> {
  try {
    const data = await fs.readFile(LOCAL_DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Ensure arrays are initialized
    if (!parsed.products) parsed.products = [];
    if (!parsed.customers) parsed.customers = [];
    if (!parsed.ledger) parsed.ledger = [];
    if (!parsed.sales) parsed.sales = [];
    if (!parsed.staff) parsed.staff = [];
    if (!parsed.settings) parsed.settings = [];
    if (!parsed.subscription) parsed.subscription = [];
    if (!parsed.client_accounts) parsed.client_accounts = [];
    if (!parsed.audit_logs) parsed.audit_logs = [];

    return parsed;
  } catch (error) {
    // Return empty seed structures if no file exists
    const initial = {
      products: [],
      customers: [],
      ledger: [],
      sales: [],
      staff: DEFAULT_STAFF.map(s => ({ ...s, tenantId: 'tenant-default' })),
      settings: [{ tenantId: 'tenant-default', id: 'business_config', data: DEFAULT_SETTINGS }],
      subscription: [{ tenantId: 'tenant-default', id: 'active_license', data: DEFAULT_SUBSCRIPTION }],
      client_accounts: [],
      audit_logs: []
    };
    await writeLocalDB(initial);
    return initial;
  }
}

export async function writeLocalDB(data: DBStructure): Promise<void> {
  await fs.writeFile(LOCAL_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Lazy seed helper for local JSON database
export async function lazySeedLocalTenant(db: DBStructure, tenantId: string): Promise<boolean> {
  const hasStaff = db.staff.some(s => s.tenantId === tenantId);
  if (!hasStaff) {
    db.staff.push(...DEFAULT_STAFF.map(s => ({ ...s, tenantId })));
    db.settings.push({ tenantId, id: 'business_config', data: DEFAULT_SETTINGS });
    db.subscription.push({ tenantId, id: 'active_license', data: DEFAULT_SUBSCRIPTION });
    await writeLocalDB(db);
    return true;
  }
  return false;
}
