import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { Product } from "../models";

export class ProductRepository {
  static async getAll(tenantId: string): Promise<Product[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM products WHERE tenant_id = $1 ORDER BY name ASC",
        [tenantId]
      );
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        category: row.category,
        unitType: row.unit_type,
        costPrice: Number(row.cost_price),
        salePrice: Number(row.sale_price),
        stockQuantity: Number(row.stock_quantity),
        lowStockThreshold: Number(row.low_stock_threshold),
        isQuickSelect: row.is_quick_select,
        expiryDate: row.expiry_date
      }));
    } else {
      const db = await readLocalDB();
      return db.products.filter(p => p.tenantId === tenantId);
    }
  }

  static async getById(tenantId: string, id: string): Promise<Product | null> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM products WHERE tenant_id = $1 AND id = $2",
        [tenantId, id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        category: row.category,
        unitType: row.unit_type,
        costPrice: Number(row.cost_price),
        salePrice: Number(row.sale_price),
        stockQuantity: Number(row.stock_quantity),
        lowStockThreshold: Number(row.low_stock_threshold),
        isQuickSelect: row.is_quick_select,
        expiryDate: row.expiry_date
      };
    } else {
      const db = await readLocalDB();
      return db.products.find(p => p.tenantId === tenantId && p.id === id) || null;
    }
  }

  static async save(tenantId: string, product: Product): Promise<Product> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO products 
         (tenant_id, id, name, sku, barcode, category, unit_type, cost_price, sale_price, stock_quantity, low_stock_threshold, is_quick_select, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (tenant_id, id) DO UPDATE SET
         name = $3, sku = $4, barcode = $5, category = $6, unit_type = $7, cost_price = $8, sale_price = $9, stock_quantity = $10, low_stock_threshold = $11, is_quick_select = $12, expiry_date = $13`,
        [
          tenantId,
          product.id,
          product.name,
          product.sku,
          product.barcode,
          product.category,
          product.unitType,
          product.costPrice,
          product.salePrice,
          product.stockQuantity,
          product.lowStockThreshold,
          product.isQuickSelect || false,
          product.expiryDate
        ]
      );
      return product;
    } else {
      const db = await readLocalDB();
      const productWithTenant = { ...product, tenantId };
      const idx = db.products.findIndex(p => p.tenantId === tenantId && p.id === product.id);
      if (idx !== -1) {
        db.products[idx] = productWithTenant;
      } else {
        db.products.unshift(productWithTenant);
      }
      await writeLocalDB(db);
      return product;
    }
  }

  static async delete(tenantId: string, id: string): Promise<boolean> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "DELETE FROM products WHERE tenant_id = $1 AND id = $2",
        [tenantId, id]
      );
      return (res.rowCount ?? 0) > 0;
    } else {
      const db = await readLocalDB();
      const initialLength = db.products.length;
      db.products = db.products.filter(p => !(p.tenantId === tenantId && p.id === id));
      await writeLocalDB(db);
      return db.products.length < initialLength;
    }
  }
}
