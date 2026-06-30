import { ProductRepository } from "../repositories/productRepository";
import { Product } from "../models";

export class ProductService {
  static async listProducts(tenantId: string): Promise<Product[]> {
    return await ProductRepository.getAll(tenantId);
  }

  static async createProduct(tenantId: string, data: Omit<Product, 'id'>): Promise<Product> {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...data,
      id,
      stockQuantity: Number(data.stockQuantity) || 0,
      costPrice: Number(data.costPrice) || 0,
      salePrice: Number(data.salePrice) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5
    };
    return await ProductRepository.save(tenantId, product);
  }

  static async updateProduct(tenantId: string, id: string, updates: Partial<Product>): Promise<Product> {
    const existing = await ProductRepository.getById(tenantId, id);
    if (!existing) throw new Error("Product not found");

    const updated: Product = {
      ...existing,
      ...updates,
      stockQuantity: updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : existing.stockQuantity,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : existing.costPrice,
      salePrice: updates.salePrice !== undefined ? Number(updates.salePrice) : existing.salePrice,
      lowStockThreshold: updates.lowStockThreshold !== undefined ? Number(updates.lowStockThreshold) : existing.lowStockThreshold
    };
    return await ProductRepository.save(tenantId, updated);
  }

  static async deleteProduct(tenantId: string, id: string): Promise<boolean> {
    return await ProductRepository.delete(tenantId, id);
  }

  static async adjustStock(tenantId: string, productId: string, amount: number): Promise<Product> {
    const product = await ProductRepository.getById(tenantId, productId);
    if (!product) throw new Error("Product not found");

    product.stockQuantity = Math.max(0, product.stockQuantity + amount);
    return await ProductRepository.save(tenantId, product);
  }
}
