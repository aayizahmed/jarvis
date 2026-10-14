/**
 * GestureFlow — Three.js Scene Manager
 * Ultra-smooth, zero-GC 60+ FPS spatial manipulation environment hosting:
 * 1. Arc Reactor Sphere
 * 2. Holographic Ring
 * 3. Torus Accelerator
 * Plus the Cinematic Opening Holographic Gyroscope Core
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { JarvisCore } from './jarvisCore.js';

export const APP_STATES = {
  INTRO: 'INTRO',
  TRANSITIONING: 'TRANSITIONING',
  WORKSPACE: 'WORKSPACE'
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

    // State Management
    this.appState = APP_STATES.INTRO;
    this.transitionDuration = 0.75; // 750ms fluid transition
    this.transitionElapsed = 0;
    this.onTransitionComplete = null;

    // Camera Navigation Positions
    this.introCameraPos = new THREE.Vector3(0, 0, 7.8);
    this.introCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.workspaceCameraPos = new THREE.Vector3(0, 1.6, 7.0);
    this.workspaceCameraLookAt = new THREE.Vector3(0, 0.2, 0);

    // Camera Lerp Target
    this.targetCameraPos = this.introCameraPos.clone();
    this.targetCameraLookAt = this.introCameraLookAt.clone();

    // Zero-GC Math Scratchpad
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._q1 = new THREE.Quaternion();
    this._m1 = new THREE.Matrix4();

    // Interactive 3D Objects
    this.interactiveObjects = [];
    this.ring = null;
    this.sphere = null;
    this.torus = null;

    // Floor Target Rings & Environment
    this.floorRings = [];
    this.particles = null;

    // Cinematic Intro Core
    this.introCore = null;

    // Initial state storage for instant scene reset
    this.initialTransforms = new Map();

    // Virtual 3D Reticle
    this.virtualCursor3D = null;
    this.reticleInner = null;
    this.reticleOuter = null;

    // Selection States
    this.hoveredObject = null;
    this.selectedObject = null;

    this.startTime = performance.now();
    this.lastFrameTime = performance.now();

    this._init();
  }

  _init() {
    // 1. Scene with Deep Obsidian Space & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060a);
    this.scene.fog = new THREE.FogExp2(0x04060a, 0.035);

    // 2. Camera Setup
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.copy(this.introCameraPos);
    this.camera.lookAt(this.introCameraLookAt);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Mouse Fallback)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.04;
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 20;
    this.controls.target.copy(this.introCameraLookAt);
    this.controls.enabled = false;

    // 5. Lighting Environment
    this._setupLighting();

    // 6. Cybernetic Floor Grid & Target Rings
    this._setupEnvironment();

    // 7. Interactive 3D Objects (Sphere, Ring, Torus)
    this._createInteractiveObjects();

    // 8. Holographic Gyroscope Core for Cinematic Intro
    this.introCore = new JarvisCore(this.scene);

    // 9. JARVIS 3D Target Reticle
    this._createJarvisReticle();

    // 10. Window resize listener
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4.5, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0006;
    this.scene.add(keyLight);

    const fillLightCyan = new THREE.PointLight(0x00f0ff, 2.6, 14);
    fillLightCyan.position.set(-5, 2.8, 2.5);
    this.scene.add(fillLightCyan);

    const fillLightEmerald = new THREE.PointLight(0x00f59b, 2.2, 14);
    fillLightEmerald.position.set(5, 2.8, 2.5);
    this.scene.add(fillLightEmerald);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(0, 5, -7);
    this.scene.add(rimLight);
  }

  _setupEnvironment() {
    // Shadow Receiver Ground Plane
    const groundGeo = new THREE.PlaneGeometry(32, 32);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.38 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.25;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Cybernetic Floor Grid
    const gridHelper = new THREE.GridHelper(26, 34, 0x00f0ff, 0x111c2e);
    gridHelper.position.y = -1.24;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Holographic Polar Target Rings on Floor at X: -2.8, 0, 2.8
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    [-2.8, 0, 2.8].forEach(x => {
      const ringGeo = new THREE.RingGeometry(0.8, 0.84, 48);
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, -1.23, 0);
      ring.visible = false;
      this.scene.add(ring);
      this.floorRings.push(ring);
    });

    // Ambient floating dust particles
    const particleCount = 120;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 16;
      posArray[i + 1] = Math.random() * 5 - 1;
      posArray[i + 2] = (Math.random() - 0.5) * 12;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);
  }

  _createInteractiveObjects() {
    // 1. Holographic Ring (Luminous Electric Cyan Ring)
    const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 24, 64);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x000000,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 0.8
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.name = 'Holographic Ring';
    this.ring.position.set(-2.8, 0.35, 0);
    this.ring.castShadow = true;
    this.ring.receiveShadow = true;
    this.ring.userData = {
      defaultColor: 0x0284c7,
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1)
    };

    // Inner wireframe glow
    const ringWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.TorusGeometry(1.0, 0.02, 8, 48)),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
    );
    this.ring.add(ringWire);
    this.ring.visible = false;
    this.scene.add(this.ring);
    this.interactiveObjects.push(this.ring);

    // 2. Arc Reactor Sphere (Translucent Emerald Physical Sphere)
    const sphereGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      emissive: 0x000000,
      metalness: 0.25,
      roughness: 0.12,
      transmission: 0.35,
      thickness: 1.1,
      ior: 1.45,
      clearcoat: 0.8
    });
    this.sphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.sphere.name = 'Arc Reactor Sphere';
    this.sphere.position.set(0, 0.35, 0);
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    this.sphere.userData = {
      defaultColor: 0x064e3b,
      accentColor: 0x00f59b,
      baseScale: new THREE.Vector3(1, 1, 1)
    };

    // Inner Glowing Core
    const coreGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f59b,
      transparent: true,
      opacity: 0.75
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.sphere.add(core);
    this.sphere.visible = false;
    this.scene.add(this.sphere);
    this.interactiveObjects.push(this.sphere);

    // 3. Torus Accelerator (Titanium Cyan Specular Torus)
    const torusGeo = new THREE.TorusGeometry(0.85, 0.3, 24, 48);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      emissive: 0x000000,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 0.6
    });
    this.torus = new THREE.Mesh(torusGeo, torusMat);
    this.torus.name = 'Torus Accelerator';
    this.torus.position.set(2.8, 0.35, 0);
    this.torus.castShadow = true;
    this.torus.receiveShadow = true;
    this.torus.userData = {
      defaultColor: 0x0369a1,
      accentColor: 0x38bdf8,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
    this.torus.visible = false;
    this.scene.add(this.torus);
    this.interactiveObjects.push(this.torus);

    // Cache initial transforms for clean scene reset
    this.interactiveObjects.forEach(obj => {
      this.initialTransforms.set(obj.uuid, {
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      });
    });

    this.setSelectedObject(this.sphere, false);
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

    this.virtualCursor3D.visible = false;
    this.scene.add(this.virtualCursor3D);
  }

  // =========================================================================
  // SELECTION & VISUAL STATES
  // =========================================================================

  setSelectedObject(obj, isGrabbed = false) {
    if (this.selectedObject && this.selectedObject !== obj) {
      this._applyVisualState(this.selectedObject, 'DEFAULT');
    }

    this.selectedObject = obj;
    if (obj) {
      this._applyVisualState(obj, isGrabbed ? 'GRABBED' : 'HOVERED');
    }
  }

  setHoveredObject(obj) {
    if (this.hoveredObject && this.hoveredObject !== obj && this.hoveredObject !== this.selectedObject) {
      this._applyVisualState(this.hoveredObject, 'DEFAULT');
    }

    this.hoveredObject = obj;
    if (obj && obj !== this.selectedObject) {
      this._applyVisualState(obj, 'HOVERED');
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
    this.interactiveObjects.forEach(obj => {
      const init = this.initialTransforms.get(obj.uuid);
      if (init) {
        obj.position.copy(init.position);
        obj.rotation.copy(init.rotation);
        obj.scale.copy(init.scale);
      }
      this._applyVisualState(obj, 'DEFAULT');
    });

    this.setSelectedObject(this.sphere, false);
    this.controls.target.set(0, 0.2, 0);
    this.camera.position.set(0, 1.6, 7.0);
    this.controls.update();
  }

  // =========================================================================
  // APPLICATION STATE TRANSITIONS (INTRO <-> WORKSPACE)
  // =========================================================================

  startWorkspaceTransition(onComplete) {
    if (this.appState !== APP_STATES.INTRO) return;
    this.appState = APP_STATES.TRANSITIONING;
    this.transitionElapsed = 0;
    this.onTransitionComplete = onComplete;

    // Reveal workspace objects scaled to 0 initially
    this.interactiveObjects.forEach(obj => {
      obj.visible = true;
      obj.scale.set(0.001, 0.001, 0.001);
    });
    this.floorRings.forEach(r => { r.visible = true; });
  }

  returnToIntro(onComplete) {
    this.appState = APP_STATES.INTRO;
    if (this.introCore) {
      this.introCore.resetIntro();
    }

    this.interactiveObjects.forEach(obj => { obj.visible = false; });
    this.floorRings.forEach(r => { r.visible = false; });

    this.camera.position.copy(this.introCameraPos);
    this.camera.lookAt(this.introCameraLookAt);
    this.controls.target.copy(this.introCameraLookAt);
    this.controls.enabled = false;

    if (onComplete) onComplete();
  }

  // =========================================================================
  // MAIN RENDER LOOP (Decoupled 60+ FPS, Zero-GC)
  // =========================================================================

  render() {
    const now = performance.now();
    const elapsed = (now - this.startTime) * 0.001;
    const dt = Math.max(0.001, Math.min(0.033, (now - this.lastFrameTime) * 0.001));
    this.lastFrameTime = now;

    // 1. INTRO State
    if (this.appState === APP_STATES.INTRO) {
      if (this.introCore) {
        this.introCore.update(dt, elapsed);
      }
      if (this.particles) {
        this.particles.rotation.y = elapsed * 0.012;
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 2. TRANSITIONING State (Hermite smoothstep camera glide & core dissolve)
    if (this.appState === APP_STATES.TRANSITIONING) {
      this.transitionElapsed += dt;
      const progress = Math.min(1.0, this.transitionElapsed / this.transitionDuration);

      // Hermite smoothstep interpolation (0 -> 1 with zero derivatives at endpoints)
      const smoothP = progress * progress * (3 - 2 * progress);
      this.camera.position.lerpVectors(this.introCameraPos, this.workspaceCameraPos, smoothP);
      this.controls.target.lerpVectors(this.introCameraLookAt, this.workspaceCameraLookAt, smoothP);

      // Smooth core scale down and spin
      if (this.introCore) {
        this.introCore.animateTransitionOut(progress, dt);
      }

      // Smooth workspace objects reveal in second half of transition
      if (progress > 0.3) {
        const revealP = (progress - 0.3) / 0.7;
        const easeScale = Math.sin(revealP * Math.PI * 0.5);
        this.interactiveObjects.forEach(obj => {
          const baseScale = obj.userData.baseScale || new THREE.Vector3(1, 1, 1);
          obj.scale.copy(baseScale).multiplyScalar(easeScale);
        });
      }

      if (this.particles) {
        this.particles.rotation.y = elapsed * 0.018;
      }

      this.renderer.render(this.scene, this.camera);

      if (progress >= 1.0) {
        this.appState = APP_STATES.WORKSPACE;
        if (this.introCore) {
          this.introCore.root.visible = false;
        }
        this.interactiveObjects.forEach(obj => {
          const baseScale = obj.userData.baseScale || new THREE.Vector3(1, 1, 1);
          obj.scale.copy(baseScale);
        });
        this.controls.enabled = true;
        this.controls.update();

        if (this.onTransitionComplete) {
          this.onTransitionComplete();
          this.onTransitionComplete = null;
        }
      }
      return;
    }

    // 3. WORKSPACE State (Standard 60+ FPS Workspace Interaction)
    // Ambient Object Idle Levitation (when not held)
    if (this.ring && this.ring !== this.selectedObject) {
      this.ring.rotation.x = 0.2 + Math.sin(elapsed * 0.8) * 0.12;
      this.ring.rotation.y = elapsed * 0.4;
    }
    if (this.torus && this.torus !== this.selectedObject) {
      this.torus.rotation.x = elapsed * 0.35;
      this.torus.rotation.y = elapsed * 0.25;
    }

    // Animate Reticle rings
    if (this.virtualCursor3D && this.virtualCursor3D.visible) {
      this.reticleInner.rotation.z += 0.025;
      this.reticleOuter.rotation.z -= 0.015;
    }

    // Ambient dust drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.018;
    }

    // Orbit controls update
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
