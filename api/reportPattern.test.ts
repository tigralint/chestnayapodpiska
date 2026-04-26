import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportSchema } from './reportPattern';

vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    })),
}));

vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}));

vi.mock('../utils/hashIp', () => ({
    hashIp: vi.fn((ip: string) => `hashed_${ip}`),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

function mockRequest(overrides: Partial<{ method: string; body: unknown; socket: { remoteAddress: string }; headers: Record<string, string> }> = {}) {
    return {
        method: overrides.method ?? 'POST',
        headers: overrides.headers ?? {},
        body: overrides.body ?? {},
        socket: overrides.socket ?? { remoteAddress: '127.0.0.1' },
    };
}

function mockResponse() {
    const res = {
        statusCode: 200,
        _json: null as unknown,
        status(code: number) { res.statusCode = code; return res; },
        json(data: unknown) { res._json = data; return res; },
    };
    return res;
}

describe('API: reportPattern', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';
        process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
        process.env.TELEGRAM_CHAT_ID = 'test-chat-id';
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });
    });

    describe('Schema validation', () => {
        it('should pass with valid data', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Netflix',
                description: 'Кнопка отмены скрыта за настройками',
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(true);
        });

        it('should fail if description is too short', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test',
                description: 'Short',
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(false);
        });

        it('should fail if turnstile token is missing', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test',
                description: 'A valid description for testing',
            });
            expect(result.success).toBe(false);
        });

        it('should accept optional contactInfo', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test',
                description: 'A valid description for testing',
                contactInfo: 'user@email.com',
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(true);
        });

        it('should reject serviceName exceeding 100 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'x'.repeat(101),
                description: 'A valid description for testing',
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(false);
        });

        it('should reject description exceeding 2000 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test',
                description: 'x'.repeat(2001),
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(false);
        });

        it('should reject contactInfo exceeding 200 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test',
                description: 'A valid description for testing',
                contactInfo: 'x'.repeat(201),
                turnstileToken: 'dummy',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Handler', () => {
        it('should return 405 for GET requests', async () => {
            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({ method: 'GET' });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(405);
        });

        it('should return 500 when TURNSTILE_SECRET_KEY is missing', async () => {
            delete process.env.TURNSTILE_SECRET_KEY;
            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Test',
                    description: 'A valid description for testing',
                    turnstileToken: 'tok',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(500);
        });

        it('should return 500 when TELEGRAM_BOT_TOKEN is missing', async () => {
            delete process.env.TELEGRAM_BOT_TOKEN;
            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Test',
                    description: 'A valid description for testing',
                    turnstileToken: 'tok',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(500);
        });

        it('should return 400 for invalid request body', async () => {
            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: '',
                    description: 'Short',
                    turnstileToken: 'tok',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(400);
        });

        it('should return 403 when Turnstile verification fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: false }),
            });

            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Test Service',
                    description: 'A valid description for testing purposes',
                    turnstileToken: 'invalid-token',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 on successful report submission', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // Telegram send succeeds
            mockFetch.mockResolvedValueOnce({ ok: true });

            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Netflix',
                    description: 'Скрытая кнопка отмены подписки',
                    contactInfo: 'test@email.com',
                    turnstileToken: 'valid-token',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(200);
            expect((res._json as { success: boolean }).success).toBe(true);
        });

        it('should return 500 when Telegram send fails', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // Telegram send fails
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: () => Promise.resolve('Bot blocked'),
            });

            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Test Service',
                    description: 'A valid description for testing purposes',
                    turnstileToken: 'valid-token',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(500);
        });

        it('should handle missing contactInfo (shows "Не указан")', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            mockFetch.mockResolvedValueOnce({ ok: true });

            const { default: handler } = await import('./reportPattern');
            const req = mockRequest({
                method: 'POST',
                body: {
                    serviceName: 'Test',
                    description: 'A valid description for testing purposes',
                    turnstileToken: 'valid',
                },
            });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(200);

            // Verify the Telegram message body contains "Не указан"
            const tgCallBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
            expect(tgCallBody.text).toContain('Не указан');
        });
    });
});
