import { createHmac } from 'node:crypto';

/**
 * Hashes an IP address using HMAC-SHA-256 with a secret key.
 * Returns the first 16 hex characters (64 bits) for anonymized identification.
 *
 * HMAC prevents rainbow-table attacks against the ~4.3B IPv4 address space.
 * The real IP is still used for rate limiting (Redis keys) but never exposed externally.
 */
export function hashIp(ip: string): string {
    const secret = process.env.IP_HASH_SECRET || 'chestnaya-podpiska-dev-fallback';
    return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 16);
}
