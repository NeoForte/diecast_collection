(() => {
  const VERSION = '6.2.2'

  function installStyles() {
    if (document.getElementById('p64-v615-community-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-v615-community-styles'
    style.textContent = `
      .p64-community-entry {
        width:100%; min-height:42px; margin:2px 0 10px; padding:4px 4px 7px;
        border:0; border-radius:0; background:transparent; color:#d9e8f5;
        display:flex; align-items:center; gap:10px; text-align:left;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        -webkit-tap-highlight-color:transparent;
        border-bottom:1px solid rgba(74,151,221,.24);
      }
      .p64-community-entry:active { opacity:.72; }
      .p64-community-entry-icon { width:27px; height:27px; flex:0 0 27px; display:grid; place-items:center; color:#73baff; }
      .p64-community-entry-icon svg { width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .p64-community-entry-title { flex:1; min-width:0; font-size:14px; font-weight:900; letter-spacing:.14em; white-space:nowrap; text-transform:uppercase; }
      .p64-community-entry-arrow { color:#6f8497; font-size:24px; line-height:1; padding-right:2px; }
    `
    document.head.append(style)
  }

  function showCollection() {
    const collection = document.getElementById('collection-screen')
    const social = document.getElementById('social-screen')
    social?.classList.remove('active')
    collection?.classList.add('active')
    document.getElementById('main-nav')?.classList.remove('hidden')
    document.getElementById('collection-nav')?.classList.add('active')
    window.scrollTo({ top:0, behavior:'instant' })
  }

  function showLoadingCommunity() {
    const social = document.getElementById('social-screen')
    if (!social) return
    document.querySelectorAll('main > .screen').forEach((screen) => screen.classList.remove('active'))
    social.style.removeProperty('display')
    social.classList.add('active')
    document.getElementById('main-nav')?.classList.remove('hidden')
    document.getElementById('back-to-top-button')?.classList.add('hidden')
    if (!social.dataset.p64Community620) {
      social.innerHTML = `<div style="padding:18px 8px;text-align:center;color:#8fa4b6;font:600 13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">Loading Community Garage…</div>`
    }
    window.scrollTo({ top:0, behavior:'instant' })
  }

  function buildEntry() {
    const collection = document.getElementById('collection-screen')
    const controls = collection?.querySelector('.collection-controls-grid')
    if (!collection || !controls || document.getElementById('p64-community-entry')) return
    const button = document.createElement('button')
    button.id = 'p64-community-entry'
    button.className = 'p64-community-entry'
    button.type = 'button'
    button.setAttribute('aria-label', 'Open Community Garage')
    button.innerHTML = `
      <span class="p64-community-entry-icon" aria-hidden="true">
        <svg viewBox="0 0 28 28"><circle cx="10" cy="10" r="3.2"></circle><circle cx="18.5" cy="10.5" r="2.7"></circle><path d="M4.5 22c.5-4.5 2.4-7.2 5.8-7.2s5.4 2.7 5.9 7.2"></path><path d="M14.5 21.5c.5-3.7 2.1-5.8 4.6-5.8 2.6 0 4.1 2.1 4.7 5.8"></path></svg>
      </span>
      <span class="p64-community-entry-title">COMMUNITY GARAGE</span>
      <span class="p64-community-entry-arrow" aria-hidden="true">›</span>`
    button.addEventListener('click', showLoadingCommunity)
    collection.insertBefore(button, controls)
  }

  function loadScript(id, src) {
    if (document.getElementById(id)) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.id = id
      s.src = `${src}?v=${VERSION}`
      s.async = false
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  async function loadModernCommunity() {
    try {
      await loadScript('p64-v620-community-loader', 'p64-v620-community.js')
      await loadScript('p64-v620-community-open-loader', 'p64-v620-community-open.js')
    } catch (error) {
      console.warn('Pocket 64 Community Garage load failed', error)
    }
  }

  function boot() {
    installStyles()
    buildEntry()
    document.documentElement.dataset.p64CommunityVersion = VERSION
    loadModernCommunity()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
  window.addEventListener('pageshow', boot)
})()
