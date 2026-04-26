import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { hashIp } from '../utils/hashIp';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { escapeHtml } from '../utils/escapeHtml';
import { getClientIp } from '../utils/getClientIp';
import type { TurnstileVerifyResponse } from '../utils/turnstile';
import { TURNSTILE_TIMEOUT_MS } from '../utils/turnstile';
import { sanitizeForStorage } from '../utils/sanitize';

export const reportSchema = z.object({
    serviceName: z.string().min(1, 'Укажите название сервиса').max(100, 'Слишком длинное название'),
    description: z.string().min(10, 'Опишите уловку подробнее (минимум 10 символов)').max(2000, 'Описание слишком длинное'),
    contactInfo: z.string().max(200, 'Слишком длинные контактные данные').optional(),
    turnstileToken: z.string().min(1, 'Токен капчи обязателен'),
});

export type ReportData = z.infer<typeof reportSchema>;

const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: Redis.fromEnv({ enableAutoPipelining: true }),
        limiter: Ratelimit.slidingWindow(30, "1 h"),
      })
    : null;

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const clientIp = getClientIp(request);

    if (ratelimit) {
        const { success } = await ratelimit.limit(clientIp);
        if (!success) {
            return response.status(429).json({ error: 'Слишком много запросов. Попробуйте попозже.' });
        }
    } else if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
        console.error(JSON.stringify({ event: 'reportPattern_ratelimit_missing', critical: true }));
        return response.status(500).json({ error: 'Сервис временно недоступен.' });
    }

    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TURNSTILE_SECRET_KEY) {
        return response.status(500).json({ error: 'Сервер конфигурации: отсутствует ключ капчи.' });
    }
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return response.status(500).json({ error: 'Сервер конфигурации: отсутствует настройка Telegram. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.' });
    }

    try {
        const parsed = reportSchema.safeParse(request.body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Некорректные данные. Проверьте заполнение полей.';
            return response.status(400).json({ error: firstError });
        }
        const validData = parsed.data;

        // Verify Turnstile
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', validData.turnstileToken);

        const turnstileCheck = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
        });

        const turnstileRes = await turnstileCheck.json() as TurnstileVerifyResponse;
        if (!turnstileRes.success) {
            return response.status(403).json({ error: 'Ошибка капчи.' });
        }

        // Send to Telegram
        const serviceName = sanitizeForStorage(validData.serviceName, 100);
        const description = sanitizeForStorage(validData.description);
        const contactInfo = validData.contactInfo ? sanitizeForStorage(validData.contactInfo, 200) : 'Не указан';

        const messageText = `🚨 <b>Новая уловка!</b>

📌 <b>Сервис:</b> ${escapeHtml(serviceName)}
📝 <b>Описание:</b> ${escapeHtml(description)}

👤 <b>Контакты:</b> ${escapeHtml(contactInfo)}
🌐 <b>IP Hash:</b> <code>${hashIp(clientIp)}</code>`;

        const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'HTML',
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!tgResponse.ok) {
            const tgErrText = await tgResponse.text().catch(() => 'Unknown');
            console.error(JSON.stringify({ event: 'reportPattern_tg_error', status: tgResponse.status, body: tgErrText }));
            return response.status(500).json({ error: 'Не удалось отправить сообщение в Telegram. Попробуйте позже.' });
        }

        return response.status(200).json({ success: true, message: 'Успешно отправлено!' });

    } catch (error: unknown) {
        console.error(JSON.stringify({
            event: 'reportPattern_error',
            ip: clientIp,
            error: error instanceof Error ? error.message : String(error),
            ...(process.env.VERCEL_ENV !== 'production' && { stack: error instanceof Error ? error.stack : undefined }),
            timestamp: new Date().toISOString(),
        }));
        return response.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
}
