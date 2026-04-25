import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportSchema } from './reportPattern';

// --- Mocks ---
vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn(() => ({})) }
}));
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    }))
}));
vi.mock('../utils/hashIp', () => ({
    hashIp: vi.fn((ip: string) => `hashed_${ip}`),
}));

function mockRequest(overrides: Partial<{ method: string; headers: Record<string, string>; body: unknown; socket: { remoteAddress: string } }> = {}) {
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
    });

    describe('Schema validation', () => {
        it('should pass with valid data', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test Service',
                description: 'This is a test description of a dark pattern long enough to pass.',
                contactInfo: '@testuser',
                turnstileToken: 'dummy-token'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if description is too short', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test Service',
                description: 'Short',
                turnstileToken: 'dummy-token'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
               expect(result.error.issues[0]?.message).toContain('минимум 10 символов');
            }
        });

        it('should fail if turnstile token is missing', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Test Service',
                description: 'This is a test description.',
                contactInfo: '@testuser'
            });
            expect(result.success).toBe(false);
        });

        it('should accept optional contactInfo', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Service',
                description: 'A valid description for testing dark patterns.',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(true);
        });

        it('should reject serviceName exceeding 100 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'x'.repeat(101),
                description: 'A valid description for testing dark patterns.',
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should reject description exceeding 2000 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Service',
                description: 'x'.repeat(2001),
                turnstileToken: 'dummy'
            });
            expect(result.success).toBe(false);
        });

        it('should reject contactInfo exceeding 200 chars', () => {
            const result = reportSchema.safeParse({
                serviceName: 'Service',
                description: 'A valid description for testing dark patterns.',
                contactInfo: 'x'.repeat(201),
                turnstileToken: 'dummy'
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
            const req = mockRequest({ body: { serviceName: 'Test', description: 'A description long enough', turnstileToken: 'test' } });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(500);
        });
    });
});
