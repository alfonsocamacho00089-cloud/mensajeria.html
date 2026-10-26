const CACHE_NAME = 'spacechat-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/logo.webp',
  './assets/logo-nuevo.png'
];

// Instalación del Service Worker y guardado en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Interceptar peticiones para servir desde la caché cuando no hay internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
