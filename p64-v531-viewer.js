(() => {
  const FIX_VERSION = '5.3.8'

  function syncDisplayedVersion() {
    document.querySelectorAll('.version-badge').forEach((el) => { el.textContent = `Version ${FIX_VERSION}` })
    document.documentElement.dataset.p64FixVersion = FIX_VERSION
  }

  function tuneTextInput(input, { autocorrect = true, spellcheck = true } = {}) {
    if (!input) return
    input.setAttribute('autocomplete','on')
    input.setAttribute('autocorrect', autocorrect ? 'on' : 'off')
    input.setAttribute('autocapitalize','characters')
    input.setAttribute('spellcheck', spellcheck ? 'true' : 'false')
  }

  function tuneEditorInputs() {
    ['model','series','custom-brand','custom-color'].forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:true, spellcheck:true }))
    ;['hotwheels-toy-number','general-number','series-collection-number'].forEach((id) => tuneTextInput(document.getElementById(id), { autocorrect:false, spellcheck:false }))
  }

  function boot() {
    syncDisplayedVersion()
    tuneEditorInputs()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true })
  else boot()
})()
