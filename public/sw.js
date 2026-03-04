const CACHE_NAME = 'chestnaya-podpiska-v1';

// Static assets to cache on install (app shell)
const APP_SHELL = [
    '/',
    '/index.html',
];

// Install — cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET and API/external requests
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline fallback — serve from cache
                return caches.match(event.request).then((cached) => {
                    // For navigation requests, serve the app shell
                    if (!cached && event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return cached;
                });
            })
    );
});
