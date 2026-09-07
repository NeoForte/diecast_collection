(() => {
  const VERSION = '6.2.6'
  const HERO_SRC = `community-garage-hero-v626.webp?v=${VERSION}`

  function applyHero() {
    const img = document.querySelector('#social-screen .p64-community-hero img')
    if (!img) return false
    if (!img.src.includes('community-garage-hero-v626.webp')) img.src = HERO_SRC
    img.alt = 'Collectors admiring a performance car in the Pocket 64 Community Garage'
    img.decoding = 'async'
    img.style.width = '100%'
    img.style.height = '190px'
    img.style.maxHeight = '190px'
    img.style.objectFit = 'cover'
    img.style.objectPosition = 'center 55%'
    return true
  }

  function waitForHero(maxFrames = 120) {
    let frame = 0
    const tick = () => {
      if (applyHero() || ++frame >= maxFrames) return
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function boot() {
    waitForHero()
    document.documentElement.dataset.p64HeroFixVersion = VERSION
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
  window.addEventListener('pageshow', boot)
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button, a')
    if (!target) return
    if (target.id === 'p64-community-entry' || target.id === 'p64-community-refresh') setTimeout(waitForHero, 0)
  }, true)
})()
