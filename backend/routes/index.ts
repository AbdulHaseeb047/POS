import { Router } from "express";
import { ProductController } from "../controllers/productController";
import { CustomerController } from "../controllers/customerController";
import { SaleController } from "../controllers/saleController";
import { StaffController } from "../controllers/staffController";
import { SettingsController } from "../controllers/settingsController";
import { SubscriptionController } from "../controllers/subscriptionController";
import { SaaSAdminController } from "../controllers/saasAdminController";

// Service references to compile the consolidated initialization payload
import { ProductService } from "../services/productService";
import { CustomerService } from "../services/customerService";
import { SaleService } from "../services/saleService";
import { StaffService } from "../services/staffService";
import { SettingsService } from "../services/settingsService";
import { SubscriptionService } from "../services/subscriptionService";
import { ClientAccountService } from "../services/clientAccountService";

import { getTenantId } from "../utils/tenant";
import { tenantInitMiddleware } from "../middlewares/tenantInit";
import { featureGateMiddleware } from "../middlewares/featureCheck";

const router = Router();

// Apply the tenant initialization middleware globally to all API routes
router.use(tenantInitMiddleware);
router.use(featureGateMiddleware);

// 1. Consolidated App Bootloader
router.get("/pos-data", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const [products, customers, ledger, sales, staff, settings, subscription, clientAccount] = await Promise.all([
      ProductService.listProducts(tenantId),
      CustomerService.listCustomers(tenantId),
      CustomerService.getLedger(tenantId),
      SaleService.listSales(tenantId),
      StaffService.listStaff(tenantId),
      SettingsService.getSettings(tenantId),
      SubscriptionService.getSubscription(tenantId),
      ClientAccountService.ensureClientAccountExists(tenantId)
    ]);

    res.json({
      products,
      customers,
      ledger,
      sales,
      staff,
      settings,
      subscription,
      clientAccount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to consolidate system assets" });
  }
});

// SaaS Admin Panel Endpoints (Owner Gated on Admin Dashboard Tab)
router.get("/saas/clients", SaaSAdminController.listClients);
router.get("/saas/clients/:id", SaaSAdminController.getClient);
router.post("/saas/clients", SaaSAdminController.createClient);
router.put("/saas/clients/:id", SaaSAdminController.updateClient);
router.post("/saas/clients/:id/suspend", SaaSAdminController.suspendClient);
router.delete("/saas/clients/:id", SaaSAdminController.deleteClient);
router.get("/saas/logs", SaaSAdminController.getAuditLogs);

// 2. Product Endpoints
router.get("/products", ProductController.list);
router.post("/products", ProductController.create);
router.put("/products/:id", ProductController.update);
router.delete("/products/:id", ProductController.delete);
router.post("/products/adjust-stock", ProductController.adjustStock);

// 3. Customer Endpoints
router.get("/customers", CustomerController.list);
router.post("/customers", CustomerController.create);
router.put("/customers/:id", CustomerController.update);
router.post("/customers/receive-payment", CustomerController.receivePayment);

// 4. Sales & Invoices
router.get("/sales", SaleController.list);
router.post("/sales/checkout", SaleController.checkout);

// 5. Staff Accounts
router.get("/staff", StaffController.list);
router.post("/staff", StaffController.create);

// 6. Settings Setup
router.get("/settings", SettingsController.get);
router.put("/settings", SettingsController.update);

// 7. Licensing Subscriptions
router.get("/subscription", SubscriptionController.get);
router.post("/subscription/change-plan", SubscriptionController.changePlan);
router.post("/subscription/reset-trial", SubscriptionController.resetTrial);

export default router;
