const CACHE = 'pocket64-v3.2.8'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = ['./', './index.html', './styles.css?v=3.2.8', './app.js?v=3.2.8', './showcase-sync.js?v=3.2.8', './manifest.webmanifest?v=3.2.8', './jszip.min.js?v=3.2.8', './black-brick-wall.svg', './icon-192.png', './icon-512.png', './pocket64-speedline-v251.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && !k.startsWith(PRIVATE_PHOTO_CACHE_PREFIX)).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
