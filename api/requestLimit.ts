import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashIp } from '../utils/hashIp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const ip = (req.headers['x-vercel-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            ?? req.socket?.remoteAddress
            ?? 'unknown';

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: 'Telegram misconfigured.' });
        }

        const messageText = `🤖 <b>Запрос Лимитов Чат-Бота!</b>\n\n🌐 <b>IP Hash:</b> <code>${hashIp(ip)}</code>\n\nПользователь исчерпал лимит в 15 запросов/сут и просит добавить еще.\nОдобрить сброс лимитов для этого IP?`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ Одобрить и Сбросить Лимит", callback_data: `reset_limit_${ip}` }
                    ]]
                }
            })
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Request limit error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
