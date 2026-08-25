import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0'

const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
const APP_URL = 'https://neoforte.github.io/diecast_collection/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const BRAND_PRESETS = ['None', 'Hot Wheels', 'Matchbox', 'M2', 'Cartuned', 'Maisto', 'Mini GT', 'Majorette', 'Other']
const SPECIAL_STATUSES = ['TH', 'STH', 'Silver Series', 'Premium', 'Car Culture', 'Elite 64', 'Red Line Club', 'Chase', 'Rare', 'Limited']
const COLOR_PRESETS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gold', 'Brown', 'Tan', 'Other']
const APP_VERSION = '2.6'
const APPEARANCE_STORAGE_KEY = 'pocket64-appearance'
const LAST_BACKUP_STORAGE_KEY = 'pocket64-last-backup'
const BACKUP_REMINDER_DISMISSED_KEY = 'pocket64-backup-reminder-dismissed'
const BACKUP_REMINDER_MIN_CARS = 15
const BACKUP_REMINDER_DAYS = 30
const BACKUP_REMINDER_SNOOZE_DAYS = 7
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
    'Elite 64': 'special-elite-64',
    'Red Line Club': 'special-red-line-club',
    'Chase': 'special-chase',
    'Rare': 'special-rare',
    'Limited': 'special-limited',
  }
  return map[status] || ''
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
const duplicateWarningText = $('duplicate-warning-text')
const duplicateIncreaseBtn = $('duplicate-increase-btn')
const duplicateAnywayBtn = $('duplicate-anyway-btn')
const customColorLabel = $('custom-color-label')
const customColor = $('custom-color')
const customCheckbox = $('is-custom')

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
let loadedCarsUserId = null
let carsLoadPromise = null
let activeBrandFilter = null

const PRIVATE_PHOTO_CACHE_PREFIX = 'pocket64-private-photos-v1'
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
}


function showSocial() {
  hideScreens()
  socialScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav('social')
}

function showStats() {
  hideScreens()
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
  settingsScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav(null)
  const appearanceSelect = $('appearance-select')
  if (appearanceSelect) appearanceSelect.value = getSavedAppearance()
  updateBackupStatus()
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

function renderModelSuggestions() {
  const input = $('model')
  const q = input.value.trim()
  if (!q) {
    hideModelSuggestions()
    return
  }
  const matches = matchingModelCars(q)
  if (!matches.length) {
    hideModelSuggestions()
    return
  }

  modelSuggestions.replaceChildren()
  for (const car of matches) {
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
    meta.textContent = [car.diecast_brand, car.model_year, car.color, car.hotwheels_toy_number, car.is_custom ? 'CUSTOM' : null, `Qty ${qty}`].filter(Boolean).join(' · ')

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
  modelSuggestions.classList.remove('hidden')
}

function hideDuplicateWarning() {
  duplicateWarning.classList.add('hidden')
  duplicateWarningText.textContent = ''
  duplicateIncreaseBtn.classList.remove('hidden')
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
  if (matches.length === 1) {
    const match = matches[0]
    const qty = Math.max(1, Number(match.quantity) || 1)
    const brand = match.diecast_brand ? `${match.diecast_brand} · ` : ''
    duplicateWarningText.textContent = `Possible duplicate: ${brand}${match.model} is already in your garage (qty ${qty}).`
    duplicateIncreaseBtn.classList.remove('hidden')
  } else {
    duplicateWarningText.textContent = `Possible duplicate: ${matches.length} existing entries use the model “${raw}”. Check the collection before adding another.`
    duplicateIncreaseBtn.classList.add('hidden')
  }
}

async function increaseDuplicateQuantity() {
  const matches = modelMatches($('model').value)
  if (matches.length !== 1 || !session?.user) return
  const match = matches[0]
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
  $('model').value = car?.model ?? ''
  hideModelSuggestions()
  setYearValue(car?.model_year ?? '')
  setColorValue(car?.color ?? '')
  $('hotwheels-toy-number').value = String(car?.hotwheels_toy_number ?? '').toUpperCase()
  $('series').value = car?.series_collection ?? ''
  $('general-number').value = car?.general_number ?? ''
  $('series-collection-number').value = car?.series_collection_number ?? ''
  $('quantity').value = String(car?.quantity ?? 1)
  syncQuantityDisplay()
  setSpecialValue(car?.special_status ?? '')
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

  const response = await fetch(data.signedUrl, { cache: 'force-cache' })
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
    }

    if (failures.length) {
      const preview = failures.slice(0, 5).join(', ')
      const more = failures.length > 5 ? ` and ${failures.length - 5} more` : ''
      throw new Error(`${failures.length} stored photo${failures.length === 1 ? '' : 's'} could not be downloaded (${preview}${more}). No backup file was created so you do not mistake an incomplete backup for a complete one. Please retry.`)
    }

    const backupCars = cars.map((car) => ({ ...car }))
    const backup = {
      format: 'ajs-garage-backup',
      version: 4,
      exported_at: new Date().toISOString(),
      source_user_id: session.user.id,
      car_count: backupCars.length,
      photo_count: Object.keys(photoMap).length,
      note: 'Self-contained Pocket 64 backup. backup.json contains all current collection fields and the photos folder contains the actual private car images.',
      photos: photoMap,
      cars: backupCars,
    }

    zip.file('backup.json', JSON.stringify(backup, null, 2))
    zip.file('README.txt', [
      "Pocket 64 Disaster-Recovery Backup",
      '',
      `Exported: ${backup.exported_at}`,
      `Cars: ${backup.car_count}`,
      `Photos: ${backup.photo_count}`,
      '',
      'Keep this ZIP file somewhere safe. Do not unzip or modify it before restoring in Pocket 64.',
      'The backup contains collection data plus the actual stored car images.',
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
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(1, Math.floor(number)) : null
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
  return {
    id: targetId,
    user_id: session.user.id,
    photo_path: initialPhotoPath,
    diecast_brand: nullableText(car.diecast_brand),
    make: nullableText(car.make),
    model: nullableText(car.model),
    model_year: nullableText(car.model_year),
    scale: nullableText(car.scale),
    series_collection: nullableText(car.series_collection),
    quantity: restoreQuantity(car.quantity),
    notes: nullableText(car.notes),
    created_at: restoreDate(car.created_at, now),
    updated_at: restoreDate(car.updated_at, now),
    package_status: nullableText(car.package_status),
    special_status: nullableText(car.special_status),
    general_number: nullableText(car.general_number),
    series_collection_number: nullableText(car.series_collection_number),
    color: nullableText(car.color),
    hotwheels_toy_number: nullableText(car.hotwheels_toy_number),
    is_custom: restoreBoolean(car.is_custom),
  }
}

async function upsertRestoreRows(rows) {
  const chunkSize = 100
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize)
    const { error } = await supabase.from('cars').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
  }
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
    const photoNote = embeddedPhotoCount
      ? `${embeddedPhotoCount} embedded photo${embeddedPhotoCount === 1 ? '' : 's'} will also be restored.`
      : 'This backup has no embedded images. Car data will restore, but image recovery depends on any old Supabase photo paths still existing.'

    const approved = window.confirm(
      `Restore Pocket 64 backup from ${exportedDate}?\n\n` +
      `${backup.cars.length} car${backup.cars.length === 1 ? '' : 's'}\n` +
      `${photoNote}\n\n${accountNote}\n` +
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
const VALID_SORTS = new Set(['newest', 'oldest', 'brand-az', 'brand-za', 'model-az', 'model-za', 'qty-high', 'qty-low', 'special-first'])

function textForSort(value) {
  const text = String(value ?? '').trim()
  return text || '\uffff'
}

function dateValue(value) {
  const time = Date.parse(value || '')
  return Number.isFinite(time) ? time : 0
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
      case 'newest':
      default: return dateValue(b.created_at) - dateValue(a.created_at)
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
  const label = activeBrandFilter === '__unspecified__' ? 'Unspecified' : activeBrandFilter
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
      if (activeBrandFilter === '__unspecified__') return !brand
      return brand.toLowerCase() === activeBrandFilter.toLowerCase()
    })
  }
  if (q) {
    matches = matches.filter((car) => {
      const values = [car.diecast_brand, car.model, car.model_year, car.color, car.hotwheels_toy_number, car.scale, car.series_collection, car.general_number, car.series_collection_number, car.special_status, car.notes]
      if (car.is_custom) values.push('custom')
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

  const photoBox = card.querySelector('.car-photo')
  let badge = photoBox?.querySelector('.quantity-badge')
  if (qty > 1) {
    if (!badge && photoBox) {
      badge = document.createElement('div')
      badge.className = 'quantity-badge'
      const badgeStack = photoBox.querySelector('.badge-stack')
      if (badgeStack) photoBox.insertBefore(badge, badgeStack)
      else photoBox.append(badge)
    }
    if (badge) badge.textContent = String(qty)
  } else {
    badge?.remove()
  }
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

function renderCars() {
  carsGrid.replaceChildren()
  emptyState.classList.toggle('hidden', cars.length !== 0)

  for (const car of filteredCars) {
    const card = document.createElement('article')
    card.className = 'car-card'
    card.dataset.carId = String(car.id)
    card.tabIndex = 0
    const specialStatus = SPECIAL_STATUSES.includes(car.special_status) ? car.special_status : ''
    if (specialStatus) {
      const specialClass = specialClassForStatus(specialStatus)
      card.classList.add('special-card')
      if (specialClass) card.classList.add(specialClass)
    }
    if (car.is_custom) {
      card.classList.add('custom-car-card')
    }
    card.innerHTML = `
      <div class="car-photo"><span>🚗</span></div>
      <div class="car-body">
        <div class="car-title"></div>
        <div class="car-sub"></div>
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
    const quantity = Number(car.quantity)
    if (Number.isFinite(quantity) && quantity > 1) {
      const qtyBadge = document.createElement('div')
      qtyBadge.className = 'quantity-badge'
      qtyBadge.textContent = String(quantity)
      photoBox.append(qtyBadge)
    }
    const badgeStack = document.createElement('div')
    badgeStack.className = 'badge-stack'
    if (specialStatus) {
      const specialBadge = document.createElement('div')
      specialBadge.className = 'special-badge'
      specialBadge.textContent = specialStatus === 'Limited' ? 'LIMITED' : specialStatus.toUpperCase()
      badgeStack.append(specialBadge)
    }
    if (car.is_custom) {
      const customBadge = document.createElement('div')
      customBadge.className = 'special-badge custom-badge'
      customBadge.textContent = 'CUSTOM'
      badgeStack.append(customBadge)
    }
    if (badgeStack.childElementCount) photoBox.append(badgeStack)

    const qtyControls = document.createElement('div')
    qtyControls.className = 'card-quantity-control'
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
    card.querySelector('.car-body').append(qtyControls)

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
    qtyControls.addEventListener('keydown', (event) => event.stopPropagation())

    const open = () => showEditor(car)
    card.addEventListener('click', open)
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open() })
    carsGrid.append(card)
  }
}

function renderStats() {
  statsTotal.textContent = String(cars.length)
  const grandTotal = cars.reduce((sum, car) => sum + Math.max(1, Number(car.quantity) || 1), 0)
  statsGrandTotal.textContent = String(grandTotal)
  brandStats.replaceChildren()

  const counts = new Map()
  const displayNames = new Map()
  for (const brand of BRAND_PRESETS) {
    if (brand === 'Other') continue
    const key = brand.toLowerCase()
    counts.set(key, 0)
    displayNames.set(key, brand)
  }

  let unspecified = 0
  for (const car of cars) {
    const raw = String(car.diecast_brand ?? '').trim()
    if (!raw) {
      unspecified += 1
      continue
    }
    const key = raw.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!displayNames.has(key)) displayNames.set(key, raw)
  }

  const entries = [...counts.entries()].map(([key, count]) => ({
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

  if (unspecified > 0) entries.push({ brand: 'Unspecified', count: unspecified })

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
      const brand = entry.brand
      activeBrandFilter = brand === 'Unspecified' ? '__unspecified__' : brand
      searchInput.value = ''
      showCollection()
      applySearch()
    })
    brandStats.append(row)
  }
}

async function compressImage(file, maxDimension = 1600, quality = 0.78) {
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
  const path = `${session.user.id}/${carId}.jpg`
  const { error } = await supabase.storage.from('car-photos').upload(path, compressed, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  await invalidatePrivatePhotoCache(path)
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
  return {
    user_id: session.user.id,
    diecast_brand: brandRaw ? canonicalBrand(brandRaw) : null,
    is_custom: Boolean(customCheckbox.checked),
    model: $('model').value.trim().toUpperCase() || null,
    model_year: yearRaw ? String(yearRaw).toUpperCase() : null,
    color: colorRaw ? String(colorRaw).toUpperCase() : null,
    hotwheels_toy_number: $('hotwheels-toy-number').value.trim().toUpperCase() || null,
    series_collection: $('series').value.trim().toUpperCase() || null,
    general_number: $('general-number').value.trim().toUpperCase() || null,
    series_collection_number: $('series-collection-number').value.trim().toUpperCase() || null,
    quantity: Math.max(1, Math.floor(Number(qtyRaw) || 1)),
    special_status: specialRaw || null,
    notes: $('notes').value.trim() || null,
    updated_at: new Date().toISOString(),
  }
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
      const { data, error } = await supabase
        .from('cars')
        .update(payload)
        .eq('id', editingCar.id)
        .eq('user_id', session.user.id)
        .select()
        .single()
      if (error) throw error
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
      const path = await uploadPhoto(car.id, selectedPhotoFile)
      const { error } = await supabase
        .from('cars')
        .update({ photo_path: path })
        .eq('id', car.id)
        .eq('user_id', session.user.id)
      if (error) throw error
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

async function deleteCar() {
  if (!editingCar || !confirm('Delete this car from your collection?')) return
  editorMessage.textContent = 'Deleting…'
  try {
    if (editingCar.photo_path) {
      await supabase.storage.from('car-photos').remove([editingCar.photo_path])
      await invalidatePrivatePhotoCache(editingCar.photo_path)
    }
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', editingCar.id)
      .eq('user_id', session.user.id)
    if (error) throw error
    await loadCars()
    showCollection()
  } catch (err) {
    console.error(err)
    editorMessage.textContent = err.message || 'Could not delete car.'
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
$('active-filter-pill').addEventListener('click', clearBrandFilter)
$('profile-icon-button').addEventListener('click', () => $('profile-icon-input').click())
$('profile-icon-input').addEventListener('change', () => saveProfileIcon($('profile-icon-input').files?.[0]))
searchInput.addEventListener('input', applySearch)
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
photoInput.addEventListener('change', () => {
  selectedPhotoFile = photoInput.files?.[0] ?? null
  if (!selectedPhotoFile) return
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = URL.createObjectURL(selectedPhotoFile)
  setPhotoPreview(previewObjectUrl)
})

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
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'))
}
