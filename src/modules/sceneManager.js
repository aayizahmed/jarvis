/**
 * GestureFlow — Cinematic JARVIS Three.js Scene Manager
 * Dominates the visual field with near-black and charcoal backgrounds,
 * brushed silver/chrome materials, radiant electric-cyan highlights,
 * central holographic mechanism (40-55% viewport), and functional 3D inventory.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { JarvisCore } from './jarvisCore.js';
import { InventoryManager } from './inventoryManager.js';
import { EnergyBeamRenderer } from './energyBeamRenderer.js';

export const INTERACTION_MODES = {
  CORE_GIMBAL: 'CORE_GIMBAL',
  OBJECT_MANIPULATE: 'OBJECT_MANIPULATE'
};

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || window.innerWidth || 1280;
    this.height = canvasContainer.clientHeight || window.innerHeight || 800;

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

    // Active Interaction Mode
    this.interactionMode = INTERACTION_MODES.CORE_GIMBAL;

    // Interactive Meshes List for Raycasting
    this.interactiveObjects = [];

    // Initial state storage for instant scene reset
    this.initialTransforms = new Map();

    // JARVIS Holographic Reticle / Cursor
    this.virtualCursor3D = null;
    this.reticleOuter = null;
    this.reticleInner = null;

    // Object targeting states
    this.hoveredObject = null;
    this.selectedObject = null;

    // Sub-Systems
    this.jarvisCore = null;
    this.inventory = null;
    this.energyBeam = null;
    this.particles = null;

    this.clock = new THREE.Clock();

    this._init();
  }

  _init() {
    // 1. Scene with Deep Obsidian Black & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040609);
    this.scene.fog = new THREE.FogExp2(0x040609, 0.038);

    // 2. Camera Setup (Optimized for full-screen cinematic perspective)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.set(0, 1.4, 6.2);
    this.camera.lookAt(0, 0.25, 0);

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
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 2.8;
    this.controls.maxDistance = 22;
    this.controls.target.set(0, 0.25, 0);

    // 5. Lighting Environment (Brushed Silver Specular Highlights)
    this._setupLighting();

    // 6. Cybernetic Floor Grid & Ambient Particles
    this._setupEnvironment();

    // 7. Centerpiece: Real-time JARVIS Holographic Mechanism (40-55% Viewport)
    this.jarvisCore = new JarvisCore(this.scene);
    this.interactiveObjects.push(this.jarvisCore.root);
    this.selectedObject = this.jarvisCore.root;

    // 8. 3D Inventory System
    this.inventory = new InventoryManager(this);

    // Spawn 2 initial showcase entities flanking the central core
    const initCube = this.inventory.spawnEntity('cube', new THREE.Vector3(-3.2, 0.35, -0.5));
    const initSphere = this.inventory.spawnEntity('sphere', new THREE.Vector3(3.2, 0.35, -0.5));

    // 9. Holographic Energy Tether Beam
    this.energyBeam = new EnergyBeamRenderer(this.scene);

    // 10. JARVIS 3D Target Reticle
    this._createJarvisReticle();

    // 11. Window Resize Listener
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Directional Light for brushed metallic chrome reflections
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5.0, 9.0, 6.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -6.5;
    keyLight.shadow.camera.right = 6.5;
    keyLight.shadow.camera.top = 6.5;
    keyLight.shadow.camera.bottom = -6.5;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Electric Cyan Tactical Fill Light (Left)
    const fillLightCyan = new THREE.PointLight(0x00f0ff, 3.2, 18);
    fillLightCyan.position.set(-6.0, 3.5, 3.2);
    this.scene.add(fillLightCyan);

    // Emerald Green Accent Light (Right)
    const fillLightEmerald = new THREE.PointLight(0x00f59b, 2.8, 18);
    fillLightEmerald.position.set(6.0, 3.5, 3.2);
    this.scene.add(fillLightEmerald);

    // Ice-Blue Rear Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
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
    const gridHelper = new THREE.GridHelper(26, 34, 0x00f0ff, 0x111c2e);
    gridHelper.position.y = -1.34;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Radial Concentric Floor HUD Circles
    [1.8, 3.6, 5.4].forEach(r => {
      const ringGeo = new THREE.RingGeometry(r - 0.02, r + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.33;
      this.scene.add(ring);
    });

    // Ambient Floating Cosmic Dust
    const particleCount = 150;
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
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);
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
  // INTERACTION MODES & TARGETING
  // =========================================================================

  setInteractionMode(mode) {
    this.interactionMode = mode;
    if (mode === INTERACTION_MODES.CORE_GIMBAL) {
      this.setSelectedObject(this.jarvisCore.root, false);
    }
  }

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

    // Inform central core if it was grabbed
    if (this.jarvisCore) {
      const isCore = obj === this.jarvisCore.root;
      this.jarvisCore.setGrabbed(isCore && isGrabbed);
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
          m.material.emissiveIntensity = 0.1;
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
    // Reset central core
    if (this.jarvisCore) {
      this.jarvisCore.root.position.set(0, 0, 0);
      this.jarvisCore.root.rotation.set(0, 0, 0);
      this.jarvisCore.root.scale.set(1, 1, 1);
    }

    // Reset camera
    this.controls.target.set(0, 0.25, 0);
    this.camera.position.set(0, 1.4, 6.2);
    this.controls.update();

    this.hoveredObject = null;
    this.setSelectedObject(this.jarvisCore.root, false);
    this.energyBeam.hide();
  }

  // =========================================================================
  // MAIN RENDER LOOP (60+ FPS decoupled)
  // =========================================================================

  render() {
    const elapsed = this.clock.getElapsedTime();
    const dt = Math.max(0.001, Math.min(0.05, this.clock.getDelta() || 0.016));

    // 1. Update Central Holographic Core
    if (this.jarvisCore) {
      this.jarvisCore.update(dt, elapsed);
    }

    // 2. Idle float animation for ungrabbed spawned inventory entities
    if (this.inventory && this.inventory.spawnedEntities) {
      this.inventory.spawnedEntities.forEach((ent, idx) => {
        if (ent !== this.selectedObject) {
          ent.position.y += Math.sin(elapsed * 1.5 + idx * 2.0) * 0.0012;
          ent.rotation.y += 0.0035;
        }
      });
    }

    // 3. Animate Reticle
    if (this.virtualCursor3D && this.virtualCursor3D.visible) {
      this.reticleInner.rotation.z += 0.025;
      this.reticleOuter.rotation.z -= 0.015;
    }

    // 4. Cosmic dust particle drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.015;
    }

    // 5. Update Orbit Controls
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth || window.innerWidth || 1280;
    this.height = this.container.clientHeight || window.innerHeight || 800;

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
