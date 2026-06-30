import { Request, Response, NextFunction } from "express";
import { getTenantId } from "../utils/tenant";
import { ClientAccountService } from "../services/clientAccountService";

export async function featureGateMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = getTenantId(req);

    // Bypass feature gating for SaaS Admin requests
    if (req.path.startsWith("/saas")) {
      return next();
    }

    // Ensure the client workspace entry is initialized and loaded
    const client = await ClientAccountService.ensureClientAccountExists(tenantId);

    // Check if subscription or trial has lapsed based on timestamp
    const now = new Date();
    const renewal = new Date(client.renewalDate);
    
    let currentStatus = client.status;
    if (currentStatus === "trial" || currentStatus === "active") {
      if (now > renewal) {
        currentStatus = "expired";
        // Update client record in repository
        await ClientAccountService.updateClient(tenantId, { status: "expired" }, "System Auto-Check");
      }
    }

    // Attach client profile to request for easy controller consumption
    (req as any).clientAccount = client;

    // Allow billing settings / subscription endpoints to be accessed to facilitate renewal
    const isExemptEndpoint = 
      req.path === "/pos-data" || 
      req.path === "/subscription" || 
      req.path.startsWith("/subscription/") ||
      req.path === "/settings" ||
      req.method === "GET"; // Allow viewing data so dashboard boots with expired message

    if (currentStatus === "suspended" || currentStatus === "expired") {
      if (!isExemptEndpoint) {
        return res.status(403).json({
          error: "SUBSCRIPTION_RESTRICTED",
          status: currentStatus,
          message: currentStatus === "suspended" 
            ? "Your ZapPOS account has been suspended by the administrator."
            : "Your subscription/trial license has expired. Please renew your plan."
        });
      }
    }

    // Enforce feature flags on mutation endpoints
    const features = client.enabledFeatures || [];

    // 1. Udhaar/Credit Ledger enforcement
    if (req.path === "/customers/receive-payment") {
      if (!features.includes("udhaar")) {
        return res.status(403).json({
          error: "FEATURE_DISABLED",
          feature: "udhaar",
          message: "Udhaar / Credit Ledger is not enabled in your subscription tier."
        });
      }
    }

    // Check if they are trying to process a credit checkout transaction
    if (req.path === "/sales/checkout") {
      const { paymentMethod } = req.body;
      if ((paymentMethod === "credit" || paymentMethod === "split") && !features.includes("udhaar")) {
        return res.status(403).json({
          error: "FEATURE_DISABLED",
          feature: "udhaar",
          message: "Udhaar / Credit purchase is disabled. Please upgrade your subscription to use Credit Ledger."
        });
      }
    }

    // 2. Staff count limit enforcement (backend enforcement)
    if (req.path === "/staff" && req.method === "POST") {
      // Import dynamically to avoid circular reference issues
      const { StaffService } = await import("../services/staffService");
      const currentStaff = await StaffService.listStaff(tenantId);
      if (currentStaff.length >= client.allowedUsers) {
        return res.status(403).json({
          error: "USER_LIMIT_EXCEEDED",
          limit: client.allowedUsers,
          message: `Your subscription tier only permits up to ${client.allowedUsers} user accounts/devices.`
        });
      }
    }

    next();
  } catch (err: any) {
    console.error("Feature gating error:", err);
    next();
  }
}
