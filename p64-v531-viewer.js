(() => {
  const FIX_VERSION = '6.0.4'
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

  function writeState(userId, state) {
    if (!userId) return
    try { localStorage.setItem(stateKey(userId), JSON.stringify(state)) } catch {}
  }

  function installSetFlowStyles() {
    ;['p64-v600-set-styles','p64-v601-set-styles','p64-v602-set-styles','p64-v603-set-styles','p64-v604-set-styles'].forEach((id) => document.getElementById(id)?.remove())
    const style = document.createElement('style')
    style.id = 'p64-v604-set-styles'
    style.textContent = `
      .set-assignment-row {
        grid-template-columns:minmax(0,1.35fr) minmax(112px,.65fr) !important;
        align-items:start !important;
      }
      .set-assignment-row > label:first-child { margin-bottom:0 !important; }
      .p64-create-set-wrap {
        min-width:0;
        display:grid;
        grid-template-rows:auto 42px;
        gap:7px;
        margin:0;
        padding:0;
        align-self:start;
        font-size:14px;
      }
      .p64-create-set-spacer {
        visibility:hidden;
        line-height:normal;
        white-space:nowrap;
        user-select:none;
        pointer-events:none;
      }
      #editor-screen .car-form .p64-create-set-button {
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
        font:900 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.065em !important;
        text-transform:uppercase !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04) !important;
      }
      #editor-screen .car-form .p64-create-set-button:active { transform:translateY(1px); }
      #set-position-label { grid-column:1 / -1 !important; }
      @media (max-width:390px) {
        .set-assignment-row { grid-template-columns:minmax(0,1.18fr) minmax(108px,.82fr) !important; }
        #editor-screen .car-form .p64-create-set-button { font-size:10.5px !important; padding:0 7px !important; }
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

  function installCreateSetButton() {
    const row = document.querySelector('.set-assignment-row')
    const select = document.getElementById('set-select')
    const positionLabel = document.getElementById('set-position-label')
    if (!row || !select || !positionLabel) return

    removeEmbeddedCreateOption()
    if (document.getElementById('p64-create-set-button')) return

    const wrap = document.createElement('div')
    wrap.className = 'p64-create-set-wrap'
    wrap.innerHTML = '<span class="p64-create-set-spacer" aria-hidden="true">Add to Set</span><button id="p64-create-set-button" class="p64-create-set-button" type="button">Create Set</button>'
    row.insertBefore(wrap, positionLabel)

    wrap.querySelector('button').addEventListener('click', () => {
      const trigger = new Option('CREATE SET', '__new__')
      select.insertBefore(trigger, select.firstChild)
      select.value = '__new__'
      select.dispatchEvent(new Event('change', { bubbles:true }))
      queueMicrotask(removeEmbeddedCreateOption)
    })
  }

  function mergeAndRenderSets(userId, cloudSets) {
    const select = document.getElementById('set-select')
    if (!select || !Array.isArray(cloudSets)) return

    const local = readState(userId)
    const byId = new Map((local.sets || []).map((set) => [String(set.id || ''), set]))
    for (const raw of cloudSets) {
      const id = String(raw?.id || '')
      const year = String(raw?.year || '').replace(/[^0-9]/g,'').slice(0,4)
      const name = String(raw?.name || '').trim().toUpperCase()
      const total = Math.max(1, Math.min(99, Math.floor(Number(raw?.total) || 1)))
      if (id && year && name) byId.set(id, { id, year, name, total })
    }

    const sets = [...byId.values()].filter((set) => set?.id && set?.year && set?.name)
    if (!sets.length) return

    writeState(userId, { ...local, sets })

    const previous = select.value && select.value !== '__new__' ? select.value : ''
    const groups = new Map()
    for (const set of sets) {
      const year = String(set.year)
      if (!groups.has(year)) groups.set(year, [])
      groups.get(year).push(set)
    }

    select.replaceChildren(new Option('', ''))
    for (const year of [...groups.keys()].sort((a,b) => Number(b) - Number(a))) {
      const group = document.createElement('optgroup')
      group.label = year
      groups.get(year)
        .sort((a,b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity:'base' }))
        .forEach((set) => group.append(new Option(`${String(set.name).toUpperCase()} (${set.total})`, String(set.id))))
      select.append(group)
    }
    if ([...select.options].some((option) => option.value === previous)) select.value = previous
  }

  async function refreshSetsFromCloud() {
    if (refreshing) return
    const select = document.getElementById('set-select')
    if (!select) return

    const { accessToken, userId } = authContext()
    if (!accessToken || !userId) {
      removeEmbeddedCreateOption()
      return
    }

    refreshing = true
    try {
      const url = `${SUPABASE_URL}/rest/v1/pocket64_sets?select=id,year,name,total&user_id=eq.${encodeURIComponent(userId)}&order=year.desc,name.asc`
      const response = await fetch(url, {
        cache:'no-store',
        headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error(`Set refresh failed (${response.status})`)
      const cloudSets = await response.json()
      mergeAndRenderSets(userId, cloudSets)
    } catch (error) {
      console.warn('Pocket 64 v6.0.4 Set refresh failed; leaving existing picker untouched', error)
    } finally {
      refreshing = false
      removeEmbeddedCreateOption()
    }
  }

  function watchBasePickerRefreshes() {
    const select = document.getElementById('set-select')
    if (!select || select.dataset.p64V604Watch === '1') return
    select.dataset.p64V604Watch = '1'
    new MutationObserver(() => queueMicrotask(removeEmbeddedCreateOption)).observe(select, { childList:true, subtree:true })
  }

  function queueEditorRefresh() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      installCreateSetButton()
      watchBasePickerRefreshes()
      refreshSetsFromCloud()
    }))
  }

  function boot() {
    syncDisplayedVersion()
    tuneEditorInputs()
    installSetFlowStyles()
    installCreateSetButton()
    watchBasePickerRefreshes()
    refreshSetsFromCloud()

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
