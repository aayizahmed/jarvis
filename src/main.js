/**
 * GestureFlow — Reality Engine 3D Sandbox
 * Master Application Coordinator & Performance Decoupler
 * Separates ML inference from 60+ FPS Three.js rendering via VideoFrameScheduler,
 * batches DOM updates, provides real-time diagnostic telemetry, voice guidance,
 * procedural 3D asset spawning, superhero web tethering, and energy projectiles.
 */

import * as THREE from 'three';
import { CameraManager } from './modules/camera.js';
import { HandDetector } from './modules/handDetector.js';
import { LandmarkRenderer } from './modules/landmarkRenderer.js';
import { TelemetryManager } from './modules/telemetry.js';
import { SceneManager, REALITY_TOOLS } from './modules/sceneManager.js';
import { GestureDetector } from './modules/gestureDetector.js';
import { InteractionController } from './modules/interactionController.js';
import { VideoFrameScheduler } from './modules/videoScheduler.js';
import { SpeechManager } from './modules/speechManager.js';
import { INVENTORY_ITEMS, INVENTORY_CATEGORIES } from './modules/inventoryData.js';
import { INTERACTION_STATES } from './modules/gestureStateMachine.js';
import {
  TRACKING_STATES,
  GESTURE_TYPES,
  DEFAULT_SETTINGS
} from './modules/constants.js';

class JarvisRealityStudio {
  constructor() {
    // DOM Element Cache
    this.dom = {
      // Startup Experience Overlay
      startupOverlay: document.getElementById('startupOverlay'),
      startExperienceBtn: document.getElementById('startExperienceBtn'),
      skipIntroBtn: document.getElementById('skipIntroBtn'),

      // Header & Tactical Core
      globalBeacon: document.getElementById('globalBeacon'),
      headerActiveDomainLabel: document.getElementById('headerActiveDomainLabel'),
      mirrorToggleBtn: document.getElementById('mirrorToggleBtn'),
      mirrorBtnLabel: document.getElementById('mirrorBtnLabel'),
      fullscreenBtn: document.getElementById('fullscreenBtn'),
      toggleDiagBtn: document.getElementById('toggleDiagBtn'),
      diagBtnText: document.getElementById('diagBtnText'),
      toggleCameraBtn: document.getElementById('toggleCameraBtn'),
      cameraBtnText: document.getElementById('cameraBtnText'),

      // Reality Tools Matrix
      toolManipulate: document.getElementById('toolManipulate'),
      toolWeb: document.getElementById('toolWeb'),
      toolBlaster: document.getElementById('toolBlaster'),

      // Global Sandbox Controls
      toggleInventoryBtn: document.getElementById('toggleInventoryBtn'),
      inventoryBtnLabel: document.getElementById('inventoryBtnLabel'),
      undoBtn: document.getElementById('undoBtn'),
      clearSceneBtn: document.getElementById('clearSceneBtn'),
      resetSceneBtn: document.getElementById('resetSceneBtn'),

      // First-Use Tutorial Banner
      tutorialBanner: document.getElementById('tutorialBanner'),
      dismissTutorialBtn: document.getElementById('dismissTutorialBtn'),

      // Floating Inventory Drawer
      inventoryDrawer: document.getElementById('inventoryDrawer'),
      closeInventoryBtn: document.getElementById('closeInventoryBtn'),
      inventorySearchInput: document.getElementById('inventorySearchInput'),
      inventoryCatTabs: document.getElementById('inventoryCatTabs'),
      inventoryItemsGrid: document.getElementById('inventoryItemsGrid'),

      // Selected Object Inspector
      objectInspectorCard: document.getElementById('objectInspectorCard'),
      inspectorItemName: document.getElementById('inspectorItemName'),
      inspectorCoords: document.getElementById('inspectorCoords'),
      inspectorPhysicsToggle: document.getElementById('inspectorPhysicsToggle'),
      inspectorDuplicateBtn: document.getElementById('inspectorDuplicateBtn'),
      inspectorWebBtn: document.getElementById('inspectorWebBtn'),
      inspectorDeleteBtn: document.getElementById('inspectorDeleteBtn'),

      // Live Subtitles Bar
      subtitlesBar: document.getElementById('subtitlesBar'),
      subtitlesText: document.getElementById('subtitlesText'),

      // Telemetry Top Right
      perfDegradedTag: document.getElementById('perfDegradedTag'),
      cardRenderFps: document.getElementById('cardRenderFps'),
      cardLatency: document.getElementById('cardLatency'),
      cardHandsCount: document.getElementById('cardHandsCount'),
      hudGestureBadge: document.querySelector('.hud-gesture-badge-compact'),
      hudGestureIcon: document.getElementById('hudGestureIcon'),
      hudGestureVal: document.getElementById('hudGestureVal'),

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

      // 3D Viewport & HUD Elements
      threeCard: document.getElementById('threeCard'),
      threeContainer: document.getElementById('threeCanvasContainer'),
      screenVirtualCursor: document.getElementById('screenVirtualCursor'),
      cursorLabel: document.getElementById('cursorLabel'),

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

      // Tactical Tuning Dock (if present)
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

    // Active UI states
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.isInventoryOpen = true;

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

    // Connect Interaction Controller listeners
    this.interactionController.onTargetSelected = (obj) => {
      this._updateInspector(obj);
    };

    this.interactionController.onGestureTriggered = (action, obj) => {
      this._onGestureAction(action, obj);
    };

    // Render Initial Inventory Catalog
    this._renderInventoryGrid();

    // Start 60+ FPS Three.js rendering loop immediately
    this._startRenderLoop();
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  _bindEvents() {
    // 1. Startup Experience
    if (this.dom.startExperienceBtn) {
      this.dom.startExperienceBtn.addEventListener('click', () => this.dismissStartup(true));
    }
    if (this.dom.skipIntroBtn) {
      this.dom.skipIntroBtn.addEventListener('click', () => this.dismissStartup(false));
    }

    // 2. Tutorial Banner Dismiss
    if (this.dom.dismissTutorialBtn) {
      this.dom.dismissTutorialBtn.addEventListener('click', () => {
        if (this.dom.tutorialBanner) this.dom.tutorialBanner.classList.add('hidden');
      });
    }

    // 3. Tool Matrix Buttons
    const tools = [
      { el: this.dom.toolManipulate, tool: REALITY_TOOLS.MANIPULATE },
      { el: this.dom.toolWeb, tool: REALITY_TOOLS.WEB_SHOOTER },
      { el: this.dom.toolBlaster, tool: REALITY_TOOLS.ENERGY_BLASTER }
    ];

    tools.forEach(({ el, tool }) => {
      if (el) {
        el.addEventListener('click', () => this.setActiveTool(tool));
      }
    });

    // 4. Inventory Drawer Toggle
    if (this.dom.toggleInventoryBtn) {
      this.dom.toggleInventoryBtn.addEventListener('click', () => this.toggleInventory());
    }
    if (this.dom.closeInventoryBtn) {
      this.dom.closeInventoryBtn.addEventListener('click', () => this.toggleInventory(false));
    }

    // 5. Inventory Search & Category Tabs
    if (this.dom.inventorySearchInput) {
      this.dom.inventorySearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this._renderInventoryGrid();
      });
    }

    if (this.dom.inventoryCatTabs) {
      this.dom.inventoryCatTabs.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this.dom.inventoryCatTabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeCategory = tab.getAttribute('data-cat');
          this._renderInventoryGrid();
        });
      });
    }

    // 6. Sandbox Action Buttons
    if (this.dom.undoBtn) {
      this.dom.undoBtn.addEventListener('click', () => {
        this.sceneManager.undo();
        this.speechManager.playChime('release');
        this.speechManager.speak('Action undone.');
      });
    }

    if (this.dom.clearSceneBtn) {
      this.dom.clearSceneBtn.addEventListener('click', () => {
        this.sceneManager.clearScene();
        this.speechManager.playChime('select');
        this.speechManager.speak('Scene cleared.');
        this._updateInspector(null);
      });
    }

    if (this.dom.resetSceneBtn) {
      this.dom.resetSceneBtn.addEventListener('click', () => {
        this.sceneManager.resetScene();
        this.interactionController.fsm.forceReset();
        this.speechManager.playChime('select');
        this.speechManager.speak('Stage reset to default.');
        this._updateInspector(this.sceneManager.selectedObject);
      });
    }

    // 7. Inspector Actions
    if (this.dom.inspectorDuplicateBtn) {
      this.dom.inspectorDuplicateBtn.addEventListener('click', () => {
        const clone = this.sceneManager.duplicateSelected();
        if (clone) {
          this.speechManager.playChime('select');
          this.speechManager.speak(`Cloned ${clone.name}`);
          this._updateInspector(clone);
        }
      });
    }

    if (this.dom.inspectorWebBtn) {
      this.dom.inspectorWebBtn.addEventListener('click', () => {
        const strand = this.sceneManager.shootWebToSelected();
        if (strand) {
          this.speechManager.playChime('morph');
          this.speechManager.speak('Web strand attached.');
        }
      });
    }

    if (this.dom.inspectorDeleteBtn) {
      this.dom.inspectorDeleteBtn.addEventListener('click', () => {
        this.sceneManager.deleteSelected();
        this.speechManager.playChime('release');
        this._updateInspector(null);
      });
    }

    if (this.dom.inspectorPhysicsToggle) {
      this.dom.inspectorPhysicsToggle.addEventListener('change', (e) => {
        if (this.sceneManager.selectedObject) {
          this.sceneManager.selectedObject.userData.hasInertia = e.target.checked;
        }
      });
    }

    // 8. Keyboard Shortcuts Fallback
    window.addEventListener('keydown', (e) => {
      // Ctrl+Z = Undo
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        this.sceneManager.undo();
        this.speechManager.playChime('release');
      }
      // 'I' = Toggle Inventory
      if (e.key.toLowerCase() === 'i' && !e.target.matches('input')) {
        this.toggleInventory();
      }
      // 'W' = Shoot Web
      if (e.key.toLowerCase() === 'w' && !e.target.matches('input')) {
        this.sceneManager.shootWebToSelected();
      }
      // 'F' or 'Space' = Launch Blaster
      if ((e.key.toLowerCase() === 'f' || e.code === 'Space') && !e.target.matches('input')) {
        this.sceneManager.launchProjectileAtCursor();
      }
      // Delete = Delete selected
      if (e.key === 'Delete' && !e.target.matches('input')) {
        this.sceneManager.deleteSelected();
        this._updateInspector(null);
      }
    });

    // 9. Camera Controls & Overlays
    this.dom.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
    this.dom.splashStartBtn.addEventListener('click', () => this.toggleCamera());

    this.dom.errorRetryBtn.addEventListener('click', () => {
      this._hideOverlay(this.dom.errorOverlay);
      this.startCamera();
    });

    if (this.dom.toggleDiagBtn) {
      this.dom.toggleDiagBtn.addEventListener('click', () => this.toggleDiagnostics());
    }
    if (this.dom.closeDiagBtn) {
      this.dom.closeDiagBtn.addEventListener('click', () => this.toggleDiagnostics(false));
    }
    if (this.dom.diagRecoverBtn) {
      this.dom.diagRecoverBtn.addEventListener('click', () => this.recoverPipeline());
    }

    this.dom.mirrorToggleBtn.addEventListener('click', () => this.toggleMirror());
    this.dom.fullscreenBtn.addEventListener('click', () => {
      this.sceneManager.toggleFullscreen(document.documentElement);
    });

    this.dom.pipToggleBtn.addEventListener('click', () => {
      const isMin = this.dom.pipWebcamCard.classList.toggle('minimized');
      this.dom.pipToggleBtn.textContent = isMin ? '+' : '−';
    });
  }

  // =========================================================================
  // STARTUP EXPERIENCE
  // =========================================================================

  dismissStartup(withSpeech = true) {
    if (!this.dom.startupOverlay) return;
    this.dom.startupOverlay.classList.add('fading');
    setTimeout(() => {
      this.dom.startupOverlay.style.display = 'none';
    }, 700);

    this.speechManager.playChime('morph');
    if (withSpeech) {
      this.speechManager.speak('Welcome to GestureFlow Reality Engine. Spawn assets or grab objects with natural gestures.');
    }

    if (!this.isRunning) {
      this.startCamera();
    }
  }

  // =========================================================================
  // TOOL SELECTION & INVENTORY DRAWER
  // =========================================================================

  setActiveTool(tool) {
    this.sceneManager.activeTool = tool;

    [this.dom.toolManipulate, this.dom.toolWeb, this.dom.toolBlaster].forEach(btn => {
      if (btn) btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
    });

    this.speechManager.playChime('select');

    if (tool === REALITY_TOOLS.MANIPULATE) {
      this.speechManager.speak('Manipulation mode. Pinch to grab, rotate, and scale.');
    } else if (tool === REALITY_TOOLS.WEB_SHOOTER) {
      this.speechManager.speak('Superhero Web Tether active. Pinch to shoot web strand and pull objects.');
    } else if (tool === REALITY_TOOLS.ENERGY_BLASTER) {
      this.speechManager.speak('Energy Blaster active. Pinch or open palm to launch plasma bolts.');
    }
  }

  toggleInventory(forceState = null) {
    this.isInventoryOpen = forceState !== null ? forceState : !this.isInventoryOpen;
    if (this.dom.inventoryDrawer) {
      this.dom.inventoryDrawer.classList.toggle('collapsed', !this.isInventoryOpen);
    }
    if (this.dom.toggleInventoryBtn) {
      this.dom.toggleInventoryBtn.classList.toggle('active', this.isInventoryOpen);
    }
  }

  _renderInventoryGrid() {
    if (!this.dom.inventoryItemsGrid) return;
    this.dom.inventoryItemsGrid.innerHTML = '';

    const filtered = INVENTORY_ITEMS.filter(item => {
      const matchesCat = (this.activeCategory === 'all') || (item.category === this.activeCategory);
      const matchesQuery = !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery) || item.desc.toLowerCase().includes(this.searchQuery);
      return matchesCat && matchesQuery;
    });

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'inventory-item-card';
      card.innerHTML = `
        <div class="item-card-top">
          <div class="item-icon-box">${item.icon}</div>
          <div class="item-name">${item.name}</div>
        </div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-spawn-btn">SPAWN IN 3D</div>
      `;

      card.addEventListener('click', () => {
        const spawned = this.sceneManager.spawnInventoryItem(item);
        this.speechManager.playChime('select');
        this.speechManager.speak(`Spawned ${item.name}`);
        this._updateInspector(spawned);

        // Auto collapse inventory on small screens if desired
        if (window.innerWidth < 800) {
          this.toggleInventory(false);
        }
      });

      this.dom.inventoryItemsGrid.appendChild(card);
    });
  }

  _updateInspector(obj) {
    if (!this.dom.objectInspectorCard) return;

    if (!obj) {
      this.dom.objectInspectorCard.classList.add('hidden');
      return;
    }

    this.dom.objectInspectorCard.classList.remove('hidden');
    this.dom.inspectorItemName.textContent = obj.name || 'Entity';
    this.dom.inspectorCoords.textContent = `X: ${obj.position.x.toFixed(2)} | Y: ${obj.position.y.toFixed(2)} | Z: ${obj.position.z.toFixed(2)}`;

    if (this.dom.inspectorPhysicsToggle && obj.userData) {
      this.dom.inspectorPhysicsToggle.checked = !!obj.userData.hasInertia;
    }
  }

  _onGestureAction(action, obj) {
    if (action === 'GRAB') {
      this.speechManager.playChime('grab');
    } else if (action === 'RELEASE') {
      this.speechManager.playChime('release');
    } else if (action === 'BURST') {
      this.speechManager.playChime('burst');
      // If blaster tool is active, launch plasma bolt
      if (this.sceneManager.activeTool === REALITY_TOOLS.ENERGY_BLASTER) {
        this.sceneManager.launchProjectileAtCursor();
      } else if (this.sceneManager.activeTool === REALITY_TOOLS.WEB_SHOOTER) {
        this.sceneManager.shootWebToSelected();
      }
    }
  }

  // =========================================================================
  // CORE CAMERA & TRACKING PIPELINE
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
        this.dom.loadingMessage.textContent = message.toUpperCase();
      });

      this.dom.loadingMessage.textContent = 'CONNECTING OPTICAL SENSOR...';
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
    this.dom.hudGestureVal.textContent = 'STANDBY';
  }

  async recoverPipeline() {
    if (this.isRecovering) return;
    this.isRecovering = true;
    console.warn('Initiating optical pipeline recovery...');
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

    // Gesture badge
    if (this.latestInteractionStatus) {
      const { detectedGesture } = this.latestInteractionStatus;
      this.dom.hudGestureVal.textContent = detectedGesture;
      this.dom.hudGestureIcon.textContent = this._getGestureIcon(detectedGesture);

      // Realtime coords update for inspector if object is selected
      if (this.sceneManager.selectedObject) {
        const p = this.sceneManager.selectedObject.position;
        this.dom.inspectorCoords.textContent = `X: ${p.x.toFixed(2)} | Y: ${p.y.toFixed(2)} | Z: ${p.z.toFixed(2)}`;
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

    // Automated Watchdog Recovery
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

// Bootstrap Reality Engine studio on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.realityStudio = new JarvisRealityStudio();
});
