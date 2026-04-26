import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { hashIp } from '../utils/hashIp';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RadarAlertResponse, RadarStoredData, AlertCategory, AlertSeverity } from '../types';
import { escapeHtml } from '../utils/escapeHtml';
import { getClientIp } from '../utils/getClientIp';
import type { TurnstileVerifyResponse } from '../utils/turnstile';
import { TURNSTILE_TIMEOUT_MS } from '../utils/turnstile';
import { sanitizeForStorage } from '../utils/sanitize';

/** TTL for pending radar reports in Redis (7 days) */
const PENDING_TTL_SECONDS = 7 * 24 * 60 * 60;

export const radarReportSchema = z.object({
    serviceName: z.string().min(1, 'Укажите название сервиса').max(100),
    city: z.string().min(1, 'Укажите город').max(100),
    amount: z.number().nonnegative().optional(),
    description: z.string().min(10, 'Подробное описание').max(2000),
    category: z.enum(['hidden_cancel', 'auto_renewal', 'dark_pattern', 'phishing', 'refund_refused', 'other']),
    turnstileToken: z.string().min(1, 'Токен обязателен'),
});

function getCategoryName(category: AlertCategory): string {
    const map: Record<AlertCategory, string> = {
        hidden_cancel: 'Скрытая отмена',
        auto_renewal: 'Автопродление',
        dark_pattern: 'Дарк-паттерн',
        phishing: 'Фишинг',
        refund_refused: 'Отказ в возврате',
        other: 'Другое'
    };
    return map[category];
}

const SEVERITY_MAP: Partial<Record<AlertCategory, AlertSeverity>> = {
    phishing: 'critical',
    hidden_cancel: 'critical',
    refund_refused: 'high',
};

function getSeverity(category: AlertCategory): AlertSeverity {
    return SEVERITY_MAP[category] ?? 'medium';
}

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv({ enableAutoPipelining: true }) : null;
const ratelimit = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
}) : null;

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method === 'GET') {
        if (!redis) return response.status(500).json({ error: 'Redis is not configured' });

        // Rate limit GET requests to prevent abuse (100 req/hour per IP)
        if (ratelimit) {
            const clientIp = getClientIp(request);
            const { success } = await ratelimit.limit(`radar_get_${clientIp}`);
            if (!success) return response.status(429).json({ error: 'Слишком много запросов.' });
        } else if (process.env.VERCEL_ENV === 'production') {
            console.error(JSON.stringify({ event: 'radar_get_ratelimit_missing', critical: true }));
            return response.status(500).json({ error: 'Сервис временно недоступен.' });
        }

        try {
            const MAX_LIMIT = 50;
            const limit = Math.min(parseInt(request.query.limit as string) || 20, MAX_LIMIT);
            const category = request.query.category as string;
            
            let items = await redis.zrange('radar:alerts', 0, 100, { rev: true }) as RadarStoredData[];
            
            if (category && category !== 'all') {
                items = items.filter((item) => item.category === category);
            }
            
            const results = items.slice(0, limit).map((data) => {
                const ageMinutes = Math.floor((Date.now() - data.timestamp) / 60000);
                let timeStr = ageMinutes < 60 ? `${ageMinutes} мин назад` : `${Math.floor(ageMinutes/60)} ч назад`;
                if (ageMinutes === 0) timeStr = 'только что';

                return {
                    id: data.id,
                    location: data.city,
                    time: timeStr,
                    text: data.description,
                    severity: getSeverity(data.category),
                    category: data.category,
                    serviceName: data.serviceName,
                    reportCount: 1
                } as RadarAlertResponse;
            });
            
            return response.status(200).json(results);
        } catch (e: unknown) {
            console.error(JSON.stringify({ event: 'radar_get_error', error: e instanceof Error ? e.message : String(e) }));
            return response.status(500).json({ error: 'DB read error' });
        }
    }

    if (request.method === 'POST') {
        const clientIp = getClientIp(request);

        if (ratelimit) {
            const { success } = await ratelimit.limit(clientIp);
            if (!success) return response.status(429).json({ error: 'Слишком много запросов.' });
        } else if (process.env.VERCEL_ENV === 'production') {
            console.error(JSON.stringify({ event: 'radar_ratelimit_missing', critical: true }));
            return response.status(500).json({ error: 'Сервис временно недоступен.' });
        }

        const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!TURNSTILE_SECRET_KEY || !redis) {
            return response.status(500).json({ error: 'Server misconfiguration.' });
        }

        try {
            const parsed = radarReportSchema.safeParse(request.body);
            if (!parsed.success) {
                const firstError = parsed.error.issues[0]?.message || 'Invalid data';
                return response.status(400).json({ error: firstError });
            }
            
            const data = parsed.data;

            // Check Turnstile
            const formData = new URLSearchParams();
            formData.append('secret', TURNSTILE_SECRET_KEY);
            formData.append('response', data.turnstileToken);
            const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST', body: formData, signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS)
            });
            const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
            if (!turnstileRes.success) return response.status(403).json({ error: 'Captcha failed.' });

            const reportId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
            const ts = Date.now();
            
            const sanitizedData = {
                id: reportId,
                timestamp: ts,
                serviceName: sanitizeForStorage(data.serviceName, 100),
                city: sanitizeForStorage(data.city, 100),
                amount: data.amount,
                description: sanitizeForStorage(data.description),
                category: data.category
            };

            await redis.set(`radar:pending:${reportId}`, JSON.stringify(sanitizedData), { ex: PENDING_TTL_SECONDS });

            // Telegram Notification
            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                const messageText = `📡 <b>Радар: Новый сигнал! (Ожидает модерации)</b>\n\n📌 <b>Сервис:</b> ${escapeHtml(sanitizedData.serviceName)}\n🏙 <b>Город:</b> ${escapeHtml(sanitizedData.city)}\n💸 <b>Сумма:</b> ${sanitizedData.amount ? sanitizedData.amount + ' ₽' : 'Не указана'}\n🏷 <b>Категория:</b> ${getCategoryName(sanitizedData.category)}\n\n📝 <b>Сюжет:</b> ${escapeHtml(sanitizedData.description)}\n\n🌐 <b>IP Hash:</b> <code>${hashIp(clientIp)}</code>`;

                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: messageText,
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "✅ Опубликовать", callback_data: `approve_radar_${reportId}` },
                                    { text: "❌ Отклонить", callback_data: `reject_radar_${reportId}` }
                                ]
                            ]
                        }
                    }),
                    signal: AbortSignal.timeout(10000),
                }).catch((e: unknown) => console.error(JSON.stringify({ event: 'radar_tg_error', error: e instanceof Error ? e.message : String(e) })));
            }

            return response.status(200).json({ success: true, id: reportId });

        } catch (e: unknown) {
            console.error(JSON.stringify({ event: 'radar_post_error', error: e instanceof Error ? e.message : String(e), timestamp: new Date().toISOString() }));
            return response.status(500).json({ error: 'Server error' });
        }
    }

    return response.status(405).json({ error: 'Method Not Allowed' });
}
