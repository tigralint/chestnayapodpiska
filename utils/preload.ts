/**
 * Predictive Preloading Utility
 * Triggers lazy-load imports for routes when the user is likely to click.
 */

// Map of route paths to their dynamic import functions
const routeImports: Record<string, () => Promise<any>> = {
    '/claim': () => import('../views/SubscriptionFlow'),
    '/course': () => import('../views/CourseFlow'),
    '/guides': () => import('../views/GuidesView'),
    '/simulator': () => import('../views/SimulatorView'),
    '/radar': () => import('../views/RadarView'),
    '/faq': () => import('../views/FaqView'),
};

const preloadedPaths = new Set<string>();

/**
 * Preloads the chunk for a given path if it hasn't been preloaded yet.
 */
export const preloadRoute = (path: string) => {
    // Extract base path (e.g., /claim/netflix -> /claim)
    const basePath = path.split('/').filter(Boolean)[0] ? `/${path.split('/').filter(Boolean)[0]}` : '/';

    if (routeImports[basePath] && !preloadedPaths.has(basePath)) {
        console.log(`[Predictive] Preloading route: ${basePath}`);
        routeImports[basePath]().catch(err => console.warn(`Preload failed for ${basePath}:`, err));
        preloadedPaths.add(basePath);
    }
};
