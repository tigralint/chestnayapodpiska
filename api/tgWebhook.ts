import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ? Redis.fromEnv() : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Проверка работоспособности по GET-запросу в браузере
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'Webhook is running perfectly!' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!redis) {
        return res.status(500).json({ error: 'Redis is not configured' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        return res.status(500).json({ error: 'Telegram Token missing' });
    }

    try {
        const update = req.body;
        
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
                        })
                    });
                } else {
                    const originalText = message?.text || 'Заявка с Радара';
                    let newText = originalText;
                    
                    if (isApprove) {
                        const parsedData = typeof pendingDataStr === 'string' ? JSON.parse(pendingDataStr) : pendingDataStr;
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
                            })
                        });
                    } catch (e) {
                        console.error('Answer callback error:', e);
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
                                })
                            });
                            if (!editRes.ok) console.error('TG Edit Error:', await editRes.text());
                        } catch (e) {
                            console.error('Edit Message error:', e);
                        }
                    }
                }
            }
        }
        
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(200).json({ ok: false, error: 'Webhook error handled safely' }); 
    }
}
