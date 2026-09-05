(() => {
  const RESTORE_FINGERPRINT_KEY = 'pocket64-last-restore-file-v400'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
  const SETS_STORAGE_PREFIX = 'pocket64-sets-v1'
  const SETS_CLOUD_MIGRATION_PREFIX = 'pocket64-sets-cloud-migrated-v1'
  let helperSupabasePromise = null

  function hideShowcase() {
    const screen = document.getElementById('social-screen')
    const toggle = document.querySelector('.custom-toggle[for="is-showcase"]')
    const mainNav = document.getElementById('main-nav')

    if (screen) screen.style.setProperty('display', 'none', 'important')
    if (toggle) toggle.style.setProperty('display', 'none', 'important')
    if (mainNav) mainNav.style.setProperty('grid-template-columns', 'repeat(4,minmax(0,1fr))', 'important')
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

  async function updateVisibleVersion() {
    try {
      const url = new URL('./version.json', window.location.href)
      url.searchParams.set('_', Date.now().toString())
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      const version = String(data?.version || '').trim()
      if (!version) return
      document.querySelectorAll('.version-badge').forEach((badge) => {
        badge.textContent = `Version ${version}`
      })
    } catch {}
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
          parsed?.data?.session?.user?.email ||
          ''

        if (email) return String(email)
      }
    } catch {}
    return ''
  }

  function showAccountEmail() {
    const logout = document.getElementById('logout-btn')
    const card = logout?.closest('.settings-card')
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

    const typed = document.getElementById('email')?.value?.trim() || ''
    const email = typed || authEmailFromStorage()
    const next = email ? `Signed in as: ${email}` : 'Signed in'
    if (line.textContent !== next) line.textContent = next
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


  const nativeStorageSetItem = Storage.prototype.setItem
  let pendingRestoreContext = null
  let restoreSetsPersisting = false

  async function helperSupabase() {
    if (!helperSupabasePromise) {
      helperSupabasePromise = import('https://esm.sh/@supabase/supabase-js@2.102.0')
        .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY))
    }
    return helperSupabasePromise
  }

  async function readBackupForSetRestore(file) {
    const name = String(file?.name || '').toLowerCase()
    if (name.endsWith('.json') || file?.type === 'application/json') {
      return JSON.parse(await file.text())
    }
    if (!window.JSZip) throw new Error('ZIP support is not available.')
    const zip = await window.JSZip.loadAsync(file)
    const entry = zip.file('backup.json')
    if (!entry) throw new Error('backup.json is missing.')
    return JSON.parse(await entry.async('string'))
  }

  function normalizeCapturedSetsState(value) {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      if (!parsed || !Array.isArray(parsed.sets) || !parsed.assignments || typeof parsed.assignments !== 'object') return null
      return {
        version: 1,
        sets: parsed.sets.map((set) => ({
          id: String(set?.id || ''),
          year: String(set?.year || ''),
          name: String(set?.name || '').trim().toUpperCase(),
          total: Math.max(1, Math.floor(Number(set?.total) || 1)),
        })).filter((set) => set.id && set.name),
        assignments: { ...parsed.assignments },
      }
    } catch {
      return null
    }
  }

  function remapSetIdsForAccount(state, sameAccount) {
    if (sameAccount) return state
    const setIdMap = new Map()
    const sets = state.sets.map((set) => {
      const nextId = crypto.randomUUID()
      setIdMap.set(String(set.id), nextId)
      return { ...set, id: nextId }
    })
    const assignments = {}
    for (const [carId, assignment] of Object.entries(state.assignments || {})) {
      const mappedSetId = setIdMap.get(String(assignment?.setId || ''))
      if (!mappedSetId) continue
      assignments[String(carId)] = {
        setId: mappedSetId,
        position: Math.max(1, Math.floor(Number(assignment?.position) || 1)),
      }
    }
    return { version: 1, sets, assignments }
  }

  async function persistCapturedRestoreSets(localKey, capturedState, backup) {
    if (restoreSetsPersisting) return
    restoreSetsPersisting = true
    try {
      const client = await helperSupabase()
      const { data:{ session }, error:sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      const userId = session?.user?.id
      if (!userId) throw new Error('No signed-in Pocket 64 session was found.')

      const expectedSets = Array.isArray(backup?.sets?.sets) ? backup.sets.sets.length : 0
      const expectedAssignments = backup?.sets?.assignments && typeof backup.sets.assignments === 'object'
        ? Object.keys(backup.sets.assignments).length
        : 0

      if (!expectedSets) return
      if (capturedState.sets.length !== expectedSets) {
        throw new Error(`Captured ${capturedState.sets.length} Sets but backup contains ${expectedSets}.`)
      }
      if (Object.keys(capturedState.assignments || {}).length !== expectedAssignments) {
        throw new Error(`Captured ${Object.keys(capturedState.assignments || {}).length} assignments but backup contains ${expectedAssignments}.`)
      }

      const sourceUserId = String(backup?.source_user_id || '').trim()
      const sameAccount = Boolean(sourceUserId && sourceUserId === userId)
      const cloudState = remapSetIdsForAccount(capturedState, sameAccount)

      const setRows = cloudState.sets.map((set) => ({
        id: String(set.id),
        user_id: userId,
        year: Number(set.year),
        name: String(set.name || '').trim().toUpperCase(),
        total: Math.max(1, Math.floor(Number(set.total) || 1)),
        updated_at: new Date().toISOString(),
      }))

      const validSetIds = new Set(setRows.map((row) => row.id))
      const assignmentRows = Object.entries(cloudState.assignments || {})
        .filter(([, assignment]) => assignment && validSetIds.has(String(assignment.setId)))
        .map(([carId, assignment]) => ({
          user_id: userId,
          set_id: String(assignment.setId),
          car_id: String(carId),
          position: Math.max(1, Math.floor(Number(assignment.position) || 1)),
          updated_at: new Date().toISOString(),
        }))

      if (assignmentRows.length !== expectedAssignments) {
        throw new Error(`Prepared ${assignmentRows.length} assignments but backup contains ${expectedAssignments}.`)
      }

      // Replace only this signed-in account's Sets state.
      const { error:assignmentDeleteError } = await client
        .from('pocket64_set_assignments')
        .delete()
        .eq('user_id', userId)
      if (assignmentDeleteError) throw assignmentDeleteError

      const { error:setDeleteError } = await client
        .from('pocket64_sets')
        .delete()
        .eq('user_id', userId)
      if (setDeleteError) throw setDeleteError

      if (setRows.length) {
        const { error:setInsertError } = await client.from('pocket64_sets').insert(setRows)
        if (setInsertError) throw setInsertError
      }

      for (let start = 0; start < assignmentRows.length; start += 100) {
        const chunk = assignmentRows.slice(start, start + 100)
        const { error:assignmentInsertError } = await client.from('pocket64_set_assignments').insert(chunk)
        if (assignmentInsertError) throw assignmentInsertError
      }

      const [{ count:setCount, error:setCountError }, { count:assignmentCount, error:assignmentCountError }] = await Promise.all([
        client.from('pocket64_sets').select('id', { count:'exact', head:true }).eq('user_id', userId),
        client.from('pocket64_set_assignments').select('car_id', { count:'exact', head:true }).eq('user_id', userId),
      ])
      if (setCountError) throw setCountError
      if (assignmentCountError) throw assignmentCountError
      if (setCount !== expectedSets || assignmentCount !== expectedAssignments) {
        throw new Error(`Cloud verification found ${setCount ?? 0}/${expectedSets} Sets and ${assignmentCount ?? 0}/${expectedAssignments} assignments.`)
      }

      // Keep browser-local Sets state identical to the verified cloud state.
      nativeStorageSetItem.call(localStorage, `${SETS_STORAGE_PREFIX}-${userId}`, JSON.stringify(cloudState))
      nativeStorageSetItem.call(localStorage, `${SETS_CLOUD_MIGRATION_PREFIX}-${userId}`, '1')

      window.__p64RestoreSetSummary = {
        sets: expectedSets,
        assignments: expectedAssignments,
        verified: true,
      }

      console.info(`Pocket 64 restore verified: ${expectedSets} Sets and ${expectedAssignments} assignments saved.`)

      // Give the normal restore flow time to finish its final render, then reload once so
      // the app hydrates from the verified cloud Sets state and card icons are guaranteed current.
      setTimeout(() => {
        try {
          sessionStorage.setItem('p64-v504-sets-restored', JSON.stringify({
            sets: expectedSets,
            assignments: expectedAssignments,
          }))
        } catch {}
        window.location.reload()
      }, 900)
    } catch (error) {
      console.error('Pocket 64 v5.0.4 Sets restore failed', error)
      try {
        window.alert(`Cars and photos restored, but Sets could not be saved: ${error.message || error}`)
      } catch {}
    } finally {
      restoreSetsPersisting = false
      pendingRestoreContext = null
    }
  }

  function installRestoreSetsCaptureFix() {
    if (document.documentElement.dataset.restoreSetsCaptureFix === '1') return
    document.documentElement.dataset.restoreSetsCaptureFix = '1'

    // Capture the backup before app.js begins its restore.
    document.addEventListener('change', async (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.id !== 'restore-input') return
      const file = input.files?.[0]
      if (!file) return
      try {
        const backup = await readBackupForSetRestore(file)
        const expectedSets = Array.isArray(backup?.sets?.sets) ? backup.sets.sets.length : 0
        const expectedAssignments = backup?.sets?.assignments && typeof backup.sets.assignments === 'object'
          ? Object.keys(backup.sets.assignments).length
          : 0
        pendingRestoreContext = expectedSets
          ? { backup, expectedSets, expectedAssignments }
          : null
      } catch (error) {
        console.warn('Could not inspect restore backup for Sets', error)
        pendingRestoreContext = null
      }
    }, true)

    // app.js already builds the exact old-car-ID -> new-car-ID mapping and writes the
    // correctly remapped Sets state to localStorage. Capture that exact moment before
    // any later cloud sync can replace it.
    Storage.prototype.setItem = function(key, value) {
      const result = nativeStorageSetItem.call(this, key, value)
      try {
        if (
          this === localStorage &&
          pendingRestoreContext &&
          String(key).startsWith(`${SETS_STORAGE_PREFIX}-`)
        ) {
          const state = normalizeCapturedSetsState(value)
          if (
            state &&
            state.sets.length === pendingRestoreContext.expectedSets &&
            Object.keys(state.assignments || {}).length === pendingRestoreContext.expectedAssignments
          ) {
            // Fire-and-wait in our own task; app.js can continue its normal restore UI.
            queueMicrotask(() => persistCapturedRestoreSets(String(key), state, pendingRestoreContext.backup))
          }
        }
      } catch (error) {
        console.warn('Sets restore capture hook failed', error)
      }
      return result
    }
  }

  function showVerifiedRestoreSummaryAfterReload() {
    try {
      const raw = sessionStorage.getItem('p64-v504-sets-restored')
      if (!raw) return
      sessionStorage.removeItem('p64-v504-sets-restored')
      const summary = JSON.parse(raw)
      setTimeout(() => {
        window.alert(`Restore verified ✓\n\n${summary.sets} Sets and ${summary.assignments} Set assignments restored and saved.`)
      }, 700)
    } catch {}
  }


  function ensureDangerZone() {
    if (document.getElementById('clear-collection-button')) return
    const settingsList = document.querySelector('#settings-screen .settings-list')
    if (!settingsList) return

    const card = document.createElement('div')
    card.className = 'settings-card'
    card.id = 'p64-danger-zone'
    card.style.borderColor = 'rgba(255,88,88,.28)'

    const copy = document.createElement('div')
    copy.className = 'settings-copy'

    const title = document.createElement('strong')
    title.textContent = 'Danger Zone'
    title.style.color = '#ff9a9a'

    const description = document.createElement('span')
    description.textContent = 'Permanently remove every car, saved photo, Set, and Set assignment from this signed-in account.'

    copy.append(title, description)

    const button = document.createElement('button')
    button.id = 'clear-collection-button'
    button.type = 'button'
    button.className = 'settings-mini-button'
    button.textContent = 'Clear Collection'
    button.style.borderColor = 'rgba(255,88,88,.5)'
    button.style.color = '#ffaaaa'

    card.append(copy, button)

    const aboutCard = [...settingsList.children].find((node) =>
      node.querySelector?.('.settings-copy strong')?.textContent?.trim() === 'About'
    )
    if (aboutCard) settingsList.insertBefore(card, aboutCard)
    else settingsList.append(card)
  }

  function collapseRenderedSetYears() {
    document.querySelectorAll('#sets-years .set-year-card.expanded').forEach((section) => {
      section.classList.remove('expanded')
    })
  }

  function installSetsCollapsedByDefault() {
    const host = document.getElementById('sets-years')
    if (!host || host.dataset.defaultCollapsed === '1') return
    host.dataset.defaultCollapsed = '1'
    collapseRenderedSetYears()

    new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === 'childList')) {
        collapseRenderedSetYears()
      }
    }).observe(host, { childList:true, subtree:false })
  }

  function applyPatch() {
    ensureDangerZone()
    hideShowcase()
    installUppercaseSearch()
    installSetsCollapsedByDefault()
    updateVisibleVersion()
    installRestoreRetryGuard()
    installRestoreSetsCaptureFix()
    showAccountEmail()
  }

  ensureDangerZone()

  function init() {
    applyPatch()
    showVerifiedRestoreSummaryAfterReload()

    setTimeout(applyPatch, 300)
    setTimeout(applyPatch, 1200)

    const mainView = document.getElementById('main-view')
    if (mainView) {
      new MutationObserver(() => {
        if (!mainView.classList.contains('hidden')) {
          setTimeout(applyPatch, 0)
        }
      }).observe(mainView, { attributes:true, attributeFilter:['class'] })
    }

    window.addEventListener('pageshow', () => setTimeout(applyPatch, 0))
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true })
  } else {
    init()
  }
})()
