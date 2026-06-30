import { Request, Response } from "express";
import { StaffService } from "../services/staffService";
import { getTenantId } from "../utils/tenant";

export class StaffController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const list = await StaffService.listStaff(tenantId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve staff roster" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { name, email, role } = req.body;
      const user = await StaffService.addStaff(tenantId, name, email, role);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create staff account" });
    }
  }
}
