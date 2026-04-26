import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashIp } from '../utils/hashIp';
import { getClientIp } from '../utils/getClientIp';
import { escapeHtml } from '../utils/escapeHtml';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** TTL for hash→IP mapping in Redis (24 hours) */
const IP_MAPPING_TTL_SECONDS = 24 * 60 * 60;

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? Redis.fromEnv({ enableAutoPipelining: true })
    : null;

const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'),
    })
    : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const ip = getClientIp(req);

        // Rate limiting — fail-closed in production
        if (ratelimit) {
            const { success } = await ratelimit.limit(`requestLimit_${ip}`);
            if (!success) {
                return res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
            }
        } else if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
            console.error(JSON.stringify({ event: 'requestLimit_ratelimit_missing', critical: true }));
            return res.status(500).json({ error: 'Сервис временно недоступен.' });
        }

        const ipHash = hashIp(ip);

        if (redis) {
            await redis.set(`limit_request:${ipHash}`, ip, { ex: IP_MAPPING_TTL_SECONDS });
        }

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: 'Telegram misconfigured.' });
        }

        const messageText = `🤖 <b>Запрос Лимитов Чат-Бота!</b>\n\n🌐 <b>IP Hash:</b> <code>${escapeHtml(ipHash)}</code>\n\nПользователь исчерпал лимит в 15 запросов/сут и просит добавить еще.\nОдобрить сброс лимитов для этого IP?`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ Одобрить и Сбросить Лимит", callback_data: `reset_limit_${ipHash}` }
                    ]]
                }
            }),
            signal: AbortSignal.timeout(10_000),
        });

        return res.status(200).json({ success: true });

    } catch (error: unknown) {
        console.error(JSON.stringify({ event: 'requestLimit_error', error: error instanceof Error ? error.message : String(error) }));
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
