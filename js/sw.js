const CACHE_NAME = 'spacechat-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/logo.webp',
  './assets/imagen-logo-nuevo.png?v=2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match('./index.html'))
  );
});
