const CACHE_NAME = 'colibri-cache-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/Logo.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Optionally cache new GET requests
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(async () => {
          const fallback = await caches.match('/index.html');
          return (
            fallback ||
            new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          );
        });
    })
  );
});
