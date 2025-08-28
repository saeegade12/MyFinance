import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertAccountSchema, insertBudgetSchema, insertReceiptSchema } from "@shared/schema";
import { categorizeTransaction } from "./services/aiCategorization";
import { processReceiptOCR } from "./services/ocrService";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'
  });

  // Store WebSocket connections by user ID
  const connections = new Map<string, any>();

  wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'auth' && data.userId) {
          connections.set(data.userId, ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection when user disconnects
      Array.from(connections.entries()).forEach(([userId, connection]) => {
        if (connection === ws) {
          connections.delete(userId);
        }
      });
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (userId: string, data: any) => {
    const connection = connections.get(userId);
    if (connection && connection.readyState === 1) {
      connection.send(JSON.stringify(data));
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account routes
  app.get('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  app.put('/api/accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(400).json({ message: "Failed to update account" });
    }
  });

  app.delete('/api/accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAccount(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(400).json({ message: "Failed to delete account" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit, category, accountId, startDate, endDate } = req.query;
      
      let transactions;
      if (category) {
        transactions = await storage.getTransactionsByCategory(userId, category as string);
      } else if (accountId) {
        transactions = await storage.getTransactionsByAccount(accountId as string);
      } else if (startDate && endDate) {
        transactions = await storage.getTransactionsByDateRange(
          userId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        transactions = await storage.getUserTransactions(userId, limit ? parseInt(limit as string) : 50);
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      
      // Apply AI categorization if not explicitly provided
      if (!req.body.category || req.body.category === 'other') {
        const category = await categorizeTransaction(transactionData.description);
        transactionData = { ...transactionData, category, aiCategorized: true };
      }
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Broadcast real-time update
      broadcast(userId, {
        type: 'transaction_created',
        data: transaction,
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, transactionData);
      
      // Broadcast real-time update
      const userId = req.user.claims.sub;
      broadcast(userId, {
        type: 'transaction_updated',
        data: transaction,
      });
      
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTransaction(id);
      
      // Broadcast real-time update
      const userId = req.user.claims.sub;
      broadcast(userId, {
        type: 'transaction_deleted',
        data: { id },
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(400).json({ message: "Failed to delete transaction" });
    }
  });

  // Budget routes
  app.get('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgets = await storage.getBudgetsWithSpending(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetData = insertBudgetSchema.parse({ ...req.body, userId });
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(400).json({ message: "Failed to create budget" });
    }
  });

  app.put('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const budgetData = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, budgetData);
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(400).json({ message: "Failed to update budget" });
    }
  });

  app.delete('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBudget(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(400).json({ message: "Failed to delete budget" });
    }
  });

  // Receipt routes
  app.get('/api/receipts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const receipts = await storage.getUserReceipts(userId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.post('/api/receipts/upload', isAuthenticated, upload.single('receipt'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const receiptData = {
        userId,
        fileName: req.file.originalname,
        filePath: req.file.path,
      };

      const receipt = await storage.createReceipt(receiptData);
      
      // Process OCR in background
      processReceiptOCR(receipt.id, req.file.path)
        .then(async (ocrResult) => {
          await storage.updateReceipt(receipt.id, {
            ocrText: ocrResult.text,
            ocrData: ocrResult.data,
            processedAt: new Date(),
          });
          
          // Broadcast OCR completion
          broadcast(userId, {
            type: 'receipt_processed',
            data: { receiptId: receipt.id, ocrResult },
          });
        })
        .catch((error) => {
          console.error('OCR processing failed:', error);
        });

      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const [totalBalance, monthlyIncome, monthlyExpenses] = await Promise.all([
        storage.getTotalBalance(userId),
        storage.getMonthlyIncome(userId, currentMonth, currentYear),
        storage.getMonthlyExpenses(userId, currentMonth, currentYear),
      ]);

      const budgetRemaining = (parseFloat(monthlyIncome) - parseFloat(monthlyExpenses)).toFixed(2);

      res.json({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        budgetRemaining,
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/category-spending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const categorySpending = await storage.getCategorySpending(userId, start, end);
      res.json(categorySpending);
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });

  return httpServer;
}
