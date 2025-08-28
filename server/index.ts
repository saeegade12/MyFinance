import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { serverConfig, validateRequiredConfig, logConfigStatus } from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
  // Validate required configuration
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
