import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import type { RadarStoredData } from '../types';
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery, escapeHtml } from './_shared/telegram';

/** Subset of Telegram Bot API types used by this webhook */
interface TelegramMessage {
    chat: { id: number };
    message_id: number;
    text?: string;
}

interface TelegramCallbackQuery {
    id: string;
    data?: string;
    message?: TelegramMessage;
}

interface TelegramUpdate {
    message?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
}

/** Validates that a string looks like an IPv4/IPv6 address or 'unknown' (prevents SCAN injection) */
function isValidIpLike(value: string): boolean {
    // IPv4, IPv6, or 'unknown' — reject wildcards and glob patterns
    return /^[\da-fA-F.:]+$/.test(value) || value === 'unknown';
}

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv({ enableAutoPipelining: true }) : null;

function logError(event: string, error: unknown) {
    console.error(JSON.stringify({
        event: `tgWebhook_${event}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
    }));
}

// --- Callback Handlers (decomposed for readability and testability) ---

/** Handle /list command: show last 5 radar alerts */
async function handleListCommand(chatId: number): Promise<void> {
    if (!redis) return;

    const items = await redis.zrange('radar:alerts', 0, 4, { rev: true });

    if (!items || items.length === 0) {
        await sendTelegramMessage(String(chatId), 'На радаре пока пусто.');
    } else {
        for (const item of items) {
            const alert = item as RadarStoredData;
            const text = `📌 <b>${escapeHtml(alert.serviceName)}</b> (${escapeHtml(alert.city)})\n📝 ${escapeHtml(alert.description)}`;
            await sendTelegramMessage(String(chatId), text, {
                inline_keyboard: [[{ text: '🗑 Удалить с сайта', callback_data: `delradar_${alert.id}` }]]
            });
        }
    }
}

/** Handle approve/reject radar report callbacks */
async function handleRadarModeration(callbackQuery: TelegramCallbackQuery, data: string): Promise<void> {
    if (!redis) return;

    const isApprove = data.startsWith('approve_radar_');
    const reportId = data.replace(isApprove ? 'approve_radar_' : 'reject_radar_', '');
    const message = callbackQuery.message;

    const pendingKey = `radar:pending:${reportId}`;
    const pendingDataStr = await redis.get(pendingKey);

    if (!pendingDataStr) {
        await answerCallbackQuery(callbackQuery.id, 'Заявка не найдена или уже была обработана.');
        return;
    }

    const originalText = message?.text || 'Заявка с Радара';
    let newText = originalText;

    if (isApprove) {
        const parsedData: RadarStoredData = typeof pendingDataStr === 'string' ? JSON.parse(pendingDataStr) : pendingDataStr as RadarStoredData;
        await redis.zadd('radar:alerts', { score: parsedData.timestamp, member: parsedData });
        await redis.del(pendingKey);
        newText += '\n\n✅ Одобрено и опубликовано на сайте!';
    } else {
        await redis.del(pendingKey);
        newText += '\n\n❌ Отклонено модератором.';
    }

    try { await answerCallbackQuery(callbackQuery.id, isApprove ? 'Одобрено!' : 'Отклонено!'); } catch (e: unknown) { logError('answerCallback', e); }

    if (message?.chat && message.message_id) {
        try { await editTelegramMessage(message.chat.id, message.message_id, newText); } catch (e: unknown) { logError('editMessage', e); }
    }
}

/** Handle delradar_ callback: remove a published alert */
async function handleDeleteRadar(callbackQuery: TelegramCallbackQuery, data: string): Promise<void> {
    if (!redis) return;

    const reportId = data.replace('delradar_', '');
    const message = callbackQuery.message;

    const items = await redis.zrange('radar:alerts', 0, -1);
    const itemToRemove = items.find((i) => (i as RadarStoredData)?.id === reportId);

    if (itemToRemove) {
        await redis.zrem('radar:alerts', itemToRemove);
    }

    try { await answerCallbackQuery(callbackQuery.id, 'Удалено навсегда!'); } catch (e: unknown) { logError('answerCallback', e); }

    if (message?.chat && message.message_id) {
        try {
            await editTelegramMessage(message.chat.id, message.message_id,
                (message?.text || 'Заявка с Радара') + '\n\n🗑 Удалено с сайта.');
        } catch (e: unknown) { logError('editMessage', e); }
    }
}

/** Handle reset_limit_ callback: reset rate limits for a hashed IP */
async function handleResetLimit(callbackQuery: TelegramCallbackQuery, data: string): Promise<void> {
    if (!redis) return;

    const ipHash = data.replace('reset_limit_', '');
    const message = callbackQuery.message;

    const realIp = await redis.get(`limit_request:${ipHash}`) as string | null;

    if (realIp && isValidIpLike(realIp)) {
        let cursor = '0';
        do {
            const scanRes = await redis.scan(cursor, { match: `*chat_${realIp}*`, count: 100 });
            cursor = scanRes[0];
            const keys = scanRes[1];
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== '0');

        await redis.del(`limit_request:${ipHash}`);
    }

    try {
        await answerCallbackQuery(callbackQuery.id, realIp ? 'Лимиты сброшены!' : 'IP не найден (ссылка устарела).');
    } catch (e: unknown) { logError('answerCallback', e); }

    if (message?.chat && message.message_id) {
        try {
            await editTelegramMessage(message.chat.id, message.message_id,
                (message?.text || 'Запрос лимитов') + (realIp ? '\n\n✅ Лимиты успешно сброшены модератором!' : '\n\n⚠️ IP не найден (ссылка устарела).'));
        } catch (e: unknown) { logError('editMessage', e); }
    }
}

// --- Main Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Health check
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'Webhook is running perfectly!' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Verify webhook authenticity — FAIL-CLOSED
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error(JSON.stringify({ event: 'tgWebhook_secret_missing', critical: true }));
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    const receivedToken = req.headers['x-telegram-bot-api-secret-token'] as string;
    if (receivedToken !== webhookSecret) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (!redis) {
        return res.status(500).json({ error: 'Redis is not configured' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        return res.status(500).json({ error: 'Telegram Token missing' });
    }

    try {
        const update = req.body as TelegramUpdate;

        // Handle text commands
        if (update?.message?.text?.startsWith('/list')) {
            await handleListCommand(update.message.chat.id);
            return res.status(200).json({ ok: true });
        }

        // Handle callback queries (inline keyboard buttons)
        if (update?.callback_query) {
            const { callback_query } = update;
            const data = callback_query.data;

            if (data?.startsWith('approve_radar_') || data?.startsWith('reject_radar_')) {
                await handleRadarModeration(callback_query, data);
            } else if (data?.startsWith('delradar_')) {
                await handleDeleteRadar(callback_query, data);
            } else if (data?.startsWith('reset_limit_')) {
                await handleResetLimit(callback_query, data);
            }
        }

        return res.status(200).json({ ok: true });
    } catch (error: unknown) {
        logError('handler', error);
        return res.status(200).json({ ok: false, error: 'Webhook error handled safely' });
    }
}
