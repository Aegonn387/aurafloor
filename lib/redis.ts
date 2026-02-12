import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export const homepageCache = {
  async get(key: string, fallback: () => Promise<any>, ttl: number = 300) {
    if (!redis) {
      console.log('[Redis] Not configured, using fallback')
      return fallback()
    }
    
    try {
      const cached = await redis.get(`homepage:${key}`)
      if (cached) {
        console.log(`[Redis] Cache hit: homepage:${key}`)
        return cached
      }
      
      console.log(`[Redis] Cache miss: homepage:${key}`)
      const data = await fallback()
      await redis.setex(`homepage:${key}`, ttl, JSON.stringify(data))
      return data
    } catch (error) {
      console.error('[Redis] Error:', error)
      return fallback()
    }
  },

  async set(key: string, value: any, ttl: number = 300) {
    if (!redis) return
    try {
      await redis.setex(`homepage:${key}`, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('[Redis] Set error:', error)
    }
  },

  async delete(key: string) {
    if (!redis) return
    try {
      await redis.del(`homepage:${key}`)
    } catch (error) {
      console.error('[Redis] Delete error:', error)
    }
  },
}
