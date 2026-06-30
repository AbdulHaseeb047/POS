import { Request, Response } from "express";
import { SaleService } from "../services/saleService";
import { getTenantId } from "../utils/tenant";

export class SaleController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const list = await SaleService.listSales(tenantId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve sales history" });
    }
  }

  static async checkout(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { customerId, cartItems, discount, amountPaid, paymentMethod, cashierName } = req.body;
      const result = await SaleService.checkout(
        tenantId,
        customerId,
        cartItems,
        discount,
        amountPaid,
        paymentMethod,
        cashierName
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to complete checkout" });
    }
  }
}
