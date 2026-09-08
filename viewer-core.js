(() => {
  const VIEWER_CORE_VERSION = '6.2.2'

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

  function installPhotosLikeGestures() {
    const viewer = document.getElementById('photo-viewer')
    const stage = document.getElementById('photo-viewer-stage')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || !stage || !image || stage.dataset.p64GestureV533 === '1') return
    stage.dataset.p64GestureV533 = '1'

    let scale = 1
    let translateX = 0
    let translateY = 0
    let gesture = null

    const clampScale = (value) => Math.max(1, Math.min(4, Number(value) || 1))
    const midpoint = (a, b) => ({ x:(a.clientX + b.clientX) / 2, y:(a.clientY + b.clientY) / 2 })
    const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    function clampPan() {
      if (scale <= 1.001) {
        translateX = 0
        translateY = 0
        return
      }
      const maxX = Math.max(0, ((image.clientWidth * scale) - stage.clientWidth) / 2)
      const maxY = Math.max(0, ((image.clientHeight * scale) - stage.clientHeight) / 2)
      translateX = Math.min(maxX, Math.max(-maxX, translateX))
      translateY = Math.min(maxY, Math.max(-maxY, translateY))
    }

    function applyTransform() {
      scale = clampScale(scale)
      clampPan()
      image.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
    }

    function resetTransform() {
      scale = 1
      translateX = 0
      translateY = 0
      gesture = null
      image.style.transform = 'translate3d(0, 0, 0) scale(1)'
    }

    function beginPinch(touches) {
      const a = touches[0]
      const b = touches[1]
      const mid = midpoint(a, b)
      const rect = stage.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const startDistance = Math.max(1, distance(a, b))

      gesture = {
        type:'pinch',
        startDistance,
        startScale:scale,
        centerX,
        centerY,
        anchorX:(mid.x - centerX - translateX) / scale,
        anchorY:(mid.y - centerY - translateY) / scale,
      }
    }

    function beginPan(touch) {
      gesture = {
        type:'pan',
        startX:touch.clientX,
        startY:touch.clientY,
        startTranslateX:translateX,
        startTranslateY:translateY,
      }
    }

    stage.addEventListener('touchstart', (event) => {
      if (viewer.classList.contains('hidden')) return
      const touches = event.touches || []

      if (touches.length >= 2) {
        event.preventDefault()
        event.stopImmediatePropagation()
        beginPinch(touches)
        return
      }

      if (touches.length === 1 && scale > 1.001) {
        event.preventDefault()
        event.stopImmediatePropagation()
        beginPan(touches[0])
      }
    }, { passive:false, capture:true })

    stage.addEventListener('touchmove', (event) => {
      if (viewer.classList.contains('hidden')) return
      const touches = event.touches || []

      if (touches.length >= 2) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (!gesture || gesture.type !== 'pinch') beginPinch(touches)

        const a = touches[0]
        const b = touches[1]
        const mid = midpoint(a, b)
        const nextScale = clampScale(gesture.startScale * (distance(a, b) / gesture.startDistance))

        scale = nextScale
        translateX = mid.x - gesture.centerX - (gesture.anchorX * scale)
        translateY = mid.y - gesture.centerY - (gesture.anchorY * scale)
        applyTransform()
        return
      }

      if (touches.length === 1 && scale > 1.001) {
        event.preventDefault()
        event.stopImmediatePropagation()
        const touch = touches[0]
        if (!gesture || gesture.type !== 'pan') beginPan(touch)
        translateX = gesture.startTranslateX + (touch.clientX - gesture.startX)
        translateY = gesture.startTranslateY + (touch.clientY - gesture.startY)
        applyTransform()
      }
    }, { passive:false, capture:true })

    stage.addEventListener('touchend', (event) => {
      if (viewer.classList.contains('hidden')) return
      const touches = event.touches || []

      if (gesture?.type === 'pinch') {
        event.preventDefault()
        event.stopImmediatePropagation()

        if (scale <= 1.02) {
          resetTransform()
          return
        }

        if (touches.length === 1) beginPan(touches[0])
        else if (!touches.length) gesture = null
        return
      }

      if (scale > 1.001 && gesture?.type === 'pan') {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (touches.length === 1) beginPan(touches[0])
        else gesture = null
      }
    }, { passive:false, capture:true })

    stage.addEventListener('touchcancel', (event) => {
      if (scale > 1.001 || gesture) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
      gesture = null
      if (scale <= 1.02) resetTransform()
    }, { passive:false, capture:true })

    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'src')) resetTransform()
    }).observe(image, { attributes:true, attributeFilter:['src'] })

    new MutationObserver(() => {
      if (!viewer.classList.contains('hidden')) resetTransform()
    }).observe(viewer, { attributes:true, attributeFilter:['class'] })
  }

  function cleanViewer() {
    removeOldViewerUi()
    installSimpleViewerStyles()
    clearLegacySizing()
    updateCounterVisibility()
    document.documentElement.dataset.p64ViewerVersion = VIEWER_CORE_VERSION
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

  function installViewerCore() {
    cleanViewer()
    installViewerWatchers()
    installPhotosLikeGestures()
    document.documentElement.dataset.p64ViewerCoreVersion = VIEWER_CORE_VERSION
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installViewerCore, { once:true })
  } else {
    installViewerCore()
  }
})()
