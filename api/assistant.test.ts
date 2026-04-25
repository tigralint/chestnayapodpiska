import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assistantSchema } from './assistant';

// Mock dependencies needed for module import (Edge Runtime handler)
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue({ success: true }),
    })),
}));

vi.mock('@upstash/redis', () => ({
    Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}));

vi.mock('../utils/getClientIp', () => ({
    getClientIpEdge: vi.fn().mockReturnValue('127.0.0.1'),
}));

process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

describe('API: assistant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Schema validation', () => {
        const validPayload = {
            messages: [{ role: 'user', text: 'Как вернуть деньги за подписку?' }],
            turnstileToken: 'test-token-123',
        };

        it('accepts valid payload', () => {
            const result = assistantSchema.safeParse(validPayload);
            expect(result.success).toBe(true);
        });

        it('rejects empty messages array', () => {
            const result = assistantSchema.safeParse({ ...validPayload, messages: [] });
            expect(result.success).toBe(false);
        });

        it('rejects missing turnstileToken', () => {
            const result = assistantSchema.safeParse({ ...validPayload, turnstileToken: '' });
            expect(result.success).toBe(false);
        });

        it('rejects payload without turnstileToken field', () => {
            const { turnstileToken: _, ...noToken } = validPayload;
            const result = assistantSchema.safeParse(noToken);
            expect(result.success).toBe(false);
        });

        it('accepts messages with optional image field', () => {
            const payload = {
                ...validPayload,
                messages: [{ role: 'user', text: 'Что на фото?', image: 'data:image/jpeg;base64,...' }],
            };
            const result = assistantSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });

        it('rejects messages exceeding 50 limit', () => {
            const messages = Array.from({ length: 51 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'model',
                text: `Message ${i}`,
            }));
            const result = assistantSchema.safeParse({ messages, turnstileToken: 'test' });
            expect(result.success).toBe(false);
        });

        it('accepts exactly 50 messages', () => {
            const messages = Array.from({ length: 50 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'model',
                text: `Message ${i}`,
            }));
            const result = assistantSchema.safeParse({ messages, turnstileToken: 'test' });
            expect(result.success).toBe(true);
        });

        it('rejects messages with missing text field', () => {
            const result = assistantSchema.safeParse({
                messages: [{ role: 'user' }],
                turnstileToken: 'test',
            });
            expect(result.success).toBe(false);
        });

        it('rejects messages with missing role field', () => {
            const result = assistantSchema.safeParse({
                messages: [{ text: 'hello' }],
                turnstileToken: 'test',
            });
            expect(result.success).toBe(false);
        });

        it('accepts multi-turn conversation', () => {
            const payload = {
                messages: [
                    { role: 'user', text: 'Привет' },
                    { role: 'model', text: 'Здравствуйте! Чем могу помочь?' },
                    { role: 'user', text: 'Хочу вернуть деньги' },
                ],
                turnstileToken: 'test-token',
            };
            const result = assistantSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
    });

    describe('Edge Runtime handler', () => {
        it('exports edge runtime config', async () => {
            const { config } = await import('./assistant');
            expect(config.runtime).toBe('edge');
        });

        it('handler is exported as default function', async () => {
            const module = await import('./assistant');
            expect(typeof module.default).toBe('function');
        });
    });
});
