(() => {
  const PATCH_VERSION = '5.2.5'
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

  function fitLargePhotoViewer() {
    const viewer = document.getElementById('photo-viewer')
    const image = document.getElementById('photo-viewer-image')
    if (!viewer || viewer.classList.contains('hidden') || !image?.naturalWidth || !image?.naturalHeight) return

    const maxW = Math.max(1, window.innerWidth * 0.92)
    const maxH = Math.max(1, window.innerHeight * 0.80)
    const ratio = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight)
    const width = Math.max(1, Math.round(image.naturalWidth * ratio))
    const height = Math.max(1, Math.round(image.naturalHeight * ratio))

    image.style.setProperty('width', `${width}px`, 'important')
    image.style.setProperty('height', `${height}px`, 'important')
    image.style.setProperty('max-width', `${maxW}px`, 'important')
    image.style.setProperty('max-height', `${maxH}px`, 'important')
    image.style.setProperty('object-fit', 'contain', 'important')
  }

  function queueLargePhotoFit() {
    requestAnimationFrame(() => {
      fitLargePhotoViewer()
      setTimeout(fitLargePhotoViewer, 0)
      setTimeout(fitLargePhotoViewer, 80)
    })
  }

  function installLargePhotoViewer() {
    const image = document.getElementById('photo-viewer-image')
    if (!image || image.dataset.p64LargeViewer === '1') return
    image.dataset.p64LargeViewer = '1'
    image.addEventListener('load', queueLargePhotoFit)
    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'src')) queueLargePhotoFit()
    }).observe(image, { attributes:true, attributeFilter:['src'] })

    const viewer = document.getElementById('photo-viewer')
    if (viewer) {
      new MutationObserver(() => {
        if (!viewer.classList.contains('hidden')) queueLargePhotoFit()
      }).observe(viewer, { attributes:true, attributeFilter:['class'] })
    }
    window.addEventListener('resize', queueLargePhotoFit)
  }

  function installPatch() {
    installCancelReset()
    installLargePhotoViewer()
    document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  } else {
    installPatch()
  }
})()
