/**
 * GestureFlow Reality Engine — Three.js Scene Manager
 * Master 3D Sandbox Environment hosting SpawnManager, Superhero WebSystem,
 * Energy ProjectileEngine, PhysicsSimulator, UndoManager & MatterEngine.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MatterEngine, MATTER_SHAPES } from './matterEngine.js';
import { EnergyBeamRenderer } from './energyBeamRenderer.js';
import { ScienceModulesManager } from './scienceModules.js';
import { SpawnManager } from './spawnManager.js';
import { WebSystem } from './webSystem.js';
import { ProjectileEngine } from './projectileEngine.js';
import { PhysicsSimulator } from './physicsSimulator.js';
import { UndoManager } from './undoManager.js';

export const REALITY_TOOLS = {
  MANIPULATE: 'MANIPULATE',
  WEB_SHOOTER: 'WEB_SHOOTER',
  ENERGY_BLASTER: 'ENERGY_BLASTER'
};

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || 800;
    this.height = canvasContainer.clientHeight || 600;

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Zero-GC Math Scratchpad
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._q1 = new THREE.Quaternion();
    this._m1 = new THREE.Matrix4();

    // Camera Navigation Lerp Target
    this.targetCameraPos = new THREE.Vector3(0, 1.4, 6.2);
    this.targetCameraLookAt = new THREE.Vector3(0, 0.3, 0);

    // Interactive Meshes for Raycasting
    this.interactiveObjects = [];

    // Ambient Dust Particles
    this.particles = null;

    // Initial state storage for instant scene reset
    this.initialTransforms = new Map();

    // JARVIS Holographic Reticle / Cursor
    this.virtualCursor3D = null;
    this.reticleOuter = null;
    this.reticleInner = null;

    // Object targeting states
    this.hoveredObject = null;
    this.selectedObject = null;

    // Reality Engine Subsystems
    this.spawnManager = null;
    this.webSystem = null;
    this.projectileEngine = null;
    this.physicsSimulator = null;
    this.undoManager = null;
    this.matterEngine = null;
    this.energyBeam = null;
    this.scienceModules = null;

    // Active Sandbox Tool
    this.activeTool = REALITY_TOOLS.MANIPULATE;
    this.activeModuleId = 'sandbox';

    this.clock = new THREE.Clock();

    this._init();
  }

  _init() {
    // 1. Scene with Deep Midnight Space & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03060c);
    this.scene.fog = new THREE.FogExp2(0x03060c, 0.028);

    // 2. Camera Setup (Optimized FOV for spatial manipulation)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.set(0, 1.4, 6.2);
    this.camera.lookAt(0, 0.3, 0);

    // 3. WebGL Renderer with High-Performance Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Mouse Fallback)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.04;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 28;
    this.controls.target.set(0, 0.3, 0);

    // 5. Lighting Environment
    this._setupLighting();

    // 6. Cybernetic Floor Grid & Ambient Particles
    this._setupEnvironment();

    // 7. Reality Engine Subsystems
    this.spawnManager = new SpawnManager(this.scene);
    this.webSystem = new WebSystem(this.scene);
    this.projectileEngine = new ProjectileEngine(this.scene);
    this.physicsSimulator = new PhysicsSimulator();
    this.undoManager = new UndoManager(this.spawnManager);

    // 8. Signature Matter Manipulation Particle Engine
    this.matterEngine = new MatterEngine(this.scene);
    this.matterEngine.setVisible(false);

    // 9. Holographic Energy Tether Beam
    this.energyBeam = new EnergyBeamRenderer(this.scene);

    // 10. Science Modules Manager
    this.scienceModules = new ScienceModulesManager(this);

    // 11. JARVIS 3D Target Reticle
    this._createJarvisReticle();

    // Spawn default initial sandbox objects so first-time users immediately see content!
    this._spawnDefaultSandboxObjects();

    // 12. Resize listener
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4.5, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0006;
    this.scene.add(keyLight);

    const fillLightCyan = new THREE.PointLight(0x00f0ff, 2.8, 16);
    fillLightCyan.position.set(-5.5, 3.2, 3.0);
    this.scene.add(fillLightCyan);

    const fillLightEmerald = new THREE.PointLight(0x00f59b, 2.5, 16);
    fillLightEmerald.position.set(5.5, 3.2, 3.0);
    this.scene.add(fillLightEmerald);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    rimLight.position.set(0, 5, -8);
    this.scene.add(rimLight);
  }

  _setupEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(24, 32, 0x00f0ff, 0x111c2e);
    gridHelper.position.y = -1.34;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    const particleCount = 140;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 16;
      posArray[i + 1] = Math.random() * 6 - 1;
      posArray[i + 2] = (Math.random() - 0.5) * 12;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);
  }

  _spawnDefaultSandboxObjects() {
    // Spawn 3 default objects: Cube, Arc Sphere, Kyber Crystal
    const cube = this.spawnManager.spawn({
      id: 'shape_cube',
      name: 'Quantum Cube',
      type: 'cube',
      color: 0x00f0ff
    }, new THREE.Vector3(-2.2, 0.4, 0));

    const sphere = this.spawnManager.spawn({
      id: 'shape_sphere',
      name: 'Arc Sphere',
      type: 'sphere',
      color: 0x00f59b
    }, new THREE.Vector3(0, 0.4, 0));

    const crystal = this.spawnManager.spawn({
      id: 'obj_crystal',
      name: 'Kyber Crystal',
      type: 'crystal',
      color: 0xa855f7
    }, new THREE.Vector3(2.2, 0.4, 0));

    this.setSelectedObject(sphere, false);
    this._syncInteractiveObjects();
  }

  _createJarvisReticle() {
    this.virtualCursor3D = new THREE.Group();

    const dotGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.virtualCursor3D.add(new THREE.Mesh(dotGeo, dotMat));

    const innerRingGeo = new THREE.RingGeometry(0.14, 0.17, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.reticleInner = new THREE.Mesh(innerRingGeo, ringMat);
    this.virtualCursor3D.add(this.reticleInner);

    const outerRingGeo = new THREE.RingGeometry(0.24, 0.27, 4, 1, 0.2, 1.1);
    this.reticleOuter = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const segment = new THREE.Mesh(outerRingGeo, ringMat.clone());
      segment.rotation.z = (i * Math.PI) / 2;
      this.reticleOuter.add(segment);
    }
    this.virtualCursor3D.add(this.reticleOuter);

    this.virtualCursor3D.position.set(0, 0.35, 2);
    this.virtualCursor3D.visible = false;
    this.scene.add(this.virtualCursor3D);
  }

  // =========================================================================
  // SANDBOX ACTIONS: SPAWN, DUPLICATE, REMOVE, WEBS, PROJECTILES
  // =========================================================================

  spawnInventoryItem(itemDef) {
    // If spawning particle tools, activate Matter Engine
    if (itemDef.type === 'particle_cloud' || itemDef.type === 'particle_galaxy') {
      this.matterEngine.setVisible(true);
      if (itemDef.type === 'particle_galaxy') {
        this.matterEngine.morphTo(MATTER_SHAPES.GALAXY);
      } else {
        this.matterEngine.morphTo(MATTER_SHAPES.CLOUD);
      }
      this.setSelectedObject(this.matterEngine.root, false);
      this._syncInteractiveObjects();
      return this.matterEngine.root;
    }

    // Spawn 3D entity at center or offset
    const spawnPos = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      0.5 + Math.random() * 0.5,
      (Math.random() - 0.5) * 0.8
    );
    const obj = this.spawnManager.spawn(itemDef, spawnPos);
    this.undoManager.record('SPAWN', { object: obj });
    this.setSelectedObject(obj, false);
    this._syncInteractiveObjects();
    return obj;
  }

  duplicateSelected() {
    if (!this.selectedObject || !this.selectedObject.userData.isRealityObject) return null;
    const clone = this.spawnManager.duplicate(this.selectedObject);
    if (clone) {
      this.undoManager.record('SPAWN', { object: clone });
      this.setSelectedObject(clone, false);
      this._syncInteractiveObjects();
    }
    return clone;
  }

  deleteSelected() {
    if (!this.selectedObject || !this.selectedObject.userData.isRealityObject) return;
    const obj = this.selectedObject;
    this.undoManager.record('DELETE', {
      itemDef: obj.userData.itemDef,
      position: obj.position.clone()
    });
    this.spawnManager.remove(obj);
    this.selectedObject = null;
    this.hoveredObject = null;
    this._syncInteractiveObjects();
  }

  undo() {
    const undone = this.undoManager.undo();
    this._syncInteractiveObjects();
    return undone;
  }

  clearScene() {
    this.spawnManager.clearAll();
    this.webSystem.clearAll();
    this.projectileEngine.clearAll();
    this.matterEngine.setVisible(false);
    this.scienceModules.clearActiveModule();
    this.selectedObject = null;
    this.hoveredObject = null;
    this.energyBeam.hide();
    this.undoManager.clear();
    this._syncInteractiveObjects();
  }

  shootWebToSelected() {
    if (!this.selectedObject || !this.virtualCursor3D) return null;
    const strand = this.webSystem.shootWeb(this.virtualCursor3D.position, this.selectedObject);
    return strand;
  }

  launchProjectileAtCursor() {
    if (!this.virtualCursor3D) return null;
    const origin = this.virtualCursor3D.position.clone();
    origin.z -= 0.2;
    // Launch forward along camera view vector
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const bolt = this.projectileEngine.launch(origin, dir, 0x00f0ff);
    return bolt;
  }

  _syncInteractiveObjects() {
    const list = [...this.spawnManager.spawnedObjects];
    if (this.matterEngine && this.matterEngine.root.visible) {
      list.push(this.matterEngine.root);
    }
    if (this.scienceModules && this.scienceModules.interactiveObjects.length > 0) {
      list.push(...this.scienceModules.interactiveObjects);
    }
    this.interactiveObjects = list;
  }

  setMode(moduleId) {
    this.activeModuleId = moduleId;
    this.energyBeam.hide();
    this.hoveredObject = null;
    this.selectedObject = null;

    if (moduleId === 'sandbox') {
      this.matterEngine.setVisible(false);
      this.scienceModules.clearActiveModule();
      this.spawnManager.rootGroup.visible = true;
      this.targetCameraPos.set(0, 1.4, 6.2);
      this.targetCameraLookAt.set(0, 0.3, 0);

    } else if (moduleId === 'matter') {
      this.spawnManager.rootGroup.visible = false;
      this.scienceModules.clearActiveModule();
      this.matterEngine.setVisible(true);
      this.targetCameraPos.set(0, 1.2, 5.8);
      this.targetCameraLookAt.set(0, 0.1, 0);

    } else {
      this.spawnManager.rootGroup.visible = false;
      this.matterEngine.setVisible(false);
      this.scienceModules.activateModule(moduleId);

      switch (moduleId) {
        case 'solar':
          this.targetCameraPos.set(0, 9.5, 17.0);
          this.targetCameraLookAt.set(0, 0, 0);
          break;
        case 'anatomy':
          this.targetCameraPos.set(0, 0.8, 5.4);
          this.targetCameraLookAt.set(0, 0.4, 0);
          break;
        case 'chemistry':
          this.targetCameraPos.set(0, 1.0, 6.2);
          this.targetCameraLookAt.set(0, 0.4, 0);
          break;
        case 'geometry':
          this.targetCameraPos.set(0, 1.0, 6.8);
          this.targetCameraLookAt.set(0, 0.4, 0);
          break;
        case 'earth':
          this.targetCameraPos.set(0, 0.8, 5.5);
          this.targetCameraLookAt.set(0, 0, 0);
          break;
      }
    }

    this._syncInteractiveObjects();
    if (this.interactiveObjects.length > 0) {
      this.setSelectedObject(this.interactiveObjects[0], false);
    }
  }

  // =========================================================================
  // CURSOR & SELECTION HIGHLIGHTS
  // =========================================================================

  updateCursor(worldPoint, state = 'HOVER') {
    if (!worldPoint) {
      this.virtualCursor3D.visible = false;
      this.energyBeam.hide();
      return;
    }

    this.virtualCursor3D.visible = true;
    this.virtualCursor3D.position.copy(worldPoint);
    this.virtualCursor3D.quaternion.copy(this.camera.quaternion);

    const innerMat = this.reticleInner.material;
    if (state === 'GRABBING' || state === 'GRAB' || state === 'DRAGGING') {
      innerMat.color.setHex(0x00f59b);
      this.virtualCursor3D.scale.set(1.25, 1.25, 1.25);

      if (this.selectedObject) {
        this.energyBeam.update(worldPoint, this.selectedObject.position, this.clock.getElapsedTime());
      }
    } else if (state === 'SCALING') {
      innerMat.color.setHex(0xffb800);
      this.virtualCursor3D.scale.set(1.4, 1.4, 1.4);
      if (this.selectedObject) {
        this.energyBeam.update(worldPoint, this.selectedObject.position, this.clock.getElapsedTime());
      }
    } else if (state === 'FROZEN') {
      innerMat.color.setHex(0xa855f7);
      this.virtualCursor3D.scale.set(1.0, 1.0, 1.0);
      this.energyBeam.hide();
    } else {
      innerMat.color.setHex(0x00f0ff);
      this.virtualCursor3D.scale.set(1.0, 1.0, 1.0);
      this.energyBeam.hide();
    }
  }

  setHoveredObject(obj) {
    if (this.hoveredObject === obj) return;

    if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
      this._applyVisualState(this.hoveredObject, 'DEFAULT');
    }

    this.hoveredObject = obj;
    if (this.hoveredObject && this.hoveredObject !== this.selectedObject) {
      this._applyVisualState(this.hoveredObject, 'HOVERED');
    }
  }

  setSelectedObject(obj, isGrabbed = false) {
    if (this.selectedObject && this.selectedObject !== obj) {
      this._applyVisualState(this.selectedObject, 'DEFAULT');
    }

    this.selectedObject = obj;
    if (this.selectedObject) {
      this._applyVisualState(this.selectedObject, isGrabbed ? 'GRABBED' : 'HOVERED');
    }
  }

  _applyVisualState(obj, state) {
    if (!obj) return;

    const applyToMesh = (m) => {
      if (m.material && m.material.emissive) {
        if (state === 'GRABBED') {
          m.material.emissive.setHex(obj.userData.accentColor || 0x00f59b);
          m.material.emissiveIntensity = 0.65;
        } else if (state === 'HOVERED') {
          m.material.emissive.setHex(obj.userData.accentColor || 0x00f0ff);
          m.material.emissiveIntensity = 0.38;
        } else {
          m.material.emissive.setHex(0x000000);
          m.material.emissiveIntensity = 0;
        }
      }
    };

    if (obj.isMesh) {
      applyToMesh(obj);
    } else if (obj.children) {
      obj.children.forEach(c => {
        if (c.isMesh) applyToMesh(c);
      });
    }
  }

  resetScene() {
    this.clearScene();
    this._spawnDefaultSandboxObjects();
    this.controls.target.set(0, 0.3, 0);
    this.camera.position.set(0, 1.4, 6.2);
    this.controls.update();
  }

  // =========================================================================
  // MAIN RENDER LOOP (Decoupled 60+ FPS)
  // =========================================================================

  render() {
    const elapsed = this.clock.getElapsedTime();
    const dt = Math.max(0.001, Math.min(0.05, this.clock.getDelta() || 0.016));

    // Smooth camera target lerp
    this.camera.position.lerp(this.targetCameraPos, 0.045);
    this.controls.target.lerp(this.targetCameraLookAt, 0.045);

    const cursorPos = this.virtualCursor3D && this.virtualCursor3D.visible ? this.virtualCursor3D.position : null;

    // 1. Step virtual physics simulator
    this.physicsSimulator.step(dt, this.spawnManager.spawnedObjects, this.selectedObject);

    // 2. Update superhero web system
    this.webSystem.update(dt, cursorPos, elapsed);

    // 3. Update energy projectiles
    this.projectileEngine.update(dt, this.spawnManager.spawnedObjects);

    // 4. Update procedural spawned entities
    this.spawnManager.update(dt, elapsed);

    // 5. Update matter particle engine
    if (this.matterEngine && this.matterEngine.root.visible) {
      this.matterEngine.update(dt, elapsed);
    }

    // 6. Update science modules
    if (this.scienceModules && this.activeModuleId !== 'sandbox' && this.activeModuleId !== 'matter') {
      this.scienceModules.update(dt, elapsed);
    }

    // 7. Reticle ring rotations
    if (this.virtualCursor3D && this.virtualCursor3D.visible) {
      this.reticleInner.rotation.z += 0.025;
      this.reticleOuter.rotation.z -= 0.015;
    }

    // 8. Ambient dust drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.018;
    }

    // 9. Orbit controls update
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 600;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  toggleFullscreen(element) {
    if (!document.fullscreenElement) {
      (element || this.container).requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  }
}
