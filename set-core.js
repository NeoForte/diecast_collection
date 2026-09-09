(() => {
  const VERSION = '6.4.13'
  const PROJECT_REF = 'ftjayqjpgifdipmjloxx'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
  let referencePromise = null

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
    const keys = [`sb-${PROJECT_REF}-auth-token`]
    try {
      for (let i=0;i<localStorage.length;i+=1) {
        const key = localStorage.key(i) || ''
        if (key.includes(PROJECT_REF) && key.includes('auth-token')) keys.push(key)
      }
    } catch {}
    for (const key of [...new Set(keys)]) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || 'null')
        const session = raw?.currentSession || raw?.session || raw
        const accessToken = session?.access_token || raw?.access_token || ''
        const userId = session?.user?.id || raw?.user?.id || decodeJwtSub(accessToken)
        if (accessToken && userId) return { accessToken:String(accessToken), userId:String(userId) }
      } catch {}
    }
    return { accessToken:'', userId:'' }
  }

  function findLocalUserId() {
    try {
      for (let i=0;i<localStorage.length;i+=1) {
        const key = localStorage.key(i) || ''
        if (!key.startsWith(SETS_PREFIX) || key.endsWith('signed-out')) continue
        const parsed = JSON.parse(localStorage.getItem(key) || 'null')
        if (parsed && Array.isArray(parsed.sets)) return key.slice(SETS_PREFIX.length)
      }
    } catch {}
    return ''
  }

  function currentUserContext() {
    const auth = authContext()
    return { ...auth, userId:auth.userId || findLocalUserId() }
  }

  function stateKey(userId) { return `${SETS_PREFIX}${userId}` }

  function readState(userId) {
    if (!userId) return { sets:[], assignments:{} }
    try {
      const parsed = JSON.parse(localStorage.getItem(stateKey(userId)) || 'null')
      if (parsed && Array.isArray(parsed.sets)) return { sets:parsed.sets, assignments:parsed.assignments || {} }
    } catch {}
    return { sets:[], assignments:{} }
  }

  function writeState(userId,state) {
    if (!userId) return
    try { localStorage.setItem(stateKey(userId), JSON.stringify(state)) } catch {}
  }

  function normalizeName(value) {
    return String(value || '').toUpperCase().replace(/[’‘]/g,"'").replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ')
  }

  function setKey(year,name) { return `${String(year || '')}\u0000${normalizeName(name)}` }

  function normalizeSets(list) {
    return (list || []).map((raw) => ({
      id:String(raw?.id || ''),
      year:String(raw?.year || '').replace(/[^0-9]/g,'').slice(0,4),
      name:String(raw?.name || '').trim().toUpperCase(),
      total:Math.max(1,Math.min(99,Math.floor(Number(raw?.total)||1))),
      reference:Boolean(raw?.reference),
      type:String(raw?.type || ''),
    })).filter((set) => set.year && set.name && (set.id || set.reference))
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
    document.getElementById('p64-set-create-overlay')?.remove()
    document.getElementById('set-modal-backdrop')?.remove()

    const requestedYear = String(defaultYear || '').replace(/[^0-9]/g,'').slice(0,4)
    const initialYear = requestedYear.length === 4 ? requestedYear : String(new Date().getFullYear())
    const overlay = document.createElement('div')
    overlay.id = 'p64-set-create-overlay'
    overlay.className = 'set-modal-backdrop'
    overlay.innerHTML = `
      <form class="set-modal" id="p64-set-create-form">
        <div class="set-modal-head"><strong>CREATE A NEW SET</strong><button type="button" id="p64-set-create-close" aria-label="Close">×</button></div>
        <label>RELEASE YEAR<input id="p64-set-create-year" type="text" inputmode="numeric" maxlength="4" value="${initialYear}"></label>
        <label>SET NAME<input id="p64-set-create-name" type="text" autocomplete="on" autocorrect="on" autocapitalize="characters" spellcheck="true"></label>
        <label>CARS IN SET<input id="p64-set-create-total" type="number" inputmode="numeric" min="1" max="99"></label>
        <p id="p64-set-create-message" class="message"></p>
        <button class="set-modal-create" id="p64-set-create-submit" type="submit">${fromEditor ? 'CREATE & ASSIGN' : 'CREATE SET'}</button>
      </form>`
    document.body.append(overlay)

    const close = () => overlay.remove()
    document.getElementById('p64-set-create-close')?.addEventListener('click', close)
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close() })

    document.getElementById('p64-set-create-form')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const year = String(document.getElementById('p64-set-create-year')?.value || '').replace(/[^0-9]/g,'').slice(0,4)
      const name = String(document.getElementById('p64-set-create-name')?.value || '').trim().toUpperCase()
      const totalRaw = Math.floor(Number(document.getElementById('p64-set-create-total')?.value))
      const message = document.getElementById('p64-set-create-message')
      const submit = document.getElementById('p64-set-create-submit')

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
      const duplicate = state.sets.find((item) => String(item.year) === year && normalizeName(item.name) === normalizeName(name))
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
        console.warn('Pocket 64 Set creation failed', error)
        if (message) message.textContent = `Could not create Set: ${error?.message || error}`
        if (submit) { submit.disabled = false; submit.textContent = fromEditor ? 'CREATE & ASSIGN' : 'CREATE SET' }
      }
    })

    setTimeout(() => document.getElementById('p64-set-create-name')?.focus(), 40)
  }

  async function loadReferenceLibrary() {
    if (referencePromise) return referencePromise
    referencePromise = (async () => {
      try {
        const response = await fetch(`app.js?set-library=${encodeURIComponent(VERSION)}&_=${Date.now()}`, { cache:'no-store' })
        if (!response.ok) throw new Error(`app.js ${response.status}`)
        const source = await response.text()
        const match = source.match(/const HOT_WHEELS_SET_REFERENCE = (\{[\s\S]*?\})\n\nfunction normalizeSetReferenceName/)
        if (!match) throw new Error('Set reference library not found')
        const parsed = JSON.parse(match[1])
        const out = []
        for (const [year, rows] of Object.entries(parsed || {})) {
          for (const row of rows || []) out.push({ id:'', year:String(year), name:String(row?.name || '').trim().toUpperCase(), total:Number(row?.total)||1, type:String(row?.type || ''), reference:true })
        }
        return normalizeSets(out)
      } catch (error) {
        console.warn('Pocket 64 reference Set library could not load', error)
        return []
      }
    })()
    return referencePromise
  }

  function mergeAllSets(referenceSets, personalSets) {
    const byKey = new Map()
    for (const set of normalizeSets(referenceSets)) byKey.set(setKey(set.year,set.name), set)
    for (const set of normalizeSets(personalSets)) {
      const key = setKey(set.year,set.name)
      const existing = byKey.get(key)
      byKey.set(key, existing ? { ...existing, ...set, reference:true } : set)
    }
    return [...byKey.values()]
  }

  function installStyles() {
    if (document.getElementById('p64-set-core-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-set-core-styles'
    style.textContent = `
      .set-assignment-row{display:none!important}
      #p64-simple-set-button,#p64-simple-set-status,#p64-clear-set,#p64-simple-set-wrap,#p64-simple-set-picker,[id^="p64-simple-set"]{display:none!important}
      .p64-set-action-wrap{display:none!important}
      .p64-set-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:8px 0 10px}
      #editor-screen .car-form .p64-set-button{width:100%;height:42px;min-height:42px;margin:0;padding:0 10px;box-sizing:border-box;border:1px solid rgba(65,161,255,.58);border-radius:10px;background:linear-gradient(180deg,#173b60,#0d2239);color:#e8f4ff;font:900 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.065em;text-transform:uppercase}
      .p64-set-status{grid-column:1/-1;margin:0;color:#9ba7b3;font-size:12px;min-height:15px}
      .p64-set-picker-backdrop{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(7px)}
      .p64-set-picker{width:min(100%,390px);max-height:min(78dvh,680px);overflow:auto;border:1px solid rgba(64,157,247,.52);border-radius:18px;background:linear-gradient(145deg,#141a21,#06080b 76%);box-shadow:0 22px 60px rgba(0,0,0,.65);padding:16px}
      .p64-set-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.p64-set-picker-head strong{font-size:15px;letter-spacing:.08em}.p64-set-close{width:38px;height:38px;border:0;background:transparent;color:#9fb0c0;font-size:26px}.p64-set-picker-status{color:#8798a8;font-size:12px;margin:0 0 10px}#p64-set-list{display:grid;gap:10px}#p64-set-list label{color:#aebdcc;font-size:14px;font-weight:700}#p64-set-list select{width:100%;min-width:0;min-height:46px;font-size:16px;padding:10px;border:1px solid #536f89;border-radius:10px;background:#101b28;color:#c7d9e9}#p64-picker-assign{min-height:44px;margin-top:8px;border:1px solid #6389ae;background:#173a5a;color:#d3e4f4}#p64-picker-assign:disabled{opacity:.45;cursor:default}

      @media(max-width:390px){.p64-set-row{gap:10px}.p64-set-button{font-size:12px!important;padding:0 7px!important}}
    `
    document.head.append(style)
  }

  function removeOldNewButtons() {
    document.getElementById('p64-add-to-set-button')?.closest('.p64-set-action-wrap')?.remove()
    document.getElementById('p64-create-set-button')?.closest('.p64-set-action-wrap')?.remove()
  }

  function setStatus(text) {
    const el = document.getElementById('p64-set-status')
    if (el) el.textContent = text || 'No Set selected'
  }

  function syncStatusFromHiddenSelect() {
    const select = document.getElementById('set-select')
    if (!select?.value || select.value === '__new__') { setStatus('No Set selected'); return }
    const { userId } = currentUserContext()
    const set = normalizeSets(readState(userId).sets).find((item) => item.id === select.value)
    if (set) setStatus(`${set.name} · ${set.year}`)
  }

  function ensureRow() {
    installStyles()
    removeOldNewButtons()
    const form = document.getElementById('car-form')
    const anchor = document.querySelector('.entry-options-row')
    const select = document.getElementById('set-select')
    if (!form || !anchor || !select) return
    let row = document.getElementById('p64-set-row')
    if (!row) {
      row = document.createElement('div')
      row.id = 'p64-set-row'
      row.className = 'p64-set-row'
      row.innerHTML = '<button id="p64-set-add" class="p64-set-button" type="button">Add to Set</button><button id="p64-set-create" class="p64-set-button" type="button">Create Set</button><p id="p64-set-status" class="p64-set-status">No Set selected</p>'
      form.insertBefore(row, anchor)
      document.getElementById('p64-set-add')?.addEventListener('click', openPicker)
      document.getElementById('p64-set-create')?.addEventListener('click', () => {
        let option = [...select.options].find((item) => item.value === '__new__')
        if (!option) { option = new Option('CREATE SET','__new__'); select.insertBefore(option,select.firstChild) }
        select.value='__new__'
        select.dispatchEvent(new Event('change',{bubbles:true}))
      })
      if (select.dataset.p64SetStatusWatch !== '1') {
        select.dataset.p64SetStatusWatch = '1'
        select.addEventListener('change', () => setTimeout(syncStatusFromHiddenSelect, 0))
      }
    }
    syncStatusFromHiddenSelect()
  }

  async function materializeReferenceSet(entry) {
    if (entry.id) return entry
    const { accessToken, userId } = currentUserContext()
    if (!userId) throw new Error('Sign in again, then try this Set.')
    const state = readState(userId)
    const existing = normalizeSets(state.sets).find((item) => setKey(item.year,item.name) === setKey(entry.year,entry.name))
    if (existing) return existing
    const set = { id:crypto.randomUUID(), year:entry.year, name:entry.name, total:entry.total }
    if (accessToken) await saveSet(set, accessToken, userId)
    state.sets.push(set)
    writeState(userId,state)
    return set
  }

  async function chooseSet(entry, button) {
    try {
      if (button) { button.disabled=true; button.style.opacity='.65' }
      const set = entry.reference && !entry.id ? await materializeReferenceSet(entry) : entry
      const select = document.getElementById('set-select')
      if (!select) return
      if (![...select.options].some((o) => o.value === set.id)) select.append(new Option(`${set.name} (${set.total})`,set.id))
      select.value=set.id
      select.dispatchEvent(new Event('change',{bubbles:true}))
      setStatus(`${set.name} · ${set.year}`)
      document.getElementById('p64-set-picker-backdrop')?.remove()
    } catch (error) {
      alert(error?.message || 'Could not add that Set.')
      if (button) { button.disabled=false; button.style.opacity='' }
    }
  }

  function renderList(host, sets) {
    host.replaceChildren()
    if (!sets.length) {
      const message = document.createElement('p')
      message.className = 'p64-set-picker-status'
      message.textContent = 'No Sets available. Close this box and use Create Set to add your own.'
      host.append(message)
      return
    }
    const groups = new Map()
    for (const set of sets) {
      if (!groups.has(set.year)) groups.set(set.year, [])
      groups.get(set.year).push(set)
    }
    host.innerHTML = '<label for="p64-picker-year">Release year</label><select id="p64-picker-year"></select><label for="p64-picker-set">Set</label><select id="p64-picker-set"></select><button id="p64-picker-assign" type="button" disabled>Add to Set</button>'
    const yearSelect = host.querySelector('#p64-picker-year')
    const setSelect = host.querySelector('#p64-picker-set')
    const assign = host.querySelector('#p64-picker-assign')
    const years = [...groups.keys()].sort((a,b) => Number(b)-Number(a))
    yearSelect.append(new Option('Choose a year', ''))
    for (const year of years) yearSelect.append(new Option(year, year))
    const currentId = document.getElementById('set-select')?.value
    const assigned = sets.find(set => set.id && set.id === currentId)
    const editorYear = document.getElementById('model-year')?.value === 'Other'
      ? document.getElementById('custom-year')?.value
      : document.getElementById('model-year')?.value
    const preferredYear = assigned?.year || editorYear || ''
    yearSelect.value = years.includes(preferredYear) ? preferredYear : ''
    let rows = []
    const refreshSets = () => {
      rows = [...(groups.get(yearSelect.value) || [])].sort((a,b) => a.name.localeCompare(b.name))
      setSelect.replaceChildren(new Option(yearSelect.value ? 'Choose a Set' : 'Choose a year first', ''))
      rows.forEach((set,index) => setSelect.append(new Option(`${set.name} (${set.total})`, String(index))))
      setSelect.disabled = !rows.length
      assign.disabled = true
    }
    refreshSets()
    if (assigned && assigned.year === yearSelect.value) {
      setSelect.value = String(rows.findIndex(set => set.id === assigned.id))
      assign.disabled = setSelect.value === ''
    }
    yearSelect.addEventListener('change', refreshSets)
    setSelect.addEventListener('change', () => { assign.disabled = setSelect.value === '' })
    assign.addEventListener('click', async () => {
      if (setSelect.value === '') return
      const entry = rows[Number(setSelect.value)]
      if (!entry) return
      yearSelect.disabled = setSelect.disabled = true
      await chooseSet(entry, assign)
      yearSelect.disabled = false
      setSelect.disabled = !rows.length
    })
  }

  async function openPicker() {
    document.getElementById('p64-set-picker-backdrop')?.remove()
    const overlay=document.createElement('div')
    overlay.id='p64-set-picker-backdrop'
    overlay.className='p64-set-picker-backdrop'
    overlay.innerHTML='<div class="p64-set-picker" role="dialog" aria-modal="true" aria-labelledby="p64-set-picker-title"><div class="p64-set-picker-head"><strong id="p64-set-picker-title">ADD TO SET</strong><button class="p64-set-close" type="button" aria-label="Close Add to Set">×</button></div><p id="p64-set-picker-status" class="p64-set-picker-status" role="status">Loading Sets…</p><div id="p64-set-list"></div></div>'
    document.body.append(overlay)
    overlay.querySelector('.p64-set-close')?.addEventListener('click',()=>overlay.remove())
    overlay.addEventListener('click',(e)=>{if(e.target===overlay)overlay.remove()})
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { overlay.remove(); document.getElementById('p64-set-add')?.focus() }
    })
    const list=overlay.querySelector('#p64-set-list')
    const status=overlay.querySelector('#p64-set-picker-status')
    const auth=currentUserContext()
    const local=readState(auth.userId)
    const references = await loadReferenceLibrary()
    let personal = normalizeSets(local.sets)

    if(auth.accessToken && auth.userId) {
      try {
        if(status)status.textContent='Loading all known + saved Sets…'
        const response=await fetch(`${SUPABASE_URL}/rest/v1/pocket64_sets?select=id,year,name,total&user_id=eq.${encodeURIComponent(auth.userId)}&order=year.desc,name.asc`,{cache:'no-store',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${auth.accessToken}`}})
        if(!response.ok) throw new Error(`Set refresh failed (${response.status})`)
        const cloud=normalizeSets(await response.json())
        const personalByKey=new Map(personal.map((s)=>[setKey(s.year,s.name),s]))
        cloud.forEach((s)=>personalByKey.set(setKey(s.year,s.name),s))
        personal=[...personalByKey.values()]
        writeState(auth.userId,{...local,sets:personal})
      } catch (error) {
        console.warn('Pocket 64 Set picker refresh failed', error)
        if(status)status.textContent='Showing all known + saved Sets on this device'
      }
    }

    const allSets=mergeAllSets(references,personal)
    renderList(list,allSets)
    if(status)status.textContent=allSets.length?'Choose a year, then a Set.':'No Sets available'
  }

  function refreshUi() {
    ensureRow()
    tuneSetPickerLabel()
    document.documentElement.dataset.p64SetCoreVersion=VERSION
  }

  function schedule() { [0,100,350,900].forEach((delay)=>setTimeout(refreshUi,delay)) }

  function installEventHandlers() {
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

    document.addEventListener('click',(event)=>{
      if(event.target?.closest?.('#add-button,#empty-add-button,.car-card,.edit-car-button')) schedule()
    },true)

    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') schedule() })
  }

  function boot() {
    installStyles()
    installEventHandlers()
    tuneSetPickerLabel()
    schedule()
    document.documentElement.dataset.p64SetCoreVersion=VERSION
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true})
  else boot()
})()
