import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import type { RadarStoredData } from '../types';
import { escapeHtml } from '../utils/escapeHtml';

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

/** Timeout for all outgoing Telegram API requests (ms) */
const TG_TIMEOUT_MS = 10_000;

/** Validates that a string looks like an IPv4/IPv6 address or 'unknown' (prevents SCAN injection) */
function isValidIpLike(value: string): boolean {
    // IPv4, IPv6, or 'unknown' — reject wildcards and glob patterns
    return /^[\da-fA-F.:]+$/.test(value) || value === 'unknown';
}

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv() : null;

function logError(event: string, error: unknown) {
    console.error(JSON.stringify({
        event: `tgWebhook_${event}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Проверка работоспособности по GET-запросу в браузере
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'Webhook is running perfectly!' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Verify webhook authenticity via secret token set during webhook registration
    // FAIL-CLOSED: if secret is not configured, reject all requests
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

        // Обработка текстовых сообщений (команды из бота)
        if (update && update.message && update.message.text) {
            const message = update.message;
            if (message.text?.startsWith('/list')) {
                // Берем последние 5 алертов с радара
                const items = await redis.zrange('radar:alerts', 0, 4, { rev: true });
                
                if (!items || items.length === 0) {
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        body: JSON.stringify({ chat_id: message.chat.id, text: "На радаре пока пусто." }),
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                    });
                } else {
                    for (const item of items) {
                        const alert = item as RadarStoredData;
                        const text = `📌 <b>${escapeHtml(alert.serviceName)}</b> (${escapeHtml(alert.city)})\n📝 ${escapeHtml(alert.description)}`;
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                            method: 'POST',
                            body: JSON.stringify({
                                chat_id: message.chat.id,
                                text: text,
                                parse_mode: 'HTML',
                                reply_markup: {
                                    inline_keyboard: [[{ text: '🗑 Удалить с сайта', callback_data: `delradar_${alert.id}` }]]
                                }
                            }),
                            headers: { 'Content-Type': 'application/json' },
                            signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                        });
                    }
                }
                return res.status(200).json({ ok: true });
            }
        }
        
        // We only care about callback query
        if (update && update.callback_query) {
            const callbackQuery = update.callback_query;
            const data = callbackQuery.data as string;
            const message = callbackQuery.message;
            
            if (data && (data.startsWith('approve_radar_') || data.startsWith('reject_radar_'))) {
                const isApprove = data.startsWith('approve_radar_');
                const reportId = data.replace(isApprove ? 'approve_radar_' : 'reject_radar_', '');
                
                const pendingKey = `radar:pending:${reportId}`;
                const pendingDataStr = await redis.get(pendingKey);
                
                if (!pendingDataStr) {
                    // Answer callback saying expired or processed
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callback_query_id: callbackQuery.id,
                            text: 'Заявка не найдена или уже была обработана.',
                            show_alert: true
                        }),
                        signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                    });
                } else {
                    const originalText = message?.text || 'Заявка с Радара';
                    let newText = originalText;
                    
                    if (isApprove) {
                        const parsedData: RadarStoredData = typeof pendingDataStr === 'string' ? JSON.parse(pendingDataStr) : pendingDataStr as RadarStoredData;
                        // Move to active alerts list
                        await redis.zadd('radar:alerts', { score: parsedData.timestamp, member: parsedData });
                        await redis.del(pendingKey);
                        newText += '\n\n✅ Одобрено и опубликовано на сайте!';
                    } else {
                        await redis.del(pendingKey);
                        newText += '\n\n❌ Отклонено модератором.';
                    }

                    // 1. СРАЗУ снимаем "часики" загрузки на кнопке (Answer Callback)
                    try {
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                callback_query_id: callbackQuery.id,
                                text: isApprove ? 'Одобрено!' : 'Отклонено!'
                            }),
                            signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                        });
                    } catch (e: unknown) {
                        logError('answerCallback', e);
                    }

                    // 2. Меняем текст сообщения и удаляем кнопки
                    if (message && message.chat && message.message_id) {
                        try {
                            const editRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: message.chat.id,
                                    message_id: message.message_id,
                                    text: newText,
                                    reply_markup: { inline_keyboard: [] }
                                }),
                                signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                            });
                            if (!editRes.ok) logError('editMessage', await editRes.text());
                        } catch (e: unknown) {
                            logError('editMessage', e);
                        }
                    }
                }
            } else if (data && data.startsWith('delradar_')) {
                // Логика удаления _уже опубликованного_ алерта
                const reportId = data.replace('delradar_', '');
                
                // Ищем элемент во всем списке (чтобы удалить, нужно передать точный объект)
                const items = await redis.zrange('radar:alerts', 0, -1);
                const itemToRemove = items.find((i) => (i as RadarStoredData)?.id === reportId);

                if (itemToRemove) {
                    await redis.zrem('radar:alerts', itemToRemove);
                }

                try {
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: callbackQuery.id, text: 'Удалено навсегда!' }),
                        signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                    });
                } catch (e: unknown) {
                    logError('answerCallback', e);
                }

                if (message && message.chat && message.message_id) {
                    try {
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: message.chat.id,
                                message_id: message.message_id,
                                text: (message?.text || 'Заявка с Радара') + '\n\n🗑 Удалено с сайта.',
                                reply_markup: { inline_keyboard: [] }
                            }),
                            signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                        });
                    } catch (e: unknown) {
                        logError('editMessage', e);
                    }
                }
            } else if (data && data.startsWith('reset_limit_')) {
                // Логика сброса лимитов для IP (hash received from requestLimit.ts)
                const ipHash = data.replace('reset_limit_', '');

                // Look up real IP from the hash→IP mapping stored in Redis
                const realIp = await redis.get(`limit_request:${ipHash}`) as string | null;

                if (realIp && isValidIpLike(realIp)) {
                    // Ключи Upstash Ratelimit зависят от алгоритма, но обычно это: "@upstash/ratelimit:{alg}:{identifier}" или подобное.
                    // Самый надежный вариант - найти все ключи, содержащие идентификатор "chat_{ip}" и удалить их.
                    let cursor = '0';
                    do {
                        const scanRes = await redis.scan(cursor, { match: `*chat_${realIp}*`, count: 100 });
                        cursor = scanRes[0];
                        const keys = scanRes[1];
                        if (keys.length > 0) {
                            await redis.del(...keys);
                        }
                    } while (cursor !== '0');

                    // Clean up the mapping key
                    await redis.del(`limit_request:${ipHash}`);
                }

                try {
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: callbackQuery.id, text: realIp ? `Лимиты сброшены!` : 'IP не найден (ссылка устарела).' }),
                        signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                    });
                } catch (e: unknown) {
                    logError('answerCallback', e);
                }

                if (message && message.chat && message.message_id) {
                    try {
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: message.chat.id,
                                message_id: message.message_id,
                                text: (message?.text || 'Запрос лимитов') + (realIp ? `\n\n✅ Лимиты успешно сброшены модератором!` : '\n\n⚠️ IP не найден (ссылка устарела).'),
                                reply_markup: { inline_keyboard: [] }
                            }),
                            signal: AbortSignal.timeout(TG_TIMEOUT_MS),
                        });
                    } catch (e: unknown) {
                        logError('editMessage', e);
                    }
                }
            }
        }
        
        return res.status(200).json({ ok: true });
    } catch (error: unknown) {
        logError('handler', error);
        return res.status(200).json({ ok: false, error: 'Webhook error handled safely' }); 
    }
}
