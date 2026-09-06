(() => {
  const FIX_VERSION = '6.0.7'

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => {
      el.textContent = `Version ${FIX_VERSION}`
    })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function hideLegacySimpleSetUi() {
    const legacyIds = [
      'p64-simple-set-button',
      'p64-simple-set-status',
      'p64-clear-set',
      'p64-simple-set-wrap',
      'p64-simple-set-picker',
    ]
    for (const id of legacyIds) {
      const el = document.getElementById(id)
      if (!el) continue
      el.style.setProperty('display', 'none', 'important')
      el.setAttribute('aria-hidden', 'true')
    }

    document.querySelectorAll('[id^="p64-simple-set"]').forEach((el) => {
      el.style.setProperty('display', 'none', 'important')
      el.setAttribute('aria-hidden', 'true')
    })
  }

  function cleanSetRow() {
    syncDisplayedVersion()
    hideLegacySimpleSetUi()

    const select = document.getElementById('set-select')
    const row = document.querySelector('.set-assignment-row')
    if (!select || !row) return

    const nativeLabel = select.closest('label')
    if (nativeLabel && row.contains(nativeLabel)) {
      // Keep the real select alive for Pocket 64's assignment logic, but remove
      // its old visible label/control from the grid completely.
      select.style.setProperty('display', 'none', 'important')
      select.setAttribute('aria-hidden', 'true')
      row.appendChild(select)
      nativeLabel.remove()
    } else {
      select.style.setProperty('display', 'none', 'important')
      select.setAttribute('aria-hidden', 'true')
    }

    const addWrap = document.getElementById('p64-add-to-set-button')?.closest('.p64-set-action-wrap')
    const createWrap = document.getElementById('p64-create-set-button')?.closest('.p64-set-action-wrap')
    const positionLabel = document.getElementById('set-position-label')

    if (addWrap && createWrap) {
      // Strip any leftover legacy Set widgets from this row. Preserve only the
      // two working action buttons, the hidden bridge select, and Set Position.
      for (const child of [...row.children]) {
        if (child === addWrap || child === createWrap || child === select || child === positionLabel) continue
        child.remove()
      }

      row.insertBefore(addWrap, positionLabel || select)
      row.insertBefore(createWrap, positionLabel || select)
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
  }

  function boot() {
    ;[0, 50, 200, 500, 1000].forEach((delay) => setTimeout(cleanSetRow, delay))

    const observer = new MutationObserver(() => cleanSetRow())
    const editor = document.getElementById('editor-screen') || document.body
    observer.observe(editor, { childList:true, subtree:true })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(cleanSetRow, 0)
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
