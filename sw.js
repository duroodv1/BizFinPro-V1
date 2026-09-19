/* BizFinPro Service Worker — offline-first PWA */
const CACHE = 'bizfinpro-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/app.css',
  './js/i18n.js',
  './js/store.js',
  './js/formats.js',
  './js/engine.js',
  './js/render.js',
  './js/shariah.js',
  './js/charts.js',
  './js/export_xlsx.js',
  './js/export_pdf.js',
  './js/export_docx.js',
  './js/reports.js',
  './js/app.js',
  './js/vendor/xlsx.full.min.js',
  './js/vendor/jspdf.umd.min.js',
  './js/vendor/jszip.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // cache-first for static app assets, network-fallback for everything else
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg') || url.pathname === '/' || url.pathname.endsWith('index.html') || url.pathname.endsWith('.webmanifest'))) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request.url, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
