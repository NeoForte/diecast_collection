import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0'

const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
const APP_URL = 'https://neoforte.github.io/diecast_collection/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const BRAND_PRESETS = ['None', 'Hot Wheels', 'Matchbox', 'M2', 'Cartuned', 'Maisto', 'Mini GT', 'Majorette', 'Other']
const SPECIAL_STATUSES = ['TH', 'STH', 'Silver Series', 'Car Culture Premium', 'Elite 64', 'Red Line Club', 'Chase', 'Rare', 'Limited']
const COLOR_PRESETS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gold', 'Brown', 'Tan', 'Other']

function specialClassForStatus(status) {
  const map = {
    'TH': 'special-th',
    'STH': 'special-sth',
    'Silver Series': 'special-silver-series',
    'Car Culture Premium': 'special-car-culture-premium',
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
const statsScreen = $('stats-screen')
const editorScreen = $('editor-screen')
const carsGrid = $('cars-grid')
const emptyState = $('empty-state')
const carCount = $('car-count')
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
const customSpecialLabel = $('custom-special-label')
const customSpecial = $('custom-special')
const customColorLabel = $('custom-color-label')
const customColor = $('custom-color')

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

function syncBrandCustomField() {
  const isOther = $('diecast-brand').value === 'Other'
  $('custom-brand-label').classList.toggle('hidden', !isOther)
  if (!isOther) $('custom-brand').value = ''
}

function syncSpecialCustomField() {
  const isOther = $('special-status').value === 'Other'
  customSpecialLabel.classList.toggle('hidden', !isOther)
  if (!isOther) customSpecial.value = ''
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
  const preset = SPECIAL_STATUSES.find((status) => status.toLowerCase() === raw.toLowerCase())
  if (!raw) {
    $('special-status').value = ''
    customSpecial.value = ''
  } else if (preset) {
    $('special-status').value = preset
    customSpecial.value = ''
  } else {
    $('special-status').value = 'Other'
    customSpecial.value = raw
  }
  syncSpecialCustomField()
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
  $('stats-nav').classList.toggle('active', active === 'stats')
}

function hideScreens() {
  collectionScreen.classList.remove('active')
  statsScreen.classList.remove('active')
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

function showStats() {
  hideScreens()
  statsScreen.classList.add('active')
  mainNav.classList.remove('hidden')
  setActiveNav('stats')
  renderStats()
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
    meta.textContent = [car.diecast_brand, car.model_year, car.color, car.hotwheels_toy_number, `Qty ${qty}`].filter(Boolean).join(' · ')

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
  fillEditor(car)
  if (quickAddMode && quickAddKeepBrand) {
    $('diecast-brand').value = quickAddKeepBrand
    $('custom-brand').value = quickAddKeepCustomBrand
    syncBrandCustomField()
  }
}

function fillEditor(car) {
  setBrandValue(car?.diecast_brand ?? '')
  $('model').value = car?.model ?? ''
  hideModelSuggestions()
  setYearValue(car?.model_year ?? '')
  setColorValue(car?.color ?? '')
  $('hotwheels-toy-number').value = car?.hotwheels_toy_number ?? ''
  $('series').value = car?.series_collection ?? ''
  $('general-number').value = car?.general_number ?? ''
  $('series-collection-number').value = car?.series_collection_number ?? ''
  $('quantity').value = car?.quantity ?? ''
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

async function loadPrivatePhoto(path, imgEl, placeholderEl = null) {
  const { data, error } = await supabase.storage.from('car-photos').createSignedUrl(path, 3600)
  if (!error && data?.signedUrl) {
    imgEl.src = data.signedUrl
    imgEl.classList.remove('hidden')
    if (placeholderEl) placeholderEl.classList.add('hidden')
  }
}

async function loadCars() {
  if (!session?.user) return
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }
  cars = data ?? []
  applySearch()
  renderStats()
}

function backupFilename(extension = 'zip') {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `AJs_Garage_Backup_${year}-${month}-${day}.${extension}`
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
      const { data, error } = await supabase.storage.from('car-photos').download(car.photo_path)
      if (error || !data) {
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
      version: 3,
      exported_at: new Date().toISOString(),
      source_user_id: session.user.id,
      car_count: backupCars.length,
      photo_count: Object.keys(photoMap).length,
      note: 'Self-contained AJ\'s Garage backup. backup.json contains collection records and the photos folder contains the actual private car images.',
      photos: photoMap,
      cars: backupCars,
    }

    zip.file('backup.json', JSON.stringify(backup, null, 2))
    zip.file('README.txt', [
      "AJ's Garage Disaster-Recovery Backup",
      '',
      `Exported: ${backup.exported_at}`,
      `Cars: ${backup.car_count}`,
      `Photos: ${backup.photo_count}`,
      '',
      'Keep this ZIP file somewhere safe. Do not unzip or modify it before restoring in AJ\'s Garage.',
      'The backup contains collection data plus the actual stored car images.',
    ].join('\n'))

    button.textContent = 'Packing…'
    const blob = await zip.generateAsync(
      { type: 'blob', compression: 'STORE' },
      (metadata) => { button.textContent = `Packing ${Math.round(metadata.percent)}%` },
    )
    downloadBlob(blob, backupFilename('zip'))

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
      `Restore AJ's Garage backup from ${exportedDate}?\n\n` +
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

function applySearch() {
  const q = searchInput.value.trim().toLowerCase()
  const matches = !q ? cars : cars.filter((car) =>
    [car.diecast_brand, car.model, car.model_year, car.color, car.hotwheels_toy_number, car.scale, car.series_collection, car.general_number, car.series_collection_number, car.special_status, car.notes]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  )
  filteredCars = sortCars(matches)
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
    applySearch()
    renderStats()
  } catch (error) {
    console.error(error)
    controls?.classList.remove('saving')
    buttons.forEach((button) => { button.disabled = false })
    window.alert(error.message || 'Could not update quantity.')
  }
}

function renderCars() {
  carsGrid.replaceChildren()
  carCount.textContent = `${cars.length} ${cars.length === 1 ? 'car' : 'cars'}`
  emptyState.classList.toggle('hidden', cars.length !== 0)

  for (const car of filteredCars) {
    const card = document.createElement('article')
    card.className = 'car-card'
    card.tabIndex = 0
    const specialStatus = SPECIAL_STATUSES.includes(car.special_status) ? car.special_status : ''
    if (specialStatus) {
      const specialClass = specialClassForStatus(specialStatus)
      card.classList.add('special-card')
      if (specialClass) card.classList.add(specialClass)
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
      loadPrivatePhoto(car.photo_path, img)
    }
    const quantity = Number(car.quantity)
    if (Number.isFinite(quantity) && quantity > 1) {
      const qtyBadge = document.createElement('div')
      qtyBadge.className = 'quantity-badge'
      qtyBadge.textContent = String(quantity)
      photoBox.append(qtyBadge)
    }
    if (specialStatus) {
      const specialBadge = document.createElement('div')
      specialBadge.className = 'special-badge'
      specialBadge.textContent = specialStatus === 'Limited' ? 'LIMITED' : specialStatus.toUpperCase()
      photoBox.append(specialBadge)
    }

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
      searchInput.value = brand === 'Unspecified' ? '' : brand
      showCollection()
      if (brand === 'Unspecified') {
        filteredCars = sortCars(cars.filter((car) => !String(car.diecast_brand ?? '').trim()))
        renderCars()
      } else {
        filteredCars = sortCars(cars.filter((car) => String(car.diecast_brand ?? '').trim().toLowerCase() === brand.toLowerCase()))
        renderCars()
      }
      searchInput.focus()
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
  return path
}

function canonicalBrand(value) {
  const raw = value.trim()
  const preset = BRAND_PRESETS.find((brand) => brand.toLowerCase() === raw.toLowerCase())
  return preset ?? raw
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
  const specialChoice = $('special-status').value
  const customSpecialRaw = customSpecial.value.trim()
  const specialRaw = specialChoice === 'Other' ? customSpecialRaw : specialChoice
  return {
    user_id: session.user.id,
    diecast_brand: brandRaw ? canonicalBrand(brandRaw) : null,
    model: $('model').value.trim() || null,
    model_year: yearRaw || null,
    color: colorRaw || null,
    hotwheels_toy_number: $('hotwheels-toy-number').value.trim() || null,
    series_collection: $('series').value.trim() || null,
    general_number: $('general-number').value.trim() || null,
    series_collection_number: $('series-collection-number').value.trim() || null,
    quantity: qtyRaw === '' ? null : Math.max(1, Math.floor(Number(qtyRaw) || 1)),
    special_status: specialRaw || null,
    notes: $('notes').value.trim() || null,
    updated_at: new Date().toISOString(),
  }
}

function stepQuantity(delta) {
  const input = $('quantity')
  const parsed = Number(input.value)
  if (!Number.isFinite(parsed) || parsed < 1) {
    input.value = '1'
    return
  }
  input.value = String(Math.max(1, Math.floor(parsed) + delta))
}

function normalizeQuantityInput() {
  const input = $('quantity')
  if (input.value === '') return
  const parsed = Number(input.value)
  input.value = String(Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1)
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

$('logout-btn').addEventListener('click', async () => {
  if (!window.confirm('Are you sure you want to sign out?')) return
  await supabase.auth.signOut()
})
$('collection-nav').addEventListener('click', showCollection)
$('stats-nav').addEventListener('click', showStats)
$('add-button').addEventListener('click', () => showEditor())
$('quick-add-button').addEventListener('click', () => showEditor(null, { quick: true }))
$('empty-add-button').addEventListener('click', () => showEditor())
$('cancel-button').addEventListener('click', showCollection)
$('save-button').addEventListener('click', saveCar)
$('quantity-minus').addEventListener('click', () => stepQuantity(-1))
$('quantity-plus').addEventListener('click', () => stepQuantity(1))
$('quantity').addEventListener('change', normalizeQuantityInput)
deleteButton.addEventListener('click', deleteCar)
$('backup-button').addEventListener('click', exportBackup)
$('restore-button').addEventListener('click', () => $('restore-input').click())
$('restore-input').addEventListener('change', () => {
  const file = $('restore-input').files?.[0]
  if (file) restoreBackupFile(file)
})
$('refresh-button').addEventListener('click', loadCars)
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
$('special-status').addEventListener('change', syncSpecialCustomField)
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

supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession
  if (session) {
    showMain()
    setTimeout(() => {
      loadCars()
    }, 0)
  } else {
    cars = []
    applySearch()
    renderStats()
    showAuth()
  }
})

const { data: { session: initialSession } } = await supabase.auth.getSession()
session = initialSession
if (session) {
  showMain()
  await loadCars()
} else {
  showAuth()
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'))
}
