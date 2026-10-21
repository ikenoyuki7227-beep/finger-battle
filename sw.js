/* FINGER BATTLE PWA: network-first to prevent stale releases. */
const CACHE = 'finger-battle-pwa-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(path => cache.add(new Request(path, {cache:'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('finger-battle-pwa-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(req, {cache:'no-store'});
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, {ignoreSearch:true});
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
