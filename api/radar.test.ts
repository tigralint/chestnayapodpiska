import { describe, it, expect, vi, beforeEach } from 'vitest';
import { radarReportSchema } from './radar';

// --- Mocks for module-level singletons (Redis, Ratelimit) ---
vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn(() => ({ zrange: vi.fn(), set: vi.fn() })) }
}));
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    }))
}));

// Mock hashIp
vi.mock('../utils/hashIp', () => ({
    hashIp: vi.fn((ip: string) => `hashed_${ip}`),
}));

function mockRequest(overrides: Partial<{ method: string; headers: Record<string, string>; body: unknown; query: Record<string, string>; socket: { remoteAddress: string } }> = {}) {
    return {
        method: overrides.method ?? 'GET',
        headers: overrides.headers ?? {},
        body: overrides.body ?? {},
        query: overrides.query ?? {},
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

describe('API: radar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
        process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    });

    describe('Schema validation', () => {
        it('should pass with valid data', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test Service',
                city: 'Москва',
                amount: 500,
                description: 'This is a test description of an alert.',
                category: 'hidden_cancel',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if description is too short', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test',
                city: 'Москва',
                description: 'Short',
                category: 'other',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should reject invalid category', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test',
                city: 'Москва',
                description: 'A valid description for testing',
                category: 'invalid_category',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should accept amount as optional', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test',
                city: 'Москва',
                description: 'A valid description for testing',
                category: 'dark_pattern',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(true);
        });

        it('should reject negative amount', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test',
                city: 'Москва',
                amount: -100,
                description: 'A valid description for testing',
                category: 'dark_pattern',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty city', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'Test',
                city: '',
                description: 'A valid description for testing',
                category: 'dark_pattern',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should reject serviceName exceeding 100 chars', () => {
            const result = radarReportSchema.safeParse({
                serviceName: 'x'.repeat(101),
                city: 'Москва',
                description: 'A valid description for testing',
                category: 'dark_pattern',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should accept all valid categories', () => {
            const categories = ['hidden_cancel', 'auto_renewal', 'dark_pattern', 'phishing', 'refund_refused', 'other'];
            for (const category of categories) {
                const result = radarReportSchema.safeParse({
                    serviceName: 'Test',
                    city: 'Москва',
                    description: 'A valid description for testing',
                    category,
                    turnstileToken: 'dummy'
                });
                expect(result.success).toBe(true);
            }
        });
    });

    describe('Handler', () => {
        it('should return 405 for unsupported methods', async () => {
            const { default: handler } = await import('./radar');
            const req = mockRequest({ method: 'PUT' });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(405);
        });
    });
});
