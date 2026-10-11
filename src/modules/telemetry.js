/**
 * GestureFlow — JARVIS Edition
 * Low-Overhead Performance Telemetry & Hardware Profiler
 */

import { TRACKING_STATES } from './constants.js';

export class TelemetryManager {
  constructor() {
    this.state = TRACKING_STATES.STOPPED;
    this.handsDetected = 0;
    this.renderFps = 0;
    this.inferenceFps = 0;
    this.currentInferenceTime = 0;
    this.avgInferenceTime = 0;
    this.minInferenceTime = Infinity;
    this.maxInferenceTime = 0;
    this.totalFramesProcessed = 0;
    this.isPerformanceDegraded = false;

    // Rolling timestamps for real render FPS
    this.frameTimestamps = [];
    this.inferenceTimestamps = [];

    // Rolling latency buffer (30 samples)
    this.latencySamples = [];
    this.maxLatencySamples = 30;

    // Diagnostics references
    this.diagSources = null;

    // Cached snapshot to avoid garbage collection
    this._snapshot = {
      state: this.state,
      handsDetected: 0,
      renderFps: 0,
      inferenceFps: 0,
      inferenceTimeMs: '0.0',
      avgInferenceTimeMs: '0.0',
      minInferenceTimeMs: '0.0',
      maxInferenceTimeMs: '0.0',
      totalFrames: 0,
      isDegraded: false,
      // Diagnostics Breakdown
      cameraFrameAgeMs: 0,
      timeSinceLastInferenceMs: 0,
      consecutiveErrors: 0,
      skippedFrames: 0,
      isStreamAdvancing: true,
      isInferring: false,
      schedulerType: 'RVFC',
      trackingCondition: 'NORMAL'
    };
  }

  setDiagnosticSources(sources) {
    this.diagSources = sources;
  }

  setState(newState) {
    if (Object.values(TRACKING_STATES).includes(newState)) {
      this.state = newState;
      this._snapshot.state = newState;
    }
  }

  reset() {
    this.frameTimestamps.length = 0;
    this.inferenceTimestamps.length = 0;
    this.latencySamples.length = 0;
    this.renderFps = 0;
    this.inferenceFps = 0;
    this.currentInferenceTime = 0;
    this.avgInferenceTime = 0;
    this.minInferenceTime = Infinity;
    this.maxInferenceTime = 0;
    this.handsDetected = 0;
    this.totalFramesProcessed = 0;
    this.isPerformanceDegraded = false;
  }

  /**
   * Called on every requestAnimationFrame render tick
   */
  tickRender(timestamp) {
    this.frameTimestamps.push(timestamp);
    const oneSecAgo = timestamp - 1000;
    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < oneSecAgo) {
      this.frameTimestamps.shift();
    }
    this.renderFps = this.frameTimestamps.length;
  }

  /**
   * Called when a camera frame inference finishes
   */
  recordInference(inferenceDurationMs, handCount, timestamp = performance.now()) {
    this.totalFramesProcessed++;
    this.handsDetected = handCount;
    this.currentInferenceTime = inferenceDurationMs;

    this.inferenceTimestamps.push(timestamp);
    const oneSecAgo = timestamp - 1000;
    while (this.inferenceTimestamps.length > 0 && this.inferenceTimestamps[0] < oneSecAgo) {
      this.inferenceTimestamps.shift();
    }
    this.inferenceFps = this.inferenceTimestamps.length;

    if (inferenceDurationMs < this.minInferenceTime) this.minInferenceTime = inferenceDurationMs;
    if (inferenceDurationMs > this.maxInferenceTime) this.maxInferenceTime = inferenceDurationMs;

    this.latencySamples.push(inferenceDurationMs);
    if (this.latencySamples.length > this.maxLatencySamples) {
      this.latencySamples.shift();
    }

    const sum = this.latencySamples.reduce((acc, v) => acc + v, 0);
    this.avgInferenceTime = sum / this.latencySamples.length;

    // Check for performance degradation (e.g. inference taking >38ms or render dropping below 42 FPS)
    this.isPerformanceDegraded = this.avgInferenceTime > 38 || (this.renderFps > 0 && this.renderFps < 42);

    if (this.state !== TRACKING_STATES.STOPPED && this.state !== TRACKING_STATES.ERROR && this.state !== TRACKING_STATES.INITIALIZING) {
      this.state = handCount > 0 ? TRACKING_STATES.TRACKING : TRACKING_STATES.SEARCHING;
    }
  }

  getSnapshot() {
    this._snapshot.state = this.state;
    this._snapshot.handsDetected = this.handsDetected;
    this._snapshot.renderFps = this.renderFps;
    this._snapshot.inferenceFps = this.inferenceFps;
    this._snapshot.inferenceTimeMs = this.currentInferenceTime.toFixed(1);
    this._snapshot.avgInferenceTimeMs = this.avgInferenceTime.toFixed(1);
    this._snapshot.minInferenceTimeMs = this.minInferenceTime === Infinity ? '0.0' : this.minInferenceTime.toFixed(1);
    this._snapshot.maxInferenceTimeMs = this.maxInferenceTime.toFixed(1);
    this._snapshot.totalFrames = this.totalFramesProcessed;
    this._snapshot.isDegraded = this.isPerformanceDegraded;

    // Pull live metrics from diagnostic sources if registered
    if (this.diagSources) {
      const sched = this.diagSources.scheduler?.getDiagnostics() || {};
      const det = this.diagSources.detector?.getDiagnostics() || {};

      this._snapshot.cameraFrameAgeMs = sched.frameAgeMs || 0;
      this._snapshot.isStreamAdvancing = sched.isStreamAdvancing ?? true;
      this._snapshot.schedulerType = sched.schedulerType || 'RVFC';

      this._snapshot.timeSinceLastInferenceMs = det.timeSinceLastInferenceMs || 0;
      this._snapshot.consecutiveErrors = det.consecutiveErrors || 0;
      this._snapshot.skippedFrames = (sched.skippedFrames || 0) + (det.skippedFrames || 0);
      this._snapshot.isInferring = det.isInferring || false;

      // Classify discrete tracking condition (A through E)
      if (this.state === TRACKING_STATES.STOPPED || !sched.isStreamAdvancing && sched.frameAgeMs > 1000) {
        this._snapshot.trackingCondition = 'STANDBY: OPTICAL_SCANNER_OFFLINE';
      } else if (det.consecutiveErrors > 2) {
        this._snapshot.trackingCondition = 'ERROR (E): DETECTOR_EXCEPTION';
      } else if (!sched.isStreamAdvancing || sched.frameAgeMs > 450) {
        this._snapshot.trackingCondition = 'STALLED (A): CAMERA_FRAME_HALTED';
      } else if (det.timeSinceLastInferenceMs > 450 && sched.isStreamAdvancing) {
        this._snapshot.trackingCondition = 'DELAYED (B): INFERENCE_BACKLOGGED';
      } else if (this.handsDetected === 0) {
        this._snapshot.trackingCondition = 'SEARCHING (C): NO_HAND_DETECTED';
      } else {
        this._snapshot.trackingCondition = 'ACTIVE (D): FILTERED_TRACKING';
      }
    }

    return this._snapshot;
  }
}

