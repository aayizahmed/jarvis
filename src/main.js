/**
 * GestureFlow — Cinematic JARVIS Edition
 * Master Application Coordinator & Performance Decoupler
 * Ultra-smooth 60+ FPS Three.js rendering via VideoFrameScheduler,
 * 1€ adaptive filtering, quaternion delta rotation, and seamless
 * cinematic intro screen transition to the Sphere, Ring, and Torus workspace.
 */

import { CameraManager } from './modules/camera.js';
import { HandDetector } from './modules/handDetector.js';
import { LandmarkRenderer } from './modules/landmarkRenderer.js';
import { TelemetryManager } from './modules/telemetry.js';
import { SceneManager, APP_STATES } from './modules/sceneManager.js';
import { GestureDetector } from './modules/gestureDetector.js';
import { InteractionController } from './modules/interactionController.js';
import { VideoFrameScheduler } from './modules/videoScheduler.js';
import { SpeechManager } from './modules/speechManager.js';
import { INTERACTION_STATES } from './modules/gestureStateMachine.js';
import {
  TRACKING_STATES,
  GESTURE_TYPES,
  DEFAULT_SETTINGS
} from './modules/constants.js';
import { DisplayCoordinator } from './modules/displayCoordinator.js';
import { SyncClient } from './modules/syncClient.js';
import { ROLES, generateRoomCode } from './modules/syncProtocol.js';

class JarvisGestureStudio {
  constructor(options = {}) {
    // DOM Element Cache
    this.dom = {
      // Cinematic Intro Screen Overlay
      cinematicIntroScreen: document.getElementById('cinematicIntroScreen'),
      enterExperienceBtn: document.getElementById('enterExperienceBtn'),
      introBeaconDot: document.getElementById('introBeaconDot'),
      introBeaconLabel: document.getElementById('introBeaconLabel'),
      introSensorDot: document.getElementById('introSensorDot'),
      introSensorText: document.getElementById('introSensorText'),
      returnToIntroBtn: document.getElementById('returnToIntroBtn'),

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
      diagInfDuration: document.getElementById('diagInfDuration'),
      diagInferring: document.getElementById('diagInferring'),
      diagConsecErrors: document.getElementById('diagConsecErrors'),
      diagCondition: document.getElementById('diagCondition'),
      diagRenderFps: document.getElementById('diagRenderFps'),
      diagDelegate: document.getElementById('diagDelegate'),

      // Target Chips: Ring, Sphere, Torus
      chipRing: document.getElementById('chipRing'),
      chipSphere: document.getElementById('chipSphere'),
      chipTorus: document.getElementById('chipTorus'),

      // 3D Viewport & In-Viewport Tactical HUD
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
      pipFilterType: document.getElementById('pipFilterType'),

      // Tactical Tuning Dock
      tuningDock: document.getElementById('tuningDock'),
      smoothingSlider: document.getElementById('smoothingSlider'),
      smoothingVal: document.getElementById('smoothingVal'),
      rotationSlider: document.getElementById('rotationSlider'),
      rotationVal: document.getElementById('rotationVal'),
      toggleGestureControl: document.getElementById('toggleGestureControl'),
      toggleOrbitControls: document.getElementById('toggleOrbitControls'),
      togglePipWebcam: document.getElementById('togglePipWebcam'),

      // Dual-Device Projection Pairing Elements
      pairDisplayBtn: document.getElementById('pairDisplayBtn'),
      pairBeaconDot: document.getElementById('pairBeaconDot'),
      pairBtnText: document.getElementById('pairBtnText'),
      pairModal: document.getElementById('pairModal'),
      closePairModalBtn: document.getElementById('closePairModalBtn'),
      modalRoomCode: document.getElementById('modalRoomCode'),
      refreshCodeBtn: document.getElementById('refreshCodeBtn'),
      modalDisplayUrlInput: document.getElementById('modalDisplayUrlInput'),
      modalCopyUrlBtn: document.getElementById('modalCopyUrlBtn'),
      copyBtnLabel: document.getElementById('copyBtnLabel'),
      modalQrCodeImg: document.getElementById('modalQrCodeImg'),
      modalConnectionStatus: document.getElementById('modalConnectionStatus'),
      modalStatusDot: document.getElementById('modalStatusDot'),
      modalStatusLabel: document.getElementById('modalStatusLabel'),
      testDisplayBtn: document.getElementById('testDisplayBtn'),
      reconnectSyncBtn: document.getElementById('reconnectSyncBtn'),
      modeControlBtn: document.getElementById('modeControlBtn'),
      modeDisplayBtn: document.getElementById('modeDisplayBtn'),
      enterBtnLabelText: document.getElementById('enterBtnLabelText')
    };

    // Dual-Device Network Sync Subsystem (Authoritative Controller)
    this.roomCode = (options.roomCode || generateRoomCode()).toUpperCase();
    this.sync = new SyncClient({
      role: ROLES.CONTROL,
      roomCode: this.roomCode
    });
    this.lastSyncBroadcastTime = 0;

    // Core Engine Subsystems
    this.camera = new CameraManager(this.dom.video);
    this.detector = new HandDetector();
    this.renderer = new LandmarkRenderer(this.dom.canvas);
    this.telemetry = new TelemetryManager();
    this.sceneManager = new SceneManager(this.dom.threeContainer);
    this.gestureDetector = new GestureDetector();
    this.interactionController = new InteractionController(this.sceneManager);
    this.speechManager = new SpeechManager();

    // Hardware Frame Scheduler
    this.scheduler = new VideoFrameScheduler({
      video: this.dom.video,
      onFrame: (video, time, meta) => this._onVideoFrame(video, time, meta),
      onTimeout: () => this._onSchedulerTimeout()
    });
    this.telemetry.setDiagnosticSources({ scheduler: this.scheduler, detector: this.detector });

    // Lifecycle State
    this.isRunning = false;
    this.isRecovering = false;
    this.showDiagnostics = false;
    this.recoveryAttempts = 0;
    this.animationFrameId = null;
    this.lastRenderTime = performance.now();
    this.settings = { ...DEFAULT_SETTINGS };

    // Decoupled Frame State
    this.latestGestureFrame = null;
    this.latestInteractionStatus = null;
    this.lastDomUpdateTime = 0;
    this.domUpdateIntervalMs = 80; // 12 Hz throttled DOM updater
    this.isTransitioning = false;

    this._init();
  }

  _init() {
    // Initial State: Intro mode active
    document.body.classList.add('in-intro-mode');

    this._bindEvents();
    this._setupResizeHandlers();
    this._syncSettings();
    this._initSyncAndPairing();

    // Interaction controller callbacks
    this.interactionController.onTargetSelected = (obj) => {
      this._updateTargetChips(obj);
      if (this.sync) this.sync.sendTargetSelect(obj?.name);
    };

    this.interactionController.onGestureTriggered = (action, obj) => {
      if (action === 'GRAB') this.speechManager.playChime('grab');
      if (action === 'RELEASE') this.speechManager.playChime('release');
      if (this.sync) this.sync.sendAction(action, { name: obj?.name });
    };

    // Start 60+ FPS Three.js rendering loop immediately
    this._startRenderLoop();
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  _bindEvents() {
    // 1. Cinematic Intro Screen Entry & Return Controls
    if (this.dom.enterExperienceBtn) {
      this.dom.enterExperienceBtn.addEventListener('click', () => this.handleEnterExperience());
    }
    if (this.dom.returnToIntroBtn) {
      this.dom.returnToIntroBtn.addEventListener('click', () => this.handleReturnToIntro());
    }

    // 2. Direct Target Selectors: Ring, Sphere, Torus
    if (this.dom.chipRing) {
      this.dom.chipRing.addEventListener('click', () => {
        this.sceneManager.setSelectedObject(this.sceneManager.ring, false);
        this._updateTargetChips(this.sceneManager.ring);
        this.speechManager.playChime('select');
        if (this.sync) this.sync.sendTargetSelect(this.sceneManager.ring.name);
      });
    }
    if (this.dom.chipSphere) {
      this.dom.chipSphere.addEventListener('click', () => {
        this.sceneManager.setSelectedObject(this.sceneManager.sphere, false);
        this._updateTargetChips(this.sceneManager.sphere);
        this.speechManager.playChime('select');
        if (this.sync) this.sync.sendTargetSelect(this.sceneManager.sphere.name);
      });
    }
    if (this.dom.chipTorus) {
      this.dom.chipTorus.addEventListener('click', () => {
        this.sceneManager.setSelectedObject(this.sceneManager.torus, false);
        this._updateTargetChips(this.sceneManager.torus);
        this.speechManager.playChime('select');
        if (this.sync) this.sync.sendTargetSelect(this.sceneManager.torus.name);
      });
    }

    // 3. Gesture Toggle Button
    if (this.dom.toggleGestureBtn) {
      this.dom.toggleGestureBtn.addEventListener('click', () => {
        const isEnabled = !this.settings.gestureControlEnabled;
        this.settings.gestureControlEnabled = isEnabled;
        this.interactionController.gestureControlEnabled = isEnabled;
        if (this.dom.toggleGestureControl) this.dom.toggleGestureControl.checked = isEnabled;
        this.dom.toggleGestureBtn.classList.toggle('active', isEnabled);
        if (this.dom.gestureBtnText) {
          this.dom.gestureBtnText.textContent = isEnabled ? 'GESTURES: ON' : 'GESTURES: OFF';
        }
      });
    }

    // 4. Reset Stage
    if (this.dom.resetSceneBtn) {
      this.dom.resetSceneBtn.addEventListener('click', () => {
        this.sceneManager.resetScene();
        this.interactionController.fsm.forceReset();
        this._updateTargetChips(this.sceneManager.sphere);
        this.speechManager.playChime('select');
        if (this.sync) this.sync.sendResetScene();
      });
    }

    // 5. Mirror & Fullscreen
    if (this.dom.mirrorToggleBtn) {
      this.dom.mirrorToggleBtn.addEventListener('click', () => this.toggleMirror());
    }
    if (this.dom.fullscreenBtn) {
      this.dom.fullscreenBtn.addEventListener('click', () => {
        this.sceneManager.toggleFullscreen(document.documentElement);
      });
    }

    // 6. Diagnostics HUD Panel
    if (this.dom.toggleDiagBtn) {
      this.dom.toggleDiagBtn.addEventListener('click', () => this.toggleDiagnostics());
    }
    if (this.dom.closeDiagBtn) {
      this.dom.closeDiagBtn.addEventListener('click', () => this.toggleDiagnostics(false));
    }
    if (this.dom.diagRecoverBtn) {
      this.dom.diagRecoverBtn.addEventListener('click', () => this.recoverPipeline());
    }

    // 7. Camera Controls
    if (this.dom.toggleCameraBtn) {
      this.dom.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
    }
    if (this.dom.splashStartBtn) {
      this.dom.splashStartBtn.addEventListener('click', () => this.toggleCamera());
    }
    if (this.dom.errorRetryBtn) {
      this.dom.errorRetryBtn.addEventListener('click', () => {
        this._hideOverlay(this.dom.errorOverlay);
        this.startCamera();
      });
    }

    // 8. PiP Toggle
    if (this.dom.pipToggleBtn) {
      this.dom.pipToggleBtn.addEventListener('click', () => {
        const isMin = this.dom.pipWebcamCard.classList.toggle('minimized');
        this.dom.pipToggleBtn.textContent = isMin ? '+' : '−';
      });
    }

    // 9. Tuning Dock Controls
    if (this.dom.smoothingSlider) {
      this.dom.smoothingSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.settings.smoothing = val;
        this.gestureDetector.setSmoothing(val);
        if (this.dom.smoothingVal) this.dom.smoothingVal.textContent = val.toFixed(2);
      });
    }

    if (this.dom.rotationSlider) {
      this.dom.rotationSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.settings.rotationSensitivity = val;
        this.interactionController.setRotationSensitivity(val);
        if (this.dom.rotationVal) this.dom.rotationVal.textContent = `${val.toFixed(1)}x`;
      });
    }

    if (this.dom.toggleGestureControl) {
      this.dom.toggleGestureControl.addEventListener('change', (e) => {
        this.settings.gestureControlEnabled = e.target.checked;
        this.interactionController.gestureControlEnabled = e.target.checked;
        if (this.dom.toggleGestureBtn) this.dom.toggleGestureBtn.classList.toggle('active', e.target.checked);
        if (this.dom.gestureBtnText) {
          this.dom.gestureBtnText.textContent = e.target.checked ? 'GESTURES: ON' : 'GESTURES: OFF';
        }
      });
    }

    if (this.dom.toggleOrbitControls) {
      this.dom.toggleOrbitControls.addEventListener('change', (e) => {
        this.settings.orbitControlsEnabled = e.target.checked;
        this.sceneManager.controls.enabled = e.target.checked;
      });
    }

    if (this.dom.togglePipWebcam) {
      this.dom.togglePipWebcam.addEventListener('change', (e) => {
        if (this.dom.pipWebcamCard) {
          this.dom.pipWebcamCard.style.display = e.target.checked ? 'flex' : 'none';
        }
      });
    }
  }

  // =========================================================================
  // CINEMATIC INTRO SCREEN & FLUID WORKSPACE TRANSITION (750ms)
  // =========================================================================

  handleEnterExperience() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.speechManager.playChime('select');
    if (this.sync) {
      this.sync.sendStateChange(APP_STATES.WORKSPACE);
    }

    // 1. Smoothly fade out intro screen overlay via CSS
    if (this.dom.cinematicIntroScreen) {
      this.dom.cinematicIntroScreen.classList.add('transitioning-out');
    }

    // 2. Start 3D Hermite smooth camera & core contraction transition
    this.sceneManager.startWorkspaceTransition(() => {
      this.isTransitioning = false;
      if (this.dom.cinematicIntroScreen) {
        this.dom.cinematicIntroScreen.style.display = 'none';
      }

      // Reveal workspace panels smoothly
      document.body.classList.remove('in-intro-mode');
      this._updateTargetChips(this.sceneManager.sphere);

      // Initialize camera asynchronously in background without freezing transition
      if (!this.isRunning) {
        this.startCamera().catch(err => console.warn('Background camera auto-start:', err));
      }
    });
  }

  handleReturnToIntro() {
    if (this.isTransitioning) return;

    this.speechManager.playChime('select');
    this.sceneManager.returnToIntro();
    if (this.sync) {
      this.sync.sendStateChange(APP_STATES.INTRO);
    }

    if (this.dom.cinematicIntroScreen) {
      this.dom.cinematicIntroScreen.style.display = 'flex';
      void this.dom.cinematicIntroScreen.offsetWidth; // Force reflow
      this.dom.cinematicIntroScreen.classList.remove('transitioning-out');
    }

    document.body.classList.add('in-intro-mode');
  }

  // =========================================================================
  // TARGET CHIPS SYNCHRONIZATION
  // =========================================================================

  _updateTargetChips(targetObj) {
    if (!targetObj) return;
    const name = targetObj.name;
    if (this.dom.chipRing) this.dom.chipRing.classList.toggle('active', name === 'Holographic Ring');
    if (this.dom.chipSphere) this.dom.chipSphere.classList.toggle('active', name === 'Arc Reactor Sphere');
    if (this.dom.chipTorus) this.dom.chipTorus.classList.toggle('active', name === 'Torus Accelerator');
    if (this.dom.hudObjectVal) this.dom.hudObjectVal.textContent = name;
  }

  // =========================================================================
  // RESIZE & SETTINGS
  // =========================================================================

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
      await this.detector.initialize(({ message }) => {
        if (this.dom.loadingMessage) this.dom.loadingMessage.textContent = message.toUpperCase();
      });

      await this.camera.start();
      this.renderer.resize(this.dom.cameraStage.clientWidth, this.dom.cameraStage.clientHeight);

      this.scheduler.start(this.dom.video);
      this.isRunning = true;
      this.recoveryAttempts = 0;

      this._hideOverlay(this.dom.loadingOverlay);
      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
      if (this.dom.cameraBtnText) this.dom.cameraBtnText.textContent = 'DISENGAGE SENSORS';
      if (this.dom.toggleCameraBtn) this.dom.toggleCameraBtn.classList.add('active');
    } catch (err) {
      console.error('Camera pipeline failed:', err);
      this.stopCamera(true);
      this._showOverlay(this.dom.errorOverlay);
      if (this.dom.errorMessage) this.dom.errorMessage.textContent = err.message || 'DEVICE INITIALIZATION FAILED';
      this._updateStatusBeacon(TRACKING_STATES.ERROR);
    }
  }

  stopCamera(isError = false) {
    this.scheduler.stop();
    this.camera.stop();
    this.renderer.clear();
    this.isRunning = false;

    if (this.dom.screenVirtualCursor) this.dom.screenVirtualCursor.classList.add('hidden');
    if (this.sceneManager.virtualCursor3D) this.sceneManager.virtualCursor3D.visible = false;
    this.sceneManager.setHoveredObject(null);

    this._hideOverlay(this.dom.loadingOverlay);
    if (!isError) {
      this._showOverlay(this.dom.idleOverlay);
      this._hideOverlay(this.dom.errorOverlay);
      this._updateStatusBeacon(TRACKING_STATES.STOPPED);
    }
    if (this.dom.cameraBtnText) this.dom.cameraBtnText.textContent = 'ENGAGE SENSORS';
    if (this.dom.toggleCameraBtn) this.dom.toggleCameraBtn.classList.remove('active');
  }

  async recoverPipeline() {
    if (this.isRecovering) return;
    this.isRecovering = true;
    console.warn('Recovering optical tracking pipeline...');

    try {
      this.stopCamera();
      await new Promise(res => setTimeout(res, 250));
      this.detector.cleanup();
      await this.startCamera();
    } catch (e) {
      console.error('Recovery failed:', e);
    } finally {
      this.isRecovering = false;
    }
  }

  toggleMirror() {
    this.settings.mirrorPreview = !this.settings.mirrorPreview;
    this.dom.cameraStage.classList.toggle('mirrored', this.settings.mirrorPreview);
    this.renderer.options.mirrored = this.settings.mirrorPreview;
    if (this.dom.mirrorBtnLabel) {
      this.dom.mirrorBtnLabel.textContent = `MIRROR: ${this.settings.mirrorPreview ? 'ON' : 'OFF'}`;
    }
  }

  // =========================================================================
  // HARDWARE VIDEO FRAME SCHEDULER CALLBACK (INFERENCE PIPELINE)
  // =========================================================================

  _onVideoFrame(video, timestamp, metadata) {
    if (!this.isRunning) return;

    const frameAge = metadata ? (performance.now() - metadata.presentationTime) : 0;
    this.telemetry.recordVideoFrameAdvance(frameAge);

    const infStartTime = performance.now();
    const result = this.detector.detect(video, infStartTime);
    const infDuration = performance.now() - infStartTime;

    const hasHands = result && result.landmarks && result.landmarks.length > 0;
    this.telemetry.recordInference(infDuration, hasHands ? result.landmarks.length : 0);

    if (result) {
      this.renderer.render(result.landmarks, result.handedness);
    } else {
      this.renderer.clear();
    }

    if (hasHands) {
      const gestureFrame = this.gestureDetector.process(
        result.landmarks,
        this.settings.mirrorPreview,
        infStartTime
      );

      this.latestGestureFrame = gestureFrame;
      this.latestInteractionStatus = this.interactionController.updateInference(gestureFrame, infStartTime);

      this._updateVirtualCursor(gestureFrame);
      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
    } else {
      this.latestGestureFrame = null;
      this.latestInteractionStatus = this.interactionController.updateInference(null, infStartTime);

      if (this.dom.screenVirtualCursor) this.dom.screenVirtualCursor.classList.add('hidden');
      if (this.sceneManager.virtualCursor3D) this.sceneManager.virtualCursor3D.visible = false;
      this._updateStatusBeacon(TRACKING_STATES.SEARCHING);
    }
  }

  _onSchedulerTimeout() {
    this.telemetry.recordFrameStall();
  }

  // =========================================================================
  // DECOUPLED THREE.JS RENDER LOOP (60+ FPS)
  // =========================================================================

  _startRenderLoop() {
    const loop = (currentTime) => {
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = (currentTime - this.lastRenderTime) / 1000;
      this.lastRenderTime = currentTime;

      this.telemetry.tickRender(currentTime);
      this.interactionController.renderInterpolate(delta, currentTime);
      this.sceneManager.render();

      // Throttled 30 Hz LAN broadcast to Projection Displays
      if (currentTime - this.lastSyncBroadcastTime >= 33) {
        this._broadcastSceneTransforms();
        this.lastSyncBroadcastTime = currentTime;
      }

      if (currentTime - this.lastDomUpdateTime >= this.domUpdateIntervalMs) {
        this._updateThrottledDOM();
        this.lastDomUpdateTime = currentTime;
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  _updateVirtualCursor(gestureFrame) {
    if (!gestureFrame || !this.dom.screenVirtualCursor) return;

    const { screenX, screenY, gesture, isPinching } = gestureFrame;

    this.dom.screenVirtualCursor.classList.remove('hidden');
    this.dom.screenVirtualCursor.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;

    if (this.dom.cursorLabel) {
      this.dom.cursorLabel.textContent = isPinching ? 'GRAB' : gesture;
    }
  }

  _updateThrottledDOM() {
    const snap = this.telemetry.getSnapshot();

    // Telemetry Top Right
    if (this.dom.cardRenderFps) this.dom.cardRenderFps.textContent = `${snap.renderFps}`;
    if (this.dom.cardLatency) this.dom.cardLatency.textContent = `${snap.inferenceTimeMs} ms`;
    if (this.dom.cardHandsCount) this.dom.cardHandsCount.textContent = `${snap.handsDetected} HAND${snap.handsDetected === 1 ? '' : 'S'}`;
    if (this.dom.pipInferenceRate) this.dom.pipInferenceRate.textContent = `${snap.inferenceFps} INF/S`;

    if (this.dom.perfDegradedTag) {
      if (snap.isDegraded) {
        this.dom.perfDegradedTag.textContent = 'THROTTLED';
        this.dom.perfDegradedTag.style.color = '#ffb800';
      } else {
        this.dom.perfDegradedTag.textContent = 'OPTIMAL';
        this.dom.perfDegradedTag.style.color = '#00f59b';
      }
    }

    // Top Left Tactical Target Coordinates & Gesture
    if (this.latestInteractionStatus) {
      const { detectedGesture, interactionState, heldObject, hoveredObject } = this.latestInteractionStatus;
      if (this.dom.hudGestureVal) this.dom.hudGestureVal.textContent = detectedGesture;
      if (this.dom.hudGestureIcon) this.dom.hudGestureIcon.textContent = this._getGestureIcon(detectedGesture);
      if (this.dom.hudStatePill) this.dom.hudStatePill.textContent = interactionState;

      const activeTarget = heldObject || hoveredObject || this.sceneManager.selectedObject;
      if (activeTarget) {
        const p = activeTarget.position;
        if (this.dom.hudTargetX) this.dom.hudTargetX.textContent = p.x.toFixed(2);
        if (this.dom.hudTargetY) this.dom.hudTargetY.textContent = p.y.toFixed(2);
        if (this.dom.hudTargetZ) this.dom.hudTargetZ.textContent = p.z.toFixed(2);
        if (this.dom.hudObjectVal) this.dom.hudObjectVal.textContent = activeTarget.name;
      }
    }

    // Intro Screen Telemetry Feedback (While in Intro State)
    if (this.dom.introBeaconLabel && this.dom.introSensorText) {
      if (this.isRunning) {
        if (snap.handsDetected > 0) {
          this.dom.introBeaconLabel.textContent = `OPTICAL SENSOR // ${snap.handsDetected} HAND DETECTED`;
          this.dom.introSensorText.textContent = 'OPTICAL SENSOR ACTIVE — AIR GESTURES READY';
          if (this.dom.introBeaconDot) this.dom.introBeaconDot.style.background = '#00f59b';
          if (this.dom.introSensorDot) this.dom.introSensorDot.style.background = '#00f59b';
        } else {
          this.dom.introBeaconLabel.textContent = 'OPTICAL SENSOR // SEARCHING';
          this.dom.introSensorText.textContent = 'SENSOR ACTIVE — CLICK TO ENTER';
          if (this.dom.introBeaconDot) this.dom.introBeaconDot.style.background = '#00f0ff';
          if (this.dom.introSensorDot) this.dom.introSensorDot.style.background = '#00f0ff';
        }
      } else {
        this.dom.introBeaconLabel.textContent = 'OPTICAL SENSOR // STANDBY';
        this.dom.introSensorText.textContent = 'SENSOR STANDBY — CLICK TO ENTER';
      }
    }

    // Diagnostics Panel Telemetry
    if (this.showDiagnostics && this.dom.diagnosticsPanel) {
      if (this.dom.diagSchedulerType) this.dom.diagSchedulerType.textContent = snap.schedulerType;
      if (this.dom.diagStreamAdvancing) {
        this.dom.diagStreamAdvancing.textContent = snap.isStreamAdvancing ? 'ADVANCING' : 'STALLED';
        this.dom.diagStreamAdvancing.className = snap.isStreamAdvancing ? 'diag-val font-mono text-emerald' : 'diag-val font-mono text-danger';
      }
      if (this.dom.diagFrameAge) this.dom.diagFrameAge.textContent = `${snap.cameraFrameAgeMs} ms`;
      if (this.dom.diagInfDuration) this.dom.diagInfDuration.textContent = `${snap.inferenceTimeMs} ms`;
      if (this.dom.diagInferring) {
        this.dom.diagInferring.textContent = snap.isInferring ? 'ACTIVE' : 'IDLE';
        this.dom.diagInferring.className = snap.isInferring ? 'diag-val font-mono text-cyan' : 'diag-val font-mono';
      }
      if (this.dom.diagConsecErrors) {
        this.dom.diagConsecErrors.textContent = `${snap.consecutiveErrors}`;
        this.dom.diagConsecErrors.style.color = snap.consecutiveErrors > 0 ? '#ef4444' : '';
      }
      if (this.dom.diagCondition) this.dom.diagCondition.textContent = snap.trackingCondition;
      if (this.dom.diagRenderFps) this.dom.diagRenderFps.textContent = `${snap.renderFps} FPS`;
      if (this.dom.diagDelegate) {
        this.dom.diagDelegate.textContent = `${this.detector.activeDelegate} // ${this.detector.activeModelSource.toUpperCase()}`;
      }
    }

    // Auto-Recovery Watchdog
    if (this.isRunning && !this.isRecovering && snap.consecutiveErrors > 15) {
      if (this.recoveryAttempts < 2) {
        this.recoveryAttempts++;
        this.recoverPipeline();
      }
    } else if (snap.consecutiveErrors === 0 && this.recoveryAttempts > 0) {
      this.recoveryAttempts = 0;
    }
  }

  _getGestureIcon(gesture) {
    switch (gesture) {
      case 'PINCH': return '🤏';
      case 'POINTING': return '👆';
      case 'OPEN_PALM': return '🖐️';
      case 'FIST': return '✊';
      case 'TWO_HAND_SCALE': return '👐';
      default: return '✦';
    }
  }

  _updateStatusBeacon(state) {
    const beacon = this.dom.globalBeacon;
    if (!beacon) return;
    beacon.className = 'reactor-core-beacon';

    if (state === TRACKING_STATES.TRACKING) {
      beacon.classList.add('active');
    } else if (state === TRACKING_STATES.INITIALIZING) {
      beacon.classList.add('initializing');
    } else if (state === TRACKING_STATES.ERROR) {
      beacon.classList.add('error');
    }

    if (this.dom.pipStatusDot) {
      this.dom.pipStatusDot.className = 'pip-pulse-dot';
      if (state === TRACKING_STATES.TRACKING) this.dom.pipStatusDot.classList.add('active');
      if (state === TRACKING_STATES.ERROR) this.dom.pipStatusDot.classList.add('error');
    }
  }

  _showOverlay(el) {
    if (el) el.classList.remove('hidden');
  }

  _hideOverlay(el) {
    if (el) el.classList.add('hidden');
  }

  // =========================================================================
  // DUAL-DEVICE LAN SYNCHRONIZATION & DISPLAY PAIRING
  // =========================================================================

  _initSyncAndPairing() {
    // 1. Initial Room Code in Modal
    if (this.dom.modalRoomCode) {
      this.dom.modalRoomCode.textContent = this.roomCode;
    }

    // 2. Fetch local network IPv4 info and update UI with actual LAN IP
    this._refreshPairingDisplayUrls();

    // 3. Bind Modal Open/Close Controls
    if (this.dom.pairDisplayBtn) {
      this.dom.pairDisplayBtn.addEventListener('click', () => this.openPairModal());
    }
    if (this.dom.closePairModalBtn) {
      this.dom.closePairModalBtn.addEventListener('click', () => this.closePairModal());
    }
    if (this.dom.pairModal) {
      this.dom.pairModal.addEventListener('click', (e) => {
        if (e.target === this.dom.pairModal) this.closePairModal();
      });
    }

    // 4. Generate New Session PIN
    if (this.dom.refreshCodeBtn) {
      this.dom.refreshCodeBtn.addEventListener('click', () => {
        this.roomCode = generateRoomCode();
        if (this.dom.modalRoomCode) this.dom.modalRoomCode.textContent = this.roomCode;
        this.sync.setRoomCode(this.roomCode);
        this._refreshPairingDisplayUrls();
        this.speechManager.playChime('select');
      });
    }

    // 5. Copy Link to Clipboard
    if (this.dom.modalCopyUrlBtn) {
      this.dom.modalCopyUrlBtn.addEventListener('click', () => {
        if (this.dom.modalDisplayUrlInput) {
          navigator.clipboard.writeText(this.dom.modalDisplayUrlInput.value).then(() => {
            if (this.dom.copyBtnLabel) this.dom.copyBtnLabel.textContent = '✓ COPIED!';
            setTimeout(() => {
              if (this.dom.copyBtnLabel) this.dom.copyBtnLabel.textContent = 'COPY LINK';
            }, 2000);
          }).catch(err => {
            console.warn('Clipboard copy error:', err);
          });
        }
      });
    }

    // 6. Test Display in New Browser Tab
    if (this.dom.testDisplayBtn) {
      this.dom.testDisplayBtn.addEventListener('click', () => {
        const url = this.dom.modalDisplayUrlInput?.value || `/?mode=display&room=${this.roomCode}`;
        window.open(url, '_blank');
      });
    }

    // 7. Manual Reconnect
    if (this.dom.reconnectSyncBtn) {
      this.dom.reconnectSyncBtn.addEventListener('click', () => {
        this.sync.connect();
      });
    }

    // 8. Intro Screen Mode Chips
    if (this.dom.modeControlBtn) {
      this.dom.modeControlBtn.addEventListener('click', () => {
        this.dom.modeControlBtn.classList.add('active');
        if (this.dom.modeDisplayBtn) this.dom.modeDisplayBtn.classList.remove('active');
        if (this.dom.enterBtnLabelText) this.dom.enterBtnLabelText.textContent = 'LAUNCH CONTROL STATION';
      });
    }
    if (this.dom.modeDisplayBtn) {
      this.dom.modeDisplayBtn.addEventListener('click', () => {
        window.location.href = `/?mode=display&room=${this.roomCode}`;
      });
    }

    // 9. Sync Client Status & Peer Event Listeners
    this.sync.on('status', ({ isConnected, peerCount, latencyMs }) => {
      this._updateSyncUI(isConnected, peerCount, latencyMs);
    });

    this.sync.on('peer_joined', ({ displaysCount }) => {
      this.speechManager.playChime('select');
      this._updateSyncUI(true, displaysCount);
    });

    this.sync.on('peer_left', ({ displaysCount }) => {
      this._updateSyncUI(true, displaysCount);
    });

    // Provide complete snapshot when remote display requests it
    this.sync.on('request_snapshot', () => {
      this._sendFullSnapshot();
    });

    // Connect to WebSocket server
    this.sync.connect();
  }

  _refreshPairingDisplayUrls() {
    this.sync.fetchNetworkInfo().then(info => {
      const primaryIp = info?.primaryIp || window.location.hostname || 'localhost';
      const port = info?.port || window.location.port || '5173';
      const protocol = window.location.protocol;
      const displayUrl = `${protocol}//${primaryIp}:${port}/?mode=display&room=${this.roomCode}`;

      if (this.dom.modalDisplayUrlInput) {
        this.dom.modalDisplayUrlInput.value = displayUrl;
      }

      if (this.dom.modalQrCodeImg) {
        this.dom.modalQrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(displayUrl)}`;
      }
    });
  }

  _updateSyncUI(isConnected, peerCount = 0, latencyMs = 0) {
    if (this.dom.pairBeaconDot) {
      this.dom.pairBeaconDot.className = isConnected && peerCount > 0 ? 'btn-dot active' : 'btn-dot';
    }

    if (this.dom.pairBtnText) {
      if (!isConnected) {
        this.dom.pairBtnText.textContent = 'PAIR DISPLAY (OFFLINE)';
      } else if (peerCount > 0) {
        this.dom.pairBtnText.textContent = `DISPLAY PAIRED (${peerCount})`;
      } else {
        this.dom.pairBtnText.textContent = 'PAIR DISPLAY';
      }
    }

    if (this.dom.modalConnectionStatus) {
      this.dom.modalConnectionStatus.className = isConnected && peerCount > 0 ? 'connection-status-pill connected' : 'connection-status-pill';
    }

    if (this.dom.modalStatusLabel) {
      if (!isConnected) {
        this.dom.modalStatusLabel.textContent = 'SERVER DISCONNECTED — RETRYING...';
      } else if (peerCount > 0) {
        this.dom.modalStatusLabel.textContent = `PROJECTION DISPLAY CONNECTED (${peerCount} Device${peerCount > 1 ? 's' : ''})`;
      } else {
        this.dom.modalStatusLabel.textContent = 'WAITING FOR PROJECTION DISPLAY...';
      }
    }
  }

  openPairModal() {
    if (this.dom.pairModal) this.dom.pairModal.classList.remove('hidden');
    this._refreshPairingDisplayUrls();
  }

  closePairModal() {
    if (this.dom.pairModal) this.dom.pairModal.classList.add('hidden');
  }

  _broadcastSceneTransforms() {
    if (!this.sync || !this.sync.isConnected) return;

    const items = this.sceneManager.interactiveObjects.map(obj => ({
      name: obj.name,
      id: obj.uuid,
      pos: [
        Number(obj.position.x.toFixed(3)),
        Number(obj.position.y.toFixed(3)),
        Number(obj.position.z.toFixed(3))
      ],
      rot: [
        Number(obj.quaternion.x.toFixed(4)),
        Number(obj.quaternion.y.toFixed(4)),
        Number(obj.quaternion.z.toFixed(4)),
        Number(obj.quaternion.w.toFixed(4))
      ],
      scale: [
        Number(obj.scale.x.toFixed(3)),
        Number(obj.scale.y.toFixed(3)),
        Number(obj.scale.z.toFixed(3))
      ],
      isHeld: obj === this.interactionController.heldObject
    }));

    const reticle = this.sceneManager.virtualCursor3D ? {
      visible: this.sceneManager.virtualCursor3D.visible,
      pos: [
        Number(this.sceneManager.virtualCursor3D.position.x.toFixed(3)),
        Number(this.sceneManager.virtualCursor3D.position.y.toFixed(3)),
        Number(this.sceneManager.virtualCursor3D.position.z.toFixed(3))
      ],
      mode: this.latestInteractionStatus?.gesture || 'TRACKING'
    } : null;

    this.sync.sendTransforms(items, reticle);
  }

  _sendFullSnapshot() {
    if (!this.sync || !this.sync.isConnected) return;

    const snapshot = {
      state: this.sceneManager.appState,
      selectedTarget: this.sceneManager.selectedObject?.name || null,
      transforms: this.sceneManager.interactiveObjects.map(obj => ({
        name: obj.name,
        id: obj.uuid,
        pos: [obj.position.x, obj.position.y, obj.position.z],
        rot: [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z]
      })),
      entities: this.sceneManager.interactiveObjects.map(obj => ({
        id: obj.uuid,
        name: obj.name,
        assetId: obj.userData?.type || 'sphere',
        pos: [obj.position.x, obj.position.y, obj.position.z]
      }))
    };

    this.sync.sendSnapshot(snapshot);
  }
}

// =========================================================================
// APPLICATION BOOTSTRAP (ROUTING BETWEEN CONTROL & PROJECTION DISPLAY)
// =========================================================================

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const isDisplay = params.get('mode') === 'display' || path.includes('/display');
  const roomCode = (params.get('room') || '7429').toUpperCase();

  if (isDisplay) {
    console.log(`⚡ [GestureFlow] Booting PROJECTION DISPLAY mode (Room: ${roomCode})`);
    window.__gestureFlowDisplay = new DisplayCoordinator({ roomCode });
  } else {
    console.log(`⚡ [GestureFlow] Booting CONTROL STATION mode (Room: ${roomCode})`);
    window.__gestureFlowStudio = new JarvisGestureStudio({ roomCode });
  }
});

