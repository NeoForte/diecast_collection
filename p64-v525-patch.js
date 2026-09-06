(() => {
  const PATCH_VERSION = '5.2.7'
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

  let viewerMode = 'fill'
  let lastViewerTap = 0

  function ensureProViewerStyles() {
    if (document.getElementById('p64-pro-viewer-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-pro-viewer-styles'
    style.textContent = `
      #photo-viewer.photo-viewer{position:fixed!important;inset:0!important;z-index:20000!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;background:#000!important;overflow:hidden!important;padding:0!important;margin:0!important;}
      #photo-viewer-stage.photo-viewer-stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:grid!important;place-items:center!important;padding:0!important;margin:0!important;overflow:hidden!important;touch-action:none!important;}
      #photo-viewer-image{display:block!important;margin:0!important;width:100vw!important;height:88dvh!important;max-width:none!important;max-height:none!important;transform-origin:center center!important;will-change:transform!important;box-shadow:none!important;border:0!important;border-radius:0!important;background:#000!important;}
      #photo-viewer[data-p64-view-mode="fill"] #photo-viewer-image{object-fit:cover!important;}
      #photo-viewer[data-p64-view-mode="fit"] #photo-viewer-image{object-fit:contain!important;}
      #photo-viewer-close.photo-viewer-close{position:absolute!important;z-index:5!important;top:calc(env(safe-area-inset-top) + 12px)!important;right:14px!important;width:46px!important;height:46px!important;border-radius:999px!important;display:grid!important;place-items:center!important;background:rgba(16,20,27,.74)!important;border:1px solid rgba(255,255,255,.18)!important;color:#f8fbff!important;font-size:31px!important;line-height:1!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;}
      #p64-view-mode-toggle{position:absolute!important;z-index:5!important;top:calc(env(safe-area-inset-top) + 14px)!important;left:14px!important;min-width:58px!important;height:40px!important;padding:0 13px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.17)!important;background:rgba(16,20,27,.68)!important;color:#d7efff!important;font:800 11px/1 system-ui,-apple-system,sans-serif!important;letter-spacing:.12em!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;}
      #photo-viewer .photo-viewer-nav{position:absolute!important;z-index:5!important;top:50%!important;transform:translateY(-50%)!important;width:42px!important;height:64px!important;border:0!important;border-radius:14px!important;background:rgba(8,12,18,.24)!important;color:#cdeaff!important;font-size:46px!important;line-height:1!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;}
      #photo-viewer-prev{left:0!important} #photo-viewer-next{right:0!important}
      #photo-viewer-count.photo-viewer-count{position:absolute!important;z-index:5!important;left:50%!important;transform:translateX(-50%)!important;bottom:calc(env(safe-area-inset-bottom) + 14px)!important;width:auto!important;max-width:80vw!important;margin:0!important;padding:7px 12px!important;border-radius:999px!important;background:rgba(8,12,18,.50)!important;color:#b9ddf7!important;font-size:12px!important;font-weight:800!important;letter-spacing:.14em!important;white-space:nowrap!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;}
      @media (orientation:landscape){#photo-viewer-image{width:92vw!important;height:100dvh!important}#photo-viewer-close.photo-viewer-close{top:calc(env(safe-area-inset-top) + 8px)!important}#p64-view-mode-toggle{top:calc(env(safe-area-inset-top) + 10px)!important}#photo-viewer-count.photo-viewer-count{bottom:calc(env(safe-area-inset-bottom) + 8px)!important}}
    `
    document.head.append(style)
  }

  function ensureViewModeToggle() {
    const viewer = document.getElementById('photo-viewer')
    if (!viewer) return null
    let button = document.getElementById('p64-view-mode-toggle')
    if (!button) {
      button = document.createElement('button')
      button.id = 'p64-view-mode-toggle'
      button.type = 'button'
      button.setAttribute('aria-label', 'Toggle photo fit or fill')
      viewer.append(button)
      button.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation(); toggleViewerMode()
      })
    }
    return button
  }

  function applyViewerMode(mode = viewerMode) {
    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || !image) return
    viewerMode = mode === 'fit' ? 'fit' : 'fill'
    viewer.dataset.p64ViewMode = viewerMode
    image.style.removeProperty('width')
    image.style.removeProperty('height')
    image.style.removeProperty('max-width')
    image.style.removeProperty('max-height')
    image.style.removeProperty('object-fit')
    const button = ensureViewModeToggle()
    if (button) {
      button.textContent = viewerMode === 'fill' ? 'FIT' : 'FILL'
      button.title = viewerMode === 'fill' ? 'Show the whole photo' : 'Fill the screen'
    }
  }

  function toggleViewerMode() {
    applyViewerMode(viewerMode === 'fill' ? 'fit' : 'fill')
  }

  function openViewerInFillMode() {
    viewerMode = 'fill'
    requestAnimationFrame(() => applyViewerMode('fill'))
  }

  function installProPhotoViewer() {
    ensureProViewerStyles()
    const image = document.getElementById('photo-viewer-image')
    const viewer = document.getElementById('photo-viewer')
    if (!image || !viewer || image.dataset.p64ProViewer === '1') return
    image.dataset.p64ProViewer = '1'
    ensureViewModeToggle()

    image.addEventListener('load', () => requestAnimationFrame(() => applyViewerMode(viewerMode)))

    image.addEventListener('click', (event) => {
      const now = Date.now()
      if (now - lastViewerTap < 320) {
        event.preventDefault(); event.stopPropagation(); lastViewerTap = 0; toggleViewerMode(); return
      }
      lastViewerTap = now
    }, true)

    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'src')) requestAnimationFrame(() => applyViewerMode(viewerMode))
    }).observe(image, { attributes:true, attributeFilter:['src'] })

    new MutationObserver(() => {
      if (!viewer.classList.contains('hidden')) openViewerInFillMode()
    }).observe(viewer, { attributes:true, attributeFilter:['class'] })

    window.addEventListener('resize', () => requestAnimationFrame(() => applyViewerMode(viewerMode)))
    window.visualViewport?.addEventListener?.('resize', () => requestAnimationFrame(() => applyViewerMode(viewerMode)))
  }

  function installPatch() {
    installCancelReset(); installProPhotoViewer(); document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  else installPatch()
})()
