import { escapeHtml } from '../../utils/escapeHtml';

interface TelegramInlineButton {
    text: string;
    callback_data: string;
}

/**
 * Sends an HTML-formatted message to a Telegram chat via Bot API.
 * All user-provided strings MUST be pre-escaped via escapeHtml().
 */
export async function sendTelegramMessage(
    chatId: string,
    text: string,
    replyMarkup?: { inline_keyboard: TelegramInlineButton[][] },
): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...(replyMarkup && { reply_markup: replyMarkup }),
        }),
        signal: AbortSignal.timeout(10_000),
    });
}

/**
 * Edits the text of an existing Telegram message (used in callback handlers).
 */
export async function editTelegramMessage(
    chatId: string | number,
    messageId: number,
    text: string,
): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(10_000),
    });
}

/**
 * Answers a Telegram callback query (removes the loading indicator on the button).
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: text || '',
        }),
        signal: AbortSignal.timeout(5_000),
    });
}

/** Re-export escapeHtml for convenience in Telegram message building */
export { escapeHtml };
