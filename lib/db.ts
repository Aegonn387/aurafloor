import { neon, neonConfig } from "@neondatabase/serverless"

neonConfig.fetchConnectionCache = true

const sql = neon(process.env.DATABASE_URL!)

export { sql }

// Database query helpers
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  return (await sql(text, params)) as T[]
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const results = (await sql(text, params)) as T[]
  return results[0] || null
}

// Transaction helper
export async function transaction<T>(callback: (sql: typeof query) => Promise<T>): Promise<T> {
  // Neon doesn't support traditional transactions, so we use savepoints
  const txId = Math.random().toString(36).substring(7)
  try {
    await sql(`SAVEPOINT tx_${txId}`)
    const result = await callback(query)
    await sql(`RELEASE SAVEPOINT tx_${txId}`)
    return result
  } catch (error) {
    await sql(`ROLLBACK TO SAVEPOINT tx_${txId}`)
    throw error
  }
}
