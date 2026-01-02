import { Redis } from '@upstash/redis/cloudflare';

// Development singleton pattern
let redis: Redis;

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis environment variables are not set.');
    return {
      get: async () => null,
      setex: async () => 'OK',
      set: async () => 'OK',
      zremrangebyscore: async () => 0,
      zcard: async () => 0,
      zadd: async () => 0,
      zrange: async <T>() => [] as T[],
      expire: async () => 0,
    } as any;
  }

  return new Redis({
    url,
    token,
  });
}

if (process.env.NODE_ENV === 'production') {
  redis = createRedisClient();
} else {
  const globalWithRedis = global as typeof globalThis & {
    _upstashRedisClient?: Redis;
  };

  if (!globalWithRedis._upstashRedisClient) {
    globalWithRedis._upstashRedisClient = createRedisClient();
  }
  redis = globalWithRedis._upstashRedisClient;
}

// Generic cache helper
export async function getCachedOrFetch<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn(`[getCached] Static build: bypassing cache for ${key}`);
    return await fallback();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fallback();
    await redis.setex(key, ttl, fresh);
    return fresh;
  } catch (error) {
    console.error(`[getCached] Error for key ${key}:`, error);
    return await fallback();
  }
}

// RATE LIMITER FUNCTION
export async function rateLimit(identifier: string, limit: number = 10, windowInSeconds: number = 60): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const key = `rate-limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowInSeconds * 1000);

  try {
    await redis.zremrangebyscore(key, 0, windowStart);
    const requestCount = await redis.zcard(key);
    
    if (requestCount >= limit) {
      const oldest = await redis.zrange<[string, number]>(key, 0, 0, { withScores: true });
      let resetTime: number;
      if (oldest.length > 0) {
        const score = oldest[0][1];
        resetTime = Math.ceil((Number(score) + (windowInSeconds * 1000)) / 1000);
      } else {
        resetTime = Math.ceil((now + (windowInSeconds * 1000)) / 1000);
      }
      
      return {
        success: false,
        limit,
        remaining: Math.max(0, limit - requestCount),
        reset: resetTime,
      };
    }
    
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, windowInSeconds * 2);
    
    return {
      success: true,
      limit,
      remaining: limit - (requestCount + 1),
      reset: Math.ceil((now + (windowInSeconds * 1000)) / 1000),
    };
  } catch (error) {
    console.error('[rateLimit] Error:', error);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + (windowInSeconds * 1000)) / 1000),
    };
  }
}

// Export the client
export { redis };
export default redis;
