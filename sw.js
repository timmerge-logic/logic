// Logic: lets the installed app run with no internet.
// Always tries the network first, so players get updates; the saved copy is used when offline.
const CACHE = 'logic-v1';
const FILES = ['./', 'index.html', 'hebrew.html', 'manifest.webmanifest', 'manifest-he.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('.exe')) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' }).then(res => {
      if (res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy)));
      }
      return res;
    }).catch(() => caches.match(url.origin + url.pathname, { ignoreSearch: true })
      .then(hit => hit || caches.match(e.request.mode === 'navigate' ? 'index.html' : e.request, { ignoreSearch: true }))
      .then(hit => hit || Response.error()))
  );
});
