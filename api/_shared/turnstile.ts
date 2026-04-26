import type { TurnstileVerifyResponse } from '../../utils/turnstile.js';
import { TURNSTILE_TIMEOUT_MS } from '../../utils/turnstile.js';

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Throws on network/timeout errors. Returns boolean for pass/fail.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('TURNSTILE_SECRET_KEY is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    });

    const res = await check.json() as TurnstileVerifyResponse;
    return res.success;
}
