// lib/redis.ts - ORIGINAL VERSION (Node.js runtime)
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export { redis }

// Cache helpers
export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl = 300, // 5 minutes default
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached

  const fresh = await fallback()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  return fresh
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

// Rate limiting helper
export async function rateLimit(
  userId: string,
  action: string,
  limit: number,
  window: number, // seconds
): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, window)
  }

  return current <= limit
}
