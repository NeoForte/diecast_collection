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
  const nativeAlert = window.alert.bind(window)
  let restoreGateBypass = false
  let restoreFlowActive = false
  let suppressedRestoreSummary = null
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
          const expectedRestore = (() => {
            try { return JSON.parse(sessionStorage.getItem('p64-v508-restore-expected') || '{}') } catch { return {} }
          })()
          const carPhotoSummary = (() => {
            try { return JSON.parse(sessionStorage.getItem('p64-v508-car-photo-summary') || '{}') } catch { return {} }
          })()
          sessionStorage.setItem('p64-v506-exact-restore-state', JSON.stringify({
            state: cloudState,
            expectedSets,
            expectedAssignments,
            expectedCars: Number(carPhotoSummary.cars || expectedRestore.expectedCars || 0),
            expectedPhotos: Number(carPhotoSummary.photos || expectedRestore.expectedPhotos || 0),
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

  function parseRestoreCompleteMessage(message) {
    const text = String(message || '')
    const match = text.match(/Restore complete:\s*(\d+)\s+cars?\s+and\s+(\d+)\s+embedded photos?\s+processed/i)
    if (!match) return null
    return { cars:Number(match[1]), photos:Number(match[2]) }
  }

  function installRestoreSetsCaptureFix() {
    if (document.documentElement.dataset.restoreSetsCaptureFix === '1') return
    document.documentElement.dataset.restoreSetsCaptureFix = '1'

    // Keep the normal car/photo completion popup from appearing in the middle of a
    // restore. We show one consolidated result only after Sets are verified too.
    window.alert = (message) => {
      if (restoreFlowActive) {
        const parsed = parseRestoreCompleteMessage(message)
        if (parsed) {
          suppressedRestoreSummary = parsed
          try {
            sessionStorage.setItem('p64-v508-car-photo-summary', JSON.stringify(parsed))
          } catch {}
          return
        }
      }
      return nativeAlert(message)
    }

    // Gate Restore before app.js sees the file. This fixes the race that sometimes
    // allowed cars/photos to restore before the backup's Sets metadata was captured.
    document.addEventListener('change', async (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.id !== 'restore-input') return

      if (restoreGateBypass) {
        restoreGateBypass = false
        return
      }

      const file = input.files?.[0]
      if (!file) return

      event.preventDefault()
      event.stopImmediatePropagation()

      try {
        const backup = await readBackupForSetRestore(file)
        const expectedSets = Array.isArray(backup?.sets?.sets) ? backup.sets.sets.length : 0
        const expectedAssignments = backup?.sets?.assignments && typeof backup.sets.assignments === 'object'
          ? Object.keys(backup.sets.assignments).length
          : 0
        const expectedCars = Number(backup?.car_count) || (Array.isArray(backup?.cars) ? backup.cars.length : 0)
        const expectedPhotos = Number(backup?.photo_count) || 0

        const client = await helperSupabase()
        const { data:{ session }, error:sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        const userId = session?.user?.id
        if (!userId) throw new Error('No signed-in Pocket 64 session was found.')

        const { count:existingCars, error:countError } = await client
          .from('cars')
          .select('id', { count:'exact', head:true })
          .eq('user_id', userId)
        if (countError) throw countError

        if ((existingCars ?? 0) > 0) {
          const proceed = window.confirm(
            `This garage already contains ${existingCars} car${existingCars === 1 ? '' : 's'}.\n\n` +
            `For a clean backup restore, use Clear Collection first.\n\n` +
            `Continuing may create duplicate cars or a mixed collection.\n\nContinue anyway?`
          )
          if (!proceed) {
            input.value = ''
            return
          }
        }

        pendingRestoreContext = {
          backup,
          expectedSets,
          expectedAssignments,
          expectedCars,
          expectedPhotos,
        }
        restoreFlowActive = true
        suppressedRestoreSummary = null
        try {
          sessionStorage.setItem('p64-v508-restore-expected', JSON.stringify({
            expectedCars, expectedPhotos, expectedSets, expectedAssignments
          }))
        } catch {}

        // Now that backup metadata is safely captured, let the normal restore handler run.
        restoreGateBypass = true
        input.dispatchEvent(new Event('change', { bubbles:true }))
      } catch (error) {
        restoreFlowActive = false
        pendingRestoreContext = null
        console.error('Pocket 64 restore preflight failed', error)
        nativeAlert(`Restore could not start: ${error.message || error}`)
      }
    }, true)

    // app.js builds the exact old-car-ID -> new-car-ID mapping and writes the remapped
    // Sets state locally. Capture that state immediately and persist it to Supabase.
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
            queueMicrotask(() => persistCapturedRestoreSets(String(key), state, pendingRestoreContext.backup))
          }
        }
      } catch (error) {
        console.warn('Sets restore capture hook failed', error)
      }
      return result
    }
  }

  async function enforceExactRestoreStateAfterReload() {
    let payload = null
    try {
      const raw = sessionStorage.getItem('p64-v506-exact-restore-state')
      if (!raw) return
      payload = JSON.parse(raw)
    } catch {
      return
    }
    const state = payload?.state
    const expectedSets = Number(payload?.expectedSets) || 0
    const expectedAssignments = Number(payload?.expectedAssignments) || 0
    const expectedCars = Number(payload?.expectedCars) || 0
    const expectedPhotos = Number(payload?.expectedPhotos) || 0
    if (!state || !Array.isArray(state.sets) || !state.assignments || !expectedSets) return

    try {
      const client = await helperSupabase()
      const { data:{ session }, error:sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      const userId = session?.user?.id
      if (!userId) throw new Error('No signed-in Pocket 64 session was found.')

      // Wait until normal app startup/retro-linking has had a chance to finish.
      await new Promise((resolve) => setTimeout(resolve, 1800))

      const setRows = state.sets.map((set) => ({
        id:String(set.id),
        user_id:userId,
        year:Number(set.year),
        name:String(set.name || '').trim().toUpperCase(),
        total:Math.max(1, Math.floor(Number(set.total) || 1)),
        updated_at:new Date().toISOString(),
      }))
      const validSetIds = new Set(setRows.map((row) => row.id))
      const assignmentRows = Object.entries(state.assignments || {})
        .filter(([, assignment]) => assignment && validSetIds.has(String(assignment.setId)))
        .map(([carId, assignment]) => ({
          user_id:userId,
          set_id:String(assignment.setId),
          car_id:String(carId),
          position:Math.max(1, Math.floor(Number(assignment.position) || 1)),
          updated_at:new Date().toISOString(),
        }))

      if (setRows.length !== expectedSets || assignmentRows.length !== expectedAssignments) {
        throw new Error(`Exact restore state is ${setRows.length}/${expectedSets} Sets and ${assignmentRows.length}/${expectedAssignments} assignments.`)
      }

      // Remove anything retro-linking or migration added after the restore.
      const { error:assignmentDeleteError } = await client.from('pocket64_set_assignments').delete().eq('user_id', userId)
      if (assignmentDeleteError) throw assignmentDeleteError
      const { error:setDeleteError } = await client.from('pocket64_sets').delete().eq('user_id', userId)
      if (setDeleteError) throw setDeleteError

      const { error:setInsertError } = await client.from('pocket64_sets').insert(setRows)
      if (setInsertError) throw setInsertError
      for (let start = 0; start < assignmentRows.length; start += 100) {
        const { error:assignmentInsertError } = await client.from('pocket64_set_assignments').insert(assignmentRows.slice(start, start + 100))
        if (assignmentInsertError) throw assignmentInsertError
      }

      nativeStorageSetItem.call(localStorage, `${SETS_STORAGE_PREFIX}-${userId}`, JSON.stringify(state))
      nativeStorageSetItem.call(localStorage, `${SETS_CLOUD_MIGRATION_PREFIX}-${userId}`, '1')

      const [
        { count:setCount, error:setCountError },
        { count:assignmentCount, error:assignmentCountError },
        { count:carCount, error:carCountError },
      ] = await Promise.all([
        client.from('pocket64_sets').select('id', { count:'exact', head:true }).eq('user_id', userId),
        client.from('pocket64_set_assignments').select('car_id', { count:'exact', head:true }).eq('user_id', userId),
        client.from('cars').select('id', { count:'exact', head:true }).eq('user_id', userId),
      ])
      if (setCountError) throw setCountError
      if (assignmentCountError) throw assignmentCountError
      if (carCountError) throw carCountError
      if (setCount !== expectedSets || assignmentCount !== expectedAssignments) {
        throw new Error(`Final verification found ${setCount ?? 0}/${expectedSets} Sets and ${assignmentCount ?? 0}/${expectedAssignments} assignments.`)
      }
      if (expectedCars && carCount !== expectedCars) {
        throw new Error(`Final verification found ${carCount ?? 0}/${expectedCars} cars.`)
      }

      sessionStorage.removeItem('p64-v506-exact-restore-state')
      sessionStorage.removeItem('p64-v508-restore-expected')
      sessionStorage.removeItem('p64-v508-car-photo-summary')
      restoreFlowActive = false
      pendingRestoreContext = null

      // Re-render collection cards from the exact local Sets state without another reload.
      const search = document.getElementById('search-input')
      if (search) search.dispatchEvent(new Event('input', { bubbles:true }))

      setTimeout(() => {
        const pieces = []
        if (expectedCars) pieces.push(`${expectedCars} cars`)
        if (expectedPhotos) pieces.push(`${expectedPhotos} photos processed`)
        pieces.push(`${expectedSets} Sets`)
        pieces.push(`${expectedAssignments} Set assignments`)
        nativeAlert(`Restore complete ✓\n\n${pieces.join(' · ')}\n\nBackup restored and verified.`)
      }, 250)
    } catch (error) {
      restoreFlowActive = false
      pendingRestoreContext = null
      console.error('Pocket 64 v5.0.8 restore verification failed', error)
      try { nativeAlert(`Restore verification failed: ${error.message || error}`) } catch {}
    }
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


  const FAQ_ITEMS = [
    ['Can I restore a backup into a garage that already has cars?',
     'Pocket 64 will warn you first. For a true backup replacement, Clear Collection before restoring. Continuing into a non-empty garage can create duplicates or a mixed collection.'],
    ['What does a Pocket 64 backup save?',
     'A backup is a snapshot of your collection at the time you create it. It includes your cars, saved car photos, Sets, and Set assignments. Keep the ZIP file somewhere safe.'],
    ['How often should I make a backup?',
     'Any time you make a lot of changes, and periodically as your collection grows. A fresh backup gives you the best restore point if you ever need it.'],
    ['Does Restore erase my current collection first?',
     'No. Restore is not intended to be your everyday delete tool. For a clean test or a true replacement restore, use Clear Collection first, then restore the backup you want.'],
    ['What should a Restore bring back?',
     'A restore should reproduce the data that existed when that backup was created — including cars, photos, Sets, and Set assignments. It does not recreate changes made after the backup date.'],
    ['Why might a restored collection look older than my main collection?',
     'Because a backup is a snapshot. Cars, Sets, photos, or other changes added after that backup was made will not be in that file.'],
    ['Where is Clear Collection?',
     'Open Settings and look for Danger Zone. Clear Collection permanently removes the signed-in account’s cars, saved photos, Sets, and Set assignments. Use it carefully — it cannot be undone unless you have a backup.'],
    ['Does Clear Collection affect another user?',
     'No. Collection data is tied to the signed-in account. Clearing one account should not clear another user’s garage.'],
    ['Are my car photos included in a backup?',
     'Yes. Pocket 64 portable backups are designed to include the saved car photos along with the collection data. Larger collections can take longer to export or restore because of the images.'],
    ['What are Sets?',
     'Sets are your manually created groups of cars. You can create a Set, give it a year/name/size, and assign owned cars to positions inside it.'],
    ['Will Pocket 64 automatically create Sets for me?',
     'No. Set creation stays manual so your Sets list remains under your control. When applicable, Pocket 64 can help match a car to an existing Set, but it should not invent new Sets during a backup restore.'],
    ['What does the Set icon on a car mean?',
     'It means that car is assigned to one of your Sets. Open the car or Sets area to view the assignment.'],
    ['Can two people use Pocket 64 separately?',
     'Yes. Each person should use their own Pocket 64 account. Collections, Sets, favorites, photos, and other personal data are associated with that account.'],
    ['What does Favorite do?',
     'Favorite is your personal marker for cars you especially like. Favorites can be identified in the collection and viewed through the related Stats/filter tools.'],
    ['What is Showcase?',
     'Showcase lets you flag cars you want highlighted separately from the rest of the collection. It does not change ownership or quantity.'],
    ['How does Search work?',
     'Search can help find cars using identifying information such as model or toy number. Entering a Hot Wheels toy number is especially useful when multiple releases have similar names.'],
    ['Why can the same toy number show more than one result?',
     'A toy number can sometimes be associated with multiple releases, variants, packaging, or catalog records. Use the photo and other details to choose the correct one.'],
    ['Why does Pocket 64 ask me to verify my email?',
     'Email verification helps confirm that the address belongs to you and protects account access. Follow the verification link sent after account creation.'],
    ['I forgot my password. What do I do?',
     'Use the password-reset option on the sign-in screen. Follow the email link and return to Pocket 64 to choose a new password.'],
    ['How do I contact support?',
     'Open Settings and use Contact Support. Choose the closest category and describe what happened. Include useful details such as what you were doing and any message you saw.'],
    ['Where can I see my Pocket 64 version?',
     'Open Settings and look at the About section. The version number is useful when reporting a problem or checking that an update has deployed.'],
    ['The app updated but something still looks old. What should I try?',
     'First confirm the version number in Settings. If the new version is shown, close and reopen Pocket 64. If needed, refresh the browser/PWA before doing anything destructive.'],
    ['Can I use Pocket 64 on more than one device?',
     'Yes, as long as you sign in with the same account. Your Supabase-backed collection data follows the account; local browser state and caches can differ by device.'],
  ]

  function ensureFaqStyles() {
    if (document.getElementById('p64-faq-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-faq-styles'
    style.textContent = `
      #p64-faq-overlay{position:fixed;inset:0;z-index:9999;background:var(--page-bg,#000);overflow:auto;padding:env(safe-area-inset-top) 16px calc(32px + env(safe-area-inset-bottom));}
      #p64-faq-overlay.hidden{display:none!important}
      .p64-faq-shell{max-width:760px;margin:0 auto}
      .p64-faq-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:14px 0 12px;background:inherit}
      .p64-faq-top h2{margin:0;flex:1;font-size:24px}
      .p64-faq-back{min-width:76px}
      .p64-faq-intro{opacity:.78;line-height:1.45;margin:0 0 14px}
      .p64-faq-search{width:100%;box-sizing:border-box;margin:0 0 14px;padding:12px 14px;border-radius:12px;border:1px solid rgba(128,128,128,.35);background:rgba(128,128,128,.10);color:inherit;font:inherit}
      .p64-faq-item{border:1px solid rgba(128,128,128,.22);border-radius:14px;margin:0 0 10px;overflow:hidden;background:rgba(128,128,128,.06)}
      .p64-faq-item summary{cursor:pointer;padding:14px 16px;font-weight:700;list-style:none}
      .p64-faq-item summary::-webkit-details-marker{display:none}
      .p64-faq-item summary:after{content:'+';float:right;opacity:.65}
      .p64-faq-item[open] summary:after{content:'–'}
      .p64-faq-answer{padding:0 16px 15px;line-height:1.48;opacity:.86}
      .p64-faq-empty{padding:24px 4px;text-align:center;opacity:.7}
    `
    document.head.append(style)
  }

  function ensureFaqPage() {
    ensureFaqStyles()
    if (!document.getElementById('p64-faq-overlay')) {
      const overlay = document.createElement('section')
      overlay.id = 'p64-faq-overlay'
      overlay.className = 'hidden'
      overlay.innerHTML = `
        <div class="p64-faq-shell">
          <div class="p64-faq-top">
            <button type="button" class="settings-mini-button p64-faq-back">Back</button>
            <h2>Help & FAQs</h2>
          </div>
          <p class="p64-faq-intro">Quick answers for the things people are most likely to wonder about while using Pocket 64.</p>
          <input id="p64-faq-search" class="p64-faq-search" type="search" placeholder="Search FAQs…" autocomplete="off">
          <div id="p64-faq-list"></div>
          <div id="p64-faq-empty" class="p64-faq-empty hidden">No matching questions found.</div>
        </div>`
      document.body.append(overlay)

      const list = overlay.querySelector('#p64-faq-list')
      for (const [question, answer] of FAQ_ITEMS) {
        const item = document.createElement('details')
        item.className = 'p64-faq-item'
        item.dataset.search = `${question} ${answer}`.toLowerCase()
        const summary = document.createElement('summary')
        summary.textContent = question
        const body = document.createElement('div')
        body.className = 'p64-faq-answer'
        body.textContent = answer
        item.append(summary, body)
        list.append(item)
      }

      const close = () => {
        overlay.classList.add('hidden')
        document.body.style.overflow = ''
      }
      overlay.querySelector('.p64-faq-back').addEventListener('click', close)
      overlay.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close()
      })
      overlay.querySelector('#p64-faq-search').addEventListener('input', (event) => {
        const term = String(event.target.value || '').trim().toLowerCase()
        let visible = 0
        overlay.querySelectorAll('.p64-faq-item').forEach((item) => {
          const show = !term || item.dataset.search.includes(term)
          item.classList.toggle('hidden', !show)
          if (show) visible += 1
        })
        overlay.querySelector('#p64-faq-empty').classList.toggle('hidden', visible !== 0)
      })
    }

    if (!document.getElementById('p64-faq-settings-card')) {
      const settingsList = document.querySelector('#settings-screen .settings-list')
      if (!settingsList) return
      const card = document.createElement('div')
      card.className = 'settings-card'
      card.id = 'p64-faq-settings-card'
      card.innerHTML = `
        <div class="settings-copy">
          <strong>Help & FAQs</strong>
          <span>Backups, restores, Sets, accounts, photos, search, updates, and other common questions.</span>
        </div>
        <button id="p64-open-faq" type="button" class="settings-mini-button">Open</button>`
      const supportCard = [...settingsList.children].find((node) =>
        node.querySelector?.('.settings-copy strong')?.textContent?.trim() === 'Contact Support'
      )
      if (supportCard) settingsList.insertBefore(card, supportCard)
      else settingsList.append(card)

      card.querySelector('#p64-open-faq').addEventListener('click', () => {
        const overlay = document.getElementById('p64-faq-overlay')
        overlay?.classList.remove('hidden')
        document.body.style.overflow = 'hidden'
        setTimeout(() => document.getElementById('p64-faq-search')?.focus(), 80)
      })
    }
  }

  function applyPatch() {
    ensureDangerZone()
    ensureFaqPage()
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
    enforceExactRestoreStateAfterReload()

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
