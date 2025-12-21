// lib/db.ts
import { neon } from '@neondatabase/serverless';

// Get database connection
export function getDbConnection() {
  return neon(process.env.DATABASE_URL!);
}

// Execute a query
export async function query<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  const sql = neon(process.env.DATABASE_URL!);
  return sql(sqlText, params) as Promise<T[]>;
}

// Alias for query (this is what inngest/functions.ts imports)
export const sql = query;

// Execute a query and return first row
export async function queryOne<T = any>(sqlText: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows[0] || null;
}
