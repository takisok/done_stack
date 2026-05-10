const CACHE_NAME = 'done-stack-pwa-v45';
const APP_SHELL = [
  './',
  './index.html',
  './about.html',
  './privacy.html',
  './history.html',
  './search.html',
  './settings.html',
  './LICENSE',
  './THIRD_PARTY_NOTICES.md',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/about.js',
  './js/drive-sync.js',
  './js/history.js',
  './js/i18n.js',
  './js/llm.js',
  './js/pwa.js',
  './js/search.js',
  './js/settings.js',
  './js/speech.js',
  './js/stars.js',
  './js/storage.js',
  './vendor/echarts/echarts.min.js',
  './vendor/echarts/LICENSE',
  './img/maid/maid-idle.png',
  './img/maid/maid-thinking.png',
  './img/maid/maid-talk-1.png',
  './img/maid/maid-talk-2.png',
  './img/mascot/keytan.png',
  './img/icons/icon-192.png',
  './img/icons/icon-512.png',
  './img/icons/maskable-512.png',
  './img/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
