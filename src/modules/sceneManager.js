/**
 * GestureFlow — Interactive Science Universe
 * Three.js Scene Manager with Cinematic Holographic Aesthetics, Zero-GC Math,
 * Matter Manipulation Engine, Science Modules Manager & Holographic Energy Tether.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MatterEngine, MATTER_SHAPES } from './matterEngine.js';
import { EnergyBeamRenderer } from './energyBeamRenderer.js';
import { ScienceModulesManager } from './scienceModules.js';

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

    // Pre-allocated Zero-GC Math Scratchpad
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._q1 = new THREE.Quaternion();
    this._m1 = new THREE.Matrix4();

    // Camera Navigation Lerp Target
    this.targetCameraPos = new THREE.Vector3(0, 1.2, 5.8);
    this.targetCameraLookAt = new THREE.Vector3(0, 0.2, 0);

    // Interactive Meshes for Raycasting
    this.interactiveObjects = [];
    this.defaultShapesGroup = new THREE.Group();
    this.cube = null;
    this.sphere = null;
    this.torus = null;

    // Ambient Holographic Dust Particles
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

    // Specialized Sub-Engines
    this.matterEngine = null;
    this.energyBeam = null;
    this.scienceModules = null;
    this.activeModuleId = 'matter';

    this.clock = new THREE.Clock();

    this._init();
  }

  _init() {
    // 1. Scene with Deep Midnight Space & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060a);
    this.scene.fog = new THREE.FogExp2(0x04060a, 0.032);

    // 2. Camera Setup (Optimized FOV for spatial manipulation)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.8);
    this.camera.lookAt(0, 0.2, 0);

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
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Mouse Fallback)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.04;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 28;
    this.controls.target.set(0, 0.2, 0);

    // 5. Lighting Environment
    this._setupLighting();

    // 6. Cybernetic Floor Grid & Holographic Particles
    this._setupEnvironment();

    // 7. Signature Feature: Matter Manipulation Particle Engine
    this.matterEngine = new MatterEngine(this.scene);

    // 8. Holographic Energy Tether Beam
    this.energyBeam = new EnergyBeamRenderer(this.scene);

    // 9. Science Modules Manager (Solar System, Anatomy, Chemistry, Geometry, Earth)
    this.scienceModules = new ScienceModulesManager(this);

    // 10. Default Legacy Shapes (Preserved for compatibility)
    this._createLegacyObjects();

    // 11. JARVIS 3D Target Reticle
    this._createJarvisReticle();

    // Set initial mode to Matter Manipulation Studio
    this.setMode('matter');

    // 12. Resize listener
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    // Subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Main Directional Key Light with soft shadow
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4.5, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -6.5;
    keyLight.shadow.camera.right = 6.5;
    keyLight.shadow.camera.top = 6.5;
    keyLight.shadow.camera.bottom = -6.5;
    keyLight.shadow.bias = -0.0006;
    this.scene.add(keyLight);

    // Ice-Blue Tactical Fill Light (Left)
    const fillLightCyan = new THREE.PointLight(0x00f0ff, 2.8, 16);
    fillLightCyan.position.set(-5.5, 3.2, 3.0);
    this.scene.add(fillLightCyan);

    // Electric Emerald Accent Light (Right)
    const fillLightEmerald = new THREE.PointLight(0x00f59b, 2.5, 16);
    fillLightEmerald.position.set(5.5, 3.2, 3.0);
    this.scene.add(fillLightEmerald);

    // Violet Rim Light (Rear)
    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    rimLight.position.set(0, 5, -8);
    this.scene.add(rimLight);
  }

  _setupEnvironment() {
    // Shadow Receiver Ground Plane
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Fine Technical Perspective Grid
    const gridHelper = new THREE.GridHelper(24, 32, 0x00f0ff, 0x111c2e);
    gridHelper.position.y = -1.34;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Ambient Floating Cosmic Dust
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

  _createLegacyObjects() {
    this.defaultShapesGroup.name = 'Legacy Shapes Group';
    this.scene.add(this.defaultShapesGroup);

    // Quantum Cube
    const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 2, 2, 2);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x162032,
      metalness: 0.75,
      roughness: 0.22,
      clearcoat: 0.5
    });
    this.cube = new THREE.Mesh(cubeGeo, cubeMat);
    this.cube.name = 'Quantum Cube';
    this.cube.position.set(-2.8, 0.35, 0);
    this.cube.userData = { defaultColor: 0x162032, accentColor: 0x00f0ff, baseScale: new THREE.Vector3(1, 1, 1) };
    this.defaultShapesGroup.add(this.cube);

    // Arc Reactor Sphere
    const sphereGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      metalness: 0.25,
      roughness: 0.12,
      clearcoat: 0.8
    });
    this.sphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.sphere.name = 'Arc Reactor Sphere';
    this.sphere.position.set(0, 0.35, 0);
    this.sphere.userData = { defaultColor: 0x064e3b, accentColor: 0x00f59b, baseScale: new THREE.Vector3(1, 1, 1) };
    this.defaultShapesGroup.add(this.sphere);

    // Torus Accelerator
    const torusGeo = new THREE.TorusGeometry(1.0, 0.35, 32, 64);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 0.6
    });
    this.torus = new THREE.Mesh(torusGeo, torusMat);
    this.torus.name = 'Torus Accelerator';
    this.torus.position.set(2.8, 0.35, 0);
    this.torus.userData = { defaultColor: 0x0369a1, accentColor: 0x00f0ff, baseScale: new THREE.Vector3(1, 1, 1) };
    this.defaultShapesGroup.add(this.torus);

    // Cache initial transforms
    [this.cube, this.sphere, this.torus].forEach(obj => {
      this.initialTransforms.set(obj.uuid, {
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      });
    });
  }

  _createJarvisReticle() {
    this.virtualCursor3D = new THREE.Group();

    // Central aiming dot
    const dotGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    this.virtualCursor3D.add(dot);

    // Inner Targeting Ring
    const innerRingGeo = new THREE.RingGeometry(0.14, 0.17, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.reticleInner = new THREE.Mesh(innerRingGeo, ringMat);
    this.virtualCursor3D.add(this.reticleInner);

    // Outer Segmented Brackets
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
  // MODULE SWITCHING & CAMERA ORCHESTRATION
  // =========================================================================

  setMode(moduleId) {
    this.activeModuleId = moduleId;
    this.energyBeam.hide();
    this.hoveredObject = null;
    this.selectedObject = null;

    if (moduleId === 'matter') {
      // Signature Matter Manipulation Studio
      this.defaultShapesGroup.visible = false;
      this.matterEngine.setVisible(true);
      this.scienceModules.clearActiveModule();
      this.setInteractiveObjects([this.matterEngine.root]);
      this.setSelectedObject(this.matterEngine.root, false);

      this.targetCameraPos.set(0, 1.2, 5.8);
      this.targetCameraLookAt.set(0, 0.1, 0);

    } else {
      // Activate dedicated science module
      this.defaultShapesGroup.visible = false;
      this.matterEngine.setVisible(false);
      this.scienceModules.activateModule(moduleId);

      // Tailored camera viewpoints per scientific domain
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

      // Default select the first available interactive object
      if (this.interactiveObjects.length > 0) {
        this.setSelectedObject(this.interactiveObjects[0], false);
      }
    }
  }

  setInteractiveObjects(objects = []) {
    this.interactiveObjects = objects;
    this.initialTransforms.clear();
    objects.forEach(obj => {
      this.initialTransforms.set(obj.uuid, {
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      });
    });
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

    // Color & scale modulation
    const innerMat = this.reticleInner.material;
    if (state === 'GRABBING' || state === 'GRAB' || state === 'DRAGGING') {
      innerMat.color.setHex(0x00f59b); // Emerald
      this.virtualCursor3D.scale.set(1.25, 1.25, 1.25);

      // Active energy tether from cursor to held object
      if (this.selectedObject) {
        this.energyBeam.update(worldPoint, this.selectedObject.position, this.clock.getElapsedTime());
      }
    } else if (state === 'SCALING') {
      innerMat.color.setHex(0xffb800); // Gold
      this.virtualCursor3D.scale.set(1.4, 1.4, 1.4);
      if (this.selectedObject) {
        this.energyBeam.update(worldPoint, this.selectedObject.position, this.clock.getElapsedTime());
      }
    } else if (state === 'FROZEN') {
      innerMat.color.setHex(0xa855f7); // Violet
      this.virtualCursor3D.scale.set(1.0, 1.0, 1.0);
      this.energyBeam.hide();
    } else {
      innerMat.color.setHex(0x00f0ff); // Ice Cyan
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

    // Apply to mesh or traverse children
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
    this.interactiveObjects.forEach(obj => {
      const init = this.initialTransforms.get(obj.uuid);
      if (init) {
        obj.position.copy(init.position);
        obj.rotation.copy(init.rotation);
        obj.scale.copy(init.scale);
        this._applyVisualState(obj, 'DEFAULT');
      }
    });

    this.hoveredObject = null;
    this.selectedObject = null;
    this.energyBeam.hide();

    this.controls.target.copy(this.targetCameraLookAt);
    this.camera.position.copy(this.targetCameraPos);
    this.controls.update();
  }

  cycleShapeFocus() {
    if (this.activeModuleId === 'matter') {
      const nextShape = this.matterEngine.cycleNextShape();
      return { name: nextShape, isMatterShape: true };
    }

    if (this.interactiveObjects.length === 0) return null;

    let nextIndex = 0;
    if (this.selectedObject) {
      const currentIndex = this.interactiveObjects.indexOf(this.selectedObject);
      nextIndex = (currentIndex + 1) % this.interactiveObjects.length;
    }

    const nextObj = this.interactiveObjects[nextIndex];
    this.setSelectedObject(nextObj, false);
    return nextObj;
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

    // Update active sub-engines
    if (this.activeModuleId === 'matter' && this.matterEngine) {
      this.matterEngine.update(dt, elapsed);
    } else if (this.scienceModules) {
      this.scienceModules.update(dt, elapsed);
    }

    // Animate JARVIS Reticle rings
    if (this.virtualCursor3D && this.virtualCursor3D.visible) {
      this.reticleInner.rotation.z += 0.025;
      this.reticleOuter.rotation.z -= 0.015;
    }

    // Gentle ambient dust particle drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.018;
    }

    // Update orbit controls
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
