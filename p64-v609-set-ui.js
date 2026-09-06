(() => {
  const VERSION = '6.0.9'
  const PROJECT_REF = 'ftjayqjpgifdipmjloxx'
  const SETS_PREFIX = 'pocket64-sets-v1-'
  const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
  const SUPABASE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'

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

  function readState(userId) {
    if (!userId) return { sets:[], assignments:{} }
    try {
      const parsed = JSON.parse(localStorage.getItem(`${SETS_PREFIX}${userId}`) || 'null')
      if (parsed && Array.isArray(parsed.sets)) return { sets:parsed.sets, assignments:parsed.assignments || {} }
    } catch {}
    return { sets:[], assignments:{} }
  }

  function writeState(userId,state) {
    if (!userId) return
    try { localStorage.setItem(`${SETS_PREFIX}${userId}`, JSON.stringify(state)) } catch {}
  }

  function normalizeSets(list) {
    return (list || []).map((raw) => ({
      id:String(raw?.id || ''),
      year:String(raw?.year || '').replace(/[^0-9]/g,'').slice(0,4),
      name:String(raw?.name || '').trim().toUpperCase(),
      total:Math.max(1,Math.min(99,Math.floor(Number(raw?.total)||1))),
    })).filter((set) => set.id && set.year && set.name)
  }

  function installStyles() {
    if (document.getElementById('p64-v609-set-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-v609-set-styles'
    style.textContent = `
      .set-assignment-row{display:none!important}
      #p64-simple-set-button,#p64-simple-set-status,#p64-clear-set,#p64-simple-set-wrap,#p64-simple-set-picker,[id^="p64-simple-set"]{display:none!important}
      .p64-set-action-wrap{display:none!important}
      .p64-v609-set-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:8px 0 10px}
      #editor-screen .car-form .p64-v609-set-button{width:100%;height:42px;min-height:42px;margin:0;padding:0 10px;box-sizing:border-box;border:1px solid rgba(65,161,255,.58);border-radius:10px;background:linear-gradient(180deg,#173b60,#0d2239);color:#e8f4ff;font:900 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.065em;text-transform:uppercase}
      .p64-v609-set-status{grid-column:1/-1;margin:0;color:#9ba7b3;font-size:12px;min-height:15px}
      .p64-v609-picker-backdrop{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(7px)}
      .p64-v609-picker{width:min(100%,390px);max-height:min(78dvh,680px);overflow:auto;border:1px solid rgba(64,157,247,.52);border-radius:18px;background:linear-gradient(145deg,#141a21,#06080b 76%);box-shadow:0 22px 60px rgba(0,0,0,.65);padding:16px}
      .p64-v609-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.p64-v609-picker-head strong{font-size:15px;letter-spacing:.08em}.p64-v609-close{width:38px;height:38px;border:0;background:transparent;color:#9fb0c0;font-size:26px}.p64-v609-status{color:#8798a8;font-size:12px;margin:0 0 10px}.p64-v609-year{margin:14px 0 7px;color:#7fbfff;font-size:11px;font-weight:900;letter-spacing:.12em}.p64-v609-choice{width:100%;min-height:44px;margin:0 0 8px;padding:9px 11px;border:1px solid rgba(83,150,215,.35);border-radius:10px;background:rgba(20,38,57,.72);color:#eaf4ff;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:800}.p64-v609-choice span:last-child{color:#8fa6ba;font-weight:700;white-space:nowrap}
      @media(max-width:390px){.p64-v609-set-row{gap:10px}.p64-v609-set-button{font-size:12px!important;padding:0 7px!important}}
    `
    document.head.append(style)
  }

  function removeOldNewButtons() {
    document.getElementById('p64-add-to-set-button')?.closest('.p64-set-action-wrap')?.remove()
    document.getElementById('p64-create-set-button')?.closest('.p64-set-action-wrap')?.remove()
  }

  function setStatus(text) {
    const el = document.getElementById('p64-v609-set-status')
    if (el) el.textContent = text || 'No Set selected'
  }

  function ensureRow() {
    installStyles()
    removeOldNewButtons()
    const form = document.getElementById('car-form')
    const anchor = document.querySelector('.entry-options-row')
    const select = document.getElementById('set-select')
    if (!form || !anchor || !select) return
    let row = document.getElementById('p64-v609-set-row')
    if (!row) {
      row = document.createElement('div')
      row.id = 'p64-v609-set-row'
      row.className = 'p64-v609-set-row'
      row.innerHTML = '<button id="p64-v609-add" class="p64-v609-set-button" type="button">Add to Set</button><button id="p64-v609-create" class="p64-v609-set-button" type="button">Create Set</button><p id="p64-v609-set-status" class="p64-v609-set-status">No Set selected</p>'
      form.insertBefore(row, anchor)
      document.getElementById('p64-v609-add')?.addEventListener('click', openPicker)
      document.getElementById('p64-v609-create')?.addEventListener('click', () => {
        let option = [...select.options].find((item) => item.value === '__new__')
        if (!option) { option = new Option('CREATE SET','__new__'); select.insertBefore(option,select.firstChild) }
        select.value='__new__'
        select.dispatchEvent(new Event('change',{bubbles:true}))
      })
    }
  }

  function chooseSet(set) {
    const select = document.getElementById('set-select')
    if (!select) return
    if (![...select.options].some((o) => o.value === set.id)) select.append(new Option(`${set.name} (${set.total})`,set.id))
    select.value=set.id
    select.dispatchEvent(new Event('change',{bubbles:true}))
    setStatus(`${set.name} · ${set.year}`)
    document.getElementById('p64-v609-picker-backdrop')?.remove()
  }

  function renderList(host,sets) {
    host.replaceChildren()
    if (!sets.length) { const p=document.createElement('p'); p.className='p64-v609-status'; p.textContent='No saved Sets found yet.'; host.append(p); return }
    const groups=new Map()
    for (const set of sets) { if(!groups.has(set.year)) groups.set(set.year,[]); groups.get(set.year).push(set) }
    for (const year of [...groups.keys()].sort((a,b)=>Number(b)-Number(a))) {
      const y=document.createElement('div'); y.className='p64-v609-year'; y.textContent=year; host.append(y)
      groups.get(year).sort((a,b)=>a.name.localeCompare(b.name)).forEach((set)=>{ const b=document.createElement('button'); b.type='button'; b.className='p64-v609-choice'; b.innerHTML=`<span>${set.name}</span><span>${set.total} CARS</span>`; b.addEventListener('click',()=>chooseSet(set)); host.append(b) })
    }
  }

  async function openPicker() {
    document.getElementById('p64-v609-picker-backdrop')?.remove()
    const overlay=document.createElement('div'); overlay.id='p64-v609-picker-backdrop'; overlay.className='p64-v609-picker-backdrop'; overlay.innerHTML='<div class="p64-v609-picker" role="dialog" aria-modal="true"><div class="p64-v609-picker-head"><strong>ADD TO SET</strong><button class="p64-v609-close" type="button">×</button></div><p id="p64-v609-picker-status" class="p64-v609-status">Saved Sets</p><div id="p64-v609-list"></div></div>'; document.body.append(overlay)
    overlay.querySelector('.p64-v609-close')?.addEventListener('click',()=>overlay.remove()); overlay.addEventListener('click',(e)=>{if(e.target===overlay)overlay.remove()})
    const list=overlay.querySelector('#p64-v609-list'); const status=overlay.querySelector('#p64-v609-picker-status')
    const auth=authContext(); const userId=auth.userId || findLocalUserId(); const local=readState(userId); let sets=normalizeSets(local.sets); renderList(list,sets)
    if(!auth.accessToken || !userId){ if(status)status.textContent=sets.length?'Saved Sets on this device':'No saved Sets available'; return }
    try {
      if(status)status.textContent='Refreshing Sets…'
      const response=await fetch(`${SUPABASE_URL}/rest/v1/pocket64_sets?select=id,year,name,total&user_id=eq.${encodeURIComponent(userId)}&order=year.desc,name.asc`,{cache:'no-store',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${auth.accessToken}`}})
      if(!response.ok) throw new Error(`Set refresh failed (${response.status})`)
      const cloud=normalizeSets(await response.json()); const byId=new Map(sets.map((s)=>[s.id,s])); cloud.forEach((s)=>byId.set(s.id,s)); sets=[...byId.values()]; writeState(userId,{...local,sets}); renderList(list,sets); if(status)status.textContent=sets.length?'Choose a Set':'No saved Sets found'
    } catch { if(status)status.textContent=sets.length?'Showing saved Sets on this device':'Could not load saved Sets' }
  }

  function refreshUi() { ensureRow(); document.documentElement.dataset.p64SetUiVersion=VERSION }
  function schedule() { [0,100,350,900].forEach((delay)=>setTimeout(refreshUi,delay)) }

  function boot() {
    schedule()
    document.addEventListener('click',(event)=>{ if(event.target?.closest?.('#add-button,#empty-add-button,.car-card,.edit-car-button')) schedule() },true)
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') schedule() })
  }

  if(document.readyState==='complete') boot(); else window.addEventListener('load',boot,{once:true})
})()
