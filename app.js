import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0'

const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
const APP_URL = 'https://neoforte.github.io/diecast_collection/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const BRAND_PRESETS = ['Hot Wheels', 'Matchbox', 'M2', 'Cartuned', 'Maisto', 'Mini GT', 'Majorette', 'Other']
const SPECIAL_STATUSES = ['TH', 'STH', 'Chase', 'Rare', 'Limited', 'Other']

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
const duplicateWarningText = $('duplicate-warning-text')
const duplicateIncreaseBtn = $('duplicate-increase-btn')
const duplicateAnywayBtn = $('duplicate-anyway-btn')

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
  setYearValue(car?.model_year ?? '')
  $('scale').value = car?.scale ?? ''
  $('series').value = car?.series_collection ?? ''
  $('quantity').value = car?.quantity ?? ''
  $('package-status').value = car?.package_status ?? ''
  $('special-status').value = SPECIAL_STATUSES.includes(car?.special_status) ? car.special_status : ''
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

function backupFilename() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `AJs_Garage_Backup_${year}-${month}-${day}.json`
}

function exportBackup() {
  if (!session?.user) {
    alert('Your session expired. Sign out and sign back in, then try the backup again.')
    return
  }

  const button = $('backup-button')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Exporting…'

  try {
    const backup = {
      format: 'ajs-garage-backup',
      version: 2,
      exported_at: new Date().toISOString(),
      car_count: cars.length,
      note: 'Car data backup. photo_path values point to private photos stored in Supabase; image files are not embedded in this JSON file.',
      cars,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFilename()
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)

    button.textContent = 'Saved ✓'
    setTimeout(() => { button.textContent = originalText }, 1800)
  } catch (err) {
    console.error(err)
    button.textContent = 'Backup failed'
    alert(`Backup failed: ${err.message || err}`)
    setTimeout(() => { button.textContent = originalText }, 2200)
  } finally {
    button.disabled = false
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
    [car.diecast_brand, car.model, car.model_year, car.scale, car.series_collection, car.package_status, car.special_status, car.notes]
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
  return [car.diecast_brand, car.model_year, car.scale, car.package_status].filter(Boolean).join(' · ') || 'No details yet'
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
      card.classList.add('special-card', `special-${specialStatus.toLowerCase()}`)
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
    const row = document.createElement('div')
    row.className = 'stat-row'
    const name = document.createElement('div')
    name.className = 'stat-brand'
    name.textContent = entry.brand
    const count = document.createElement('div')
    count.className = 'stat-count'
    count.textContent = String(entry.count)
    row.append(name, count)
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
  return {
    user_id: session.user.id,
    diecast_brand: brandRaw ? canonicalBrand(brandRaw) : null,
    model: $('model').value.trim() || null,
    model_year: yearRaw || null,
    scale: $('scale').value.trim() || null,
    series_collection: $('series').value.trim() || null,
    quantity: qtyRaw === '' ? null : Number(qtyRaw),
    package_status: $('package-status').value || null,
    special_status: $('special-status').value || null,
    notes: $('notes').value.trim() || null,
    updated_at: new Date().toISOString(),
  }
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
deleteButton.addEventListener('click', deleteCar)
$('backup-button').addEventListener('click', exportBackup)
$('refresh-button').addEventListener('click', loadCars)
searchInput.addEventListener('input', applySearch)
sortSelect.addEventListener('change', () => {
  try { localStorage.setItem(SORT_STORAGE_KEY, sortSelect.value) } catch {}
  applySearch()
})
$('model').addEventListener('input', () => {
  duplicateDismissedModel = ''
  clearTimeout(duplicateCheckTimer)
  duplicateCheckTimer = setTimeout(checkDuplicateModel, 280)
})
$('model').addEventListener('blur', () => {
  clearTimeout(duplicateCheckTimer)
  checkDuplicateModel()
})
duplicateIncreaseBtn.addEventListener('click', increaseDuplicateQuantity)
duplicateAnywayBtn.addEventListener('click', () => {
  duplicateDismissedModel = normalizeModel($('model').value)
  hideDuplicateWarning()
})
$('diecast-brand').addEventListener('change', syncBrandCustomField)
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
