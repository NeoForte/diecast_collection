const CACHE = 'pocket64-v4.2.2-photofix1'
const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=4.2.2',
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

async function patchedAppResponse(request) {
  try {
    const response = await fetch(request, { cache:'no-store' })
    if (!response.ok) return response

    let source = await response.text()

    // v4.2.2 auth return hotfix.
    source = source.replace(
      "const isVerificationReturn = startupUrl.searchParams.get('verified') === '1'",
      "let isVerificationReturn = startupUrl.searchParams.get('verified') === '1'"
    )
    source = source.replace(
      "clearAuthRedirectUrl()\n  if (verifiedEmail)",
      "clearAuthRedirectUrl()\n  isVerificationReturn = false\n  if (verifiedEmail)"
    )

    // v4.2.2 photo fixes: allow staged deletion of the main photo.
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
    button.textContent = 'Delete Main Photo'
    button.setAttribute('aria-label', 'Delete main photo')
    picker.append(button)
  }
  return button
})()

const photoFixStyle = document.createElement('style')
photoFixStyle.textContent = \`
  .photo-main-remove {
    position:absolute; left:12px; bottom:12px; z-index:6;
    border:1px solid rgba(255,120,120,.65); border-radius:999px;
    padding:8px 12px; background:rgba(20,4,4,.88); color:#ffb4b4;
    font-size:12px; font-weight:850; letter-spacing:.01em;
    backdrop-filter:blur(8px);
  }
  .photo-viewer-close {
    top:calc(env(safe-area-inset-top) + 16px) !important;
    right:max(16px, env(safe-area-inset-right)) !important;
    width:48px !important; height:48px !important; min-width:48px !important;
    z-index:1005 !important; font-size:30px !important; line-height:1 !important;
    display:grid !important; place-items:center !important;
  }
\`
document.head.append(photoFixStyle)

function syncMainPhotoControls(present) {
  $('photo1-replace')?.classList.toggle('hidden', !present)
  mainPhotoRemoveButton?.classList.toggle('hidden', !present)
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

  if (url.pathname.endsWith('/app.js')) {
    event.respondWith(patchedAppResponse(event.request))
    return
  }

  if (url.pathname.endsWith('/showcase-sync.js')) {
    event.respondWith(
      fetch('./showcase-sync.js?v=4.2.2', { cache:'no-store' })
        .catch(() => caches.match('./showcase-sync.js?v=4.2.2'))
    )
    return
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
