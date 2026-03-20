import { describe, it, expect, vi, beforeEach } from 'vitest';
import { radarReportSchema } from './radar';

describe('API: radar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
    });
});
