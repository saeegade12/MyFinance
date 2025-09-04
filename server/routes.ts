// Logout endpoint
import express from "express";
const router = express.Router();

router.post("/api/auth/logout", (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie("connect.sid"); // adjust cookie name if needed
    res.status(200).json({ message: "Logged out" });
  });
});

export default router;
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import session from "express-session";
import cors from "cors";
import {
  insertTransactionSchema,
  insertAccountSchema,
  insertBudgetSchema,
  insertReceiptSchema,
} from "@shared/schema";
import { categorizeTransaction } from "./services/aiCategorization";
import { processReceiptOCR } from "./services/ocrService";
import multer from "multer";
import path from "path";
import fs from "fs";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";

// --- Middleware: require session ---
function requireSession(req: any, res: any, next: any) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
}

// --- Extend express-session types ---
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }
}

// --- Multer setup ---
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPEG, PNG, and PDF allowed."));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.set("trust proxy", 1);  

  // --- express-session ---
  app.use(
    session({
      secret: "super-secret-key", // move to process.env in production
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // true in production w/ HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  // --- AUTH ROUTES ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await storage.getUserByEmail?.(email);
    if (!user || !user.password) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await argon2.verify(user.password, password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl ?? "",
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      password: user.password
    };

  res.status(200).json({ message: "Login successful", user });
  });

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existing = await storage.getUserByEmail?.(email);
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await argon2.hash(password);
    const id = uuidv4();
    const userData = { id, email, password: hashedPassword, firstName, lastName, createdAt: new Date(), updatedAt: new Date() };

    const user = await storage.createUser?.(userData);
    if (!user) return res.status(500).json({ message: "Failed to create user" });

    res.status(201).json({ message: "User registered", user: { email: user.email, firstName: user.firstName, lastName: user.lastName } });
  });

  app.get("/api/auth/user", requireSession, async (req: any, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      // Replace with your Drizzle query
  const user = await storage.getUser?.(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // --- WEBSOCKET SETUP ---
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });
  const connections = new Map<string, any>();

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "auth" && data.userId) connections.set(data.userId, ws);
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      for (const [userId, conn] of connections.entries()) {
        if (conn === ws) connections.delete(userId);
      }
    });
  });

  const broadcast = (userId: string, data: any) => {
    const conn = connections.get(userId);
    if (conn && conn.readyState === 1) conn.send(JSON.stringify(data));
  };

  // --- ACCOUNTS ---
  app.get("/api/accounts", requireSession, async (req: any, res) => {
    const accounts = await storage.getUserAccounts(req.session.user.id);
    res.json(accounts);
  });

  app.post("/api/accounts", requireSession, async (req: any, res) => {
    const accountData = insertAccountSchema.parse({ ...req.body, userId: req.session.user.id });
    const account = await storage.createAccount(accountData);
    res.status(201).json(account);
  });

  app.put("/api/accounts/:id", requireSession, async (req: any, res) => {
    const account = await storage.updateAccount(req.params.id, insertAccountSchema.partial().parse(req.body));
    res.json(account);
  });

  app.delete("/api/accounts/:id", requireSession, async (req: any, res) => {
    await storage.deleteAccount(req.params.id);
    res.status(204).send();
  });

  // --- TRANSACTIONS ---
  app.get("/api/transactions", requireSession, async (req: any, res) => {
    const { category, accountId, startDate, endDate, limit } = req.query;
    const userId = req.session.user.id;
    let transactions;

    if (category) transactions = await storage.getTransactionsByCategory(userId, category as string);
    else if (accountId) transactions = await storage.getTransactionsByAccount(accountId as string);
    else if (startDate && endDate) transactions = await storage.getTransactionsByDateRange(userId, new Date(startDate as string), new Date(endDate as string));
    else transactions = await storage.getUserTransactions(userId, limit ? parseInt(limit as string) : 50);

    res.json(transactions);
  });

  app.post("/api/transactions", requireSession, async (req: any, res) => {
    let transactionData = insertTransactionSchema.parse({ ...req.body, userId: req.session.user.id });
    if (!req.body.category || req.body.category === "other") {
      transactionData = { ...transactionData, category: await categorizeTransaction(transactionData.description), aiCategorized: true };
    }
    const transaction = await storage.createTransaction(transactionData);
    broadcast(req.session.user.id, { type: "transaction_created", data: transaction });
    res.status(201).json(transaction);
  });

  app.put("/api/transactions/:id", requireSession, async (req: any, res) => {
    const transaction = await storage.updateTransaction(req.params.id, insertTransactionSchema.partial().parse(req.body));
    broadcast(req.session.user.id, { type: "transaction_updated", data: transaction });
    res.json(transaction);
  });

  app.delete("/api/transactions/:id", requireSession, async (req: any, res) => {
    await storage.deleteTransaction(req.params.id);
    broadcast(req.session.user.id, { type: "transaction_deleted", data: { id: req.params.id } });
    res.status(204).send();
  });

  // --- BUDGETS ---
  app.get("/api/budgets", requireSession, async (req: any, res) => {
    res.json(await storage.getBudgetsWithSpending(req.session.user.id));
  });

  app.post("/api/budgets", requireSession, async (req: any, res) => {
    const budget = await storage.createBudget(insertBudgetSchema.parse({ ...req.body, userId: req.session.user.id }));
    res.status(201).json(budget);
  });

  app.put("/api/budgets/:id", requireSession, async (req: any, res) => {
    res.json(await storage.updateBudget(req.params.id, insertBudgetSchema.partial().parse(req.body)));
  });

  app.delete("/api/budgets/:id", requireSession, async (req: any, res) => {
    await storage.deleteBudget(req.params.id);
    res.status(204).send();
  });

  // --- RECEIPTS ---
  app.get("/api/receipts", requireSession, async (req: any, res) => {
    res.json(await storage.getUserReceipts(req.session.user.id));
  });

  app.post("/api/receipts/upload", upload.single("receipt"), requireSession, async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const receipt = await storage.createReceipt({ userId: req.session.user.id, fileName: req.file.originalname, filePath: req.file.path });

    processReceiptOCR(receipt.id, req.file.path)
      .then(async (ocrResult) => {
        await storage.updateReceipt(receipt.id, { ocrText: ocrResult.text, ocrData: ocrResult.data, processedAt: new Date() });
        broadcast(req.session.user.id, { type: "receipt_processed", data: { receiptId: receipt.id, ocrResult } });
      })
      .catch((err) => console.error("OCR failed:", err));

    res.status(201).json(receipt);
  });

  // --- ANALYTICS ---
  app.get("/api/analytics/dashboard", requireSession, async (req: any, res) => {
    const userId = req.session.user.id;
    const now = new Date();
    const [totalBalance, monthlyIncome, monthlyExpenses] = await Promise.all([
      storage.getTotalBalance(userId),
      storage.getMonthlyIncome(userId, now.getMonth() + 1, now.getFullYear()),
      storage.getMonthlyExpenses(userId, now.getMonth() + 1, now.getFullYear()),
    ]);

    res.json({ totalBalance, monthlyIncome, monthlyExpenses, budgetRemaining: (parseFloat(monthlyIncome) - parseFloat(monthlyExpenses)).toFixed(2) });
  });

  app.get("/api/analytics/category-spending", requireSession, async (req: any, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    res.json(await storage.getCategorySpending(req.session.user.id, start, end));
  });

  return httpServer;
}
