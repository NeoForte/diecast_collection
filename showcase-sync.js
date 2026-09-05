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

  async function helperSupabase() {
    if (!helperSupabasePromise) {
      helperSupabasePromise = import('https://esm.sh/@supabase/supabase-js@2.102.0')
        .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY))
    }
    return helperSupabasePromise
  }

  async function readBackupForRestore(file) {
    const name = String(file?.name || '').toLowerCase()
    if (name.endsWith('.json') || file?.type === 'application/json') {
      return { backup:JSON.parse(await file.text()), zip:null, legacyJson:true }
    }
    if (!window.JSZip) throw new Error('ZIP support is not available. Refresh Pocket 64 and try again.')
    const zip = await window.JSZip.loadAsync(file)
    const entry = zip.file('backup.json')
    if (!entry) throw new Error('This ZIP does not contain backup.json.')
    return { backup:JSON.parse(await entry.async('string')), zip, legacyJson:false }
  }

  function validRestoreBackup(backup) {
    return Boolean(backup && backup.format === 'ajs-garage-backup' && Array.isArray(backup.cars))
  }

  function cleanNullable(value) {
    const valueText = String(value ?? '').trim()
    return valueText || null
  }

  function cleanQuantity(value) {
    const number = Number(value)
    return Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1
  }

  function cleanBoolean(value) {
    if (value === true || value === false) return value
    const normalized = String(value ?? '').trim().toLowerCase()
    return ['1','true','yes'].includes(normalized)
  }

  function cleanDate(value) {
    const raw = String(value || '')
    return Number.isFinite(Date.parse(raw)) ? raw : new Date().toISOString()
  }

  function backupPhotoPath(photoMap, oldId, slot) {
    const entry = photoMap?.[oldId]
    if (!entry) return null
    if (entry && typeof entry === 'object') {
      const path = String(entry[String(slot)] || '')
      return path.startsWith('photos/') ? path : null
    }
    if (slot === 1) {
      const path = String(entry || '')
      return path.startsWith('photos/') ? path : null
    }
    return null
  }

  function buildRestoredSetState(backupSets, carIdMap, sameAccount) {
    const rawSets = Array.isArray(backupSets?.sets) ? backupSets.sets : []
    const rawAssignments = backupSets?.assignments && typeof backupSets.assignments === 'object'
      ? backupSets.assignments
      : {}

    const setIdMap = new Map()
    const sets = rawSets.map((set) => {
      const oldId = String(set?.id || '')
      const id = sameAccount && /^[0-9a-f-]{36}$/i.test(oldId) ? oldId : crypto.randomUUID()
      if (oldId) setIdMap.set(oldId, id)
      return {
        id,
        year:String(set?.year || '').replace(/[^0-9]/g,'').slice(0,4),
        name:String(set?.name || '').trim().toUpperCase(),
        total:Math.max(1, Math.floor(Number(set?.total) || 1)),
      }
    }).filter((set) => set.year.length === 4 && set.name)

    const validSetIds = new Set(sets.map((set) => set.id))
    const assignments = {}
    for (const [oldCarId, assignment] of Object.entries(rawAssignments)) {
      const newCarId = carIdMap.get(String(oldCarId))
      const newSetId = setIdMap.get(String(assignment?.setId || ''))
      if (!newCarId || !newSetId || !validSetIds.has(newSetId)) continue
      assignments[newCarId] = {
        setId:newSetId,
        position:Math.max(1, Math.floor(Number(assignment?.position) || 1)),
      }
    }
    return { version:1, sets, assignments }
  }

  async function replaceCloudSetsExactly(client, userId, state) {
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

    const now = new Date().toISOString()
    const setRows = state.sets.map((set) => ({
      id:set.id,
      user_id:userId,
      year:Number(set.year),
      name:set.name,
      total:set.total,
      updated_at:now,
    }))
    if (setRows.length) {
      const { error:setInsertError } = await client.from('pocket64_sets').insert(setRows)
      if (setInsertError) throw setInsertError
    }

    const assignmentRows = Object.entries(state.assignments).map(([carId, assignment]) => ({
      user_id:userId,
      set_id:assignment.setId,
      car_id:carId,
      position:assignment.position,
      updated_at:now,
    }))
    for (let i = 0; i < assignmentRows.length; i += 100) {
      const { error:assignmentInsertError } = await client
        .from('pocket64_set_assignments')
        .insert(assignmentRows.slice(i, i + 100))
      if (assignmentInsertError) throw assignmentInsertError
    }

    nativeStorageSetItem.call(localStorage, `${SETS_STORAGE_PREFIX}-${userId}`, JSON.stringify(state))
    nativeStorageSetItem.call(localStorage, `${SETS_CLOUD_MIGRATION_PREFIX}-${userId}`, '1')
  }

  async function verifyExactRestore(client, userId, restoredCarIds, state) {
    let foundCars = 0
    for (let i = 0; i < restoredCarIds.length; i += 100) {
      const ids = restoredCarIds.slice(i, i + 100)
      const { count, error } = await client
        .from('cars')
        .select('id', { count:'exact', head:true })
        .eq('user_id', userId)
        .in('id', ids)
      if (error) throw error
      foundCars += Number(count || 0)
    }
    if (foundCars !== restoredCarIds.length) {
      throw new Error(`Car verification found ${foundCars}/${restoredCarIds.length} restored cars.`)
    }

    const [
      { count:setCount, error:setCountError },
      { count:assignmentCount, error:assignmentCountError },
    ] = await Promise.all([
      client.from('pocket64_sets').select('id', { count:'exact', head:true }).eq('user_id', userId),
      client.from('pocket64_set_assignments').select('car_id', { count:'exact', head:true }).eq('user_id', userId),
    ])
    if (setCountError) throw setCountError
    if (assignmentCountError) throw assignmentCountError
    if (Number(setCount || 0) !== state.sets.length) {
      throw new Error(`Set verification found ${Number(setCount || 0)}/${state.sets.length} Sets.`)
    }
    if (Number(assignmentCount || 0) !== Object.keys(state.assignments).length) {
      throw new Error(`Assignment verification found ${Number(assignmentCount || 0)}/${Object.keys(state.assignments).length} assignments.`)
    }
  }

  async function runOwnedRestore(file, input) {
    const client = await helperSupabase()
    const { data:{ session }, error:sessionError } = await client.auth.getSession()
    if (sessionError) throw sessionError
    const userId = session?.user?.id
    if (!userId) throw new Error('Your session expired. Sign in again and retry.')

    const { backup, zip, legacyJson } = await readBackupForRestore(file)
    if (!validRestoreBackup(backup)) throw new Error('This is not a valid Pocket 64 backup.')

    const { count:existingCars, error:existingError } = await client
      .from('cars')
      .select('id', { count:'exact', head:true })
      .eq('user_id', userId)
    if (existingError) throw existingError

    if (Number(existingCars || 0) > 0) {
      const proceed = window.confirm(
        `This garage already contains ${existingCars} car${existingCars === 1 ? '' : 's'}.\n\n` +
        `For a clean backup restore, use Clear Collection first.\n\n` +
        `Continuing can create duplicates or a mixed collection.\n\nContinue anyway?`
      )
      if (!proceed) return
    }

    const sourceUserId = String(backup.source_user_id || '').trim()
    const sameAccount = Boolean(sourceUserId && sourceUserId === userId)
    const photoMap = backup.photos && typeof backup.photos === 'object' ? backup.photos : {}

    const approved = window.confirm(
      `Restore this Pocket 64 backup?\n\n` +
      `${backup.cars.length} car${backup.cars.length === 1 ? '' : 's'}\n` +
      `${Number(backup.photo_count || 0)} photo${Number(backup.photo_count || 0) === 1 ? '' : 's'}\n` +
      `${Array.isArray(backup?.sets?.sets) ? backup.sets.sets.length : 0} Set${Array.isArray(backup?.sets?.sets) && backup.sets.sets.length === 1 ? '' : 's'}\n\n` +
      `Restore will reproduce the backup's saved Set state.`
    )
    if (!approved) return

    const restoreButton = document.getElementById('restore-button')
    const backupButton = document.getElementById('backup-button')
    const originalRestoreText = restoreButton?.textContent || 'Restore Backup'
    if (restoreButton) { restoreButton.disabled = true; restoreButton.textContent = 'Restoring…' }
    if (backupButton) backupButton.disabled = true

    try {
      const { data:existingRows, error:existingRowsError } = await client
        .from('cars')
        .select('id,photo_path,photo2_path,photo3_path')
        .eq('user_id', userId)
      if (existingRowsError) throw existingRowsError
      const existingById = new Map((existingRows || []).map((row) => [String(row.id), row]))

      const carIdMap = new Map()
      const rows = []
      const restoreItems = []
      for (const car of backup.cars) {
        const oldId = String(car?.id || '')
        const targetId = sameAccount && /^[0-9a-f-]{36}$/i.test(oldId) ? oldId : crypto.randomUUID()
        carIdMap.set(oldId, targetId)

        const existing = existingById.get(targetId)
        const row = {
          id:targetId,
          user_id:userId,
          photo_path:existing?.photo_path || null,
          photo2_path:existing?.photo2_path || null,
          photo3_path:existing?.photo3_path || null,
          diecast_brand:cleanNullable(car?.diecast_brand),
          make:cleanNullable(car?.make),
          model:cleanNullable(car?.model),
          model_year:cleanNullable(car?.model_year),
          scale:cleanNullable(car?.scale),
          series_collection:cleanNullable(car?.series_collection),
          category:cleanNullable(car?.category),
          quantity:cleanQuantity(car?.quantity),
          notes:cleanNullable(car?.notes),
          created_at:cleanDate(car?.created_at),
          updated_at:cleanDate(car?.updated_at),
          package_status:cleanNullable(car?.package_status),
          special_status:cleanNullable(car?.special_status),
          exclusive_retailer:cleanNullable(car?.exclusive_retailer),
          exclusive_type:cleanNullable(car?.exclusive_retailer) ? cleanNullable(car?.exclusive_type) : null,
          general_number:cleanNullable(car?.general_number),
          series_collection_number:cleanNullable(car?.series_collection_number),
          color:cleanNullable(car?.color),
          hotwheels_toy_number:cleanNullable(car?.hotwheels_toy_number),
          is_custom:cleanBoolean(car?.is_custom),
          is_favorite:cleanBoolean(car?.is_favorite),
          is_showcase:cleanBoolean(car?.is_showcase),
          pack_size:cleanNullable(car?.special_status) === 'Multipack'
            ? Math.max(2, Math.floor(Number(car?.pack_size) || 5))
            : null,
        }
        rows.push(row)
        restoreItems.push({ oldId, targetId })
      }

      for (let i = 0; i < rows.length; i += 100) {
        if (restoreButton) restoreButton.textContent = `Cars ${Math.min(i + 100, rows.length)}/${rows.length}`
        const { error } = await client.from('cars').upsert(rows.slice(i, i + 100), { onConflict:'id' })
        if (error) throw error
      }

      let processedPhotos = 0
      const photoFailures = []
      if (zip) {
        const photoTasks = []
        for (const item of restoreItems) {
          for (const slot of [1,2,3]) {
            const backupPath = backupPhotoPath(photoMap, item.oldId, slot)
            if (backupPath) photoTasks.push({ ...item, slot, backupPath })
          }
        }

        for (let i = 0; i < photoTasks.length; i += 1) {
          const task = photoTasks[i]
          if (restoreButton) restoreButton.textContent = `Photos ${i + 1}/${photoTasks.length}`
          try {
            const entry = zip.file(task.backupPath)
            if (!entry) throw new Error(`Missing ${task.backupPath}`)
            const blob = await entry.async('blob')
            const suffix = task.slot === 1 ? '' : `-p${task.slot}`
            const targetPath = `${userId}/${task.targetId}${suffix}.jpg`
            const { error:uploadError } = await client.storage
              .from('car-photos')
              .upload(targetPath, blob, { contentType:'image/jpeg', upsert:true })
            if (uploadError) throw uploadError

            const column = task.slot === 1 ? 'photo_path' : `photo${task.slot}_path`
            const { error:updateError } = await client
              .from('cars')
              .update({ [column]:targetPath, updated_at:new Date().toISOString() })
              .eq('id', task.targetId)
              .eq('user_id', userId)
            if (updateError) throw updateError
            processedPhotos += 1
          } catch (error) {
            console.error('Photo restore failed', error)
            photoFailures.push(`${task.oldId} photo ${task.slot}`)
          }
        }
      }

      if (photoFailures.length) {
        throw new Error(`${photoFailures.length} embedded photo${photoFailures.length === 1 ? '' : 's'} failed to restore.`)
      }

      if (restoreButton) restoreButton.textContent = 'Restoring Sets…'
      const exactSetState = buildRestoredSetState(backup.sets, carIdMap, sameAccount)
      await replaceCloudSetsExactly(client, userId, exactSetState)
      await verifyExactRestore(client, userId, restoreItems.map((item) => item.targetId), exactSetState)

      sessionStorage.setItem('p64-v509-finalize-restore', JSON.stringify({
        userId,
        state:exactSetState,
        cars:restoreItems.length,
        photos:processedPhotos,
        sets:exactSetState.sets.length,
        assignments:Object.keys(exactSetState.assignments).length,
        legacyJson:Boolean(legacyJson),
      }))

      if (restoreButton) restoreButton.textContent = 'Finalizing…'
      window.location.reload()
    } finally {
      if (restoreButton) {
        restoreButton.disabled = false
        restoreButton.textContent = originalRestoreText
      }
      if (backupButton) backupButton.disabled = false
      if (input) input.value = ''
    }
  }

  function installOwnedRestore() {
    if (document.documentElement.dataset.p64OwnedRestore === '1') return
    document.documentElement.dataset.p64OwnedRestore = '1'

    document.addEventListener('change', (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.id !== 'restore-input') return
      const file = input.files?.[0]
      if (!file) return

      // v5.0.9 owns the complete restore. app.js never receives this event,
      // so there is no second restore path and no timing race.
      event.preventDefault()
      event.stopImmediatePropagation()

      runOwnedRestore(file, input).catch((error) => {
        console.error('Pocket 64 v5.0.9 restore failed', error)
        nativeAlert(`Restore failed: ${error.message || error}`)
        try { input.value = '' } catch {}
        const restoreButton = document.getElementById('restore-button')
        const backupButton = document.getElementById('backup-button')
        if (restoreButton) { restoreButton.disabled = false; restoreButton.textContent = 'Restore Backup' }
        if (backupButton) backupButton.disabled = false
      })
    }, true)
  }

  async function finalizeOwnedRestoreAfterReload() {
    let payload = null
    try {
      payload = JSON.parse(sessionStorage.getItem('p64-v509-finalize-restore') || 'null')
    } catch {}
    if (!payload?.userId || !payload?.state) return

    try {
      const client = await helperSupabase()
      const { data:{ session }, error:sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      if (!session?.user?.id || session.user.id !== payload.userId) return

      // Normal startup may run the legacy retro-linker. Let it finish, then put the
      // exact backup Sets/assignments back once and re-render the cards.
      await new Promise((resolve) => setTimeout(resolve, 1800))
      await replaceCloudSetsExactly(client, payload.userId, payload.state)
      await verifyExactRestore(
        client,
        payload.userId,
        Object.keys(payload.state.assignments).length
          ? Object.keys(payload.state.assignments)
          : [],
        payload.state
      ).catch(async (error) => {
        // If there were restored cars with no Set assignment, car verification is
        // already completed before reload; only Set verification matters here.
        const [
          { count:setCount, error:setError },
          { count:assignmentCount, error:assignmentError },
        ] = await Promise.all([
          client.from('pocket64_sets').select('id', { count:'exact', head:true }).eq('user_id', payload.userId),
          client.from('pocket64_set_assignments').select('car_id', { count:'exact', head:true }).eq('user_id', payload.userId),
        ])
        if (setError) throw setError
        if (assignmentError) throw assignmentError
        if (Number(setCount || 0) !== Number(payload.sets || 0) ||
            Number(assignmentCount || 0) !== Number(payload.assignments || 0)) throw error
      })

      sessionStorage.removeItem('p64-v509-finalize-restore')

      const search = document.getElementById('search-input')
      if (search) search.dispatchEvent(new Event('input', { bubbles:true }))

      nativeAlert(
        `Restore complete ✓\n\n` +
        `${payload.cars} cars · ${payload.photos} photos · ${payload.sets} Sets · ${payload.assignments} Set assignments\n\n` +
        `Backup restored and verified.`
      )
    } catch (error) {
      console.error('Pocket 64 v5.0.9 final verification failed', error)
      nativeAlert(`Restore verification failed: ${error.message || error}`)
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
    installOwnedRestore()
    showAccountEmail()
  }

  ensureDangerZone()

  function init() {
    applyPatch()
    finalizeOwnedRestoreAfterReload()

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
