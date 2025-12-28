// lib/redis.ts - MOCK VERSION for static export builds

// Mock Redis client for static builds
class MockRedis {
  private isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  
  async get<T>(key: string): Promise<T | null> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: get(${key}) returning null`);
    }
    return null;
  }

  async setex(key: string, ttl: number, value: any): Promise<string> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: setex(${key}, ${ttl}) mocked`);
    }
    return 'OK';
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: keys(${pattern}) returning empty array`);
    }
    return [];
  }

  async del(...keys: string[]): Promise<number> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: del(${keys.join(', ')}) mocked`);
    }
    return keys.length;
  }

  async incr(key: string): Promise<number> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: incr(${key}) returning 1`);
    }
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.isBuildTime) {
      console.warn(`[MockRedis] Static build: expire(${key}, ${seconds}) mocked`);
    }
    return 1;
  }
}

// Use mock client for static builds
const redis = process.env.NEXT_PUBLIC_IS_STATIC_BUILD === 'true' 
  ? new MockRedis() 
  : new (require('@upstash/redis').Redis)({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });

// Cache helpers - updated for static builds
export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl = 300,
): Promise<T> {
  // During static builds, always use fallback
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn(`[getCached] Static build: bypassing cache for ${key}`);
    return fallback();
  }

  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fallback();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn(`[invalidateCache] Static build: skipping cache invalidation for ${pattern}`);
    return;
  }
  
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Rate limiting helper
export async function rateLimit(
  userId: string,
  action: string,
  limit: number,
  window: number,
): Promise<boolean> {
  // Always allow during static builds
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn(`[rateLimit] Static build: allowing request for ${userId}:${action}`);
    return true;
  }

  const key = `ratelimit:${userId}:${action}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  return current <= limit;
}

export { redis };
