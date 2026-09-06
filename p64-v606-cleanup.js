(() => {
  const FIX_VERSION = '6.0.8'

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => {
      el.textContent = `Version ${FIX_VERSION}`
    })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function hideElement(el) {
    if (!el) return
    el.style.setProperty('display', 'none', 'important')
    el.setAttribute('aria-hidden', 'true')
  }

  function cleanSetRowOnce() {
    syncDisplayedVersion()

    const select = document.getElementById('set-select')
    const row = document.querySelector('.set-assignment-row')
    if (!select || !row) return

    // Hide legacy/simple Set UI without removing/reparenting anything.
    [
      'p64-simple-set-button',
      'p64-simple-set-status',
      'p64-clear-set',
      'p64-simple-set-wrap',
      'p64-simple-set-picker',
    ].forEach((id) => hideElement(document.getElementById(id)))
    document.querySelectorAll('[id^="p64-simple-set"]').forEach(hideElement)

    // Keep the original Set select in the DOM for assignment logic, but invisible.
    const nativeLabel = select.closest('label')
    if (nativeLabel && row.contains(nativeLabel)) hideElement(nativeLabel)
    else hideElement(select)

    const addWrap = document.getElementById('p64-add-to-set-button')?.closest('.p64-set-action-wrap')
    const createWrap = document.getElementById('p64-create-set-button')?.closest('.p64-set-action-wrap')
    const positionLabel = document.getElementById('set-position-label')

    if (!addWrap || !createWrap) return

    row.style.setProperty('grid-template-columns', 'minmax(0,1fr) minmax(0,1fr)', 'important')
    row.style.setProperty('gap', '12px', 'important')
    row.style.setProperty('align-items', 'start', 'important')

    addWrap.style.setProperty('grid-column', '1', 'important')
    createWrap.style.setProperty('grid-column', '2', 'important')
    addWrap.style.setProperty('grid-row', '1', 'important')
    createWrap.style.setProperty('grid-row', '1', 'important')

    if (positionLabel) {
      positionLabel.style.setProperty('grid-column', '1 / -1', 'important')
      positionLabel.style.setProperty('grid-row', '2', 'important')
    }
  }

  function scheduleCleanups() {
    ;[0, 50, 200, 500, 1000, 1800].forEach((delay) => setTimeout(cleanSetRowOnce, delay))
  }

  function boot() {
    scheduleCleanups()

    // Re-run only on known editor-entry actions. No MutationObserver: 6.0.7's
    // observer reacted to its own DOM edits and could lock Safari/Chrome.
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('#add-button, #empty-add-button, .car-card, .edit-car-button')) {
        scheduleCleanups()
      }
    }, true)

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleCleanups()
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
