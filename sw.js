const CACHE = 'pocket64-v4.2.2'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=4.2.2',
  './app.js?v=4.2.2',
  './showcase-sync.js?v=4.2.2',
  './manifest.webmanifest?v=4.2.2',
  './jszip.min.js?v=4.2.2',
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

  const url = new URL(event.request.url)

  if (url.pathname.endsWith('/showcase-sync.js')) {
    event.respondWith(
      fetch('./showcase-sync.js?v=4.2.2', { cache:'no-store' })
        .catch(() => caches.match('./showcase-sync.js?v=4.2.2'))
    )
    return
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
