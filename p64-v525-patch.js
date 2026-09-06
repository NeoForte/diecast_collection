(() => {
  const PATCH_VERSION = '5.3.0'
  const UI_STATE_PREFIX = 'pocket64-ui-state-v1-'

  function isNewCarEditor() {
    const editor = document.getElementById('editor-screen')
    const title = document.getElementById('editor-title')
    return Boolean(editor?.classList.contains('active') && /add car/i.test(title?.textContent || ''))
  }

  function clearNewCarDraftState() {
    if (!isNewCarEditor()) return
    const form = document.getElementById('car-form')
    if (form) form.reset()

    const quantity = document.getElementById('quantity')
    if (quantity) quantity.value = '1'
    const quantityDisplay = document.getElementById('quantity-display')
    if (quantityDisplay) quantityDisplay.textContent = 'QTY 1'

    const setSelect = document.getElementById('set-select')
    if (setSelect) {
      setSelect.value = ''
      setSelect.dispatchEvent(new Event('change', { bubbles:true }))
    }
    const setPosition = document.getElementById('set-position')
    if (setPosition) setPosition.value = ''
    document.getElementById('set-position-label')?.classList.add('hidden')

    const setStatus = document.getElementById('p64-simple-set-status')
    if (setStatus) {
      setStatus.textContent = 'No Set selected'
      setStatus.classList.remove('assigned')
    }
    document.getElementById('p64-clear-set')?.classList.add('hidden')

    for (const id of ['photo-input','photo2-input','photo3-input']) {
      const input = document.getElementById(id)
      if (input) input.value = ''
    }

    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i) || ''
        if (key.startsWith(UI_STATE_PREFIX)) localStorage.removeItem(key)
      }
    } catch {}
  }

  function installCancelReset() {
    const button = document.getElementById('cancel-button')
    if (!button || button.dataset.p64CancelReset === '1') return
    button.dataset.p64CancelReset = '1'
    button.addEventListener('click', clearNewCarDraftState, true)
  }

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => {
      el.textContent = `Version ${PATCH_VERSION}`
    })
  }

  function ensureProfessionalViewerStyles() {
    if (document.getElementById('p64-v530-viewer-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-v530-viewer-styles'
    style.textContent = `
      #photo-viewer.photo-viewer {
        position: fixed !important;
        inset: 0 !important;
        z-index: 20000 !important;
        display: block !important;
        width: 100vw !important;
        height: 100dvh !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        overscroll-behavior: contain !important;
        background: rgba(0,0,0,.985) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      #photo-viewer.photo-viewer.hidden {
        display: none !important;
      }

      #photo-viewer-stage.photo-viewer-stage {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 !important;
        padding: 4px !important;
        overflow: hidden !important;
        touch-action: none !important;
        overscroll-behavior: contain !important;
      }

      #photo-viewer-image {
        display: block !important;
        width: auto !important;
        height: auto !important;
        max-width: calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 8px) !important;
        max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 8px) !important;
        margin: 0 !important;
        object-fit: contain !important;
        object-position: center center !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #000 !important;
        transform-origin: center center !important;
        will-change: transform !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-user-drag: none !important;
        touch-action: none !important;
      }

      #photo-viewer-close.photo-viewer-close {
        position: absolute !important;
        z-index: 8 !important;
        top: calc(env(safe-area-inset-top) + 10px) !important;
        right: calc(env(safe-area-inset-right) + 10px) !important;
        width: 46px !important;
        height: 46px !important;
        display: grid !important;
        place-items: center !important;
        margin: 0 !important;
        padding: 0 0 3px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(255,255,255,.20) !important;
        background: rgba(12,16,22,.72) !important;
        color: #f7fbff !important;
        box-shadow: 0 5px 22px rgba(0,0,0,.34) !important;
        font: 300 31px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
      }

      #photo-viewer .photo-viewer-nav {
        position: absolute !important;
        z-index: 7 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 42px !important;
        height: 72px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 14px !important;
        background: rgba(8,12,18,.28) !important;
        color: rgba(225,242,255,.88) !important;
        box-shadow: none !important;
        font: 300 44px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
      }

      #photo-viewer-prev { left: calc(env(safe-area-inset-left) + 2px) !important; }
      #photo-viewer-next { right: calc(env(safe-area-inset-right) + 2px) !important; }

      #photo-viewer-count.photo-viewer-count {
        position: absolute !important;
        z-index: 7 !important;
        left: 50% !important;
        bottom: calc(env(safe-area-inset-bottom) + 12px) !important;
        transform: translateX(-50%) !important;
        width: auto !important;
        max-width: 82vw !important;
        margin: 0 !important;
        padding: 7px 12px !important;
        border-radius: 999px !important;
        background: rgba(8,12,18,.52) !important;
        color: rgba(206,232,250,.94) !important;
        font: 800 11px/1.1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing: .12em !important;
        white-space: nowrap !important;
        text-align: center !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }

      body.photo-viewer-open {
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }

      @media (hover: hover) and (pointer: fine) {
        #photo-viewer-image { cursor: zoom-in !important; }
        #photo-viewer-close.photo-viewer-close:hover,
        #photo-viewer .photo-viewer-nav:hover { background: rgba(24,31,41,.80) !important; }
      }

      @media (max-width: 480px) {
        #photo-viewer-stage.photo-viewer-stage { padding: 2px !important; }
        #photo-viewer-image {
          max-width: calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 4px) !important;
          max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4px) !important;
        }
        #photo-viewer .photo-viewer-nav {
          width: 38px !important;
          height: 64px !important;
          border-radius: 12px !important;
          font-size: 40px !important;
          background: rgba(8,12,18,.20) !important;
        }
      }
    `
    document.head.append(style)
  }

  function installProfessionalPhotoViewer() {
    ensureProfessionalViewerStyles()

    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || !image || image.dataset.p64V530Viewer === '1') return
    image.dataset.p64V530Viewer = '1'

    let cleanupQueued = false
    let cleaning = false

    function clearLegacyInlineSizing() {
      if (cleaning) return
      const props = ['width', 'height', 'max-width', 'max-height', 'object-fit', 'object-position']
      const hasLegacySizing = props.some((prop) => image.style.getPropertyValue(prop))
      if (!hasLegacySizing) return

      cleaning = true
      for (const prop of props) image.style.removeProperty(prop)
      cleaning = false
    }

    function queueSizingCleanup() {
      if (cleanupQueued) return
      cleanupQueued = true
      requestAnimationFrame(() => {
        cleanupQueued = false
        clearLegacyInlineSizing()
      })
    }

    image.addEventListener('load', () => {
      queueSizingCleanup()
      requestAnimationFrame(queueSizingCleanup)
    })

    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'style' || mutation.attributeName === 'src')) {
        queueSizingCleanup()
      }
    }).observe(image, { attributes:true, attributeFilter:['style','src'] })

    new MutationObserver(() => {
      if (!viewer.classList.contains('hidden')) {
        queueSizingCleanup()
        requestAnimationFrame(queueSizingCleanup)
      }
    }).observe(viewer, { attributes:true, attributeFilter:['class'] })

    window.addEventListener('resize', queueSizingCleanup)
    window.visualViewport?.addEventListener?.('resize', queueSizingCleanup)

    document.addEventListener('keydown', (event) => {
      if (viewer.classList.contains('hidden')) return
      if (event.key === 'ArrowLeft') document.getElementById('photo-viewer-prev')?.click()
      if (event.key === 'ArrowRight') document.getElementById('photo-viewer-next')?.click()
    })

    queueSizingCleanup()
  }

  function installPatch() {
    installCancelReset()
    installProfessionalPhotoViewer()
    syncDisplayedVersion()
    document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  } else {
    installPatch()
  }
})()
