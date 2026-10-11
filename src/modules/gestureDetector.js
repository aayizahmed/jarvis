/**
 * GestureFlow — JARVIS Edition
 * Geometric Hand Gesture Classifier with 1€ Filter & Palm-Scale Invariance
 */

import { KEY_LANDMARKS, GESTURE_TYPES, GESTURE_CONFIG } from './constants.js';
import { OneEuroFilter3D, OneEuroFilter1D } from './oneEuroFilter.js';

export class GestureDetector {
  constructor() {
    this.isPinching = false;
    this.currentGesture = GESTURE_TYPES.NEUTRAL;

    // 1€ Filters for spatial positions
    // minCutoff=1.0 Hz (jitter reduction at rest), beta=0.008 (instant response at speed)
    this.cursorFilter = new OneEuroFilter3D(60, 1.0, 0.008, 1.0);
    this.pinchFilter = new OneEuroFilter1D(60, 1.5, 0.005, 1.0);

    // Filtered & Raw Cursor Coordinates in screen space [0, 1]
    this.smoothedCursor = { x: 0.5, y: 0.5, z: 0 };
    this.rawCursor = { x: 0.5, y: 0.5, z: 0 };

    // Tuning parameters
    this.smoothingWeight = GESTURE_CONFIG.DEFAULT_SMOOTHING;
    this.grabThresholdRatio = 0.28;   // Normalized by palm size
    this.releaseThresholdRatio = 0.44;// Hysteresis release ratio

    // State stabilization
    this.candidateGesture = GESTURE_TYPES.NEUTRAL;
    this.candidateCounter = 0;
    this.debounceFrames = 2;
    this.wasHandPresent = false;

    // Dropout Debouncing & Re-anchoring Buffer
    this.consecutiveMissingFrames = 0;
    this.maxDropoutRecoveryFrames = 12; // ~350-400ms buffer before declaring sustained tracking loss
    this.needsFilterReset = false;
    this.lastValidTimestamp = performance.now();
  }

  distance3D(p1, p2) {
    if (!p1 || !p2) return Infinity;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Process incoming landmarks with 1€ adaptive filtering and palm-scale normalization
   * 
   * @param {Array<Array<{x: number, y: number, z: number}>>} handsLandmarks 
   * @param {boolean} isMirrored 
   * @param {number} timestamp 
   * @returns {Object} Filtered gesture state snapshot
   */
  process(handsLandmarks = [], isMirrored = true, timestamp = performance.now()) {
    const handCount = handsLandmarks.length;

    // Handle temporary tracking dropouts vs sustained tracking loss
    if (handCount === 0) {
      this.consecutiveMissingFrames++;
      const isSustainedLoss = this.consecutiveMissingFrames >= this.maxDropoutRecoveryFrames;

      if (isSustainedLoss) {
        if (this.wasHandPresent) {
          this.wasHandPresent = false;
          this.needsFilterReset = true;
        }
        this.isPinching = false;
        this.currentGesture = GESTURE_TYPES.NEUTRAL;
      }

      return {
        gesture: isSustainedLoss ? GESTURE_TYPES.NEUTRAL : this.currentGesture,
        isPinching: isSustainedLoss ? false : this.isPinching,
        pinchDistance: Infinity,
        normalizedPinchDistance: Infinity,
        cursor: { ...this.smoothedCursor },
        rawCursor: { ...this.rawCursor },
        ndc: this.toNDC(this.smoothedCursor),
        handCount: 0,
        twoHandDistance: null,
        palmScale: 1.0,
        isStale: true,
        isTrackingLost: isSustainedLoss,
        consecutiveMissingFrames: this.consecutiveMissingFrames
      };
    }

    // Hand present: recover from dropout or re-anchor cleanly if sustained loss occurred
    if (this.needsFilterReset || !this.wasHandPresent) {
      this.cursorFilter.reset();
      this.pinchFilter.reset();
      this.needsFilterReset = false;
    }
    this.consecutiveMissingFrames = 0;
    this.wasHandPresent = true;
    this.lastValidTimestamp = timestamp;

    const primaryHand = handsLandmarks[0];
    const wrist = primaryHand[KEY_LANDMARKS.WRIST];
    const thumbTip = primaryHand[KEY_LANDMARKS.THUMB_TIP];
    const indexTip = primaryHand[KEY_LANDMARKS.INDEX_TIP];
    const middleMcp = primaryHand[KEY_LANDMARKS.MIDDLE_MCP];

    // 1. Palm Scale Metric (Distance from Wrist to Middle MCP)
    // Makes pinch and finger metrics independent of distance from webcam!
    const palmScale = Math.max(0.04, this.distance3D(wrist, middleMcp));

    // 2. Measure & Filter Pinch Distance
    const rawPinchDist = this.distance3D(thumbTip, indexTip);
    const filteredPinchDist = this.pinchFilter.filter(rawPinchDist, timestamp);
    const normalizedPinchDist = filteredPinchDist / palmScale;

    // Hysteresis Gating
    if (!this.isPinching && normalizedPinchDist <= this.grabThresholdRatio) {
      this.isPinching = true;
    } else if (this.isPinching && normalizedPinchDist >= this.releaseThresholdRatio) {
      this.isPinching = false;
    }

    // 3. Raw Cursor Position (Index Tip or Pinch Midpoint)
    let targetX = indexTip.x;
    let targetY = indexTip.y;
    let targetZ = indexTip.z || 0;

    if (this.isPinching) {
      targetX = (thumbTip.x + indexTip.x) * 0.5;
      targetY = (thumbTip.y + indexTip.y) * 0.5;
      targetZ = ((thumbTip.z || 0) + (indexTip.z || 0)) * 0.5;
    }

    // Mirror mapping: in mirrored preview, flip X
    const mappedX = isMirrored ? (1.0 - targetX) : targetX;
    const mappedY = targetY;

    this.rawCursor = { x: mappedX, y: mappedY, z: targetZ };

    // 4. Adaptive 1€ Filtering of 3D Cursor
    const filtered = this.cursorFilter.filter(mappedX, mappedY, targetZ, timestamp);
    this.smoothedCursor.x = Math.max(0, Math.min(1, filtered.x));
    this.smoothedCursor.y = Math.max(0, Math.min(1, filtered.y));
    this.smoothedCursor.z = filtered.z;

    // 5. Two-Hand Distance Detection
    let twoHandDistance = null;
    let isTwoHandScaling = false;

    if (handCount >= 2 && handsLandmarks[1]) {
      const secondHand = handsLandmarks[1];
      const secondIndexTip = secondHand[KEY_LANDMARKS.INDEX_TIP];
      if (secondIndexTip) {
        twoHandDistance = this.distance3D(indexTip, secondIndexTip);
        if (twoHandDistance > 0.08) {
          isTwoHandScaling = true;
        }
      }
    }

    // 6. Anatomical Finger Analysis (Scale Normalized)
    const fingerStates = this.analyzeFingerExtensions(primaryHand, wrist, palmScale);

    // 7. Composite Gesture Classification
    let detectedRaw = GESTURE_TYPES.NEUTRAL;
    if (this.isPinching) {
      detectedRaw = GESTURE_TYPES.PINCH;
    } else if (isTwoHandScaling && handCount >= 2) {
      detectedRaw = GESTURE_TYPES.TWO_HAND_SCALE;
    } else if (fingerStates.isFist) {
      detectedRaw = GESTURE_TYPES.FIST;
    } else if (fingerStates.isOpenPalm) {
      detectedRaw = GESTURE_TYPES.OPEN_PALM;
    } else if (fingerStates.isPointing) {
      detectedRaw = GESTURE_TYPES.POINTING;
    }

    // 8. Temporal Stabilization Debounce
    if (detectedRaw === this.candidateGesture) {
      this.candidateCounter++;
      if (this.candidateCounter >= this.debounceFrames) {
        this.currentGesture = detectedRaw;
      }
    } else {
      this.candidateGesture = detectedRaw;
      this.candidateCounter = 1;
      // Pinch triggers instantly for zero-latency grab
      if (detectedRaw === GESTURE_TYPES.PINCH) {
        this.currentGesture = GESTURE_TYPES.PINCH;
      }
    }

    return {
      gesture: this.currentGesture,
      isPinching: this.isPinching,
      pinchDistance: filteredPinchDist,
      normalizedPinchDistance: normalizedPinchDist,
      cursor: { ...this.smoothedCursor },
      rawCursor: { ...this.rawCursor },
      ndc: this.toNDC(this.smoothedCursor),
      handCount,
      twoHandDistance,
      fingerStates,
      palmScale,
      primaryHandLandmarks: primaryHand
    };
  }

  analyzeFingerExtensions(lm, wrist, palmScale) {
    const dThumb = this.distance3D(lm[4], wrist);
    const dThumbMcp = this.distance3D(lm[2], wrist);

    const dIndex = this.distance3D(lm[8], wrist);
    const dIndexPip = this.distance3D(lm[6], wrist);

    const dMiddle = this.distance3D(lm[12], wrist);
    const dMiddlePip = this.distance3D(lm[10], wrist);

    const dRing = this.distance3D(lm[16], wrist);
    const dRingPip = this.distance3D(lm[14], wrist);

    const dPinky = this.distance3D(lm[20], wrist);
    const dPinkyPip = this.distance3D(lm[18], wrist);

    const indexExtended = dIndex > dIndexPip * 1.15;
    const middleExtended = dMiddle > dMiddlePip * 1.15;
    const ringExtended = dRing > dRingPip * 1.15;
    const pinkyExtended = dPinky > dPinkyPip * 1.15;
    const thumbExtended = dThumb > dThumbMcp * 1.15;

    const indexCurled = dIndex <= dIndexPip * 1.05;
    const middleCurled = dMiddle <= dMiddlePip * 1.05;
    const ringCurled = dRing <= dRingPip * 1.05;
    const pinkyCurled = dPinky <= dPinkyPip * 1.05;

    const isPointing = indexExtended && (!middleExtended || dIndex > dMiddle * 1.10) && (!ringExtended || dIndex > dRing * 1.12) && (!pinkyExtended || dIndex > dPinky * 1.12);
    const isFist = indexCurled && middleCurled && ringCurled && pinkyCurled;
    const isOpenPalm = indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended;

    return {
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
      thumbExtended,
      isPointing,
      isFist,
      isOpenPalm
    };
  }

  toNDC(coords) {
    return {
      x: (coords.x * 2.0) - 1.0,
      y: -(coords.y * 2.0) + 1.0
    };
  }

  setSmoothing(sliderValue) {
    this.smoothingWeight = sliderValue;
    // Map slider (0.05 to 0.85) to 1€ Filter parameters:
    // Low slider (snappy): minCutoff = 2.2 Hz, beta = 0.012
    // High slider (smooth): minCutoff = 0.4 Hz, beta = 0.003
    const minCutoff = 2.2 - (sliderValue * 2.0);
    const beta = 0.012 - (sliderValue * 0.010);
    this.cursorFilter.setParameters(Math.max(0.2, minCutoff), Math.max(0.001, beta));
  }
}
