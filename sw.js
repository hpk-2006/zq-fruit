// Service Worker for 志强果业167号 - Offline billing tool
const CACHE_VERSION = 3;
const CACHE_NAME = 'zqgy-v' + CACHE_VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install — cache static assets (network first, fallback to install-time cache)
self.addEventListener('install', (e) => {
  console.log('[SW v' + CACHE_VERSION + '] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v' + CACHE_VERSION + '] Caching static assets');
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('[SW v' + CACHE_VERSION + '] Cache addAll failed, continuing:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches aggressively
self.addEventListener('activate', (e) => {
  console.log('[SW v' + CACHE_VERSION + '] Activating, clearing old caches...');
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW v' + CACHE_VERSION + '] Removing old cache:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch — network first for HTML, cache first for static assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isNavigation = e.request.mode === 'navigate';
  const isHtml = isNavigation || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

  // Network-first for HTML pages (always try to get latest)
  if (isHtml) {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(e.request, clone)
          );
        }
        return response;
      }).catch(() => {
        // Offline — return cached page
        return caches.match(e.request).then((cached) =>
          cached || caches.match('./index.html')
        );
      })
    );
    return;
  }

  // Cache-first for static assets (icon, manifest, etc.)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        // Background refresh
        fetch(e.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(e.request, response)
            );
          }
        }).catch(() => {});
        return cached;
      }
      // Network with cache fallback
      return fetch(e.request).then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(e.request, clone)
        );
        return response;
      }).catch(() => {
        return caches.match(e.request);
      });
    })
  );
});
