import {
  users,
  accounts,
  transactions,
  budgets,
  receipts,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type TransactionWithAccount,
  type Budget,
  type InsertBudget,
  type BudgetWithSpending,
  type Receipt,
  type InsertReceipt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Account operations
  getUserAccounts(userId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Transaction operations
  getUserTransactions(userId: string, limit?: number): Promise<TransactionWithAccount[]>;
  getTransactionsByAccount(accountId: string): Promise<TransactionWithAccount[]>;
  getTransactionsByCategory(userId: string, category: string): Promise<TransactionWithAccount[]>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TransactionWithAccount[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  
  // Budget operations
  getUserBudgets(userId: string): Promise<Budget[]>;
  getBudgetsWithSpending(userId: string): Promise<BudgetWithSpending[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  
  // Receipt operations
  getUserReceipts(userId: string): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;
  
  // Analytics
  getTotalBalance(userId: string): Promise<string>;
  getMonthlyIncome(userId: string, month: number, year: number): Promise<string>;
  getMonthlyExpenses(userId: string, month: number, year: number): Promise<string>;
  getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<{category: string, total: string}[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Account operations
  async getUserAccounts(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))
      .orderBy(desc(accounts.createdAt));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.update(accounts).set({ isActive: false }).where(eq(accounts.id, id));
  }

  // Transaction operations
  async getUserTransactions(userId: string, limit = 50): Promise<TransactionWithAccount[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        date: transactions.date,
        receiptId: transactions.receiptId,
        aiCategorized: transactions.aiCategorized,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: {
          name: accounts.name,
          type: accounts.type,
        },
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async getTransactionsByAccount(accountId: string): Promise<TransactionWithAccount[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        date: transactions.date,
        receiptId: transactions.receiptId,
        aiCategorized: transactions.aiCategorized,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: {
          name: accounts.name,
          type: accounts.type,
        },
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<TransactionWithAccount[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        date: transactions.date,
        receiptId: transactions.receiptId,
        aiCategorized: transactions.aiCategorized,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: {
          name: accounts.name,
          type: accounts.type,
        },
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId), eq(transactions.category, category)))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TransactionWithAccount[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        date: transactions.date,
        receiptId: transactions.receiptId,
        aiCategorized: transactions.aiCategorized,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: {
          name: accounts.name,
          type: accounts.type,
        },
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update account balance
    const amount = parseFloat(newTransaction.amount);
    const balanceChange = newTransaction.type === 'income' ? amount : -amount;
    
    await db
      .update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${balanceChange}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, newTransaction.accountId));
    
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    // Get transaction details before deletion for balance adjustment
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    
    if (transaction) {
      // Reverse the balance change
      const amount = parseFloat(transaction.amount);
      const balanceChange = transaction.type === 'income' ? -amount : amount;
      
      await db
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, transaction.accountId));
    }
    
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Budget operations
  async getUserBudgets(userId: string): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)))
      .orderBy(desc(budgets.createdAt));
  }

  async getBudgetsWithSpending(userId: string): Promise<BudgetWithSpending[]> {
    const userBudgets = await this.getUserBudgets(userId);
    const result: BudgetWithSpending[] = [];

    for (const budget of userBudgets) {
      const [spentResult] = await db
        .select({
          total: sum(transactions.amount),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.category, budget.category),
            eq(transactions.type, 'expense'),
            gte(transactions.date, budget.startDate),
            lte(transactions.date, budget.endDate)
          )
        );

      const spent = spentResult?.total || '0';
      const budgetAmount = parseFloat(budget.amount);
      const spentAmount = parseFloat(spent);
      const remaining = (budgetAmount - spentAmount).toFixed(2);
      const percentage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;

      result.push({
        ...budget,
        spent,
        remaining,
        percentage,
      });
    }

    return result;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget> {
    const [updatedBudget] = await db
      .update(budgets)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<void> {
    await db.update(budgets).set({ isActive: false }).where(eq(budgets.id, id));
  }

  // Receipt operations
  async getUserReceipts(userId: string): Promise<Receipt[]> {
    return await db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.createdAt));
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db.insert(receipts).values(receipt).returning();
    return newReceipt;
  }

  async updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt> {
    const [updatedReceipt] = await db
      .update(receipts)
      .set(receipt)
      .where(eq(receipts.id, id))
      .returning();
    return updatedReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  // Analytics
  async getTotalBalance(userId: string): Promise<string> {
    const [result] = await db
      .select({
        total: sum(accounts.balance),
      })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

    return result?.total || '0';
  }

  async getMonthlyIncome(userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [result] = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    return result?.total || '0';
  }

  async getMonthlyExpenses(userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [result] = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    return result?.total || '0';
  }

  async getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<{category: string, total: string}[]> {
    const result = await db
      .select({
        category: transactions.category,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.category);
    
    return result.map(item => ({
      category: item.category,
      total: item.total || '0'
    }));
  }
}

export const storage = new DatabaseStorage();
