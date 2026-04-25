// utils/fetchWithRetry.ts
import { ApiError } from './errors';

interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrapper over standard fetch that implements Exponential Backoff.
 * Only retries on 429, 5xx status codes, and network errors.
 */
export async function fetchWithRetry(url: string, options: RequestInit, retryOptions: RetryOptions = {}): Promise<Response> {
    const { maxRetries = 3, baseDelayMs = 1000 } = retryOptions;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(url, options);

            // If Rate Limited or Server Error, throw ApiError to trigger retry
            if (response.status === 429 || response.status >= 500) {
                throw new ApiError(response.status, `Server returned ${response.status}`);
            }

            // For successful or 400-level client errors, return immediately
            return response;

        } catch (error: unknown) {
            // Check if it's a retryable error
            const isApiErrorToRetry = error instanceof ApiError && (error.status === 429 || error.status >= 500);

            // fetch throws TypeError on network failure (e.g. CORS, offline)
            const isNetworkError = error instanceof TypeError;

            // In Node/Vitest environments, instanceof DOMException can sometimes fail depending on globals.
            // Even if it's a raw object, checking err?.name === 'AbortError' is safer and covers browser DOMException too.
            const isAbortError = error instanceof Error && error.name === 'AbortError';

            if (isAbortError) {
                // Never retry explicitly aborted requests. This comes before other checks
                // because AbortError is a DOMException, not a TypeError or ApiError.
                throw error;
            }

            if (!isApiErrorToRetry && !isNetworkError) {
                // If it's a known non-retryable error (like a 400 ApiError or a local logic Error), break the loop
                throw error;
            }

            attempt++;
            if (import.meta.env.DEV) console.warn(`[API] fetchWithRetry attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : error);

            if (attempt >= maxRetries) {
                throw new ApiError(503, 'Удаленный сервер перегружен (ошибка 429/500). Попробуйте сгенерировать претензию через минуту.');
            }

            // Exponential backoff: 1s -> 2s
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }

    throw new Error('fetchWithRetry failed unexpectedly.');
}
