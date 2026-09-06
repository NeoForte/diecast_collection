(() => {
  const FIX_VERSION = '6.0.6'

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => {
      el.textContent = `Version ${FIX_VERSION}`
    })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function cleanSetRow() {
    syncDisplayedVersion()

    const select = document.getElementById('set-select')
    const row = document.querySelector('.set-assignment-row')
    if (!select || !row) return

    const nativeLabel = select.closest('label')
    if (nativeLabel) {
      nativeLabel.style.setProperty('display', 'none', 'important')
      nativeLabel.setAttribute('aria-hidden', 'true')
    }

    const addWrap = document.getElementById('p64-add-to-set-button')?.closest('.p64-set-action-wrap')
    const createWrap = document.getElementById('p64-create-set-button')?.closest('.p64-set-action-wrap')
    const positionLabel = document.getElementById('set-position-label')

    if (addWrap && createWrap && positionLabel) {
      if (addWrap.nextElementSibling !== createWrap) {
        row.insertBefore(addWrap, positionLabel)
        row.insertBefore(createWrap, positionLabel)
      }
      row.style.setProperty('grid-template-columns', 'minmax(0,1fr) minmax(0,1fr)', 'important')
      row.style.setProperty('gap', '12px', 'important')
      row.style.setProperty('align-items', 'start', 'important')
    }
  }

  function boot() {
    ;[0, 50, 250, 750].forEach((delay) => setTimeout(cleanSetRow, delay))
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(cleanSetRow, 0)
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
