import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatLimits } from './useChatLimits';

describe('useChatLimits', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('starts with null limits', () => {
        // Don't auto-fetch on render
        const { result } = renderHook(() => useChatLimits(false));
        expect(result.current.limits).toBeNull();
        expect(result.current.isRequestingLimit).toBe(false);
    });

    it('fetches limits when isOpen becomes true', async () => {
        const mockResponse = { remaining: 10, limit: 15 };
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
        } as Response);

        const { result } = renderHook(() => useChatLimits(true));

        // Wait for effect to fire
        await vi.waitFor(() => {
            expect(result.current.limits).toEqual({ remaining: 10, limit: 15 });
        });
    });

    it('refreshLimits fetches new data', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            json: () => Promise.resolve({ remaining: 5, limit: 15 }),
        } as Response);

        const { result } = renderHook(() => useChatLimits(false));

        await act(async () => {
            result.current.refreshLimits();
        });

        await vi.waitFor(() => {
            expect(result.current.limits).toEqual({ remaining: 5, limit: 15 });
        });
    });

    it('handleRequestMoreLimits returns "success" on ok response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        } as Response);

        const { result } = renderHook(() => useChatLimits(false));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.handleRequestMoreLimits();
        });

        expect(outcome).toBe('success');
        expect(result.current.isRequestingLimit).toBe(false);
    });

    it('handleRequestMoreLimits returns "error" on failed response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({}),
        } as Response);

        const { result } = renderHook(() => useChatLimits(false));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.handleRequestMoreLimits();
        });

        expect(outcome).toBe('error');
    });

    it('handleRequestMoreLimits returns "error" on network failure', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));

        const { result } = renderHook(() => useChatLimits(false));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.handleRequestMoreLimits();
        });

        expect(outcome).toBe('error');
        expect(result.current.isRequestingLimit).toBe(false);
    });

    it('silently ignores fetch errors during limit polling', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));

        const { result } = renderHook(() => useChatLimits(true));

        // Should not throw — limits stay null
        await vi.waitFor(() => {
            expect(result.current.limits).toBeNull();
        });
    });
});
