// lib/db.ts
import { neon } from '@neondatabase/serverless';

// Re-export the neon function for use elsewhere
export { neon };

// Helper to get a database connection INSIDE a function
export function getDbConnection() {
  return neon(process.env.DATABASE_URL!);
}

// Example helper functions that are safe to use in routes
export async function queryDb<T>(query: string, params: any[] = []): Promise<T[]> {
  const sql = neon(process.env.DATABASE_URL!);
  // Use tagged template literal or parameterized query based on your needs
  return sql`${query}` as T[];
}
