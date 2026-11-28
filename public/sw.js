const CACHE_VERSION = 'snaptools-offline-v2';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/tools-index.json',
  '/pdf.worker.min.mjs',
  '/arcade',
  '/directory',
  '/tools/image-compressor-lossy-lossless',
  '/tools/pdf-compressor-target-kb',
  '/tools/indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla',
  '/tools/indian-income-tax-calculator-new-vs-old-regime',
  '/tools/home-loan-emi-calculator',
  '/tools/mutual-fund-sip-calculator',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for static assets, chunks, JSON index & worker
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.wasm')
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            if (resp && resp.status === 200) {
              const copy = resp.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
            }
            return resp;
          })
      )
    );
    return;
  }

  // Network-first with automatic cache fallback for pages (/tools/*, /studio/*, /)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Stale-while-revalidate for remaining same-origin requests
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
