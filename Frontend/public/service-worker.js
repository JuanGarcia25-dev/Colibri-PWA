const CACHE_VERSION = "v3";
const STATIC_CACHE = `colibri-static-${CACHE_VERSION}`;
const NAVIGATION_CACHE = `colibri-navigation-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/Logo.png",
  "/icons/Logo-192.png",
  "/icons/Logo-512.png",
];

function isSuccessful(response) {
  return response && response.ok;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, NAVIGATION_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Always fetch the latest app shell from the network when possible.
  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(
      fetch("/")
        .then((response) => {
          if (isSuccessful(response)) {
            const copy = response.clone();
            caches.open(NAVIGATION_CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          return (
            cached ||
            new Response("App shell unavailable", {
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        })
    );
    return;
  }

  // Do not cache the service worker file itself.
  if (url.pathname === "/service-worker.js") {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first only for versioned build assets and static icons/manifest.
  const isVersionedAsset = url.origin === self.location.origin && url.pathname.startsWith("/assets/");
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);

  if (isVersionedAsset || isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (isSuccessful(response)) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default to network-first for API requests and other runtime resources.
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => {
        const cached = await caches.match(request);
        return (
          cached ||
          new Response("Network error", {
            status: 503,
            statusText: "Service Unavailable",
          })
        );
      })
  );
});
