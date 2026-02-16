import { neon } from '@neondatabase/serverless';

// Configure Neon with a longer timeout (20 seconds)
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    timeout: 20000, // 20 seconds
  },
});

/**
 * Retry a database query with exponential backoff on connection timeouts.
 * @param queryFn - Async function that executes the query (e.g., () => sql`SELECT ...`)
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns The result of the query
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      // Check if this is a connection timeout error
      const isTimeout =
        error?.sourceError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error?.message?.includes('timeout');
      if (isTimeout && attempt < maxRetries) {
        console.log(`Database connection attempt ${attempt} failed, retrying...`);
        // Exponential backoff: 200ms, 400ms, ...
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt - 1)));
        continue;
      }
      // If not a timeout error or we've exhausted retries, break
      break;
    }
  }
  throw lastError;
}

export { sql };
