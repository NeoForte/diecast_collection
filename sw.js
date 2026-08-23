const CACHE = 'diecast-app-v22'
const ASSETS = ['./', './index.html', './styles.css?v=22', './app.js?v=22', './manifest.webmanifest?v=22', './jszip.min.js?v=22', './black-brick-wall.svg', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
