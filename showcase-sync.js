(() => {
  const STYLE_ID = 'p64-showcase-sync-style'
  let syncing = false
  let scheduled = false

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #social-screen .showcase-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; }
      #social-screen .showcase-home-card { cursor:pointer; }
      #social-screen .showcase-home-card .showcase-remove-button {
        pointer-events:auto !important;
        width:auto !important;
        min-width:0 !important;
        min-height:24px !important;
        margin:0 !important;
        padding:0 7px !important;
        border:1px solid rgba(255,255,255,.18) !important;
        border-radius:8px !important;
        background:rgba(0,0,0,.66) !important;
        color:rgba(255,255,255,.86) !important;
        font-size:8px !important;
        line-height:1 !important;
        font-weight:850 !important;
        backdrop-filter:blur(5px);
      }
      #social-screen .showcase-home-card .favorite-card-toggle { pointer-events:none !important; }
      #search-input { text-transform:uppercase; }
      @media (min-width:700px) {
        #social-screen .showcase-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:12px !important; }
      }
    `
    document.head.append(style)
  }

  function copyComputedStyle(source, target) {
    const style = getComputedStyle(source)
    for (const prop of style) target.style.setProperty(prop, style.getPropertyValue(prop), style.getPropertyPriority(prop))
  }

  function copyComputedTree(source, target) {
    copyComputedStyle(source, target)
    const sourceNodes = source.querySelectorAll('*')
    const targetNodes = target.querySelectorAll('*')
    const count = Math.min(sourceNodes.length, targetNodes.length)
    for (let i = 0; i < count; i += 1) copyComputedStyle(sourceNodes[i], targetNodes[i])
  }

  function homeCardMaps() {
    const byPath = new Map()
    const byText = new Map()
    document.querySelectorAll('#cars-grid .car-card').forEach((card) => {
      const img = card.querySelector('img[data-private-photo-path]')
      if (img?.dataset.privatePhotoPath) byPath.set(img.dataset.privatePhotoPath, card)
      const title = card.querySelector('.car-title')?.textContent?.trim() || ''
      const sub = card.querySelector('.car-sub')?.textContent?.trim() || ''
      if (title || sub) byText.set(`${title}\u241f${sub}`, card)
    })
    return { byPath, byText }
  }

  function findHomeCard(showcaseCard, maps) {
    const img = showcaseCard.querySelector('img[data-private-photo-path]')
    const path = img?.dataset.privatePhotoPath || ''
    const title = showcaseCard.querySelector('.car-title')?.textContent?.trim() || ''
    const sub = showcaseCard.querySelector('.car-sub')?.textContent?.trim() || ''
    return (path && maps.byPath.get(path)) || maps.byText.get(`${title}\u241f${sub}`) || null
  }

  function syncOneCard(card, maps) {
    if (!(card instanceof HTMLElement) || card.dataset.showcaseSynced === '2') return
    const removeButton = card.querySelector('.showcase-remove-button')
    const oldImg = card.querySelector('img[data-private-photo-path]')
    const homeCard = findHomeCard(card, maps)
    if (!homeCard) return

    const clone = homeCard.cloneNode(true)
    copyComputedTree(homeCard, clone)

    const homeImg = homeCard.querySelector('img[data-private-photo-path]')
    const cloneImg = clone.querySelector('img[data-private-photo-path]')
    if (cloneImg) {
      if (homeImg?.src) cloneImg.src = homeImg.src
      else if (oldImg?.src) cloneImg.src = oldImg.src
    }

    const qty = clone.querySelector('.card-quantity-control')
    if (qty && removeButton) qty.replaceWith(removeButton)
    else if (removeButton) clone.append(removeButton)

    const favorite = clone.querySelector('.favorite-card-toggle')
    if (favorite) {
      favorite.disabled = true
      favorite.tabIndex = -1
      favorite.setAttribute('aria-hidden', 'true')
    }

    card.className = `${homeCard.className} showcase-card showcase-home-card`
    card.dataset.carId = homeCard.dataset.carId || ''
    card.tabIndex = homeCard.tabIndex
    copyComputedStyle(homeCard, card)
    card.replaceChildren(...clone.childNodes)
    card.dataset.showcaseSynced = '2'
  }

  function syncShowcaseCards() {
    if (syncing) return
    const grid = document.getElementById('showcase-grid')
    if (!grid) return
    syncing = true
    try {
      const maps = homeCardMaps()
      grid.querySelectorAll('.car-card').forEach((card) => syncOneCard(card, maps))
    } finally {
      syncing = false
    }
  }

  function scheduleSync() {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      syncShowcaseCards()
    })
  }

  function installUppercaseSearch() {
    const input = document.getElementById('search-input')
    if (!input || input.dataset.uppercaseSearch === '1') return
    input.dataset.uppercaseSearch = '1'
    input.addEventListener('input', () => {
      const start = input.selectionStart
      const end = input.selectionEnd
      const upper = input.value.toUpperCase()
      if (upper === input.value) return
      input.value = upper
      if (typeof input.setSelectionRange === 'function' && start !== null && end !== null) input.setSelectionRange(start, end)
    })
  }

  function init() {
    installStyles()
    installUppercaseSearch()
    const grid = document.getElementById('showcase-grid')
    const nav = document.getElementById('social-nav')
    if (!grid || !nav) return
    nav.addEventListener('click', () => setTimeout(syncShowcaseCards, 0))
    new MutationObserver(scheduleSync).observe(grid, { childList:true })
    scheduleSync()
  }

  if (document.readyState === 'complete') init()
  else window.addEventListener('load', init, { once:true })
})()
