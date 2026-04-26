import { describe, it, expect } from 'vitest';
import { getClientIp, getClientIpEdge } from './getClientIp';

describe('getClientIp (VercelRequest)', () => {
    function makeReq(headers: Record<string, string> = {}, remoteAddress?: string) {
        return {
            headers,
            socket: { remoteAddress },
        } as never;
    }

    it('prefers x-vercel-forwarded-for header', () => {
        const req = makeReq({
            'x-vercel-forwarded-for': '1.2.3.4, 5.6.7.8',
            'x-forwarded-for': '9.9.9.9',
        }, '127.0.0.1');
        expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('falls back to x-forwarded-for if x-vercel-forwarded-for is absent', () => {
        const req = makeReq({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }, '127.0.0.1');
        expect(getClientIp(req)).toBe('10.0.0.1');
    });

    it('falls back to socket.remoteAddress', () => {
        const req = makeReq({}, '192.168.1.1');
        expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('returns unknown when nothing is available', () => {
        const req = makeReq({});
        expect(getClientIp(req)).toBe('unknown');
    });

    it('trims whitespace from header values', () => {
        const req = makeReq({ 'x-vercel-forwarded-for': '  8.8.8.8  ' });
        expect(getClientIp(req)).toBe('8.8.8.8');
    });
});

describe('getClientIpEdge (Web Request)', () => {
    function makeEdgeReq(headers: Record<string, string> = {}) {
        return new Request('https://example.com', { headers });
    }

    it('prefers x-vercel-forwarded-for header', () => {
        const req = makeEdgeReq({
            'x-vercel-forwarded-for': '1.1.1.1',
            'x-forwarded-for': '2.2.2.2',
        });
        expect(getClientIpEdge(req)).toBe('1.1.1.1');
    });

    it('falls back to x-forwarded-for', () => {
        const req = makeEdgeReq({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' });
        expect(getClientIpEdge(req)).toBe('3.3.3.3');
    });

    it('returns unknown when no headers present', () => {
        const req = makeEdgeReq();
        expect(getClientIpEdge(req)).toBe('unknown');
    });

    it('handles multiple IPs in x-forwarded-for (picks first)', () => {
        const req = makeEdgeReq({ 'x-forwarded-for': '5.5.5.5, 6.6.6.6, 7.7.7.7' });
        expect(getClientIpEdge(req)).toBe('5.5.5.5');
    });
});
