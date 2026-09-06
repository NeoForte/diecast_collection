(() => {
  const PATCH_VERSION = '5.3.1'
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

  function loadFreshViewer() {
    if (document.querySelector('script[data-p64-v531-viewer="1"]')) return
    const script = document.createElement('script')
    script.src = `p64-v531-viewer.js?v=${encodeURIComponent(PATCH_VERSION)}`
    script.async = false
    script.dataset.p64V531Viewer = '1'
    document.head.append(script)
  }

  function installPatch() {
    installCancelReset()
    syncDisplayedVersion()
    loadFreshViewer()
    document.documentElement.dataset.p64PatchVersion = PATCH_VERSION
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPatch, { once:true })
  } else {
    installPatch()
  }
})()
