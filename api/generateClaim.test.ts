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
});

