const CACHE = 'diecast-app-v31'
const ASSETS = ['./', './index.html', './styles.css?v=31', './app.js?v=31', './manifest.webmanifest?v=31', './jszip.min.js?v=31', './black-brick-wall.svg', './icon-192.png', './icon-512.png', './pocket64-banner.png']

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
