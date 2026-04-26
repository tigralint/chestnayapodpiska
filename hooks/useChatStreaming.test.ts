import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatStreaming } from './useChatStreaming';

describe('useChatStreaming', () => {
    it('cleanText strips <think> tags', () => {
        const { result } = renderHook(() => useChatStreaming());
        const cleaned = result.current.cleanText('<think>internal reasoning</think>Hello world');
        expect(cleaned).toBe('Hello world');
    });

    it('cleanText strips <|channel>thought tags (Gemma 4)', () => {
        const { result } = renderHook(() => useChatStreaming());
        const cleaned = result.current.cleanText('<|channel>thought\nsome thinking\n<channel|>Answer here');
        expect(cleaned).toBe('Answer here');
    });

    it('cleanText strips HTML tags', () => {
        const { result } = renderHook(() => useChatStreaming());
        const cleaned = result.current.cleanText('<b>bold</b> and <i>italic</i>');
        expect(cleaned).toBe('bold and italic');
    });

    it('cleanText handles empty string', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('')).toBe('');
    });

    it('cleanText handles text with no special tags', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(result.current.cleanText('Normal legal response text')).toBe('Normal legal response text');
    });

    it('cleanText handles nested think tags', () => {
        const { result } = renderHook(() => useChatStreaming());
        const input = '<think>step 1</think>Result<think>step 2</think> done';
        const cleaned = result.current.cleanText(input);
        expect(cleaned).toBe('Result done');
    });

    it('abort does not throw when no request is in-flight', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(() => result.current.abort()).not.toThrow();
    });

    it('exports streamResponse as a function', () => {
        const { result } = renderHook(() => useChatStreaming());
        expect(typeof result.current.streamResponse).toBe('function');
    });
});
