import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { serverConfig, validateRequiredConfig, logConfigStatus } from "./config";

import session from "express-session";
import cors from "cors";

// ESM fix for __dirname / __filename
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware BEFORE session and routes
app.use(
  cors({
    origin: "http://localhost:5173", // frontend dev server
    credentials: true,
  })
);

// Add express-session middleware here
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
  })
);

// Middleware for logging API requests
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    validateRequiredConfig();
    logConfigStatus();
  } catch (error: any) {
    console.error("❌ Configuration error:", error.message);
    process.exit(1);
  }

  // Register your API routes
  await registerRoutes(app);

  // Create an HTTP server instance for Express
  const server = createServer(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

if (app.get("env") !== "development") {
  const clientDistPath = path.join(__dirname, "./public");

  // Serve static assets (CSS, JS, images, etc.)
  app.use(express.static(clientDistPath));

  // Serve index.html for any route not starting with /api
  app.get("*", (req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientDistPath, "index.html"));
    } else {
      next();
    }
  });
}

  // Setup Vite (development) or serve static build (production)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = serverConfig.port;
  server.listen(port, "localhost", () => {
    log(`🚀 FinancePilot server running on http://localhost:${port}`);
    log(`📊 Environment: ${serverConfig.nodeEnv}`);
  });
})();
