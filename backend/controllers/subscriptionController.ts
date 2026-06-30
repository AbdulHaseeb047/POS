import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscriptionService";
import { getTenantId } from "../utils/tenant";

export class SubscriptionController {
  static async get(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sub = await SubscriptionService.getSubscription(tenantId);
      res.json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve subscription info" });
    }
  }

  static async changePlan(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const { plan } = req.body;
      const sub = await SubscriptionService.changePlan(tenantId, plan);
      res.json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to modify subscription tier" });
    }
  }

  static async resetTrial(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sub = await SubscriptionService.resetTrial(tenantId);
      res.json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reset trial license" });
    }
  }
}
