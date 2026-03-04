import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from './fetchWithRetry';
import { ApiError } from './errors';

describe('fetchWithRetry', () => {
    const mockUrl = 'https://api.example.com/data';

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return response immediately on success (200 OK)', async () => {
        const mockResponse = { status: 200, ok: true, json: () => Promise.resolve({ data: 'ok' }) };
        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const response = await fetchWithRetry(mockUrl, {});

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(response).toBe(mockResponse);
    });

    it('should return response immediately on client error (400 Bad Request)', async () => {
        const mockResponse = { status: 400, ok: false, json: () => Promise.resolve({ error: 'bad' }) };
        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const response = await fetchWithRetry(mockUrl, {});

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(response).toBe(mockResponse);
    });

    it('should retry on server error (500) and succeed if subsequent request works', async () => {
        const mockErrorResponse = { status: 500, ok: false };
        const mockSuccessResponse = { status: 200, ok: true };

        (global.fetch as any)
            .mockResolvedValueOnce(mockErrorResponse) // Attempt 1 fails
            .mockResolvedValueOnce(mockSuccessResponse); // Attempt 2 succeeds

        const response = await fetchWithRetry(mockUrl, {}, { baseDelayMs: 1 }); // tiny delay

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(response).toBe(mockSuccessResponse);
    });

    it('should retry on rate limit (429) and eventually throw ApiError if max retries reached', async () => {
        const mockErrorResponse = { status: 429, ok: false };

        (global.fetch as any).mockResolvedValue(mockErrorResponse); // Always fails

        await expect(fetchWithRetry(mockUrl, {}, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow(ApiError);
        await expect(fetchWithRetry(mockUrl, {}, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow('Удаленный сервер перегружен (ошибка 429/500). Попробуйте сгенерировать претензию через минуту.');

        // 3 total attempts
        expect(global.fetch).toHaveBeenCalledTimes(6); // 3 per each expect, total 6 times
    });

    it('should immediately throw non-retryable ApiError thrown from within', async () => {
        // This is a test for code coverage. Sometimes internal methods throw ApiError(400).
        // fetchWithRetry catches and checks if isApiErrorToRetry
        const errorToThrow = new ApiError(403, 'Forbidden');
        (global.fetch as any).mockRejectedValueOnce(errorToThrow);

        await expect(fetchWithRetry(mockUrl, {}, {})).rejects.toThrow(ApiError);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should immediately throw DOMException AbortError on request cancellation', async () => {
        // Create an actual DOMException
        const abortError = new DOMException('The user aborted a request.', 'AbortError');
        (global.fetch as any).mockRejectedValue(abortError);

        await expect(fetchWithRetry(mockUrl, {})).rejects.toThrow(DOMException);
        await expect(fetchWithRetry(mockUrl, {})).rejects.toThrow('The user aborted a request.');
        expect(global.fetch).toHaveBeenCalledTimes(2); // one for each expect
    });

    it('should retry on network error (TypeError) and eventually fail', async () => {
        const networkError = new TypeError('Failed to fetch');
        (global.fetch as any).mockRejectedValue(networkError);

        await expect(fetchWithRetry(mockUrl, {}, { maxRetries: 2, baseDelayMs: 1 })).rejects.toThrow(ApiError);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
