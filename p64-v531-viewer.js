(() => {
  const VIEWER_VERSION = '5.3.1'

  function removeLegacyViewerUi() {
    document.getElementById('p64-view-mode-toggle')?.remove()
    document.getElementById('p64-pro-viewer-styles')?.remove()
    document.getElementById('p64-v530-viewer-styles')?.remove()

    const viewer = document.getElementById('photo-viewer')
    if (viewer) {
      delete viewer.dataset.p64ViewMode
      viewer.removeAttribute('data-p64-view-mode')
    }
  }

  function installStyles() {
    let style = document.getElementById('p64-v531-viewer-styles')
    if (!style) {
      style = document.createElement('style')
      style.id = 'p64-v531-viewer-styles'
      document.head.append(style)
    }

    style.textContent = `
      html body #photo-viewer.photo-viewer {
        position: fixed !important;
        inset: 0 !important;
        z-index: 30000 !important;
        display: block !important;
        width: 100vw !important;
        height: 100dvh !important;
        min-height: 100vh !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        overscroll-behavior: none !important;
      }

      html body #photo-viewer.photo-viewer.hidden {
        display: none !important;
      }

      html body #photo-viewer-stage.photo-viewer-stage {
        position: absolute !important;
        inset: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        padding: max(2px, env(safe-area-inset-top)) max(2px, env(safe-area-inset-right)) max(2px, env(safe-area-inset-bottom)) max(2px, env(safe-area-inset-left)) !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
        touch-action: none !important;
        overscroll-behavior: none !important;
      }

      html body #photo-viewer-image {
        display: block !important;
        width: auto !important;
        height: auto !important;
        max-width: calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 4px) !important;
        max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 4px) !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: auto !important;
        padding: 0 !important;
        object-fit: contain !important;
        object-position: center center !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
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
        right: calc(env(safe-area-inset-right) + 10px) !important;
        width: 44px !important;
        height: 44px !important;
        display: grid !important;
        place-items: center !important;
        padding: 0 0 3px !important;
        margin: 0 !important;
        border: 1px solid rgba(255,255,255,.20) !important;
        border-radius: 999px !important;
        background: rgba(12,14,18,.68) !important;
        color: #fff !important;
        font: 300 30px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        box-shadow: 0 4px 18px rgba(0,0,0,.34) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
      }

      html body #photo-viewer-count.photo-viewer-count {
        position: absolute !important;
        z-index: 9 !important;
        left: 50% !important;
        bottom: calc(env(safe-area-inset-bottom) + 10px) !important;
        transform: translateX(-50%) !important;
        width: auto !important;
        max-width: 70vw !important;
        margin: 0 !important;
        padding: 6px 10px !important;
        border-radius: 999px !important;
        background: rgba(8,10,14,.46) !important;
        color: rgba(225,238,248,.90) !important;
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

      @media (max-width: 768px), (pointer: coarse) {
        html body #photo-viewer .photo-viewer-nav,
        html body #photo-viewer-prev,
        html body #photo-viewer-next {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        html body #photo-viewer-image {
          max-width: calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right)) !important;
          max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
        }
      }
    `
  }

  function clearLegacyImageSizing() {
    const image = document.getElementById('photo-viewer-image')
    if (!image) return

    for (const prop of ['width','height','max-width','max-height','min-width','min-height','object-fit','object-position']) {
      image.style.removeProperty(prop)
    }
  }

  function cleanViewer() {
    removeLegacyViewerUi()
    installStyles()
    clearLegacyImageSizing()
    document.documentElement.dataset.p64ViewerVersion = VIEWER_VERSION
  }

  function installWatchers() {
    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || !image) return

    if (viewer.dataset.p64V531Installed === '1') return
    viewer.dataset.p64V531Installed = '1'

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
      attributes: true,
      attributeFilter: ['class','data-p64-view-mode'],
      childList: true,
      subtree: false,
    })

    new MutationObserver(queueClean).observe(image, {
      attributes: true,
      attributeFilter: ['style','src'],
    })

    image.addEventListener('load', queueClean)
    window.addEventListener('resize', queueClean)
    window.visualViewport?.addEventListener?.('resize', queueClean)

    queueClean()
  }

  function boot() {
    cleanViewer()
    installWatchers()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true })
  } else {
    boot()
  }
})()
