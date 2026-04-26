import { useRef, useCallback } from 'react';
import type { Message } from './useChatHistory';

/**
 * Handles SSE streaming from the Gemini API assistant endpoint.
 * Manages AbortController lifecycle and SSE line parsing.
 */
export function useChatStreaming() {
    /** AbortController for the current streaming fetch — prevents resource leaks */
    const abortRef = useRef<AbortController | null>(null);

    /** Strip <think> and <|channel>thought tags from model output */
    const cleanText = useCallback((text: string) => {
        let cleaned = text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '');
        cleaned = cleaned.replace(/<\|channel>thought[\s\S]*?(<channel\|>|$)/gi, '');
        // Safety net: strip any residual HTML-like tags the model might produce
        cleaned = cleaned.replace(/<[^>]+>/g, '');
        return cleaned.trim();
    }, []);

    /**
     * Streams a response from the assistant API endpoint.
     * Returns the full accumulated text, or throws on error.
     */
    const streamResponse = useCallback(async (
        history: Message[],
        captchaToken: string,
        onChunk: (fullText: string) => void,
        signal?: AbortSignal,
    ): Promise<string> => {
        // Abort any previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // If external signal aborts, propagate to our controller
        if (signal) {
            signal.addEventListener('abort', () => controller.abort(), { once: true });
        }

        const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: history.map(m => ({
                    role: m.role,
                    text: m.role === 'model' ? cleanText(m.text) : m.text,
                    ...(m.imagePreview ? { image: m.imagePreview.split(',')[1] } : {})
                })),
                turnstileToken: captchaToken
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Ошибка сети. Попробуйте позже.');
        }

        if (!response.body) {
            throw new Error('No readable stream');
        }

        if (import.meta.env.DEV) {
            const usedModel = response.headers.get('X-AI-Model');
            if (usedModel) {
                console.warn('%c[LegalBot AI] Activated Model: ' + usedModel, 'color: #0ea5e9; font-weight: bold; background: #0f172a; padding: 4px 8px; border-radius: 4px;');
            }
            const skippedModels = response.headers.get('X-AI-Skip-Reasons');
            if (skippedModels) {
                console.warn('[LegalBot AI] Models skipped before success:', skippedModels);
            }
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let fullText = '';
        let buffer = '';

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            const parts = data.candidates?.[0]?.content?.parts || [];
                            const answerParts = parts.filter((p: { text?: string; thought?: boolean }) => !p.thought);
                            const newText = answerParts.map((p: { text?: string }) => p.text).join('');

                            if (newText) {
                                fullText += newText;
                                onChunk(fullText);
                            }
                        } catch (e: unknown) {
                            if (import.meta.env.DEV) console.warn('JSON Parse inner error', e, trimmedLine);
                        }
                    }
                }
            }
        }

        return fullText;
    }, [cleanText]);

    /** Abort the current in-flight request */
    const abort = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    return { streamResponse, cleanText, abort, abortRef };
}
