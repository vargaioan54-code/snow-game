// Snow Game — Service Worker
// Strategy: cache-first for same-origin static assets, network fallback,
// offline fallback la /index.html. Versionat pentru invalidare la update.

const CACHE_VERSION = 'snow-game-v30';
const OFFLINE_FALLBACK = './index.html';

// Precache: doar index.html + manifest + icons.
// JS modules sunt cache-uite runtime la primul fetch (au cache-buster ?v=28 în URL).
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable-192.svg',
  './icons/icon-maskable-512.svg',
  './icons/apple-touch-icon.svg',
  './css/ui.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE).catch((err) => {
        // Nu fail install dacă un asset lipsește
        console.warn('[sw] precache partial', err);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Doar same-origin
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    // Cache-first pentru assets (js/, css/, icons/, index, manifest)
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) {
      // Refresh in background (stale-while-revalidate lite)
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(req, fresh.clone());
          }
        } catch {}
      })());
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (err) {
      // Offline fallback pentru navigație
      if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        const fallback = await caches.match(OFFLINE_FALLBACK);
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});

// Permite update manual dintr-o pagină
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
