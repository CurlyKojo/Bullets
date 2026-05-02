import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

function todayKey(username: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return `bullets:user:${username.toLowerCase()}:${date}`;
}

export function rateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function getDailyUsage(username: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  const v = await r.get<number>(todayKey(username));
  return v ?? 0;
}

export type IncrementResult = {
  count: number;
  limit: number;
  allowed: boolean;
};

export async function incrementUsage(username: string, limit: number): Promise<IncrementResult> {
  const r = getRedis();
  if (!r) {
    // Fail open in dev only; in prod, block if not configured
    if (process.env.NODE_ENV === "production") {
      throw new Error("Rate limiter not configured (UPSTASH_REDIS_REST_URL missing)");
    }
    return { count: 0, limit, allowed: true };
  }
  const key = todayKey(username);
  const count = await r.incr(key);
  if (count === 1) {
    // 25h TTL — comfortably covers the rest of today
    await r.expire(key, 60 * 60 * 25);
  }
  return { count, limit, allowed: count <= limit };
}
