/**
 * GestureFlow — Interactive Science Universe
 * Master Application Coordinator & Performance Decoupler
 * Separates ML inference from 60+ FPS Three.js rendering via VideoFrameScheduler,
 * batches DOM updates, provides real-time diagnostic telemetry, voice guidance,
 * Matter Manipulation morphology, and interactive science discovery modules.
 */

import { CameraManager } from './modules/camera.js';
import { HandDetector } from './modules/handDetector.js';
import { LandmarkRenderer } from './modules/landmarkRenderer.js';
import { TelemetryManager } from './modules/telemetry.js';
import { SceneManager } from './modules/sceneManager.js';
import { GestureDetector } from './modules/gestureDetector.js';
import { InteractionController } from './modules/interactionController.js';
import { VideoFrameScheduler } from './modules/videoScheduler.js';
import { SpeechManager } from './modules/speechManager.js';
import { EDUCATIONAL_CONTENT, ACHIEVEMENTS } from './modules/educationalData.js';
import { MATTER_SHAPES } from './modules/matterEngine.js';
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
      // Startup Experience Overlay
      startupOverlay: document.getElementById('startupOverlay'),
      startExperienceBtn: document.getElementById('startExperienceBtn'),
      skipIntroBtn: document.getElementById('skipIntroBtn'),

      // Header & Tactical Core
      globalBeacon: document.getElementById('globalBeacon'),
      headerActiveDomainLabel: document.getElementById('headerActiveDomainLabel'),
      toggleVoiceBtn: document.getElementById('toggleVoiceBtn'),
      voiceBtnText: document.getElementById('voiceBtnText'),
      achievementsBtn: document.getElementById('achievementsBtn'),
      achievementsBadgeLabel: document.getElementById('achievementsBadgeLabel'),
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

      // Science Modules Tabs
      tabMatter: document.getElementById('tabMatter'),
      tabSolar: document.getElementById('tabSolar'),
      tabAnatomy: document.getElementById('tabAnatomy'),
      tabChemistry: document.getElementById('tabChemistry'),
      tabGeometry: document.getElementById('tabGeometry'),
      tabEarth: document.getElementById('tabEarth'),

      // Contextual Domain Quick Bars
      domainQuickBar: document.getElementById('domainQuickBar'),
      matterChipsGroup: document.getElementById('matterChipsGroup'),
      solarControlsGroup: document.getElementById('solarControlsGroup'),
      chipCloud: document.getElementById('chipCloud'),
      chipSphere: document.getElementById('chipSphere'),
      chipCube: document.getElementById('chipCube'),
      chipTorus: document.getElementById('chipTorus'),
      chipGalaxy: document.getElementById('chipGalaxy'),
      chipSolarSys: document.getElementById('chipSolarSys'),

      // Solar Speed Buttons
      speed1x: document.getElementById('speed1x'),
      speed2x: document.getElementById('speed2x'),
      speed5x: document.getElementById('speed5x'),
      speedPause: document.getElementById('speedPause'),

      // Educational HUD Card
      educationalHudCard: document.getElementById('educationalHudCard'),
      hudCategoryLabel: document.getElementById('hudCategoryLabel'),
      hudStatePill: document.getElementById('hudStatePill'),
      hudObjectVal: document.getElementById('hudObjectVal'),
      hudObjectDesc: document.getElementById('hudObjectDesc'),
      educationalMetricsGrid: document.getElementById('educationalMetricsGrid'),
      challengeMissionBox: document.getElementById('challengeMissionBox'),
      challengeStatus: document.getElementById('challengeStatus'),
      challengeTitle: document.getElementById('challengeTitle'),
      challengeDesc: document.getElementById('challengeDesc'),
      educationalScaleTag: document.getElementById('educationalScaleTag'),

      hudTargetX: document.getElementById('hudTargetX'),
      hudTargetY: document.getElementById('hudTargetY'),
      hudTargetZ: document.getElementById('hudTargetZ'),
      hudGestureBadge: document.getElementById('hudGestureBadge'),
      hudGestureIcon: document.getElementById('hudGestureIcon'),
      hudGestureVal: document.getElementById('hudGestureVal'),

      // Live Subtitles Bar
      subtitlesBar: document.getElementById('subtitlesBar'),
      subtitlesText: document.getElementById('subtitlesText'),

      // Achievements Modal Dialog
      achievementsModal: document.getElementById('achievementsModal'),
      modalBackdrop: document.getElementById('modalBackdrop'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      closeModalBtn2: document.getElementById('closeModalBtn2'),
      resetProgressBtn: document.getElementById('resetProgressBtn'),
      achievementsGrid: document.getElementById('achievementsGrid'),

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

      // 3D Viewport & HUD Elements
      threeCard: document.getElementById('threeCard'),
      threeContainer: document.getElementById('threeCanvasContainer'),
      screenVirtualCursor: document.getElementById('screenVirtualCursor'),
      cursorLabel: document.getElementById('cursorLabel'),

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

    // Student Exhibition Achievements State
    this.unlockedAchievements = new Set();
    this._loadAchievements();

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

    // Connect Interaction Controller listeners to Educational Engine
    this.interactionController.onTargetSelected = (obj) => {
      this._onObjectInspected(obj);
    };

    this.interactionController.onGestureTriggered = (action, obj) => {
      this._onGestureTriggered(action, obj);
    };

    // Initialize Default Science Module: Matter Manipulation
    this.setScienceModule('matter');
    this._updateAchievementsUI();

    // Start 60+ FPS Three.js rendering loop immediately
    this._startRenderLoop();
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  _bindEvents() {
    // 1. Startup Cinematic Experience
    if (this.dom.startExperienceBtn) {
      this.dom.startExperienceBtn.addEventListener('click', () => this.dismissStartup(true));
    }
    if (this.dom.skipIntroBtn) {
      this.dom.skipIntroBtn.addEventListener('click', () => this.dismissStartup(false));
    }

    // 2. Science Modules Navigation Tabs
    const tabMap = [
      { el: this.dom.tabMatter, mod: 'matter' },
      { el: this.dom.tabSolar, mod: 'solar' },
      { el: this.dom.tabAnatomy, mod: 'anatomy' },
      { el: this.dom.tabChemistry, mod: 'chemistry' },
      { el: this.dom.tabGeometry, mod: 'geometry' },
      { el: this.dom.tabEarth, mod: 'earth' }
    ];

    tabMap.forEach(({ el, mod }) => {
      if (el) {
        el.addEventListener('click', () => this.setScienceModule(mod));
      }
    });

    // 3. Matter Manipulation Morph Chips
    const morphMap = [
      { el: this.dom.chipCloud, shape: MATTER_SHAPES.CLOUD },
      { el: this.dom.chipSphere, shape: MATTER_SHAPES.SPHERE },
      { el: this.dom.chipCube, shape: MATTER_SHAPES.CUBE },
      { el: this.dom.chipTorus, shape: MATTER_SHAPES.TORUS },
      { el: this.dom.chipGalaxy, shape: MATTER_SHAPES.GALAXY },
      { el: this.dom.chipSolarSys, shape: MATTER_SHAPES.SOLAR_SYSTEM }
    ];

    morphMap.forEach(({ el, shape }) => {
      if (el) {
        el.addEventListener('click', () => this.setMatterShape(shape));
      }
    });

    // 4. Solar Simulation Speed Controls
    if (this.dom.speed1x) {
      this.dom.speed1x.addEventListener('click', () => this.setSolarSpeed(1.0, this.dom.speed1x));
    }
    if (this.dom.speed2x) {
      this.dom.speed2x.addEventListener('click', () => this.setSolarSpeed(2.5, this.dom.speed2x));
    }
    if (this.dom.speed5x) {
      this.dom.speed5x.addEventListener('click', () => this.setSolarSpeed(5.0, this.dom.speed5x));
    }
    if (this.dom.speedPause) {
      this.dom.speedPause.addEventListener('click', () => this.setSolarSpeed(0.0, this.dom.speedPause));
    }

    // 5. Voice Guidance Toggle
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

    // 6. Achievements Modal Dialog
    if (this.dom.achievementsBtn) {
      this.dom.achievementsBtn.addEventListener('click', () => this.openAchievementsModal());
    }
    if (this.dom.closeModalBtn) {
      this.dom.closeModalBtn.addEventListener('click', () => this.closeAchievementsModal());
    }
    if (this.dom.closeModalBtn2) {
      this.dom.closeModalBtn2.addEventListener('click', () => this.closeAchievementsModal());
    }
    if (this.dom.modalBackdrop) {
      this.dom.modalBackdrop.addEventListener('click', () => this.closeAchievementsModal());
    }
    if (this.dom.resetProgressBtn) {
      this.dom.resetProgressBtn.addEventListener('click', () => this.resetAchievements());
    }

    // 7. Camera start/stop
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
      this.speechManager.playChime('select');
      this.speechManager.speak('Stage spatial transforms reset.');
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

  // =========================================================================
  // STARTUP EXPERIENCE SEQUENCE
  // =========================================================================

  dismissStartup(withSpeech = true) {
    if (!this.dom.startupOverlay) return;
    this.dom.startupOverlay.classList.add('fading');
    setTimeout(() => {
      this.dom.startupOverlay.style.display = 'none';
    }, 700);

    this.speechManager.playChime('morph');

    if (withSpeech) {
      this.speechManager.speak('Welcome to GestureFlow Science Universe. Your hands control the cosmos.');
    }

    // Auto-engage optical sensors
    if (!this.isRunning) {
      this.startCamera();
    }
  }

  // =========================================================================
  // SCIENCE DOMAIN SWITCHING & EDUCATIONAL HUD
  // =========================================================================

  setScienceModule(moduleId) {
    // 1. Update Tab Bar UI
    const tabs = [this.dom.tabMatter, this.dom.tabSolar, this.dom.tabAnatomy, this.dom.tabChemistry, this.dom.tabGeometry, this.dom.tabEarth];
    tabs.forEach(t => {
      if (t) t.classList.toggle('active', t.getAttribute('data-module') === moduleId);
    });

    // 2. Toggle Contextual Quick Bars
    if (this.dom.matterChipsGroup) {
      this.dom.matterChipsGroup.classList.toggle('hidden', moduleId !== 'matter');
    }
    if (this.dom.solarControlsGroup) {
      this.dom.solarControlsGroup.classList.toggle('hidden', moduleId !== 'solar');
    }

    // 3. Update Scene 3D Environment
    this.sceneManager.setMode(moduleId);

    // 4. Update Header Subtitle
    const domainTitles = {
      matter: 'QUANTUM MATTER MANIPULATION',
      solar: 'HELIOCENTRIC SOLAR SYSTEM EXPLORER',
      anatomy: 'BIOMEDICAL ANATOMY & PHYSIOLOGY',
      chemistry: 'ATOMIC STRUCTURE & DNA DOUBLE HELIX',
      geometry: 'PLATONIC POLYHEDRA & TOPOLOGY',
      earth: 'PLANETARY GEOPHYSICS & BIOMES'
    };
    if (this.dom.headerActiveDomainLabel) {
      this.dom.headerActiveDomainLabel.textContent = domainTitles[moduleId] || 'SCIENCE UNIVERSE';
    }

    // 5. Update Educational HUD Card for initial domain state
    this._updateEducationalCardForModule(moduleId);

    // 6. Audio Feedback & Speech Guidance
    this.speechManager.playChime('select');
    const spokenIntros = {
      matter: 'Matter Manipulation Studio. Pinch to grab, rotate your hand, or open palm to trigger a particle shockwave.',
      solar: 'Solar System Explorer. Point to select any planet, or pinch to inspect.',
      anatomy: 'Human Anatomy Lab. Inspect the beating heart, respiratory lungs, and neural cortex.',
      chemistry: 'Atoms and Molecules. Examine quantized electron shells, bond geometries, and DNA.',
      geometry: 'Geometry Lab. Rotate regular Platonic polyhedra and verify Euler\'s formula.',
      earth: 'Planetary Earth Explorer. Rotate the globe and explore geographic hotspots.'
    };
    if (spokenIntros[moduleId]) {
      this.speechManager.speak(spokenIntros[moduleId]);
    }
  }

  setMatterShape(shapeKey) {
    if (!this.sceneManager.matterEngine) return;
    this.sceneManager.matterEngine.morphTo(shapeKey);
    this.speechManager.playChime('morph');

    // Update active chip UI
    const chips = [this.dom.chipCloud, this.dom.chipSphere, this.dom.chipCube, this.dom.chipTorus, this.dom.chipGalaxy, this.dom.chipSolarSys];
    chips.forEach(c => {
      if (c) c.classList.toggle('active', c.getAttribute('data-shape') === shapeKey);
    });

    // Update fact card
    const shapeInfo = EDUCATIONAL_CONTENT.matter.shapes[shapeKey];
    if (shapeInfo) {
      this.dom.hudObjectVal.textContent = shapeInfo.name;
      this.dom.hudObjectDesc.textContent = shapeInfo.desc;
      this.dom.hudCategoryLabel.textContent = 'QUANTUM MORPHOLOGY';

      this._renderMetrics(shapeInfo.stats);
    }

    // Check challenge: Morph into Spiral Galaxy
    if (shapeKey === MATTER_SHAPES.GALAXY) {
      this._unlockAchievement('matter_morph_galaxy');
    }
  }

  setSolarSpeed(speed, activeBtn) {
    if (this.sceneManager.scienceModules && this.sceneManager.scienceModules.moduleStates.solar) {
      const s = this.sceneManager.scienceModules.moduleStates.solar;
      s.speedMultiplier = speed;
      s.paused = (speed === 0);
    }
    [this.dom.speed1x, this.dom.speed2x, this.dom.speed5x, this.dom.speedPause].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
    this.speechManager.playChime('select');
  }

  _updateEducationalCardForModule(moduleId) {
    const data = EDUCATIONAL_CONTENT[moduleId];
    if (!data) return;

    this.dom.hudCategoryLabel.textContent = data.subtitle;
    this.dom.hudObjectVal.textContent = data.title;
    this.dom.hudObjectDesc.textContent = data.intro;

    // Challenge Box
    if (data.challenge) {
      this.dom.challengeTitle.textContent = data.challenge.title;
      this.dom.challengeDesc.textContent = data.challenge.description;
      const isDone = this.unlockedAchievements.has(data.challenge.id);
      this.dom.challengeStatus.textContent = isDone ? 'COMPLETED' : 'INCOMPLETE';
      this.dom.challengeStatus.className = isDone ? 'challenge-status completed' : 'challenge-status';
    }

    // Scale tag visibility
    if (this.dom.educationalScaleTag) {
      this.dom.educationalScaleTag.style.display = (moduleId === 'solar' || moduleId === 'chemistry') ? 'block' : 'none';
    }

    // Default facts
    if (data.facts) {
      const metricObj = {};
      data.facts.forEach(f => { metricObj[f.label] = f.value; });
      this._renderMetrics(metricObj);
    } else {
      this._renderMetrics({ 'STATUS': 'Select an object in 3D to inspect detailed scientific telemetry' });
    }
  }

  _onObjectInspected(obj) {
    if (!obj || !obj.name) return;
    const name = obj.name;
    const moduleId = this.sceneManager.activeModuleId;
    const data = EDUCATIONAL_CONTENT[moduleId];
    if (!data) return;

    let foundInfo = null;

    if (moduleId === 'solar' && data.planets && data.planets[name]) {
      foundInfo = data.planets[name];
      this.dom.hudCategoryLabel.textContent = foundInfo.type || 'CELESTIAL BODY';
      this.dom.hudObjectVal.textContent = foundInfo.name;
      this.dom.hudObjectDesc.textContent = foundInfo.funFact || '';
      this._renderMetrics({
        'DIAMETER': foundInfo.diameter,
        'ORBIT DISTANCE': foundInfo.distance,
        'ORBITAL PERIOD': foundInfo.period,
        'TEMPERATURE': foundInfo.temp
      });

      // Challenge check: inspect Saturn
      if (name === 'Saturn') {
        this._unlockAchievement('solar_inspect_saturn');
      }

    } else if (moduleId === 'anatomy' && data.organs && data.organs[name]) {
      foundInfo = data.organs[name];
      this.dom.hudCategoryLabel.textContent = foundInfo.system || 'ORGAN';
      this.dom.hudObjectVal.textContent = foundInfo.name;
      this.dom.hudObjectDesc.textContent = `${foundInfo.function} ${foundInfo.funFact}`;
      this._renderMetrics({
        'RATE / SPEED': foundInfo.rate || foundInfo.power || 'Dynamic',
        'PHYSIOLOGY': foundInfo.volume || foundInfo.neurons || foundInfo.surfaceArea || 'Vital'
      });

      // Challenge check: inspect Heart
      if (name === 'Human Heart') {
        this._unlockAchievement('anatomy_inspect_heart');
      }

    } else if (moduleId === 'chemistry') {
      const chemData = data.models[name] || data.models['Water Molecule'];
      if (chemData) {
        this.dom.hudCategoryLabel.textContent = chemData.geometry || 'MOLECULAR STRUCTURE';
        this.dom.hudObjectVal.textContent = chemData.name;
        this.dom.hudObjectDesc.textContent = chemData.funFact || chemData.elements || '';
        this._renderMetrics({
          'BOND ANGLE': chemData.bondAngle || chemData.pitch || 'Quantized',
          'BOND TYPE': chemData.bondType || chemData.basePairs || 'Covalent'
        });
      }

      // Challenge check: select oxygen atom
      if (name === 'Oxygen Atom' || (obj.parent && obj.parent.name === 'Water Molecule')) {
        this._unlockAchievement('chemistry_select_oxygen');
      }

    } else if (moduleId === 'geometry' && data.solids && data.solids[name]) {
      foundInfo = data.solids[name];
      this.dom.hudCategoryLabel.textContent = foundInfo.symmetry || 'PLATONIC SOLID';
      this.dom.hudObjectVal.textContent = foundInfo.name;
      this.dom.hudObjectDesc.textContent = `${foundInfo.euler} — ${foundInfo.funFact}`;
      this._renderMetrics({
        'FACES (F)': `${foundInfo.faces}`,
        'VERTICES (V)': `${foundInfo.vertices}`,
        'EDGES (E)': `${foundInfo.edges}`,
        'EULER (V-E+F)': '2'
      });

      // Challenge check: Icosahedron
      if (name === 'Icosahedron') {
        this._unlockAchievement('geometry_inspect_icosahedron');
      }

    } else if (moduleId === 'earth' && data.hotspots && data.hotspots[name]) {
      foundInfo = data.hotspots[name];
      this.dom.hudCategoryLabel.textContent = foundInfo.region || 'GEOGRAPHIC HOTSPOT';
      this.dom.hudObjectVal.textContent = foundInfo.name;
      this.dom.hudObjectDesc.textContent = foundInfo.funFact;
      this._renderMetrics({
        'COORDINATES': foundInfo.coords,
        'METRIC': foundInfo.depth || foundInfo.elevation || foundInfo.area || foundInfo.length
      });

      // Challenge check: Mariana Trench
      if (name === 'Mariana Trench') {
        this._unlockAchievement('earth_locate_mariana');
      }
    }
  }

  _renderMetrics(statsObj) {
    if (!this.dom.educationalMetricsGrid) return;
    this.dom.educationalMetricsGrid.innerHTML = '';
    if (!statsObj) return;

    Object.entries(statsObj).forEach(([k, v]) => {
      const item = document.createElement('div');
      item.className = 'edu-metric-item';
      item.innerHTML = `
        <span class="metric-key">${k.toUpperCase()}</span>
        <span class="metric-val text-cyan">${v}</span>
      `;
      this.dom.educationalMetricsGrid.appendChild(item);
    });
  }

  _onGestureTriggered(action, target) {
    if (action === 'GRAB') {
      this.speechManager.playChime('grab');
    } else if (action === 'RELEASE') {
      this.speechManager.playChime('release');
    } else if (action === 'BURST') {
      this.speechManager.playChime('burst');
      this.speechManager.speak('Particle energy shockwave triggered!');
    } else if (action === 'FREEZE') {
      this.speechManager.playChime('select');
      this.speechManager.speak('Matter arrangement frozen.');
    } else if (action === 'UNFREEZE') {
      this.speechManager.playChime('release');
    }
  }

  // =========================================================================
  // ACHIEVEMENTS & PROGRESS SYSTEM
  // =========================================================================

  _loadAchievements() {
    try {
      const stored = localStorage.getItem('gestureflow_achievements');
      if (stored) {
        this.unlockedAchievements = new Set(JSON.parse(stored));
      }
    } catch (e) {
      this.unlockedAchievements = new Set();
    }
  }

  _saveAchievements() {
    try {
      localStorage.setItem('gestureflow_achievements', JSON.stringify([...this.unlockedAchievements]));
    } catch (e) {
      // Local storage fallback
    }
  }

  _unlockAchievement(id) {
    if (this.unlockedAchievements.has(id)) return;
    this.unlockedAchievements.add(id);
    this._saveAchievements();
    this._updateAchievementsUI();

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      this.speechManager.playChime('achievement');
      this.speechManager.speak(`Discovery complete! Unlocked ${ach.title}.`);

      // Update active challenge card status
      if (this.dom.challengeStatus) {
        this.dom.challengeStatus.textContent = 'COMPLETED';
        this.dom.challengeStatus.className = 'challenge-status completed';
      }
    }
  }

  _updateAchievementsUI() {
    const total = ACHIEVEMENTS.length;
    const count = this.unlockedAchievements.size;
    if (this.dom.achievementsBadgeLabel) {
      this.dom.achievementsBadgeLabel.textContent = `🏆 BADGES ${count}/${total}`;
    }
    this._renderAchievementsGrid();
  }

  _renderAchievementsGrid() {
    if (!this.dom.achievementsGrid) return;
    this.dom.achievementsGrid.innerHTML = '';

    ACHIEVEMENTS.forEach(a => {
      const isUnlocked = this.unlockedAchievements.has(a.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="achieve-icon-box">${isUnlocked ? a.icon : '🔒'}</div>
        <div class="achieve-details">
          <div class="achieve-title">${a.title}</div>
          <div class="achieve-desc">${isUnlocked ? a.desc : 'Complete exploration challenge to unlock'}</div>
        </div>
      `;
      this.dom.achievementsGrid.appendChild(card);
    });
  }

  openAchievementsModal() {
    if (!this.dom.achievementsModal) return;
    this._renderAchievementsGrid();
    this.dom.achievementsModal.classList.remove('hidden');
    this.speechManager.playChime('select');
  }

  closeAchievementsModal() {
    if (!this.dom.achievementsModal) return;
    this.dom.achievementsModal.classList.add('hidden');
  }

  resetAchievements() {
    this.unlockedAchievements.clear();
    this._saveAchievements();
    this._updateAchievementsUI();
    this.speechManager.speak('Exhibition progress reset.');
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
      // 1. Initialize MediaPipe HandLandmarker
      await this.detector.initialize(({ message }) => {
        this.dom.loadingMessage.textContent = message.toUpperCase();
      });

      // 2. Start webcam stream
      this.dom.loadingMessage.textContent = 'CONNECTING OPTICAL SENSOR...';
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

      // Coordinates readout
      const activeObj = this.interactionController.heldObject || this.sceneManager.hoveredObject || this.sceneManager.selectedObject;
      if (activeObj) {
        this.dom.hudTargetX.textContent = activeObj.position.x.toFixed(2);
        this.dom.hudTargetY.textContent = activeObj.position.y.toFixed(2);
        this.dom.hudTargetZ.textContent = activeObj.position.z.toFixed(2);
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
