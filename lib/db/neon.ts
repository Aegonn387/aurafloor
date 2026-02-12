// lib/db/neon.ts - UPDATED (Direct PostgreSQL Client)
import { Pool } from 'pg';

// Validate environment variable
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Neon SSL connections
  }
});

// Helper function for queries - FIXED VERSION
export async function sql<T = any>(query: TemplateStringsArray | string, ...params: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    let queryText: string;
    let queryParams: any[] = [];
    
    // Handle both template literal and string calls
    if (typeof query === 'string') {
      // Regular string call
      queryText = query;
      queryParams = params;
    } else {
      // Template literal call
      queryText = query[0];
      queryParams = params;
    }
    
    console.log('[sql] Executing query:', queryText);
    console.log('[sql] With params:', queryParams);
    
    const result = await client.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    console.error('[sql] Query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export the pool for transactions if needed
export { pool };