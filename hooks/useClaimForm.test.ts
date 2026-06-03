import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClaimForm } from './useClaimForm';

// Mock clipboard utility
vi.mock('../utils/clipboard', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve(true)),
}));

interface TestData {
    name: string;
    turnstileToken?: string;
}

const initialData: TestData = { name: '', turnstileToken: undefined };

const successGenerate = vi.fn((_data: TestData) => Promise.resolve('Generated text'));
const failGenerate = vi.fn((_data: TestData) => Promise.reject(new Error('API Error')));

const noErrors = (_data: TestData) => ({});
const withErrors = (_data: TestData) => ({ name: 'Обязательное поле' });

beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
});

describe('useClaimForm', () => {
    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        expect(result.current.data).toEqual(initialData);
        expect(result.current.isGenerating).toBe(false);
        expect(result.current.result).toBe('');
        expect(result.current.copied).toBe(false);
        expect(result.current.apiError).toBe('');
        expect(result.current.fieldErrors).toEqual({});
    });

    it('updates data via setData', () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        act(() => {
            result.current.setData({ name: 'Test', turnstileToken: 'abc' });
        });
        expect(result.current.data.name).toBe('Test');
    });

    it('sets field errors and does not call generate when validation fails', async () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, withErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.fieldErrors).toEqual({ name: 'Обязательное поле' });
        expect(successGenerate).not.toHaveBeenCalled();
    });

    it('clears field errors via clearFieldError', async () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, withErrors));
        // Trigger validation
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.fieldErrors.name).toBe('Обязательное поле');

        // Clear error
        act(() => {
            result.current.clearFieldError('name');
        });
        expect(result.current.fieldErrors.name).toBe('');
    });

    it('calls generateFn and sets result on success', async () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(successGenerate).toHaveBeenCalledWith(initialData, expect.any(AbortSignal));
        expect(result.current.result).toBe('Generated text');
        expect(result.current.isGenerating).toBe(false);
    });

    it('sets apiError on generate failure', async () => {
        const { result } = renderHook(() => useClaimForm(initialData, failGenerate, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.apiError).toBe('API Error');
        expect(result.current.result).toBe('');
    });

    it('sets default apiError on generate failure with non-Error object', async () => {
        const failGenerateNonError = vi.fn((_data: TestData) => Promise.reject('String Error'));
        const { result } = renderHook(() => useClaimForm(initialData, failGenerateNonError, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.apiError).toBe(
            'Произошла ошибка при генерации документа. Пожалуйста, попробуйте еще раз.'
        );
        expect(result.current.result).toBe('');
    });

    it('silently ignores AbortError and does not set apiError', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        const failGenerateAbort = vi.fn((_data: TestData) => Promise.reject(abortError));
        const { result } = renderHook(() => useClaimForm(initialData, failGenerateAbort, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.apiError).toBe('');
    });

    it('scrolls to top on mobile during generate failure', async () => {
        const originalInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
        const { result } = renderHook(() => useClaimForm(initialData, failGenerate, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        // One call for starting generation, one for catching error
        expect(window.scrollTo).toHaveBeenCalledTimes(2);
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

        // Restore
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    });

    it('resets turnstileToken after generation', async () => {
        const dataWithToken: TestData = { name: 'Test', turnstileToken: 'token123' };
        const { result } = renderHook(() => useClaimForm(dataWithToken, successGenerate, noErrors));

        await act(async () => {
            result.current.setData({ name: 'Test', turnstileToken: 'token123' });
        });

        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(result.current.data.turnstileToken).toBeUndefined();
    });

    it('calls onAfterGenerate callback', async () => {
        const onAfter = vi.fn();
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        await act(async () => {
            await result.current.handleGenerate(onAfter);
        });
        expect(onAfter).toHaveBeenCalledOnce();
    });

    it('handleCopy sets copied to true then false', async () => {
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        // Generate first to have result
        await act(async () => {
            await result.current.handleGenerate();
        });

        await act(async () => {
            await result.current.handleCopy();
        });
        expect(result.current.copied).toBe(true);
    });

    it('scrolls to top on mobile during generation', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
        const { result } = renderHook(() => useClaimForm(initialData, successGenerate, noErrors));
        await act(async () => {
            await result.current.handleGenerate();
        });
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
});
