/**
 * GestureFlow Reality Engine — Sci-Fi Energy Projectile System
 * Object-pooled simulated plasma bolts with glowing particle spark trails,
 * collision detection against 3D sandbox entities, and impact bursts.
 */

import * as THREE from 'three';

export class ProjectileEngine {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Projectile Engine Root';
    this.scene.add(this.rootGroup);

    this.poolSize = 12;
    this.projectiles = [];
    this.activeProjectiles = [];
    this.impactBursts = [];

    this.timeScale = 1.0; // Normal speed or slow-mo (e.g. 0.3x)
    this.onHitCallback = null;

    this._initPool();
  }

  _initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const group = new THREE.Group();

      // Glowing Plasma Core
      const coreGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Trailing Corona Glow
      const coronaGeo = new THREE.SphereGeometry(0.3, 12, 12);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      const corona = new THREE.Mesh(coronaGeo, coronaMat);
      group.add(corona);

      // Trailing Particle Sparks Buffer
      const trailCount = 18;
      const trailPos = new Float32Array(trailCount * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      const trailMat = new THREE.PointsMaterial({
        color: 0x00f59b,
        size: 0.09,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const trail = new THREE.Points(trailGeo, trailMat);
      group.add(trail);

      group.visible = false;
      this.rootGroup.add(group);

      this.projectiles.push({
        group,
        core,
        corona,
        trail,
        trailGeo,
        trailPos,
        velocity: new THREE.Vector3(),
        startPos: new THREE.Vector3(),
        life: 0,
        maxLife: 2.5,
        speed: 16.0,
        color: 0x00f0ff
      });
    }
  }

  /**
   * Launch a plasma energy bolt
   * @param {THREE.Vector3} origin Emitter starting position
   * @param {THREE.Vector3} direction Direction vector (normalized)
   * @param {number} hexColor Bolt color
   */
  launch(origin, direction, hexColor = 0x00f0ff) {
    // Find available projectile from pool
    const p = this.projectiles.find(item => !this.activeProjectiles.includes(item));
    if (!p) return null;

    p.group.position.copy(origin);
    p.startPos.copy(origin);
    p.velocity.copy(direction).normalize().multiplyScalar(p.speed);
    p.life = p.maxLife;
    p.color = hexColor;

    p.core.material.color.setHex(hexColor);
    p.corona.material.color.setHex(hexColor);
    p.trail.material.color.setHex(hexColor);

    // Reset trail buffer
    for (let i = 0; i < p.trailPos.length; i += 3) {
      p.trailPos[i] = 0;
      p.trailPos[i + 1] = 0;
      p.trailPos[i + 2] = 0;
    }
    p.trailGeo.attributes.position.needsUpdate = true;

    p.group.visible = true;
    this.activeProjectiles.push(p);
    return p;
  }

  /**
   * Animation & collision tick
   * @param {number} dt Delta time
   * @param {Array<THREE.Object3D>} targetObjects Potential targets
   */
  update(dt, targetObjects = []) {
    const effDt = dt * this.timeScale;

    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const p = this.activeProjectiles[i];
      p.life -= effDt;

      if (p.life <= 0) {
        this._deactivate(p);
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      // Step position
      const prevPos = p.group.position.clone();
      p.group.position.addScaledVector(p.velocity, effDt);

      // Update trailing sparks
      const posArr = p.trailPos;
      for (let j = posArr.length - 3; j >= 3; j -= 3) {
        posArr[j] = posArr[j - 3];
        posArr[j + 1] = posArr[j - 2];
        posArr[j + 2] = posArr[j - 1];
      }
      posArr[0] = (Math.random() - 0.5) * 0.15;
      posArr[1] = (Math.random() - 0.5) * 0.15;
      posArr[2] = (Math.random() - 0.5) * 0.15;
      p.trailGeo.attributes.position.needsUpdate = true;

      // Check collision with scene entities
      let hit = false;
      for (const target of targetObjects) {
        if (!target.parent) continue;
        const dist = p.group.position.distanceTo(target.position);
        const hitRadius = (target.scale.x || 1.0) * 0.85;

        if (dist < hitRadius) {
          // Impact collision!
          hit = true;
          this._triggerImpactBurst(p.group.position, p.color);

          // Apply kinetic impulse to target velocity
          if (target.userData && target.userData.velocity) {
            target.userData.velocity.addScaledVector(p.velocity.clone().normalize(), 3.5);
          }

          if (this.onHitCallback) {
            this.onHitCallback(target, p);
          }
          break;
        }
      }

      if (hit) {
        this._deactivate(p);
        this.activeProjectiles.splice(i, 1);
      }
    }

    // Update impact explosions
    this._updateImpactBursts(effDt);
  }

  _triggerImpactBurst(pos, hexColor) {
    const count = 28;
    const posArr = new Float32Array(count * 3);
    const velArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 3.5 + Math.random() * 4.5;

      velArr[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velArr[i * 3 + 1] = Math.cos(phi) * speed;
      velArr[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({
      color: hexColor,
      size: 0.12,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    this.rootGroup.add(points);

    this.impactBursts.push({ points, geo, mat, velArr, life: 0.45 });
  }

  _updateImpactBursts(dt) {
    for (let i = this.impactBursts.length - 1; i >= 0; i--) {
      const b = this.impactBursts[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.rootGroup.remove(b.points);
        b.geo.dispose();
        b.mat.dispose();
        this.impactBursts.splice(i, 1);
        continue;
      }

      const pos = b.geo.attributes.position.array;
      const count = pos.length / 3;
      for (let j = 0; j < count; j++) {
        pos[j * 3] += b.velArr[j * 3] * dt;
        pos[j * 3 + 1] += b.velArr[j * 3 + 1] * dt;
        pos[j * 3 + 2] += b.velArr[j * 3 + 2] * dt;
      }
      b.mat.opacity = b.life / 0.45;
      b.geo.attributes.position.needsUpdate = true;
    }
  }

  _deactivate(p) {
    p.group.visible = false;
    p.life = 0;
  }

  clearAll() {
    this.activeProjectiles.forEach(p => this._deactivate(p));
    this.activeProjectiles = [];
  }
}
