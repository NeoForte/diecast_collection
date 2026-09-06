(() => {
  const FIX_VERSION = '6.0.3'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const AUTH_KEY = 'sb-ftjayqjpgifdipmjloxx-auth-token'
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

  function authContext() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
      const session = raw?.currentSession || raw?.session || raw
      return {
        accessToken: session?.access_token || raw?.access_token || '',
        userId: session?.user?.id || raw?.user?.id || '',
      }
    } catch { return { accessToken:'', userId:'' } }
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
    ;['p64-v600-set-styles','p64-v601-set-styles','p64-v602-set-styles','p64-v603-set-styles'].forEach((id) => document.getElementById(id)?.remove())
    const style = document.createElement('style')
    style.id = 'p64-v603-set-styles'
    style.textContent = `
      .set-assignment-row {
        grid-template-columns:minmax(0,1.35fr) minmax(112px,.65fr) !important;
        align-items:start !important;
      }
      .set-assignment-row > label:first-child {
        margin-bottom:0 !important;
      }
      .p64-create-set-wrap {
        min-width:0;
        display:grid;
        grid-template-rows:auto auto;
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
      .p64-create-set-button {
        width:100%;
        box-sizing:border-box;
        padding:0 10px;
        border:1px solid rgba(65,161,255,.58);
        border-radius:11px;
        background:linear-gradient(145deg,#15375a,#07111d);
        color:#dff1ff;
        font:900 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        letter-spacing:.065em;
        text-transform:uppercase;
        box-shadow:inset 0 0 16px rgba(36,135,235,.08);
      }
      .p64-create-set-button:active { transform:translateY(1px); }
      #set-position-label { grid-column:1 / -1 !important; }
      @media (max-width:390px) {
        .set-assignment-row { grid-template-columns:minmax(0,1.18fr) minmax(108px,.82fr) !important; }
        .p64-create-set-button { font-size:10.5px; padding:0 7px; }
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

  function matchCreateButtonToSelect() {
    const select = document.getElementById('set-select')
    const button = document.getElementById('p64-create-set-button')
    if (!select || !button) return
    const height = Math.round(select.getBoundingClientRect().height)
    if (height > 0) {
      button.style.height = `${height}px`
      button.style.minHeight = `${height}px`
    }
  }

  function installCreateSetButton() {
    const row = document.querySelector('.set-assignment-row')
    const select = document.getElementById('set-select')
    const positionLabel = document.getElementById('set-position-label')
    if (!row || !select || !positionLabel) return

    removeEmbeddedCreateOption()
    const existing = document.getElementById('p64-create-set-button')
    if (existing) {
      const wrap = existing.closest('.p64-create-set-wrap')
      if (wrap && !wrap.querySelector('.p64-create-set-spacer')) {
        const spacer = document.createElement('span')
        spacer.className = 'p64-create-set-spacer'
        spacer.setAttribute('aria-hidden','true')
        spacer.textContent = 'Add to Set'
        wrap.insertBefore(spacer, existing)
      }
      matchCreateButtonToSelect()
      return
    }

    const wrap = document.createElement('div')
    wrap.className = 'p64-create-set-wrap'
    wrap.innerHTML = '<span class="p64-create-set-spacer" aria-hidden="true">Add to Set</span><button id="p64-create-set-button" class="p64-create-set-button" type="button">Create Set</button>'
    row.insertBefore(wrap, positionLabel)

    wrap.querySelector('button').addEventListener('click', () => {
      const trigger = new Option('CREATE SET', '__new__')
      select.insertBefore(trigger, select.firstChild)
      select.value = '__new__'
      select.dispatchEvent(new Event('change', { bubbles:true }))
      removeEmbeddedCreateOption()
    })

    requestAnimationFrame(matchCreateButtonToSelect)
  }

  function renderExistingSets(sets) {
    const select = document.getElementById('set-select')
    if (!select) return
    const previous = select.value && select.value !== '__new__' ? select.value : ''
    const groups = new Map()

    for (const raw of sets || []) {
      const id = String(raw?.id || '')
      const year = String(raw?.year || '').replace(/[^0-9]/g,'').slice(0,4)
      const name = String(raw?.name || '').trim().toUpperCase()
      const total = Math.max(1, Math.min(99, Math.floor(Number(raw?.total) || 1)))
      if (!id || !year || !name) continue
      if (!groups.has(year)) groups.set(year, [])
      groups.get(year).push({ id, year, name, total })
    }

    select.replaceChildren(new Option('', ''))
    const years = [...groups.keys()].sort((a,b) => Number(b) - Number(a))
    for (const year of years) {
      const group = document.createElement('optgroup')
      group.label = year
      groups.get(year)
        .sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity:'base' }))
        .forEach((set) => group.append(new Option(`${set.name} (${set.total})`, set.id)))
      select.append(group)
    }
    if ([...select.options].some((option) => option.value === previous)) select.value = previous
    requestAnimationFrame(matchCreateButtonToSelect)
  }

  async function refreshSetsFromCloud() {
    if (refreshing) return
    const select = document.getElementById('set-select')
    if (!select) return
    const { accessToken, userId } = authContext()
    if (!userId) { removeEmbeddedCreateOption(); return }

    refreshing = true
    try {
      let state = readState(userId)
      renderExistingSets(state.sets)

      if (!accessToken) return
      const url = `${SUPABASE_URL}/rest/v1/pocket64_sets?select=id,year,name,total&user_id=eq.${encodeURIComponent(userId)}&order=year.desc,name.asc`
      const response = await fetch(url, {
        cache:'no-store',
        headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${accessToken}` },
      })
      if (!response.ok) return
      const cloudSets = await response.json()
      if (!Array.isArray(cloudSets)) return

      const byId = new Map((state.sets || []).map((set) => [String(set.id || ''), set]))
      for (const set of cloudSets) byId.set(String(set.id || ''), {
        id:String(set.id || ''),
        year:String(set.year || ''),
        name:String(set.name || '').trim().toUpperCase(),
        total:Math.max(1, Math.min(99, Math.floor(Number(set.total) || 1))),
      })
      state = { ...state, sets:[...byId.values()].filter((set) => set.id && set.year && set.name) }
      writeState(userId, state)
      renderExistingSets(state.sets)
    } catch (error) {
      console.warn('Pocket 64 v6 Set refresh failed', error)
    } finally {
      refreshing = false
      removeEmbeddedCreateOption()
      requestAnimationFrame(matchCreateButtonToSelect)
    }
  }

  function watchBasePickerRefreshes() {
    const select = document.getElementById('set-select')
    if (!select || select.dataset.p64V600Watch === '1') return
    select.dataset.p64V600Watch = '1'
    new MutationObserver(() => {
      removeEmbeddedCreateOption()
      requestAnimationFrame(matchCreateButtonToSelect)
    }).observe(select, { childList:true, subtree:true })
  }

  function queueEditorRefresh() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      installCreateSetButton()
      watchBasePickerRefreshes()
      refreshSetsFromCloud()
      matchCreateButtonToSelect()
    }))
  }

  function boot() {
    syncDisplayedVersion()
    tuneEditorInputs()
    installSetFlowStyles()
    installCreateSetButton()
    watchBasePickerRefreshes()
    refreshSetsFromCloud()

    window.addEventListener('resize', () => requestAnimationFrame(matchCreateButtonToSelect))
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
