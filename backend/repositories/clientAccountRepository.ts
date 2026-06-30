import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { ClientAccount, AuditLog } from "../models";

const TIER_FEATURES: Record<string, string[]> = {
  Starter: ["billing_sales", "basic_inventory"],
  Growth: ["billing_sales", "basic_inventory", "udhaar", "full_reports", "mobile_terminal", "offline_sync"],
  Restaurant: ["billing_sales", "basic_inventory", "udhaar", "full_reports", "mobile_terminal", "offline_sync", "kot_module"],
  Enterprise: ["billing_sales", "basic_inventory", "udhaar", "full_reports", "mobile_terminal", "offline_sync", "kot_module", "multi_sync", "fbr_integration"]
};

const TIER_USERS: Record<string, number> = {
  Starter: 1,
  Growth: 3,
  Restaurant: 5,
  Enterprise: 99
};

export class ClientAccountRepository {
  static getFeaturesForTier(tier: string): string[] {
    return TIER_FEATURES[tier] || TIER_FEATURES.Starter;
  }

  static getUsersForTier(tier: string): number {
    return TIER_USERS[tier] || 1;
  }

  static async getAll(): Promise<ClientAccount[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery("SELECT * FROM client_accounts ORDER BY signup_date DESC");
      return res.rows.map(row => ({
        id: row.id,
        businessName: row.business_name,
        ownerName: row.owner_name,
        phone: row.phone,
        email: row.email,
        inviteLink: row.invite_link,
        tier: row.tier,
        status: row.status,
        signupDate: row.signup_date,
        startDate: row.start_date,
        renewalDate: row.renewal_date,
        enabledFeatures: row.enabled_features ? row.enabled_features.split(",") : [],
        allowedUsers: Number(row.allowed_users)
      }));
    } else {
      const db = await readLocalDB();
      return db.client_accounts || [];
    }
  }

  static async getById(id: string): Promise<ClientAccount | null> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery("SELECT * FROM client_accounts WHERE id = $1", [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        businessName: row.business_name,
        ownerName: row.owner_name,
        phone: row.phone,
        email: row.email,
        inviteLink: row.invite_link,
        tier: row.tier,
        status: row.status,
        signupDate: row.signup_date,
        startDate: row.start_date,
        renewalDate: row.renewal_date,
        enabledFeatures: row.enabled_features ? row.enabled_features.split(",") : [],
        allowedUsers: Number(row.allowed_users)
      };
    } else {
      const db = await readLocalDB();
      const client = db.client_accounts.find(c => c.id === id);
      return client || null;
    }
  }

  static async save(client: ClientAccount): Promise<ClientAccount> {
    const pg = getPgStatus();
    const featuresStr = client.enabledFeatures.join(",");
    if (pg.active) {
      await dbQuery(
        `INSERT INTO client_accounts 
         (id, business_name, owner_name, phone, email, invite_link, tier, status, signup_date, start_date, renewal_date, enabled_features, allowed_users)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
         business_name = $2, owner_name = $3, phone = $4, email = $5, invite_link = $6, tier = $7, status = $8, start_date = $10, renewal_date = $11, enabled_features = $12, allowed_users = $13`,
        [
          client.id,
          client.businessName,
          client.ownerName,
          client.phone,
          client.email,
          client.inviteLink,
          client.tier,
          client.status,
          client.signupDate,
          client.startDate,
          client.renewalDate,
          featuresStr,
          client.allowedUsers
        ]
      );
      return client;
    } else {
      const db = await readLocalDB();
      const idx = db.client_accounts.findIndex(c => c.id === client.id);
      if (idx !== -1) {
        db.client_accounts[idx] = client;
      } else {
        db.client_accounts.push(client);
      }
      await writeLocalDB(db);
      return client;
    }
  }

  static async delete(id: string): Promise<boolean> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery("DELETE FROM client_accounts WHERE id = $1", [id]);
      return true;
    } else {
      const db = await readLocalDB();
      const lenBefore = db.client_accounts.length;
      db.client_accounts = db.client_accounts.filter(c => c.id !== id);
      await writeLocalDB(db);
      return db.client_accounts.length < lenBefore;
    }
  }

  static async getAuditLogs(): Promise<AuditLog[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery("SELECT * FROM audit_logs ORDER BY timestamp DESC");
      return res.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        action: row.action,
        performedBy: row.performed_by,
        clientId: row.client_id,
        details: row.details
      }));
    } else {
      const db = await readLocalDB();
      return db.audit_logs || [];
    }
  }

  static async addAuditLog(log: AuditLog): Promise<AuditLog> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO audit_logs (id, timestamp, action, performed_by, client_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [log.id, log.timestamp, log.action, log.performedBy, log.clientId, log.details]
      );
      return log;
    } else {
      const db = await readLocalDB();
      db.audit_logs.unshift(log);
      await writeLocalDB(db);
      return log;
    }
  }
}
