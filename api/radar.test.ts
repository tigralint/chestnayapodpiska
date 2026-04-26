import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
});

import { radarReportSchema } from './radar';


// --- Mocks for module-level singletons (Redis, Ratelimit) ---
const mockZrange = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockResolvedValue('OK');
const mockZadd = vi.fn().mockResolvedValue(1);

vi.mock('@upstash/redis', () => ({
    Redis: {
        fromEnv: vi.fn(() => ({
            zrange: (...args: unknown[]) => mockZrange(...args),
            set: (...args: unknown[]) => mockSet(...args),
            zadd: (...args: unknown[]) => mockZadd(...args),
        }))
    }
}));
vi.mock('@upstash/ratelimit', () => {
    class MockRatelimit {
        limit = vi.fn().mockResolvedValue({ success: true });
        static slidingWindow = vi.fn().mockReturnValue('sliding-window-config');
    }
    return { Ratelimit: MockRatelimit };
});



// Mock hashIp
vi.mock('../utils/hashIp', () => ({
    hashIp: vi.fn((ip: string) => `hashed_${ip}`),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);


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
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });
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

        it('should return 405 for DELETE method', async () => {
            const { default: handler } = await import('./radar');
            const req = mockRequest({ method: 'DELETE' });
            const res = mockResponse();
            await handler(req as never, res as never);
            expect(res.statusCode).toBe(405);
        });

        describe('GET /radar', () => {
            it('should return 200 with empty array when no alerts exist', async () => {
                mockZrange.mockResolvedValueOnce([]);
                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET' });
                const res = mockResponse();
                await handler(req as never, res as never);
                expect(res.statusCode).toBe(200);
                expect(res._json).toEqual([]);
            });

            it('should return alerts with proper formatting', async () => {
                const now = Date.now();
                mockZrange.mockResolvedValueOnce([
                    {
                        id: 'test-1',
                        timestamp: now - 5 * 60000,
                        serviceName: 'Яндекс Плюс',
                        city: 'Москва',
                        description: 'Скрытая кнопка отмены',
                        category: 'hidden_cancel',
                    },
                ]);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET' });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(200);
                const data = res._json as Array<{ id: string; severity: string; category: string; serviceName: string }>;
                expect(data).toHaveLength(1);
                expect(data[0]!.id).toBe('test-1');
                expect(data[0]!.severity).toBe('critical'); // hidden_cancel = critical
                expect(data[0]!.serviceName).toBe('Яндекс Плюс');
            });

            it('should filter by category when provided', async () => {
                mockZrange.mockResolvedValueOnce([
                    { id: '1', timestamp: Date.now(), serviceName: 'A', city: 'Москва', description: 'Test', category: 'phishing' },
                    { id: '2', timestamp: Date.now(), serviceName: 'B', city: 'СПб', description: 'Test', category: 'dark_pattern' },
                ]);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET', query: { category: 'phishing' } });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(200);
                const data = res._json as Array<{ category: string }>;
                expect(data).toHaveLength(1);
                expect(data[0]!.category).toBe('phishing');
            });

            it('should respect limit query parameter', async () => {
                const items = Array.from({ length: 10 }, (_, i) => ({
                    id: `item-${i}`,
                    timestamp: Date.now() - i * 60000,
                    serviceName: `Service ${i}`,
                    city: 'Москва',
                    description: 'Test description here',
                    category: 'other' as const,
                }));
                mockZrange.mockResolvedValueOnce(items);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET', query: { limit: '3' } });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(200);
                expect((res._json as unknown[]).length).toBe(3);
            });

            it('should show "только что" for 0-minute-old alerts', async () => {
                mockZrange.mockResolvedValueOnce([
                    { id: 'fresh', timestamp: Date.now(), serviceName: 'Fresh', city: 'Москва', description: 'Just now', category: 'other' },
                ]);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET' });
                const res = mockResponse();
                await handler(req as never, res as never);

                const data = res._json as Array<{ time: string }>;
                expect(data[0]!.time).toBe('только что');
            });

            it('should show hours for old alerts', async () => {
                mockZrange.mockResolvedValueOnce([
                    { id: 'old', timestamp: Date.now() - 120 * 60000, serviceName: 'Old', city: 'Москва', description: 'Two hours ago', category: 'other' },
                ]);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET' });
                const res = mockResponse();
                await handler(req as never, res as never);

                const data = res._json as Array<{ time: string }>;
                expect(data[0]!.time).toBe('2 ч назад');
            });

            it('should return correct severity for different categories', async () => {
                mockZrange.mockResolvedValueOnce([
                    { id: '1', timestamp: Date.now(), serviceName: 'A', city: 'М', description: 'Test alert text', category: 'phishing' },
                    { id: '2', timestamp: Date.now(), serviceName: 'B', city: 'М', description: 'Test alert text', category: 'refund_refused' },
                    { id: '3', timestamp: Date.now(), serviceName: 'C', city: 'М', description: 'Test alert text', category: 'auto_renewal' },
                ]);

                const { default: handler } = await import('./radar');
                const req = mockRequest({ method: 'GET' });
                const res = mockResponse();
                await handler(req as never, res as never);

                const data = res._json as Array<{ severity: string }>;
                expect(data[0]!.severity).toBe('critical');   // phishing
                expect(data[1]!.severity).toBe('high');       // refund_refused
                expect(data[2]!.severity).toBe('medium');     // auto_renewal
            });
        });

        describe('POST /radar', () => {
            it('should create a report and return success', async () => {
                const { default: handler } = await import('./radar');
                const req = mockRequest({
                    method: 'POST',
                    body: {
                        serviceName: 'Netflix',
                        city: 'Москва',
                        amount: 1500,
                        description: 'Кнопка отмены скрыта за 7 шагами',
                        category: 'hidden_cancel',
                        turnstileToken: 'valid-token',
                    },
                });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(200);
                expect((res._json as { success: boolean }).success).toBe(true);
                expect((res._json as { id: string }).id).toBeTruthy();
            });

            it('should return 400 for invalid POST data', async () => {
                const { default: handler } = await import('./radar');
                const req = mockRequest({
                    method: 'POST',
                    body: {
                        serviceName: '',
                        city: 'Москва',
                        description: 'Short',
                        category: 'other',
                        turnstileToken: 'valid',
                    },
                });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(400);
            });

            it('should return 403 when Turnstile fails', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ success: false }),
                });

                const { default: handler } = await import('./radar');
                const req = mockRequest({
                    method: 'POST',
                    body: {
                        serviceName: 'Test Service',
                        city: 'Москва',
                        amount: 100,
                        description: 'A valid test description for the radar',
                        category: 'dark_pattern',
                        turnstileToken: 'invalid-token',
                    },
                });
                const res = mockResponse();
                await handler(req as never, res as never);

                expect(res.statusCode).toBe(403);
            });

            it('should return 500 when TURNSTILE_SECRET_KEY is missing', async () => {
                delete process.env.TURNSTILE_SECRET_KEY;
                const { default: handler } = await import('./radar');
                const req = mockRequest({
                    method: 'POST',
                    body: {
                        serviceName: 'Test',
                        city: 'М',
                        description: 'A valid description',
                        category: 'other',
                        turnstileToken: 'tok',
                    },
                });
                const res = mockResponse();
                await handler(req as never, res as never);
                expect(res.statusCode).toBe(500);
            });
        });
    });
});
