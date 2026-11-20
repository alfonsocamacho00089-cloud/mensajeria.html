const CACHE_NAME = 'ysapay-offline-v19';
const FEED_CACHE_NAME = 'ysapay-feed-v19';
const MEDIA_CACHE_NAME = 'ysapay-media-v19';

const urlsToCache = [
  './',
  './index.html',
  './usuario.html',
  './drivtaxi.html',
  './comercios.html',
  './calculadoras.html',
  './pasajeros.html',
  './ysapayp2p.html',
  './drive.html',
  './manifest.json',
  './assets/imagen-logos-nuevos.png'
];

const MEDIA_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|avif|mp4|webm|mov|m4v)(\?.*)?$/i;

function esPeticionFeedInstanew(urlObj) {
  return urlObj.pathname.endsWith('/api/get-instanew-feed');
}

function esRecursoMedia(request, urlObj) {
  const destino = request.destination;
  if (destino === 'image' || destino === 'video') return true;
  return MEDIA_EXTENSIONS.test(urlObj.pathname + urlObj.search);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cachesVigentes = [CACHE_NAME, FEED_CACHE_NAME, MEDIA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cachesVigentes.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const urlObj = new URL(request.url);

  // 1. Feed Instanew: Network First con respaldo en caché dedicada
  if (esPeticionFeedInstanew(urlObj)) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheFeed = await caches.open(FEED_CACHE_NAME);
            await cacheFeed.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cacheFeed = await caches.open(FEED_CACHE_NAME);
          const cachedFeed = await cacheFeed.match(request);
          if (cachedFeed) return cachedFeed;

          return new Response(JSON.stringify({ ok: false, offline: true, posts: [] }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 2. Imágenes y videos: Cache First en caché de medios
  if (esRecursoMedia(request, urlObj)) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then(async (mediaCache) => {
        const cachedMedia = await mediaCache.match(request, { ignoreSearch: true });
        if (cachedMedia) {
          return cachedMedia;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            await mediaCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response('', { status: 504, statusText: 'Media offline' });
        }
      })
    );
    return;
  }

  // 3. Resto de peticiones GET (páginas y recursos generales)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
