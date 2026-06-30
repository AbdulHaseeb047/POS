import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { Subscription } from "../models";

export class SubscriptionRepository {
  static async get(tenantId: string): Promise<Subscription | null> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT data FROM subscription WHERE tenant_id = $1 AND id = 'active_license'",
        [tenantId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0].data;
    } else {
      const db = await readLocalDB();
      const row = db.subscription.find(s => s.tenantId === tenantId && s.id === 'active_license');
      return row ? row.data : null;
    }
  }

  static async save(tenantId: string, subscription: Subscription): Promise<Subscription> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO subscription (tenant_id, id, data) VALUES ($1, 'active_license', $2)
         ON CONFLICT (tenant_id, id) DO UPDATE SET data = $2`,
        [tenantId, JSON.stringify(subscription)]
      );
      return subscription;
    } else {
      const db = await readLocalDB();
      const idx = db.subscription.findIndex(s => s.tenantId === tenantId && s.id === 'active_license');
      if (idx !== -1) {
        db.subscription[idx].data = subscription;
      } else {
        db.subscription.push({ tenantId, id: 'active_license', data: subscription });
      }
      await writeLocalDB(db);
      return subscription;
    }
  }
}
