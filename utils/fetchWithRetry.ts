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
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429 || response.status >= 500) {
                throw new ApiError(response.status, `Server returned ${response.status}`);
            }

            return response;

        } catch (error: unknown) {
            const isApiErrorToRetry = error instanceof ApiError && (error.status === 429 || error.status >= 500);
            const isNetworkError = error instanceof TypeError;

            // In Node/Vitest environments, instanceof DOMException can sometimes fail depending on globals.
            // Even if it's a raw object, checking err?.name === 'AbortError' is safer and covers browser DOMException too.
            const isAbortError = error instanceof Error && error.name === 'AbortError';

            if (isAbortError) {
                throw error;
            }

            if (!isApiErrorToRetry && !isNetworkError) {
                throw error;
            }

            if (import.meta.env.DEV) console.warn(`[API] fetchWithRetry attempt ${attempt + 1}/${maxRetries} failed:`, error instanceof Error ? error.message : error);

            if (attempt + 1 >= maxRetries) {
                throw new ApiError(503, 'Удаленный сервер перегружен (ошибка 429/500). Попробуйте сгенерировать претензию через минуту.');
            }

            // Exponential backoff: 1s -> 2s
            await sleep(baseDelayMs * Math.pow(2, attempt));
        }
    }
}
