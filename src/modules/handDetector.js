/**
 * GestureFlow - Hand Detector Module
 * MediaPipe Tasks Vision HandLandmarker integration with resilient offline/CDN fallback,
 * GPU/CPU delegation, single-flight inference gating, and performance tracking.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const LOCAL_WASM_PATH = '/wasm';
const CDN_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';

const LOCAL_MODEL_PATH = '/models/hand_landmarker.task';
const CDN_MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

export class HandDetector {
  constructor() {
    this.handLandmarker = null;
    this.visionResolver = null;
    this.isReady = false;
    this.isInferring = false;
    this.activeDelegate = 'GPU';
    this.activeModelSource = 'local';
    this.activeWasmSource = 'local';
    this.numHands = 2;
    this.minDetectionConfidence = 0.5;
    this.minTrackingConfidence = 0.5;
    this.minPresenceConfidence = 0.5;

    // Concurrency & Timing Safeguards
    this.lastInferenceTimestamp = -1;
    this.lastInferenceDurationMs = 0;
    this.lastSuccessTimestamp = performance.now();
    this.consecutiveErrors = 0;
    this.skippedFrames = 0;
    this.totalInferences = 0;
  }

  /**
   * Initialize HandLandmarker with multi-tier fallback (Local -> CDN, GPU -> CPU)
   * @param {Function} onProgress Callback for initialization stages
   */
  async initialize(onProgress = () => {}) {
    if (this.isReady && this.handLandmarker) {
      return;
    }

    // Step 1: Initialize FilesetResolver for WASM runtime
    onProgress({ stage: 'wasm', message: 'Loading MediaPipe WASM runtime...' });
    try {
      this.visionResolver = await FilesetResolver.forVisionTasks(LOCAL_WASM_PATH);
      this.activeWasmSource = 'local';
    } catch (localWasmErr) {
      console.warn('Local WASM loading failed, falling back to jsDelivr CDN:', localWasmErr);
      onProgress({ stage: 'wasm_fallback', message: 'Local WASM unavailable. Loading from CDN...' });
      try {
        this.visionResolver = await FilesetResolver.forVisionTasks(CDN_WASM_PATH);
        this.activeWasmSource = 'cdn';
      } catch (cdnWasmErr) {
        const error = new Error('Failed to load MediaPipe WASM binaries from both local cache and CDN: ' + cdnWasmErr.message);
        error.name = 'WasmLoadError';
        throw error;
      }
    }

    // Step 2: Try creating HandLandmarker with GPU delegate and Local Model
    onProgress({ stage: 'model', message: 'Initializing Hand Landmarker model (Float16)...' });
    
    // Attempt matrix: [ [local, GPU], [local, CPU], [cdn, GPU], [cdn, CPU] ]
    const attempts = [
      { modelPath: LOCAL_MODEL_PATH, delegate: 'GPU', source: 'local' },
      { modelPath: LOCAL_MODEL_PATH, delegate: 'CPU', source: 'local' },
      { modelPath: CDN_MODEL_PATH, delegate: 'GPU', source: 'cdn' },
      { modelPath: CDN_MODEL_PATH, delegate: 'CPU', source: 'cdn' }
    ];

    let lastError = null;
    for (const attempt of attempts) {
      try {
        onProgress({
          stage: 'model_init',
          message: `Attempting ${attempt.source.toUpperCase()} model asset with ${attempt.delegate} backend...`
        });

        this.handLandmarker = await HandLandmarker.createFromOptions(this.visionResolver, {
          baseOptions: {
            modelAssetPath: attempt.modelPath,
            delegate: attempt.delegate
          },
          runningMode: 'VIDEO',
          numHands: this.numHands,
          minHandDetectionConfidence: this.minDetectionConfidence,
          minHandPresenceConfidence: this.minPresenceConfidence,
          minTrackingConfidence: this.minTrackingConfidence
        });

        this.activeDelegate = attempt.delegate;
        this.activeModelSource = attempt.source;
        this.isReady = true;
        this.consecutiveErrors = 0;
        
        onProgress({
          stage: 'ready',
          message: `Hand Landmarker active (${attempt.delegate} delegate, ${attempt.source} asset)`
        });
        return;
      } catch (err) {
        console.warn(`HandLandmarker attempt failed [${attempt.source}, ${attempt.delegate}]:`, err.message);
        lastError = err;
      }
    }

    const failureError = new Error('Failed to initialize MediaPipe Hand Landmarker: ' + (lastError?.message || 'Unknown initialization error'));
    failureError.name = 'ModelLoadError';
    throw failureError;
  }

  /**
   * Run inference on the current video frame.
   * Enforces single-flight concurrency and guarantees strictly monotonic timestamps.
   * 
   * @param {HTMLVideoElement} video 
   * @param {number} timestampMs Monotonic timestamp in ms
   * @returns {Object|null} Detection results or null if busy/invalid
   */
  detect(video, timestampMs) {
    if (!this.isReady || !this.handLandmarker) {
      return null;
    }

    // Single-flight concurrency: drop frame if previous inference is still active
    if (this.isInferring) {
      this.skippedFrames++;
      return null;
    }

    if (!video || video.readyState < 2 || video.paused || video.ended) {
      return null;
    }

    this.isInferring = true;
    const start = performance.now();

    // CRITICAL FIX: MediaPipe detectForVideo requires strictly increasing timestamps.
    // If video frame or clock jitters, clamp timestampMs to at least lastInferenceTimestamp + 1.0ms
    let monotonicTs = timestampMs;
    if (this.lastInferenceTimestamp >= 0 && monotonicTs <= this.lastInferenceTimestamp) {
      monotonicTs = this.lastInferenceTimestamp + 1.0;
    }
    this.lastInferenceTimestamp = monotonicTs;

    try {
      const results = this.handLandmarker.detectForVideo(video, monotonicTs);
      const inferenceDuration = performance.now() - start;

      this.lastInferenceDurationMs = inferenceDuration;
      this.lastSuccessTimestamp = performance.now();
      this.consecutiveErrors = 0;
      this.totalInferences++;

      return {
        landmarks: results.landmarks || [],
        worldLandmarks: results.worldLandmarks || [],
        handedness: results.handedness || [],
        inferenceTimeMs: inferenceDuration
      };
    } catch (err) {
      this.consecutiveErrors++;
      console.warn(`HandLandmarker inference error (#${this.consecutiveErrors}):`, err.message || err);
      return null;
    } finally {
      this.isInferring = false;
    }
  }

  /**
   * Get diagnostic snapshot for real-time telemetry panel
   */
  getDiagnostics() {
    const now = performance.now();
    return {
      isReady: this.isReady,
      isInferring: this.isInferring,
      delegate: this.activeDelegate,
      modelSource: this.activeModelSource,
      consecutiveErrors: this.consecutiveErrors,
      skippedFrames: this.skippedFrames,
      totalInferences: this.totalInferences,
      lastInferenceDurationMs: Number(this.lastInferenceDurationMs.toFixed(1)),
      timeSinceLastInferenceMs: Math.max(0, Math.round(now - this.lastSuccessTimestamp))
    };
  }

  /**
   * Reset error and performance counters
   */
  resetCounters() {
    this.consecutiveErrors = 0;
    this.skippedFrames = 0;
    this.lastInferenceTimestamp = -1;
  }

  /**
   * Update confidence thresholds
   */
  setConfidence(detection, tracking) {
    this.minDetectionConfidence = detection;
    this.minTrackingConfidence = tracking;
    if (this.handLandmarker) {
      this.handLandmarker.setOptions({
        minHandDetectionConfidence: detection,
        minTrackingConfidence: tracking
      });
    }
  }

  /**
   * Release resources safely
   */
  dispose() {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (e) {
        console.warn('Error closing handLandmarker:', e);
      }
      this.handLandmarker = null;
    }
    this.isReady = false;
    this.isInferring = false;
    this.lastInferenceTimestamp = -1;
  }
}

