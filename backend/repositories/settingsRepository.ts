import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { BusinessSettings } from "../models";

export class SettingsRepository {
  static async get(tenantId: string): Promise<BusinessSettings | null> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT data FROM settings WHERE tenant_id = $1 AND id = 'business_config'",
        [tenantId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0].data;
    } else {
      const db = await readLocalDB();
      const row = db.settings.find(s => s.tenantId === tenantId && s.id === 'business_config');
      return row ? row.data : null;
    }
  }

  static async save(tenantId: string, settings: BusinessSettings): Promise<BusinessSettings> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO settings (tenant_id, id, data) VALUES ($1, 'business_config', $2)
         ON CONFLICT (tenant_id, id) DO UPDATE SET data = $2`,
        [tenantId, JSON.stringify(settings)]
      );
      return settings;
    } else {
      const db = await readLocalDB();
      const idx = db.settings.findIndex(s => s.tenantId === tenantId && s.id === 'business_config');
      if (idx !== -1) {
        db.settings[idx].data = settings;
      } else {
        db.settings.push({ tenantId, id: 'business_config', data: settings });
      }
      await writeLocalDB(db);
      return settings;
    }
  }
}
