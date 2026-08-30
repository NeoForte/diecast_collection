const CACHE = 'pocket64-v3.4.0'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = ['./', './index.html', './styles.css?v=3.4.0', './app.js?v=3.4.0', './showcase-sync.js?v=3.4.0', './manifest.webmanifest?v=3.4.0', './jszip.min.js?v=3.4.0', './black-brick-wall.svg', './icon-192.png', './icon-512.png', './pocket64-speedline-v251.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  // Deliberately do not skipWaiting(). A new Pocket 64 release should never
  // take over an already-open session that loaded the previous release.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE && !key.startsWith(PRIVATE_PHOTO_CACHE_PREFIX))
        .map((key) => caches.delete(key))
    ))
  )
  // Deliberately do not clients.claim(). Existing tabs finish on one code version;
  // the new worker controls the next clean launch/reload after activation.
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
