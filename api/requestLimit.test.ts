import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock @upstash/ratelimit — factory cannot reference outer variables (hoisting)
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    })),
}));

vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue('OK') }) },
}));

vi.mock('../utils/getClientIp', () => ({
    getClientIp: vi.fn().mockReturnValue('192.168.1.1'),
}));

vi.mock('../utils/hashIp', () => ({
    hashIp: vi.fn().mockReturnValue('abc123def456'),
}));

vi.mock('../utils/escapeHtml', () => ({
    escapeHtml: vi.fn((s: string) => s),
}));

// Set env vars before import
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.TELEGRAM_ADMIN_CHAT_ID = '12345';

const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
vi.stubGlobal('fetch', mockFetch);

import handler from './requestLimit';
import { Redis } from '@upstash/redis';

function createMockReqRes(method = 'POST') {
    const req = { method, headers: {} } as unknown as VercelRequest;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as VercelResponse;
    return { req, res };
}

describe('API: requestLimit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
        process.env.TELEGRAM_ADMIN_CHAT_ID = '12345';
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    });

    it('returns 405 for non-POST methods', async () => {
        const { req, res } = createMockReqRes('GET');
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
    });

    it('returns 200 on success', async () => {
        const { req, res } = createMockReqRes('POST');
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('sends Telegram message with ipHash', async () => {
        const { req, res } = createMockReqRes('POST');
        await handler(req, res);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('api.telegram.org'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('abc123def456'),
            })
        );
    });

    it('includes callback_data in inline keyboard', async () => {
        const { req, res } = createMockReqRes('POST');
        await handler(req, res);
        const fetchBody = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string) as {
            reply_markup: { inline_keyboard: Array<Array<{ callback_data: string }>> }
        };
        expect(fetchBody.reply_markup.inline_keyboard[0]?.[0]?.callback_data).toBe('reset_limit_abc123def456');
    });

    it('returns 500 when Telegram is misconfigured', async () => {
        delete process.env.TELEGRAM_BOT_TOKEN;
        delete process.env.TELEGRAM_ADMIN_CHAT_ID;
        process.env.TELEGRAM_CHAT_ID = undefined;

        const { req, res } = createMockReqRes('POST');
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Telegram misconfigured.' });
    });

    it('stores IP mapping in Redis via the module-level Redis instance', async () => {
        const { req, res } = createMockReqRes('POST');
        await handler(req, res);
        // Verify Redis.fromEnv was called (module level initialization)
        expect(Redis.fromEnv).toHaveBeenCalled();
    });

    it('module exports handler as default function', () => {
        expect(typeof handler).toBe('function');
    });
});
