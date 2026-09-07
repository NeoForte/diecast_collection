(() => {
  const VERSION = '6.2.3'
  const ROUTE_KEY = 'p64-route'
  const HERO_SRC = `community-garage-hero-v623.svg?v=${VERSION}`
  const MAX_COMMUNITY_EDGE = 1200
  const RECOMPRESS_ABOVE = 280 * 1024
  const TARGET_QUALITY = 0.78
  const FEED_LIMIT = 24

  function setCommunityRoute() {
    try { sessionStorage.setItem(ROUTE_KEY, 'community') } catch {}
  }

  function clearCommunityRoute() {
    try { sessionStorage.removeItem(ROUTE_KEY) } catch {}
  }

  function wantsCommunityRoute() {
    try { return sessionStorage.getItem(ROUTE_KEY) === 'community' } catch { return false }
  }

  function polishHero() {
    const img = document.querySelector('#social-screen .p64-community-hero img')
    if (!img) return false
    if (!img.src.includes('community-garage-hero-v623.svg')) img.src = HERO_SRC
    img.style.width = '100%'
    img.style.height = 'auto'
    img.style.maxHeight = '220px'
    img.style.objectFit = 'cover'
    img.style.objectPosition = 'center 54%'
    img.style.imageRendering = 'auto'
    img.decoding = 'async'
    return true
  }

  function waitForHero(maxFrames = 90) {
    let frame = 0
    const tick = () => {
      if (polishHero() || ++frame >= maxFrames) return
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function restoreCommunityAfterReload() {
    if (!wantsCommunityRoute()) return
    let tries = 0
    const tryOpen = () => {
      const button = document.getElementById('p64-community-entry')
      if (button) {
        button.click()
        waitForHero()
        return
      }
      if (++tries < 50) setTimeout(tryOpen, 100)
    }
    setTimeout(tryOpen, 80)
  }

  async function blobToBitmap(blob) {
    if ('createImageBitmap' in window) return createImageBitmap(blob)
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = (e) => {
        URL.revokeObjectURL(url)
        reject(e)
      }
      img.src = url
    })
  }

  async function optimizeCommunityImage(blob) {
    if (!(blob instanceof Blob) || !String(blob.type || '').startsWith('image/')) return blob
    try {
      const bitmap = await blobToBitmap(blob)
      const sourceWidth = bitmap.width || bitmap.naturalWidth || 0
      const sourceHeight = bitmap.height || bitmap.naturalHeight || 0
      if (!sourceWidth || !sourceHeight) return blob

      const scale = Math.min(1, MAX_COMMUNITY_EDGE / Math.max(sourceWidth, sourceHeight))
      const width = Math.max(1, Math.round(sourceWidth * scale))
      const height = Math.max(1, Math.round(sourceHeight * scale))

      if (scale === 1 && blob.size <= RECOMPRESS_ABOVE) {
        if (bitmap.close) bitmap.close()
        return blob
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return blob
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0, width, height)
      if (bitmap.close) bitmap.close()

      const compressed = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', TARGET_QUALITY))
      if (!compressed) return blob
      return compressed.size < blob.size ? compressed : blob
    } catch (error) {
      console.warn('Pocket 64 Community photo optimization skipped', error)
      return blob
    }
  }

  function patchFetchForCommunityEgress() {
    if (window.__p64CommunityFetch623) return
    window.__p64CommunityFetch623 = true
    const nativeFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      let url = typeof input === 'string' ? input : input?.url || ''
      let nextInput = input
      let nextInit = init

      try {
        if (url.includes('/rest/v1/community_posts') && url.includes('limit=50')) {
          const u = new URL(url, location.href)
          u.searchParams.set('limit', String(FEED_LIMIT))
          url = u.toString()
          nextInput = typeof input === 'string' ? url : new Request(url, input)
        }

        if (url.includes('/storage/v1/object/community-photos/') && init?.body instanceof Blob) {
          const optimized = await optimizeCommunityImage(init.body)
          if (optimized !== init.body) {
            const headers = new Headers(init.headers || {})
            headers.set('content-type', 'image/jpeg')
            nextInit = { ...init, body: optimized, headers }
          }
        }
      } catch (error) {
        console.warn('Pocket 64 Community egress guard fallback', error)
      }

      return nativeFetch(nextInput, nextInit)
    }
  }

  function installNavigationPersistence() {
    if (document.documentElement.dataset.p64CommunityRoute623 === '1') return
    document.documentElement.dataset.p64CommunityRoute623 = '1'

    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.('button, a')
      if (!target) return

      if (target.id === 'p64-community-entry') {
        setCommunityRoute()
        setTimeout(waitForHero, 0)
        return
      }

      if (
        target.id === 'p64-community-back' ||
        target.id === 'collection-nav' ||
        target.id === 'sets-nav' ||
        target.id === 'stats-nav' ||
        target.id === 'settings-row-button'
      ) {
        clearCommunityRoute()
      }
    }, true)
  }

  function boot() {
    patchFetchForCommunityEgress()
    installNavigationPersistence()
    if (document.getElementById('social-screen')?.classList.contains('active')) {
      setCommunityRoute()
      waitForHero()
    } else {
      restoreCommunityAfterReload()
    }
    document.documentElement.dataset.p64CommunityPolishVersion = VERSION
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
  window.addEventListener('pageshow', boot)
})()
