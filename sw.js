const CACHE = 'pocket64-v2.5.9'
const ASSETS = ['./', './index.html', './styles.css?v=2.5.9', './app.js?v=2.5.9', './manifest.webmanifest?v=2.5.9', './jszip.min.js?v=2.5.9', './black-brick-wall.svg', './icon-192.png', './icon-512.png', './pocket64-speedline-v251.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && !k.startsWith('pocket64-private-photos-')).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
