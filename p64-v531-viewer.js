(() => {
  const FIX_VERSION = '5.3.5'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const recentSets = new Map()
  let latestRecentKey = ''
  let pendingSetCreate = null
  let tuningSetMenu = false

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => {
      el.textContent = `Version ${FIX_VERSION}`
    })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function normalizeSetName(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  }

  function readSetStateForKey(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null')
      if (!parsed || !Array.isArray(parsed.sets) || !parsed.assignments || typeof parsed.assignments !== 'object') return null
      return parsed
    } catch {
      return null
    }
  }

  function validSetStorageKeys() {
    const keys = []
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || ''
        if (key.startsWith(SETS_PREFIX) && !key.endsWith('-signed-out') && readSetStateForKey(key)) keys.push(key)
      }
    } catch {}
    return keys
  }

  function currentSetStorageKey() {
    if (latestRecentKey && readSetStateForKey(latestRecentKey)) return latestRecentKey

    const select = document.getElementById('set-select')
    const optionIds = new Set(
      [...(select?.options || [])]
        .map((option) => option.value)
        .filter((value) => value && value !== '__new__')
    )

    let best = ''
    let bestScore = -1
    for (const key of validSetStorageKeys()) {
      const state = readSetStateForKey(key)
      if (!state) continue
      const score = state.sets.reduce((sum, set) => sum + (optionIds.has(String(set.id || '')) ? 1 : 0), 0)
      if (score > bestScore) {
        best = key
        bestScore = score
      }
    }
    return best || validSetStorageKeys()[0] || ''
  }

  function restoreRecentSets() {
    for (const [id, entry] of recentSets) {
      const state = readSetStateForKey(entry.key)
      if (!state) continue
      if (state.sets.some((set) => String(set.id || '') === id)) continue
      state.sets.push({ ...entry.set })
      try {
        localStorage.setItem(entry.key, JSON.stringify(state))
      } catch {}
    }
  }

  function requestedPositionFromEditor(total) {
    const numberText = String(document.getElementById('series-collection-number')?.value || '')
    const numberMatch = numberText.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (!numberMatch) return 0
    const position = Math.floor(Number(numberMatch[1]) || 0)
    return position >= 1 && position <= total ? position : 0
  }

  function rebuildPositionPicker(state, selectedSetId, preferredPosition = '') {
    const position = document.getElementById('set-position')
    const label = document.getElementById('set-position-label')
    if (!position || !label) return

    const active = state.sets.find((set) => String(set.id || '') === String(selectedSetId || '')) || null
    position.replaceChildren(new Option('', ''))

    if (!active) {
      label.classList.add('hidden')
      return
    }

    const total = Math.max(1, Math.min(99, Math.floor(Number(active.total) || 1)))
    for (let i = 1; i <= total; i += 1) position.append(new Option(`${i}/${total}`, String(i)))

    let chosen = Math.floor(Number(preferredPosition) || 0)
    if (!(chosen >= 1 && chosen <= total)) chosen = requestedPositionFromEditor(total)
    if (!(chosen >= 1 && chosen <= total)) {
      const used = new Set(
        Object.values(state.assignments || {})
          .filter((assignment) => String(assignment?.setId || '') === String(active.id || ''))
          .map((assignment) => Math.floor(Number(assignment?.position) || 0))
      )
      chosen = Array.from({ length:total }, (_, index) => index + 1).find((slot) => !used.has(slot)) || 1
    }
    position.value = String(chosen)
    label.classList.remove('hidden')
  }

  function refreshSetPickerFromStorage(preferredSetId = '', preferredPosition = '') {
    restoreRecentSets()
    const select = document.getElementById('set-select')
    if (!select) return

    const key = currentSetStorageKey()
    const state = key ? readSetStateForKey(key) : null
    if (!state) return

    const previous = preferredSetId || select.value
    const groups = new Map()
    for (const raw of state.sets) {
      const year = String(raw.year || '').replace(/[^0-9]/g, '').slice(0, 4)
      const id = String(raw.id || '')
      const name = String(raw.name || '').trim().toUpperCase()
      const total = Math.max(1, Math.min(99, Math.floor(Number(raw.total) || 1)))
      if (!year || !id || !name) continue
      if (!groups.has(year)) groups.set(year, [])
      groups.get(year).push({ id, name, total })
    }

    select.replaceChildren(new Option('', ''), new Option('CREATE A NEW SET', '__new__'))
    const years = [...groups.keys()].sort((a, b) => Number(b) - Number(a))
    for (const year of years) {
      const group = document.createElement('optgroup')
      group.label = year
      groups.get(year)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity:'base' }))
        .forEach((set) => group.append(new Option(`${set.name} (${set.total})`, set.id)))
      select.append(group)
    }

    if ([...select.options].some((option) => option.value === previous)) select.value = previous
    rebuildPositionPicker(state, select.value, preferredPosition)
  }

  function tuneCreateSetMenu() {
    if (tuningSetMenu) return
    const select = document.getElementById('set-reference-select')
    if (!select) return
    const manual = [...select.options].find((option) => option.value === '__manual__')
    if (!manual) return

    tuningSetMenu = true
    try {
      const current = select.value
      manual.textContent = 'CREATE A NEW SET'
      select.removeChild(manual)
      select.insertBefore(manual, select.firstChild)
      if (current) select.value = current
    } finally {
      tuningSetMenu = false
    }
  }

  function captureNewSetSubmit(event) {
    const form = event.target
    if (form?.id !== 'set-create-form') return
    const year = String(form.querySelector('#set-new-year')?.value || '').replace(/[^0-9]/g, '').slice(0, 4)
    const manualName = String(form.querySelector('#set-new-name')?.value || '').trim().toUpperCase()
    const reference = form.querySelector('#set-reference-select')
    const referenceName = reference && reference.value && reference.value !== '__manual__'
      ? String(reference.value).trim().toUpperCase()
      : ''
    pendingSetCreate = {
      year,
      name:manualName || referenceName,
      openedFromEditor:Boolean(document.getElementById('editor-screen')?.classList.contains('active')),
    }
  }

  function finalizeNewSetSubmit(event) {
    if (event.target?.id !== 'set-create-form' || !pendingSetCreate) return
    const request = pendingSetCreate
    pendingSetCreate = null
    if (request.year.length !== 4 || !request.name) return

    let found = null
    let foundKey = ''
    for (const key of validSetStorageKeys()) {
      const state = readSetStateForKey(key)
      if (!state) continue
      const match = state.sets.find((set) =>
        String(set.year || '') === request.year && normalizeSetName(set.name) === normalizeSetName(request.name)
      )
      if (!match) continue
      found = { ...match }
      foundKey = key
      break
    }
    if (!found || !foundKey) return

    const id = String(found.id || '')
    if (!id) return
    recentSets.set(id, { key:foundKey, set:found })
    latestRecentKey = foundKey

    if (request.openedFromEditor) {
      const series = document.getElementById('series')
      if (series && !String(series.value || '').trim()) series.value = String(found.name || '').toUpperCase()
      refreshSetPickerFromStorage(id, '')
    } else {
      refreshSetPickerFromStorage()
    }

    let passes = 0
    const guard = setInterval(() => {
      passes += 1
      restoreRecentSets()
      if (request.openedFromEditor) {
        const currentPosition = document.getElementById('set-position')?.value || ''
        refreshSetPickerFromStorage(id, currentPosition)
      }
      if (passes >= 80) clearInterval(guard)
    }, 250)
  }

  function installSetPickerRepair() {
    if (document.documentElement.dataset.p64SetPicker535 === '1') return
    document.documentElement.dataset.p64SetPicker535 = '1'

    document.addEventListener('submit', captureNewSetSubmit, true)
    document.addEventListener('submit', finalizeNewSetSubmit, false)

    for (const id of ['add-button', 'empty-add-button']) {
      document.getElementById(id)?.addEventListener('click', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => refreshSetPickerFromStorage()))
      }, true)
    }

    const select = document.getElementById('set-select')
    select?.addEventListener('pointerdown', () => refreshSetPickerFromStorage(select.value, document.getElementById('set-position')?.value || ''), true)
    select?.addEventListener('focus', () => refreshSetPickerFromStorage(select.value, document.getElementById('set-position')?.value || ''), true)

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestAnimationFrame(() => refreshSetPickerFromStorage())
    })

    new MutationObserver(tuneCreateSetMenu).observe(document.body, { childList:true, subtree:true })
    tuneCreateSetMenu()
  }

  function tuneTextInput(input, { autocorrect = true, spellcheck = true } = {}) {
    if (!input) return
    input.setAttribute('autocomplete', 'on')
    input.setAttribute('autocorrect', autocorrect ? 'on' : 'off')
    input.setAttribute('autocapitalize', 'characters')
    input.setAttribute('spellcheck', spellcheck ? 'true' : 'false')
  }

  function installIosTextEntryFixes() {
    const naturalTextIds = ['model', 'series', 'custom-brand', 'custom-color']
    const codeTextIds = ['hotwheels-toy-number', 'general-number', 'series-collection-number']

    naturalTextIds.forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:true, spellcheck:true }))
    codeTextIds.forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:false, spellcheck:false }))

    const tuneDynamicInputs = () => {
      tuneTextInput(document.getElementById('set-new-name'), { autocorrect:true, spellcheck:true })
      tuneTextInput(document.getElementById('set-edit-name'), { autocorrect:true, spellcheck:true })
      tuneCreateSetMenu()
    }

    tuneDynamicInputs()
    new MutationObserver(tuneDynamicInputs).observe(document.body, { childList:true, subtree:true })
  }

  function boot() {
    syncDisplayedVersion()
    installSetPickerRepair()
    installIosTextEntryFixes()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true })
  } else {
    boot()
  }
})()
