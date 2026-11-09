import { loadEnvFile } from "node:process";
try { loadEnvFile(new URL(".env", import.meta.url)); } catch { /* .env is optional */ }

import vibe, { cors } from "vibe-gx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authPlugin from "./plugins/auth.js";
import accountsPlugin from "./plugins/accounts.js";
import transfersPlugin from "./plugins/transfers.js";
import otpPlugin from "./plugins/otp.js";
import adminPlugin from "./plugins/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

// Initialize Vibe-GX server
const app = vibe({
  logger: {
    lifecycle: true,
    prettyPrint: true,
    level: "info",
  },
});

// Enable CORS for frontend requests
app.plugin(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  })
);

// Custom Error Handler
app.setErrorHandler((error, req, res) => {
  req.log.error(error);
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    error: error.message || "Internal Server Error",
  });
});

// Health check endpoint
app.get("/api/health", () => ({
  status: "ONLINE",
  name: "First Horizon Bank API",
  framework: "Vibe-GX",
  timestamp: new Date().toISOString(),
}));

// Register modular API plugins
await app.register(authPlugin, { prefix: "/api/auth" });
await app.register(accountsPlugin, { prefix: "/api/accounts" });
await app.register(transfersPlugin, { prefix: "/api/transfers" });
await app.register(otpPlugin, { prefix: "/api/otp" });
await app.register(adminPlugin, { prefix: "/api/admin" });

// Serve frontend build if dist folder exists
const clientDist = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.setPublicFolder(clientDist);

  // Root landing / SPA index
  app.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendHtml("index.html");
  });
  
  // Static assets
  app.get("/assets/*", (req, res) => {
    const cleanPath = req.url.split("?")[0].replace(/^\//, "");
    res.sendFile(cleanPath);
  });

  // SPA fallback for React Router and root-level static files
  app.get("/*", (req, res) => {
    // Avoid intercepting API routes that returned 404
    if (req.url.startsWith("/api/")) {
      return res.status(404).json({ error: "Endpoint not found" });
    }

    const cleanPath = req.url.split("?")[0].replace(/^\//, "");
    const filePath = path.resolve(clientDist, cleanPath);
    if (cleanPath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(cleanPath);
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendHtml("index.html");
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🏦  First Horizon Bank Server is RUNNING!`);
  console.log(`⚡  Framework: Vibe-GX (High Performance ESM)`);
  console.log(`🔗  Local API: http://localhost:${PORT}/api/health`);
  console.log(`=================================================\n`);
});
