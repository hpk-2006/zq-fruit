// Service Worker for 志强果业167号 - Offline billing tool
const CACHE_NAME = 'zqgy-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install — cache everything
self.addEventListener('install', (e) => {
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching all assets');
      return cache.addAll(ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch — cache first, then network fallback
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached response immediately
      if (cached) {
        // Fetch update in background
        fetch(e.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(e.request, response)
            );
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache — fetch from network
      return fetch(e.request).then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(e.request, clone)
        );
        return response;
      }).catch(() => {
        // Offline fallback — return the main HTML page for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
