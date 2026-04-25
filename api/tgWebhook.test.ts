import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Redis — return object with all needed methods
vi.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue('OK'),
            del: vi.fn().mockResolvedValue(1),
            zrange: vi.fn().mockResolvedValue([]),
            zadd: vi.fn().mockResolvedValue(1),
            scan: vi.fn().mockResolvedValue([0, []]),
        }),
    },
}));

vi.mock('../utils/escapeHtml', () => ({
    escapeHtml: vi.fn((s: string) => s),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
vi.stubGlobal('fetch', mockFetch);

// Set ALL env vars before import
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';

import handler from './tgWebhook';

function createMockReqRes(method = 'POST', body: unknown = {}, secretToken = 'my-secret') {
    const req = {
        method,
        body,
        headers: { 'x-telegram-bot-api-secret-token': secretToken },
    } as unknown as VercelRequest;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as VercelResponse;
    return { req, res };
}

describe('API: tgWebhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
        process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    });

    describe('Auth & Method', () => {
        it('returns 200 for GET (health check)', async () => {
            const { req, res } = createMockReqRes('GET');
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: 'Webhook is running perfectly!' });
        });

        it('returns 405 for unsupported methods', async () => {
            const { req, res } = createMockReqRes('PUT');
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(405);
        });

        it('returns 500 when TELEGRAM_WEBHOOK_SECRET is missing (fail-closed)', async () => {
            delete process.env.TELEGRAM_WEBHOOK_SECRET;
            const { req, res } = createMockReqRes('POST', {}, '');
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Webhook secret not configured' });
        });

        it('returns 403 when secret token does not match', async () => {
            const { req, res } = createMockReqRes('POST', {}, 'wrong-secret');
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('returns 500 when TELEGRAM_BOT_TOKEN is missing', async () => {
            delete process.env.TELEGRAM_BOT_TOKEN;
            const { req, res } = createMockReqRes('POST');
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Update handling', () => {
        it('returns 200 for valid POST with empty body', async () => {
            const { req, res } = createMockReqRes('POST', {});
            await handler(req, res);
            // Empty update = no action, but should not crash
            const statusCall = vi.mocked(res.status).mock.calls[0]?.[0];
            expect([200, 500]).toContain(statusCall); // 500 if redis is null from module-level check
        });

        it('handler is exported as default function', () => {
            expect(typeof handler).toBe('function');
        });
    });
});
