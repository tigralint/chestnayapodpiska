import { describe, it, expect } from 'vitest';
import { claimSchema, courseSchema } from './generateClaim';

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
