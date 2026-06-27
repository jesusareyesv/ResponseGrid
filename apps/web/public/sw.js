/**
 * ReliefHub Service Worker — pragmatic offline support.
 *
 * Strategy:
 *  - Navigation requests: network-first with offline-page fallback.
 *  - Static assets (/_next/static/, /icons/, common extensions):
 *      cache-first (immutable hashed filenames from Next.js build).
 *  - API and backend calls: network-only (never cache; never intercept).
 *
 * Offline submit queue is intentionally NOT implemented in this version.
 * See .superpowers/sdd/f5d-pwa-report.md for future work notes.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `reliefhub-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `reliefhub-static-${CACHE_VERSION}`;

/** URLs to precache as the app shell. */
const SHELL_URLS = [
  '/',
  '/offline',
];

/** URL prefixes / patterns that must never be intercepted. */
function isApiCall(url) {
  const { pathname, hostname } = new URL(url);
  // Backend API calls (different origin or /api prefix)
  if (hostname !== self.location.hostname) return true;
  if (pathname.startsWith('/api/')) return true;
  return false;
}

/** True for Next.js hashed static assets and icon files. */
function isStaticAsset(url) {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf)$/.test(pathname)
  );
}

// ---------- Install ----------

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {
      // Silently continue if precache fails (e.g. offline during install)
    }),
  );
});

// ---------- Activate ----------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ---------- Fetch ----------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; never intercept non-GET (forms POST/PUT/DELETE go straight to network)
  if (request.method !== 'GET') return;

  // Never intercept API / backend calls
  if (isApiCall(request.url)) return;

  // Static assets: cache-first
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        }),
      ),
    );
    return;
  }

  // Navigation requests: network-first → offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Opportunistically update shell cache on successful navigation
          if (res.ok) {
            caches.open(SHELL_CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ??
              caches.match('/offline') ??
              new Response('Sin conexión', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              }),
          ),
        ),
    );
    return;
  }

  // Other GET requests: network-first, no fallback (let them fail naturally)
});
