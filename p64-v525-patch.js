(() => {
  const PATCH_VERSION = '5.2.6'
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

  function ensureProViewerStyles() {
    if (document.getElementById('p64-pro-viewer-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-pro-viewer-styles'
    style.textContent = `
      #photo-viewer.photo-viewer{
        position:fixed!important;inset:0!important;z-index:20000!important;
        width:100vw!important;height:100dvh!important;min-height:100vh!important;
        background:#000!important;overflow:hidden!important;padding:0!important;margin:0!important;
      }
      #photo-viewer-stage.photo-viewer-stage{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        display:grid!important;place-items:center!important;padding:0!important;margin:0!important;
        overflow:hidden!important;touch-action:none!important;
      }
      #photo-viewer-image{
        display:block!important;margin:auto!important;object-fit:contain!important;
        transform-origin:center center!important;will-change:transform!important;
        box-shadow:none!important;border:0!important;border-radius:0!important;
      }
      #photo-viewer-close.photo-viewer-close{
        position:absolute!important;z-index:4!important;
        top:calc(env(safe-area-inset-top) + 12px)!important;right:14px!important;
        width:46px!important;height:46px!important;border-radius:999px!important;
        display:grid!important;place-items:center!important;
        background:rgba(16,20,27,.78)!important;border:1px solid rgba(255,255,255,.20)!important;
        color:#f8fbff!important;font-size:31px!important;line-height:1!important;
        backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;
      }
      #photo-viewer .photo-viewer-nav{
        position:absolute!important;z-index:4!important;top:50%!important;transform:translateY(-50%)!important;
        width:46px!important;height:58px!important;border:0!important;border-radius:14px!important;
        background:rgba(8,12,18,.34)!important;color:#cdeaff!important;font-size:48px!important;line-height:1!important;
        backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;
      }
      #photo-viewer-prev{left:4px!important}
      #photo-viewer-next{right:4px!important}
      #photo-viewer-count.photo-viewer-count{
        position:absolute!important;z-index:4!important;left:50%!important;transform:translateX(-50%)!important;
        bottom:calc(env(safe-area-inset-bottom) + 14px)!important;
        width:auto!important;max-width:80vw!important;margin:0!important;padding:7px 12px!important;
        border-radius:999px!important;background:rgba(8,12,18,.58)!important;
        color:#b9ddf7!important;font-size:12px!important;font-weight:800!important;letter-spacing:.14em!important;
        white-space:nowrap!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;
      }
      @media (orientation:landscape){
        #photo-viewer-close.photo-viewer-close{top:calc(env(safe-area-inset-top) + 8px)!important}
        #photo-viewer-count.photo-viewer-count{bottom:calc(env(safe-area-inset-bottom) + 8px)!important}
      }
    `
    document.head.append(style)
  }

  function viewportSize() {
    const vv = window.visualViewport
    return {
      width: Math.max(1, vv?.width || window.innerWidth || document.documentElement.clientWidth || 1),
      height: Math.max(1, vv?.height || window.innerHeight || document.documentElement.clientHeight || 1),
    }
  }

  function fitProPhotoViewer() {
    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || viewer.classList.contains('hidden') || !image?.naturalWidth || !image?.naturalHeight) return

    const { width:vw, height:vh } = viewportSize()
    const portrait = image.naturalHeight >= image.naturalWidth
    const maxW = vw * (portrait ? 0.985 : 0.97)
    const maxH = vh * 0.92
    const ratio = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight)
    const width = Math.max(1, Math.round(image.naturalWidth * ratio))
    const height = Math.max(1, Math.round(image.naturalHeight * ratio))

    image.style.setProperty('width', `${width}px`, 'important')
    image.style.setProperty('height', `${height}px`, 'important')
    image.style.setProperty('max-width', `${maxW}px`, 'important')
    image.style.setProperty('max-height', `${maxH}px`, 'important')
    image.style.setProperty('object-fit', 'contain', 'important')
  }

  function queueProPhotoFit() {
    requestAnimationFrame(() => {
      fitProPhotoViewer()
      setTimeout(fitProPhotoViewer, 0)
      setTimeout(fitProPhotoViewer, 60)
      setTimeout(fitProPhotoViewer, 180)
    })
  }

  function installProPhotoViewer() {
    ensureProViewerStyles()
    const image = document.getElementById('photo-viewer-image')
    if (!image || image.dataset.p64ProViewer === '1') return
    image.dataset.p64ProViewer = '1'
    image.addEventListener('load', queueProPhotoFit)

    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'src')) queueProPhotoFit()
    }).observe(image, { attributes:true, attributeFilter:['src'] })

    const viewer = document.getElementById('photo-viewer')
    if (viewer) {
      new MutationObserver(() => {
        if (!viewer.classList.contains('hidden')) queueProPhotoFit()
      }).observe(viewer, { attributes:true, attributeFilter:['class'] })
    }

    window.addEventListener('resize', queueProPhotoFit)
    window.visualViewport?.addEventListener?.('resize', queueProPhotoFit)
  }

  function installPatch() {
    installCancelReset()
    installProPhotoViewer()
    document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  else installPatch()
})()
