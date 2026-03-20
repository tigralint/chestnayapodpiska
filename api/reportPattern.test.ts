import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportSchema } from './reportPattern';

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
    });
});
