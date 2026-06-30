-- ZapPOS Local PostgreSQL Database Migration File
-- You can run this script to set up all tables and initial admin credentials in your local PostgreSQL database.
-- Database Name: zappos_db

-- 1. Create Settings table
CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY,
  data JSONB NOT NULL
);

-- 2. Create Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
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
  expiry_date VARCHAR(50)
);

-- 3. Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  address TEXT,
  credit_limit NUMERIC(15, 2) DEFAULT 0,
  outstanding_balance NUMERIC(15, 2) DEFAULT 0
);

-- 4. Create Ledger table (Udhaar & Payment logs)
CREATE TABLE IF NOT EXISTS ledger (
  id VARCHAR(100) PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  date VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL,
  description TEXT
);

-- 5. Create Sales table (Invoices & transactions)
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(100) PRIMARY KEY,
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
  cashier_name VARCHAR(255)
);

-- 6. Create Staff table (Authorized store operators)
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  date_added VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL
);

-- 7. Create Subscription license table
CREATE TABLE IF NOT EXISTS subscription (
  id VARCHAR(50) PRIMARY KEY,
  data JSONB NOT NULL
);

-- 8. Seed Default System Owner Account & Settings (Required to boot into the POS panel)
INSERT INTO staff (id, name, email, role, date_added, status)
VALUES (
  'user-1', 
  'Abdul Haseeb', 
  'owner@zappos.pk', 
  'owner', 
  '2026-06-01', 
  'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, data)
VALUES (
  'business_config', 
  '{"businessName": "My ZapPOS Super Mart", "address": "Your Mart Address, Karachi", "phone": "021-111222333", "currency": "₨", "taxEnabled": true, "taxRate": 6.5, "taxLabel": "SRB/GST", "receiptHeader": "WELCOME TO ZAPPOS SUPER MART\\nYour Premium Retail Destination", "receiptFooter": "Thank you for shopping with us!\\nSoftware Powered by ZapPOS", "lowStockAlertEnabled": true}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO subscription (id, data)
VALUES (
  'active_license', 
  '{"plan": "Standard", "status": "trial", "trialEndsAt": "2026-07-14T00:00:00.000Z", "currentPeriodEnd": "2026-07-14T00:00:00.000Z", "price": "₨ 5,000"}'
) ON CONFLICT (id) DO NOTHING;
