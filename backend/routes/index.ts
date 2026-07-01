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

// 8. Google OAuth Integrations (OAuth-sandbox-friendly)
router.get("/auth/google/url", (req, res) => {
  const isProdKeys = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (isProdKeys) {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: 'state_google_auth'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  } else {
    // Return simulator URL hosted on our app!
    res.json({ url: `${req.protocol}://${req.get('host')}/api/auth/google/simulator` });
  }
});

router.get("/auth/google/simulator", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Google Account Sign-In (ZapPOS Sandbox)</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-[#f0f4f9] text-[#1f1f1f] flex flex-col justify-center items-center min-h-screen p-4">
        <div class="bg-white rounded-[28px] max-w-md w-full p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-200">
          <!-- Google G Logo -->
          <div class="flex justify-center mb-6">
            <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>

          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-[#1f1f1f]">Sign in with Google</h1>
            <p class="text-sm text-[#5f6368] mt-1">to continue to <strong class="text-primary font-extrabold">ZapPOS Pakistan</strong></p>
          </div>

          <!-- Alert Badge -->
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 mb-6 space-y-1">
            <p class="font-bold flex items-center gap-1.5">
              <span>⚠️ Developer Sandbox Mode Active</span>
            </p>
            <p class="font-sans leading-relaxed text-[11px] text-amber-700">
              <code>GOOGLE_CLIENT_ID</code> env variable is not set. You are interacting with the built-in secure OAuth Sandbox. Select a simulated Google account to authorize immediately.
            </p>
          </div>

          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">Simulated Google Accounts</h2>
          
          <div class="space-y-2.5 mb-6">
            <!-- Account 1 -->
            <button onclick="selectAccount('abdulhaseebb976@gmail.com', 'Abdul Haseeb')" class="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition-all group">
              <div class="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-sans">
                AH
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-800">Abdul Haseeb (Owner)</p>
                <p class="text-[11px] text-slate-500 truncate font-mono">abdulhaseebb976@gmail.com</p>
              </div>
              <span class="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
            </button>

            <!-- Account 2 -->
            <button onclick="selectAccount('owner@zappos.pk', 'ZapPOS Owner')" class="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition-all group">
              <div class="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold font-sans">
                ZP
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-800">ZapPOS Store Owner</p>
                <p class="text-[11px] text-slate-500 truncate font-mono">owner@zappos.pk</p>
              </div>
              <span class="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
            </button>
          </div>

          <!-- Custom Account Form -->
          <div class="border-t border-slate-150 pt-5">
            <h3 class="text-xs font-bold text-slate-500 font-sans mb-3">Or sign-in with any custom account</h3>
            <div class="space-y-3">
              <div>
                <input id="custom-name" type="text" placeholder="Your Name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div class="flex gap-2">
                <input id="custom-email" type="email" placeholder="email@gmail.com" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white font-mono" />
                <button onclick="submitCustom()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all">Sign In</button>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center text-[10px] text-slate-400 font-sans leading-normal">
            By continuing, Google shares your name, email, language preference, and profile picture with ZapPOS.
          </div>
        </div>

        <script>
          function selectAccount(email, name) {
            const redirectUrl = '/auth/callback?code=sim_' + encodeURIComponent(email) + '_' + encodeURIComponent(name);
            window.location.href = redirectUrl;
          }

          function submitCustom() {
            const name = document.getElementById('custom-name').value.trim() || 'Custom Google User';
            const email = document.getElementById('custom-email').value.trim();
            if (!email) {
              alert('Please enter an email address.');
              return;
            }
            selectAccount(email, name);
          }
        </script>
      </body>
    </html>
  `);
});

export default router;
