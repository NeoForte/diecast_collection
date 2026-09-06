(() => {
  const FIX_VERSION = '5.3.4'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const recentSets = new Map()
  let latestRecentKey = ''

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
    return best
  }

  function rememberNewSetFromSubmit(form) {
    const year = String(form.querySelector('#set-new-year')?.value || '').replace(/[^0-9]/g, '').slice(0, 4)
    const manualName = String(form.querySelector('#set-new-name')?.value || '').trim().toUpperCase()
    const reference = form.querySelector('#set-reference-select')
    const referenceName = reference && reference.value && reference.value !== '__manual__'
      ? String(reference.value).trim().toUpperCase()
      : ''
    const name = manualName || referenceName
    if (year.length !== 4 || !name) return

    requestAnimationFrame(() => {
      for (const key of validSetStorageKeys()) {
        const state = readSetStateForKey(key)
        if (!state) continue
        const match = state.sets.find((set) =>
          String(set.year || '') === year && normalizeSetName(set.name) === normalizeSetName(name)
        )
        if (!match) continue
        const id = String(match.id || '')
        if (!id) continue
        recentSets.set(id, { key, set:{ ...match } })
        latestRecentKey = key
        break
      }
      refreshSetPickerFromStorage()
    })
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

  function rebuildPositionPicker(state, selectedSetId) {
    const position = document.getElementById('set-position')
    const label = document.getElementById('set-position-label')
    if (!position || !label) return

    const active = state.sets.find((set) => String(set.id || '') === String(selectedSetId || '')) || null
    const previous = position.value
    position.replaceChildren(new Option('', ''))

    if (active) {
      const total = Math.max(1, Math.min(99, Math.floor(Number(active.total) || 1)))
      for (let i = 1; i <= total; i += 1) position.append(new Option(`${i}/${total}`, String(i)))
      if ([...position.options].some((option) => option.value === previous)) position.value = previous
    }
    label.classList.toggle('hidden', !active)
  }

  function refreshSetPickerFromStorage() {
    restoreRecentSets()
    const select = document.getElementById('set-select')
    if (!select) return

    const key = currentSetStorageKey()
    const state = key ? readSetStateForKey(key) : null
    if (!state?.sets?.length) return

    const previous = select.value
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

    select.replaceChildren(new Option('', ''), new Option('+ NEW SET', '__new__'))
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
    rebuildPositionPicker(state, select.value)
  }

  function installSetPickerRepair() {
    if (document.documentElement.dataset.p64SetPicker534 === '1') return
    document.documentElement.dataset.p64SetPicker534 = '1'

    document.addEventListener('submit', (event) => {
      const form = event.target
      if (form?.id === 'set-create-form') rememberNewSetFromSubmit(form)
    })

    for (const id of ['add-button', 'empty-add-button']) {
      document.getElementById(id)?.addEventListener('click', () => {
        requestAnimationFrame(() => requestAnimationFrame(refreshSetPickerFromStorage))
      }, true)
    }

    const select = document.getElementById('set-select')
    select?.addEventListener('pointerdown', refreshSetPickerFromStorage, true)
    select?.addEventListener('focus', refreshSetPickerFromStorage, true)

    // Recheck after returning from background or another iPhone app.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestAnimationFrame(refreshSetPickerFromStorage)
    })
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
