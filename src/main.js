/**
 * GestureFlow — JARVIS Edition
 * Master Application Coordinator & Performance Decoupler
 * Separates ML inference from 60+ FPS Three.js rendering via VideoFrameScheduler,
 * batches DOM updates, and provides real-time diagnostic telemetry.
 */

import { CameraManager } from './modules/camera.js';
import { HandDetector } from './modules/handDetector.js';
import { LandmarkRenderer } from './modules/landmarkRenderer.js';
import { TelemetryManager } from './modules/telemetry.js';
import { SceneManager } from './modules/sceneManager.js';
import { GestureDetector } from './modules/gestureDetector.js';
import { InteractionController } from './modules/interactionController.js';
import { VideoFrameScheduler } from './modules/videoScheduler.js';
import { INTERACTION_STATES } from './modules/gestureStateMachine.js';
import {
  TRACKING_STATES,
  GESTURE_TYPES,
  DEFAULT_SETTINGS
} from './modules/constants.js';

class JarvisGestureStudio {
  constructor() {
    // DOM Element Cache
    this.dom = {
      // Header & Tactical Core
      globalBeacon: document.getElementById('globalBeacon'),
      toggleGestureBtn: document.getElementById('toggleGestureBtn'),
      gestureBtnText: document.getElementById('gestureBtnText'),
      resetSceneBtn: document.getElementById('resetSceneBtn'),
      mirrorToggleBtn: document.getElementById('mirrorToggleBtn'),
      mirrorBtnLabel: document.getElementById('mirrorBtnLabel'),
      fullscreenBtn: document.getElementById('fullscreenBtn'),
      toggleDiagBtn: document.getElementById('toggleDiagBtn'),
      diagBtnText: document.getElementById('diagBtnText'),
      toggleCameraBtn: document.getElementById('toggleCameraBtn'),
      cameraBtnText: document.getElementById('cameraBtnText'),

      // Diagnostics Panel HUD
      diagnosticsPanel: document.getElementById('diagnosticsPanel'),
      closeDiagBtn: document.getElementById('closeDiagBtn'),
      diagRecoverBtn: document.getElementById('diagRecoverBtn'),
      diagSchedulerType: document.getElementById('diagSchedulerType'),
      diagStreamAdvancing: document.getElementById('diagStreamAdvancing'),
      diagFrameAge: document.getElementById('diagFrameAge'),
      diagTimeSinceInf: document.getElementById('diagTimeSinceInf'),
      diagInfDuration: document.getElementById('diagInfDuration'),
      diagInferring: document.getElementById('diagInferring'),
      diagConsecErrors: document.getElementById('diagConsecErrors'),
      diagSkippedFrames: document.getElementById('diagSkippedFrames'),
      diagCondition: document.getElementById('diagCondition'),
      diagRenderFps: document.getElementById('diagRenderFps'),
      diagDelegate: document.getElementById('diagDelegate'),

      // Target Chips
      chipCube: document.getElementById('chipCube'),
      chipSphere: document.getElementById('chipSphere'),
      chipTorus: document.getElementById('chipTorus'),

      // 3D Viewport & HUD Elements
      threeCard: document.getElementById('threeCard'),
      threeContainer: document.getElementById('threeCanvasContainer'),
      screenVirtualCursor: document.getElementById('screenVirtualCursor'),
      cursorLabel: document.getElementById('cursorLabel'),

      hudStatePill: document.getElementById('hudStatePill'),
      hudObjectVal: document.getElementById('hudObjectVal'),
      hudTargetX: document.getElementById('hudTargetX'),
      hudTargetY: document.getElementById('hudTargetY'),
      hudTargetZ: document.getElementById('hudTargetZ'),
      hudGestureBadge: document.getElementById('hudGestureBadge'),
      hudGestureIcon: document.getElementById('hudGestureIcon'),
      hudGestureVal: document.getElementById('hudGestureVal'),

      // Telemetry Top Right
      perfDegradedTag: document.getElementById('perfDegradedTag'),
      cardRenderFps: document.getElementById('cardRenderFps'),
      cardLatency: document.getElementById('cardLatency'),
      cardHandsCount: document.getElementById('cardHandsCount'),

      // Holographic PiP Card
      pipWebcamCard: document.getElementById('pipWebcamCard'),
      pipToggleBtn: document.getElementById('pipToggleBtn'),
      pipStatusDot: document.getElementById('pipStatusDot'),
      cameraStage: document.getElementById('cameraStage'),
      video: document.getElementById('webcam'),
      canvas: document.getElementById('overlayCanvas'),
      idleOverlay: document.getElementById('idleOverlay'),
      splashStartBtn: document.getElementById('splashStartBtn'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingMessage: document.getElementById('loadingMessage'),
      errorOverlay: document.getElementById('errorOverlay'),
      errorMessage: document.getElementById('errorMessage'),
      errorRetryBtn: document.getElementById('errorRetryBtn'),
      pipInferenceRate: document.getElementById('pipInferenceRate'),

      // Tactical Tuning Dock
      smoothingSlider: document.getElementById('smoothingSlider'),
      smoothingVal: document.getElementById('smoothingVal'),
      rotationSlider: document.getElementById('rotationSlider'),
      rotationVal: document.getElementById('rotationVal'),
      toggleGestureControl: document.getElementById('toggleGestureControl'),
      toggleOrbitControls: document.getElementById('toggleOrbitControls'),
      togglePipWebcam: document.getElementById('togglePipWebcam')
    };

    // Specialized Engine Modules
    this.camera = new CameraManager(this.dom.video);
    this.detector = new HandDetector();
    this.renderer = new LandmarkRenderer(this.dom.canvas);
    this.telemetry = new TelemetryManager();
    this.sceneManager = new SceneManager(this.dom.threeContainer);
    this.gestureDetector = new GestureDetector();
    this.interactionController = new InteractionController(this.sceneManager);

    // Robust Video Frame Processing Scheduler (Decoupled from Three.js RAF)
    this.videoScheduler = new VideoFrameScheduler(this.dom.video, (frameTime, metadata) => {
      this._onVideoFrame(frameTime, metadata);
    });

    // Connect Telemetry Diagnostics Engine
    this.telemetry.setDiagnosticSources({
      scheduler: this.videoScheduler,
      detector: this.detector,
      gestureDetector: this.gestureDetector
    });

    // Lifecycle & Timing State
    this.isRunning = false;
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.showDiagnostics = false;
    this.animationFrameId = null;
    this.lastRenderTime = performance.now();
    this.settings = { ...DEFAULT_SETTINGS };

    // Decoupled Frame State
    this.latestGestureFrame = null;
    this.latestInteractionStatus = null;
    this.lastDomUpdateTime = 0;
    this.domUpdateIntervalMs = 80; // Throttled 12 Hz DOM telemetry updates

    this._init();
  }

  _init() {
    this._bindEvents();
    this._setupResizeHandlers();
    this._syncSettings();

    // Set initial default target to sphere
    this.sceneManager.setSelectedObject(this.sceneManager.sphere, false);
    this._updateTargetChips(this.sceneManager.sphere);

    // Start 60+ FPS Three.js rendering loop immediately (completely decoupled from webcam)
    this._startRenderLoop();
  }

  _bindEvents() {
    // Camera start/stop
    this.dom.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
    this.dom.splashStartBtn.addEventListener('click', () => this.toggleCamera());

    // Error retry
    this.dom.errorRetryBtn.addEventListener('click', () => {
      this._hideOverlay(this.dom.errorOverlay);
      this.startCamera();
    });

    // Diagnostics toggle & manual recovery
    if (this.dom.toggleDiagBtn) {
      this.dom.toggleDiagBtn.addEventListener('click', () => this.toggleDiagnostics());
    }
    if (this.dom.closeDiagBtn) {
      this.dom.closeDiagBtn.addEventListener('click', () => this.toggleDiagnostics(false));
    }
    if (this.dom.diagRecoverBtn) {
      this.dom.diagRecoverBtn.addEventListener('click', () => this.recoverPipeline());
    }

    // Reset 3D Stage
    this.dom.resetSceneBtn.addEventListener('click', () => {
      this.sceneManager.resetScene();
      this.interactionController.fsm.forceReset();
      this._updateTargetChips(this.sceneManager.sphere);
    });

    // Direct Target Selectors
    this.dom.chipCube.addEventListener('click', () => {
      this.sceneManager.setSelectedObject(this.sceneManager.cube, false);
      this._updateTargetChips(this.sceneManager.cube);
    });
    this.dom.chipSphere.addEventListener('click', () => {
      this.sceneManager.setSelectedObject(this.sceneManager.sphere, false);
      this._updateTargetChips(this.sceneManager.sphere);
    });
    this.dom.chipTorus.addEventListener('click', () => {
      this.sceneManager.setSelectedObject(this.sceneManager.torus, false);
      this._updateTargetChips(this.sceneManager.torus);
    });

    // Gesture Toggle
    this.dom.toggleGestureBtn.addEventListener('click', () => {
      const isEnabled = !this.settings.gestureControlEnabled;
      this.settings.gestureControlEnabled = isEnabled;
      this.interactionController.gestureControlEnabled = isEnabled;
      this.dom.toggleGestureControl.checked = isEnabled;
      this.dom.toggleGestureBtn.classList.toggle('active', isEnabled);
      this.dom.gestureBtnText.textContent = `GESTURES: ${isEnabled ? 'ON' : 'OFF'}`;
    });

    // Mirror Toggle
    this.dom.mirrorToggleBtn.addEventListener('click', () => this.toggleMirror());

    // Fullscreen Toggle
    this.dom.fullscreenBtn.addEventListener('click', () => {
      this.sceneManager.toggleFullscreen(document.documentElement);
    });

    // PiP minimize
    this.dom.pipToggleBtn.addEventListener('click', () => {
      const isMin = this.dom.pipWebcamCard.classList.toggle('minimized');
      this.dom.pipToggleBtn.textContent = isMin ? '+' : '−';
    });

    // Sliders
    this.dom.smoothingSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.settings.smoothing = val;
      this.gestureDetector.setSmoothing(val);
      this.dom.smoothingVal.textContent = val.toFixed(2);
    });

    this.dom.rotationSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.settings.rotationSensitivity = val;
      this.interactionController.setRotationSensitivity(val);
      this.dom.rotationVal.textContent = `${val.toFixed(1)}x`;
    });

    // Checkbox Toggles
    this.dom.toggleGestureControl.addEventListener('change', (e) => {
      const isEnabled = e.target.checked;
      this.settings.gestureControlEnabled = isEnabled;
      this.interactionController.gestureControlEnabled = isEnabled;
      this.dom.toggleGestureBtn.classList.toggle('active', isEnabled);
      this.dom.gestureBtnText.textContent = `GESTURES: ${isEnabled ? 'ON' : 'OFF'}`;
    });

    this.dom.toggleOrbitControls.addEventListener('change', (e) => {
      this.settings.orbitControlsEnabled = e.target.checked;
      if (this.sceneManager.controls) {
        this.sceneManager.controls.enabled = e.target.checked;
      }
    });

    this.dom.togglePipWebcam.addEventListener('change', (e) => {
      this.dom.pipWebcamCard.style.display = e.target.checked ? 'flex' : 'none';
    });
  }

  _setupResizeHandlers() {
    const onResize = () => {
      this.sceneManager.resize();
      const rect = this.dom.cameraStage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.renderer.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(this.dom.threeCard);
    observer.observe(this.dom.cameraStage);
    onResize();
  }

  _syncSettings() {
    this.renderer.options.mirrored = this.settings.mirrorPreview;
    this.gestureDetector.setSmoothing(this.settings.smoothing);
    this.interactionController.setRotationSensitivity(this.settings.rotationSensitivity);
    this.interactionController.gestureControlEnabled = this.settings.gestureControlEnabled;
  }

  toggleDiagnostics(forceState = null) {
    this.showDiagnostics = forceState !== null ? forceState : !this.showDiagnostics;
    if (this.dom.diagnosticsPanel) {
      this.dom.diagnosticsPanel.classList.toggle('hidden', !this.showDiagnostics);
    }
    if (this.dom.toggleDiagBtn) {
      this.dom.toggleDiagBtn.classList.toggle('active', this.showDiagnostics);
    }
  }

  async toggleCamera() {
    if (this.isRunning) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    this._hideOverlay(this.dom.idleOverlay);
    this._hideOverlay(this.dom.errorOverlay);
    this._showOverlay(this.dom.loadingOverlay);
    this._updateStatusBeacon(TRACKING_STATES.INITIALIZING);

    try {
      // 1. Initialize MediaPipe HandLandmarker (single instance, GPU/local preferred)
      await this.detector.initialize(({ message }) => {
        this.dom.loadingMessage.textContent = message.toUpperCase();
      });

      // 2. Start webcam stream
      this.dom.loadingMessage.textContent = 'CONNECTING OPTICAL SCANNER...';
      await this.camera.start();

      // 3. Resize canvas overlay
      const rect = this.dom.cameraStage.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);

      // 4. Activate running state & start hardware frame scheduler
      this._hideOverlay(this.dom.loadingOverlay);
      this.isRunning = true;
      this.telemetry.reset();
      this.detector.resetCounters();
      this.videoScheduler.start();

      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
      this._updateButtonToStopMode();

      this.dom.pipStatusDot.classList.add('active');

    } catch (err) {
      console.error('Camera or model start error:', err);
      this.stopCamera();
      this._showError(err.message);
    }
  }

  stopCamera() {
    this.isRunning = false;
    this.videoScheduler.stop();
    this.camera.stop();
    this.renderer.clear();
    this.telemetry.reset();

    // Release held objects safely
    this.interactionController.fsm.forceReset();

    // Hide virtual cursors
    this.dom.screenVirtualCursor.classList.add('hidden');
    this.sceneManager.updateCursor(null);
    this.sceneManager.setHoveredObject(null);

    // Reset UI indicators
    this._updateStatusBeacon(TRACKING_STATES.STOPPED);
    this._updateButtonToStartMode();
    this._hideOverlay(this.dom.loadingOverlay);
    this._showOverlay(this.dom.idleOverlay);

    this.dom.pipStatusDot.classList.remove('active');
    this.dom.cardHandsCount.textContent = '0 HANDS';
    this.dom.cardLatency.textContent = '-- ms';
    this.dom.hudStatePill.textContent = 'STANDBY';
    this.dom.hudGestureVal.textContent = 'STANDBY';
  }

  /**
   * Controlled Optical Pipeline Recovery:
   * Safely disengages old frame schedulers, camera tracks, and detector error counters,
   * then re-initializes without creating duplicate streams or leaks.
   */
  async recoverPipeline() {
    if (this.isRecovering) return;
    this.isRecovering = true;
    console.warn('Initiating controlled optical pipeline recovery...');
    this._showOverlay(this.dom.loadingOverlay);
    this.dom.loadingMessage.textContent = 'RECOVERING OPTICAL PIPELINE...';

    try {
      // 1. Cleanly stop frame scheduler and release hardware camera tracks
      this.videoScheduler.stop();
      this.camera.stop();

      // 2. Reset tracking and detector error counters
      this.detector.resetCounters();
      this.gestureDetector.needsFilterReset = true;
      this.interactionController.fsm.forceReset();

      // Brief backoff delay to allow driver to settle
      await new Promise(r => setTimeout(r, 200));

      // 3. Re-engage camera stream
      await this.camera.start();

      // 4. Resize canvas overlay
      const rect = this.dom.cameraStage.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);

      // 5. Restart scheduler
      this.videoScheduler.start();
      this.isRunning = true;
      this._hideOverlay(this.dom.loadingOverlay);
      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
      console.log('Optical pipeline recovery completed successfully.');
    } catch (err) {
      console.error('Optical pipeline recovery failed:', err);
      this.stopCamera();
      this._showError('RECOVERY FAILED: ' + err.message);
    } finally {
      this.isRecovering = false;
    }
  }

  toggleMirror() {
    this.settings.mirrorPreview = !this.settings.mirrorPreview;
    this.renderer.options.mirrored = this.settings.mirrorPreview;
    this.dom.cameraStage.classList.toggle('mirrored', this.settings.mirrorPreview);
    this.dom.mirrorToggleBtn.classList.toggle('active', this.settings.mirrorPreview);
    this.dom.mirrorBtnLabel.textContent = `MIRROR: ${this.settings.mirrorPreview ? 'ON' : 'OFF'}`;
  }

  /**
   * Primary Render Loop (Runs at full monitor refresh 60/120 Hz)
   * Completely decoupled from camera inference to prevent main-thread stuttering!
   */
  _startRenderLoop() {
    const loop = (timestamp) => {
      const dt = Math.max(0.001, Math.min(0.05, (timestamp - this.lastRenderTime) / 1000.0));
      this.lastRenderTime = timestamp;

      // 1. Tick render telemetry
      this.telemetry.tickRender(timestamp);

      // 2. Continuous 3D mesh interpolation tick (60/120 FPS buttery smooth)
      this.interactionController.tickRender(dt);

      // 3. Render Three.js 3D Scene
      this.sceneManager.render();

      // 4. Update on-screen virtual cursor position on compositor
      if (this.latestGestureFrame && this.latestGestureFrame.handCount > 0 && !this.latestGestureFrame.isTrackingLost) {
        this._updateScreenCursor(this.latestGestureFrame.cursor);
      } else {
        this.dom.screenVirtualCursor.classList.add('hidden');
      }

      // 5. Throttled DOM updates (12 Hz) to eliminate layout recalculations
      if (timestamp - this.lastDomUpdateTime > this.domUpdateIntervalMs) {
        this.lastDomUpdateTime = timestamp;
        this._updateThrottledDOM();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Decoupled Hand Landmark Inference Tick (invoked by VideoFrameScheduler on new hardware video frame)
   */
  _onVideoFrame(frameTime, metadata) {
    if (!this.isRunning || this.detector.isInferring) return;

    // Execute MediaPipe task with guaranteed monotonic timestamp
    const result = this.detector.detect(this.dom.video, frameTime);
    if (result) {
      const handCount = result.landmarks.length;

      // Record telemetry
      this.telemetry.recordInference(result.inferenceTimeMs, handCount, frameTime);

      // Render tactical HUD skeleton on PiP canvas
      this.renderer.render(result.landmarks, result.handedness);

      // 1€ Filtered Gesture Classification (debounced dropout recovery)
      const gestureFrame = this.gestureDetector.process(
        result.landmarks,
        this.settings.mirrorPreview,
        frameTime
      );
      this.latestGestureFrame = gestureFrame;

      // Update 3D spatial interaction targets (decoupled from render loop)
      const interactionStatus = this.interactionController.updateInference(gestureFrame, frameTime);
      this.latestInteractionStatus = interactionStatus;
    }
  }

  /**
   * Update 2D Screen Reticle directly via CSS transform (GPU compositor)
   */
  _updateScreenCursor(cursorCoords) {
    const el = this.dom.screenVirtualCursor;
    if (!cursorCoords) {
      el.classList.add('hidden');
      return;
    }

    el.classList.remove('hidden');
    const rect = this.dom.threeCard.getBoundingClientRect();
    const px = cursorCoords.x * rect.width;
    const py = cursorCoords.y * rect.height;

    el.style.transform = `translate3d(${px}px, ${py}px, 0)`;

    const state = this.interactionController.fsm.currentState;
    el.classList.toggle('grabbing', state === INTERACTION_STATES.DRAGGING);
    el.classList.toggle('scaling', state === INTERACTION_STATES.SCALING);

    if (state === INTERACTION_STATES.SCALING) {
      this.dom.cursorLabel.textContent = 'SCALE';
    } else if (state === INTERACTION_STATES.DRAGGING) {
      this.dom.cursorLabel.textContent = 'LOCK';
    } else {
      this.dom.cursorLabel.textContent = 'POINT';
    }
  }

  /**
   * Batched DOM updates executed at 12 Hz
   */
  _updateThrottledDOM() {
    const snap = this.telemetry.getSnapshot();

    // Telemetry text
    this.dom.cardRenderFps.textContent = `${snap.renderFps}`;
    this.dom.cardLatency.textContent = `${snap.inferenceTimeMs} ms`;
    this.dom.cardHandsCount.textContent = `${snap.handsDetected} HAND${snap.handsDetected === 1 ? '' : 'S'}`;
    this.dom.pipInferenceRate.textContent = `${snap.inferenceFps} INF/S`;

    // Performance adaptation badge
    if (snap.isDegraded) {
      this.dom.perfDegradedTag.textContent = 'THROTTLED';
      this.dom.perfDegradedTag.style.color = '#ffb800';
    } else {
      this.dom.perfDegradedTag.textContent = 'OPTIMAL';
      this.dom.perfDegradedTag.style.color = '#00f59b';
    }

    // Interaction state & Target object
    if (this.latestInteractionStatus) {
      const { interactionState, selectedObjectName, detectedGesture } = this.latestInteractionStatus;
      this.dom.hudStatePill.textContent = interactionState;
      this.dom.hudObjectVal.textContent = selectedObjectName;

      // Coordinates & Target chip sync of active pointed target
      const activeObj = this.interactionController.heldObject || this.sceneManager.hoveredObject || this.sceneManager.selectedObject;
      if (activeObj) {
        this.dom.hudTargetX.textContent = activeObj.position.x.toFixed(2);
        this.dom.hudTargetY.textContent = activeObj.position.y.toFixed(2);
        this.dom.hudTargetZ.textContent = activeObj.position.z.toFixed(2);
        this._updateTargetChips(activeObj);
      }

      // Gesture badge
      this.dom.hudGestureVal.textContent = detectedGesture;
      this.dom.hudGestureIcon.textContent = this._getGestureIcon(detectedGesture);
    }

    // Live Diagnostics Panel Updates
    if (this.showDiagnostics && this.dom.diagnosticsPanel) {
      if (this.dom.diagSchedulerType) this.dom.diagSchedulerType.textContent = snap.schedulerType;
      if (this.dom.diagStreamAdvancing) {
        this.dom.diagStreamAdvancing.textContent = snap.isStreamAdvancing ? 'ADVANCING' : 'STALLED';
        this.dom.diagStreamAdvancing.className = snap.isStreamAdvancing ? 'diag-val font-mono text-emerald' : 'diag-val font-mono text-danger';
      }
      if (this.dom.diagFrameAge) this.dom.diagFrameAge.textContent = `${snap.cameraFrameAgeMs} ms`;
      if (this.dom.diagTimeSinceInf) this.dom.diagTimeSinceInf.textContent = `${snap.timeSinceLastInferenceMs} ms`;
      if (this.dom.diagInfDuration) this.dom.diagInfDuration.textContent = `${snap.inferenceTimeMs} ms`;
      if (this.dom.diagInferring) {
        this.dom.diagInferring.textContent = snap.isInferring ? 'ACTIVE' : 'IDLE';
        this.dom.diagInferring.className = snap.isInferring ? 'diag-val font-mono text-cyan' : 'diag-val font-mono';
      }
      if (this.dom.diagConsecErrors) {
        this.dom.diagConsecErrors.textContent = `${snap.consecutiveErrors}`;
        this.dom.diagConsecErrors.style.color = snap.consecutiveErrors > 0 ? '#ef4444' : '';
      }
      if (this.dom.diagSkippedFrames) this.dom.diagSkippedFrames.textContent = `${snap.skippedFrames}`;
      if (this.dom.diagCondition) this.dom.diagCondition.textContent = snap.trackingCondition;
      if (this.dom.diagRenderFps) this.dom.diagRenderFps.textContent = `${snap.renderFps} FPS`;
      if (this.dom.diagDelegate) {
        this.dom.diagDelegate.textContent = `${this.detector.activeDelegate} // ${this.detector.activeModelSource.toUpperCase()}`;
      }
    }

    // Automated Watchdog Recovery: if detector fails repeatedly (>15 consecutive errors)
    if (this.isRunning && !this.isRecovering && snap.consecutiveErrors > 15) {
      if (this.recoveryAttempts < 2) {
        this.recoveryAttempts++;
        console.warn(`Watchdog detected ${snap.consecutiveErrors} consecutive errors. Triggering automatic recovery (attempt ${this.recoveryAttempts}/2)...`);
        this.recoverPipeline();
      }
    } else if (snap.consecutiveErrors === 0 && this.recoveryAttempts > 0) {
      this.recoveryAttempts = 0;
    }
  }

  _getGestureIcon(gesture) {
    switch (gesture) {
      case GESTURE_TYPES.PINCH: return '🤏';
      case GESTURE_TYPES.POINTING: return '👆';
      case GESTURE_TYPES.OPEN_PALM: return '🖐️';
      case GESTURE_TYPES.FIST: return '✊';
      case GESTURE_TYPES.TWO_HAND_SCALE: return '👐';
      default: return '◈';
    }
  }

  _updateTargetChips(targetObj) {
    if (!targetObj) return;
    const name = targetObj.name;
    this.dom.chipCube.classList.toggle('active', name === 'Quantum Cube');
    this.dom.chipSphere.classList.toggle('active', name === 'Arc Reactor Sphere');
    this.dom.chipTorus.classList.toggle('active', name === 'Torus Accelerator');
    this.dom.hudObjectVal.textContent = name;
  }

  _updateStatusBeacon(state) {
    const beacon = this.dom.globalBeacon;
    beacon.className = 'reactor-core-beacon';

    if (state === TRACKING_STATES.TRACKING) {
      beacon.classList.add('active');
    } else if (state === TRACKING_STATES.INITIALIZING) {
      beacon.classList.add('initializing');
    } else if (state === TRACKING_STATES.ERROR) {
      beacon.classList.add('error');
    }
  }

  _updateButtonToStopMode() {
    this.dom.toggleCameraBtn.classList.add('btn-stopping');
    this.dom.cameraBtnText.textContent = 'DISENGAGE';
  }

  _updateButtonToStartMode() {
    this.dom.toggleCameraBtn.classList.remove('btn-stopping');
    this.dom.cameraBtnText.textContent = 'ENGAGE SENSORS';
  }

  _showOverlay(el) { el.classList.remove('hidden'); }
  _hideOverlay(el) { el.classList.add('hidden'); }

  _showError(message) {
    this.dom.errorMessage.textContent = message.toUpperCase();
    this._hideOverlay(this.dom.loadingOverlay);
    this._showOverlay(this.dom.errorOverlay);
    this._updateStatusBeacon(TRACKING_STATES.ERROR);
  }
}

// Bootstrap JARVIS studio on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.jarvisStudio = new JarvisGestureStudio();
});
