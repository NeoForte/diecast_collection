import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0'

const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
const APP_URL = 'https://neoforte.github.io/diecast_collection/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const BRAND_PRESETS = ['None', 'Hot Wheels', 'Matchbox', 'M2', 'Cartuned', 'Maisto', 'Mini GT', 'Majorette', 'Pink Slips', 'Other']
const SPECIAL_STATUSES = ['TH', 'STH', 'Silver Series', 'Premium', 'Car Culture', 'Premium Pop Culture', 'Elite 64', 'Red Line Club', 'Chase', 'Rare', 'Limited', 'Multipack']
const COLOR_PRESETS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gold', 'Brown', 'Tan', 'Other']
const EXCLUSIVE_RETAILERS = ['Walmart', 'Target', 'Walgreens', 'Dollar General', 'Kroger', 'Other']
const EXCLUSIVE_TYPES = ['Store Recolor', 'ZAMAC', 'Red Edition', 'Exclusive Series', 'Other']
const APP_VERSION = '3.4.1'
const APPEARANCE_STORAGE_KEY = 'pocket64-appearance'
const LAST_BACKUP_STORAGE_KEY = 'pocket64-last-backup'
const BACKUP_REMINDER_DISMISSED_KEY = 'pocket64-backup-reminder-dismissed'
const BACKUP_REMINDER_MIN_CARS = 15
const BACKUP_REMINDER_DAYS = 30
const BACKUP_REMINDER_SNOOZE_DAYS = 7
const DIAGNOSTICS_STORAGE_KEY = 'pocket64-diagnostics-v1'
const DIAGNOSTICS_MAX_ENTRIES = 25

function readDiagnostics() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(-DIAGNOSTICS_MAX_ENTRIES) : []
  } catch { return [] }
}

function recordDiagnostic(kind, message, detail = '') {
  try {
    const entries = readDiagnostics()
    entries.push({
      at: new Date().toISOString(),
      version: APP_VERSION,
      kind: String(kind || 'error').slice(0, 40),
      message: String(message || 'Unknown error').slice(0, 500),
      detail: String(detail || '').slice(0, 500),
    })
    localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(entries.slice(-DIAGNOSTICS_MAX_ENTRIES)))
  } catch {}
}

window.addEventListener('error', (event) => {
  recordDiagnostic('javascript', event.message, `${event.filename || ''}:${event.lineno || ''}:${event.colno || ''}`)
})
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  recordDiagnostic('promise', reason?.message || reason || 'Unhandled promise rejection', reason?.stack || '')
})
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)')

function getSavedAppearance() {
  try { return localStorage.getItem(APPEARANCE_STORAGE_KEY) || 'dark' } catch { return 'dark' }
}

function applyAppearance(value = getSavedAppearance(), persist = false) {
  const choice = ['dark', 'light', 'system'].includes(value) ? value : 'dark'
  const resolved = choice === 'system' ? (systemThemeQuery.matches ? 'light' : 'dark') : choice
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.appearance = choice
  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) themeMeta.setAttribute('content', resolved === 'light' ? '#f3f4f6' : '#000000')
  const appearanceSelect = document.getElementById('appearance-select')
  if (appearanceSelect && appearanceSelect.value !== choice) appearanceSelect.value = choice
  if (persist) { try { localStorage.setItem(APPEARANCE_STORAGE_KEY, choice) } catch {} }
}

applyAppearance()
systemThemeQuery.addEventListener?.('change', () => {
  if (getSavedAppearance() === 'system') applyAppearance('system')
})

function specialClassForStatus(status) {
  const map = {
    'TH': 'special-th',
    'STH': 'special-sth',
    'Silver Series': 'special-silver-series',
    'Premium': 'special-premium',
    'Car Culture': 'special-car-culture',
    'Premium Pop Culture': 'special-car-culture',
    'Elite 64': 'special-elite-64',
    'Red Line Club': 'special-red-line-club',
    'Chase': 'special-chase',
    'Rare': 'special-rare',
    'Limited': 'special-limited',
  }
  return map[status] || ''
}

function badgeClassForStatus(status) {
  const map = {
    'TH': 'badge-th',
    'STH': 'badge-sth',
    'Silver Series': 'badge-silver-series',
    'Premium': 'badge-premium',
    'Car Culture': 'badge-car-culture',
    'Premium Pop Culture': 'badge-car-culture',
    'Elite 64': 'badge-elite-64',
    'Red Line Club': 'badge-red-line-club',
    'Chase': 'badge-chase',
    'Rare': 'badge-rare',
    'Limited': 'badge-limited',
    'Multipack': 'badge-multipack',
  }
  return map[status] || 'badge-default'
}

function slugForClass(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const $ = (id) => document.getElementById(id)
const authView = $('auth-view')
const mainView = $('main-view')
const mainNav = $('main-nav')
const collectionScreen = $('collection-screen')
const socialScreen = $('social-screen')
const statsScreen = $('stats-screen')
const editorScreen = $('editor-screen')
const settingsScreen = $('settings-screen')
const carsGrid = $('cars-grid')
const emptyState = $('empty-state')
const statsTotal = $('stats-total')
const statsGrandTotal = $('stats-grand-total')
const brandStats = $('brand-stats')
const searchInput = $('search-input')
const sortSelect = $('sort-select')
const authMessage = $('auth-message')
const editorMessage = $('editor-message')
const deleteButton = $('delete-button')
const photoPreview = $('photo-preview')
const photoPlaceholder = $('photo-placeholder')
const photoInput = $('photo-input')
const duplicateWarning = $('duplicate-warning')
const modelSuggestions = $('model-suggestions')
const toyNumberSuggestions = $('toy-number-suggestions')
const duplicateWarningText = $('duplicate-warning-text')
const duplicateIncreaseBtn = $('duplicate-increase-btn')
const duplicateAnywayBtn = $('duplicate-anyway-btn')
const customColorLabel = $('custom-color-label')
const customColor = $('custom-color')
const customCheckbox = $('is-custom')
const showcaseCheckbox = $('is-showcase')
const favoritesStat = $('favorites-stat')
const statsFavorites = $('stats-favorites')
const jdmStat = $('jdm-stat')
const statsJdm = $('stats-jdm')
const categorySelect = $('category')
const customCategoryLabel = $('custom-category-label')
const customCategory = $('custom-category')
const multipackFields = $('multipack-fields')
const packSizeSelect = $('pack-size')
const customPackSizeLabel = $('custom-pack-size-label')
const customPackSize = $('custom-pack-size')
const multipackOption = $('multipack-option')
const exclusiveRetailer = $('exclusive-retailer')
const exclusiveType = $('exclusive-type')
const exclusiveDetails = $('exclusive-details')

let session = null
let cars = []
let filteredCars = []
let editingCar = null
let selectedPhotoFile = null
let previewObjectUrl = null
let quickAddMode = false
let quickAddKeepBrand = ''
let quickAddKeepCustomBrand = ''
let duplicateDismissedModel = ''
let duplicateCheckTimer = null
let selectedDuplicateId = null
let loadedCarsUserId = null
let carsLoadPromise = null
let activeBrandFilter = null
let catalogSuggestionRequest = 0
let duplicateScanGroups = []
let collectionExtrasSupported = false

const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v2'
const photoUrlCache = new Map()
const photoLoadPromises = new Map()
const photoObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const img = entry.target
        photoObserver.unobserve(img)
        const path = img.dataset.privatePhotoPath
        if (path) loadPrivatePhoto(path, img)
      }
    }, { rootMargin: '180px 0px' })
  : null

function syncBrandCustomField() {
  const isOther = $('diecast-brand').value === 'Other'
  $('custom-brand-label').classList.toggle('hidden', !isOther)
  if (!isOther) $('custom-brand').value = ''
}

function syncMultipackFields() {
  const isMultipack = collectionExtrasSupported && $('special-status').value === 'Multipack'
  multipackFields?.classList.toggle('hidden', !isMultipack)
  const isOther = isMultipack && packSizeSelect?.value === 'other'
  customPackSizeLabel?.classList.toggle('hidden', !isOther)
  if (!isOther && customPackSize) customPackSize.value = ''
}

function syncExclusiveFields() {
  const retailer = exclusiveRetailer?.value || ''
  exclusiveDetails?.classList.toggle('hidden', !retailer)
  if (!retailer && exclusiveType) exclusiveType.value = ''
}

function syncCategoryCustomField() {
  const isOther = categorySelect?.value === 'Other'
  customCategoryLabel?.classList.toggle('hidden', !isOther)
  if (!isOther && customCategory) customCategory.value = ''
}

function setCategoryValue(value) {
  if (!categorySelect) return
  const raw = String(value ?? '').trim()
  const presets = ['JDM', 'Transport / Hauler', 'Emergency / Service']
  const preset = presets.find((item) => item.toLowerCase() === raw.toLowerCase())
  if (!raw) {
    categorySelect.value = ''
    if (customCategory) customCategory.value = ''
  } else if (preset) {
    categorySelect.value = preset
    if (customCategory) customCategory.value = ''
  } else {
    categorySelect.value = 'Other'
    if (customCategory) customCategory.value = raw
  }
  syncCategoryCustomField()
}

function applyCatalogExclusive(car) {
  if (!car) return
  if (exclusiveRetailer) exclusiveRetailer.value = car.exclusive_retailer || ''
  if (exclusiveType) exclusiveType.value = car.exclusive_type || ''
  syncExclusiveFields()
}

function normalizedPackSize(car) {
  if (car?.special_status !== 'Multipack') return 1
  const size = Math.floor(Number(car?.pack_size) || 0)
  return size >= 2 ? size : 1
}

function totalCarsFor(car) {
  const qty = Math.max(1, Number(car?.quantity) || 1)
  return qty * normalizedPackSize(car)
}

async function detectCollectionExtrasSupport() {
  if (!session?.user) return false
  const { error } = await supabase
    .from('cars')
    .select('is_favorite,is_showcase,pack_size,exclusive_retailer,exclusive_type')
    .eq('user_id', session.user.id)
    .limit(1)
  collectionExtrasSupported = !error
  if (error) console.info('Favorites, Showcase, multipacks, and exclusives are staged until the Pocket 64 database update is applied.')
  favoritesStat?.classList.toggle('hidden', !collectionExtrasSupported)
  if (multipackOption) multipackOption.disabled = !collectionExtrasSupported
  syncMultipackFields()
  return collectionExtrasSupported
}


function syncColorCustomField() {
  const isOther = $('color').value === 'Other'
  customColorLabel.classList.toggle('hidden', !isOther)
  if (!isOther) customColor.value = ''
}

function syncYearCustomField() {
  const isOther = $('model-year').value === 'Other'
  $('custom-year-label').classList.toggle('hidden', !isOther)
  if (!isOther) $('custom-year').value = ''
}

function setBrandValue(value) {
  const raw = String(value ?? '').trim()
  const preset = BRAND_PRESETS.find((brand) => brand !== 'Other' && brand.toLowerCase() === raw.toLowerCase())
  if (!raw) {
    $('diecast-brand').value = ''
    $('custom-brand').value = ''
  } else if (preset) {
    $('diecast-brand').value = preset
    $('custom-brand').value = ''
  } else if (raw.toLowerCase() === 'other') {
    $('diecast-brand').value = 'Other'
    $('custom-brand').value = ''
  } else {
    $('diecast-brand').value = 'Other'
    $('custom-brand').value = raw
  }
  syncBrandCustomField()
}

function setYearValue(value) {
  const raw = String(value ?? '').trim()
  const year = Number(raw)
  const inPresetRange = Number.isInteger(year) && year >= 2000 && year <= 2028 && String(year) === raw
  if (!raw) {
    $('model-year').value = ''
    $('custom-year').value = ''
  } else if (inPresetRange) {
    $('model-year').value = raw
    $('custom-year').value = ''
  } else {
    $('model-year').value = 'Other'
    $('custom-year').value = raw
  }
  syncYearCustomField()
}

function setSpecialValue(value) {
  const raw = String(value ?? '').trim()
  const select = $('special-status')
  for (const option of [...select.options]) {
    if (option.dataset.legacyCustom === 'true') option.remove()
  }
  const preset = SPECIAL_STATUSES.find((status) => status.toLowerCase() === raw.toLowerCase())
  if (!raw) {
    select.value = ''
  } else if (preset) {
    select.value = preset
  } else {
    // Preserve old custom special-category values when editing, without offering
    // a new free-text Custom Special Category field.
    const option = document.createElement('option')
    option.value = raw
    option.textContent = raw.toUpperCase()
    option.dataset.legacyCustom = 'true'
    select.appendChild(option)
    select.value = raw
  }
}

function setColorValue(value) {
  const raw = String(value ?? '').trim()
  const preset = COLOR_PRESETS.find((color) => color !== 'Other' && color.toLowerCase() === raw.toLowerCase())
  if (!raw) {
    $('color').value = ''
    customColor.value = ''
  } else if (preset) {
    $('color').value = preset
    customColor.value = ''
  } else {
    $('color').value = 'Other'
    customColor.value = raw
  }
  syncColorCustomField()
}

function setActiveNav(active) {
  $('collection-nav').classList.toggle('active', active === 'collection')
  $('social-nav').classList.toggle('active', active === 'social')
  $('stats-nav').classList.toggle('active', active === 'stats')
}

function hideScreens() {
  collectionScreen.classList.remove('active')
  socialScreen.classList.remove('active')
  statsScreen.classList.remove('active')
  settingsScreen.classList.remove('active')
  editorScreen.classList.remove('active')
}

function showAuth() {
  authView.classList.remove('hidden')
  mainView.classList.add('hidden')
}

function showMain() {
  authView.classList.add('hidden')
  mainView.classList.remove('hidden')
  showCollection()
}

function showCollection() {
  hideScreens()
  collectionScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav('collection')
  syncBackToTopButton?.()
}


function showSocial() {
  hideScreens()
  backToTopButton?.classList.add('hidden')
  socialScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav('social')
  renderShowcase()
}

function showStats() {
  hideScreens()
  backToTopButton?.classList.add('hidden')
  statsScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav('stats')
  renderStats()
}

function getStoredTimestamp(key) {
  try {
    const value = Number(localStorage.getItem(key) || 0)
    return Number.isFinite(value) ? value : 0
  } catch { return 0 }
}

function formatBackupDate(timestamp) {
  if (!timestamp) return 'No backup recorded on this device yet.'
  return `Last backup: ${new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function updateBackupStatus() {
  const timestamp = getStoredTimestamp(LAST_BACKUP_STORAGE_KEY)
  const text = $('last-backup-text')
  if (text) text.textContent = formatBackupDate(timestamp)
}

function updateBackupReminder() {
  const reminder = $('backup-reminder')
  if (!reminder) return
  const now = Date.now()
  const last = getStoredTimestamp(LAST_BACKUP_STORAGE_KEY)
  const dismissed = getStoredTimestamp(BACKUP_REMINDER_DISMISSED_KEY)
  const oldEnough = !last || (now - last) >= BACKUP_REMINDER_DAYS * 86400000
  const snoozed = dismissed && (now - dismissed) < BACKUP_REMINDER_SNOOZE_DAYS * 86400000
  const shouldShow = cars.length >= BACKUP_REMINDER_MIN_CARS && oldEnough && !snoozed
  reminder.classList.toggle('hidden', !shouldShow)
  if (shouldShow) {
    const copy = $('backup-reminder-copy')
    if (copy) copy.textContent = last ? 'Your last backup is getting old.' : 'Create your first portable backup.'
  }
}

function recordSuccessfulBackup() {
  try {
    localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(Date.now()))
    localStorage.removeItem(BACKUP_REMINDER_DISMISSED_KEY)
  } catch {}
  updateBackupStatus()
  updateBackupReminder()
}

function showSettings() {
  hideScreens()
  backToTopButton?.classList.add('hidden')
  settingsScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav(null)
  const appearanceSelect = $('appearance-select')
  if (appearanceSelect) appearanceSelect.value = getSavedAppearance()
  updateBackupStatus()
  hideDuplicateScanResults()
}


function normalizeModel(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function modelMatches(value) {
  const normalized = normalizeModel(value)
  if (!normalized || editingCar) return []
  return cars.filter((car) => normalizeModel(car.model) === normalized)
}

function matchingModelCars(value) {
  const q = normalizeModel(value)
  if (!q) return []
  return cars
    .filter((car) => normalizeModel(car.model).includes(q))
    .sort((a, b) => {
      const am = normalizeModel(a.model)
      const bm = normalizeModel(b.model)
      const aStarts = am.startsWith(q) ? 0 : 1
      const bStarts = bm.startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return am.localeCompare(bm, undefined, { numeric: true, sensitivity: 'base' })
    })
    .slice(0, 8)
}

function hideModelSuggestions() {
  modelSuggestions.classList.add('hidden')
  modelSuggestions.replaceChildren()
}

async function renderModelSuggestions() {
  const input = $('model')
  const q = input.value.trim()
  const requestId = ++catalogSuggestionRequest
  if (!q) {
    hideModelSuggestions()
    return
  }

  const garageMatches = matchingModelCars(q)
  const brandChoice = $('diecast-brand').value
  const brandName = brandChoice === 'Other' ? $('custom-brand').value.trim() : brandChoice
  const allowCatalog = !brandName || brandName.toLowerCase() === 'hot wheels'
  let catalogMatches = []

  if (allowCatalog && session?.user) {
    const safeQuery = q.replace(/[%_]/g, '')
    if (safeQuery) {
      const { data, error } = await supabase
        .from('catalog_cars')
        .select('id,diecast_brand,model,model_year,series_collection,general_number,series_collection_number,hotwheels_toy_number,color,special_status,exclusive_retailer,exclusive_type')
        .ilike('model', `%${safeQuery}%`)
        .order('model', { ascending: true })
        .limit(10)
      if (!error && Array.isArray(data)) catalogMatches = data
    }
  }

  if (requestId !== catalogSuggestionRequest || input.value.trim() !== q) return
  if (!garageMatches.length && !catalogMatches.length) {
    hideModelSuggestions()
    return
  }

  modelSuggestions.replaceChildren()

  for (const car of garageMatches.slice(0, 5)) {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'model-suggestion'
    option.setAttribute('role', 'option')

    const thumb = document.createElement('div')
    thumb.className = 'model-suggestion-thumb'
    thumb.textContent = '🚗'
    if (car.photo_path) {
      const img = document.createElement('img')
      img.alt = ''
      thumb.replaceChildren(img)
      loadPrivatePhoto(car.photo_path, img)
    }

    const text = document.createElement('span')
    text.className = 'model-suggestion-text'
    const title = document.createElement('span')
    title.className = 'model-suggestion-title'
    title.textContent = car.model || 'Untitled Car'
    const meta = document.createElement('span')
    meta.className = 'model-suggestion-meta'
    const qty = Math.max(1, Number(car.quantity) || 1)
    meta.textContent = ['YOUR GARAGE', car.diecast_brand, car.model_year, car.color, car.hotwheels_toy_number, `Qty ${qty}`].filter(Boolean).join(' · ')
    text.append(title, meta)
    option.append(thumb, text)
    option.addEventListener('mousedown', (event) => event.preventDefault())
    option.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      input.value = car.model || ''
      hideModelSuggestions()
      duplicateDismissedModel = ''
      checkDuplicateModel()
      input.focus()
    })
    modelSuggestions.append(option)
  }

  for (const car of catalogMatches) {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'model-suggestion catalog-model-suggestion'
    option.setAttribute('role', 'option')

    const thumb = document.createElement('div')
    thumb.className = 'model-suggestion-thumb catalog-suggestion-thumb'
    thumb.textContent = 'CAT'

    const text = document.createElement('span')
    text.className = 'model-suggestion-text'
    const title = document.createElement('span')
    title.className = 'model-suggestion-title'
    title.textContent = car.model || 'Untitled Car'
    const meta = document.createElement('span')
    meta.className = 'model-suggestion-meta'
    meta.textContent = [car.model_year, car.series_collection, car.category, car.general_number, car.hotwheels_toy_number, car.special_status].filter(Boolean).join(' · ')
    text.append(title, meta)
    option.append(thumb, text)

    option.addEventListener('mousedown', (event) => event.preventDefault())
    option.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      applyCatalogCarToEditor(car, input, { applyExclusive: false })
    })
    modelSuggestions.append(option)
  }

  modelSuggestions.classList.remove('hidden')
}


function hideToyNumberSuggestions() {
  toyNumberSuggestions.classList.add('hidden')
  toyNumberSuggestions.replaceChildren()
}

function applyCatalogCarToEditor(car, focusTarget = null, options = {}) {
  const { applyExclusive = false } = options
  setBrandValue(car.diecast_brand || 'Hot Wheels')
  $('model').value = car.model || ''
  setYearValue(car.model_year || '')
  $('hotwheels-toy-number').value = String(car.hotwheels_toy_number || '').toUpperCase()
  $('series').value = String(car.series_collection || '').toUpperCase()
  $('general-number').value = String(car.general_number || '').toUpperCase()
  $('series-collection-number').value = String(car.series_collection_number || '').toUpperCase()
  setSpecialValue(car.special_status || '')
  if (applyExclusive) applyCatalogExclusive(car)
  // Exclusive detection is intentionally limited to Toy Number / SKU matching.
  // Color intentionally stays blank because it is not in the imported catalog.
  setColorValue('')
  hideModelSuggestions()
  hideToyNumberSuggestions()
  duplicateDismissedModel = ''
  checkDuplicateModel()
  if (focusTarget) focusTarget.focus()
}

async function addOneFromSkuSuggestion(car, button) {
  if (!car?.id || !session?.user) return
  const currentQty = Math.max(1, Number(car.quantity) || 1)
  const originalText = button?.textContent || 'Add 1'
  if (button) {
    button.disabled = true
    button.textContent = 'Adding…'
  }
  try {
    const { error } = await supabase
      .from('cars')
      .update({ quantity: currentQty + 1, updated_at: new Date().toISOString() })
      .eq('id', car.id)
      .eq('user_id', session.user.id)
    if (error) throw error
    car.quantity = currentQty + 1
    car.updated_at = new Date().toISOString()
    await loadCars()
    hideToyNumberSuggestions()
    if (quickAddMode) {
      const keptBrand = $('diecast-brand').value
      const keptCustomBrand = $('custom-brand').value
      quickAddKeepBrand = keptBrand
      quickAddKeepCustomBrand = keptCustomBrand
      showEditor(null, { quick: true })
      editorMessage.textContent = `Quantity increased to ${currentQty + 1} ✓ Ready for the next car.`
      setTimeout(() => { if (quickAddMode) editorMessage.textContent = '' }, 1600)
    } else {
      showCollection()
    }
  } catch (error) {
    console.error(error)
    window.alert(error.message || 'Could not update quantity.')
    if (button) {
      button.disabled = false
      button.textContent = originalText
    }
  }
}

async function renderToyNumberSuggestions() {
  const input = $('hotwheels-toy-number')
  const q = input.value.trim().toUpperCase()
  if (!q || !session?.user) {
    hideToyNumberSuggestions()
    return
  }

  const safeQuery = q.replace(/[%_]/g, '')
  if (!safeQuery) {
    hideToyNumberSuggestions()
    return
  }

  // Your own garage always wins. Exact SKU matches sort first, then prefix/partial matches.
  const garageMatches = cars
    .filter((car) => !editingCar || car.id !== editingCar.id)
    .filter((car) => String(car.hotwheels_toy_number || '').toUpperCase().includes(q))
    .sort((a, b) => {
      const an = String(a.hotwheels_toy_number || '').toUpperCase()
      const bn = String(b.hotwheels_toy_number || '').toUpperCase()
      const ae = an === q ? 0 : an.startsWith(q) ? 1 : 2
      const be = bn === q ? 0 : bn.startsWith(q) ? 1 : 2
      if (ae !== be) return ae - be
      return an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' })
    })

  const brandChoice = $('diecast-brand').value
  const brandName = brandChoice === 'Other' ? $('custom-brand').value.trim() : brandChoice
  const allowCatalog = !brandName || brandName.toLowerCase() === 'hot wheels'
  let catalogMatches = []

  if (allowCatalog) {
    const { data, error } = await supabase
      .from('catalog_cars')
      .select('id,diecast_brand,model,model_year,series_collection,general_number,series_collection_number,hotwheels_toy_number,color,special_status,exclusive_retailer,exclusive_type')
      .ilike('hotwheels_toy_number', `%${safeQuery}%`)
      .limit(12)
    if (!error && Array.isArray(data)) catalogMatches = data
  }

  if (input.value.trim().toUpperCase() !== q) return
  if (!garageMatches.length && !catalogMatches.length) {
    hideToyNumberSuggestions()
    return
  }

  catalogMatches.sort((a, b) => {
    const an = String(a.hotwheels_toy_number || '').toUpperCase()
    const bn = String(b.hotwheels_toy_number || '').toUpperCase()
    const ae = an === q ? 0 : an.startsWith(q) ? 1 : 2
    const be = bn === q ? 0 : bn.startsWith(q) ? 1 : 2
    if (ae !== be) return ae - be
    return an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' })
  })

  toyNumberSuggestions.replaceChildren()

  for (const car of garageMatches.slice(0, 5)) {
    const option = document.createElement('div')
    option.className = `model-suggestion garage-sku-suggestion${String(car.hotwheels_toy_number || '').toUpperCase() === q ? ' exact-garage-sku' : ''}`
    option.setAttribute('role', 'option')

    const thumb = document.createElement('div')
    thumb.className = 'model-suggestion-thumb'
    thumb.textContent = '🚗'
    if (car.photo_path) {
      const img = document.createElement('img')
      img.alt = ''
      thumb.replaceChildren(img)
      lazyLoadPrivatePhoto(car.photo_path, img)
    }

    const text = document.createElement('span')
    text.className = 'model-suggestion-text'
    const title = document.createElement('span')
    title.className = 'model-suggestion-title'
    title.textContent = `${car.hotwheels_toy_number || '—'} · ${car.model || 'Untitled Car'}`
    const meta = document.createElement('span')
    meta.className = 'model-suggestion-meta garage-sku-meta'
    const qty = Math.max(1, Number(car.quantity) || 1)
    meta.textContent = ['IN YOUR GARAGE', `QTY ${qty}`, car.model_year, car.color, car.series_collection, car.general_number].filter(Boolean).join(' · ')
    text.append(title, meta)

    const addButton = document.createElement('button')
    addButton.type = 'button'
    addButton.className = 'sku-add-one-button'
    addButton.textContent = 'Add 1'
    addButton.setAttribute('aria-label', `Add one ${car.model || 'car'} to your existing quantity`)
    addButton.addEventListener('mousedown', (event) => event.preventDefault())
    addButton.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await addOneFromSkuSuggestion(car, addButton)
    })

    option.addEventListener('mousedown', (event) => event.preventDefault())
    option.addEventListener('click', (event) => {
      if (event.target.closest('.sku-add-one-button')) return
      event.preventDefault()
      event.stopPropagation()
      $('model').value = car.model || ''
      setBrandValue(car.diecast_brand || '')
      setYearValue(car.model_year || '')
      input.value = String(car.hotwheels_toy_number || '').toUpperCase()
      $('series').value = String(car.series_collection || '').toUpperCase()
      $('general-number').value = String(car.general_number || '').toUpperCase()
      $('series-collection-number').value = String(car.series_collection_number || '').toUpperCase()
      setColorValue(car.color || '')
      hideToyNumberSuggestions()
      duplicateDismissedModel = ''
      checkDuplicateModel()
      input.focus()
    })

    option.append(thumb, text, addButton)
    toyNumberSuggestions.append(option)
  }

  for (const car of catalogMatches.slice(0, 10)) {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'model-suggestion catalog-model-suggestion'
    option.setAttribute('role', 'option')

    const thumb = document.createElement('div')
    thumb.className = 'model-suggestion-thumb catalog-suggestion-thumb'
    thumb.textContent = 'CAT'

    const text = document.createElement('span')
    text.className = 'model-suggestion-text'
    const title = document.createElement('span')
    title.className = 'model-suggestion-title'
    title.textContent = `${car.hotwheels_toy_number || '—'} · ${car.model || 'Untitled Car'}`
    const meta = document.createElement('span')
    meta.className = 'model-suggestion-meta'
    const isPossibleExclusive = Boolean(car.exclusive_retailer || car.exclusive_type)
    if (isPossibleExclusive) option.classList.add('possible-exclusive-suggestion')
    meta.textContent = [
      isPossibleExclusive ? 'POSSIBLE EXCLUSIVE' : '',
      car.exclusive_retailer,
      car.exclusive_type,
      car.model_year,
      car.series_collection,
      car.general_number,
      car.special_status
    ].filter(Boolean).join(' · ')
    text.append(title, meta)
    option.append(thumb, text)

    option.addEventListener('mousedown', (event) => event.preventDefault())
    option.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      applyCatalogCarToEditor(car, input, { applyExclusive: true })
    })
    toyNumberSuggestions.append(option)
  }

  toyNumberSuggestions.classList.remove('hidden')
}

function hideDuplicateWarning() {
  duplicateWarning.classList.add('hidden')
  duplicateWarningText.textContent = ''
  selectedDuplicateId = null
  duplicateIncreaseBtn.classList.remove('hidden')
  duplicateIncreaseBtn.disabled = false
  duplicateIncreaseBtn.textContent = 'Increase Qty'
  const matchList = $('duplicate-match-list')
  matchList?.replaceChildren()
  matchList?.classList.add('hidden')
}

function renderDuplicateMatchList(matches) {
  const host = $('duplicate-match-list')
  if (!host) return
  host.replaceChildren()
  if (!matches.length) {
    host.classList.add('hidden')
    return
  }

  const selectMatch = (car, row) => {
    selectedDuplicateId = car.id
    for (const item of host.querySelectorAll('.duplicate-match-row')) {
      item.classList.toggle('is-selected', item === row)
      item.setAttribute('aria-pressed', item === row ? 'true' : 'false')
    }
    duplicateIncreaseBtn.disabled = false
    duplicateIncreaseBtn.textContent = matches.length === 1 ? 'Add 1 to This Car' : 'Add 1 to Selected'
  }

  for (const car of matches.slice(0, 4)) {
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'duplicate-match-row'
    row.setAttribute('aria-pressed', 'false')
    row.setAttribute('aria-label', `Select ${displayTitle(car)} to increase its quantity`)

    const thumb = document.createElement('div')
    thumb.className = 'duplicate-match-thumb'
    if (car.photo_path) {
      const img = document.createElement('img')
      img.alt = `${displayTitle(car)} existing car`
      thumb.append(img)
      lazyLoadPrivatePhoto(car.photo_path, img)
    } else {
      const empty = document.createElement('span')
      empty.textContent = 'NO PHOTO'
      thumb.append(empty)
    }

    const copy = document.createElement('div')
    copy.className = 'duplicate-match-copy'
    const title = document.createElement('div')
    title.className = 'duplicate-match-title'
    title.textContent = displayTitle(car)
    const qty = Math.max(1, Number(car.quantity) || 1)
    const meta = document.createElement('div')
    meta.className = 'duplicate-match-meta'
    meta.textContent = [
      car.model_year,
      car.hotwheels_toy_number ? `SKU ${car.hotwheels_toy_number}` : '',
      car.color,
      `QTY ${qty}`,
    ].filter(Boolean).join(' · ') || 'Existing entry'
    copy.append(title, meta)
    row.append(thumb, copy)
    row.addEventListener('click', () => selectMatch(car, row))
    host.append(row)

    if (matches.length === 1) selectMatch(car, row)
  }

  if (matches.length > 4) {
    const more = document.createElement('div')
    more.className = 'duplicate-match-more'
    more.textContent = `+${matches.length - 4} more matching entries — refine Model or SKU to narrow the list`
    host.append(more)
  }
  host.classList.remove('hidden')
}

function checkDuplicateModel() {
  const raw = $('model').value.trim()
  const normalized = normalizeModel(raw)
  if (!normalized || normalized === duplicateDismissedModel || editingCar) {
    hideDuplicateWarning()
    return
  }

  const matches = modelMatches(raw)
  if (!matches.length) {
    hideDuplicateWarning()
    return
  }

  duplicateWarning.classList.remove('hidden')
  renderDuplicateMatchList(matches)
  if (matches.length === 1) {
    const match = matches[0]
    const qty = Math.max(1, Number(match.quantity) || 1)
    const brand = match.diecast_brand ? `${match.diecast_brand} · ` : ''
    duplicateWarningText.textContent = `Possible duplicate: ${brand}${match.model} is already in your garage (qty ${qty}).`
    duplicateIncreaseBtn.classList.remove('hidden')
    duplicateIncreaseBtn.textContent = 'Add 1 to This Car'
  } else {
    selectedDuplicateId = null
    duplicateWarningText.textContent = `Possible duplicate: ${matches.length} existing entries use the model “${raw}”. Tap the matching car below, then add 1 to that entry — or Add Anyway for a different release.`
    duplicateIncreaseBtn.classList.remove('hidden')
    duplicateIncreaseBtn.textContent = 'Add 1 to Selected'
    duplicateIncreaseBtn.disabled = true
  }
}

async function increaseDuplicateQuantity() {
  const matches = modelMatches($('model').value)
  if (!matches.length || !session?.user) return
  const match = matches.find((car) => car.id === selectedDuplicateId) || (matches.length === 1 ? matches[0] : null)
  if (!match) {
    duplicateWarningText.textContent = 'Tap the matching car first, then choose Add 1 to Selected.'
    return
  }
  const currentQty = Math.max(1, Number(match.quantity) || 1)
  duplicateIncreaseBtn.disabled = true
  duplicateAnywayBtn.disabled = true
  duplicateWarningText.textContent = 'Updating quantity…'
  try {
    const { error } = await supabase
      .from('cars')
      .update({ quantity: currentQty + 1, updated_at: new Date().toISOString() })
      .eq('id', match.id)
      .eq('user_id', session.user.id)
    if (error) throw error
    await loadCars()
    const keptBrand = $('diecast-brand').value
    const keptCustomBrand = $('custom-brand').value
    if (quickAddMode) {
      quickAddKeepBrand = keptBrand
      quickAddKeepCustomBrand = keptCustomBrand
      showEditor(null, { quick: true })
      editorMessage.textContent = `Quantity increased to ${currentQty + 1} ✓ Ready for the next car.`
      setTimeout(() => { if (quickAddMode) editorMessage.textContent = '' }, 1600)
    } else {
      showCollection()
    }
  } catch (error) {
    duplicateWarningText.textContent = error.message || 'Could not update quantity.'
  } finally {
    duplicateIncreaseBtn.disabled = false
    duplicateAnywayBtn.disabled = false
  }
}

function showEditor(car = null, options = {}) {
  hideScreens()
  editorScreen.classList.add('active')
  mainNav.classList.add('hidden')
  editingCar = car
  quickAddMode = !car && Boolean(options.quick)
  selectedPhotoFile = null
  editorMessage.textContent = ''
  duplicateDismissedModel = ''
  hideDuplicateWarning()
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = null
  $('editor-title').textContent = car ? 'Car Details' : (quickAddMode ? 'Quick Add' : 'Add Car')
  $('save-button').textContent = quickAddMode ? 'Save & Next' : 'Save'
  $('more-details-toggle').classList.toggle('hidden', !quickAddMode)
  $('more-details-section').classList.toggle('quick-collapsed', quickAddMode)
  $('more-details-toggle').textContent = 'More Details ▾'
  deleteButton.classList.toggle('hidden', !car)
  $('share-button').classList.toggle('hidden', !car)
  fillEditor(car)
  if (quickAddMode && quickAddKeepBrand) {
    $('diecast-brand').value = quickAddKeepBrand
    $('custom-brand').value = quickAddKeepCustomBrand
    syncBrandCustomField()
  }
}

function fillEditor(car) {
  setBrandValue(car?.diecast_brand ?? '')
  customCheckbox.checked = Boolean(car?.is_custom)
  if (showcaseCheckbox) showcaseCheckbox.checked = Boolean(car?.is_showcase)
  $('model').value = car?.model ?? ''
  hideModelSuggestions()
  setYearValue(car?.model_year ?? '')
  setColorValue(car?.color ?? '')
  $('hotwheels-toy-number').value = String(car?.hotwheels_toy_number ?? '').toUpperCase()
  $('series').value = car?.series_collection ?? ''
  setCategoryValue(car?.category ?? '')
  $('general-number').value = car?.general_number ?? ''
  $('series-collection-number').value = car?.series_collection_number ?? ''
  $('quantity').value = String(car?.quantity ?? 1)
  syncQuantityDisplay()
  setSpecialValue(car?.special_status ?? '')
  if (packSizeSelect) {
    const packSize = Math.floor(Number(car?.pack_size) || 5)
    const common = ['5','8','10','20','3','2','50','60']
    packSizeSelect.value = common.includes(String(packSize)) ? String(packSize) : 'other'
    customPackSize.value = packSizeSelect.value === 'other' ? String(packSize) : ''
  }
  syncMultipackFields()
  if (exclusiveRetailer) exclusiveRetailer.value = car?.exclusive_retailer ?? ''
  if (exclusiveType) exclusiveType.value = car?.exclusive_type ?? ''
  syncExclusiveFields()
  $('notes').value = car?.notes ?? ''
  photoInput.value = ''
  setPhotoPreview(null)
  if (car?.photo_path) loadPrivatePhoto(car.photo_path, photoPreview, photoPlaceholder)
}

function setPhotoPreview(src) {
  if (src) {
    photoPreview.src = src
    photoPreview.classList.remove('hidden')
    photoPlaceholder.classList.add('hidden')
  } else {
    photoPreview.removeAttribute('src')
    photoPreview.classList.add('hidden')
    photoPlaceholder.classList.remove('hidden')
  }
}


function privatePhotoCacheName() {
  const userKey = session?.user?.id || 'signed-out'
  return `${PRIVATE_PHOTO_CACHE_PREFIX}-${userKey}`
}

function privatePhotoCacheRequest(path) {
  const cacheUrl = new URL(`./__p64_photo_cache__/${encodeURIComponent(path)}`, window.location.href)
  return new Request(cacheUrl.href, { method: 'GET' })
}

async function readCachedPrivatePhoto(path) {
  if (!('caches' in window)) return null
  try {
    const cache = await caches.open(privatePhotoCacheName())
    return await cache.match(privatePhotoCacheRequest(path))
  } catch (err) {
    console.warn('Photo cache read failed', err)
    return null
  }
}

async function cachePrivatePhotoResponse(path, response) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(privatePhotoCacheName())
    await cache.put(privatePhotoCacheRequest(path), response)
  } catch (err) {
    console.warn('Photo cache write failed', err)
  }
}

async function getPrivatePhotoBlob(path) {
  const cachedResponse = await readCachedPrivatePhoto(path)
  if (cachedResponse) return cachedResponse.blob()

  const { data, error } = await supabase.storage.from('car-photos').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return null

  const response = await fetch(data.signedUrl, { cache: 'no-store' })
  if (!response.ok) return null
  const responseForCache = response.clone()
  const blob = await response.blob()
  await cachePrivatePhotoResponse(path, responseForCache)
  return blob
}

async function getPrivatePhotoUrl(path) {
  const cached = photoUrlCache.get(path)
  if (cached?.url) return cached.url

  if (photoLoadPromises.has(path)) return photoLoadPromises.get(path)

  const promise = (async () => {
    const blob = await getPrivatePhotoBlob(path)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    photoUrlCache.set(path, { url })
    return url
  })().finally(() => photoLoadPromises.delete(path))

  photoLoadPromises.set(path, promise)
  return promise
}

async function invalidatePrivatePhotoCache(path) {
  if (!path) return
  const cached = photoUrlCache.get(path)
  if (cached?.url?.startsWith('blob:')) URL.revokeObjectURL(cached.url)
  photoUrlCache.delete(path)
  photoLoadPromises.delete(path)
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(privatePhotoCacheName())
    await cache.delete(privatePhotoCacheRequest(path))
  } catch (err) {
    console.warn('Photo cache invalidation failed', err)
  }
}

async function prunePrivatePhotoCache(validPaths = []) {
  if (!('caches' in window)) return
  const valid = new Set(validPaths.filter(Boolean))
  try {
    const cache = await caches.open(privatePhotoCacheName())
    const requests = await cache.keys()
    const marker = '/__p64_photo_cache__/'
    await Promise.all(requests.map(async (request) => {
      try {
        const url = new URL(request.url)
        const markerIndex = url.pathname.indexOf(marker)
        if (markerIndex < 0) return
        const encodedPath = url.pathname.slice(markerIndex + marker.length)
        const path = decodeURIComponent(encodedPath)
        if (!valid.has(path)) {
          await cache.delete(request)
          const cached = photoUrlCache.get(path)
          if (cached?.url?.startsWith('blob:')) URL.revokeObjectURL(cached.url)
          photoUrlCache.delete(path)
          photoLoadPromises.delete(path)
        }
      } catch (err) {
        console.warn('Could not inspect cached photo entry', err)
      }
    }))
  } catch (err) {
    console.warn('Photo cache cleanup failed', err)
  }
}

function clearPrivatePhotoMemoryCache() {
  for (const cached of photoUrlCache.values()) {
    if (cached?.url?.startsWith('blob:')) URL.revokeObjectURL(cached.url)
  }
  photoUrlCache.clear()
  photoLoadPromises.clear()
}

async function loadPrivatePhoto(path, imgEl, placeholderEl = null) {
  const signedUrl = await getPrivatePhotoUrl(path)
  if (!signedUrl || !imgEl.isConnected) return
  imgEl.src = signedUrl
  imgEl.classList.remove('hidden')
  if (placeholderEl) placeholderEl.classList.add('hidden')
}

function lazyLoadPrivatePhoto(path, imgEl) {
  imgEl.loading = 'lazy'
  imgEl.decoding = 'async'
  imgEl.dataset.privatePhotoPath = path
  if (photoObserver) photoObserver.observe(imgEl)
  else loadPrivatePhoto(path, imgEl)
}

async function loadCars() {
  const userId = session?.user?.id
  if (!userId) return
  if (carsLoadPromise) return carsLoadPromise

  carsLoadPromise = (async () => {
    await detectCollectionExtrasSupport()
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }
    if (session?.user?.id !== userId) return
    cars = data ?? []
    loadedCarsUserId = userId
    await prunePrivatePhotoCache([
      ...cars.map((car) => car.photo_path).filter(Boolean),
      `${userId}/profile-icon.jpg`,
    ])
    applySearch()
    renderStats()
    updateBackupReminder()
  })().finally(() => { carsLoadPromise = null })

  return carsLoadPromise
}

function backupFilename(extension = 'zip') {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `Pocket64_Backup_${year}-${month}-${day}.${extension}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function requireZipSupport() {
  if (!window.JSZip) throw new Error('Backup ZIP support did not load. Refresh the app and try again.')
  return window.JSZip
}

async function sha256Hex(value) {
  const buffer = value instanceof Blob
    ? await value.arrayBuffer()
    : (value instanceof ArrayBuffer ? value : new TextEncoder().encode(String(value)))
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function validateBackupIntegrity(zip, backup) {
  const integrityEntry = zip?.file('integrity.json')
  if (!integrityEntry) {
    if ((Number(backup?.version) || 1) >= 6) throw new Error('Backup integrity manifest is missing.')
    return { verified: false, legacy: true }
  }

  const integrity = JSON.parse(await integrityEntry.async('string'))
  if (integrity?.algorithm !== 'SHA-256' || !integrity?.files || typeof integrity.files !== 'object') {
    throw new Error('Backup integrity manifest is invalid.')
  }

  const backupEntry = zip.file('backup.json')
  const backupText = await backupEntry.async('string')
  const expectedBackupHash = integrity.files['backup.json']
  if (!expectedBackupHash || await sha256Hex(backupText) !== expectedBackupHash) {
    throw new Error('backup.json failed its integrity check. This backup may be damaged or modified.')
  }

  for (const [path, expectedHash] of Object.entries(integrity.files)) {
    if (path === 'backup.json') continue
    const entry = zip.file(path)
    if (!entry) throw new Error(`${path} is missing from the backup.`)
    const blob = await entry.async('blob')
    if (await sha256Hex(blob) !== expectedHash) {
      throw new Error(`${path} failed its integrity check. This backup may be damaged or modified.`)
    }
  }
  return { verified: true, legacy: false }
}

async function exportBackup() {
  if (!session?.user) {
    alert('Your session expired. Sign out and sign back in, then try the backup again.')
    return
  }

  const button = $('backup-button')
  const restoreButton = $('restore-button')
  const originalText = button.textContent
  button.disabled = true
  restoreButton.disabled = true
  button.textContent = 'Preparing…'

  try {
    const JSZip = requireZipSupport()
    await loadCars()

    const zip = new JSZip()
    const photoMap = {}
    const integrityFiles = {}
    const photoCars = cars.filter((car) => Boolean(car.photo_path))
    const failures = []

    for (let index = 0; index < photoCars.length; index += 1) {
      const car = photoCars[index]
      button.textContent = `Photos ${index + 1}/${photoCars.length}`
      const data = await getPrivatePhotoBlob(car.photo_path)
      if (!data) {
        failures.push(car.model || car.id)
        continue
      }
      const photoFile = `photos/${car.id}.jpg`
      photoMap[car.id] = photoFile
      zip.file(photoFile, data, { binary: true, compression: 'STORE' })
      integrityFiles[photoFile] = await sha256Hex(data)
    }

    if (failures.length) {
      const preview = failures.slice(0, 5).join(', ')
      const more = failures.length > 5 ? ` and ${failures.length - 5} more` : ''
      throw new Error(`${failures.length} stored photo${failures.length === 1 ? '' : 's'} could not be downloaded (${preview}${more}). No backup file was created so you do not mistake an incomplete backup for a complete one. Please retry.`)
    }

    const backupCars = cars.map((car) => ({ ...car }))
    const backup = {
      format: 'ajs-garage-backup',
      version: 6,
      exported_at: new Date().toISOString(),
      source_user_id: session.user.id,
      car_count: backupCars.length,
      photo_count: Object.keys(photoMap).length,
      note: 'Self-contained Pocket 64 backup. backup.json contains all current collection fields and the photos folder contains the actual private car images.',
      photos: photoMap,
      cars: backupCars,
    }

    const backupText = JSON.stringify(backup, null, 2)
    zip.file('backup.json', backupText)
    integrityFiles['backup.json'] = await sha256Hex(backupText)
    zip.file('integrity.json', JSON.stringify({
      format: 'pocket64-integrity',
      version: 1,
      algorithm: 'SHA-256',
      generated_at: backup.exported_at,
      files: integrityFiles,
    }, null, 2))
    zip.file('README.txt', [
      "Pocket 64 Disaster-Recovery Backup",
      '',
      `Exported: ${backup.exported_at}`,
      `Cars: ${backup.car_count}`,
      `Photos: ${backup.photo_count}`,
      '',
      'Keep this ZIP file somewhere safe. Do not unzip or modify it before restoring in Pocket 64.',
      'The backup contains collection data plus the actual stored car images.',
      'Pocket 64 v3.3.0+ also validates SHA-256 checksums before a restore changes your collection.',
    ].join('\n'))

    button.textContent = 'Packing…'
    const blob = await zip.generateAsync(
      { type: 'blob', compression: 'STORE' },
      (metadata) => { button.textContent = `Packing ${Math.round(metadata.percent)}%` },
    )
    downloadBlob(blob, backupFilename('zip'))
    recordSuccessfulBackup()

    button.textContent = 'Saved ✓'
    setTimeout(() => { button.textContent = originalText }, 1800)
  } catch (err) {
    console.error(err)
    button.textContent = 'Backup failed'
    alert(`Backup failed: ${err.message || err}`)
    setTimeout(() => { button.textContent = originalText }, 2600)
  } finally {
    button.disabled = false
    restoreButton.disabled = false
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function nullableText(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function restoreQuantity(value) {
  if (value === null || value === undefined || value === '') return 1
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1
}

function restoreBoolean(value) {
  if (value === true || value === false) return value
  const text = String(value ?? '').trim().toLowerCase()
  return text === 'true' || text === '1' || text === 'yes'
}

function restoreDate(value, fallback) {
  const text = String(value ?? '')
  return Number.isFinite(Date.parse(text)) ? text : fallback
}

function safePhotoBackupPath(value, originalId) {
  const path = String(value ?? '')
  const expected = `photos/${originalId}.jpg`
  return path === expected ? path : null
}

async function readBackupFile(file) {
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.json') || file.type === 'application/json') {
    const backup = JSON.parse(await file.text())
    return { backup, zip: null, legacyJson: true }
  }

  const JSZip = requireZipSupport()
  const zip = await JSZip.loadAsync(file)
  const backupEntry = zip.file('backup.json')
  if (!backupEntry) throw new Error('This ZIP does not contain backup.json and is not an AJ\'s Garage backup.')
  const backup = JSON.parse(await backupEntry.async('string'))
  return { backup, zip, legacyJson: false }
}

function validateBackup(backup) {
  if (!backup || backup.format !== 'ajs-garage-backup' || !Array.isArray(backup.cars)) {
    throw new Error('This file is not a valid AJ\'s Garage backup.')
  }
  if (backup.cars.length > 20000) throw new Error('This backup contains an unexpected number of records and was not restored.')
}

function restorePayload(car, targetId, initialPhotoPath) {
  const now = new Date().toISOString()
  const payload = {
    id: targetId,
    user_id: session.user.id,
    photo_path: initialPhotoPath,
    diecast_brand: nullableText(car.diecast_brand),
    make: nullableText(car.make),
    model: nullableText(car.model),
    model_year: nullableText(car.model_year),
    scale: nullableText(car.scale),
    series_collection: nullableText(car.series_collection),
    category: nullableText(car.category),
    quantity: restoreQuantity(car.quantity),
    notes: nullableText(car.notes),
    created_at: restoreDate(car.created_at, now),
    updated_at: restoreDate(car.updated_at, now),
    package_status: nullableText(car.package_status),
    special_status: nullableText(car.special_status),
    exclusive_retailer: nullableText(car.exclusive_retailer),
    exclusive_type: nullableText(car.exclusive_retailer) ? nullableText(car.exclusive_type) : null,
    general_number: nullableText(car.general_number),
    series_collection_number: nullableText(car.series_collection_number),
    color: nullableText(car.color),
    hotwheels_toy_number: nullableText(car.hotwheels_toy_number),
    is_custom: restoreBoolean(car.is_custom),
  }
  payload.is_favorite = restoreBoolean(car.is_favorite)
  payload.is_showcase = restoreBoolean(car.is_showcase)
  const packSize = Number(car.pack_size)
  payload.pack_size = payload.special_status === 'Multipack'
    ? (Number.isFinite(packSize) && packSize >= 2 ? Math.min(999, Math.floor(packSize)) : 5)
    : null
  return payload
}

async function upsertRestoreRows(rows) {
  const chunkSize = 100
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize)
    const { error } = await supabase.from('cars').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
  }
}


async function verifyAndRepairRestoreFlags(rows) {
  const expected = new Map(rows.map((row) => [row.id, {
    is_favorite: Boolean(row.is_favorite),
    is_showcase: Boolean(row.is_showcase),
  }]))
  if (!expected.size) return

  const ids = [...expected.keys()]
  const chunkSize = 100
  for (let start = 0; start < ids.length; start += chunkSize) {
    const chunkIds = ids.slice(start, start + chunkSize)
    const { data, error } = await supabase
      .from('cars')
      .select('id,is_favorite,is_showcase')
      .eq('user_id', session.user.id)
      .in('id', chunkIds)
    if (error) throw error

    const actualById = new Map((data || []).map((row) => [row.id, row]))
    for (const id of chunkIds) {
      const wanted = expected.get(id)
      const actual = actualById.get(id)
      if (!actual) throw new Error(`Restore verification could not find car ${id}.`)
      const favoriteMismatch = Boolean(actual.is_favorite) !== wanted.is_favorite
      const showcaseMismatch = Boolean(actual.is_showcase) !== wanted.is_showcase
      if (!favoriteMismatch && !showcaseMismatch) continue

      const { error: repairError } = await supabase
        .from('cars')
        .update({
          is_favorite: wanted.is_favorite,
          is_showcase: wanted.is_showcase,
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
      if (repairError) throw repairError
    }
  }

  const { data: verified, error: verifyError } = await supabase
    .from('cars')
    .select('id,is_favorite,is_showcase')
    .eq('user_id', session.user.id)
    .in('id', ids)
  if (verifyError) throw verifyError
  const verifiedById = new Map((verified || []).map((row) => [row.id, row]))
  const failed = ids.filter((id) => {
    const wanted = expected.get(id)
    const actual = verifiedById.get(id)
    return !actual || Boolean(actual.is_favorite) !== wanted.is_favorite || Boolean(actual.is_showcase) !== wanted.is_showcase
  })
  if (failed.length) throw new Error(`Restore verification failed for ${failed.length} Favorite/Showcase flag${failed.length === 1 ? '' : 's'}.`)
}

async function restoreBackupFile(file) {
  if (!session?.user) {
    alert('Your session expired. Sign out and sign back in, then try the restore again.')
    return
  }

  const restoreButton = $('restore-button')
  const backupButton = $('backup-button')
  const originalText = restoreButton.textContent
  restoreButton.disabled = true
  backupButton.disabled = true
  restoreButton.textContent = 'Reading…'

  try {
    const { backup, zip, legacyJson } = await readBackupFile(file)
    validateBackup(backup)
    restoreButton.textContent = 'Checking…'
    const integrityResult = zip ? await validateBackupIntegrity(zip, backup) : { verified: false, legacy: true }

    const backupVersion = Number(backup.version) || 1
    const sourceUserId = nullableText(backup.source_user_id) || nullableText(backup.cars.find((car) => car?.user_id)?.user_id)
    const sameAccount = Boolean(sourceUserId && sourceUserId === session.user.id)
    const photoMap = backup.photos && typeof backup.photos === 'object' ? backup.photos : {}
    const embeddedPhotoCount = zip ? Object.keys(photoMap).length : 0
    const exportedDate = Number.isFinite(Date.parse(backup.exported_at || ''))
      ? new Date(backup.exported_at).toLocaleString()
      : 'unknown date'

    const accountNote = sameAccount
      ? 'Matching backed-up cars will be updated.'
      : 'This backup came from a different or unknown account, so restored cars will receive new IDs.'
    const integrityNote = integrityResult.verified
      ? 'Integrity check: PASSED (SHA-256).'
      : 'Integrity check: legacy backup (no checksum manifest).'
    const photoNote = embeddedPhotoCount
      ? `${embeddedPhotoCount} embedded photo${embeddedPhotoCount === 1 ? '' : 's'} will also be restored.`
      : 'This backup has no embedded images. Car data will restore, but image recovery depends on any old Supabase photo paths still existing.'

    const approved = window.confirm(
      `Restore Pocket 64 backup from ${exportedDate}?\n\n` +
      `${backup.cars.length} car${backup.cars.length === 1 ? '' : 's'}\n` +
      `${photoNote}\n${integrityNote}\n\n${accountNote}\n` +
      'Current cars that are not in the backup will NOT be deleted.'
    )
    if (!approved) return

    restoreButton.textContent = 'Preparing…'
    await loadCars()
    const existingById = new Map(cars.map((car) => [car.id, car]))
    const restoreItems = backup.cars.map((car) => {
      const originalId = String(car?.id || '')
      const targetId = sameAccount && isUuid(originalId) ? originalId : crypto.randomUUID()
      const existing = existingById.get(targetId)
      const embeddedPath = zip ? safePhotoBackupPath(photoMap[originalId], originalId) : null
      const legacyPath = !embeddedPath && sameAccount && String(car?.photo_path || '').startsWith(`${session.user.id}/`)
        ? String(car.photo_path)
        : null
      const initialPhotoPath = existing?.photo_path || legacyPath || null
      return {
        originalId,
        targetId,
        embeddedPath,
        payload: restorePayload(car || {}, targetId, initialPhotoPath),
      }
    })

    restoreButton.textContent = `Cars 0/${restoreItems.length}`
    const rows = restoreItems.map((item) => item.payload)
    await upsertRestoreRows(rows)
    restoreButton.textContent = 'Verifying…'
    await verifyAndRepairRestoreFlags(rows)
    restoreButton.textContent = `Cars ${restoreItems.length}/${restoreItems.length}`

    const photoItems = restoreItems.filter((item) => item.embeddedPath)
    const photoFailures = []
    for (let index = 0; index < photoItems.length; index += 1) {
      const item = photoItems[index]
      restoreButton.textContent = `Photos ${index + 1}/${photoItems.length}`
      try {
        const entry = zip.file(item.embeddedPath)
        if (!entry) throw new Error(`Missing ${item.embeddedPath}`)
        const blob = await entry.async('blob')
        const targetPath = `${session.user.id}/${item.targetId}.jpg`
        const { error: uploadError } = await supabase.storage.from('car-photos').upload(targetPath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        })
        if (uploadError) throw uploadError
        await invalidatePrivatePhotoCache(targetPath)
        const { error: updateError } = await supabase
          .from('cars')
          .update({ photo_path: targetPath, updated_at: item.payload.updated_at })
          .eq('id', item.targetId)
          .eq('user_id', session.user.id)
        if (updateError) throw updateError
      } catch (error) {
        console.error(error)
        photoFailures.push(item.originalId || item.targetId)
      }
    }

    await loadCars()
    showCollection()

    if (photoFailures.length) {
      restoreButton.textContent = 'Partial restore'
      alert(`Car data was restored, but ${photoFailures.length} photo${photoFailures.length === 1 ? '' : 's'} could not be restored. You can safely retry the same backup ZIP; the restore is non-destructive.`)
    } else {
      restoreButton.textContent = 'Restored ✓'
      const legacyMessage = legacyJson || backupVersion < 3
        ? '\n\nThis was an older JSON/data-only backup, so images were not embedded in the file.'
        : ''
      alert(`Restore complete: ${restoreItems.length} car${restoreItems.length === 1 ? '' : 's'} and ${photoItems.length} embedded photo${photoItems.length === 1 ? '' : 's'} processed.${legacyMessage}`)
    }
    setTimeout(() => { restoreButton.textContent = originalText }, 2200)
  } catch (err) {
    console.error(err)
    restoreButton.textContent = 'Restore failed'
    alert(`Restore failed: ${err.message || err}`)
    setTimeout(() => { restoreButton.textContent = originalText }, 2800)
  } finally {
    restoreButton.disabled = false
    backupButton.disabled = false
    $('restore-input').value = ''
  }
}

const SORT_STORAGE_KEY = 'ajs-garage-sort'
const VALID_SORTS = new Set(['newest', 'oldest', 'brand-az', 'brand-za', 'model-az', 'model-za', 'qty-high', 'qty-low', 'special-first', 'color-az'])

function textForSort(value) {
  const text = String(value ?? '').trim()
  return text || '\uffff'
}

function dateValue(value) {
  const time = Date.parse(value || '')
  return Number.isFinite(time) ? time : 0
}

function newestActivityValue(car) {
  // A duplicate quantity increase represents a newly acquired copy. That path
  // updates updated_at, so Newest can surface it without rewriting created_at.
  return Math.max(dateValue(car?.created_at), dateValue(car?.updated_at))
}

function specialRank(car) {
  return car?.special_status ? 0 : 1
}

function sortCars(list) {
  const mode = VALID_SORTS.has(sortSelect?.value) ? sortSelect.value : 'newest'
  const copy = [...list]
  const byText = (a, b, field, direction = 1) => {
    const primary = textForSort(a?.[field]).localeCompare(textForSort(b?.[field]), undefined, { numeric: true, sensitivity: 'base' }) * direction
    if (primary !== 0) return primary
    return dateValue(b?.created_at) - dateValue(a?.created_at)
  }

  copy.sort((a, b) => {
    switch (mode) {
      case 'oldest': return dateValue(a.created_at) - dateValue(b.created_at)
      case 'brand-az': return byText(a, b, 'diecast_brand', 1)
      case 'brand-za': return byText(a, b, 'diecast_brand', -1)
      case 'model-az': return byText(a, b, 'model', 1)
      case 'model-za': return byText(a, b, 'model', -1)
      case 'qty-high': return (Math.max(1, Number(b.quantity) || 1) - Math.max(1, Number(a.quantity) || 1)) || (dateValue(b.created_at) - dateValue(a.created_at))
      case 'qty-low': return (Math.max(1, Number(a.quantity) || 1) - Math.max(1, Number(b.quantity) || 1)) || (dateValue(b.created_at) - dateValue(a.created_at))
      case 'special-first': return (specialRank(a) - specialRank(b)) || (dateValue(b.created_at) - dateValue(a.created_at))
      case 'color-az': return byText(a, b, 'color', 1)
      case 'newest':
      default: return newestActivityValue(b) - newestActivityValue(a)
    }
  })
  return copy
}

function applySortPreference() {
  let saved = 'newest'
  try { saved = localStorage.getItem(SORT_STORAGE_KEY) || 'newest' } catch {}
  sortSelect.value = VALID_SORTS.has(saved) ? saved : 'newest'
}

function updateActiveFilterPill() {
  const row = $('active-filter-row')
  const pill = $('active-filter-pill')
  if (!activeBrandFilter) {
    row.classList.add('hidden')
    pill.textContent = ''
    return
  }
  const label = activeBrandFilter === '__none__' ? 'None' : activeBrandFilter === '__favorites__' ? 'Favorites' : activeBrandFilter === '__jdm__' ? 'JDM' : activeBrandFilter
  pill.textContent = `${label} ×`
  pill.title = `Clear ${label} filter`
  row.classList.remove('hidden')
}

function clearBrandFilter() {
  activeBrandFilter = null
  updateActiveFilterPill()
  applySearch()
}

function applySearch() {
  const q = searchInput.value.trim().toLowerCase()
  let matches = cars
  if (activeBrandFilter) {
    matches = cars.filter((car) => {
      const brand = String(car.diecast_brand ?? '').trim()
      if (activeBrandFilter === '__favorites__') return Boolean(car.is_favorite)
      if (activeBrandFilter === '__jdm__') return String(car.category || '').trim().toUpperCase() === 'JDM'
      if (activeBrandFilter === '__none__') return !brand || brand.toLowerCase() === 'none'
      return brand.toLowerCase() === activeBrandFilter.toLowerCase()
    })
  }
  if (q) {
    matches = matches.filter((car) => {
      const values = [car.diecast_brand, car.model, car.model_year, car.color, car.hotwheels_toy_number, car.scale, car.series_collection, car.category, car.general_number, car.series_collection_number, car.special_status, car.exclusive_retailer, car.exclusive_type, car.notes]
      if (car.is_custom) values.push('custom')
      if (car.is_favorite) values.push('favorite')
      return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    })
  }
  filteredCars = sortCars(matches)
  updateActiveFilterPill()
  renderCars()
}

function displayTitle(car) {
  return car.model || car.diecast_brand || 'Untitled Car'
}

function displaySubtitle(car) {
  return [car.diecast_brand, car.model_year, car.color].filter(Boolean).join(' · ') || 'No details yet'
}

async function updateCardQuantity(car, delta, controls) {
  if (!session?.user || !car?.id) return
  const currentQty = Math.max(1, Number(car.quantity) || 1)
  const nextQty = Math.max(1, currentQty + delta)
  if (nextQty === currentQty) return

  const buttons = controls?.querySelectorAll('button') || []
  buttons.forEach((button) => { button.disabled = true })
  controls?.classList.add('saving')

  try {
    const { error } = await supabase
      .from('cars')
      .update({ quantity: nextQty, updated_at: new Date().toISOString() })
      .eq('id', car.id)
      .eq('user_id', session.user.id)
    if (error) throw error

    car.quantity = nextQty
    car.updated_at = new Date().toISOString()
    updateRenderedCardQuantity(car, controls)
    reorderRenderedCardsIfNeeded()
    renderStats()
  } catch (error) {
    console.error(error)
    controls?.classList.remove('saving')
    buttons.forEach((button) => { button.disabled = false })
    window.alert(error.message || 'Could not update quantity.')
  }
}

function updateRenderedCardQuantity(car, controls) {
  const qty = Math.max(1, Number(car.quantity) || 1)
  const card = controls?.closest('.car-card') || carsGrid.querySelector(`[data-car-id="${car.id}"]`)
  if (!card) return

  const qtyValue = controls?.querySelector('.card-quantity-value') || card.querySelector('.card-quantity-value')
  if (qtyValue) {
    qtyValue.textContent = String(qty)
    qtyValue.setAttribute('aria-label', `Quantity ${qty}`)
  }

  const quantityControls = controls || card.querySelector('.card-quantity-control')
  const quantityButtons = quantityControls?.querySelectorAll('button') || []
  if (quantityButtons[0]) quantityButtons[0].disabled = qty <= 1
  if (quantityButtons[1]) quantityButtons[1].disabled = false
  quantityControls?.classList.remove('saving')

}

function reorderRenderedCardsIfNeeded() {
  const mode = VALID_SORTS.has(sortSelect?.value) ? sortSelect.value : 'newest'
  if (mode !== 'qty-high' && mode !== 'qty-low') return

  filteredCars = sortCars(filteredCars)
  const cardsById = new Map(
    [...carsGrid.querySelectorAll('.car-card[data-car-id]')].map((card) => [card.dataset.carId, card])
  )
  for (const car of filteredCars) {
    const card = cardsById.get(String(car.id))
    if (card) carsGrid.append(card)
  }
}

function renderShowcase() {
  const grid = $('showcase-grid')
  const empty = $('showcase-empty')
  if (!grid || !empty) return
  grid.replaceChildren()
  const featured = cars.filter((car) => Boolean(car.is_showcase))
  empty.classList.toggle('hidden', featured.length > 0)
  grid.classList.toggle('hidden', featured.length === 0)
  for (const car of featured) {
    const card = document.createElement('article')
    card.className = 'car-card showcase-card'
    card.innerHTML = `<div class="car-photo"><span>🚗</span></div><div class="car-body"><div class="car-title"></div><div class="car-sub"></div></div>`
    card.querySelector('.car-title').textContent = displayTitle(car)
    card.querySelector('.car-sub').textContent = displaySubtitle(car)
    const photoBox = card.querySelector('.car-photo')
    let showcaseImg = null
    if (car.photo_path) {
      const img = document.createElement('img')
      img.alt = displayTitle(car)
      img.loading = 'eager'
      img.decoding = 'async'
      img.dataset.privatePhotoPath = car.photo_path
      photoBox.replaceChildren(img)
      showcaseImg = img
    }
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'showcase-remove-button'
    remove.textContent = 'Remove'
    remove.addEventListener('click', async (event) => {
      event.stopPropagation()
      const { error } = await supabase.from('cars').update({ is_showcase:false, updated_at:new Date().toISOString() }).eq('id', car.id).eq('user_id', session.user.id)
      if (error) return window.alert(error.message || 'Could not update Showcase.')
      car.is_showcase = false
      renderShowcase()
      applySearch()
    })
    card.querySelector('.car-body').append(remove)
    card.addEventListener('click', () => showEditor(car))
    grid.append(card)
    if (car.photo_path && showcaseImg) loadPrivatePhoto(car.photo_path, showcaseImg)
  }
}

function renderCars() {
  carsGrid.replaceChildren()
  emptyState.classList.toggle('hidden', cars.length !== 0)

  for (const car of filteredCars) {
    const card = document.createElement('article')
    card.className = 'car-card square-car-card'
    card.dataset.carId = String(car.id)
    card.tabIndex = 0

    const specialStatus = SPECIAL_STATUSES.includes(car.special_status) ? car.special_status : ''
    if (['TH', 'STH', 'Red Line Club'].includes(specialStatus)) {
      const specialClass = specialClassForStatus(specialStatus)
      card.classList.add('special-card')
      if (specialClass) card.classList.add(specialClass)
    }
    if (car.is_custom) card.classList.add('custom-car-card')

    card.innerHTML = `
      <div class="car-photo square-car-photo"><span>🚗</span></div>
      <div class="square-card-gradient" aria-hidden="true"></div>
      <div class="square-card-info">
        <div class="square-card-copy">
          <div class="car-title"></div>
          <div class="car-sub"></div>
        </div>
        <div class="card-quantity-control square-qty-control"></div>
      </div>`

    card.querySelector('.car-title').textContent = displayTitle(car)
    card.querySelector('.car-sub').textContent = displaySubtitle(car)
    const photoBox = card.querySelector('.car-photo')

    if (car.photo_path) {
      const img = document.createElement('img')
      img.alt = displayTitle(car)
      photoBox.replaceChildren(img)
      lazyLoadPrivatePhoto(car.photo_path, img)
    }

    const badgeStack = document.createElement('div')
    badgeStack.className = 'badge-stack square-badge-stack'
    if (specialStatus) {
      const specialBadge = document.createElement('div')
      specialBadge.className = `special-badge ${badgeClassForStatus(specialStatus)}`
      specialBadge.textContent = specialStatus === 'Limited' ? 'LIMITED' : specialStatus.toUpperCase()
      badgeStack.append(specialBadge)
    }
    if (car.exclusive_retailer) {
      const exclusiveBadge = document.createElement('div')
      exclusiveBadge.className = `special-badge exclusive-badge ${car.exclusive_type ? `exclusive-type-${slugForClass(car.exclusive_type)}` : ''} ${car.exclusive_retailer ? `retailer-${slugForClass(car.exclusive_retailer)}` : ''}`.trim()
      const shortRetailer = { 'Walmart':'WMT', 'Target':'TGT', 'Walgreens':'WAG', 'Dollar General':'DG', 'Kroger':'KROGER' }[car.exclusive_retailer] || car.exclusive_retailer
      exclusiveBadge.textContent = car.exclusive_type ? `${shortRetailer} · ${car.exclusive_type.toUpperCase()}` : shortRetailer.toUpperCase()
      badgeStack.append(exclusiveBadge)
    }
    if (car.is_custom) {
      const customBadge = document.createElement('div')
      customBadge.className = 'special-badge custom-badge'
      customBadge.textContent = 'CUSTOM'
      badgeStack.append(customBadge)
    }
    if (badgeStack.childElementCount) card.append(badgeStack)

    if (collectionExtrasSupported) {
      const favoriteButton = document.createElement('button')
      favoriteButton.type = 'button'
      favoriteButton.className = `favorite-card-toggle${car.is_favorite ? ' is-favorite' : ''}`
      favoriteButton.textContent = '★'
      favoriteButton.setAttribute('aria-label', car.is_favorite ? 'Remove from favorites' : 'Add to favorites')
      favoriteButton.title = car.is_favorite ? 'Remove from favorites' : 'Add to favorites'
      favoriteButton.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (favoriteButton.disabled) return
        const nextValue = !Boolean(car.is_favorite)
        favoriteButton.disabled = true
        try {
          const { error } = await supabase
            .from('cars')
            .update({ is_favorite: nextValue, updated_at: new Date().toISOString() })
            .eq('id', car.id)
            .eq('user_id', session.user.id)
          if (error) throw error
          car.is_favorite = nextValue
          favoriteButton.classList.toggle('is-favorite', nextValue)
          favoriteButton.textContent = '★'
          favoriteButton.setAttribute('aria-label', nextValue ? 'Remove from favorites' : 'Add to favorites')
          favoriteButton.title = nextValue ? 'Remove from favorites' : 'Add to favorites'
          renderStats()
          if (activeBrandFilter === '__favorites__' && !nextValue) applySearch()
        } catch (error) {
          console.error(error)
          window.alert(error.message || 'Could not update favorite.')
        } finally {
          favoriteButton.disabled = false
        }
      })
      favoriteButton.addEventListener('keydown', (event) => event.stopPropagation())
      card.append(favoriteButton)
    }

    const qtyControls = card.querySelector('.card-quantity-control')
    const minusButton = document.createElement('button')
    minusButton.type = 'button'
    minusButton.className = 'card-quantity-button'
    minusButton.textContent = '−'
    minusButton.setAttribute('aria-label', `Decrease quantity for ${displayTitle(car)}`)
    minusButton.disabled = Math.max(1, Number(car.quantity) || 1) <= 1
    const qtyValue = document.createElement('span')
    qtyValue.className = 'card-quantity-value'
    qtyValue.textContent = String(Math.max(1, Number(car.quantity) || 1))
    qtyValue.setAttribute('aria-label', `Quantity ${qtyValue.textContent}`)
    const plusButton = document.createElement('button')
    plusButton.type = 'button'
    plusButton.className = 'card-quantity-button'
    plusButton.textContent = '+'
    plusButton.setAttribute('aria-label', `Increase quantity for ${displayTitle(car)}`)
    qtyControls.append(minusButton, qtyValue, plusButton)

    minusButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      updateCardQuantity(car, -1, qtyControls)
    })
    plusButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      updateCardQuantity(car, 1, qtyControls)
    })
    qtyControls.addEventListener('click', (event) => event.stopPropagation())
    qtyControls.addEventListener('keydown', (event) => event.stopPropagation())

    const open = () => showEditor(car)
    card.addEventListener('click', open)
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open() })
    carsGrid.append(card)
  }
}

function renderStats() {
  statsTotal.textContent = String(cars.length)
  const grandTotal = cars.reduce((sum, car) => sum + totalCarsFor(car), 0)
  statsGrandTotal.textContent = String(grandTotal)
  if (statsFavorites) statsFavorites.textContent = String(cars.filter((car) => car.is_favorite).length)
  if (statsJdm) statsJdm.textContent = String(cars.filter((car) => String(car.category || '').trim().toUpperCase() === 'JDM').length)
  favoritesStat?.classList.toggle('hidden', !collectionExtrasSupported)
  brandStats.replaceChildren()

  const counts = new Map()
  const displayNames = new Map()
  for (const brand of BRAND_PRESETS) {
    if (brand === 'Other') continue
    const key = brand.toLowerCase()
    counts.set(key, 0)
    displayNames.set(key, brand)
  }

  for (const car of cars) {
    const raw = String(car.diecast_brand ?? '').trim()
    const key = raw ? raw.toLowerCase() : 'none'
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!displayNames.has(key)) displayNames.set(key, raw || 'None')
  }

  const entries = [...counts.entries()]
    .filter(([key, count]) => key !== 'none' || count > 0)
    .map(([key, count]) => ({
      key,
      brand: displayNames.get(key) ?? key,
      count,
      presetIndex: BRAND_PRESETS.findIndex((name) => name.toLowerCase() === key),
    }))

  entries.sort((a, b) => {
    const aPreset = a.presetIndex >= 0
    const bPreset = b.presetIndex >= 0
    if (aPreset && bPreset) return a.presetIndex - b.presetIndex
    if (aPreset) return -1
    if (bPreset) return 1
    return a.brand.localeCompare(b.brand)
  })

  for (const entry of entries) {
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'stat-row stat-row-button'
    row.setAttribute('aria-label', `Show ${entry.brand} cars`)
    const name = document.createElement('div')
    name.className = 'stat-brand'
    name.textContent = entry.brand
    const count = document.createElement('div')
    count.className = 'stat-count'
    count.textContent = String(entry.count)
    row.append(name, count)
    row.addEventListener('click', () => {
      activeBrandFilter = entry.key === 'none' ? '__none__' : entry.brand
      searchInput.value = ''
      showCollection()
      applySearch()
    })
    brandStats.append(row)
  }
}

async function compressImage(file, maxDimension = 1600, quality = 0.86) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not process image')), 'image/jpeg', quality)
  })
}

async function uploadPhoto(carId, file) {
  const compressed = await compressImage(file)
  const version = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = `${session.user.id}/${carId}-${version}.jpg`
  const { error } = await supabase.storage.from('car-photos').upload(path, compressed, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

function canonicalBrand(value) {
  const raw = value.trim()
  const preset = BRAND_PRESETS.find((brand) => brand.toLowerCase() === raw.toLowerCase())
  return (preset ?? raw).toUpperCase()
}

function editorPayload() {
  const qtyRaw = $('quantity').value.trim()
  const brandChoice = $('diecast-brand').value
  const customBrand = $('custom-brand').value.trim()
  const brandRaw = brandChoice === 'Other' ? (customBrand || 'Other') : brandChoice
  const yearChoice = $('model-year').value
  const customYear = $('custom-year').value.trim()
  const yearRaw = yearChoice === 'Other' ? customYear : yearChoice
  const colorChoice = $('color').value
  const customColorRaw = customColor.value.trim()
  const colorRaw = colorChoice === 'Other' ? customColorRaw : colorChoice
  const specialRaw = $('special-status').value
  const categoryChoice = categorySelect?.value || ''
  const categoryRaw = categoryChoice === 'Other' ? (customCategory?.value.trim() || '') : categoryChoice
  const payload = {
    user_id: session.user.id,
    diecast_brand: brandRaw ? canonicalBrand(brandRaw) : null,
    is_custom: Boolean(customCheckbox.checked),
    is_showcase: collectionExtrasSupported ? Boolean(showcaseCheckbox?.checked) : undefined,
    model: $('model').value.trim().toUpperCase() || null,
    model_year: yearRaw ? String(yearRaw).toUpperCase() : null,
    color: colorRaw ? String(colorRaw).toUpperCase() : null,
    hotwheels_toy_number: $('hotwheels-toy-number').value.trim().toUpperCase() || null,
    series_collection: $('series').value.trim().toUpperCase() || null,
    category: categoryRaw ? String(categoryRaw).toUpperCase() : null,
    general_number: $('general-number').value.trim().toUpperCase() || null,
    series_collection_number: $('series-collection-number').value.trim().toUpperCase() || null,
    quantity: Math.max(1, Math.floor(Number(qtyRaw) || 1)),
    special_status: specialRaw || null,
    notes: $('notes').value.trim() || null,
    updated_at: new Date().toISOString(),
  }
  if (!collectionExtrasSupported) delete payload.is_showcase
  if (collectionExtrasSupported) {
    payload.exclusive_retailer = exclusiveRetailer?.value || null
    payload.exclusive_type = exclusiveRetailer?.value ? (exclusiveType?.value || null) : null
    if (specialRaw === 'Multipack') {
      const chosen = packSizeSelect?.value === 'other' ? customPackSize?.value : packSizeSelect?.value
      payload.pack_size = Math.max(2, Math.floor(Number(chosen) || 5))
    } else {
      payload.pack_size = null
    }
  }
  return payload
}

function syncQuantityDisplay() {
  const input = $('quantity')
  const display = $('quantity-display')
  if (!input || !display) return
  const parsed = Number(input.value)
  const qty = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
  input.value = String(qty)
  display.textContent = `QTY ${qty}`
}

function stepQuantity(delta) {
  const input = $('quantity')
  const parsed = Number(input.value)
  const current = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
  input.value = String(Math.max(1, current + delta))
  syncQuantityDisplay()
}

async function saveCar() {
  if (!session?.user) {
    editorMessage.textContent = 'Your session expired. Sign out and sign back in.'
    return
  }
  const saveButton = $('save-button')
  editorMessage.textContent = 'Saving…'
  saveButton.textContent = 'Saving…'
  saveButton.disabled = true
  try {
    const payload = editorPayload()
    let car
    if (editingCar) {
      const expectedUpdatedAt = editingCar.updated_at
      let query = supabase
        .from('cars')
        .update(payload)
        .eq('id', editingCar.id)
        .eq('user_id', session.user.id)
      if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
      const { data, error } = await query.select().maybeSingle()
      if (error) throw error
      if (!data) {
        await loadCars()
        throw new Error('This car changed in another Pocket 64 session. Reopen it and review the latest version before saving so nothing gets overwritten.')
      }
      car = data
    } else {
      const { data, error } = await supabase
        .from('cars')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      car = data
    }

    if (selectedPhotoFile) {
      const oldPhotoPath = editingCar?.photo_path || car?.photo_path || ''
      const path = await uploadPhoto(car.id, selectedPhotoFile)
      const { data: photoUpdate, error } = await supabase
        .from('cars')
        .update({ photo_path: path })
        .eq('id', car.id)
        .eq('user_id', session.user.id)
        .eq('updated_at', car.updated_at)
        .select('id,updated_at')
        .maybeSingle()
      if (error || !photoUpdate) {
        await supabase.storage.from('car-photos').remove([path])
        await invalidatePrivatePhotoCache(path)
        if (error) throw error
        throw new Error('This car changed while its new photo was being saved. The new upload was safely discarded; reopen the car and try again.')
      }
      if (oldPhotoPath && oldPhotoPath !== path) {
        const { error: removeOldError } = await supabase.storage.from('car-photos').remove([oldPhotoPath])
        if (removeOldError) console.warn('Old photo could not be deleted from storage', removeOldError)
        await invalidatePrivatePhotoCache(oldPhotoPath)
      }
    }

    await loadCars()
    if (quickAddMode && !editingCar) {
      quickAddKeepBrand = $('diecast-brand').value
      quickAddKeepCustomBrand = $('custom-brand').value
      showEditor(null, { quick: true })
      editorMessage.textContent = 'Saved ✓ Ready for the next car.'
      setTimeout(() => { if (quickAddMode) editorMessage.textContent = '' }, 1400)
    } else {
      showCollection()
    }
  } catch (err) {
    console.error(err)
    editorMessage.textContent = err.message || 'Could not save car.'
  } finally {
    saveButton.disabled = false
    saveButton.textContent = quickAddMode ? 'Save & Next' : 'Save'
  }
}


async function clearCollection() {
  if (!session?.user) return
  const firstConfirm = window.confirm(
    'Clear this entire collection?\n\nThis will permanently delete every car and its saved car photo from THIS account. This cannot be undone.'
  )
  if (!firstConfirm) return

  const typed = window.prompt('Type CLEAR to confirm deleting the entire collection from this account.')
  if (typed !== 'CLEAR') {
    if (typed !== null) alert('Collection was not cleared. Confirmation did not match.')
    return
  }

  const button = $('clear-collection-button')
  const originalText = button?.textContent || 'Clear'
  if (button) {
    button.disabled = true
    button.textContent = 'Clearing…'
  }

  try {
    const { data: rows, error: readError } = await supabase
      .from('cars')
      .select('id, photo_path')
      .eq('user_id', session.user.id)
    if (readError) throw readError

    const photoPaths = [...new Set((rows || []).map((row) => row.photo_path).filter(Boolean))]

    // Database truth first. If Storage cleanup later fails, the result is only an
    // orphaned image — never a surviving car whose photo was already destroyed.
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('user_id', session.user.id)
    if (deleteError) throw deleteError

    const storageCleanupFailures = []
    for (let i = 0; i < photoPaths.length; i += 100) {
      const batch = photoPaths.slice(i, i + 100)
      const { error: storageError } = await supabase.storage.from('car-photos').remove(batch)
      if (storageError) {
        console.warn('Collection rows were cleared, but some old photos could not be removed from Storage.', storageError)
        storageCleanupFailures.push(...batch)
      }
      await Promise.all(batch.map((path) => invalidatePrivatePhotoCache(path)))
    }

    clearPrivatePhotoMemoryCache()
    await loadCars()
    alert(storageCleanupFailures.length ? 'Collection cleared. Some old photo files could not be removed from Storage, but no car records were left broken.' : 'Collection cleared. This account is ready for a clean restore test.')
    showCollection()
  } catch (err) {
    console.error(err)
    alert(`Could not clear the collection: ${err.message || err}`)
  } finally {
    if (button) {
      button.disabled = false
      button.textContent = originalText
    }
  }
}

async function deleteCar() {
  if (!editingCar || !confirm('Are you sure you want to delete this vehicle?')) return
  editorMessage.textContent = 'Deleting…'
  try {
    const photoPath = editingCar.photo_path || ''
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', editingCar.id)
      .eq('user_id', session.user.id)
    if (error) throw error

    if (photoPath) {
      const { error: storageError } = await supabase.storage.from('car-photos').remove([photoPath])
      if (storageError) console.warn('Car was deleted, but its old photo could not be removed from Storage.', storageError)
      await invalidatePrivatePhotoCache(photoPath)
    }
    await loadCars()
    showCollection()
  } catch (err) {
    console.error(err)
    editorMessage.textContent = err.message || 'Could not delete car.'
  }
}


function exactDuplicateKey(car) {
  const fields = [
    car.diecast_brand,
    car.model,
    car.model_year,
    car.color,
    car.hotwheels_toy_number,
    car.series_collection,
    car.general_number,
    car.series_collection_number,
    car.special_status,
    car.pack_size,
    car.is_custom ? '1' : '0',
  ]
  return fields.map((value) => String(value ?? '').trim().toUpperCase()).join('\u241F')
}

function findExactDuplicateGroups() {
  const grouped = new Map()
  for (const car of cars) {
    const key = exactDuplicateKey(car)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(car)
  }
  return [...grouped.values()].filter((group) => group.length > 1)
}

function hideDuplicateScanResults() {
  const host = $('duplicate-scan-results')
  if (!host) return
  host.classList.add('hidden')
  host.replaceChildren()
}

function renderDuplicateScanResults() {
  const host = $('duplicate-scan-results')
  if (!host) return
  host.replaceChildren()
  duplicateScanGroups = findExactDuplicateGroups()
  host.classList.remove('hidden')

  if (!duplicateScanGroups.length) {
    const msg = document.createElement('div')
    msg.className = 'duplicate-scan-empty'
    msg.textContent = 'No exact duplicates found ✓'
    host.append(msg)
    return
  }

  const intro = document.createElement('div')
  intro.className = 'duplicate-scan-intro'
  intro.textContent = `${duplicateScanGroups.length} exact duplicate group${duplicateScanGroups.length === 1 ? '' : 's'} found. Choose which copy/photo to keep, then combine.`
  host.append(intro)

  duplicateScanGroups.forEach((group, groupIndex) => {
    const card = document.createElement('div')
    card.className = 'duplicate-scan-group'

    const heading = document.createElement('strong')
    const totalQty = group.reduce((sum, car) => sum + Math.max(1, Number(car.quantity) || 1), 0)
    heading.textContent = `${group[0].model || 'UNTITLED'} · ${group.length} entries · QTY ${totalQty}`
    card.append(heading)

    const meta = document.createElement('div')
    meta.className = 'duplicate-scan-meta'
    meta.textContent = [group[0].diecast_brand, group[0].model_year, group[0].series_collection, group[0].hotwheels_toy_number].filter(Boolean).join(' · ')
    card.append(meta)

    const choices = document.createElement('div')
    choices.className = 'duplicate-photo-choices'
    group.forEach((car, carIndex) => {
      const label = document.createElement('label')
      label.className = 'duplicate-photo-choice'
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = `duplicate-keeper-${groupIndex}`
      radio.value = car.id
      if (carIndex === 0) radio.checked = true

      const preview = document.createElement('div')
      preview.className = 'duplicate-photo-preview'
      if (car.photo_path) {
        const img = document.createElement('img')
        img.alt = ''
        preview.append(img)
        loadPrivatePhoto(car.photo_path, img)
      } else {
        preview.textContent = 'NO PHOTO'
      }

      const copy = document.createElement('span')
      const qty = Math.max(1, Number(car.quantity) || 1)
      copy.textContent = `Keep this copy · Qty ${qty}${car.photo_path ? ' · photo' : ''}`
      label.append(radio, preview, copy)
      choices.append(label)
    })
    card.append(choices)

    const merge = document.createElement('button')
    merge.type = 'button'
    merge.className = 'settings-mini-button duplicate-merge-button'
    merge.textContent = 'Combine This Group'
    merge.addEventListener('click', () => mergeExactDuplicateGroup(groupIndex, card))
    card.append(merge)
    host.append(card)
  })
}

async function mergeExactDuplicateGroup(groupIndex, card) {
  const group = duplicateScanGroups[groupIndex]
  if (!group?.length || !session?.user) return
  const selected = card.querySelector(`input[name="duplicate-keeper-${groupIndex}"]:checked`)
  const keeper = group.find((car) => String(car.id) === selected?.value) || group[0]
  const removeCars = group.filter((car) => car.id !== keeper.id)
  const totalQty = group.reduce((sum, car) => sum + Math.max(1, Number(car.quantity) || 1), 0)
  if (!confirm(`Combine ${group.length} exact entries of ${keeper.model} into one QTY ${totalQty}?`)) return

  const button = card.querySelector('.duplicate-merge-button')
  button.disabled = true
  button.textContent = 'Combining…'
  try {
    const { error: updateError } = await supabase
      .from('cars')
      .update({ quantity: totalQty, updated_at: new Date().toISOString() })
      .eq('id', keeper.id)
      .eq('user_id', session.user.id)
    if (updateError) throw updateError

    const photoPaths = removeCars.map((car) => car.photo_path).filter(Boolean)
    const removeIds = removeCars.map((car) => car.id)
    if (removeIds.length) {
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .in('id', removeIds)
        .eq('user_id', session.user.id)
      if (deleteError) {
        const { error: rollbackError } = await supabase
          .from('cars')
          .update({ quantity: Math.max(1, Number(keeper.quantity) || 1), updated_at: new Date().toISOString() })
          .eq('id', keeper.id)
          .eq('user_id', session.user.id)
        if (rollbackError) console.error('Duplicate combine rollback also failed', rollbackError)
        throw deleteError
      }
    }

    if (photoPaths.length) {
      const { error: storageError } = await supabase.storage.from('car-photos').remove(photoPaths)
      if (storageError) console.warn('Duplicates were combined, but one or more old photos could not be removed:', storageError)
      for (const path of photoPaths) await invalidatePrivatePhotoCache(path)
    }

    await loadCars()
    renderDuplicateScanResults()
  } catch (error) {
    console.error(error)
    alert(error.message || 'Could not combine duplicates.')
    button.disabled = false
    button.textContent = 'Combine This Group'
  }
}

const UPPERCASE_EDITOR_INPUT_IDS = [
  'custom-brand',
  'model',
  'custom-color',
  'hotwheels-toy-number',
  'series',
  'general-number',
  'series-collection-number',
]

function uppercaseEditorInput(event) {
  const input = event.currentTarget
  const start = input.selectionStart
  const end = input.selectionEnd
  const upper = input.value.toUpperCase()
  if (input.value === upper) return
  input.value = upper
  if (typeof input.setSelectionRange === 'function' && start !== null && end !== null) {
    input.setSelectionRange(start, end)
  }
}

for (const id of UPPERCASE_EDITOR_INPUT_IDS) {
  const input = $(id)
  if (input) input.addEventListener('input', uppercaseEditorInput)
}

function populateYearOptions() {
  const select = $('model-year')
  const fragment = document.createDocumentFragment()
  for (let year = 2028; year >= 2000; year -= 1) {
    const option = document.createElement('option')
    option.value = String(year)
    option.textContent = String(year)
    fragment.append(option)
  }
  const other = document.createElement('option')
  other.value = 'Other'
  other.textContent = 'Other'
  fragment.append(other)
  select.append(fragment)
}


$('special-status').addEventListener('change', syncMultipackFields)
exclusiveRetailer?.addEventListener('change', syncExclusiveFields)
categorySelect?.addEventListener('change', syncCategoryCustomField)
packSizeSelect?.addEventListener('change', syncMultipackFields)
favoritesStat?.addEventListener('click', () => {
  activeBrandFilter = '__favorites__'
  searchInput.value = ''
  showCollection()
  applySearch()
})
jdmStat?.addEventListener('click', () => {
  activeBrandFilter = '__jdm__'
  searchInput.value = ''
  showCollection()
  applySearch()
})
$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  authMessage.textContent = 'Signing in…'
  const { error } = await supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value,
  })
  authMessage.textContent = error ? error.message : ''
})

$('signup-btn').addEventListener('click', async () => {
  const email = $('email').value.trim()
  const password = $('password').value
  if (!email || !password) {
    authMessage.textContent = 'Enter an email and password first.'
    return
  }
  authMessage.textContent = 'Creating account…'
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: APP_URL },
  })
  authMessage.textContent = error ? error.message : 'Account created. Check your email to confirm it, then sign in.'
})


function safeShareFilename(value) {
  return String(value || 'car').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'car'
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err) }
    img.src = url
  })
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = Math.max(0, (img.width - sw) / 2)
  const sy = Math.max(0, (img.height - sh) / 2)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function fitCanvasText(ctx, text, maxWidth, startSize, minSize = 34, weight = 800) {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

async function createCarShareCard(car) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#171717')
  gradient.addColorStop(1, '#050505')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const photoX = 54, photoY = 54, photoW = 972, photoH = 820
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(photoX, photoY, photoW, photoH, 32)
  ctx.clip()
  ctx.fillStyle = '#111'
  ctx.fillRect(photoX, photoY, photoW, photoH)
  if (car.photo_path) {
    const blob = await getPrivatePhotoBlob(car.photo_path)
    if (blob) {
      try { drawCoverImage(ctx, await loadImageFromBlob(blob), photoX, photoY, photoW, photoH) } catch {}
    }
  }
  ctx.restore()

  const title = displayTitle(car)
  ctx.fillStyle = '#fff'
  const titleSize = fitCanvasText(ctx, title, 950, 70, 42, 850)
  ctx.font = `850 ${titleSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText(title, 64, 978)

  const meta = [car.diecast_brand, car.model_year, car.color].filter(Boolean).join('  •  ')
  ctx.fillStyle = '#b8bec7'
  ctx.font = '500 34px system-ui, -apple-system, sans-serif'
  if (meta) ctx.fillText(meta, 66, 1040)

  const extra = [car.special_status, car.series_collection, car.hotwheels_toy_number ? `Toy # ${car.hotwheels_toy_number}` : null].filter(Boolean).join('  •  ')
  ctx.fillStyle = '#8d96a2'
  ctx.font = '500 28px system-ui, -apple-system, sans-serif'
  if (extra) {
    const max = 940
    let shown = extra
    while (shown.length > 8 && ctx.measureText(shown).width > max) shown = shown.slice(0, -2)
    if (shown !== extra) shown = `${shown.trim()}…`
    ctx.fillText(shown, 66, 1095)
  }

  ctx.strokeStyle = 'rgba(255,255,255,.12)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(64, 1150); ctx.lineTo(1016, 1150); ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '850 44px system-ui, -apple-system, sans-serif'
  ctx.fillText('POCKET 64', 66, 1230)
  ctx.fillStyle = '#7f8791'
  ctx.font = '500 24px system-ui, -apple-system, sans-serif'
  ctx.fillText('Your collection. In your pocket.', 66, 1273)

  const blob = await canvasToBlob(canvas, 'image/png')
  if (!blob) throw new Error('Could not create share image.')
  return new File([blob], `${safeShareFilename(title)}-Pocket64.png`, { type: 'image/png' })
}

async function shareCurrentCar() {
  if (!editingCar) return
  const button = $('share-button')
  const original = button.textContent
  button.disabled = true
  button.textContent = 'Preparing…'
  try {
    const file = await createCarShareCard(editingCar)
    const shareData = { files: [file], title: `${displayTitle(editingCar)} — Pocket 64`, text: 'Shared from Pocket 64' }
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share(shareData)
      return
    }
    downloadBlob(file, file.name)
    alert('Share card saved as an image. You can share it from Photos or Files.')
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error(err)
      alert(`Could not create the share card: ${err.message || err}`)
    }
  } finally {
    button.disabled = false
    button.textContent = original
  }
}

async function loadProfileIcon() {
  if (!session?.user) return
  const path = `${session.user.id}/profile-icon.jpg`
  try {
    const signedUrl = await getPrivatePhotoUrl(path)
    if (!signedUrl) return
    const img = $('profile-icon-image')
    img.onload = () => {
      img.classList.remove('hidden')
      $('profile-icon-fallback').classList.add('hidden')
    }
    img.onerror = () => {
      img.classList.add('hidden')
      $('profile-icon-fallback').classList.remove('hidden')
    }
    img.src = signedUrl
  } catch (err) {
    console.warn('Profile icon unavailable', err)
  }
}

async function saveProfileIcon(file) {
  if (!session?.user || !file) return
  const button = $('profile-icon-button')
  button.disabled = true
  try {
    const compressed = await compressImage(file, 512, .84)
    const path = `${session.user.id}/profile-icon.jpg`
    const { error } = await supabase.storage.from('car-photos').upload(path, compressed, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    await invalidatePrivatePhotoCache(path)
    const localUrl = await getPrivatePhotoUrl(path)
    if (!localUrl) throw new Error('Could not reload saved icon')
    $('profile-icon-image').src = localUrl
    $('profile-icon-image').classList.remove('hidden')
    $('profile-icon-fallback').classList.add('hidden')
  } catch (err) {
    console.error(err)
    alert(`Could not save your icon: ${err.message || err}`)
  } finally {
    button.disabled = false
    $('profile-icon-input').value = ''
  }
}

$('logout-btn').addEventListener('click', async () => {
  if (!window.confirm('Are you sure you want to sign out?')) return
  await supabase.auth.signOut()
})
$('collection-nav').addEventListener('click', showCollection)
$('social-nav').addEventListener('click', showSocial)
$('stats-nav').addEventListener('click', showStats)
$('settings-row-button')?.addEventListener('click', showSettings)
$('appearance-select').addEventListener('change', (event) => applyAppearance(event.currentTarget.value, true))
$('settings-profile-icon').addEventListener('click', () => $('profile-icon-input').click())
$('diagnostics-button')?.addEventListener('click', () => {
  const entries = readDiagnostics()
  if (!entries.length) {
    alert(`Pocket 64 ${APP_VERSION} diagnostics: no JavaScript crashes or unhandled promise errors recorded on this device.`)
    return
  }
  const report = entries.map((entry) => `[${entry.at}] v${entry.version} ${entry.kind}: ${entry.message}${entry.detail ? ` (${entry.detail})` : ''}`).join('\n')
  alert(`Pocket 64 diagnostics — last ${entries.length} event${entries.length === 1 ? '' : 's'}:\n\n${report}`)
})
$('add-button').addEventListener('click', () => showEditor())
$('empty-add-button').addEventListener('click', () => showEditor())
$('cancel-button').addEventListener('click', showCollection)
$('save-button').addEventListener('click', saveCar)
$('share-button').addEventListener('click', shareCurrentCar)
$('quantity-minus').addEventListener('click', () => stepQuantity(-1))
$('quantity-plus').addEventListener('click', () => stepQuantity(1))
deleteButton.addEventListener('click', deleteCar)
$('backup-button').addEventListener('click', exportBackup)
$('backup-reminder-now').addEventListener('click', exportBackup)
$('backup-reminder-later').addEventListener('click', () => {
  try { localStorage.setItem(BACKUP_REMINDER_DISMISSED_KEY, String(Date.now())) } catch {}
  updateBackupReminder()
})
$('restore-button').addEventListener('click', () => $('restore-input').click())
$('restore-input').addEventListener('change', () => {
  const file = $('restore-input').files?.[0]
  if (file) restoreBackupFile(file)
})
$('refresh-button').addEventListener('click', loadCars)
$('clear-collection-button')?.addEventListener('click', clearCollection)
$('active-filter-pill').addEventListener('click', clearBrandFilter)
$('profile-icon-button').addEventListener('click', () => $('profile-icon-input').click())
$('profile-icon-input').addEventListener('change', () => saveProfileIcon($('profile-icon-input').files?.[0]))
searchInput.addEventListener('input', () => {
  updateSearchClearButton()
  applySearch()
})
$('search-clear-button')?.addEventListener('click', () => {
  searchInput.value = ''
  updateSearchClearButton()
  applySearch()
  searchInput.focus()
})
function updateSearchClearButton() {
  const button = $('search-clear-button')
  if (!button) return
  button.classList.toggle('hidden', !searchInput.value)
}
updateSearchClearButton()
sortSelect.addEventListener('change', () => {
  try { localStorage.setItem(SORT_STORAGE_KEY, sortSelect.value) } catch {}
  applySearch()
})
$('model').addEventListener('input', () => {
  duplicateDismissedModel = ''
  renderModelSuggestions()
  clearTimeout(duplicateCheckTimer)
  duplicateCheckTimer = setTimeout(checkDuplicateModel, 280)
})
$('model').addEventListener('focus', renderModelSuggestions)
$('model').addEventListener('blur', () => {
  clearTimeout(duplicateCheckTimer)
  setTimeout(hideModelSuggestions, 120)
  checkDuplicateModel()
})
$('hotwheels-toy-number').addEventListener('input', renderToyNumberSuggestions)
$('hotwheels-toy-number').addEventListener('focus', renderToyNumberSuggestions)
$('hotwheels-toy-number').addEventListener('blur', () => {
  setTimeout(hideToyNumberSuggestions, 120)
})
duplicateIncreaseBtn.addEventListener('click', increaseDuplicateQuantity)
duplicateAnywayBtn.addEventListener('click', () => {
  duplicateDismissedModel = normalizeModel($('model').value)
  hideDuplicateWarning()
})
$('diecast-brand').addEventListener('change', syncBrandCustomField)
$('color').addEventListener('change', syncColorCustomField)
$('model-year').addEventListener('change', syncYearCustomField)
$('more-details-toggle').addEventListener('click', () => {
  const section = $('more-details-section')
  const collapsed = section.classList.toggle('quick-collapsed')
  $('more-details-toggle').textContent = collapsed ? 'More Details ▾' : 'Fewer Details ▴'
})
const cameraInput = $('camera-input')
const squareCameraModal = $('square-camera-modal')
const squareCameraVideo = $('square-camera-video')
const squareCameraPreview = $('square-camera-preview')
const squareCameraStatus = $('square-camera-status')
let squareCameraStream = null
let squareCameraBlob = null

function useSelectedPhotoFile(file) {
  selectedPhotoFile = file ?? null
  if (!selectedPhotoFile) return
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = URL.createObjectURL(selectedPhotoFile)
  setPhotoPreview(previewObjectUrl)
}

function stopSquareCameraStream() {
  if (squareCameraStream) {
    squareCameraStream.getTracks().forEach((track) => track.stop())
    squareCameraStream = null
  }
  if (squareCameraVideo) squareCameraVideo.srcObject = null
}

function resetSquareCameraCapture() {
  squareCameraBlob = null
  if (squareCameraPreview) {
    squareCameraPreview.src = ''
    squareCameraPreview.classList.add('hidden')
  }
  squareCameraVideo?.classList.remove('hidden')
  $('square-camera-shutter')?.classList.remove('hidden')
  $('square-camera-retake')?.classList.add('hidden')
  $('square-camera-use')?.classList.add('hidden')
  if (squareCameraStatus) squareCameraStatus.textContent = 'Center the package inside the square.'
}

async function openSquareCamera() {
  if (!squareCameraModal || !squareCameraVideo || !navigator.mediaDevices?.getUserMedia) {
    cameraInput?.click()
    return
  }
  resetSquareCameraCapture()
  squareCameraModal.classList.remove('hidden')
  document.body.classList.add('camera-open')
  try {
    squareCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    squareCameraVideo.srcObject = squareCameraStream
    await squareCameraVideo.play()
  } catch (error) {
    console.warn('Square camera unavailable; using device camera picker.', error)
    closeSquareCamera()
    cameraInput?.click()
  }
}

function closeSquareCamera() {
  stopSquareCameraStream()
  squareCameraModal?.classList.add('hidden')
  document.body.classList.remove('camera-open')
  resetSquareCameraCapture()
}

async function captureSquareCameraFrame() {
  if (!squareCameraVideo?.videoWidth || !squareCameraVideo?.videoHeight) return
  const sourceW = squareCameraVideo.videoWidth
  const sourceH = squareCameraVideo.videoHeight
  const side = Math.min(sourceW, sourceH)
  const sx = Math.floor((sourceW - side) / 2)
  const sy = Math.floor((sourceH - side) / 2)
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1200
  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.drawImage(squareCameraVideo, sx, sy, side, side, 0, 0, canvas.width, canvas.height)
  squareCameraBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not capture photo.')), 'image/jpeg', .9)
  })
  const url = URL.createObjectURL(squareCameraBlob)
  squareCameraPreview.src = url
  squareCameraPreview.onload = () => URL.revokeObjectURL(url)
  squareCameraPreview.classList.remove('hidden')
  squareCameraVideo.classList.add('hidden')
  $('square-camera-shutter')?.classList.add('hidden')
  $('square-camera-retake')?.classList.remove('hidden')
  $('square-camera-use')?.classList.remove('hidden')
  if (squareCameraStatus) squareCameraStatus.textContent = 'Square captured.'
}

async function retakeSquareCameraPhoto() {
  squareCameraBlob = null
  squareCameraPreview.src = ''
  squareCameraPreview.classList.add('hidden')
  squareCameraVideo.classList.remove('hidden')
  $('square-camera-shutter')?.classList.remove('hidden')
  $('square-camera-retake')?.classList.add('hidden')
  $('square-camera-use')?.classList.add('hidden')
  if (squareCameraStatus) squareCameraStatus.textContent = 'Center the package inside the square.'
  if (!squareCameraStream) await openSquareCamera()
}

function useSquareCameraPhoto() {
  if (!squareCameraBlob) return
  const file = new File([squareCameraBlob], `pocket64-${Date.now()}.jpg`, { type: 'image/jpeg' })
  useSelectedPhotoFile(file)
  closeSquareCamera()
}

$('choose-photo-button')?.addEventListener('click', () => photoInput?.click())
$('square-camera-cancel')?.addEventListener('click', closeSquareCamera)
$('square-camera-shutter')?.addEventListener('click', captureSquareCameraFrame)
$('square-camera-retake')?.addEventListener('click', retakeSquareCameraPhoto)
$('square-camera-use')?.addEventListener('click', useSquareCameraPhoto)

cameraInput?.addEventListener('change', () => {
  useSelectedPhotoFile(cameraInput.files?.[0])
  cameraInput.value = ''
})

photoInput.addEventListener('change', () => {
  useSelectedPhotoFile(photoInput.files?.[0])
  photoInput.value = ''
})

const backToTopButton = $('back-to-top-button')
function syncBackToTopButton() {
  if (!backToTopButton) return
  const onCollection = collectionScreen?.classList.contains('active')
  backToTopButton.classList.toggle('hidden', !onCollection || window.scrollY < 520)
}
backToTopButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
window.addEventListener('scroll', syncBackToTopButton, { passive: true })
syncBackToTopButton()

populateYearOptions()
applySortPreference()

supabase.auth.onAuthStateChange((event, newSession) => {
  const previousUserId = session?.user?.id ?? null
  const nextUserId = newSession?.user?.id ?? null
  session = newSession

  if (session) {
    showMain()
    setTimeout(() => loadProfileIcon(), 0)
    // Mobile browsers commonly emit TOKEN_REFRESHED after returning from another app.
    // Keep the current collection mounted unless this is actually a different/new user.
    if (loadedCarsUserId !== nextUserId && previousUserId !== nextUserId) {
      setTimeout(() => loadCars(), 0)
    }
  } else {
    cars = []
    filteredCars = []
    loadedCarsUserId = null
    clearPrivatePhotoMemoryCache()
    activeBrandFilter = null
    $('profile-icon-image').removeAttribute('src')
    $('profile-icon-image').classList.add('hidden')
    $('profile-icon-fallback').classList.remove('hidden')
    applySearch()
    renderStats()
    showAuth()
  }
})

const { data: { session: initialSession } } = await supabase.auth.getSession()
session = initialSession
if (session) {
  showMain()
  await loadProfileIcon()
  if (loadedCarsUserId !== session.user.id) await loadCars()
} else {
  showAuth()
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js')
      await registration.update()
    } catch (error) {
      console.error('Service worker registration failed', error)
      recordDiagnostic('service-worker', error?.message || error)
    }
  })
}
