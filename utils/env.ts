/**
 * Environment variable validation.
 * Fails fast at startup if critical variables are missing.
 */

function requireEnv(name: string): string {
    const value = import.meta.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. ` +
            `Check your .env file or deployment configuration.`
        );
    }
    return value;
}

/**
 * Validated environment variables.
 * Import this instead of accessing import.meta.env directly.
 */
export const ENV = {
    TURNSTILE_SITE_KEY: requireEnv('VITE_TURNSTILE_SITE_KEY'),
} as const;
