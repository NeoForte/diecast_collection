(() => {
  const FIX_VERSION = '6.0.9'
  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = `Version ${FIX_VERSION}` })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncDisplayedVersion, { once:true })
  else syncDisplayedVersion()
})()
