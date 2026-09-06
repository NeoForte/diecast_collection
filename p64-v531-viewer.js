(() => {
  const FIX_VERSION = '5.3.7'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
  const AUTH_KEY = 'sb-ftjayqjpgifdipmjloxx-auth-token'
  const SETS_PREFIX = 'pocket64-sets-v1-'

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = `Version ${FIX_VERSION}` })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function authContext() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
      const session = raw?.currentSession || raw?.session || raw
      const accessToken = session?.access_token || raw?.access_token || ''
      const userId = session?.user?.id || raw?.user?.id || ''
      return { accessToken, userId }
    } catch { return { accessToken:'', userId:'' } }
  }

  function normalize(value) {
    return String(value || '').trim().toUpperCase().replace(/[’‘]/g, "'").replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
  }

  function readState(userId) {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${SETS_PREFIX}${userId}`) || 'null')
      if (parsed && Array.isArray(parsed.sets) && parsed.assignments && typeof parsed.assignments === 'object') return parsed
    } catch {}
    return { sets:[], assignments:{} }
  }

  function writeState(userId, state) {
    localStorage.setItem(`${SETS_PREFIX}${userId}`, JSON.stringify(state))
  }

  function requestedPosition(total) {
    const match = String(document.getElementById('series-collection-number')?.value || '').trim().match(/^(\d+)\s*\/\s*(\d+)$/)
    const value = match ? Math.floor(Number(match[1]) || 0) : 0
    return value >= 1 && value <= total ? value : 1
  }

  function editorIsOpen() {
    return Boolean(document.getElementById('editor-screen')?.classList.contains('active'))
  }

  function selectCreatedSet(set, position) {
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
      const refreshed = document.getElementById('set-select')
      const pos = document.getElementById('set-position')
      if (refreshed && [...refreshed.options].some((option) => option.value === set.id)) refreshed.value = set.id
      if (pos && [...pos.options].some((option) => option.value === String(position))) pos.value = String(position)

      const series = document.getElementById('series')
      const seriesNumber = document.getElementById('series-collection-number')
      if (series) series.value = set.name
      if (seriesNumber) seriesNumber.value = `${position}/${set.total}`
    })
  }

  async function saveSetToCloud(set, accessToken, userId) {
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

  function simplifyCreateModal() {
    const form = document.getElementById('set-create-form')
    if (!form || form.dataset.p64V537 === '1') return
    form.dataset.p64V537 = '1'

    const fromEditor = editorIsOpen()
    const heading = form.querySelector('.set-modal-head strong')
    const referenceLabel = document.getElementById('set-reference-label')
    const manualFields = document.getElementById('set-manual-fields')
    const name = document.getElementById('set-new-name')
    const submit = form.querySelector('.set-modal-create')

    if (heading) heading.textContent = 'CREATE A NEW SET'
    referenceLabel?.classList.add('hidden')
    manualFields?.classList.remove('hidden')
    if (submit) submit.textContent = fromEditor ? 'CREATE & ASSIGN' : 'CREATE SET'

    if (name) {
      name.setAttribute('autocomplete','on')
      name.setAttribute('autocorrect','on')
      name.setAttribute('autocapitalize','characters')
      name.setAttribute('spellcheck','true')
    }

    setTimeout(() => name?.focus(), 25)
  }

  async function handleCreateSubmit(event) {
    const form = event.target
    if (form?.id !== 'set-create-form') return

    event.preventDefault()
    event.stopImmediatePropagation()

    const yearInput = document.getElementById('set-new-year')
    const nameInput = document.getElementById('set-new-name')
    const totalInput = document.getElementById('set-new-total')
    const submit = form.querySelector('.set-modal-create')
    const year = String(yearInput?.value || '').replace(/[^0-9]/g,'').slice(0,4)
    const name = String(nameInput?.value || '').trim().toUpperCase()
    const totalRaw = Math.floor(Number(totalInput?.value))

    if (year.length !== 4 || !name || !Number.isFinite(totalRaw) || totalRaw < 1) {
      alert('Enter a 4-digit year, Set name, and number of cars.')
      return
    }

    const total = Math.min(99, totalRaw)
    const { accessToken, userId } = authContext()
    if (!accessToken || !userId) {
      alert('Your session expired. Sign out and sign back in, then create the Set again.')
      return
    }

    const state = readState(userId)
    const duplicate = state.sets.find((item) => String(item.year) === year && normalize(item.name) === normalize(name))
    const position = requestedPosition(duplicate?.total || total)

    if (duplicate) {
      document.getElementById('set-modal-backdrop')?.remove()
      if (editorIsOpen()) selectCreatedSet(duplicate, position)
      return
    }

    const set = { id:crypto.randomUUID(), year, name, total }
    if (submit) { submit.disabled = true; submit.textContent = 'CREATING…' }

    try {
      await saveSetToCloud(set, accessToken, userId)
      const latest = readState(userId)
      if (!latest.sets.some((item) => item.id === set.id)) latest.sets.push(set)
      writeState(userId, latest)

      document.getElementById('set-modal-backdrop')?.remove()
      if (editorIsOpen()) selectCreatedSet(set, position)
    } catch (error) {
      console.warn('Pocket 64 Set creation failed', error)
      alert(`Could not create Set. Nothing was assigned.\n\n${error?.message || error}`)
      if (submit) { submit.disabled = false; submit.textContent = editorIsOpen() ? 'CREATE & ASSIGN' : 'CREATE SET' }
    }
  }

  function tuneTextInput(input, { autocorrect = true, spellcheck = true } = {}) {
    if (!input) return
    input.setAttribute('autocomplete','on')
    input.setAttribute('autocorrect', autocorrect ? 'on' : 'off')
    input.setAttribute('autocapitalize','characters')
    input.setAttribute('spellcheck', spellcheck ? 'true' : 'false')
  }

  function tuneEditorInputs() {
    ['model','series','custom-brand','custom-color'].forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:true, spellcheck:true }))
    ;['hotwheels-toy-number','general-number','series-collection-number'].forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:false, spellcheck:false }))
  }

  function boot() {
    syncDisplayedVersion()
    tuneEditorInputs()
    document.addEventListener('submit', handleCreateSubmit, true)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if ([...mutation.addedNodes].some((node) => node.nodeType === 1 && (node.id === 'set-modal-backdrop' || node.querySelector?.('#set-create-form')))) {
          simplifyCreateModal()
        }
      }
    })
    observer.observe(document.body, { childList:true, subtree:true })
    simplifyCreateModal()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
