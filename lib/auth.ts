import { redis } from './redis'
import type { User } from './types'

export async function getUser(userId: string): Promise<User | null> {
  // Check cache first
  const cached = await redis.get(`user:${userId}`) as User | null
  if (cached) {
    return cached
  }

  // fallback: fetch from DB or API (pseudo)
  // const user = await db.getUser(userId)
  // await redis.set(`user:${userId}`, user)
  // return user

  return null
}
