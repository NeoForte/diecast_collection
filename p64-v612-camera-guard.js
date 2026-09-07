(() => {
  const VERSION = '6.1.4'

  // Pocket 64 now uses the normal iOS/file photo picker for collection photos.
  // The older live-camera experiment is no longer part of the current UI, so
  // block page-level getUserMedia camera requests to prevent an unintended
  // persistent iOS camera session (green privacy dot) at app launch.
  // This does NOT affect <input type="file" accept="image/*"> or iOS "Take Photo".
  try {
    const mediaDevices = navigator.mediaDevices
    if (mediaDevices && typeof mediaDevices.getUserMedia === 'function' && !mediaDevices.getUserMedia.__p64CameraGuard) {
      const blocked = async (constraints = {}) => {
        const asksForVideo = Boolean(constraints && typeof constraints === 'object' && constraints.video)
        if (asksForVideo) {
          const error = new DOMException('Pocket 64 live camera streaming is disabled; use the photo picker instead.', 'NotAllowedError')
          throw error
        }
        return mediaDevices.__p64OriginalGetUserMedia.call(mediaDevices, constraints)
      }
      Object.defineProperty(mediaDevices, '__p64OriginalGetUserMedia', {
        value: mediaDevices.getUserMedia.bind(mediaDevices),
        configurable: true,
      })
      blocked.__p64CameraGuard = true
      mediaDevices.getUserMedia = blocked
    }
  } catch (error) {
    console.warn('Pocket 64 camera guard could not be installed', error)
  }

  // Defensive cleanup for any Pocket 64 video elements that may have retained a
  // MediaStream across an iOS PWA lifecycle transition.
  function stopRetainedVideoStreams() {
    for (const video of document.querySelectorAll('video')) {
      const stream = video.srcObject
      if (stream && typeof stream.getTracks === 'function') {
        try { stream.getTracks().forEach((track) => track.stop()) } catch {}
        try { video.srcObject = null } catch {}
      }
    }
  }

  // v6.1.4 form cleanup: retire redundant fields from the visible Add/Edit UI
  // without deleting their underlying values. Existing backup/database data stays
  // intact, and Set assignment remains the primary organization workflow.
  function retireRedundantEditorFields() {
    const series = document.getElementById('series')
    const seriesCategoryRow = series?.closest('.series-category-row') || series?.closest('.editor-row')
    if (seriesCategoryRow) {
      seriesCategoryRow.style.setProperty('display', 'none', 'important')
      seriesCategoryRow.setAttribute('aria-hidden', 'true')
    }

    const customCategoryLabel = document.getElementById('custom-category-label')
    if (customCategoryLabel) {
      customCategoryLabel.style.setProperty('display', 'none', 'important')
      customCategoryLabel.setAttribute('aria-hidden', 'true')
    }

    const seriesNumber = document.getElementById('series-collection-number')
    const seriesNumberLabel = seriesNumber?.closest('label')
    if (seriesNumberLabel) {
      seriesNumberLabel.style.setProperty('display', 'none', 'important')
      seriesNumberLabel.setAttribute('aria-hidden', 'true')
    }

    const generalNumber = document.getElementById('general-number')
    const generalNumberLabel = generalNumber?.closest('label')
    if (generalNumberLabel) generalNumberLabel.style.setProperty('grid-column', '1 / -1')
  }

  stopRetainedVideoStreams()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retireRedundantEditorFields, { once:true })
  } else {
    retireRedundantEditorFields()
  }
  window.addEventListener('pageshow', () => {
    stopRetainedVideoStreams()
    retireRedundantEditorFields()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      stopRetainedVideoStreams()
      retireRedundantEditorFields()
    }
  })

  document.documentElement.dataset.p64CameraGuardVersion = VERSION
})()
