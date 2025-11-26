
// Simple service worker: cache app shell and assets for offline usage.
// Cache versioning
const CACHE_NAME = 'allergen-app-v1';
const ASSETS = [
  '/Allergene/',
  '/Allergene/index.html',
  '/Allergene/app.js',
  '/Allergene/manifest.json',
  '/Allergene/icons/icon-192.png',
  '/Allergene/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(err=>console.warn('Cache addAll failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // navigation request: serve index.html (app shell)
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(()=> caches.match('/Allergene/index.html'))
    );
    return;
  }

  // try cache first, then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res=> {
      // cache fetched assets
      if(req.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    })).catch(()=>{})
  );
});
