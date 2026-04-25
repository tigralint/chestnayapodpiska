// This file is intentionally minimal.
// VitePWA plugin (workbox) generates the production service worker in dist/.
// This file exists only to prevent 404 errors during local development
// when the browser tries to fetch /sw.js from a previous registration.

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Clean up any caches from the old custom SW
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k.startsWith('chestnaya-podpiska')).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});
