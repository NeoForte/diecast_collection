const CACHE = 'pocket64-v4.2.3-setedit7'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=4.2.3',
  './showcase-sync.js?v=4.2.3',
  './manifest.webmanifest?v=4.2.3',
  './jszip.min.js?v=4.2.3',
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


async function patchedIndexResponse(request) {
  try {
    const response = await fetch(request, { cache:'no-store' })
    if (!response.ok) return response
    let html = await response.text()
    html = html.replaceAll('Version 4.2.2', 'Version 4.2.3')
    html = html.replaceAll('?v=4.2.2', '?v=4.2.3')
    const headers = new Headers(response.headers)
    headers.set('content-type', 'text/html; charset=utf-8')
    headers.delete('content-length')
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return caches.match('./index.html') || caches.match('./')
  }
}

async function patchedAppResponse(request) {
  try {
    const response = await fetch(request, { cache:'no-store' })
    if (!response.ok) return response

    let source = await response.text()

    source = source.replace(
      /const\s+APP_VERSION\s*=\s*['"]4\.2\.2['"]/,
      "const APP_VERSION = '4.2.3'"
    )
    source = source.replaceAll('Version 4.2.2', 'Version 4.2.3')
    source = source.replace(
      "queueMicrotask(() => document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = `Version ${APP_VERSION}` }))",
      "queueMicrotask(() => document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = 'Version 4.2.3' }))"
    )
    source += `
setTimeout(() => {
  document.querySelectorAll('.version-badge').forEach((el) => {
    el.textContent = 'Version 4.2.3'
  })
}, 0)
`
    source = source.replace(
      "navigator.serviceWorker.register('./sw.js?v=4.2.2', { updateViaCache:'none' })",
      "navigator.serviceWorker.register('./sw.js?v=4.2.3', { updateViaCache:'none' })"
    )

    source = source.replace(
      "function editOpenSet() {",
      `function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function editOpenSet() {`
    )

    source = source.replace(
      "const isVerificationReturn = startupUrl.searchParams.get('verified') === '1'",
      "let isVerificationReturn = startupUrl.searchParams.get('verified') === '1'"
    )
    source = source.replace(
      "clearAuthRedirectUrl()\n  if (verifiedEmail)",
      "clearAuthRedirectUrl()\n  isVerificationReturn = false\n  if (verifiedEmail)"
    )

    source = source.replace(
      "let removePhoto2 = false\nlet removePhoto3 = false",
      "let removePhoto1 = false\nlet removePhoto2 = false\nlet removePhoto3 = false"
    )
    source = source.replace(
      "  selectedPhotoFile3 = null\n  removePhoto2 = false\n  removePhoto3 = false",
      "  selectedPhotoFile3 = null\n  removePhoto1 = false\n  removePhoto2 = false\n  removePhoto3 = false"
    )
    source = source.replace(
      "function syncMainPhotoControls(present) {\n  $('photo1-replace')?.classList.toggle('hidden', !present)\n}",
      `const mainPhotoRemoveButton = (() => {
  const picker = document.querySelector('.photo-picker')
  if (!picker) return null
  let button = $('photo1-remove')
  if (!button) {
    button = document.createElement('button')
    button.id = 'photo1-remove'
    button.className = 'photo-main-remove hidden'
    button.type = 'button'
    button.textContent = '🗑'
    button.setAttribute('aria-label', 'Delete main photo')
    button.title = 'Delete main photo'
    picker.append(button)
  }
  return button
})()

const photoFixStyle = document.createElement('style')
photoFixStyle.textContent = \`
  .photo-main-remove {
    position:absolute; right:58px; top:12px; z-index:20;
    width:40px; height:40px; padding:0;
    display:grid; place-items:center;
    border:1px solid rgba(255,120,120,.72); border-radius:999px;
    background:rgba(20,4,4,.92); color:#ffb4b4;
    font-size:18px; line-height:1; font-weight:700;
    backdrop-filter:blur(8px); box-shadow:0 2px 10px rgba(0,0,0,.45);
  }
  .photo-viewer-close {
    top:calc(env(safe-area-inset-top) + 16px) !important;
    right:max(16px, env(safe-area-inset-right)) !important;
    width:48px !important; height:48px !important; min-width:48px !important;
    z-index:1005 !important; font-size:30px !important; line-height:1 !important;
    display:grid !important; place-items:center !important;
  }
  .set-detail-actions {
    display:flex !important;
    align-items:center !important;
    justify-content:flex-end !important;
    position:relative !important;
  }
  .set-more-button {
    width:48px !important;
    height:48px !important;
    min-width:48px !important;
  }
  .set-more-menu {
    position:absolute !important;
    right:0 !important;
    top:calc(100% + 8px) !important;
    z-index:50 !important;
  }
\`
document.head.append(photoFixStyle)

function syncMainPhotoControls(present) {
  $('photo1-replace')?.classList.toggle('hidden', !present)
  mainPhotoRemoveButton?.classList.toggle('hidden', !present)
}

const syncMainDeleteFromPreview = () => {
  const present = Boolean(photoPreview?.src) && !photoPreview?.classList.contains('hidden')
  mainPhotoRemoveButton?.classList.toggle('hidden', !present)
}
if (photoPreview) {
  new MutationObserver(syncMainDeleteFromPreview).observe(photoPreview, { attributes:true, attributeFilter:['src','class'] })
  queueMicrotask(syncMainDeleteFromPreview)
}`
    )
    source = source.replace(
      "function useSelectedPhotoFile(file) {\n  selectedPhotoFile = file ?? null\n  if (!selectedPhotoFile) return",
      "function useSelectedPhotoFile(file) {\n  selectedPhotoFile = file ?? null\n  if (!selectedPhotoFile) return\n  removePhoto1 = false"
    )
    source = source.replace(
      "    if (selectedPhotoFile) {",
      `    if (removePhoto1 && editingCar?.photo_path && !selectedPhotoFile) {
      const oldPhotoPath = editingCar.photo_path
      const nextUpdatedAt = new Date().toISOString()
      let removeQuery = supabase
        .from('cars')
        .update({ photo_path:null, updated_at:nextUpdatedAt })
        .eq('id', car.id)
        .eq('user_id', session.user.id)
      if (car.updated_at) removeQuery = removeQuery.eq('updated_at', car.updated_at)
      const { data:photoRemoveUpdate, error:photoRemoveError } = await removeQuery.select('id,updated_at').maybeSingle()
      if (photoRemoveError) throw photoRemoveError
      if (!photoRemoveUpdate) throw new Error('This car changed while its main photo was being removed. Reopen the car and try again.')
      car = { ...car, photo_path:null, updated_at:photoRemoveUpdate.updated_at }
      const { error:removeMainStorageError } = await supabase.storage.from('car-photos').remove([oldPhotoPath])
      if (removeMainStorageError) console.warn('Main photo was removed from the car, but the old storage file could not be deleted', removeMainStorageError)
      await invalidatePrivatePhotoCache(oldPhotoPath)
    }

    if (selectedPhotoFile) {`
    )
    source = source.replace(
      "$('photo1-replace')?.addEventListener('click', (event) => { event.stopPropagation(); photoInput?.click() })",
      `$('photo1-replace')?.addEventListener('click', (event) => { event.stopPropagation(); photoInput?.click() })
mainPhotoRemoveButton?.addEventListener('click', (event) => {
  event.preventDefault()
  event.stopPropagation()
  selectedPhotoFile = null
  removePhoto1 = Boolean(editingCar?.photo_path)
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = null
  setPhotoPreview(null)
  editorMessage.textContent = removePhoto1 ? 'Main photo will be deleted when you Save.' : ''
})`
    )
    source = source.replace(
      "$('photo-viewer-close')?.addEventListener('click', closePhotoViewer)",
      `$('photo-viewer-close')?.addEventListener('click', closePhotoViewer)
$('photo-viewer')?.addEventListener('click', (event) => { if (event.target === $('photo-viewer')) closePhotoViewer() })`
    )
    source = source.replace(
      "$('set-more-button')?.addEventListener('click', () => $('set-more-menu')?.classList.toggle('hidden'))",
      `$('set-more-button')?.addEventListener('click', () => $('set-more-menu')?.classList.toggle('hidden'))`
    )

    const headers = new Headers(response.headers)
    headers.set('content-type', 'text/javascript; charset=utf-8')
    headers.delete('content-length')
    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return caches.match(request)
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(patchedIndexResponse(event.request))
    return
  }

  if (url.pathname.endsWith('/app.js')) {
    event.respondWith(patchedAppResponse(event.request))
    return
  }

  if (url.pathname.endsWith('/showcase-sync.js')) {
    event.respondWith(
      fetch('./showcase-sync.js?v=4.2.3', { cache:'no-store' })
        .catch(() => caches.match('./showcase-sync.js?v=4.2.3'))
    )
    return
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
