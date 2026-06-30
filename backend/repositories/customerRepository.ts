import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { Customer, CustomerLedgerEntry } from "../models";
import { encrypt, decrypt } from "../utils/crypto";

export class CustomerRepository {
  static async getAll(tenantId: string): Promise<Customer[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM customers WHERE tenant_id = $1 ORDER BY name ASC",
        [tenantId]
      );
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: decrypt(row.phone), // Transparent Decryption at Rest
        address: decrypt(row.address), // Transparent Decryption at Rest
        creditLimit: Number(row.credit_limit),
        outstandingBalance: Number(row.outstanding_balance)
      }));
    } else {
      const db = await readLocalDB();
      const filtered = db.customers.filter(c => c.tenantId === tenantId);
      return filtered.map(c => ({
        id: c.id,
        name: c.name,
        phone: decrypt(c.phone), // Transparent Decryption at Rest
        address: decrypt(c.address), // Transparent Decryption at Rest
        creditLimit: Number(c.creditLimit),
        outstandingBalance: Number(c.outstandingBalance)
      }));
    }
  }

  static async getById(tenantId: string, id: string): Promise<Customer | null> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM customers WHERE tenant_id = $1 AND id = $2",
        [tenantId, id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: decrypt(row.phone), // Transparent Decryption at Rest
        address: decrypt(row.address), // Transparent Decryption at Rest
        creditLimit: Number(row.credit_limit),
        outstandingBalance: Number(row.outstanding_balance)
      };
    } else {
      const db = await readLocalDB();
      const c = db.customers.find(cust => cust.tenantId === tenantId && cust.id === id);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        phone: decrypt(c.phone), // Transparent Decryption at Rest
        address: decrypt(c.address), // Transparent Decryption at Rest
        creditLimit: Number(c.creditLimit),
        outstandingBalance: Number(c.outstandingBalance)
      };
    }
  }

  static async save(tenantId: string, customer: Customer): Promise<Customer> {
    const pg = getPgStatus();
    // Encrypt sensitive PII fields
    const encryptedPhone = encrypt(customer.phone);
    const encryptedAddress = encrypt(customer.address);

    if (pg.active) {
      await dbQuery(
        `INSERT INTO customers 
         (tenant_id, id, name, phone, address, credit_limit, outstanding_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, id) DO UPDATE SET
         name = $3, phone = $4, address = $5, credit_limit = $6, outstanding_balance = $7`,
        [
          tenantId,
          customer.id,
          customer.name,
          encryptedPhone,
          encryptedAddress,
          customer.creditLimit,
          customer.outstandingBalance
        ]
      );
      return customer;
    } else {
      const db = await readLocalDB();
      const customerWithTenantAndEncryption = {
        id: customer.id,
        tenantId,
        name: customer.name,
        phone: encryptedPhone,
        address: encryptedAddress,
        creditLimit: customer.creditLimit,
        outstandingBalance: customer.outstandingBalance
      };
      
      const idx = db.customers.findIndex(c => c.tenantId === tenantId && c.id === customer.id);
      if (idx !== -1) {
        db.customers[idx] = customerWithTenantAndEncryption;
      } else {
        db.customers.unshift(customerWithTenantAndEncryption);
      }
      await writeLocalDB(db);
      return customer;
    }
  }

  static async getLedger(tenantId: string): Promise<CustomerLedgerEntry[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM ledger WHERE tenant_id = $1 ORDER BY date DESC",
        [tenantId]
      );
      return res.rows.map(row => ({
        id: row.id,
        customerId: row.customer_id,
        date: row.date,
        type: row.type,
        amount: Number(row.amount),
        balanceAfter: Number(row.balance_after),
        description: row.description
      }));
    } else {
      const db = await readLocalDB();
      return db.ledger.filter(l => l.tenantId === tenantId);
    }
  }

  static async saveLedgerEntry(tenantId: string, entry: CustomerLedgerEntry): Promise<CustomerLedgerEntry> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO ledger 
         (tenant_id, id, customer_id, date, type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tenant_id, id) DO NOTHING`,
        [
          tenantId,
          entry.id,
          entry.customerId,
          entry.date,
          entry.type,
          entry.amount,
          entry.balanceAfter,
          entry.description
        ]
      );
      return entry;
    } else {
      const db = await readLocalDB();
      const entryWithTenant = { ...entry, tenantId };
      db.ledger.unshift(entryWithTenant);
      await writeLocalDB(db);
      return entry;
    }
  }
}
