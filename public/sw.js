const CACHE_NAME = 'splitfun-v2';

// Install event - only cache the shell (index.html), not app routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add('/');
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests - never intercept
  if (request.method !== 'GET') return;

  // Skip cross-origin requests - only handle same-origin
  if (url.origin !== self.location.origin) return;

  // API requests: always go to network, never serve from cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Navigation requests (HTML pages): network first, fallback to index.html shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve the cached shell
          return caches.match('/');
        })
    );
    return;
  }

  // Static assets (js, css, fonts, images): cache first, then network
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: network only
  event.respondWith(
    fetch(request).catch(() => new Response('', { status: 503 }))
  );
});
