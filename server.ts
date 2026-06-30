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
