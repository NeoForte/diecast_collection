(() => {
  const VERSION = '6.1.5'

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
      .p64-community-entry-icon {
        width:27px; height:27px; flex:0 0 27px; display:grid; place-items:center;
        color:#73baff;
      }
      .p64-community-entry-icon svg { width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .p64-community-entry-title {
        flex:1; min-width:0; font-size:14px; font-weight:900; letter-spacing:.14em;
        white-space:nowrap; text-transform:uppercase;
      }
      .p64-community-entry-arrow { color:#6f8497; font-size:24px; line-height:1; padding-right:2px; }

      .p64-community-shell { padding:2px 2px 24px; }
      .p64-community-top { display:flex; align-items:center; gap:12px; margin:2px 0 18px; }
      .p64-community-back {
        width:36px; height:36px; flex:0 0 36px; border:0; background:transparent;
        color:#9db0c0; font-size:30px; line-height:1; padding:0;
      }
      .p64-community-heading { min-width:0; }
      .p64-community-kicker { color:#6faee6; font-size:10px; font-weight:850; letter-spacing:.18em; margin-bottom:3px; }
      .p64-community-heading h2 { margin:0; font-size:24px; letter-spacing:.045em; }
      .p64-community-preview {
        margin-top:4px; padding:28px 18px; text-align:center;
        border-top:1px solid rgba(75,145,208,.20);
        border-bottom:1px solid rgba(75,145,208,.12);
        background:linear-gradient(180deg,rgba(17,35,52,.26),rgba(0,0,0,0));
      }
      .p64-community-preview svg { width:42px; height:42px; margin-bottom:12px; fill:none; stroke:#69b5fb; stroke-width:1.55; stroke-linecap:round; stroke-linejoin:round; }
      .p64-community-preview strong { display:block; color:#edf7ff; font-size:17px; letter-spacing:.045em; margin-bottom:7px; }
      .p64-community-preview p { margin:0 auto; max-width:310px; color:#8798a8; font-size:13px; line-height:1.5; }
    `
    document.head.append(style)
  }

  function showCollection() {
    const collection = document.getElementById('collection-screen')
    const social = document.getElementById('social-screen')
    social?.classList.remove('active')
    if (social) social.style.removeProperty('display')
    collection?.classList.add('active')
    document.getElementById('main-nav')?.classList.remove('hidden')
    document.getElementById('collection-nav')?.classList.add('active')
    window.scrollTo({ top:0, behavior:'instant' })
  }

  function showCommunity() {
    const social = document.getElementById('social-screen')
    if (!social) return
    document.querySelectorAll('main > .screen').forEach((screen) => screen.classList.remove('active'))
    social.style.removeProperty('display')
    social.classList.add('active')
    document.getElementById('main-nav')?.classList.remove('hidden')
    document.getElementById('back-to-top-button')?.classList.add('hidden')
    window.scrollTo({ top:0, behavior:'instant' })
  }

  function buildCommunityScreen() {
    const social = document.getElementById('social-screen')
    if (!social || social.dataset.p64Community615 === '1') return
    social.dataset.p64Community615 = '1'
    social.style.removeProperty('display')
    social.innerHTML = `
      <div class="p64-community-shell">
        <div class="p64-community-top">
          <button id="p64-community-back" class="p64-community-back" type="button" aria-label="Back to collection">‹</button>
          <div class="p64-community-heading">
            <div class="p64-community-kicker">POCKET 64</div>
            <h2>COMMUNITY GARAGE</h2>
          </div>
        </div>
        <div class="p64-community-preview">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="17" cy="18" r="5"></circle><circle cx="31" cy="18" r="5"></circle>
            <path d="M7 38c.8-7 4.2-11 10-11s9.2 4 10 11"></path>
            <path d="M21 38c.8-6.2 4.1-9.5 10-9.5 5.4 0 8.6 3.2 10 9.5"></path>
          </svg>
          <strong>YOUR COLLECTOR COMMUNITY</strong>
          <p>This is the new home for the Community Garage feed. We’ll build the actual posts, reactions and sharing next.</p>
        </div>
      </div>`
    document.getElementById('p64-community-back')?.addEventListener('click', showCollection)
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
    button.addEventListener('click', showCommunity)
    collection.insertBefore(button, controls)
  }

  function boot() {
    installStyles()
    buildCommunityScreen()
    buildEntry()
    document.documentElement.dataset.p64CommunityVersion = VERSION
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
  window.addEventListener('pageshow', boot)
})()
