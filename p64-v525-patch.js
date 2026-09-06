(() => {
  const PATCH_VERSION = '5.3.2'
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

  function removeOldViewerUi() {
    document.getElementById('p64-view-mode-toggle')?.remove()
    document.getElementById('p64-pro-viewer-styles')?.remove()
    document.getElementById('p64-v530-viewer-styles')?.remove()
    document.getElementById('p64-v531-viewer-styles')?.remove()

    const viewer = document.getElementById('photo-viewer')
    if (viewer) {
      delete viewer.dataset.p64ViewMode
      viewer.removeAttribute('data-p64-view-mode')
    }
  }

  function installSimpleViewerStyles() {
    let style = document.getElementById('p64-v532-viewer-styles')
    if (!style) {
      style = document.createElement('style')
      style.id = 'p64-v532-viewer-styles'
      document.head.append(style)
    }

    style.textContent = `
      html body #photo-viewer.photo-viewer {
        position: fixed !important;
        inset: 0 !important;
        z-index: 30000 !important;
        display: grid !important;
        grid-template-columns: 1fr !important;
        grid-template-rows: 1fr auto !important;
        width: 100vw !important;
        height: 100dvh !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: rgba(0,0,0,.97) !important;
        backdrop-filter: blur(5px) !important;
        -webkit-backdrop-filter: blur(5px) !important;
        overscroll-behavior: none !important;
      }

      html body #photo-viewer.photo-viewer.hidden {
        display: none !important;
      }

      html body #photo-viewer-stage.photo-viewer-stage {
        grid-column: 1 !important;
        grid-row: 1 !important;
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 !important;
        padding: calc(env(safe-area-inset-top) + 28px) 12px 18px !important;
        overflow: hidden !important;
        background: transparent !important;
        touch-action: none !important;
        overscroll-behavior: none !important;
      }

      html body #photo-viewer-image {
        display: block !important;
        width: auto !important;
        height: auto !important;
        max-width: min(76vw, 360px) !important;
        max-height: min(62dvh, 620px) !important;
        margin: auto !important;
        padding: 0 !important;
        object-fit: contain !important;
        object-position: center center !important;
        border: 0 !important;
        border-radius: 10px !important;
        box-shadow: 0 18px 60px rgba(0,0,0,.62) !important;
        background: #0b0b0b !important;
        transform-origin: center center !important;
        will-change: transform !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-user-drag: none !important;
        touch-action: none !important;
      }

      html body #photo-viewer-close.photo-viewer-close {
        position: absolute !important;
        z-index: 10 !important;
        top: calc(env(safe-area-inset-top) + 10px) !important;
        right: calc(env(safe-area-inset-right) + 12px) !important;
        width: 42px !important;
        height: 42px !important;
        display: grid !important;
        place-items: center !important;
        margin: 0 !important;
        padding: 0 0 3px !important;
        border: 1px solid rgba(255,255,255,.20) !important;
        border-radius: 999px !important;
        background: rgba(12,14,18,.72) !important;
        color: #fff !important;
        font: 300 29px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        box-shadow: 0 4px 18px rgba(0,0,0,.32) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }

      html body #photo-viewer .photo-viewer-nav,
      html body #photo-viewer-prev,
      html body #photo-viewer-next {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      html body #photo-viewer-count.photo-viewer-count {
        grid-column: 1 !important;
        grid-row: 2 !important;
        position: relative !important;
        left: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: auto !important;
        justify-self: center !important;
        margin: 0 0 calc(env(safe-area-inset-bottom) + 12px) !important;
        padding: 6px 10px !important;
        border-radius: 999px !important;
        background: rgba(8,10,14,.42) !important;
        color: rgba(220,235,246,.86) !important;
        font: 800 10px/1.1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing: .10em !important;
        text-align: center !important;
        white-space: nowrap !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
      }

      body.photo-viewer-open {
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }

      @media (max-width: 430px) {
        html body #photo-viewer-image {
          max-width: min(78vw, 340px) !important;
          max-height: 60dvh !important;
        }
      }
    `
  }

  function clearLegacySizing() {
    const image = document.getElementById('photo-viewer-image')
    if (!image) return
    for (const prop of ['width','height','max-width','max-height','min-width','min-height','object-fit','object-position']) {
      image.style.removeProperty(prop)
    }
  }

  function updateCounterVisibility() {
    const count = document.getElementById('photo-viewer-count')
    if (!count) return
    const text = String(count.textContent || '')
    const match = text.match(/(\d+)\s*\/\s*(\d+)\s*$/)
    count.style.display = match && Number(match[2]) <= 1 ? 'none' : ''
  }

  function cleanViewer() {
    removeOldViewerUi()
    installSimpleViewerStyles()
    clearLegacySizing()
    updateCounterVisibility()
    document.documentElement.dataset.p64ViewerVersion = PATCH_VERSION
  }

  function installViewerWatchers() {
    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    const count = document.getElementById('photo-viewer-count')
    if (!viewer || !image || viewer.dataset.p64V532Installed === '1') return
    viewer.dataset.p64V532Installed = '1'

    let queued = false
    const queueClean = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        cleanViewer()
      })
    }

    new MutationObserver(queueClean).observe(viewer, {
      attributes:true,
      attributeFilter:['class','data-p64-view-mode'],
      childList:true,
      subtree:false,
    })

    new MutationObserver(queueClean).observe(image, {
      attributes:true,
      attributeFilter:['style','src'],
    })

    if (count) new MutationObserver(updateCounterVisibility).observe(count, { childList:true, characterData:true, subtree:true })

    image.addEventListener('load', queueClean)
    window.addEventListener('resize', queueClean)
    window.visualViewport?.addEventListener?.('resize', queueClean)

    queueClean()
  }

  function installPatch() {
    installCancelReset()
    syncDisplayedVersion()
    cleanViewer()
    installViewerWatchers()
    document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  } else {
    installPatch()
  }
})()
