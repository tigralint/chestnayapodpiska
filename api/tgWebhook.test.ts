import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mockGet = vi.fn().mockResolvedValue(null);
const mockSet = vi.fn().mockResolvedValue('OK');
const mockDel = vi.fn().mockResolvedValue(1);
const mockZrange = vi.fn().mockResolvedValue([]);
const mockZadd = vi.fn().mockResolvedValue(1);
const mockZrem = vi.fn().mockResolvedValue(1);
const mockScan = vi.fn().mockResolvedValue(['0', []]);

// Mock Redis — return object with all needed methods
vi.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: vi.fn().mockReturnValue({
            get: (...args: unknown[]) => mockGet(...args),
            set: (...args: unknown[]) => mockSet(...args),
            del: (...args: unknown[]) => mockDel(...args),
            zrange: (...args: unknown[]) => mockZrange(...args),
            zadd: (...args: unknown[]) => mockZadd(...args),
            zrem: (...args: unknown[]) => mockZrem(...args),
            scan: (...args: unknown[]) => mockScan(...args),
        }),
    },
}));

vi.mock('../utils/escapeHtml', () => ({
    escapeHtml: vi.fn((s: string) => s),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
vi.stubGlobal('fetch', mockFetch);

// Set ALL env vars BEFORE module evaluation (import is hoisted above assignments)
vi.hoisted(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'my-secret';
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
});

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
        mockGet.mockResolvedValue(null);
        mockZrange.mockResolvedValue([]);
        mockScan.mockResolvedValue(['0', []]);
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
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('handler is exported as default function', () => {
            expect(typeof handler).toBe('function');
        });
    });

    describe('/list command', () => {
        it('sends empty message when no alerts', async () => {
            mockZrange.mockResolvedValueOnce([]);
            const { req, res } = createMockReqRes('POST', {
                message: { chat: { id: 123 }, message_id: 1, text: '/list' },
            });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockFetch).toHaveBeenCalled();
        });

        it('sends alert details when alerts exist', async () => {
            mockZrange.mockResolvedValueOnce([
                { id: 'alert-1', serviceName: 'Netflix', city: 'Москва', description: 'Hidden cancel button', category: 'hidden_cancel', timestamp: Date.now() },
            ]);
            const { req, res } = createMockReqRes('POST', {
                message: { chat: { id: 123 }, message_id: 1, text: '/list' },
            });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockFetch).toHaveBeenCalled();
            const fetchBody = JSON.parse(mockFetch.mock.calls[0]![1].body);
            expect(fetchBody.chat_id).toBe('123');
        });
    });

    describe('Radar moderation callbacks', () => {
        it('approves a pending radar report', async () => {
            const pendingData = JSON.stringify({
                id: 'report-1',
                timestamp: Date.now(),
                serviceName: 'Test',
                city: 'Москва',
                description: 'Test description',
                category: 'other',
            });
            mockGet.mockResolvedValueOnce(pendingData);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-1',
                    data: 'approve_radar_report-1',
                    message: { chat: { id: 456 }, message_id: 10, text: 'Original message' },
                },
            });
            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockZadd).toHaveBeenCalled();
            expect(mockDel).toHaveBeenCalledWith('radar:pending:report-1');
        });

        it('rejects a pending radar report', async () => {
            mockGet.mockResolvedValueOnce('{"id":"report-2"}');

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-2',
                    data: 'reject_radar_report-2',
                    message: { chat: { id: 456 }, message_id: 11, text: 'Report text' },
                },
            });
            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockDel).toHaveBeenCalledWith('radar:pending:report-2');
            expect(mockZadd).not.toHaveBeenCalled();
        });

        it('handles already-processed report gracefully', async () => {
            mockGet.mockResolvedValueOnce(null);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-3',
                    data: 'approve_radar_gone-report',
                    message: { chat: { id: 456 }, message_id: 12 },
                },
            });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('Delete radar callback', () => {
        it('deletes a published alert from the sorted set', async () => {
            const alert = { id: 'alert-to-delete', serviceName: 'Test', city: 'М', description: 'D', category: 'other' };
            mockZrange.mockResolvedValueOnce([alert]);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-del',
                    data: 'delradar_alert-to-delete',
                    message: { chat: { id: 789 }, message_id: 20, text: 'Alert text' },
                },
            });
            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockZrem).toHaveBeenCalledWith('radar:alerts', alert);
        });

        it('handles non-existent alert gracefully', async () => {
            mockZrange.mockResolvedValueOnce([]);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-del2',
                    data: 'delradar_nonexistent',
                    message: { chat: { id: 789 }, message_id: 21 },
                },
            });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('Reset limit callback', () => {
        it('resets rate limits for a known IP hash', async () => {
            mockGet.mockResolvedValueOnce('192.168.1.1');
            mockScan.mockResolvedValueOnce(['0', ['key1', 'key2']]);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-reset',
                    data: 'reset_limit_abc123hash',
                    message: { chat: { id: 999 }, message_id: 30, text: 'Limit request' },
                },
            });
            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockDel).toHaveBeenCalledWith('key1', 'key2');
            expect(mockDel).toHaveBeenCalledWith('limit_request:abc123hash');
        });

        it('handles expired/missing IP hash gracefully', async () => {
            mockGet.mockResolvedValueOnce(null);

            const { req, res } = createMockReqRes('POST', {
                callback_query: {
                    id: 'cbq-reset2',
                    data: 'reset_limit_unknownhash',
                    message: { chat: { id: 999 }, message_id: 31, text: 'Old request' },
                },
            });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('Error handling', () => {
        it('returns 200 on unexpected errors (safe webhook behavior)', async () => {
            const { req, res } = createMockReqRes('POST', {
                message: { chat: { id: 123 }, message_id: 1, text: '/list' },
            });
            mockZrange.mockRejectedValueOnce(new Error('Redis connection failed'));
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
