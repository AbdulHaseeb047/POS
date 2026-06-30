import { Request, Response } from "express";
import { ClientAccountService } from "../services/clientAccountService";

export class SaaSAdminController {
  static async listClients(req: Request, res: Response) {
    try {
      const list = await ClientAccountService.listClients();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch client list" });
    }
  }

  static async getClient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const client = await ClientAccountService.getClientById(id);
      if (!client) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve workspace details" });
    }
  }

  static async createClient(req: Request, res: Response) {
    try {
      const client = await ClientAccountService.createClientManual(req.body);
      res.status(201).json(client);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to manually register workspace" });
    }
  }

  static async updateClient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const client = await ClientAccountService.updateClient(id, req.body);
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update feature gates" });
    }
  }

  static async suspendClient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ClientAccountService.suspendOrDeleteClient(id, "suspend");
      res.json({ success: true, message: "Workspace successfully suspended" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to suspend workspace" });
    }
  }

  static async deleteClient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ClientAccountService.suspendOrDeleteClient(id, "delete");
      res.json({ success: true, message: "Workspace successfully removed" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to remove workspace registration" });
    }
  }

  static async getAuditLogs(req: Request, res: Response) {
    try {
      const logs = await ClientAccountService.getAuditLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch SaaS audit trails" });
    }
  }
}
