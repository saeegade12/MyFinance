import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { dbConfig } from './config';

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: dbConfig.url });
export const db = drizzle({ client: pool, schema });