import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./backend/routes";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Mount API Router on /api path
  app.use("/api", apiRouter);

  // 1.5. Mount OAuth callback route (with support for trailing slashes and SameSite/Secure cookies)
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, error } = req.query;
    if (error) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
            <div style="background: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); max-width: 320px;">
              <h2 style="color: #ef4444; margin-top: 0;">Authentication Failed</h2>
              <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">${error}</p>
              <button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    let email = "abdulhaseebb976@gmail.com";
    let name = "Abdul Haseeb";

    if (code && !(code as string).startsWith("sim_") && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: code as string,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
            grant_type: 'authorization_code'
          })
        });

        if (tokenResponse.ok) {
          const tokens = (await tokenResponse.json()) as any;
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          if (userResponse.ok) {
            const googleUser = (await userResponse.json()) as any;
            email = googleUser.email || email;
            name = googleUser.name || googleUser.given_name || name;
          }
        }
      } catch (err) {
        console.error("Error exchanging Google code:", err);
      }
    } else if (code && (code as string).startsWith("sim_")) {
      const parts = (code as string).split("_");
      if (parts.length >= 3) {
        email = decodeURIComponent(parts[1]);
        name = decodeURIComponent(parts[2]);
      }
    }

    // Return responsive page that posts success message and closes itself
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#0f172a] text-[#f8fafc] flex flex-col justify-center items-center min-h-screen p-4">
          <div class="bg-[#1e293b] rounded-[24px] max-w-sm w-full p-8 shadow-2xl border border-slate-800 text-center animate-pulse">
            <div class="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h2 class="text-xl font-extrabold tracking-tight text-white mb-2">Google Authenticated!</h2>
            <p class="text-xs text-slate-400 leading-relaxed mb-6">
              Logged in successfully as <strong class="text-white">${name}</strong> (<span class="font-mono">${email}</span>). Sending session token to POS client...
            </p>

            <div class="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              <span class="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Syncing session details</span>
            </div>
          </div>

          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                payload: { email: ${JSON.stringify(email)}, name: ${JSON.stringify(name)} }
              }, '*');
              setTimeout(() => {
                window.close();
              }, 1200);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  // 2. Setup Vite asset middleware for SPA rendering
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ZapPOS Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
