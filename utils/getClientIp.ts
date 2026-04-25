import type { VercelRequest } from '@vercel/node';

/**
 * Extracts the client IP from request headers.
 * Prefers Vercel's trusted `x-vercel-forwarded-for` header (cannot be spoofed by client)
 * over the standard `x-forwarded-for` (spoofable).
 *
 * Works with both VercelRequest (Node.js runtime) and Web Request (Edge runtime).
 */
export function getClientIp(request: VercelRequest): string {
    return (request.headers['x-vercel-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? 'unknown';
}

/**
 * Edge-runtime variant that works with the standard Web Request API.
 */
export function getClientIpEdge(request: Request): string {
    return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? 'unknown';
}
