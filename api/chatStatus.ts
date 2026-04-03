import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const ip = (req.headers['x-vercel-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? req.socket?.remoteAddress
            ?? 'unknown';

        const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv() : null;

        if (!redis) {
            return res.status(500).json({ error: 'Redis is not configured' });
        }

        // We use the same configuration as api/assistant.ts
        const ratelimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, '1 d'),
        });

        // Use getRemaining to just peek without incrementing the counter
        const limitRes = await ratelimit.getRemaining(`chat_${ip}`);
        
        return res.status(200).json({ 
            remaining: limitRes.remaining,
            limit: limitRes.limit,
            ip: ip
        });

    } catch (error) {
        console.error('Chat status error', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
