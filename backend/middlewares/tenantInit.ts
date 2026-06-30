import { Request, Response, NextFunction } from "express";
import { getTenantId } from "../utils/tenant";
import { getPgStatus, dbQuery, readLocalDB, lazySeedTenant, lazySeedLocalTenant } from "../db";

const seededTenantsCache = new Set<string>();

export async function tenantInitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = getTenantId(req);
    
    if (!seededTenantsCache.has(tenantId)) {
      const pg = getPgStatus();
      if (pg.active) {
        // Query the DB pool to check if we need to lazy seed
        const pool = (await import("../db")).dbQuery; // lazy load to avoid circular deps
        await lazySeedTenant({ query: dbQuery }, tenantId);
      } else {
        const db = await readLocalDB();
        await lazySeedLocalTenant(db, tenantId);
      }
      seededTenantsCache.add(tenantId);
    }
    
    next();
  } catch (err) {
    console.error("Failed to initialize tenant space:", err);
    next();
  }
}
