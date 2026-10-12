/**
 * GestureFlow — Cinematic JARVIS Workstation Master Coordinator
 * Separates ML inference from 60+ FPS Three.js rendering via VideoFrameScheduler,
 * orchestrates the central holographic core gyroscope, 3D entity inventory,
 * full-screen HUD telemetry, and responsive hand gesture interactions.
 */
import * as THREE from 'three';
import { CameraManager } from './modules/camera.js';
import { HandDetector } from './modules/handDetector.js';
import { LandmarkRenderer } from './modules/landmarkRenderer.js';
import { TelemetryManager } from './modules/telemetry.js';
import { SceneManager, INTERACTION_MODES } from './modules/sceneManager.js';
import { GestureDetector } from './modules/gestureDetector.js';
import { InteractionController } from './modules/interactionController.js';
import { VideoFrameScheduler } from './modules/videoScheduler.js';
import { SpeechManager } from './modules/speechManager.js';
import { INVENTORY_ASSETS } from './modules/inventoryManager.js';
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
      // Header & Mode Controls
      globalBeacon: document.getElementById('globalBeacon'),
      btnModeGimbal: document.getElementById('btnModeGimbal'),
      btnModeObject: document.getElementById('btnModeObject'),
      toggleVoiceBtn: document.getElementById('toggleVoiceBtn'),
      voiceBtnText: document.getElementById('voiceBtnText'),
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

      // Left Rail (Inventory)
      leftRail: document.getElementById('leftRail'),
      toggleLeftRailBtn: document.getElementById('toggleLeftRailBtn'),
      inventoryCatTabs: document.getElementById('inventoryCatTabs'),
      inventoryItemsGrid: document.getElementById('inventoryItemsGrid'),
      clearEntitiesBtn: document.getElementById('clearEntitiesBtn'),
      spawnCubeQuickBtn: document.getElementById('spawnCubeQuickBtn'),

      // Right Rail (Telemetry & Inspector)
      rightRail: document.getElementById('rightRail'),
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

      // Gesture Status Badge
      hudStatePill: document.getElementById('hudStatePill'),
      hudGestureBadge: document.getElementById('hudGestureBadge'),
      hudGestureIcon: document.getElementById('hudGestureIcon'),
      hudGestureVal: document.getElementById('hudGestureVal'),
      gestureHintText: document.getElementById('gestureHintText'),

      // Entity Inspector
      entityInspectorCard: document.getElementById('entityInspectorCard'),
      inspectorCategoryTag: document.getElementById('inspectorCategoryTag'),
      hudObjectVal: document.getElementById('hudObjectVal'),
      hudTargetX: document.getElementById('hudTargetX'),
      hudTargetY: document.getElementById('hudTargetY'),
      hudTargetZ: document.getElementById('hudTargetZ'),
      hudTargetRot: document.getElementById('hudTargetRot'),
      hudTargetScale: document.getElementById('hudTargetScale'),
      actionCloneBtn: document.getElementById('actionCloneBtn'),
      actionFreezeBtn: document.getElementById('actionFreezeBtn'),
      actionDeleteBtn: document.getElementById('actionDeleteBtn'),

      // Telemetry Top Right
      perfDegradedTag: document.getElementById('perfDegradedTag'),
      cardRenderFps: document.getElementById('cardRenderFps'),
      cardLatency: document.getElementById('cardLatency'),
      cardHandsCount: document.getElementById('cardHandsCount'),

      // Subtitles Bar
      subtitlesBar: document.getElementById('subtitlesBar'),
      subtitlesText: document.getElementById('subtitlesText'),

      // Bottom Dock
      dockEntityCount: document.getElementById('dockEntityCount'),
      dockSpawnTray: document.getElementById('dockSpawnTray'),
      quickCoreFocusBtn: document.getElementById('quickCoreFocusBtn'),
      dockResetBtn: document.getElementById('dockResetBtn'),

      // Viewport & Cursor Reticle
      threeContainer: document.getElementById('threeCanvasContainer'),
      screenVirtualCursor: document.getElementById('screenVirtualCursor'),
      cursorLabel: document.getElementById('cursorLabel'),

      // Diagnostics Panel
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
      diagDelegate: document.getElementById('diagDelegate')
    };

    // Specialized Engine Modules
    this.camera = new CameraManager(this.dom.video);
    this.detector = new HandDetector();
    this.renderer = new LandmarkRenderer(this.dom.canvas);
    this.telemetry = new TelemetryManager();
    this.sceneManager = new SceneManager(this.dom.threeContainer);
    this.gestureDetector = new GestureDetector();
    this.interactionController = new InteractionController(this.sceneManager);
    this.speechManager = new SpeechManager(this.dom.subtitlesText);

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

    // Active Category Filter for Left Rail
    this.activeCategory = 'all';

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

    // Populate Left Rail & Bottom Dock Inventory Items
    this._renderInventory();
    this._updateEntityCount();

    // Connect Interaction Controller listeners
    this.interactionController.onTargetSelected = (obj) => {
      this._updateInspector(obj);
    };

    this.interactionController.onGestureTriggered = (action, obj) => {
      this._onGestureTriggered(action, obj);
    };

    // Set Initial Mode: Core Gimbal Mode
    this.setInteractionMode(INTERACTION_MODES.CORE_GIMBAL);

    // Start 60+ FPS Three.js rendering loop immediately
    this._startRenderLoop();
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  _bindEvents() {
    // 1. Mode Switcher
    if (this.dom.btnModeGimbal) {
      this.dom.btnModeGimbal.addEventListener('click', () => {
        this.setInteractionMode(INTERACTION_MODES.CORE_GIMBAL);
      });
    }
    if (this.dom.btnModeObject) {
      this.dom.btnModeObject.addEventListener('click', () => {
        this.setInteractionMode(INTERACTION_MODES.OBJECT_MANIPULATE);
      });
    }

    // 2. Voice Guidance Toggle
    if (this.dom.toggleVoiceBtn) {
      this.dom.toggleVoiceBtn.addEventListener('click', () => {
        const isVoiceOn = this.speechManager.toggleVoice();
        this.dom.toggleVoiceBtn.classList.toggle('active', isVoiceOn);
        this.dom.voiceBtnText.textContent = `VOICE: ${isVoiceOn ? 'ON' : 'OFF'}`;
        if (isVoiceOn) {
          this.speechManager.speak('Voice guidance enabled.');
        }
      });
    }

    // 3. Gesture Control Toggle
    this.dom.toggleGestureBtn.addEventListener('click', () => {
      const isEnabled = !this.settings.gestureControlEnabled;
      this.settings.gestureControlEnabled = isEnabled;
      this.interactionController.gestureControlEnabled = isEnabled;
      this.dom.toggleGestureBtn.classList.toggle('active', isEnabled);
      this.dom.gestureBtnText.textContent = `GESTURES: ${isEnabled ? 'ON' : 'OFF'}`;
    });

    // 4. Reset Stage
    this.dom.resetSceneBtn.addEventListener('click', () => this.resetStage());
    if (this.dom.dockResetBtn) {
      this.dom.dockResetBtn.addEventListener('click', () => this.resetStage());
    }

    // 5. Mirror Toggle
    this.dom.mirrorToggleBtn.addEventListener('click', () => this.toggleMirror());

    // 6. Fullscreen Toggle
    this.dom.fullscreenBtn.addEventListener('click', () => {
      this.sceneManager.toggleFullscreen(document.documentElement);
    });

    // 7. Diagnostics HUD Toggle
    if (this.dom.toggleDiagBtn) {
      this.dom.toggleDiagBtn.addEventListener('click', () => this.toggleDiagnostics());
    }
    if (this.dom.closeDiagBtn) {
      this.dom.closeDiagBtn.addEventListener('click', () => this.toggleDiagnostics(false));
    }
    if (this.dom.diagRecoverBtn) {
      this.dom.diagRecoverBtn.addEventListener('click', () => this.recoverPipeline());
    }

    // 8. Camera start/stop
    this.dom.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
    this.dom.splashStartBtn.addEventListener('click', () => this.toggleCamera());

    this.dom.errorRetryBtn.addEventListener('click', () => {
      this._hideOverlay(this.dom.errorOverlay);
      this.startCamera();
    });

    // 9. PiP minimize
    this.dom.pipToggleBtn.addEventListener('click', () => {
      const isMin = this.dom.pipWebcamCard.classList.toggle('minimized');
      this.dom.pipToggleBtn.textContent = isMin ? '+' : '−';
    });

    // 10. Left Rail Collapse
    if (this.dom.toggleLeftRailBtn) {
      this.dom.toggleLeftRailBtn.addEventListener('click', () => {
        const isCollapsed = this.dom.leftRail.classList.toggle('collapsed');
        this.dom.toggleLeftRailBtn.textContent = isCollapsed ? '▶' : '◀';
      });
    }

    // 11. Category Filter Tabs
    if (this.dom.inventoryCatTabs) {
      this.dom.inventoryCatTabs.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.inventoryCatTabs.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeCategory = btn.getAttribute('data-cat') || 'all';
          this._renderInventory();
        });
      });
    }

    // 12. Quick Action Buttons on Left Rail & Inspector
    if (this.dom.clearEntitiesBtn) {
      this.dom.clearEntitiesBtn.addEventListener('click', () => {
        this.sceneManager.inventory.clearAll();
        this._updateEntityCount();
        this.speechManager.playChime('release');
        this.speechManager.speak('All spawned entities cleared.');
      });
    }

    if (this.dom.spawnCubeQuickBtn) {
      this.dom.spawnCubeQuickBtn.addEventListener('click', () => {
        this.spawnAsset('cube');
      });
    }

    if (this.dom.actionCloneBtn) {
      this.dom.actionCloneBtn.addEventListener('click', () => {
        if (this.sceneManager.selectedObject && this.sceneManager.selectedObject.userData.isSpawnedEntity) {
          const cloned = this.sceneManager.inventory.duplicateEntity(this.sceneManager.selectedObject);
          if (cloned) {
            this._updateEntityCount();
            this.speechManager.playChime('select');
            this.speechManager.speak('Entity duplicated.');
          }
        }
      });
    }

    if (this.dom.actionFreezeBtn) {
      this.dom.actionFreezeBtn.addEventListener('click', () => {
        if (this.sceneManager.jarvisCore) {
          const next = !this.sceneManager.jarvisCore.isFrozen;
          this.sceneManager.jarvisCore.setFrozen(next);
          this.speechManager.playChime('select');
          this.speechManager.speak(next ? 'Mechanism frozen.' : 'Mechanism active.');
        }
      });
    }

    if (this.dom.actionDeleteBtn) {
      this.dom.actionDeleteBtn.addEventListener('click', () => {
        if (this.sceneManager.selectedObject && this.sceneManager.selectedObject.userData.isSpawnedEntity) {
          this.sceneManager.inventory.deleteEntity(this.sceneManager.selectedObject);
          this._updateEntityCount();
          this.speechManager.playChime('release');
          this.speechManager.speak('Entity deleted.');
        }
      });
    }

    if (this.dom.quickCoreFocusBtn) {
      this.dom.quickCoreFocusBtn.addEventListener('click', () => {
        this.setInteractionMode(INTERACTION_MODES.CORE_GIMBAL);
        this.sceneManager.controls.target.set(0, 0.25, 0);
        this.sceneManager.camera.position.set(0, 1.4, 6.2);
        this.sceneManager.controls.update();
        this.speechManager.playChime('select');
      });
    }
  }

  // =========================================================================
  // INTERACTION MODES & WORKSPACE CONTROLS
  // =========================================================================

  setInteractionMode(mode) {
    this.sceneManager.setInteractionMode(mode);

    if (this.dom.btnModeGimbal) {
      this.dom.btnModeGimbal.classList.toggle('active', mode === INTERACTION_MODES.CORE_GIMBAL);
    }
    if (this.dom.btnModeObject) {
      this.dom.btnModeObject.classList.toggle('active', mode === INTERACTION_MODES.OBJECT_MANIPULATE);
    }

    if (mode === INTERACTION_MODES.CORE_GIMBAL) {
      this._updateInspector(this.sceneManager.jarvisCore.root);
      this.speechManager.speak('Core Gimbal Mode active. Pinch to rotate central mechanism.');
    } else {
      const target = this.sceneManager.inventory.spawnedEntities[0] || this.sceneManager.jarvisCore.root;
      this._updateInspector(target);
      this.speechManager.speak('Entity Manipulate Mode active. Point and pinch to manipulate 3D objects.');
    }

    this.speechManager.playChime('select');
  }

  resetStage() {
    this.sceneManager.resetScene();
    this.interactionController.fsm.forceReset();
    this._updateInspector(this.sceneManager.jarvisCore.root);
    this.speechManager.playChime('select');
    this.speechManager.speak('Stage spatial transforms reset.');
  }

  // =========================================================================
  // INVENTORY RENDERING & SPAWNING
  // =========================================================================

  _renderInventory() {
    // 1. Left Rail Vertical Items
    if (this.dom.inventoryItemsGrid) {
      this.dom.inventoryItemsGrid.innerHTML = '';
      const filtered = INVENTORY_ASSETS.filter(a => this.activeCategory === 'all' || a.cat === this.activeCategory);

      filtered.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'inventory-item-card';
        card.title = `Spawn ${asset.name}`;
        card.innerHTML = `
          <div class="item-icon-box">${asset.icon}</div>
          <div class="item-info-col">
            <span class="item-name">${asset.name}</span>
            <span class="item-desc">${asset.desc}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          this.spawnAsset(asset.id);
        });
        this.dom.inventoryItemsGrid.appendChild(card);
      });
    }

    // 2. Bottom Dock Horizontal Spawn Tray
    if (this.dom.dockSpawnTray) {
      this.dom.dockSpawnTray.innerHTML = '';
      INVENTORY_ASSETS.forEach(asset => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'dock-spawn-chip';
        chip.title = `Spawn ${asset.name}`;
        chip.innerHTML = `<span>${asset.icon}</span> <span>${asset.name}</span>`;
        chip.addEventListener('click', () => {
          this.spawnAsset(asset.id);
        });
        this.dom.dockSpawnTray.appendChild(chip);
      });
    }
  }

  spawnAsset(assetId) {
    const spawned = this.sceneManager.inventory.spawnEntity(assetId);
    if (spawned) {
      this._updateEntityCount();
      this.setInteractionMode(INTERACTION_MODES.OBJECT_MANIPULATE);
      this._updateInspector(spawned);
      this.speechManager.playChime('grab');
      this.speechManager.speak(`Spawned ${spawned.name}.`);
    }
  }

  _updateEntityCount() {
    const count = this.sceneManager.inventory.getEntityCount();
    if (this.dom.dockEntityCount) {
      this.dom.dockEntityCount.textContent = `ENTITIES: ${count}`;
    }
  }

  // =========================================================================
  // SELECTED ENTITY TELEMETRY INSPECTOR
  // =========================================================================

  _updateInspector(targetObj) {
    if (!targetObj) return;

    const name = targetObj.name || 'Holographic Target';
    const isCore = targetObj === this.sceneManager.jarvisCore.root;

    if (this.dom.hudObjectVal) this.dom.hudObjectVal.textContent = name;
    if (this.dom.inspectorCategoryTag) {
      this.dom.inspectorCategoryTag.textContent = isCore ? 'CENTRAL MECHANISM' : 'SPATIAL ENTITY';
    }

    // Position coordinates
    if (this.dom.hudTargetX) this.dom.hudTargetX.textContent = targetObj.position.x.toFixed(2);
    if (this.dom.hudTargetY) this.dom.hudTargetY.textContent = targetObj.position.y.toFixed(2);
    if (this.dom.hudTargetZ) this.dom.hudTargetZ.textContent = targetObj.position.z.toFixed(2);

    // Rotation readout (degrees)
    if (this.dom.hudTargetRot) {
      const toDeg = 180 / Math.PI;
      const rx = ((targetObj.rotation.x * toDeg) % 360 + 360) % 360;
      const ry = ((targetObj.rotation.y * toDeg) % 360 + 360) % 360;
      const rz = ((targetObj.rotation.z * toDeg) % 360 + 360) % 360;
      this.dom.hudTargetRot.textContent = `R: ${rx.toFixed(0)}° | P: ${ry.toFixed(0)}° | Y: ${rz.toFixed(0)}°`;
    }

    // Scale readout
    if (this.dom.hudTargetScale) {
      this.dom.hudTargetScale.textContent = `${targetObj.scale.x.toFixed(2)}x`;
    }

    // Toggle delete button availability (can't delete central core)
    if (this.dom.actionDeleteBtn) {
      this.dom.actionDeleteBtn.style.display = isCore ? 'none' : 'inline-block';
    }
    if (this.dom.actionCloneBtn) {
      this.dom.actionCloneBtn.style.display = isCore ? 'none' : 'inline-block';
    }
  }

  _onGestureTriggered(action, target) {
    if (action === 'GRAB') {
      this.speechManager.playChime('grab');
    } else if (action === 'RELEASE') {
      this.speechManager.playChime('release');
    } else if (action === 'BURST') {
      this.speechManager.playChime('burst');
      this.speechManager.speak('Radial energy pulse triggered!');
    } else if (action === 'FREEZE') {
      this.speechManager.playChime('select');
      this.speechManager.speak('Core manipulation frozen.');
    } else if (action === 'UNFREEZE') {
      this.speechManager.playChime('release');
    }
  }

  // =========================================================================
  // CAMERA & MEDIAPIPE TRACKING PIPELINE
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
        this.dom.loadingMessage.textContent = message.toUpperCase();
      });

      this.dom.loadingMessage.textContent = 'CONNECTING OPTICAL SCANNER...';
      await this.camera.start();

      const rect = this.dom.cameraStage.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);

      this._hideOverlay(this.dom.loadingOverlay);
      this.isRunning = true;
      this.telemetry.reset();
      this.detector.resetCounters();
      this.videoScheduler.start();

      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
      this._updateButtonToStopMode();

      this.dom.pipStatusDot.classList.add('active');
      this.speechManager.speak('Optical scanner connected. Hand tracking active.');

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

    this.interactionController.fsm.forceReset();
    this.dom.screenVirtualCursor.classList.add('hidden');
    this.sceneManager.updateCursor(null);
    this.sceneManager.setHoveredObject(null);

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

  async recoverPipeline() {
    if (this.isRecovering) return;
    this.isRecovering = true;
    console.warn('Initiating controlled optical pipeline recovery...');
    this._showOverlay(this.dom.loadingOverlay);
    this.dom.loadingMessage.textContent = 'RECOVERING OPTICAL PIPELINE...';

    try {
      this.videoScheduler.stop();
      this.camera.stop();

      this.detector.resetCounters();
      this.gestureDetector.needsFilterReset = true;
      this.interactionController.fsm.forceReset();

      await new Promise(r => setTimeout(r, 200));

      await this.camera.start();
      const rect = this.dom.cameraStage.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);

      this.videoScheduler.start();
      this.isRunning = true;
      this._hideOverlay(this.dom.loadingOverlay);
      this._updateStatusBeacon(TRACKING_STATES.TRACKING);
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
   */
  _startRenderLoop() {
    const loop = (timestamp) => {
      const dt = Math.max(0.001, Math.min(0.05, (timestamp - this.lastRenderTime) / 1000.0));
      this.lastRenderTime = timestamp;

      // 1. Tick render telemetry
      this.telemetry.tickRender(timestamp);

      // 2. Continuous 3D mesh interpolation tick
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

    const result = this.detector.detect(this.dom.video, frameTime);
    if (result) {
      const handCount = result.landmarks.length;

      this.telemetry.recordInference(result.inferenceTimeMs, handCount, frameTime);
      this.renderer.render(result.landmarks, result.handedness);

      const gestureFrame = this.gestureDetector.process(
        result.landmarks,
        this.settings.mirrorPreview,
        frameTime
      );
      this.latestGestureFrame = gestureFrame;

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
    const px = cursorCoords.x * window.innerWidth;
    const py = cursorCoords.y * window.innerHeight;

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
      const { interactionState, detectedGesture } = this.latestInteractionStatus;
      this.dom.hudStatePill.textContent = interactionState;

      // Update Inspector coordinates for active target
      const activeObj = this.interactionController.heldObject || this.sceneManager.hoveredObject || this.sceneManager.selectedObject;
      if (activeObj) {
        this._updateInspector(activeObj);
      }

      // Gesture badge
      this.dom.hudGestureVal.textContent = detectedGesture;
      this.dom.hudGestureIcon.textContent = this._getGestureIcon(detectedGesture);

      const hints = {
        [GESTURE_TYPES.PINCH]: 'Grabbing & rotating selected 3D target',
        [GESTURE_TYPES.POINTING]: 'Hover targeting & cursor tracking',
        [GESTURE_TYPES.OPEN_PALM]: 'Radial energy shockwave released',
        [GESTURE_TYPES.FIST]: 'Spatial rotation locked and frozen',
        [GESTURE_TYPES.TWO_HAND_SCALE]: 'Dynamic proportional distance scaling',
        [GESTURE_TYPES.NEUTRAL]: 'Observing spatial workspace'
      };
      if (this.dom.gestureHintText) {
        this.dom.gestureHintText.textContent = hints[detectedGesture] || 'Ready for hand input';
      }
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

    // Automated Watchdog Recovery
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
