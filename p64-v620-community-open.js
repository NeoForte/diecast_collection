(() => {
  function openCommunity() {
    document.querySelectorAll('main > .screen').forEach((screen) => screen.classList.remove('active'))
    const social = document.getElementById('social-screen')
    if (!social) return
    social.style.removeProperty('display')
    social.classList.add('active')
    document.getElementById('main-nav')?.classList.remove('hidden')
    document.getElementById('back-to-top-button')?.classList.add('hidden')
    window.scrollTo({ top:0, behavior:'instant' })
    setTimeout(() => document.getElementById('p64-community-refresh')?.click(), 0)
  }
  function bind() {
    const old = document.getElementById('p64-community-entry')
    if (!old || old.dataset.p64CommunityOpen620 === '1') return
    const fresh = old.cloneNode(true)
    fresh.dataset.p64CommunityOpen620 = '1'
    fresh.addEventListener('click', openCommunity)
    old.replaceWith(fresh)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true })
  else bind()
  window.addEventListener('pageshow', bind)
})()
