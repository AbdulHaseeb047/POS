import { SaleRepository } from "../repositories/saleRepository";
import { ProductRepository } from "../repositories/productRepository";
import { CustomerRepository } from "../repositories/customerRepository";
import { SettingsRepository } from "../repositories/settingsRepository";
import { Sale, SaleItem } from "../models";

export class SaleService {
  static async listSales(tenantId: string): Promise<Sale[]> {
    return await SaleRepository.getAll(tenantId);
  }

  static async checkout(
    tenantId: string,
    customerId: string,
    cartItems: Array<{ product: { id: string; salePrice: number; name: string; unitType: any }; quantity: number }>,
    discount: number,
    amountPaid: number,
    paymentMethod: 'cash' | 'card' | 'credit' | 'split',
    cashierName: string
  ): Promise<{ sale: Sale; products: any[]; customers: any[]; ledger: any[] }> {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const settings = await SettingsRepository.get(tenantId) || { taxEnabled: true, taxRate: 6.5 };

    // 1. Calculate transaction sums
    const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.product.salePrice) * Number(item.quantity)), 0);
    const tax = settings.taxEnabled ? Math.round((subtotal - discount) * (settings.taxRate / 100)) : 0;
    const total = subtotal - discount + tax;

    let creditAmount = 0;
    let customerName = "Walk-in Customer";

    // 2. Adjust Customer balances if not a walk-in sale
    if (customerId !== 'walk-in') {
      const customer = await CustomerRepository.getById(tenantId, customerId);
      if (customer) {
        customerName = customer.name;
        if (paymentMethod === 'credit') {
          creditAmount = total;
        } else if (paymentMethod === 'split') {
          creditAmount = Math.max(0, total - amountPaid);
        }

        if (creditAmount > 0) {
          customer.outstandingBalance += creditAmount;
          await CustomerRepository.save(tenantId, customer);

          // Add Ledger line
          const allSales = await SaleRepository.getAll(tenantId);
          const ledgerEntry = {
            id: `led-${Date.now()}`,
            customerId,
            date: new Date().toISOString(),
            type: 'credit_sale' as const,
            amount: creditAmount,
            balanceAfter: customer.outstandingBalance,
            description: `Invoice #${allSales.length + 1006} (Udhaar Credit Purchase)`
          };
          await CustomerRepository.saveLedgerEntry(tenantId, ledgerEntry);
        }
      }
    }

    // 3. Decrement Inventory Levels
    for (const item of cartItems) {
      const product = await ProductRepository.getById(tenantId, item.product.id);
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        await ProductRepository.save(tenantId, product);
      }
    }

    // 4. Assemble Sale Invoice
    const saleItems: SaleItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: Number(item.quantity),
      unitType: item.product.unitType,
      salePrice: Number(item.product.salePrice),
      total: Number(item.product.salePrice) * Number(item.quantity)
    }));

    const allSales = await SaleRepository.getAll(tenantId);
    const newSale: Sale = {
      id: `INV-${allSales.length + 1006}`,
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
      paymentMethod,
      cashierName
    };

    const savedSale = await SaleRepository.save(tenantId, newSale);

    // Return the updated collection so frontend state is immediately in-sync with DB
    const finalProducts = await ProductRepository.getAll(tenantId);
    const finalCustomers = await CustomerRepository.getAll(tenantId);
    const finalLedger = await CustomerRepository.getLedger(tenantId);

    return {
      sale: savedSale,
      products: finalProducts,
      customers: finalCustomers,
      ledger: finalLedger
    };
  }
}
