// My Gold Melting - Offline Service Worker (v3)
const CACHE_NAME = 'gold-melting-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './gold-melting-calculator',
  './jewellery-costing-calculator',
  './about',
  './faq',
  './privacy-policy',
  './gold-melting-calculator.html',
  './jewellery-costing-calculator.html',
  './about.html',
  './faq.html',
  './privacy-policy.html',
  './404.html',
  './manifest.json',
  './sitemap.xml',
  './rss.xml',
  './robots.txt',
  './llms.txt',
  './llms-full.txt',
  './css/style.css',
  './js/app.js',
  './js/calculator.js',
  './js/db.js',
  './js/i18n.js',
  './js/session.js',
  './assets/images/ic_launcher.png',
  './assets/images/dashboard.png',
  './assets/images/dashboard_background.png',
  './assets/images/line_about.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback to index if navigating
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
