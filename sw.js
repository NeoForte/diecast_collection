const CACHE = 'pocket64-v5.0.0'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=5.0.0',
  './app.js?v=5.0.0',
  './showcase-sync.js?v=5.0.0',
  './manifest.webmanifest?v=5.0.0',
  './jszip.min.js?v=5.0.0',
  './black-brick-wall.svg',
  './icon-192.png',
  './icon-512.png',
  './pocket64-speedline-v251.png',
  './pocket64-empty-slot.jpg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE && !key.startsWith(PRIVATE_PHOTO_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
