/**
 * GestureFlow — Cinematic Holographic Mechanism
 * Pure Three.js central mechanism featuring:
 * 1. Glowing central energy sphere with harmonic breathing
 * 2. Concentric orbital rings and torus rotating independently on multi-axes
 * 3. Brushed silver/graphite metallic finishes with cyan highlights
 * 4. Silky-smooth mathematical 60+ FPS delta-time animation & easing
 */

import * as THREE from 'three';

export class JarvisCore {
  constructor(scene) {
    this.scene = scene;

    // Root container
    this.root = new THREE.Group();
    this.root.name = 'Holographic Core Mechanism';
    this.root.userData = {
      isCentralCore: true,
      category: 'Holographic Gyroscope',
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1)
    };

    // State & Interaction Flags
    this.isGrabbed = false;
    this.isFrozen = false;
    this.isPulseActive = false;
    this.pulseTimer = 0.0;

    // Independent Angular Speeds (Radians / Sec)
    this.innerSpeedX = 0.55;
    this.middleSpeedY = -0.38;
    this.outerSpeedZ = 0.25;

    // Core Components
    this.energySphere = null;
    this.energyAtmosphere = null;
    this.pointLight = null;

    this.ringInnerGroup = null;
    this.ringMiddleGroup = null;
    this.ringOuterGroup = null;

    this._initMaterials();
    this._buildEnergyCore();
    this._buildGyroscopeRings();

    this.scene.add(this.root);
  }

  _initMaterials() {
    // 1. Brushed Silver / Chrome Physical Material
    this.silverMetalMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      emissive: 0x0f172a,
      emissiveIntensity: 0.15,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95
    });

    // 2. Graphite Dark Grey Structural Material
    this.graphiteMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e2530,
      metalness: 0.9,
      roughness: 0.28,
      clearcoat: 0.45
    });

    // 3. Electric Cyan Holographic Emissive Wireframe Material
    this.cyanEmissiveMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // 4. Luminous Ice-Blue Energy Material
    this.iceBlueMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
  }

  _buildEnergyCore() {
    const coreContainer = new THREE.Group();
    coreContainer.name = 'Central Energy Core';

    // 1. Radiant Energy Sphere
    const sphereGeo = new THREE.SphereGeometry(0.55, 36, 36);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x00f59b,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.1
    });
    this.energySphere = new THREE.Mesh(sphereGeo, sphereMat);
    coreContainer.add(this.energySphere);

    // 2. Translucent Atmospheric Halo Shell
    const atmoGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.energyAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    coreContainer.add(this.energyAtmosphere);

    // 3. Central Point Light Casting Soft Illumination
    this.pointLight = new THREE.PointLight(0x00f0ff, 2.8, 14);
    coreContainer.add(this.pointLight);

    this.root.add(coreContainer);
  }

  _buildGyroscopeRings() {
    // ==========================================
    // RING 1: Inner Gimbal Ring (Rotates around X)
    // ==========================================
    this.ringInnerGroup = new THREE.Group();
    this.ringInnerGroup.name = 'Inner Gimbal Ring';

    const r1Radius = 1.15;
    const r1Tube = 0.045;
    const r1Geo = new THREE.TorusGeometry(r1Radius, r1Tube, 24, 72);
    const r1Mesh = new THREE.Mesh(r1Geo, this.silverMetalMat);
    this.ringInnerGroup.add(r1Mesh);

    // Cyan glowing cardinal pivot nodes
    [-r1Radius, r1Radius].forEach(x => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), this.cyanEmissiveMat);
      node.position.set(x, 0, 0);
      this.ringInnerGroup.add(node);
    });

    // Inner wireframe calibration ring
    const wire1 = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.TorusGeometry(r1Radius, 0.015, 8, 48)),
      this.cyanEmissiveMat
    );
    this.ringInnerGroup.add(wire1);
    this.root.add(this.ringInnerGroup);

    // ==========================================
    // RING 2: Middle Gimbal Ring (Rotates around Y)
    // ==========================================
    this.ringMiddleGroup = new THREE.Group();
    this.ringMiddleGroup.name = 'Middle Gimbal Ring';

    const r2Radius = 1.55;
    const r2Tube = 0.04;
    const r2Geo = new THREE.TorusGeometry(r2Radius, r2Tube, 24, 72);
    const r2Mesh = new THREE.Mesh(r2Geo, this.graphiteMat);
    this.ringMiddleGroup.add(r2Mesh);

    // Vertical pivot nodes
    [-r2Radius, r2Radius].forEach(y => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), this.iceBlueMat);
      node.position.set(0, y, 0);
      this.ringMiddleGroup.add(node);
    });

    // Concentric thin cyan ring
    const wire2 = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.TorusGeometry(r2Radius, 0.012, 8, 48)),
      this.cyanEmissiveMat
    );
    this.ringMiddleGroup.add(wire2);
    this.root.add(this.ringMiddleGroup);

    // ==========================================
    // RING 3: Outer Gimbal Ring (Rotates around Z)
    // ==========================================
    this.ringOuterGroup = new THREE.Group();
    this.ringOuterGroup.name = 'Outer Gimbal Ring';

    const r3Radius = 1.95;
    const r3Tube = 0.035;
    const r3Geo = new THREE.TorusGeometry(r3Radius, r3Tube, 24, 96);
    const r3Mesh = new THREE.Mesh(r3Geo, this.silverMetalMat);
    this.ringOuterGroup.add(r3Mesh);

    // Exterior framing Torus ring
    const frameGeo = new THREE.TorusGeometry(r3Radius + 0.15, 0.018, 16, 96);
    const frameMesh = new THREE.Mesh(frameGeo, this.iceBlueMat);
    this.ringOuterGroup.add(frameMesh);

    this.root.add(this.ringOuterGroup);
  }

  // =========================================================================
  // GESTURE COMMAND HOOKS
  // =========================================================================

  triggerEnergyPulse() {
    this.isPulseActive = true;
    this.pulseTimer = 0.5;
  }

  setFrozen(freeze = true) {
    this.isFrozen = freeze;
    if (this.energySphere) {
      this.energySphere.material.emissive.setHex(freeze ? 0xa855f7 : 0x00f0ff);
      this.energySphere.material.color.setHex(freeze ? 0x9333ea : 0x00f59b);
    }
    if (this.pointLight) {
      this.pointLight.color.setHex(freeze ? 0xa855f7 : 0x00f0ff);
    }
  }

  setGrabbed(grabbed = true) {
    this.isGrabbed = grabbed;
    if (this.silverMetalMat) {
      this.silverMetalMat.emissive.setHex(grabbed ? 0x00f59b : 0x0f172a);
      this.silverMetalMat.emissiveIntensity = grabbed ? 0.45 : 0.15;
    }
  }

  // =========================================================================
  // ANIMATION TICK (Called inside authoritative Three.js loop)
  // =========================================================================

  update(dt, elapsed) {
    const clampedDt = Math.max(0.001, Math.min(0.033, dt));

    // 1. Central Energy Sphere Organic Breathing
    if (this.energySphere && this.energyAtmosphere) {
      const breath = 1.0 + Math.sin(elapsed * 2.8) * 0.06;
      let finalScale = breath;

      if (this.isPulseActive) {
        this.pulseTimer -= clampedDt;
        const progress = 1.0 - (this.pulseTimer / 0.5);
        finalScale += Math.sin(progress * Math.PI) * 0.35;

        if (this.pulseTimer <= 0) {
          this.isPulseActive = false;
        }
      }

      this.energySphere.scale.set(finalScale, finalScale, finalScale);
      const atmoScale = finalScale * 1.25;
      this.energyAtmosphere.scale.set(atmoScale, atmoScale, atmoScale);
    }

    // 2. Continuous Mechanical Gyroscope Multi-Axis Rotation
    if (!this.isFrozen) {
      if (this.ringInnerGroup) {
        this.ringInnerGroup.rotation.x += clampedDt * this.innerSpeedX;
      }
      if (this.ringMiddleGroup) {
        this.ringMiddleGroup.rotation.y += clampedDt * this.middleSpeedY;
      }
      if (this.ringOuterGroup) {
        this.ringOuterGroup.rotation.z += clampedDt * this.outerSpeedZ;
      }
    }

    // 3. Subtle floating hover when resting
    if (!this.isGrabbed) {
      this.root.position.y = 0.25 + Math.sin(elapsed * 1.2) * 0.03;
    }
  }

  // =========================================================================
  // CINEMATIC TRANSITION SEQUENCE (Intro -> Workspace, 100% Smooth Easing)
  // =========================================================================

  animateTransitionOut(progress, dt) {
    const p = Math.max(0.0, Math.min(1.0, progress));
    const clampedDt = Math.max(0.001, Math.min(0.033, dt));

    // Smooth rotational speed-up
    const speedMult = 1.0 + 3.0 * p * p;
    if (this.ringInnerGroup) this.ringInnerGroup.rotation.x += clampedDt * this.innerSpeedX * speedMult;
    if (this.ringMiddleGroup) this.ringMiddleGroup.rotation.y += clampedDt * this.middleSpeedY * speedMult;
    if (this.ringOuterGroup) this.ringOuterGroup.rotation.z += clampedDt * this.outerSpeedZ * speedMult;

    // Mathematical cosine easing: 1.0 down to 0.0 with 0 velocity at start
    const easeScale = Math.cos(p * Math.PI * 0.5);
    this.root.scale.set(easeScale, easeScale, easeScale);

    if (this.pointLight) {
      this.pointLight.intensity = 2.8 * easeScale;
    }

    if (p >= 1.0) {
      this.root.visible = false;
    }
  }

  resetIntro() {
    this.root.visible = true;
    this.root.scale.set(1, 1, 1);
    this.root.position.set(0, 0.25, 0);
    this.isFrozen = false;
    this.isGrabbed = false;
    if (this.pointLight) {
      this.pointLight.intensity = 2.8;
      this.pointLight.color.setHex(0x00f0ff);
    }
    if (this.energySphere) {
      this.energySphere.scale.set(1, 1, 1);
    }
    if (this.energyAtmosphere) {
      this.energyAtmosphere.scale.set(1.25, 1.25, 1.25);
    }
  }

  dispose() {
    this.scene.remove(this.root);
    [this.silverMetalMat, this.graphiteMat, this.cyanEmissiveMat, this.iceBlueMat].forEach(m => m.dispose());
  }
}
