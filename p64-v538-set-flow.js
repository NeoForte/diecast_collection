(() => {
  const VERSION = '5.3.8'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
  const AUTH_KEY = 'sb-ftjayqjpgifdipmjloxx-auth-token'
  const SETS_PREFIX = 'pocket64-sets-v1-'

  function authContext() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
      const session = raw?.currentSession || raw?.session || raw
      return {
        accessToken: session?.access_token || raw?.access_token || '',
        userId: session?.user?.id || raw?.user?.id || '',
      }
    } catch {
      return { accessToken:'', userId:'' }
    }
  }

  function stateKey(userId) { return `${SETS_PREFIX}${userId}` }

  function readState(userId) {
    try {
      const parsed = JSON.parse(localStorage.getItem(stateKey(userId)) || 'null')
      if (parsed && Array.isArray(parsed.sets) && parsed.assignments && typeof parsed.assignments === 'object') return parsed
    } catch {}
    return { sets:[], assignments:{} }
  }

  function writeState(userId, state) {
    localStorage.setItem(stateKey(userId), JSON.stringify(state))
  }

  function normalize(value) {
    return String(value || '').trim().toUpperCase().replace(/[’‘]/g, "'").replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
  }

  function requestedPosition(total) {
    const match = String(document.getElementById('series-collection-number')?.value || '').trim().match(/^(\d+)\s*\/\s*(\d+)$/)
    const position = match ? Math.floor(Number(match[1]) || 0) : 0
    return position >= 1 && position <= total ? position : 1
  }

  function tuneSetPickerLabel() {
    const select = document.getElementById('set-select')
    if (!select) return
    const option = [...select.options].find((item) => item.value === '__new__')
    if (option) option.textContent = 'CREATE A NEW SET'
  }

  function selectSetForEditor(set, position) {
    const select = document.getElementById('set-select')
    if (!select) return

    if (![...select.options].some((option) => option.value === set.id)) {
      let group = [...select.querySelectorAll('optgroup')].find((item) => item.label === String(set.year))
      if (!group) {
        group = document.createElement('optgroup')
        group.label = String(set.year)
        select.append(group)
      }
      group.append(new Option(`${set.name} (${set.total})`, set.id))
    }

    select.value = set.id
    select.dispatchEvent(new Event('change', { bubbles:true }))

    requestAnimationFrame(() => {
      tuneSetPickerLabel()
      const refreshed = document.getElementById('set-select')
      const pos = document.getElementById('set-position')
      if (refreshed && [...refreshed.options].some((option) => option.value === set.id)) refreshed.value = set.id
      if (pos && [...pos.options].some((option) => option.value === String(position))) pos.value = String(position)

      const series = document.getElementById('series')
      const seriesNumber = document.getElementById('series-collection-number')
      if (series && !String(series.value || '').trim()) series.value = set.name
      if (seriesNumber) seriesNumber.value = `${position}/${set.total}`
    })
  }

  async function saveSet(set, accessToken, userId) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pocket64_sets`, {
      method:'POST',
      headers:{
        apikey:SUPABASE_KEY,
        Authorization:`Bearer ${accessToken}`,
        'Content-Type':'application/json',
        Prefer:'return=minimal',
      },
      body:JSON.stringify({ id:set.id, user_id:userId, year:Number(set.year), name:set.name, total:set.total }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(detail || `Set save failed (${response.status})`)
    }
  }

  function openCreateAndAssign(defaultYear = '', fromEditor = false) {
    document.getElementById('p64-v538-set-overlay')?.remove()
    document.getElementById('set-modal-backdrop')?.remove()

    const requestedYear = String(defaultYear || '').replace(/[^0-9]/g,'').slice(0,4)
    const initialYear = requestedYear.length === 4 ? requestedYear : String(new Date().getFullYear())
    const overlay = document.createElement('div')
    overlay.id = 'p64-v538-set-overlay'
    overlay.className = 'set-modal-backdrop'
    overlay.innerHTML = `
      <form class="set-modal" id="p64-v538-set-form">
        <div class="set-modal-head"><strong>CREATE A NEW SET</strong><button type="button" id="p64-v538-set-close" aria-label="Close">×</button></div>
        <label>RELEASE YEAR<input id="p64-v538-set-year" type="text" inputmode="numeric" maxlength="4" value="${initialYear}"></label>
        <label>SET NAME<input id="p64-v538-set-name" type="text" autocomplete="on" autocorrect="on" autocapitalize="characters" spellcheck="true"></label>
        <label>CARS IN SET<input id="p64-v538-set-total" type="number" inputmode="numeric" min="1" max="99"></label>
        <p id="p64-v538-set-message" class="message"></p>
        <button class="set-modal-create" id="p64-v538-set-submit" type="submit">${fromEditor ? 'CREATE & ASSIGN' : 'CREATE SET'}</button>
      </form>`
    document.body.append(overlay)

    const close = () => overlay.remove()
    document.getElementById('p64-v538-set-close')?.addEventListener('click', close)
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close() })

    document.getElementById('p64-v538-set-form')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const year = String(document.getElementById('p64-v538-set-year')?.value || '').replace(/[^0-9]/g,'').slice(0,4)
      const name = String(document.getElementById('p64-v538-set-name')?.value || '').trim().toUpperCase()
      const totalRaw = Math.floor(Number(document.getElementById('p64-v538-set-total')?.value))
      const message = document.getElementById('p64-v538-set-message')
      const submit = document.getElementById('p64-v538-set-submit')

      if (year.length !== 4 || !name || !Number.isFinite(totalRaw) || totalRaw < 1) {
        if (message) message.textContent = 'Enter a 4-digit year, Set name, and number of cars.'
        return
      }

      const total = Math.min(99, totalRaw)
      const { accessToken, userId } = authContext()
      if (!accessToken || !userId) {
        if (message) message.textContent = 'Session expired. Sign in again, then create the Set.'
        return
      }

      const state = readState(userId)
      const duplicate = state.sets.find((item) => String(item.year) === year && normalize(item.name) === normalize(name))
      if (duplicate) {
        close()
        if (fromEditor) selectSetForEditor(duplicate, requestedPosition(duplicate.total))
        else alert('That set already exists for this year.')
        return
      }

      const set = { id:crypto.randomUUID(), year, name, total }
      if (submit) { submit.disabled = true; submit.textContent = 'CREATING…' }
      if (message) message.textContent = 'Saving Set…'

      try {
        await saveSet(set, accessToken, userId)
        const latest = readState(userId)
        if (!latest.sets.some((item) => item.id === set.id)) latest.sets.push(set)
        writeState(userId, latest)
        close()
        if (fromEditor) selectSetForEditor(set, requestedPosition(total))
      } catch (error) {
        console.warn('Pocket 64 v5.3.8 Set creation failed', error)
        if (message) message.textContent = `Could not create Set: ${error?.message || error}`
        if (submit) { submit.disabled = false; submit.textContent = fromEditor ? 'CREATE & ASSIGN' : 'CREATE SET' }
      }
    })

    setTimeout(() => document.getElementById('p64-v538-set-name')?.focus(), 40)
  }

  document.addEventListener('change', (event) => {
    const select = event.target
    if (select?.id !== 'set-select' || select.value !== '__new__') return
    event.stopImmediatePropagation()
    event.preventDefault?.()
    select.value = ''
    const year = document.getElementById('model-year')?.value === 'Other'
      ? document.getElementById('custom-year')?.value
      : document.getElementById('model-year')?.value
    openCreateAndAssign(year || '', true)
  }, true)

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#sets-add-button')
    if (!button) return
    event.stopImmediatePropagation()
    event.preventDefault()
    openCreateAndAssign('', false)
  }, true)

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#add-button, #empty-add-button')) {
      requestAnimationFrame(() => requestAnimationFrame(tuneSetPickerLabel))
    }
  }, true)

  function boot() {
    document.documentElement.dataset.p64SetFlowVersion = VERSION
    tuneSetPickerLabel()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
