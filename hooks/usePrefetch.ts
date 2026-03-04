import { useCallback } from 'react';

// Map route prefixes to their lazy-loaded chunk imports.
// These match the React.lazy() calls in App.tsx.
const ROUTE_MODULES: Record<string, () => Promise<unknown>> = {
    '/claim': () => import('../views/SubscriptionFlow'),
    '/course': () => import('../views/CourseFlow'),
    '/guides': () => import('../views/GuidesView'),
    '/simulator': () => import('../views/SimulatorView'),
    '/radar': () => import('../views/RadarView'),
    '/faq': () => import('../views/FaqView'),
};

const prefetched = new Set<string>();

/**
 * Returns an onMouseEnter handler that prefetches the chunk
 * for a given route on first hover. Subsequent hovers are a no-op.
 */
export function usePrefetch() {
    return useCallback((path: string) => {
        if (prefetched.has(path)) return;
        const loader = ROUTE_MODULES[path];
        if (loader) {
            prefetched.add(path);
            loader(); // fire-and-forget — the browser caches the chunk
        }
    }, []);
}
