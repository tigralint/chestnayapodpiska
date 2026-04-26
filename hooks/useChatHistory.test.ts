import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatHistory, type Message } from './useChatHistory';

const STORAGE_KEY = 'chestnayapodpiska_chat_history';

describe('useChatHistory', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts with empty messages', () => {
        const { result } = renderHook(() => useChatHistory());
        expect(result.current.messages).toEqual([]);
    });

    it('loads messages from localStorage on mount', () => {
        const stored: Message[] = [{ role: 'user', text: 'hello', id: '1' }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: stored,
        }));

        const { result } = renderHook(() => useChatHistory());
        expect(result.current.messages).toEqual(stored);
    });

    it('ignores expired localStorage data (>24h)', () => {
        const stored: Message[] = [{ role: 'user', text: 'old', id: '1' }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now() - 25 * 60 * 60 * 1000,
            data: stored,
        }));

        const { result } = renderHook(() => useChatHistory());
        expect(result.current.messages).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('addMessage appends a message', () => {
        const { result } = renderHook(() => useChatHistory());

        act(() => {
            result.current.addMessage({ role: 'user', text: 'test', id: 'msg1' });
        });

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages.at(0)?.text).toBe('test');
    });

    it('updateMessage modifies the correct message', () => {
        const { result } = renderHook(() => useChatHistory());

        act(() => {
            result.current.addMessage({ role: 'model', text: 'partial', id: 'bot1' });
        });
        act(() => {
            result.current.updateMessage('bot1', 'full response');
        });

        expect(result.current.messages.at(0)?.text).toBe('full response');
    });

    it('removeMessage removes the correct message', () => {
        const { result } = renderHook(() => useChatHistory());

        act(() => {
            result.current.addMessage({ role: 'user', text: 'a', id: '1' });
            result.current.addMessage({ role: 'model', text: 'b', id: '2' });
        });
        act(() => {
            result.current.removeMessage('1');
        });

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages.at(0)?.id).toBe('2');
    });

    it('clearHistory empties messages and localStorage', () => {
        const { result } = renderHook(() => useChatHistory());

        act(() => {
            result.current.addMessage({ role: 'user', text: 'x', id: '1' });
        });
        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.messages).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('strips imagePreview from persisted messages (PII safety)', () => {
        const { result } = renderHook(() => useChatHistory());

        act(() => {
            result.current.addMessage({
                role: 'user', text: 'look at this', id: '1',
                imagePreview: 'data:image/jpeg;base64,SENSITIVE_DATA'
            });
        });

        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const stored = JSON.parse(raw as string);
        expect(stored.data[0].imagePreview).toBeUndefined();
    });

    it('handles corrupted localStorage gracefully', () => {
        localStorage.setItem(STORAGE_KEY, '{invalid json}}}');
        const { result } = renderHook(() => useChatHistory());
        expect(result.current.messages).toEqual([]);
    });
});
