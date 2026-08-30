(() => {
  const STYLE_ID = 'p64-v345-cleanup-style'
  const RESTORE_FINGERPRINT_KEY = 'pocket64-last-restore-file-v345'

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #social-nav { display:none !important; }
      #social-screen { display:none !important; }
      .custom-toggle[for="is-showcase"] { display:none !important; }
      #main-nav { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
      #search-input { text-transform:uppercase; }
      .entry-options-row:has(#is-showcase) { grid-template-columns:auto 1fr !important; }
      #p64-signed-in-email {
        display:block;
        margin-top:4px;
        font-size:12px;
        line-height:1.35;
        color:#9ca3af;
        overflow-wrap:anywhere;
      }
    `
    document.head.append(style)
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
        const email =
          parsed?.user?.email ||
          parsed?.currentSession?.user?.email ||
          parsed?.session?.user?.email ||
          ''
        if (email) return String(email)
      }
    } catch {}
    return ''
  }

  function currentSignedInEmail() {
    const typed = document.getElementById('email')?.value?.trim()
    return typed || authEmailFromStorage()
  }

  function ensureSignedInEmail() {
    const accountButton = document.getElementById('logout-btn')
    const card = accountButton?.closest('.settings-card')
    const copy = card?.querySelector('.settings-copy')
    if (!copy) return

    let line = document.getElementById('p64-signed-in-email')
    if (!line) {
      line = document.createElement('span')
      line.id = 'p64-signed-in-email'
      copy.append(line)
    }

    const email = currentSignedInEmail()
    line.textContent = email ? `Signed in as: ${email}` : 'Signed in account: loading…'
  }

  function watchSignedInEmail() {
    ensureSignedInEmail()

    const emailInput = document.getElementById('email')
    emailInput?.addEventListener('input', ensureSignedInEmail)

    const mainView = document.getElementById('main-view')
    if (mainView) {
      new MutationObserver(() => {
        if (!mainView.classList.contains('hidden')) {
          setTimeout(ensureSignedInEmail, 0)
          setTimeout(ensureSignedInEmail, 400)
        }
      }).observe(mainView, { attributes:true, attributeFilter:['class'] })
    }

    window.addEventListener('pageshow', () => setTimeout(ensureSignedInEmail, 0))
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
    installUppercaseSearch()
    updateVisibleVersion()
    installRestoreRetryGuard()
    watchSignedInEmail()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true })
  } else {
    init()
  }
})()
