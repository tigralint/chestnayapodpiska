import { createHash } from 'node:crypto';

/**
 * Hashes an IP address using SHA-256 and returns the first 12 hex characters.
 * Used to anonymize IPs before sending to Telegram notifications.
 * The real IP is still used for rate limiting (Redis keys) but never exposed externally.
 */
export function hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex').slice(0, 12);
}
