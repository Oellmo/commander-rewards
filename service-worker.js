const CACHE_NAME = 'commander-rewards-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json',
  '/path/to/icon-192x192.png',
  'https://fonts.googleapis.com/css2?display=swap&family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Noto+Sans:wght@400;500;700;900',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  'https://cdn.tailwindcss.com?plugins=forms,container-queries'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});