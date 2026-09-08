(() => {
  const VERSION = '6.1.5'
  const SPLASH_SRC = `pocket64-splash-v615.webp?v=${VERSION}`

  function installStyles() {
    if (document.getElementById('p64-v615-splash-support-styles')) return
    const style = document.createElement('style')
    style.id = 'p64-v615-splash-support-styles'
    style.textContent = `
      #p64-launch-splash{position:fixed;inset:0;z-index:2147483647;background:#000;overflow:hidden;opacity:1;transition:opacity .26s ease;pointer-events:auto}
      #p64-launch-splash.p64-splash-out{opacity:0;pointer-events:none}
      #p64-launch-splash img{width:100%;height:100%;display:block;object-fit:cover;object-position:center;transform:scale(1);animation:p64SplashZoom 1.12s ease-out forwards}
      @keyframes p64SplashZoom{from{transform:scale(1)}to{transform:scale(1.07)}}
      @media (prefers-reduced-motion:reduce){#p64-launch-splash img{animation:none}}
      .p64-help-faqs{margin:14px 0 16px;text-align:left}
      .p64-help-faqs details{border-top:1px solid rgba(130,160,184,.18);padding:9px 0}
      .p64-help-faqs details:last-child{border-bottom:1px solid rgba(130,160,184,.18)}
      .p64-help-faqs summary{cursor:pointer;font-weight:800;font-size:12px;color:#eef6fc;list-style:none}
      .p64-help-faqs summary::-webkit-details-marker{display:none}
      .p64-help-faqs summary:after{content:'+';float:right;color:#6bb6fb;font-size:15px}
      .p64-help-faqs details[open] summary:after{content:'−'}
      .p64-help-faqs p{margin:7px 0 0;font-size:11px;line-height:1.45;color:#91a3b3}
      .p64-help-contact-label{margin:4px 0 8px;font-size:11px;font-weight:850;letter-spacing:.08em;color:#6bb6fb}
    `
    document.head.append(style)
  }

  function showSplash() {
    if (document.getElementById('p64-launch-splash')) return
    const splash = document.createElement('div')
    splash.id = 'p64-launch-splash'
    splash.setAttribute('aria-hidden', 'true')
    splash.innerHTML = `<img src="${SPLASH_SRC}" alt="">`
    document.body.append(splash)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const hold = reduced ? 620 : 900
    setTimeout(() => splash.classList.add('p64-splash-out'), hold)
    setTimeout(() => splash.remove(), hold + 300)
  }

  function upgradeHelpSupport() {
    const button = document.getElementById('settings-support-button')
    if (button) {
      const title = button.querySelector('.settings-copy strong')
      const copy = button.querySelector('.settings-copy span')
      if (title) title.textContent = 'Help & Support'
      if (copy) copy.textContent = 'FAQs, troubleshooting, and contact support.'
      const action = button.querySelector('.settings-action')
      if (action) action.textContent = 'Open'
    }

    const overlay = document.getElementById('settings-support-overlay')
    const modal = overlay?.querySelector('.settings-support-modal')
    const form = document.getElementById('settings-support-form')
    const title = document.getElementById('settings-support-title')
    const subcopy = modal?.querySelector('.p64-modal-subcopy')
    if (title) title.textContent = 'Help & Support'
    if (subcopy) subcopy.textContent = 'Quick answers below. If you still need help, send us a support request.'
    if (modal && form && !document.getElementById('p64-help-faqs')) {
      const faqs = document.createElement('div')
      faqs.id = 'p64-help-faqs'
      faqs.className = 'p64-help-faqs'
      faqs.innerHTML = `
        <details><summary>How do I back up my collection?</summary><p>Open Settings → Backup & Restore and tap Export. Keep that backup somewhere safe, such as Files or OneDrive.</p></details>
        <details><summary>How do I restore a backup?</summary><p>Open Settings → Backup & Restore, tap Restore, then choose your Pocket 64 backup file.</p></details>
        <details><summary>Can I use Pocket 64 on another device?</summary><p>Yes. Sign in with the same Pocket 64 account. Your collection data and private photos are tied to your account.</p></details>
        <details><summary>How do Sets work?</summary><p>Create Sets manually, then assign cars to them and choose each car's Set Position.</p></details>
        <details><summary>What should I try if something looks stale?</summary><p>Refresh Pocket 64 once. If the problem remains, use the support form below and describe what you see.</p></details>`
      form.parentNode.insertBefore(faqs, form)
      const label = document.createElement('div')
      label.className = 'p64-help-contact-label'
      label.textContent = 'CONTACT SUPPORT'
      form.parentNode.insertBefore(label, form)
    }
  }

  function boot() {
    installStyles()
    showSplash()
    upgradeHelpSupport()
    setTimeout(upgradeHelpSupport, 250)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
