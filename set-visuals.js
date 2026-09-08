(() => {
  function installSetVisuals() {
    let style = document.getElementById('p64-set-visuals')
    if (!style) {
      style = document.createElement('style')
      style.id = 'p64-set-visuals'
      document.head.append(style)
    }
    style.textContent = `
      .set-slot-photo.set-empty-photo {
        background-image: url('pocket64-empty-slot.jpg?v=6.2.5') !important;
        background-position: center center !important;
        background-size: cover !important;
        background-repeat: no-repeat !important;
      }
    `
    document.documentElement.dataset.p64SetVisuals = '1'
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installSetVisuals, { once:true })
  } else {
    installSetVisuals()
  }
})()
