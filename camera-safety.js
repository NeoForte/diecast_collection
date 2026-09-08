(() => {
  // Pocket 64 uses the normal iOS/file photo picker for collection photos.
  // Block legacy page-level video streaming so dormant camera code cannot
  // accidentally hold an iPhone camera session open. This does not affect
  // <input type="file" accept="image/*"> or iOS "Take Photo".
  try {
    const mediaDevices = navigator.mediaDevices
    if (mediaDevices && typeof mediaDevices.getUserMedia === 'function' && !mediaDevices.getUserMedia.__p64CameraGuard) {
      const blocked = async (constraints = {}) => {
        const asksForVideo = Boolean(constraints && typeof constraints === 'object' && constraints.video)
        if (asksForVideo) {
          throw new DOMException(
            'Pocket 64 live camera streaming is disabled; use the photo picker instead.',
            'NotAllowedError',
          )
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
    console.warn('Pocket 64 camera safety could not be installed', error)
  }

  function stopRetainedVideoStreams() {
    for (const video of document.querySelectorAll('video')) {
      const stream = video.srcObject
      if (stream && typeof stream.getTracks === 'function') {
        try { stream.getTracks().forEach((track) => track.stop()) } catch {}
        try { video.srcObject = null } catch {}
      }
    }
  }

  stopRetainedVideoStreams()
  window.addEventListener('pageshow', stopRetainedVideoStreams)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') stopRetainedVideoStreams()
  })

  document.documentElement.dataset.p64CameraSafety = '1'
})()
