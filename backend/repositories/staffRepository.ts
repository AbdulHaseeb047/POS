import { dbQuery, getPgStatus, readLocalDB, writeLocalDB } from "../db";
import { StaffUser } from "../models";

export class StaffRepository {
  static async getAll(tenantId: string): Promise<StaffUser[]> {
    const pg = getPgStatus();
    if (pg.active) {
      const res = await dbQuery(
        "SELECT * FROM staff WHERE tenant_id = $1 ORDER BY date_added DESC",
        [tenantId]
      );
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        dateAdded: row.date_added,
        status: row.status
      }));
    } else {
      const db = await readLocalDB();
      return db.staff.filter(s => s.tenantId === tenantId);
    }
  }

  static async save(tenantId: string, user: StaffUser): Promise<StaffUser> {
    const pg = getPgStatus();
    if (pg.active) {
      await dbQuery(
        `INSERT INTO staff (tenant_id, id, name, email, role, date_added, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, id) DO UPDATE SET
         name = $3, email = $4, role = $5, status = $7`,
        [
          tenantId,
          user.id,
          user.name,
          user.email,
          user.role,
          user.dateAdded,
          user.status
        ]
      );
      return user;
    } else {
      const db = await readLocalDB();
      const userWithTenant = { ...user, tenantId };
      const idx = db.staff.findIndex(s => s.tenantId === tenantId && s.id === user.id);
      if (idx !== -1) {
        db.staff[idx] = userWithTenant;
      } else {
        db.staff.push(userWithTenant);
      }
      await writeLocalDB(db);
      return user;
    }
  }
}
