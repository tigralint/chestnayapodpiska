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

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

describe('API: assistant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
        process.env.GEMINI_API_KEY = 'gemini-key';
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

        it('returns 405 for non-POST requests', async () => {
            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', { method: 'GET' });
            const res = await handler(req);
            expect(res.status).toBe(405);
        });

        it('returns 400 for invalid body', async () => {
            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invalid: true }),
            });
            const res = await handler(req);
            expect(res.status).toBe(400);
        });

        it('returns 500 when TURNSTILE_SECRET_KEY is missing', async () => {
            delete process.env.TURNSTILE_SECRET_KEY;
            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'token',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(500);
        });

        it('returns 500 when GEMINI_API_KEY is missing', async () => {
            delete process.env.GEMINI_API_KEY;
            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'token',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(500);
        });

        it('returns 403 when Turnstile verification fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: false }),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'invalid-token',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(403);
        });

        it('returns 503 when all AI models fail', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // All model calls fail with 500
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal Server Error'),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'Как вернуть подписку?' }],
                    turnstileToken: 'valid-token',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(503);
        });

        it('streams response when AI model succeeds', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // AI model returns SSE stream
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n'));
                    controller.close();
                },
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream,
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'Привет' }],
                    turnstileToken: 'valid-token',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(200);
            expect(res.headers.get('Content-Type')).toBe('text/event-stream');
            expect(res.headers.get('X-AI-Model')).toBeTruthy();
        });

        it('includes RAG context for known services', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // AI model succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: new ReadableStream({ start(c) { c.close(); } }),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'Как отменить Яндекс Плюс?' }],
                    turnstileToken: 'valid-token',
                }),
            });
            const res = await handler(req);
            // Should succeed with streaming response
            expect(res.status).toBe(200);
        });

        it('handles model cascade with 429 fallback', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // First model returns 429
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: () => Promise.resolve('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'),
            });
            // Second model succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: new ReadableStream({ start(c) { c.close(); } }),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'valid',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(200);
            // Should have skip reasons
            const skipReasons = res.headers.get('X-AI-Skip-Reasons');
            expect(skipReasons).toBeTruthy();
        });

        it('formats messages with image as inlineData', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // AI model succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: new ReadableStream({ start(c) { c.close(); } }),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'Что на скриншоте?', image: 'base64ImageData' }],
                    turnstileToken: 'valid',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(200);
            // Verify the request body sent to AI includes inlineData
            const aiCallBody = JSON.parse(mockFetch.mock.calls[1]![1].body);
            const parts = aiCallBody.contents[0].parts;
            expect(parts.some((p: { inlineData?: unknown }) => p.inlineData)).toBe(true);
        });

        it('handles 400 error from AI model and continues to next', async () => {
            // Turnstile passes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
            // First model returns 400
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: () => Promise.resolve('Bad Request'),
            });
            // Second model succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: new ReadableStream({ start(c) { c.close(); } }),
            });

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'valid',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(200);
        });

        it('returns 500 on unexpected errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network failure'));

            const { default: handler } = await import('./assistant');
            const req = new Request('https://example.com/api/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', text: 'test' }],
                    turnstileToken: 'valid',
                }),
            });
            const res = await handler(req);
            expect(res.status).toBe(500);
        });
    });
});
