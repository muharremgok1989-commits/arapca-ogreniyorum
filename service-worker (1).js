const CACHE_NAME = 'arapca-ogreniyorum-v2';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  // addAll yerine her dosyayı ayrı ayrı denemek: biri 404 verse bile kurulum tamamen başarısız olmasın.
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ASSETS.map((a) => cache.add(a).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Sayfanın kendisi: ağdan dene, olmazsa (internet yoksa) önbellekten ver.
// Google Sheets/Apps Script çağrıları ağ gerektirdiği için bunlara dokunmuyoruz.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // dış istekleri (Apps Script) önbelleğe alma

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
