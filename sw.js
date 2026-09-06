const CACHE = 'pocket64-shell-v9'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const CORE_ASSET_NAMES = new Set([
  'index.html',
  'styles.css',
  'app.js',
  'showcase-sync.js',
  'p64-v525-patch.js',
  'p64-v531-viewer.js',
  'p64-v538-set-flow.js',
  'p64-v606-cleanup.js',
  'p64-v609-set-ui.js',
  'manifest.webmanifest',
  'jszip.min.js',
  'version.json',
])

async function fetchFresh(url) {
  return fetch(url, { cache: 'no-store' })
}

async function currentVersion() {
  try {
    const url = new URL('./version.json', self.registration.scope)
    url.searchParams.set('_', Date.now().toString())
    const response = await fetchFresh(url)
    if (!response.ok) throw new Error(`version.json ${response.status}`)
    const data = await response.json()
    return String(data?.version || '').trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

async function latestCoreResponse(request) {
  const requestUrl = new URL(request.url)
  const cleanUrl = new URL(requestUrl.pathname, self.registration.scope)
  cleanUrl.search = ''
  cleanUrl.searchParams.set('_', Date.now().toString())

  const response = await fetchFresh(cleanUrl)
  if (!response.ok) return response

  const filename = requestUrl.pathname.split('/').pop() || 'index.html'
  const isNavigation = request.mode === 'navigate'

  if (requestUrl.pathname.endsWith('/app.js')) {
    const version = await currentVersion()
    const text = await response.text()
    const patched = text.replace(
      /const APP_VERSION = ['\"][^'\"]+['\"]/, 
      `const APP_VERSION = '${version}'`
    )
    return new Response(patched, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }

  if (isNavigation || filename === 'index.html') {
    const version = await currentVersion()
    let text = await response.text()

    text = text.replace(/(styles\.css|jszip\.min\.js|showcase-sync\.js|p64-v525-patch\.js|app\.js)\?v=[^\"']+/g, `$1?v=${version}`)

    if (!text.includes('p64-v531-viewer.js')) {
      text = text.replace(
        /(<script\s+type=["']module["']\s+src=["']app\.js\?v=[^"']+["']><\/script>)/,
        `<script src="p64-v531-viewer.js?v=${version}"></script>\n  $1`
      )
    }

    if (!text.includes('p64-v538-set-flow.js')) {
      text = text.replace(
        /(<script\s+type=["']module["']\s+src=["']app\.js\?v=[^"']+["']><\/script>)/,
        `<script src="p64-v538-set-flow.js?v=${version}"></script>\n  $1`
      )
    }

    if (!text.includes('p64-v606-cleanup.js')) {
      text = text.replace(
        /(<script\s+type=["']module["']\s+src=["']app\.js\?v=[^"']+["']><\/script>)/,
        `<script src="p64-v606-cleanup.js?v=${version}"></script>\n  $1`
      )
    }

    if (!text.includes('p64-v609-set-ui.js')) {
      text = text.replace(
        /(<script\s+type=["']module["']\s+src=["']app\.js\?v=[^"']+["']><\/script>)/,
        `$1\n  <script src="p64-v609-set-ui.js?v=${version}"></script>`
      )
    }

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => !key.startsWith(PRIVATE_PHOTO_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )),
      self.clients.claim(),
    ])

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(clients.map(async (client) => {
      try {
        const url = new URL(client.url)
        if (url.origin === self.location.origin) await client.navigate(client.url)
      } catch {}
    }))
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  const filename = url.pathname.split('/').pop() || 'index.html'
  const isNavigation = event.request.mode === 'navigate'
  const isCoreAsset = CORE_ASSET_NAMES.has(filename)

  if (isNavigation || isCoreAsset) {
    event.respondWith(
      latestCoreResponse(event.request).catch(() => fetch(event.request))
    )
    return
  }

  event.respondWith(fetch(event.request))
})
