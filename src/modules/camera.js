/**
 * GestureFlow - Camera Module
 * Robust webcam lifecycle management, device enumeration, and error handling.
 */

export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.activeDeviceId = null;
    this.isStreaming = false;
    this.videoWidth = 0;
    this.videoHeight = 0;
  }

  /**
   * Enumerate available video input devices
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  async enumerateCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
      return [];
    }
  }

  /**
   * Request webcam permission and start video stream
   * @param {string|null} preferredDeviceId Optional deviceId to bind to
   * @returns {Promise<{width: number, height: number, deviceId: string}>}
   */
  async start(preferredDeviceId = null) {
    // If already streaming, stop first
    if (this.isStreaming) {
      this.stop();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error('Webcam API (navigator.mediaDevices.getUserMedia) is not supported in this browser or context.');
      error.name = 'UnsupportedBrowser';
      throw error;
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    };

    if (preferredDeviceId) {
      constraints.video.deviceId = { exact: preferredDeviceId };
      delete constraints.video.facingMode;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Initial camera constraints failed, attempting fallback to simple { video: true }...', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (fallbackErr) {
        throw this._formatCameraError(fallbackErr);
      }
    }

    this.stream = stream;
    this.video.srcObject = stream;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.autoplay = true;

    // Wait for video metadata to load and video to start playing
    await new Promise((resolve, reject) => {
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.videoWidth = this.video.videoWidth || 1280;
          this.videoHeight = this.video.videoHeight || 720;
          this.isStreaming = true;
          resolve();
        }
      }, 3500);

      const onReady = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);

        this.video.play()
          .catch((e) => console.warn('Video play notice:', e))
          .finally(() => {
            this.videoWidth = this.video.videoWidth || 1280;
            this.videoHeight = this.video.videoHeight || 720;
            this.isStreaming = true;
            resolve();
          });
      };

      const onError = (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(new Error('Video element error: ' + (e?.message || 'Unknown')));
      };

      if (this.video.readyState >= 1) {
        onReady();
      } else {
        this.video.addEventListener('loadedmetadata', onReady, { once: true });
        this.video.addEventListener('loadeddata', onReady, { once: true });
        this.video.addEventListener('canplay', onReady, { once: true });
        this.video.addEventListener('error', onError, { once: true });
      }
    });

    const activeTrack = stream.getVideoTracks()[0];
    const trackSettings = activeTrack ? activeTrack.getSettings() : {};
    this.activeDeviceId = trackSettings.deviceId || preferredDeviceId;

    return {
      width: this.videoWidth,
      height: this.videoHeight,
      deviceId: this.activeDeviceId
    };
  }

  /**
   * Stop webcam stream and release all hardware camera tracks
   */
  stop() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.isStreaming = false;
    this.videoWidth = 0;
    this.videoHeight = 0;
  }

  /**
   * Check if camera is currently playing
   */
  isActive() {
    return this.isStreaming && this.video && !this.video.paused && !this.video.ended && this.video.readyState >= 2;
  }

  /**
   * Translates native DOMExceptions into clear, actionable error messages
   */
  _formatCameraError(err) {
    const error = new Error();
    error.name = err.name || 'CameraError';

    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        error.message = 'Webcam permission was denied. Please allow camera access in your browser address bar and try again.';
        break;
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        error.message = 'No webcam device was found. Please check that a camera is connected and enabled.';
        break;
      case 'NotReadableError':
      case 'TrackStartError':
        error.message = 'The webcam is currently in use by another application (e.g. Zoom, Teams, or OBS). Please close other apps and try again.';
        break;
      case 'OverconstrainedError':
        error.message = 'The requested camera resolution or device constraints could not be satisfied by your hardware.';
        break;
      case 'SecurityError':
        error.message = 'Webcam access is blocked due to security policies. Ensure you are accessing via localhost or HTTPS.';
        break;
      default:
        error.message = err.message || 'An unknown error occurred while initializing the webcam.';
    }

    return error;
  }
}
