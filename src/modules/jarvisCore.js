/**
 * GestureFlow — Cinematic JARVIS Holographic Core Mechanism
 * Real-time 3D metallic gyroscope with multi-axis concentric rings,
 * brushed silver/chrome materials, radiant cyan energy sphere,
 * orbiting spark swarm, radial measurement markings, and seamless
 * hand-controlled gesture interaction.
 */

import * as THREE from 'three';

export class JarvisCore {
  constructor(scene) {
    this.scene = scene;

    // Root container (interactive target)
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
    this.pulseScale = 1.0;

    // Independent Angular Speeds (Radians / Sec)
    this.innerSpeedX = 0.65;
    this.middleSpeedY = -0.42;
    this.outerSpeedZ = 0.28;
    this.orbitSwarmSpeed = 0.95;

    // Scratchpad math objects for zero-GC in-loop calculation
    this._qDelta = new THREE.Quaternion();
    this._vTmp = new THREE.Vector3();

    // Core Components
    this.energySphere = null;
    this.energyAtmosphere = null;
    this.pointLight = null;

    this.ringInnerGroup = null;
    this.ringMiddleGroup = null;
    this.ringOuterGroup = null;

    this.rings = [];
    this.swarm = null;
    this.swarmPositions = null;
    this.swarmAngles = null;
    this.swarmRadii = null;

    this._initMaterials();
    this._buildEnergyCore();
    this._buildGyroscopeRings();
    this._buildOrbitingSwarm();
    this._buildRadialHUDMarkings();

    this.scene.add(this.root);
  }

  _initMaterials() {
    // 1. Brushed Silver / Chrome Physical Material
    this.silverMetalMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      emissive: 0x0f172a,
      emissiveIntensity: 0.15,
      metalness: 0.94,
      roughness: 0.22,
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95
    });

    // 2. Graphite Dark Grey Structural Material
    this.graphiteMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e2530,
      metalness: 0.88,
      roughness: 0.32,
      clearcoat: 0.4
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
      opacity: 0.32,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.energyAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    coreContainer.add(this.energyAtmosphere);

    // 3. Central Point Light Casting Soft Illumination
    this.pointLight = new THREE.PointLight(0x00f0ff, 3.2, 14);
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
      new THREE.EdgesGeometry(new THREE.RingGeometry(r1Radius - 0.08, r1Radius + 0.08, 48)),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
    );
    this.ringInnerGroup.add(wire1);
    this.root.add(this.ringInnerGroup);

    // ==========================================
    // RING 2: Middle Gimbal Ring (Rotates around Y)
    // ==========================================
    this.ringMiddleGroup = new THREE.Group();
    this.ringMiddleGroup.name = 'Middle Gimbal Ring';

    const r2Radius = 1.62;
    const r2Tube = 0.055;
    const r2Geo = new THREE.TorusGeometry(r2Radius, r2Tube, 24, 80);
    const r2Mesh = new THREE.Mesh(r2Geo, this.silverMetalMat.clone());
    this.ringMiddleGroup.add(r2Mesh);

    // 12 Radial Measurement Notches around circumference
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const notchGeo = new THREE.BoxGeometry(0.04, 0.09, 0.06);
      const notch = new THREE.Mesh(notchGeo, this.graphiteMat);
      notch.position.set(Math.cos(angle) * r2Radius, Math.sin(angle) * r2Radius, 0);
      notch.rotation.z = angle;
      this.ringMiddleGroup.add(notch);

      // Glowing pip on every 90 degrees
      if (i % 3 === 0) {
        const pip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), this.cyanEmissiveMat);
        pip.position.set(Math.cos(angle) * (r2Radius + 0.1), Math.sin(angle) * (r2Radius + 0.1), 0);
        this.ringMiddleGroup.add(pip);
      }
    }
    this.root.add(this.ringMiddleGroup);

    // ==========================================
    // RING 3: Outer Gimbal Ring (Rotates around Z)
    // ==========================================
    this.ringOuterGroup = new THREE.Group();
    this.ringOuterGroup.name = 'Outer Gimbal Ring';

    const r3Radius = 2.18;
    const r3Tube = 0.065;
    const r3Geo = new THREE.TorusGeometry(r3Radius, r3Tube, 24, 96);
    const r3Mesh = new THREE.Mesh(r3Geo, this.silverMetalMat.clone());
    this.ringOuterGroup.add(r3Mesh);

    // Thin segmented perimeter brackets
    const bracketGeo = new THREE.RingGeometry(r3Radius + 0.12, r3Radius + 0.18, 4, 1, 0.15, 1.25);
    const bracketMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    for (let i = 0; i < 4; i++) {
      const bMesh = new THREE.Mesh(bracketGeo, bracketMat);
      bMesh.rotation.z = (i * Math.PI) / 2;
      this.ringOuterGroup.add(bMesh);
    }
    this.root.add(this.ringOuterGroup);

    // ==========================================
    // RING 4: Tilted Planetary Orbital Ring
    // ==========================================
    const r4Radius = 2.75;
    const r4Curve = new THREE.EllipseCurve(0, 0, r4Radius, r4Radius * 0.92, 0, Math.PI * 2, false, 0);
    const r4Points = r4Curve.getPoints(80);
    const r4Geo = new THREE.BufferGeometry().setFromPoints(r4Points);
    const r4Line = new THREE.Line(r4Geo, new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35
    }));
    r4Line.rotation.x = Math.PI / 3.2;
    r4Line.rotation.y = Math.PI / 6;
    this.root.add(r4Line);
  }

  _buildOrbitingSwarm() {
    // 240 micro energy particle sparks on 3 orbital bands
    const count = 240;
    this.swarmPositions = new Float32Array(count * 3);
    this.swarmAngles = new Float32Array(count);
    this.swarmRadii = new Float32Array(count);
    this.swarmInclinations = new Float32Array(count);
    this.swarmSpeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.swarmAngles[i] = Math.random() * Math.PI * 2;
      // Band distribution around 1.3 to 2.4 radius
      this.swarmRadii[i] = 1.35 + Math.random() * 1.15;
      this.swarmInclinations[i] = (Math.random() - 0.5) * Math.PI * 0.75;
      this.swarmSpeeds[i] = (0.5 + Math.random() * 0.9) * (Math.random() > 0.5 ? 1 : -1);

      this.swarmPositions[i * 3] = 0;
      this.swarmPositions[i * 3 + 1] = 0;
      this.swarmPositions[i * 3 + 2] = 0;
    }

    const swarmGeo = new THREE.BufferGeometry();
    swarmGeo.setAttribute('position', new THREE.BufferAttribute(this.swarmPositions, 3));

    // Circular glowing particle texture
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 32;
    sparkCanvas.height = 32;
    const ctx = sparkCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.9)');
    grad.addColorStop(0.7, 'rgba(0, 245, 155, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const sparkTex = new THREE.CanvasTexture(sparkCanvas);
    sparkTex.generateMipmaps = false;

    const swarmMat = new THREE.PointsMaterial({
      size: 0.085,
      map: sparkTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.swarm = new THREE.Points(swarmGeo, swarmMat);
    this.root.add(this.swarm);
  }

  _buildRadialHUDMarkings() {
    // Holographic Dial Ring on Z plane
    const dialRadius = 1.9;
    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 512;
    dialCanvas.height = 512;
    const ctx = dialCanvas.getContext('2d');

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.stroke();

    // 72 Tick marks with numbers at cardinal points
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const isMajor = i % 18 === 0;
      const isMed = i % 6 === 0;
      const rInner = isMajor ? 215 : (isMed ? 225 : 232);

      const x1 = 256 + Math.cos(angle) * rInner;
      const y1 = 256 + Math.sin(angle) * rInner;
      const x2 = 256 + Math.cos(angle) * 240;
      const y2 = 256 + Math.sin(angle) * 240;

      ctx.beginPath();
      ctx.lineWidth = isMajor ? 3 : 1.5;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (isMajor) {
        const deg = (i / 72) * 360;
        const textR = 195;
        const tx = 256 + Math.cos(angle) * textR;
        const ty = 256 + Math.sin(angle) * textR;
        ctx.fillText(`${deg.toString().padStart(3, '0')}°`, tx, ty);
      }
    }

    const dialTex = new THREE.CanvasTexture(dialCanvas);
    dialTex.generateMipmaps = false;

    const dialGeo = new THREE.PlaneGeometry(dialRadius * 2, dialRadius * 2);
    const dialMat = new THREE.MeshBasicMaterial({
      map: dialTex,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.set(0, 0, -0.05);
    this.root.add(dialMesh);
    this.dialMesh = dialMesh;
  }

  // =========================================================================
  // GESTURE COMMAND HOOKS
  // =========================================================================

  /**
   * Open Palm: Triggers radial energy pulse expanding outward through all rings
   */
  triggerEnergyPulse() {
    this.isPulseActive = true;
    this.pulseTimer = 0.5;
  }

  /**
   * Fist: Freeze mechanical rotation and lock orientation
   */
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

  /**
   * Set Grabbed State (Hand is manipulating the core directly)
   */
  setGrabbed(grabbed = true) {
    this.isGrabbed = grabbed;
    if (this.silverMetalMat) {
      this.silverMetalMat.emissive.setHex(grabbed ? 0x00f59b : 0x0f172a);
      this.silverMetalMat.emissiveIntensity = grabbed ? 0.45 : 0.15;
    }
  }

  // =========================================================================
  // ANIMATION TICK (Called inside single authoritative Three.js loop)
  // =========================================================================

  update(dt, elapsed) {
    const clampedDt = Math.max(0.001, Math.min(0.05, dt));

    // 1. Central Energy Sphere Organic Breathing
    if (this.energySphere && this.energyAtmosphere) {
      const breath = 1.0 + Math.sin(elapsed * 3.2) * 0.08;
      let finalScale = breath;

      // Handle Open Palm Energy Pulse shockwave
      if (this.isPulseActive) {
        this.pulseTimer -= clampedDt;
        const progress = 1.0 - (this.pulseTimer / 0.5);
        finalScale += Math.sin(progress * Math.PI) * 0.45;

        if (this.pulseTimer <= 0) {
          this.isPulseActive = false;
        }
      }

      this.energySphere.scale.set(finalScale, finalScale, finalScale);
      const atmoScale = finalScale * 1.25;
      this.energyAtmosphere.scale.set(atmoScale, atmoScale, atmoScale);
    }

    // 2. Continuous Mechanical Gyroscope Rotation (Hierarchy of Motion)
    if (!this.isFrozen) {
      // Ring 1 rotates continuously around local X
      if (this.ringInnerGroup) {
        this.ringInnerGroup.rotation.x += clampedDt * this.innerSpeedX;
      }

      // Ring 2 rotates counter-directionally around local Y
      if (this.ringMiddleGroup) {
        this.ringMiddleGroup.rotation.y += clampedDt * this.middleSpeedY;
      }

      // Ring 3 rotates slowly around local Z
      if (this.ringOuterGroup) {
        this.ringOuterGroup.rotation.z += clampedDt * this.outerSpeedZ;
      }

      // Dial HUD slow rotation
      if (this.dialMesh) {
        this.dialMesh.rotation.z -= clampedDt * 0.05;
      }
    }

    // 3. Orbiting Spark Swarm Trajectory Update
    if (this.swarm && this.swarmPositions && !this.isFrozen) {
      const pos = this.swarmPositions;
      const count = this.swarmAngles.length;

      for (let i = 0; i < count; i++) {
        this.swarmAngles[i] += clampedDt * this.swarmSpeeds[i];
        const a = this.swarmAngles[i];
        const r = this.swarmRadii[i];
        const inc = this.swarmInclinations[i];

        const idx = i * 3;
        pos[idx] = Math.cos(a) * r;
        pos[idx + 1] = Math.sin(a) * Math.sin(inc) * r;
        pos[idx + 2] = Math.sin(a) * Math.cos(inc) * r;
      }
      this.swarm.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Subtle Base Root Float (Idle cosmetic motion when not grabbed)
    if (!this.isGrabbed) {
      this.root.position.y = 0.25 + Math.sin(elapsed * 1.2) * 0.04;
    }
  }

  dispose() {
    this.scene.remove(this.root);
    // Dispose materials
    [this.silverMetalMat, this.graphiteMat, this.cyanEmissiveMat, this.iceBlueMat].forEach(m => m.dispose());
  }
}
