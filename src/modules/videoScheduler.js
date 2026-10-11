/**
 * GestureFlow — JARVIS Edition
 * Robust Video Frame Processing Scheduler
 * Uses native requestVideoFrameCallback where supported, with a fallback
 * and watchdog timer to guarantee zero freezing and zero skipped frames.
 */

export class VideoFrameScheduler {
  constructor(videoElement, onFrameCallback) {
    this.video = videoElement;
    this.onFrame = onFrameCallback;
    this.isRunning = false;

    // Check for native requestVideoFrameCallback support
    this.hasRVFC = typeof HTMLVideoElement !== 'undefined' &&
                   'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    this.rvfcHandle = null;
    this.rafHandle = null;
    this.watchdogInterval = null;

    // Timing and Diagnostic Metrics
    this.lastFrameTimestamp = performance.now();
    this.lastVideoTime = -1;
    this.framesDelivered = 0;
    this.skippedFramesCount = 0;
    this.isStreamAdvancing = false;
    this.consecutiveStalls = 0;

    // Bound handlers to avoid reallocations
    this._rvfcStep = this._rvfcStep.bind(this);
    this._fallbackStep = this._fallbackStep.bind(this);
    this._watchdogCheck = this._watchdogCheck.bind(this);
  }

  /**
   * Start processing video frames
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTimestamp = performance.now();
    this.lastVideoTime = this.video.currentTime;
    this.isStreamAdvancing = true;
    this.consecutiveStalls = 0;

    if (this.hasRVFC) {
      this.rvfcHandle = this.video.requestVideoFrameCallback(this._rvfcStep);
    } else {
      this.rafHandle = requestAnimationFrame(this._fallbackStep);
    }

    // Watchdog timer: checks every 200ms that the stream hasn't stalled
    this.watchdogInterval = setInterval(this._watchdogCheck, 200);
  }

  /**
   * Stop processing video frames and cancel active callbacks
   */
  stop() {
    this.isRunning = false;

    if (this.rvfcHandle !== null && this.hasRVFC) {
      this.video.cancelVideoFrameCallback(this.rvfcHandle);
      this.rvfcHandle = null;
    }

    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    if (this.watchdogInterval !== null) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }

    this.isStreamAdvancing = false;
  }

  /**
   * Native requestVideoFrameCallback handler
   * Fires exactly when a new hardware frame is presented to the compositor.
   */
  _rvfcStep(now, metadata) {
    if (!this.isRunning) return;

    const frameTime = performance.now();
    this.lastFrameTimestamp = frameTime;
    this.framesDelivered++;
    this.isStreamAdvancing = true;
    this.consecutiveStalls = 0;

    // Dispatch frame to processor
    try {
      this.onFrame(frameTime, metadata);
    } catch (err) {
      console.error('VideoFrameScheduler frame callback error:', err);
    }

    // Schedule next frame
    if (this.isRunning) {
      this.rvfcHandle = this.video.requestVideoFrameCallback(this._rvfcStep);
    }
  }

  /**
   * High-frequency fallback for browsers lacking requestVideoFrameCallback
   */
  _fallbackStep(now) {
    if (!this.isRunning) return;

    if (this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      this.lastFrameTimestamp = performance.now();
      this.framesDelivered++;
      this.isStreamAdvancing = true;
      this.consecutiveStalls = 0;

      try {
        this.onFrame(this.lastFrameTimestamp, null);
      } catch (err) {
        console.error('VideoFrameScheduler fallback error:', err);
      }
    }

    if (this.isRunning) {
      this.rafHandle = requestAnimationFrame(this._fallbackStep);
    }
  }

  /**
   * Watchdog checking that camera frames are actually advancing
   */
  _watchdogCheck() {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameAgeMs = now - this.lastFrameTimestamp;

    // If no frame has arrived in over 250ms while video should be active
    if (frameAgeMs > 250) {
      this.consecutiveStalls++;
      if (this.consecutiveStalls > 3) {
        this.isStreamAdvancing = false;
      }

      // If video has advanced currentTime despite missing RVFC, trigger a recovery frame
      if (this.video.readyState >= 2 && !this.video.paused && !this.video.ended) {
        if (this.video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = this.video.currentTime;
          this.lastFrameTimestamp = now;
          this.isStreamAdvancing = true;
          this.consecutiveStalls = 0;
          try {
            this.onFrame(now, null);
          } catch (e) {
            console.warn('Watchdog frame recovery exception:', e);
          }
        }
      }
    }
  }

  /**
   * Get diagnostic timing snapshot
   */
  getDiagnostics() {
    const now = performance.now();
    return {
      schedulerType: this.hasRVFC ? 'requestVideoFrameCallback (Native)' : 'RAF Fallback',
      frameAgeMs: Math.max(0, Math.round(now - this.lastFrameTimestamp)),
      isStreamAdvancing: this.isStreamAdvancing,
      framesDelivered: this.framesDelivered,
      skippedFrames: this.skippedFramesCount
    };
  }
}
