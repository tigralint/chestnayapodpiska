import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Telegram shared module', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token-123';
        mockFetch.mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        delete process.env.TELEGRAM_BOT_TOKEN;
    });

    describe('sendTelegramMessage', () => {
        it('calls correct Telegram API endpoint with HTML parse mode', async () => {
            const { sendTelegramMessage } = await import('./telegram');
            await sendTelegramMessage('12345', 'Hello <b>World</b>');

            expect(mockFetch).toHaveBeenCalledOnce();
            const call = mockFetch.mock.calls[0]!;
            expect(call[0]).toBe('https://api.telegram.org/bottest-bot-token-123/sendMessage');

            const body = JSON.parse(call[1].body);
            expect(body).toMatchObject({
                chat_id: '12345',
                text: 'Hello <b>World</b>',
                parse_mode: 'HTML',
            });
        });

        it('includes reply_markup (inline keyboard) when provided', async () => {
            const { sendTelegramMessage } = await import('./telegram');
            const markup = {
                inline_keyboard: [[{ text: '✅ Approve', callback_data: 'approve_123' }]],
            };

            await sendTelegramMessage('99999', 'Choose:', markup);

            const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
            expect(body.reply_markup).toEqual(markup);
        });

        it('throws when TELEGRAM_BOT_TOKEN is not configured', async () => {
            delete process.env.TELEGRAM_BOT_TOKEN;
            const { sendTelegramMessage } = await import('./telegram');
            await expect(sendTelegramMessage('123', 'test'))
                .rejects.toThrow('TELEGRAM_BOT_TOKEN is not configured');
        });
    });

    describe('editTelegramMessage', () => {
        it('calls editMessageText endpoint with correct message_id', async () => {
            const { editTelegramMessage } = await import('./telegram');
            await editTelegramMessage('12345', 42, 'Updated text');

            expect(mockFetch).toHaveBeenCalledOnce();
            const call = mockFetch.mock.calls[0]!;
            expect(call[0]).toBe('https://api.telegram.org/bottest-bot-token-123/editMessageText');

            const body = JSON.parse(call[1].body);
            expect(body).toMatchObject({
                chat_id: '12345',
                message_id: 42,
                text: 'Updated text',
                parse_mode: 'HTML',
            });
        });

        it('throws when TELEGRAM_BOT_TOKEN is not configured', async () => {
            delete process.env.TELEGRAM_BOT_TOKEN;
            const { editTelegramMessage } = await import('./telegram');
            await expect(editTelegramMessage('123', 1, 'test'))
                .rejects.toThrow('TELEGRAM_BOT_TOKEN is not configured');
        });
    });

    describe('answerCallbackQuery', () => {
        it('acknowledges a callback query with text', async () => {
            const { answerCallbackQuery } = await import('./telegram');
            await answerCallbackQuery('cbq-123', 'Done!');

            const call = mockFetch.mock.calls[0]!;
            expect(call[0]).toBe('https://api.telegram.org/bottest-bot-token-123/answerCallbackQuery');

            const body = JSON.parse(call[1].body);
            expect(body).toMatchObject({
                callback_query_id: 'cbq-123',
                text: 'Done!',
            });
        });

        it('silently returns when TELEGRAM_BOT_TOKEN is missing', async () => {
            delete process.env.TELEGRAM_BOT_TOKEN;
            const { answerCallbackQuery } = await import('./telegram');
            // Should not throw or call fetch — graceful degradation
            await expect(answerCallbackQuery('cbq-789')).resolves.toBeUndefined();
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('re-exports', () => {
        it('re-exports escapeHtml for convenience', async () => {
            const { escapeHtml } = await import('./telegram');
            expect(escapeHtml('<b>')).toBe('&lt;b&gt;');
        });
    });
});
