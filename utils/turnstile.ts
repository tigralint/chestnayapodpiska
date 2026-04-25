/** Cloudflare Turnstile siteverify API response shape. */
export interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

/** Default timeout for Turnstile verification requests (ms). */
export const TURNSTILE_TIMEOUT_MS = 8_000;
