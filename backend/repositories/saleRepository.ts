import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { Sale } from "../models";

export class SaleRepository {
  static async getAll(tenantId: string): Promise<Sale[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM sales WHERE tenant_id = $1 ORDER BY date DESC",
        [tenantId]
      );
      return res.rows.map(row => ({
        id: row.id,
        date: row.date,
        customerId: row.customer_id,
        customerName: row.customer_name,
        items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        tax: Number(row.tax),
        total: Number(row.total),
        amountPaid: Number(row.amount_paid),
        creditAmount: Number(row.credit_amount),
        paymentMethod: row.payment_method,
        cashierName: row.cashier_name
      }));
    } else {
      const db = await readLocalDB();
      return db.sales.filter(s => s.tenantId === tenantId);
    }
  }

  static async save(tenantId: string, sale: Sale): Promise<Sale> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO sales 
         (tenant_id, id, date, customer_id, customer_name, items, subtotal, discount, tax, total, amount_paid, credit_amount, payment_method, cashier_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (tenant_id, id) DO NOTHING`,
        [
          tenantId,
          sale.id,
          sale.date,
          sale.customerId,
          sale.customerName,
          JSON.stringify(sale.items),
          sale.subtotal,
          sale.discount,
          sale.tax,
          sale.total,
          sale.amountPaid,
          sale.creditAmount,
          sale.paymentMethod,
          sale.cashierName
        ]
      );
      return sale;
    } else {
      const db = await readLocalDB();
      const saleWithTenant = { ...sale, tenantId };
      db.sales.unshift(saleWithTenant);
      await writeLocalDB(db);
      return sale;
    }
  }
}
