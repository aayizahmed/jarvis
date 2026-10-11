/**
 * GestureFlow — JARVIS Edition
 * Three.js Scene Manager with Cinematic Holographic Aesthetics & Zero-GC In-Loop Math
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

    // Interactive Meshes
    this.interactiveObjects = [];
    this.cube = null;
    this.sphere = null;
    this.torus = null;

    // Ambient Holographic Particles
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

    this.clock = new THREE.Clock();

    this._init();
  }

  _init() {
    // 1. Scene with Deep Midnight Space & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060a);
    this.scene.fog = new THREE.FogExp2(0x04060a, 0.038);

    // 2. Camera Setup (Optimized FOV for spatial manipulation)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.set(0, 1.6, 7.0);
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
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Mouse Fallback)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.04;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 16;
    this.controls.target.set(0, 0.2, 0);

    // 5. Lighting Environment
    this._setupLighting();

    // 6. Cybernetic Floor Grid & Holographic Particles
    this._setupEnvironment();

    // 7. Interactive 3D Holographic Meshes
    this._createInteractiveObjects();

    // 8. JARVIS 3D Target Reticle
    this._createJarvisReticle();

    // 9. Resize listener
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    // Subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Main Directional Key Light with soft shadow
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4.5, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -5.5;
    keyLight.shadow.camera.right = 5.5;
    keyLight.shadow.camera.top = 5.5;
    keyLight.shadow.camera.bottom = -5.5;
    keyLight.shadow.bias = -0.0006;
    this.scene.add(keyLight);

    // Ice-Blue Tactical Fill Light (Left)
    const fillLightCyan = new THREE.PointLight(0x00f0ff, 2.6, 12);
    fillLightCyan.position.set(-5, 2.8, 2.5);
    this.scene.add(fillLightCyan);

    // Electric Emerald Accent Light (Right)
    const fillLightEmerald = new THREE.PointLight(0x00f59b, 2.4, 12);
    fillLightEmerald.position.set(5, 2.8, 2.5);
    this.scene.add(fillLightEmerald);

    // Amber Backlight / Rim
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(0, 5, -7);
    this.scene.add(rimLight);
  }

  _setupEnvironment() {
    // Shadow Receiver Ground Plane
    const groundGeo = new THREE.PlaneGeometry(28, 28);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.25;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Fine Technical Perspective Grid
    const gridHelper = new THREE.GridHelper(18, 24, 0x00f0ff, 0x111c2e);
    gridHelper.position.y = -1.24;
    gridHelper.material.opacity = 0.22;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Holographic Polar Target Rings on Floor
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });

    [-2.8, 0, 2.8].forEach(x => {
      const ringGeo = new THREE.RingGeometry(0.8, 0.84, 48);
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, -1.23, 0);
      this.scene.add(ring);
    });

    // Ambient Holographic Dust Particles (Single BufferGeometry, 0 CPU overhead)
    const particleCount = 120;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 14;
      posArray[i + 1] = Math.random() * 5 - 1;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
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

  _createInteractiveObjects() {
    // 1. JARVIS Quantum Cube (Chamfered Titanium Box + Wireframe Glow)
    const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 2, 2, 2);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x162032,
      emissive: 0x000000,
      metalness: 0.75,
      roughness: 0.22,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15
    });
    this.cube = new THREE.Mesh(cubeGeo, cubeMat);
    this.cube.name = 'Quantum Cube';
    this.cube.position.set(-2.8, 0.35, 0);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.cube.userData = {
      defaultColor: 0x162032,
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1)
    };

    // Holographic Wireframe Cage Overlay
    const wireGeo = new THREE.EdgesGeometry(cubeGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.3
    });
    const cubeWire = new THREE.LineSegments(wireGeo, wireMat);
    this.cube.add(cubeWire);
    this.scene.add(this.cube);
    this.interactiveObjects.push(this.cube);

    // 2. Arc Reactor Sphere (Translucent Emerald Physical Sphere)
    const sphereGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      emissive: 0x000000,
      metalness: 0.25,
      roughness: 0.12,
      transmission: 0.25,
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
      opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.sphere.add(core);
    this.scene.add(this.sphere);
    this.interactiveObjects.push(this.sphere);

    // 3. Holographic Torus Accelerator (Electric Cyan Specular Torus)
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
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
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

  updateCursor(worldPoint, state = 'HOVER') {
    if (!worldPoint) {
      this.virtualCursor3D.visible = false;
      return;
    }

    this.virtualCursor3D.visible = true;
    this.virtualCursor3D.position.copy(worldPoint);
    this.virtualCursor3D.quaternion.copy(this.camera.quaternion);

    // State color & scale modulation
    const innerMat = this.reticleInner.material;
    if (state === 'GRABBING' || state === 'GRAB' || state === 'DRAGGING') {
      innerMat.color.setHex(0x00f59b); // Vibrant Emerald
      this.virtualCursor3D.scale.set(1.25, 1.25, 1.25);
    } else if (state === 'SCALING') {
      innerMat.color.setHex(0xffb800); // Arc Gold
      this.virtualCursor3D.scale.set(1.4, 1.4, 1.4);
    } else if (state === 'FROZEN') {
      innerMat.color.setHex(0xa855f7); // Violet
      this.virtualCursor3D.scale.set(1.0, 1.0, 1.0);
    } else {
      innerMat.color.setHex(0x00f0ff); // Ice Cyan
      this.virtualCursor3D.scale.set(1.0, 1.0, 1.0);
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
    if (!obj || !obj.material) return;
    const mat = obj.material;

    if (state === 'GRABBED') {
      mat.emissive.setHex(obj.userData.accentColor || 0x00f59b);
      mat.emissiveIntensity = 0.6;
    } else if (state === 'HOVERED') {
      mat.emissive.setHex(obj.userData.accentColor || 0x00f0ff);
      mat.emissiveIntensity = 0.35;
    } else {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }

    // Modulate child wireframes or inner glow cores
    if (obj.children && obj.children.length > 0) {
      obj.children.forEach(child => {
        if (child.isLineSegments && child.material) {
          child.material.opacity = (state === 'GRABBED') ? 0.85 : ((state === 'HOVERED') ? 0.65 : 0.28);
        } else if (child.isMesh && child.material && child.material.isMeshBasicMaterial) {
          child.material.opacity = (state === 'GRABBED') ? 1.0 : ((state === 'HOVERED') ? 0.9 : 0.6);
        }
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

    this.controls.target.set(0, 0.2, 0);
    this.camera.position.set(0, 1.6, 7.0);
    this.controls.update();
  }

  cycleShapeFocus() {
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

  /**
   * Main render tick called by requestAnimationFrame
   * Uses pre-allocated math objects and time delta
   */
  render() {
    const elapsed = this.clock.getElapsedTime();

    // Idle floating animations for ungrabbed objects
    this.interactiveObjects.forEach((obj, idx) => {
      if (obj !== this.selectedObject) {
        obj.position.y += Math.sin(elapsed * 1.5 + idx * 2) * 0.0012;
        obj.rotation.y += 0.0035;
      }
    });

    // Animate JARVIS Reticle rings
    if (this.virtualCursor3D && this.virtualCursor3D.visible) {
      this.reticleInner.rotation.z += 0.025;
      this.reticleOuter.rotation.z -= 0.015;
    }

    // Gentle particle drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.02;
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
