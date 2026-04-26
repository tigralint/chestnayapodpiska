import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Factory for creating Upstash rate limiters.
 * Returns null if Redis credentials are missing (graceful local dev fallback).
 * Production endpoints MUST check for null and fail-closed.
 */
export function createRatelimit(windowSize: number, windowDuration: Parameters<typeof Ratelimit.slidingWindow>[1]): Ratelimit | null {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(windowSize, windowDuration),
        });
    }
    return null;
}

/**
 * Returns a shared Redis instance if credentials are present, or null.
 */
export function getRedisClient(): InstanceType<typeof Redis> | null {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return Redis.fromEnv();
    }
    return null;
}

/**
 * Fail-closed guard for production.
 * Returns true if the request should be blocked (rate limiter missing in production).
 */
export function isRatelimitMissing(ratelimit: Ratelimit | null, event: string): boolean {
    if (!ratelimit) {
        console.error(JSON.stringify({ event: `${event}_ratelimit_missing`, critical: true }));
        if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
            return true;
        }
    }
    return false;
}
