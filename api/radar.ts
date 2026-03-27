import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RadarAlertResponse, RadarStoredData, AlertCategory, AlertSeverity } from '../types';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

export const radarReportSchema = z.object({
    serviceName: z.string().min(1, 'Укажите название сервиса').max(100),
    city: z.string().min(1, 'Укажите город').max(100),
    amount: z.number().nonnegative().optional(),
    description: z.string().min(10, 'Подробное описание').max(2000),
    category: z.enum(['hidden_cancel', 'auto_renewal', 'dark_pattern', 'phishing', 'refund_refused', 'other']),
    turnstileToken: z.string().min(1, 'Токен обязателен'),
});

function sanitize(str: string): string {
    return str.replace(/<\/?[a-z_][a-z0-9_]*>/gi, '').trim();
}

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

function getSeverity(category: AlertCategory): AlertSeverity {
    if (['phishing', 'hidden_cancel'].includes(category)) return 'critical';
    if (['refund_refused'].includes(category)) return 'high';
    return 'medium';
}

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv() : null;
const ratelimit = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
}) : null;

export default async function handler(request: VercelRequest, response: VercelResponse) {
    if (request.method === 'GET') {
        if (!redis) return response.status(500).json({ error: 'Redis is not configured' });
        try {
            const limit = parseInt(request.query.limit as string) || 20;
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
        } catch (e) {
            console.error(e);
            return response.status(500).json({ error: 'DB read error' });
        }
    }

    if (request.method === 'POST') {
        const clientIp = (request.headers['x-vercel-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? request.socket?.remoteAddress
            ?? 'unknown';

        if (ratelimit) {
            const { success } = await ratelimit.limit(clientIp);
            if (!success) return response.status(429).json({ error: 'Слишком много запросов.' });
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
                method: 'POST', body: formData, signal: AbortSignal.timeout(8000)
            });
            const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
            if (!turnstileRes.success) return response.status(403).json({ error: 'Captcha failed.' });

            const reportId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
            const ts = Date.now();
            
            const sanitizedData = {
                id: reportId,
                timestamp: ts,
                serviceName: sanitize(data.serviceName),
                city: sanitize(data.city),
                amount: data.amount,
                description: sanitize(data.description),
                category: data.category
            };

            await redis.set(`radar:pending:${reportId}`, JSON.stringify(sanitizedData), { ex: 604800 }); // Store for 7 days

            // Telegram Notification
            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                const messageText = `📡 <b>Радар: Новый сигнал! (Ожидает модерации)</b>\n\n📌 <b>Сервис:</b> ${sanitizedData.serviceName}\n🏙 <b>Город:</b> ${sanitizedData.city}\n💸 <b>Сумма:</b> ${sanitizedData.amount ? sanitizedData.amount + ' ₽' : 'Не указана'}\n🏷 <b>Категория:</b> ${getCategoryName(sanitizedData.category)}\n\n📝 <b>Сюжет:</b> ${sanitizedData.description}\n\n🌐 <b>IP:</b> ${clientIp}`;

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
                }).catch(e => console.error('TG Error:', e));
            }

            return response.status(200).json({ success: true, id: reportId });

        } catch (e) {
            console.error(e);
            return response.status(500).json({ error: 'Server error' });
        }
    }

    return response.status(405).json({ error: 'Method Not Allowed' });
}
