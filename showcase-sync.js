(() => {
  const STYLE_ID = 'p64-showcase-sync-style'
  let syncing = false
  let scheduled = false

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #social-screen .showcase-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }
      #social-screen .showcase-square-card {
        position: relative !important;
        display: block !important;
        aspect-ratio: 1 / 1 !important;
        min-height: 0 !important;
        border-radius: 14px !important;
        overflow: hidden !important;
        background: #0b0b0b !important;
        isolation: isolate;
        border: 1px solid rgba(192,192,192,.72) !important;
        box-shadow: 0 2px 14px rgba(0,0,0,.35) !important;
      }
      #social-screen .showcase-square-card .square-car-photo {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        aspect-ratio: 1 / 1 !important;
        background: #0b0b0b !important;
      }
      #social-screen .showcase-square-card .square-car-photo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        background: #0b0b0b !important;
      }
      #social-screen .showcase-square-card .square-card-gradient {
        position: absolute;
        inset: 38% 0 0;
        z-index: 2;
        pointer-events: none;
        background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.20) 24%, rgba(0,0,0,.88) 100%);
      }
      #social-screen .showcase-square-card .square-card-info {
        position: absolute !important;
        z-index: 4 !important;
        left: 8px !important;
        right: 8px !important;
        bottom: 7px !important;
        padding: 0 !important;
        display: grid !important;
        grid-template-columns: minmax(0,1fr) auto !important;
        align-items: end !important;
        gap: 6px !important;
        pointer-events: none;
        background: transparent !important;
      }
      #social-screen .showcase-square-card .square-card-copy { min-width: 0; }
      #social-screen .showcase-square-card .car-title {
        margin: 0 0 2px !important;
        color: #fff !important;
        font-size: 11.5px !important;
        line-height: 1.05 !important;
        font-weight: 900 !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 3px rgba(0,0,0,.9);
      }
      #social-screen .showcase-square-card .car-sub {
        margin: 0 !important;
        min-height: 0 !important;
        color: rgba(255,255,255,.76) !important;
        font-size: 8.5px !important;
        line-height: 1.05 !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px rgba(0,0,0,.9);
      }
      #social-screen .showcase-square-card .showcase-remove-button {
        pointer-events: auto !important;
        align-self: end;
        width: auto !important;
        min-width: 0 !important;
        min-height: 24px !important;
        margin: 0 !important;
        padding: 0 7px !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        border-radius: 8px !important;
        background: rgba(0,0,0,.66) !important;
        color: rgba(255,255,255,.82) !important;
        font-size: 8px !important;
        line-height: 1 !important;
        font-weight: 850 !important;
        backdrop-filter: blur(5px);
      }
      #social-screen .showcase-square-card .square-badge-stack {
        position: absolute !important;
        z-index: 5 !important;
        top: 6px !important;
        left: 6px !important;
        right: auto !important;
        max-width: calc(100% - 44px);
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 3px !important;
      }
      #social-screen .showcase-square-card .square-badge-stack .special-badge {
        position: static !important;
        max-width: 100%;
        min-height: 18px !important;
        padding: 2px 5px !important;
        border-radius: 5px !important;
        font-size: 7.5px !important;
        line-height: 1.05 !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #social-screen .showcase-favorite-star {
        position: absolute;
        z-index: 6;
        top: 6px;
        right: 7px;
        color: #5aa7ff;
        font-size: 22px;
        line-height: 1;
        text-shadow: 0 1px 3px rgba(0,0,0,.95), 0 0 8px rgba(90,167,255,.5);
        pointer-events: none;
      }
      #search-input { text-transform: uppercase; }
      @media (min-width: 700px) {
        #social-screen .showcase-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 12px !important;
        }
      }
    `
    document.head.append(style)
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

  function syncOneCard(card, maps) {
    if (!(card instanceof HTMLElement) || card.dataset.showcaseSynced === '1') return

    const photo = card.querySelector('.car-photo')
    const body = card.querySelector('.car-body')
    const title = card.querySelector('.car-title')
    const sub = card.querySelector('.car-sub')
    const remove = card.querySelector('.showcase-remove-button')
    if (!photo || !body || !title || !sub) return

    const img = photo.querySelector('img[data-private-photo-path]')
    const path = img?.dataset.privatePhotoPath || ''
    const textKey = `${title.textContent?.trim() || ''}\u241f${sub.textContent?.trim() || ''}`
    const homeCard = (path && maps.byPath.get(path)) || maps.byText.get(textKey) || null

    card.classList.add('square-car-card', 'showcase-square-card')
    photo.classList.add('square-car-photo')

    if (img && homeCard) {
      const homeImg = homeCard.querySelector('img[data-private-photo-path]')
      if (homeImg?.src && img.src !== homeImg.src) img.src = homeImg.src
    }

    let gradient = card.querySelector('.square-card-gradient')
    if (!gradient) {
      gradient = document.createElement('div')
      gradient.className = 'square-card-gradient'
      gradient.setAttribute('aria-hidden', 'true')
      photo.insertAdjacentElement('afterend', gradient)
    }

    const copy = document.createElement('div')
    copy.className = 'square-card-copy'
    copy.append(title, sub)
    body.className = 'square-card-info showcase-square-info'
    body.replaceChildren(copy)
    if (remove) body.append(remove)

    card.querySelector('.square-badge-stack')?.remove()
    card.querySelector('.showcase-favorite-star')?.remove()
    if (homeCard) {
      const badges = homeCard.querySelector('.square-badge-stack')
      if (badges) card.append(badges.cloneNode(true))
      if (homeCard.querySelector('.favorite-card-toggle.is-favorite')) {
        const star = document.createElement('span')
        star.className = 'showcase-favorite-star'
        star.textContent = '★'
        star.setAttribute('aria-hidden', 'true')
        card.append(star)
      }
    }

    card.dataset.showcaseSynced = '1'
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
    new MutationObserver(scheduleSync).observe(grid, { childList: true })
    scheduleSync()
  }

  if (document.readyState === 'complete') init()
  else window.addEventListener('load', init, { once: true })
})()
