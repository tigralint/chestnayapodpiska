import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getClientIp } from '../utils/getClientIp.js';

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Rate limit this endpoint to prevent abuse (100 req/hour per IP)
const statusRateLimit = hasRedis
    ? new Ratelimit({
        redis: Redis.fromEnv({ enableAutoPipelining: true }),
        limiter: Ratelimit.slidingWindow(100, '1 h'),
    })
    : null;

// Mirror chat rate limit config from api/assistant.ts (for getRemaining peek)
const chatRateLimit = hasRedis
    ? new Ratelimit({
        redis: Redis.fromEnv({ enableAutoPipelining: true }),
        limiter: Ratelimit.slidingWindow(15, '1 d'),
    })
    : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const ip = getClientIp(req);

        if (!statusRateLimit || !chatRateLimit) {
            return res.status(500).json({ error: 'Redis is not configured' });
        }

        const { success: rateLimitOk } = await statusRateLimit.limit(`chatStatus_${ip}`);
        if (!rateLimitOk) {
            return res.status(429).json({ error: 'Слишком много запросов.' });
        }

        // Use getRemaining to just peek without incrementing the counter
        const limitRes = await chatRateLimit.getRemaining(`chat_${ip}`);
        
        res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
        return res.status(200).json({ 
            remaining: limitRes.remaining,
            limit: limitRes.limit,
        });

    } catch (error: unknown) {
        console.error(JSON.stringify({ event: 'chatStatus_error', error: error instanceof Error ? error.message : String(error) }));
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
