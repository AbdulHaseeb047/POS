import { ClientAccountRepository } from "../repositories/clientAccountRepository";
import { SubscriptionRepository } from "../repositories/subscriptionRepository";
import { SettingsRepository } from "../repositories/settingsRepository";
import { ClientAccount, AuditLog } from "../models";

export class ClientAccountService {
  static async listClients(): Promise<ClientAccount[]> {
    return await ClientAccountRepository.getAll();
  }

  static async getClientById(id: string): Promise<ClientAccount | null> {
    return await ClientAccountRepository.getById(id);
  }

  static async ensureClientAccountExists(id: string): Promise<ClientAccount> {
    const existing = await ClientAccountRepository.getById(id);
    if (existing) return existing;

    // Retrieve active business name and plan to initialize correctly
    const [sub, settings] = await Promise.all([
      SubscriptionRepository.get(id),
      SettingsRepository.get(id)
    ]);

    const businessName = settings?.businessName || `Workspace ${id}`;
    
    // Map subscription plan to tier
    let tier: 'Starter' | 'Growth' | 'Restaurant' | 'Enterprise' = 'Growth';
    if (sub) {
      if (sub.plan === 'Starter') tier = 'Starter';
      else if (sub.plan === 'Standard') tier = 'Growth';
      else if (sub.plan === 'Pro') tier = 'Restaurant';
      else if (sub.plan === 'Enterprise') tier = 'Enterprise';
    }

    const enabledFeatures = ClientAccountRepository.getFeaturesForTier(tier);
    const allowedUsers = ClientAccountRepository.getUsersForTier(tier);

    const newClient: ClientAccount = {
      id,
      businessName,
      ownerName: "Business Owner",
      phone: settings?.phone || "N/A",
      email: `${id}@zappos.pk`,
      inviteLink: `https://zappos.pk/invite/${id}`,
      tier,
      status: 'trial',
      signupDate: new Date().toISOString(),
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      enabledFeatures,
      allowedUsers
    };

    return await ClientAccountRepository.save(newClient);
  }

  static async createClientManual(data: Omit<ClientAccount, 'signupDate' | 'startDate' | 'renewalDate' | 'enabledFeatures' | 'allowedUsers'>): Promise<ClientAccount> {
    const id = data.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || `tenant-${Date.now()}`;
    
    const existing = await ClientAccountRepository.getById(id);
    if (existing) throw new Error("A client workspace with this ID already exists.");

    const enabledFeatures = ClientAccountRepository.getFeaturesForTier(data.tier);
    const allowedUsers = ClientAccountRepository.getUsersForTier(data.tier);

    const client: ClientAccount = {
      ...data,
      id,
      signupDate: new Date().toISOString(),
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      enabledFeatures,
      allowedUsers
    };

    const saved = await ClientAccountRepository.save(client);

    // Audit log
    await this.logAdminAction(
      "CREATE_CLIENT",
      "SaaS Owner",
      id,
      `Manually provisioned workspace with tier: ${client.tier}, allowed users: ${client.allowedUsers}`
    );

    return saved;
  }

  static async updateClient(id: string, updates: Partial<ClientAccount>, performedBy: string = "SaaS Owner"): Promise<ClientAccount> {
    const existing = await ClientAccountRepository.getById(id);
    if (!existing) throw new Error("Client account not found");

    const previousTier = existing.tier;
    const previousFeatures = [...existing.enabledFeatures];
    const previousUsers = existing.allowedUsers;
    const previousStatus = existing.status;

    // Apply updates
    const updated: ClientAccount = {
      ...existing,
      ...updates,
      id // prevent id mutation
    };

    // If tier was updated, let's reset features & user limit to matching presets unless also overridden in this request
    if (updates.tier && updates.tier !== previousTier) {
      if (!updates.enabledFeatures) {
        updated.enabledFeatures = ClientAccountRepository.getFeaturesForTier(updates.tier);
      }
      if (updates.allowedUsers === undefined) {
        updated.allowedUsers = ClientAccountRepository.getUsersForTier(updates.tier);
      }
    }

    const saved = await ClientAccountRepository.save(updated);

    // Generate descriptive audit log for accountability
    const changes: string[] = [];
    if (updates.tier && updates.tier !== previousTier) changes.push(`Tier: ${previousTier} -> ${updates.tier}`);
    if (updates.status && updates.status !== previousStatus) changes.push(`Status: ${previousStatus} -> ${updates.status}`);
    if (updates.allowedUsers !== undefined && updates.allowedUsers !== previousUsers) changes.push(`Allowed Users: ${previousUsers} -> ${updates.allowedUsers}`);
    
    // Feature diffs
    if (updates.enabledFeatures) {
      const added = updates.enabledFeatures.filter(f => !previousFeatures.includes(f));
      const removed = previousFeatures.filter(f => !updates.enabledFeatures!.includes(f));
      if (added.length > 0) changes.push(`Enabled: [${added.join(", ")}]`);
      if (removed.length > 0) changes.push(`Disabled: [${removed.join(", ")}]`);
    }

    if (changes.length > 0) {
      await this.logAdminAction(
        "UPDATE_CLIENT",
        performedBy,
        id,
        `Updated client properties: ${changes.join("; ")}`
      );
    }

    return saved;
  }

  static async suspendOrDeleteClient(id: string, action: "suspend" | "delete", performedBy: string = "SaaS Owner"): Promise<boolean> {
    const existing = await ClientAccountRepository.getById(id);
    if (!existing) throw new Error("Client workspace not found");

    if (action === "suspend") {
      existing.status = "suspended";
      await ClientAccountRepository.save(existing);
      await this.logAdminAction(
        "SUSPEND_CLIENT",
        performedBy,
        id,
        "Suspended client workspace access"
      );
      return true;
    } else {
      const success = await ClientAccountRepository.delete(id);
      if (success) {
        await this.logAdminAction(
          "DELETE_CLIENT",
          performedBy,
          id,
          "Permanently deleted client workspace registration and settings"
        );
      }
      return success;
    }
  }

  static async getAuditLogs(): Promise<AuditLog[]> {
    return await ClientAccountRepository.getAuditLogs();
  }

  static async logAdminAction(action: string, performedBy: string, clientId: string, details: string): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      performedBy,
      clientId,
      details
    };
    return await ClientAccountRepository.addAuditLog(log);
  }
}
