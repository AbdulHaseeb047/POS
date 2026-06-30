import { Request } from "express";

export function getTenantId(req: Request): string {
  // Extract tenant from custom header. Default to 'tenant-default' if not specified.
  const headerVal = req.headers["x-tenant-id"];
  if (Array.isArray(headerVal)) {
    return headerVal[0] || "tenant-default";
  }
  return headerVal || "tenant-default";
}
