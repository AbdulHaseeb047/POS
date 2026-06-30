import { Request, Response } from "express";
import { ProductService } from "../services/productService";
import { getTenantId } from "../utils/tenant";

export class ProductController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const list = await ProductService.listProducts(tenantId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve products" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const product = await ProductService.createProduct(tenantId, req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create product" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      const product = await ProductService.updateProduct(tenantId, id, req.body);
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update product" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      await ProductService.deleteProduct(tenantId, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete product" });
    }
  }

  static async adjustStock(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { productId, amount } = req.body;
      const product = await ProductService.adjustStock(tenantId, productId, amount);
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to adjust stock level" });
    }
  }
}
