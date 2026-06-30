import { Request, Response } from "express";
import { SettingsService } from "../services/settingsService";
import { getTenantId } from "../utils/tenant";

export class SettingsController {
  static async get(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const s = await SettingsService.getSettings(tenantId);
      res.json(s);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve settings" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const s = await SettingsService.updateSettings(tenantId, req.body);
      res.json(s);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update settings" });
    }
  }
}
