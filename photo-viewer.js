(() => {
  const FIX_VERSION = '6.0.5'
  const PROJECT_REF = 'ftjayqjpgifdipmjloxx'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
  let refreshing = false

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = `Version ${FIX_VERSION}` })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
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

  function decodeJwtSub(token) {
    try {
      const payload = token.split('.')[1]
      if (!payload) return ''
      const normalized = payload.replace(/-/g,'+').replace(/_/g,'/')
      const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
      return String(decoded?.sub || '')
    } catch { return '' }
  }

  function authContext() {
    const candidateKeys = []
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || ''
        if (key.includes(PROJECT_REF) && key.includes('auth-token')) candidateKeys.push(key)
      }
    } catch {}
    candidateKeys.unshift(`sb-${PROJECT_REF}-auth-token`)

    for (const key of [...new Set(candidateKeys)]) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || 'null')
        if (!raw) continue
        const candidates = [raw?.currentSession, raw?.session, raw]
        for (const candidate of candidates) {
          const accessToken = candidate?.access_token || raw?.access_token || ''
          const userId = candidate?.user?.id || raw?.user?.id || decodeJwtSub(accessToken)
          if (accessToken && userId) return { accessToken:String(accessToken), userId:String(userId) }
        }
      } catch {}
    }
    return { accessToken:'', userId:'' }
  }

  function stateKey(userId) { return `${SETS_PREFIX}${userId}` }

  function readState(userId) {
    if (!userId) return { sets:[], assignments:{} }
    try {
      const parsed = JSON.parse(localStorage.getItem(stateKey(userId)) || 'null')
      if (parsed && Array.isArray(parsed.sets) && parsed.assignments && typeof parsed.assignments === 'object') return parsed
    } catch {}
    return { sets:[], assignments:{} }
  }

  function findLocalUserId() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || ''
        if (!key.startsWith(SETS_PREFIX) || key.endsWith('signed-out')) continue
        const parsed = JSON.parse(localStorage.getItem(key) || 'null')
        if (parsed && Array.isArray(parsed.sets) && parsed.sets.length) return key.slice(SETS_PREFIX.length)
      }
    } catch {}
    return ''
  }

  function writeState(userId, state) {
    if (!userId) return
    try { localStorage.setItem(stateKey(userId), JSON.stringify(state)) } catch {}
  }

  function normalizedSets(list) {
    const out = []
    for (const raw of list || []) {
      const id = String(raw?.id || '')
      const year = String(raw?.year || '').replace(/[^0-9]/g,'').slice(0,4)
      const name = String(raw?.name || '').trim().toUpperCase()
      const total = Math.max(1, Math.min(99, Math.floor(Number(raw?.total) || 1)))
      if (id && year && name) out.push({ id, year, name, total })
    }
    return out
  }

  function installSetFlowStyles() {
    ;['p64-v600-set-styles','p64-v601-set-styles','p64-v602-set-styles','p64-v603-set-styles','p64-v604-set-styles','p64-v605-set-styles'].forEach((id) => document.getElementById(id)?.remove())
    const style = document.createElement('style')
    style.id = 'p64-v605-set-styles'
    style.textContent = `
      .set-assignment-row {
        grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important;
        align-items:start !important;
        gap:12px !important;
      }
      .set-assignment-row > label:first-child { display:none !important; }
      .p64-set-action-wrap {
        min-width:0;
        display:grid;
        grid-template-rows:auto 42px;
        gap:7px;
        margin:0;
        padding:0;
        align-self:start;
      }
      .p64-set-action-label {
        color:#aab9c8;
        font-size:14px;
        font-weight:650;
        line-height:1.2;
      }
      .p64-set-action-label.spacer { visibility:hidden; }
      #editor-screen .car-form .p64-set-action-button {
        width:100% !important;
        min-height:42px !important;
        height:42px !important;
        box-sizing:border-box !important;
        padding:0 10px !important;
        margin:0 !important;
        border:1px solid rgba(65,161,255,.58) !important;
        border-radius:10px !important;
        background:linear-gradient(180deg,#173b60,#0d2239) !important;
        color:#e8f4ff !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        font-size:12px !important;
        font-weight:900 !important;
        line-height:1 !important;
        letter-spacing:.065em !important;
        text-transform:uppercase !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
      }
      #editor-screen .car-form input:not([type="checkbox"]),
      #editor-screen .car-form select,
      #editor-screen .car-form textarea {
        font-size:12px !important;
      }
      #set-position-label { grid-column:1 / -1 !important; }

      .p64-set-picker-backdrop {
        position:fixed; inset:0; z-index:10050; display:grid; place-items:center;
        padding:18px; background:rgba(0,0,0,.78); backdrop-filter:blur(7px);
      }
      .p64-set-picker {
        width:min(100%,390px); max-height:min(78dvh,680px); overflow:auto;
        border:1px solid rgba(64,157,247,.52); border-radius:18px;
        background:linear-gradient(145deg,#141a21,#06080b 76%);
        box-shadow:0 22px 60px rgba(0,0,0,.65),0 0 32px rgba(0,116,230,.10);
        padding:16px;
      }
      .p64-set-picker-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
      .p64-set-picker-head strong { color:#f1f6fb; font-size:15px; letter-spacing:.08em; }
      .p64-set-picker-close { width:38px; height:38px; border:0; background:transparent; color:#9fb0c0; font-size:26px; }
      .p64-set-picker-status { color:#8798a8; font-size:12px; margin:0 0 10px; }
      .p64-set-year { margin:14px 0 7px; color:#7fbfff; font-size:11px; font-weight:900; letter-spacing:.12em; }
      .p64-set-choice {
        width:100%; min-height:44px; margin:0 0 8px; padding:9px 11px;
        border:1px solid rgba(83,150,215,.35); border-radius:10px;
        background:rgba(20,38,57,.72); color:#eaf4ff; text-align:left;
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        font-size:12px; font-weight:800;
      }
      .p64-set-choice span:last-child { color:#8fa6ba; font-weight:700; white-space:nowrap; }
      @media (max-width:390px) {
        .set-assignment-row { grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important; gap:10px !important; }
        #editor-screen .car-form .p64-set-action-button { font-size:12px !important; padding:0 7px !important; }
      }
    `
    document.head.append(style)
  }

  function removeEmbeddedCreateOption() {
    const select = document.getElementById('set-select')
    if (!select) return
    ;[...select.options].forEach((option) => {
      if (option.value === '__new__') option.remove()
    })
  }

  function currentSets() {
    const auth = authContext()
    const userId = auth.userId || findLocalUserId()
    return { ...auth, userId, sets:normalizedSets(readState(userId).sets) }
  }

  function renderPickerSets(host, sets) {
    host.replaceChildren()
    if (!sets.length) {
      const empty = document.createElement('p')
      empty.className = 'p64-set-picker-status'
      empty.textContent = 'No saved Sets found yet.'
      host.append(empty)
      return
    }

    const groups = new Map()
    for (const set of sets) {
      if (!groups.has(set.year)) groups.set(set.year, [])
      groups.get(set.year).push(set)
    }
    for (const year of [...groups.keys()].sort((a,b) => Number(b) - Number(a))) {
      const yearLabel = document.createElement('div')
      yearLabel.className = 'p64-set-year'
      yearLabel.textContent = year
      host.append(yearLabel)
      groups.get(year)
        .sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity:'base' }))
        .forEach((set) => {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'p64-set-choice'
          button.innerHTML = `<span>${set.name}</span><span>${set.total} CARS</span>`
          button.addEventListener('click', () => chooseSet(set))
          host.append(button)
        })
    }
  }

  function closeSetPicker() {
    document.getElementById('p64-set-picker-backdrop')?.remove()
  }

  function chooseSet(set) {
    const select = document.getElementById('set-select')
    if (!select) return
    if (![...select.options].some((option) => option.value === set.id)) {
      select.append(new Option(`${set.name} (${set.total})`, set.id))
    }
    select.value = set.id
    select.dispatchEvent(new Event('change', { bubbles:true }))
    closeSetPicker()
  }

  async function openSetPicker() {
    closeSetPicker()
    const overlay = document.createElement('div')
    overlay.id = 'p64-set-picker-backdrop'
    overlay.className = 'p64-set-picker-backdrop'
    overlay.innerHTML = `
      <div class="p64-set-picker" role="dialog" aria-modal="true" aria-label="Choose Set">
        <div class="p64-set-picker-head"><strong>ADD TO SET</strong><button class="p64-set-picker-close" type="button" aria-label="Close">×</button></div>
        <p class="p64-set-picker-status" id="p64-set-picker-status">Saved Sets</p>
        <div id="p64-set-picker-list"></div>
      </div>`
    document.body.append(overlay)
    overlay.querySelector('.p64-set-picker-close')?.addEventListener('click', closeSetPicker)
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeSetPicker() })

    const list = overlay.querySelector('#p64-set-picker-list')
    const status = overlay.querySelector('#p64-set-picker-status')
    const { accessToken, userId, sets } = currentSets()
    renderPickerSets(list, sets)

    if (!accessToken || !userId) {
      if (status) status.textContent = sets.length ? 'Saved Sets on this device' : 'No saved Sets available'
      return
    }

    if (status) status.textContent = 'Refreshing Sets…'
    try {
      const url = `${SUPABASE_URL}/rest/v1/pocket64_sets?select=id,year,name,total&user_id=eq.${encodeURIComponent(userId)}&order=year.desc,name.asc`
      const response = await fetch(url, { cache:'no-store', headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${accessToken}` } })
      if (!response.ok) throw new Error(`Set refresh failed (${response.status})`)
      const cloudSets = normalizedSets(await response.json())
      const local = readState(userId)
      const byId = new Map(normalizedSets(local.sets).map((set) => [set.id, set]))
      for (const set of cloudSets) byId.set(set.id, set)
      const merged = [...byId.values()]
      writeState(userId, { ...local, sets:merged })
      renderPickerSets(list, merged)
      if (status) status.textContent = merged.length ? 'Choose a Set' : 'No saved Sets found'
    } catch (error) {
      console.warn('Pocket 64 Set picker refresh failed', error)
      if (status) status.textContent = sets.length ? 'Showing saved Sets on this device' : 'Could not load saved Sets'
    }
  }

  function installSetButtons() {
    const row = document.querySelector('.set-assignment-row')
    const select = document.getElementById('set-select')
    const positionLabel = document.getElementById('set-position-label')
    if (!row || !select || !positionLabel) return

    removeEmbeddedCreateOption()
    if (!document.getElementById('p64-add-to-set-button')) {
      const addWrap = document.createElement('div')
      addWrap.className = 'p64-set-action-wrap'
      addWrap.innerHTML = '<span class="p64-set-action-label">Set</span><button id="p64-add-to-set-button" class="p64-set-action-button" type="button">Add to Set</button>'
      row.insertBefore(addWrap, positionLabel)
      addWrap.querySelector('button').addEventListener('click', openSetPicker)
    }

    if (!document.getElementById('p64-create-set-button')) {
      const createWrap = document.createElement('div')
      createWrap.className = 'p64-set-action-wrap'
      createWrap.innerHTML = '<span class="p64-set-action-label spacer" aria-hidden="true">Set</span><button id="p64-create-set-button" class="p64-set-action-button" type="button">Create Set</button>'
      row.insertBefore(createWrap, positionLabel)
      createWrap.querySelector('button').addEventListener('click', () => {
        const trigger = new Option('CREATE SET', '__new__')
        select.insertBefore(trigger, select.firstChild)
        select.value = '__new__'
        select.dispatchEvent(new Event('change', { bubbles:true }))
        queueMicrotask(removeEmbeddedCreateOption)
      })
    }
  }

  function watchBasePickerRefreshes() {
    const select = document.getElementById('set-select')
    if (!select || select.dataset.p64V605Watch === '1') return
    select.dataset.p64V605Watch = '1'
    new MutationObserver(() => queueMicrotask(removeEmbeddedCreateOption)).observe(select, { childList:true, subtree:true })
  }

  function queueEditorRefresh() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      installSetButtons()
      watchBasePickerRefreshes()
      removeEmbeddedCreateOption()
    }))
  }

  function boot() {
    syncDisplayedVersion()
    tuneEditorInputs()
    installSetFlowStyles()
    installSetButtons()
    watchBasePickerRefreshes()
    removeEmbeddedCreateOption()

    for (const id of ['add-button','empty-add-button']) {
      document.getElementById(id)?.addEventListener('click', queueEditorRefresh, true)
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && document.getElementById('editor-screen')?.classList.contains('active')) queueEditorRefresh()
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
