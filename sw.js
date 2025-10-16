// Cache base dei file principali per PWA (offline)
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open('crm-haccp-v2').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './script.js',
        './manifest.json'
      ]);
    })
  );
});
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});
