import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const db = drizzle({ client: pool, schema });

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Insert or fetch a test user
  const fixedUserId = process.env.LOCAL_DEV_AUTH === 'true' ? 'dev-user' : randomUUID();
  const [user] = await db
    .insert(schema.users)
    .values({
      id: fixedUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { updatedAt: sql`NOW()` },
    })
    .returning();

  console.log('👤 User ready:', user.id);

  // 2. Insert two test accounts linked to the user
  const [checking] = await db
    .insert(schema.accounts)
    .values({
      id: randomUUID(),
      userId: user.id,
      name: 'Main Checking',
      type: 'checking',
      balance: '1000',
      currency: 'USD',
    })
    .returning();

  const [savings] = await db
    .insert(schema.accounts)
    .values({
      id: randomUUID(),
      userId: user.id,
      name: 'Savings',
      type: 'savings',
      balance: '2500',
      currency: 'USD',
    })
    .returning();

  console.log('🏦 Accounts created:', checking.id, savings.id);

  // 3. Insert some transactions
  const now = new Date();
  const txValues: Parameters<typeof db.insert>[0] extends infer T
    ? T extends any
      ? any
      : never
    : never = [
    {
      id: randomUUID(),
      userId: user.id,
      accountId: checking.id,
      description: 'Salary',
      amount: '3000',
      type: 'income',
      category: 'income',
      date: now,
      aiCategorized: false,
    },
    {
      id: randomUUID(),
      userId: user.id,
      accountId: checking.id,
      description: 'Groceries - Supermart',
      amount: '120.45',
      type: 'expense',
      category: 'groceries',
      date: now,
      aiCategorized: true,
    },
    {
      id: randomUUID(),
      userId: user.id,
      accountId: checking.id,
      description: 'Fuel',
      amount: '50.00',
      type: 'expense',
      category: 'transportation',
      date: now,
      aiCategorized: true,
    },
    {
      id: randomUUID(),
      userId: user.id,
      accountId: savings.id,
      description: 'Transfer to Savings',
      amount: '500',
      type: 'expense',
      category: 'transfers',
      date: now,
      aiCategorized: false,
    },
    {
      id: randomUUID(),
      userId: user.id,
      accountId: savings.id,
      description: 'Interest',
      amount: '5.25',
      type: 'income',
      category: 'interest',
      date: now,
      aiCategorized: false,
    },
  ];

  await db.insert(schema.transactions).values(txValues);

  // 4. Insert a budget for Groceries for the current month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await db
    .insert(schema.budgets)
    .values({
      id: randomUUID(),
      userId: user.id,
      category: 'groceries',
      amount: '400',
      period: 'monthly',
      startDate: start,
      endDate: end,
      alertThreshold: 80,
      isActive: true,
    });

  console.log('✅ Seed completed!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });


