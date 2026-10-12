/**
 * GestureFlow — Matter Manipulation Engine
 * Real-time 3D Morphological Particle System with Dynamic Target Physics,
 * Quaternion Rotation, Gesture Gating (Pinch, Palm Burst, Fist Freeze, Two-Hand Scale),
 * and Smooth Attribute Morphing across 6 Scientific / Geometric States.
 */

import * as THREE from 'three';

export const MATTER_SHAPES = {
  CLOUD: 'CLOUD',
  SPHERE: 'SPHERE',
  CUBE: 'CUBE',
  TORUS: 'TORUS',
  GALAXY: 'GALAXY',
  SOLAR_SYSTEM: 'SOLAR_SYSTEM'
};

export class MatterEngine {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 3800; // Balanced for 60+ FPS on laptops

    // Shapes list for sequential cycling
    this.shapeKeys = [
      MATTER_SHAPES.CLOUD,
      MATTER_SHAPES.SPHERE,
      MATTER_SHAPES.CUBE,
      MATTER_SHAPES.TORUS,
      MATTER_SHAPES.GALAXY,
      MATTER_SHAPES.SOLAR_SYSTEM
    ];
    this.currentShapeIndex = 0;
    this.currentShape = MATTER_SHAPES.CLOUD;

    // Morph physics & state
    this.isFrozen = false;
    this.isBursting = false;
    this.burstTimer = 0;
    this.morphProgress = 1.0;
    this.morphSpeed = 2.4; // Transition rate

    // Spatial Transform Root Object (Manipulated by Gestures)
    this.root = new THREE.Group();
    this.root.name = 'Matter Manipulation Core';
    this.root.userData = {
      isMatterCore: true,
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1)
    };

    // Pre-allocated Shape Target Buffers (Float32Array)
    this.targets = new Map();
    this.targetColors = new Map();

    // Active Particle Buffers
    this.currentPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.currentColors = new Float32Array(this.particleCount * 3);

    // Three.js Points Mesh
    this.particles = null;
    this.geometry = null;
    this.material = null;

    // Glowing Core Mesh (Center anchor)
    this.centerCore = null;

    this._generateAllShapeTargets();
    this._initMesh();
    this.scene.add(this.root);
  }

  _initMesh() {
    // Initialize current positions & colors from CLOUD target
    const cloudTarget = this.targets.get(MATTER_SHAPES.CLOUD);
    const cloudColors = this.targetColors.get(MATTER_SHAPES.CLOUD);

    for (let i = 0; i < this.particleCount * 3; i++) {
      this.currentPositions[i] = cloudTarget[i];
      this.currentColors[i] = cloudColors[i];
      this.velocities[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.currentColors, 3));

    // High-performance circular glow sprite texture generated procedurally (0 external assets!)
    const particleTexture = this._createParticleTexture();

    this.material = new THREE.PointsMaterial({
      size: 0.11,
      map: particleTexture,
      transparent: true,
      opacity: 0.88,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.castShadow = false;
    this.root.add(this.particles);

    // Subtle Glowing Gravitational Nucleus
    const coreGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.centerCore = new THREE.Mesh(coreGeo, coreMat);
    this.root.add(this.centerCore);
  }

  _createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(0, 240, 255, 0.85)');
    grad.addColorStop(0.6, 'rgba(0, 160, 255, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // =========================================================================
  // MATHEMATICAL MORPH TARGET GENERATORS
  // =========================================================================

  _generateAllShapeTargets() {
    this.targets.set(MATTER_SHAPES.CLOUD, this._genCloud());
    this.targetColors.set(MATTER_SHAPES.CLOUD, this._genColors(0x00f0ff, 0x38bdf8));

    this.targets.set(MATTER_SHAPES.SPHERE, this._genSphere());
    this.targetColors.set(MATTER_SHAPES.SPHERE, this._genColors(0x00f59b, 0x10b981));

    this.targets.set(MATTER_SHAPES.CUBE, this._genCube());
    this.targetColors.set(MATTER_SHAPES.CUBE, this._genColors(0x00f0ff, 0x67e8f9));

    this.targets.set(MATTER_SHAPES.TORUS, this._genTorus());
    this.targetColors.set(MATTER_SHAPES.TORUS, this._genColors(0xa855f7, 0xec4899));

    this.targets.set(MATTER_SHAPES.GALAXY, this._genGalaxy());
    this.targetColors.set(MATTER_SHAPES.GALAXY, this._genColors(0xffb800, 0x00f0ff));

    this.targets.set(MATTER_SHAPES.SOLAR_SYSTEM, this._genSolarSystem());
    this.targetColors.set(MATTER_SHAPES.SOLAR_SYSTEM, this._genColors(0x38bdf8, 0xf59e0b));
  }

  _genColors(hex1, hex2) {
    const c1 = new THREE.Color(hex1);
    const c2 = new THREE.Color(hex2);
    const arr = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const alpha = Math.random();
      const col = c1.clone().lerp(c2, alpha);
      arr[i * 3] = col.r;
      arr[i * 3 + 1] = col.g;
      arr[i * 3 + 2] = col.b;
    }
    return arr;
  }

  // 1. Turbulent Fractal Nebula Cloud
  _genCloud() {
    const arr = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2.2;

      // Add fractal harmonic turbulence
      const noise = Math.sin(theta * 3.0) * Math.cos(phi * 2.0) * 0.35;
      const finalR = r + noise;

      arr[i * 3] = finalR * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = finalR * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = finalR * Math.cos(phi);
    }
    return arr;
  }

  // 2. Fibonacci Spherical Lattice
  _genSphere() {
    const arr = new Float32Array(this.particleCount * 3);
    const phi = Math.PI * (Math.sqrt(5) - 1); // Golden ratio angle ~2.39996 rad
    const radius = 1.85;

    for (let i = 0; i < this.particleCount; i++) {
      const y = 1 - (i / (this.particleCount - 1)) * 2; // y goes from 1 to -1
      const radAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      arr[i * 3] = Math.cos(theta) * radAtY * radius;
      arr[i * 3 + 1] = y * radius;
      arr[i * 3 + 2] = Math.sin(theta) * radAtY * radius;
    }
    return arr;
  }

  // 3. Crystalline Hypercube Lattice
  _genCube() {
    const arr = new Float32Array(this.particleCount * 3);
    const half = 1.4;

    for (let i = 0; i < this.particleCount; i++) {
      // Pick one of 6 faces
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * 2 * half;
      const v = (Math.random() - 0.5) * 2 * half;

      switch (face) {
        case 0: arr[i * 3] = half;  arr[i * 3 + 1] = u;     arr[i * 3 + 2] = v;     break;
        case 1: arr[i * 3] = -half; arr[i * 3 + 1] = u;     arr[i * 3 + 2] = v;     break;
        case 2: arr[i * 3] = u;     arr[i * 3 + 1] = half;  arr[i * 3 + 2] = v;     break;
        case 3: arr[i * 3] = u;     arr[i * 3 + 1] = -half; arr[i * 3 + 2] = v;     break;
        case 4: arr[i * 3] = u;     arr[i * 3 + 1] = v;     arr[i * 3 + 2] = half;  break;
        case 5: arr[i * 3] = u;     arr[i * 3 + 1] = v;     arr[i * 3 + 2] = -half; break;
      }
    }
    return arr;
  }

  // 4. Parametric Torus Ring
  _genTorus() {
    const arr = new Float32Array(this.particleCount * 3);
    const R = 1.6; // Major radius
    const r = 0.65; // Minor tube radius

    for (let i = 0; i < this.particleCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;

      arr[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      arr[i * 3 + 1] = r * Math.sin(v);
      arr[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
    }
    return arr;
  }

  // 5. Double Spiral Galaxy with Bulge
  _genGalaxy() {
    const arr = new Float32Array(this.particleCount * 3);
    const arms = 2;
    const maxRadius = 2.6;

    for (let i = 0; i < this.particleCount; i++) {
      if (i < this.particleCount * 0.25) {
        // Central Galactic Bulge
        const r = Math.cbrt(Math.random()) * 0.65;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.8;
        arr[i * 3] = r * Math.cos(theta) * Math.cos(phi);
        arr[i * 3 + 1] = r * Math.sin(phi) * 0.5;
        arr[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
      } else {
        // Spiral Arms
        const armIndex = i % arms;
        const armOffset = (armIndex * 2 * Math.PI) / arms;
        const r = 0.4 + Math.pow(Math.random(), 0.7) * (maxRadius - 0.4);
        const spiralAngle = r * 3.2 + armOffset + (Math.random() - 0.5) * 0.4;
        const thickness = Math.max(0.04, (1.0 - r / maxRadius) * 0.35);

        arr[i * 3] = r * Math.cos(spiralAngle);
        arr[i * 3 + 1] = (Math.random() - 0.5) * thickness;
        arr[i * 3 + 2] = r * Math.sin(spiralAngle);
      }
    }
    return arr;
  }

  // 6. Simplified Solar System Arrangement
  _genSolarSystem() {
    const arr = new Float32Array(this.particleCount * 3);
    const orbitRadii = [0.6, 0.95, 1.35, 1.8, 2.35];

    for (let i = 0; i < this.particleCount; i++) {
      if (i < this.particleCount * 0.2) {
        // Sun Core
        const r = Math.cbrt(Math.random()) * 0.38;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i * 3 + 2] = r * Math.cos(phi);
      } else {
        // Orbital Rings + Planetary Clusters
        const ringIdx = i % orbitRadii.length;
        const baseR = orbitRadii[ringIdx];
        const theta = Math.random() * Math.PI * 2;
        const r = baseR + (Math.random() - 0.5) * 0.08;

        arr[i * 3] = r * Math.cos(theta);
        arr[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
        arr[i * 3 + 2] = r * Math.sin(theta);
      }
    }
    return arr;
  }

  // =========================================================================
  // INTERACTION COMMANDS
  // =========================================================================

  /**
   * Morph to a specific shape
   * @param {string} shapeKey One of MATTER_SHAPES
   */
  morphTo(shapeKey) {
    if (!this.targets.has(shapeKey)) return false;
    this.currentShape = shapeKey;
    this.currentShapeIndex = this.shapeKeys.indexOf(shapeKey);
    this.morphProgress = 0.0;
    this.isFrozen = false;
    return true;
  }

  /**
   * Cycle to next shape sequentially
   */
  cycleNextShape() {
    this.currentShapeIndex = (this.currentShapeIndex + 1) % this.shapeKeys.length;
    const nextKey = this.shapeKeys[this.currentShapeIndex];
    this.morphTo(nextKey);
    return nextKey;
  }

  /**
   * Open Palm: Trigger radial expansion burst / shockwave!
   */
  triggerBurst() {
    if (this.isFrozen) return;
    this.isBursting = true;
    this.burstTimer = 0.45; // Burst duration

    const pos = this.currentPositions;
    const vel = this.velocities;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const x = pos[idx];
      const y = pos[idx + 1];
      const z = pos[idx + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1.0;

      const speed = 7.0 + Math.random() * 5.0;
      vel[idx] += (x / len) * speed;
      vel[idx + 1] += (y / len) * speed;
      vel[idx + 2] += (z / len) * speed;
    }
  }

  /**
   * Fist: Freeze particle positions in place
   */
  setFrozen(freeze = true) {
    this.isFrozen = freeze;
    if (freeze) {
      // Clear velocities
      for (let i = 0; i < this.particleCount * 3; i++) {
        this.velocities[i] = 0;
      }
      if (this.material) {
        this.material.color.setHex(0xa855f7); // Violet freeze glow
      }
    } else {
      if (this.material) {
        this.material.color.setHex(0xffffff);
      }
    }
  }

  // =========================================================================
  // ANIMATION & PHYSICS TICK (Called inside 60+ FPS Three.js loop)
  // =========================================================================

  update(dt, elapsed) {
    if (!this.particles || this.isFrozen) {
      // Rotate core slowly even if frozen
      if (this.centerCore) this.centerCore.rotation.y += 0.01;
      return;
    }

    const targetPos = this.targets.get(this.currentShape);
    const targetCol = this.targetColors.get(this.currentShape);
    const pos = this.currentPositions;
    const vel = this.velocities;
    const col = this.currentColors;

    const clampedDt = Math.max(0.001, Math.min(0.05, dt));

    // Morph progress
    if (this.morphProgress < 1.0) {
      this.morphProgress = Math.min(1.0, this.morphProgress + clampedDt * this.morphSpeed);
    }

    // Spring physics constants
    const springK = 38.0;   // Attractor stiffness towards target shape
    const damping = 0.82;   // Velocity drag

    // Handle burst decay
    if (this.isBursting) {
      this.burstTimer -= clampedDt;
      if (this.burstTimer <= 0) {
        this.isBursting = false;
      }
    }

    // Update particle positions and colors
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;

      // Current vs Target
      const tx = targetPos[idx];
      const ty = targetPos[idx + 1];
      const tz = targetPos[idx + 2];

      const px = pos[idx];
      const py = pos[idx + 1];
      const pz = pos[idx + 2];

      // Spring force towards target
      const fx = (tx - px) * springK;
      const fy = (ty - py) * springK;
      const fz = (tz - pz) * springK;

      // Integrate velocity
      vel[idx] = (vel[idx] + fx * clampedDt) * damping;
      vel[idx + 1] = (vel[idx + 1] + fy * clampedDt) * damping;
      vel[idx + 2] = (vel[idx + 2] + fz * clampedDt) * damping;

      // Integrate position
      pos[idx] += vel[idx] * clampedDt;
      pos[idx + 1] += vel[idx + 1] * clampedDt;
      pos[idx + 2] += vel[idx + 2] * clampedDt;

      // Smooth color morph
      col[idx] += (targetCol[idx] - col[idx]) * 0.08;
      col[idx + 1] += (targetCol[idx + 1] - col[idx + 1]) * 0.08;
      col[idx + 2] += (targetCol[idx + 2] - col[idx + 2]) * 0.08;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Organic idle drift rotation
    this.root.rotation.y += 0.004;

    // Pulse center core
    if (this.centerCore) {
      const pulse = 1.0 + Math.sin(elapsed * 4.0) * 0.12;
      this.centerCore.scale.set(pulse, pulse, pulse);
    }
  }

  setVisible(visible) {
    this.root.visible = visible;
  }

  dispose() {
    if (this.particles) {
      this.root.remove(this.particles);
      this.geometry.dispose();
      this.material.dispose();
    }
    if (this.centerCore) {
      this.root.remove(this.centerCore);
      this.centerCore.geometry.dispose();
      this.centerCore.material.dispose();
    }
    this.scene.remove(this.root);
  }
}
