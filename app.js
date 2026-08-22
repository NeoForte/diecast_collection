import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0'

const SUPABASE_URL = 'https://ftjayqjpgifdipmjloxx.supabase.co'
const APP_URL = 'https://neoforte.github.io/diecast_collection/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rHnWVHpdIsrSb_YI8yQ_gw_-OaQ3sum'
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const $ = (id) => document.getElementById(id)
const authView = $('auth-view')
const mainView = $('main-view')
const collectionScreen = $('collection-screen')
const editorScreen = $('editor-screen')
const carsGrid = $('cars-grid')
const emptyState = $('empty-state')
const carCount = $('car-count')
const searchInput = $('search-input')
const authMessage = $('auth-message')
const editorMessage = $('editor-message')
const deleteButton = $('delete-button')
const photoPreview = $('photo-preview')
const photoPlaceholder = $('photo-placeholder')
const photoInput = $('photo-input')

let session = null
let cars = []
let filteredCars = []
let editingCar = null
let selectedPhotoFile = null
let previewObjectUrl = null

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
  editorScreen.classList.remove('active')
  collectionScreen.classList.add('active')
}

function showEditor(car = null) {
  collectionScreen.classList.remove('active')
  editorScreen.classList.add('active')
  editingCar = car
  selectedPhotoFile = null
  editorMessage.textContent = ''
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = null
  $('editor-title').textContent = car ? 'Car Details' : 'Add Car'
  deleteButton.classList.toggle('hidden', !car)
  fillEditor(car)
}

function fillEditor(car) {
  $('diecast-brand').value = car?.diecast_brand ?? ''
  $('make').value = car?.make ?? ''
  $('model').value = car?.model ?? ''
  $('model-year').value = car?.model_year ?? ''
  $('scale').value = car?.scale ?? ''
  $('series').value = car?.series_collection ?? ''
  $('quantity').value = car?.quantity ?? ''
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }
  cars = data ?? []
  applySearch()
}


function backupFilename() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `Diecast_Backup_${year}-${month}-${day}.json`
}

async function exportBackup() {
  if (!session?.user) return
  const button = $('backup-button')
  const originalText = button.textContent
  button.disabled = true
  button.textContent = 'Exporting…'

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const backup = {
      format: 'diecast-collection-backup',
      version: 1,
      exported_at: new Date().toISOString(),
      car_count: data?.length ?? 0,
      note: 'Car data backup. photo_path values point to private photos stored in Supabase; image files are not embedded in this JSON file.',
      cars: data ?? [],
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFilename()
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    button.textContent = 'Saved ✓'
    setTimeout(() => { button.textContent = originalText }, 1800)
  } catch (err) {
    console.error(err)
    button.textContent = 'Backup failed'
    setTimeout(() => { button.textContent = originalText }, 2200)
  } finally {
    button.disabled = false
  }
}

function applySearch() {
  const q = searchInput.value.trim().toLowerCase()
  filteredCars = !q ? cars : cars.filter((car) =>
    [car.diecast_brand, car.make, car.model, car.model_year, car.scale, car.series_collection, car.notes]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  )
  renderCars()
}

function displayTitle(car) {
  const primary = [car.make, car.model].filter(Boolean).join(' ')
  return primary || car.diecast_brand || 'Untitled Car'
}

function displaySubtitle(car) {
  return [car.diecast_brand, car.model_year, car.scale].filter(Boolean).join(' · ') || 'No details yet'
}

function renderCars() {
  carsGrid.replaceChildren()
  carCount.textContent = `${cars.length} ${cars.length === 1 ? 'car' : 'cars'}`
  emptyState.classList.toggle('hidden', cars.length !== 0)

  for (const car of filteredCars) {
    const card = document.createElement('article')
    card.className = 'car-card'
    card.tabIndex = 0
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
    const open = () => showEditor(car)
    card.addEventListener('click', open)
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open() })
    carsGrid.append(card)
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

function editorPayload() {
  const qtyRaw = $('quantity').value.trim()
  return {
    user_id: session.user.id,
    diecast_brand: $('diecast-brand').value.trim() || null,
    make: $('make').value.trim() || null,
    model: $('model').value.trim() || null,
    model_year: $('model-year').value.trim() || null,
    scale: $('scale').value.trim() || null,
    series_collection: $('series').value.trim() || null,
    quantity: qtyRaw === '' ? null : Number(qtyRaw),
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
  const originalSaveText = saveButton.textContent
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
      const { error } = await supabase.from('cars').update({ photo_path: path }).eq('id', car.id)
      if (error) throw error
    }

    await loadCars()
    showCollection()
  } catch (err) {
    console.error(err)
    editorMessage.textContent = err.message || 'Could not save car.'
  } finally {
    const saveButton = $('save-button')
    saveButton.disabled = false
    saveButton.textContent = 'Save'
  }
}

async function deleteCar() {
  if (!editingCar || !confirm('Delete this car from your collection?')) return
  editorMessage.textContent = 'Deleting…'
  try {
    if (editingCar.photo_path) {
      await supabase.storage.from('car-photos').remove([editingCar.photo_path])
    }
    const { error } = await supabase.from('cars').delete().eq('id', editingCar.id)
    if (error) throw error
    await loadCars()
    showCollection()
  } catch (err) {
    console.error(err)
    editorMessage.textContent = err.message || 'Could not delete car.'
  }
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

$('logout-btn').addEventListener('click', () => supabase.auth.signOut())
$('add-button').addEventListener('click', () => showEditor())
$('empty-add-button').addEventListener('click', () => showEditor())
$('cancel-button').addEventListener('click', showCollection)
$('save-button').addEventListener('click', saveCar)
deleteButton.addEventListener('click', deleteCar)
$('backup-button').addEventListener('click', exportBackup)
$('refresh-button').addEventListener('click', loadCars)
searchInput.addEventListener('input', applySearch)
photoInput.addEventListener('change', () => {
  selectedPhotoFile = photoInput.files?.[0] ?? null
  if (!selectedPhotoFile) return
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
  previewObjectUrl = URL.createObjectURL(selectedPhotoFile)
  setPhotoPreview(previewObjectUrl)
})

supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession
  if (session) {
    showMain()
    // Do not await Supabase API calls inside onAuthStateChange.
    // Supabase documents a deadlock where later client calls can otherwise hang.
    setTimeout(() => {
      loadCars()
    }, 0)
  } else {
    cars = []
    renderCars()
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
