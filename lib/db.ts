import postgres from 'postgres'

export const sql: any = postgres(process.env.DATABASE_URL || '')

export async function query<T>(sqlText: string, params?: any[]): Promise<T[]> {
  try {
    if (params && params.length > 0) {
      return (await sql(sqlText, ...params)) as T[]
    }
    return (await sql(sqlText)) as T[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}
