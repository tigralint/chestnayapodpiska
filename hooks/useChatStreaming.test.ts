import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatStreaming } from './useChatStreaming';
import type { Message } from './useChatHistory';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/** Helper: creates a valid Message for tests */
function msg(text: string, role: 'user' | 'model' = 'user'): Message {
    return { role, text, id: crypto.randomUUID() };
}

describe('useChatStreaming', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── cleanText ────────────────────────────────────────────
    // These matter because LLMs emit <think> / <|channel>thought tags
    // that must be stripped before showing to the user.

    it('strips <think> reasoning blocks from model output', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('<think>internal reasoning</think>Hello world'))
            .toBe('Hello world');
    });

    it('strips Gemma 4 channel-thought tags', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('<|channel>thought\nsome thinking\n<channel|>Answer here'))
            .toBe('Answer here');
    });

    it('strips unclosed <think> tags (streaming edge case)', () => {
        const { result } = renderHook(() => useChatStreaming());
        // During streaming, a chunk may end mid-<think> block
        expect(result.current.cleanText('<think>unclosed thinking text')).toBe('');
    });

    it('strips HTML tags (security: prevents XSS from model)', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('<b>bold</b> and <script>alert(1)</script>'))
            .toBe('bold and alert(1)');
    });

    it('passes through clean text without mutation', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('Нормальный юридический ответ')).toBe('Нормальный юридический ответ');
    });

    // ── abort ────────────────────────────────────────────────

    it('abort() does not throw when no request is in-flight', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(() => result.current.abort()).not.toThrow();
    });

    // ── streamResponse: error handling ───────────────────────
    // These catch real bugs: API returning errors, broken streams, etc.

    it('throws with server error message on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: 'Превышен лимит запросов' }),
        });

        const { result } = renderHook(() => useChatStreaming());

        await expect(
            result.current.streamResponse([msg('test')], 'captcha-token', vi.fn())
        ).rejects.toThrow('Превышен лимит запросов');
    });

    it('throws fallback error when response body cannot be parsed', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error('not json')),
        });

        const { result } = renderHook(() => useChatStreaming());

        await expect(
            result.current.streamResponse([msg('test')], 'captcha-token', vi.fn())
        ).rejects.toThrow('Ошибка сети. Попробуйте позже.');
    });

    it('throws when response body is null', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            body: null,
            headers: new Headers(),
        });

        const { result } = renderHook(() => useChatStreaming());

        await expect(
            result.current.streamResponse([msg('test')], 'captcha-token', vi.fn())
        ).rejects.toThrow('No readable stream');
    });

    // ── streamResponse: SSE parsing ──────────────────────────
    // Core business logic: parsing the Gemini streaming format

    it('parses SSE chunks and accumulates full text', async () => {
        const encoder = new TextEncoder();
        const sseData = [
            'data: {"candidates":[{"content":{"parts":[{"text":"Привет"}]}}]}\n\n',
            'data: {"candidates":[{"content":{"parts":[{"text":", мир!"}]}}]}\n\n',
        ].join('');

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(sseData));
                controller.close();
            },
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            body: stream,
            headers: new Headers({ 'X-AI-Model': 'gemini-3.1-flash' }),
        });

        const { result } = renderHook(() => useChatStreaming());
        const onChunk = vi.fn();

        const fullText = await result.current.streamResponse(
            [msg('test')], 'captcha-token', onChunk,
        );

        expect(fullText).toBe('Привет, мир!');
        expect(onChunk).toHaveBeenCalledTimes(2);
    });

    it('filters out "thought" parts (thinking model responses)', async () => {
        const encoder = new TextEncoder();
        const sseData = 'data: {"candidates":[{"content":{"parts":[{"text":"thinking...","thought":true},{"text":"Answer"}]}}]}\n\n';

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(sseData));
                controller.close();
            },
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            body: stream,
            headers: new Headers(),
        });

        const { result } = renderHook(() => useChatStreaming());
        const fullText = await result.current.streamResponse(
            [msg('test')], 'captcha-token', vi.fn(),
        );

        expect(fullText).toBe('Answer');
    });

    it('ignores [DONE] sentinel and malformed JSON lines', async () => {
        const encoder = new TextEncoder();
        const sseData = [
            'data: {invalid json}\n',
            'data: {"candidates":[{"content":{"parts":[{"text":"OK"}]}}]}\n',
            'data: [DONE]\n',
        ].join('');

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(sseData));
                controller.close();
            },
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            body: stream,
            headers: new Headers(),
        });

        const { result } = renderHook(() => useChatStreaming());
        const fullText = await result.current.streamResponse(
            [msg('test')], 'captcha-token', vi.fn(),
        );

        expect(fullText).toBe('OK');
    });

    it('sends image data as base64 when message has imagePreview', async () => {
        const stream = new ReadableStream({ start(c) { c.close(); } });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            body: stream,
            headers: new Headers(),
        });

        const { result } = renderHook(() => useChatStreaming());

        const msgWithImage: Message = {
            role: 'user',
            text: 'Что на скриншоте?',
            id: 'img-1',
            imagePreview: 'data:image/jpeg;base64,abc123',
        };

        await result.current.streamResponse(
            [msgWithImage], 'captcha-token', vi.fn(),
        );

        const fetchBody = JSON.parse(mockFetch.mock.calls[0]![1].body);
        expect(fetchBody.messages[0].image).toBe('abc123');
    });
});
