// Cache básico para funcionar offline
const CACHE_NAME = 'finapp-cache-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
  ];
  self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(CACHE_NAME).then
        (cache => cache.addAll(FILES_TO_CACHE)));
        self.skipWaiting();
    });
    self.addEventListener('activate', evt => {
      evt.waitUntil(caches.keys().then(keys =>
        Promisse.all(keys.map(k= k!==CACHE_NAME && caches.delete(k)))
      ));
      self.clientes.claim();
    });
    self.addEventListener('fetch', evtm=> {
      evt.respondWith(caches.match(evt.request).
      then(resp =>resp || fetch(evt.request)));
    });


