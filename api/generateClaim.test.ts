import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimSchema, courseSchema } from './generateClaim';

// --- Module mocks for handler tests ---
vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn(() => ({ zrange: vi.fn(), set: vi.fn() })) }
}));
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    }))
}));
vi.mock('./_shared/turnstile', () => ({
    verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

function mockRequest(overrides: Partial<{ method: string; headers: Record<string, string>; body: unknown }> = {}) {
    return {
        method: overrides.method ?? 'POST',
        headers: overrides.headers ?? { 'x-forwarded-for': '127.0.0.1' },
        body: overrides.body ?? {},
    };
}

function mockResponse() {
    const res = {
        statusCode: 200,
        _json: null as unknown,
        _headers: new Map<string, string>(),
        status(code: number) { res.statusCode = code; return res; },
        json(data: unknown) { res._json = data; return res; },
        setHeader(key: string, value: string) { res._headers.set(key, value); return res; },
    };
    return res;
}

describe('claimSchema (Zod validation)', () => {
    const validClaim = {
        serviceName: 'Яндекс Плюс',
        amount: '299',
        date: '01.04.2026',
        reason: 'not_used',
        tone: 'soft' as const,
        turnstileToken: 'test-token',
    };

    it('accepts valid subscription claim data', () => {
        const result = claimSchema.safeParse(validClaim);
        expect(result.success).toBe(true);
    });

    it('rejects empty serviceName', () => {
        const result = claimSchema.safeParse({ ...validClaim, serviceName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects serviceName exceeding 100 chars', () => {
        const result = claimSchema.safeParse({ ...validClaim, serviceName: 'x'.repeat(101) });
        expect(result.success).toBe(false);
    });

    it('rejects missing turnstileToken', () => {
        const result = claimSchema.safeParse({ ...validClaim, turnstileToken: '' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid tone value', () => {
        const result = claimSchema.safeParse({ ...validClaim, tone: 'aggressive' });
        expect(result.success).toBe(false);
    });

    it('accepts optional customReason', () => {
        const result = claimSchema.safeParse({ ...validClaim, reason: 'custom', customReason: 'Мне не нравится' });
        expect(result.success).toBe(true);
    });

    it('rejects customReason exceeding 500 chars', () => {
        const result = claimSchema.safeParse({ ...validClaim, reason: 'custom', customReason: 'x'.repeat(501) });
        expect(result.success).toBe(false);
    });

    it('rejects amount exceeding 50 chars', () => {
        const result = claimSchema.safeParse({ ...validClaim, amount: 'x'.repeat(51) });
        expect(result.success).toBe(false);
    });
});

describe('courseSchema (Zod validation)', () => {
    const validCourse = {
        courseName: 'Skillbox Python',
        totalCost: 50000,
        percentCompleted: 30,
        tone: 'hard' as const,
        hasPlatformAccess: true,
        hasConsultations: false,
        hasCertificate: false,
        turnstileToken: 'test-token',
    };

    it('accepts valid course claim data', () => {
        const result = courseSchema.safeParse(validCourse);
        expect(result.success).toBe(true);
    });

    it('rejects empty courseName', () => {
        const result = courseSchema.safeParse({ ...validCourse, courseName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects negative totalCost', () => {
        const result = courseSchema.safeParse({ ...validCourse, totalCost: -100 });
        expect(result.success).toBe(false);
    });

    it('rejects zero totalCost', () => {
        const result = courseSchema.safeParse({ ...validCourse, totalCost: 0 });
        expect(result.success).toBe(false);
    });

    it('rejects totalCost exceeding 1 billion', () => {
        const result = courseSchema.safeParse({ ...validCourse, totalCost: 1_000_000_001 });
        expect(result.success).toBe(false);
    });

    it('rejects percentCompleted below 0', () => {
        const result = courseSchema.safeParse({ ...validCourse, percentCompleted: -1 });
        expect(result.success).toBe(false);
    });

    it('rejects percentCompleted above 100', () => {
        const result = courseSchema.safeParse({ ...validCourse, percentCompleted: 101 });
        expect(result.success).toBe(false);
    });

    it('accepts boundary values (0% and 100%)', () => {
        expect(courseSchema.safeParse({ ...validCourse, percentCompleted: 0 }).success).toBe(true);
        expect(courseSchema.safeParse({ ...validCourse, percentCompleted: 100 }).success).toBe(true);
    });

    it('rejects missing boolean fields', () => {
        const { hasPlatformAccess: _, ...incomplete } = validCourse;
        const result = courseSchema.safeParse(incomplete);
        expect(result.success).toBe(false);
    });
});

describe('generateClaim Handler (integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-api-key';
        process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-key';
        process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should return 405 for non-POST methods', async () => {
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({ method: 'GET' });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(405);
    });

    it('should return 400 for unknown document type', async () => {
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: { type: 'unknown', data: {}, calculatedRefund: 0 },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid subscription data', async () => {
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: { serviceName: '', amount: '', date: '', reason: '', tone: 'soft', turnstileToken: 'test' },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 for course with negative refund', async () => {
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'course',
                data: {
                    courseName: 'Test', totalCost: 50000, percentCompleted: 30,
                    tone: 'soft', hasPlatformAccess: true, hasConsultations: false,
                    hasCertificate: false, turnstileToken: 'test',
                },
                calculatedRefund: -100,
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(400);
    });

    it('should return 500 when GEMINI_API_KEY is missing', async () => {
        delete process.env.GEMINI_API_KEY;
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: { type: 'subscription', data: {} },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(500);
    });

    it('should return 500 when TURNSTILE_SECRET_KEY is missing', async () => {
        delete process.env.TURNSTILE_SECRET_KEY;
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: { type: 'subscription', data: {} },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(500);
    });

    it('should return 400 for invalid course data', async () => {
        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'course',
                data: { courseName: '', totalCost: -1, percentCompleted: 200, tone: 'soft', turnstileToken: 'test' },
                calculatedRefund: 0,
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(400);
    });

    it('should return 200 with generated text for valid subscription', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        // AI model returns success
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{
                    content: { parts: [{ text: 'Претензия по подписке...' }] },
                    finishReason: 'STOP',
                }],
            }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: {
                    serviceName: 'Яндекс Плюс',
                    amount: '299',
                    date: '01.04.2026',
                    reason: 'not_used',
                    tone: 'soft',
                    turnstileToken: 'valid',
                },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(200);
        expect((res._json as { text: string }).text).toBe('Претензия по подписке...');
    });

    it('should use custom reason prompt when reason is "custom"', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{ content: { parts: [{ text: 'Custom claim text' }] }, finishReason: 'STOP' }],
            }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: {
                    serviceName: 'Netflix',
                    amount: '999',
                    date: '15.03.2026',
                    reason: 'custom',
                    customReason: 'Навязали подписку без моего согласия',
                    tone: 'hard',
                    turnstileToken: 'valid',
                },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(200);
    });

    it('should return 200 with generated text for valid course', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{ content: { parts: [{ text: 'Претензия по курсу...' }] }, finishReason: 'STOP' }],
            }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'course',
                data: {
                    courseName: 'Skillbox Python',
                    totalCost: 50000,
                    percentCompleted: 20,
                    tone: 'hard',
                    hasPlatformAccess: true,
                    hasConsultations: false,
                    hasCertificate: false,
                    turnstileToken: 'valid',
                },
                calculatedRefund: 40000,
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(200);
        expect((res._json as { text: string }).text).toBe('Претензия по курсу...');
    });

    it('should return 422 when all AI models fail', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        // All models return quota exhausted
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ error: { code: 429, message: 'RESOURCE_EXHAUSTED' } }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: {
                    serviceName: 'Test',
                    amount: '100',
                    date: '01.01.2026',
                    reason: 'not_used',
                    tone: 'soft',
                    turnstileToken: 'valid',
                },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(422);
    });

    it('should handle safety block responses', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                promptFeedback: { blockReason: 'SAFETY' },
            }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: {
                    serviceName: 'Test',
                    amount: '100',
                    date: '01.01.2026',
                    reason: 'not_used',
                    tone: 'soft',
                    turnstileToken: 'valid',
                },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(422);
    });

    it('should filter out thinking parts from response', async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{
                    content: {
                        parts: [
                            { text: 'thinking...', thought: true },
                            { text: 'Actual claim text' },
                        ],
                    },
                    finishReason: 'STOP',
                }],
            }),
        });

        const { default: handler } = await import('./generateClaim');
        const req = mockRequest({
            body: {
                type: 'subscription',
                data: {
                    serviceName: 'Test',
                    amount: '100',
                    date: '01.01.2026',
                    reason: 'not_used',
                    tone: 'soft',
                    turnstileToken: 'valid',
                },
            },
        });
        const res = mockResponse();
        await handler(req as never, res as never);
        expect(res.statusCode).toBe(200);
        expect((res._json as { text: string }).text).toBe('Actual claim text');
    });
});

