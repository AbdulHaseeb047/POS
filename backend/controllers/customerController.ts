import { Request, Response } from "express";
import { CustomerService } from "../services/customerService";
import { getTenantId } from "../utils/tenant";

export class CustomerController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const list = await CustomerService.listCustomers(tenantId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve customers" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const customer = await CustomerService.createCustomer(tenantId, req.body);
      res.status(201).json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create customer" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      const customer = await CustomerService.updateCustomer(tenantId, id, req.body);
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update customer" });
    }
  }

  static async receivePayment(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { customerId, amount, reference } = req.body;
      const result = await CustomerService.receivePayment(tenantId, customerId, amount, reference);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to process ledger payment" });
    }
  }
}
