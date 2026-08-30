(() => {
  const RESTORE_FINGERPRINT_KEY = 'pocket64-last-restore-file-v345'

  function forceHideShowcase() {
    const nav = document.getElementById('social-nav')
    const screen = document.getElementById('social-screen')
    const toggle = document.querySelector('.custom-toggle[for="is-showcase"]')

    if (nav) nav.style.setProperty('display', 'none', 'important')
    if (screen) screen.style.setProperty('display', 'none', 'important')
    if (toggle) toggle.style.setProperty('display', 'none', 'important')

    const mainNav = document.getElementById('main-nav')
    if (mainNav) mainNav.style.setProperty('grid-template-columns', 'repeat(3,minmax(0,1fr))', 'important')

    const optionsRow = toggle?.closest('.entry-options-row') || document.querySelector('.entry-options-row')
    if (optionsRow) optionsRow.style.setProperty('grid-template-columns', 'auto 1fr', 'important')
  }

  function installUppercaseSearch() {
    const input = document.getElementById('search-input')
    if (!input || input.dataset.uppercaseSearch === '1') return
    input.dataset.uppercaseSearch = '1'
    input.style.textTransform = 'uppercase'
    input.addEventListener('input', () => {
      const start = input.selectionStart
      const end = input.selectionEnd
      const upper = input.value.toUpperCase()
      if (upper === input.value) return
      input.value = upper
      if (typeof input.setSelectionRange === 'function' && start !== null && end !== null) {
        input.setSelectionRange(start, end)
      }
    })
  }

  function updateVisibleVersion() {
    document.querySelectorAll('.version-badge').forEach((badge) => {
      badge.textContent = 'Version 3.4.5'
    })
  }

  function authEmailFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || ''
        if (!key.includes('auth-token')) continue

        const raw = localStorage.getItem(key)
        if (!raw) continue

        const parsed = JSON.parse(raw)
        const candidates = [
          parsed?.user?.email,
          parsed?.currentSession?.user?.email,
          parsed?.session?.user?.email,
          parsed?.data?.session?.user?.email,
        ]
        const email = candidates.find(Boolean)
        if (email) return String(email)
      }
    } catch {}
    return ''
  }

  function currentSignedInEmail() {
    const typed = document.getElementById('email')?.value?.trim()
    return typed || authEmailFromStorage()
  }

  function forceAccountEmailLine() {
    const logout = document.getElementById('logout-btn')
    const card = logout?.parentElement
    const copy = card?.querySelector('.settings-copy')
    if (!copy) return

    let line = document.getElementById('p64-signed-in-email')
    if (!line) {
      line = document.createElement('span')
      line.id = 'p64-signed-in-email'
      line.style.display = 'block'
      line.style.marginTop = '4px'
      line.style.fontSize = '12px'
      line.style.lineHeight = '1.35'
      line.style.color = '#9ca3af'
      line.style.overflowWrap = 'anywhere'
      copy.appendChild(line)
    }

    const email = currentSignedInEmail()
    line.textContent = email ? `Signed in as: ${email}` : 'Signed in'
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

  function applyPatch() {
    forceHideShowcase()
    installUppercaseSearch()
    updateVisibleVersion()
    installRestoreRetryGuard()
    forceAccountEmailLine()
  }

  function init() {
    applyPatch()

    // Re-apply after auth/view changes and delayed mobile rendering.
    const observer = new MutationObserver(() => applyPatch())
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] })

    setTimeout(applyPatch, 250)
    setTimeout(applyPatch, 1000)
    window.addEventListener('pageshow', applyPatch)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true })
  } else {
    init()
  }
})()
