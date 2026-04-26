import { describe, it, expect } from 'vitest';
import { hashIp } from './hashIp';

describe('hashIp', () => {
    it('returns a 16-character hex string', () => {
        const result = hashIp('192.168.1.1');
        expect(result).toHaveLength(16);
        expect(result).toMatch(/^[a-f0-9]{16}$/);
    });

    it('produces consistent output for the same input', () => {
        expect(hashIp('10.0.0.1')).toBe(hashIp('10.0.0.1'));
    });

    it('produces different output for different IPs', () => {
        expect(hashIp('10.0.0.1')).not.toBe(hashIp('10.0.0.2'));
    });

    it('handles empty string', () => {
        const result = hashIp('');
        expect(result).toHaveLength(16);
        expect(result).toMatch(/^[a-f0-9]{16}$/);
    });

    it('handles IPv6 addresses', () => {
        const result = hashIp('::1');
        expect(result).toHaveLength(16);
        expect(result).toMatch(/^[a-f0-9]{16}$/);
    });

    it('does not return the original IP', () => {
        const ip = '192.168.1.1';
        expect(hashIp(ip)).not.toContain(ip);
    });
});

