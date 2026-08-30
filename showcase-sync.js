(() => {
  const STYLE_ID = 'p64-v344-cleanup-style'
  const RESTORE_FINGERPRINT_KEY = 'pocket64-last-restore-file-v344'

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #main-nav { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
      #search-input { text-transform:uppercase; }
    `
    document.head.append(style)
  }

  function removeShowcaseUi() {
    document.getElementById('social-nav')?.remove()
    document.getElementById('social-screen')?.remove()
    const showcaseToggle = document.querySelector('.custom-toggle[for="is-showcase"]')
    showcaseToggle?.remove()

    const optionsRow = document.querySelector('.entry-options-row')
    if (optionsRow) optionsRow.style.gridTemplateColumns = 'auto 1fr'
  }

  function installUppercaseSearch() {
    const input = document.getElementById('search-input')
    if (!input || input.dataset.uppercaseSearch === '1') return
    input.dataset.uppercaseSearch = '1'
    input.addEventListener('input', () => {
      const start = input.selectionStart
      const end = input.selectionEnd
      const upper = input.value.toUpperCase()
      if (upper === input.value) return
      input.value = upper
      if (typeof input.setSelectionRange === 'function' && start !== null && end !== null) input.setSelectionRange(start, end)
    })
  }

  function updateVisibleVersion() {
    document.querySelectorAll('.version-badge').forEach((badge) => {
      badge.textContent = 'Version 3.4.4'
    })
  }

  function restoreFingerprint(file) {
    return `${file.name}|${file.size}|${file.lastModified}`
  }

  function installRestoreRetryGuard() {
    if (document.documentElement.dataset.restoreRetryGuard === '1') return
    document.documentElement.dataset.restoreRetryGuard = '1'

    document.addEventListener('change', (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.id !== 'restore-input') return
      const file = input.files?.[0]
      if (!file) return

      const fingerprint = restoreFingerprint(file)
      let previous = ''
      try { previous = localStorage.getItem(RESTORE_FINGERPRINT_KEY) || '' } catch {}
      const uniqueCount = Number(document.getElementById('stats-total')?.textContent || 0)

      if (previous === fingerprint && uniqueCount > 0) {
        const approved = window.confirm(
          'This same backup file has already been selected on this device while a collection is present.\n\n' +
          'If this backup came from a different account, restoring it again can create duplicate cars.\n\n' +
          'Continue with this restore anyway?'
        )
        if (!approved) {
          event.preventDefault()
          event.stopImmediatePropagation()
          input.value = ''
          return
        }
      }

      try { localStorage.setItem(RESTORE_FINGERPRINT_KEY, fingerprint) } catch {}
    }, true)
  }

  function init() {
    installStyles()
    removeShowcaseUi()
    installUppercaseSearch()
    updateVisibleVersion()
    installRestoreRetryGuard()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true })
  else init()
})()
