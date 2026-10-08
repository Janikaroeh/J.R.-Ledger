// J.R. Ledger – Offline-App-Shell. Keine Finanzdaten im Cache ablegen.
const CACHE = 'jr-ledger-shell-v1';
const SHELL = ['./', './index.html'];
const SDK = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    await Promise.all(SDK.map(url => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('jr-ledger-shell-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  const sdk = SDK.includes(url.href);
  if(!own && !sdk) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(sdk) return (await cache.match(req)) || fetch(req);
    try {
      const response = await fetch(req);
      if(response.ok) await cache.put(req, response.clone());
      return response;
    } catch(e) {
      return (await cache.match(req)) || Response.error();
    }
  })());
});
