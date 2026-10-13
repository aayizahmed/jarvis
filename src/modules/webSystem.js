/**
 * GestureFlow Reality Engine — Superhero Web & Multi-Tether System
 * Procedural elastic web strands, catenary sagging curve calculation,
 * projectile travel animation, target clamp anchors, elastic pulling,
 * and multi-object tethering matrices.
 */

import * as THREE from 'three';

export class WebSystem {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Web System Root';
    this.scene.add(this.rootGroup);

    // Active webs list
    // Strand: { id, type: 'hand'|'object', startObj, endObj, startPos, endPos, progress, active, color }
    this.strands = [];
    this.maxStrands = 20;

    // Line segments resolution
    this.segments = 20;

    // Web Anchor Clamp Ring template
    this.anchorGeo = new THREE.RingGeometry(0.12, 0.18, 16);
    this.anchorMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    // Particle Burst Pool for web impacts and releases
    this.bursts = [];
  }

  /**
   * Shoot a superhero web strand from hand cursor toward a target object
   * @param {THREE.Vector3} emitterPos Virtual hand cursor 3D position
   * @param {THREE.Object3D} targetObj Targeted 3D entity
   * @param {number} hexColor Web color (default ice-white / cyan 0xe2e8f0)
   */
  shootWeb(emitterPos, targetObj, hexColor = 0x00f0ff) {
    if (!emitterPos || !targetObj) return null;

    // Pre-allocate buffer geometry for the strand
    const positions = new Float32Array((this.segments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geo, mat);
    this.rootGroup.add(line);

    // Anchor clamp on target
    const anchor = new THREE.Mesh(this.anchorGeo, this.anchorMat.clone());
    anchor.material.color.setHex(hexColor);
    anchor.visible = false;
    this.rootGroup.add(anchor);

    const strand = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'hand',
      line: line,
      geo: geo,
      mat: mat,
      anchor: anchor,
      emitterPos: emitterPos.clone(),
      targetObj: targetObj,
      targetOffset: new THREE.Vector3(0, 0, 0),
      progress: 0.0, // 0 to 1 during flight
      isAttached: false,
      isPulling: false,
      sagAmount: 0.35,
      color: hexColor
    };

    this.strands.push(strand);
    return strand;
  }

  /**
   * Connect two objects together with a permanent elastic web strand
   * @param {THREE.Object3D} objA 
   * @param {THREE.Object3D} objB 
   */
  connectObjects(objA, objB, hexColor = 0x00f0ff) {
    if (!objA || !objB || objA === objB) return null;

    const positions = new Float32Array((this.segments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geo, mat);
    this.rootGroup.add(line);

    const strand = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'object',
      line: line,
      geo: geo,
      mat: mat,
      objA: objA,
      objB: objB,
      restLength: objA.position.distanceTo(objB.position),
      stiffness: 18.0, // Hooke's spring constant
      damping: 0.85
    };

    // Register on userData for physics solver
    if (!objA.userData.webConnections) objA.userData.webConnections = [];
    if (!objB.userData.webConnections) objB.userData.webConnections = [];
    objA.userData.webConnections.push(strand);
    objB.userData.webConnections.push(strand);

    this.strands.push(strand);
    this._triggerBurst(objA.position, hexColor);
    this._triggerBurst(objB.position, hexColor);
    return strand;
  }

  /**
   * Release and dissolve a specific web strand with a particle pop
   * @param {Object} strand 
   */
  releaseStrand(strand) {
    const idx = this.strands.indexOf(strand);
    if (idx !== -1) {
      this.strands.splice(idx, 1);
    }

    if (strand.targetObj) {
      this._triggerBurst(strand.targetObj.position, strand.color);
    }

    this.rootGroup.remove(strand.line);
    strand.geo.dispose();
    strand.mat.dispose();

    if (strand.anchor) {
      this.rootGroup.remove(strand.anchor);
      strand.anchor.material.dispose();
    }
  }

  /**
   * Clear all active web strands
   */
  clearAll() {
    while (this.strands.length > 0) {
      this.releaseStrand(this.strands[0]);
    }
  }

  // =========================================================================
  // ANIMATION & CATENARY CURVE SOLVER
  // =========================================================================

  update(dt, emitterPos, elapsed = 0) {
    const clampedDt = Math.max(0.001, Math.min(0.05, dt));

    for (let i = this.strands.length - 1; i >= 0; i--) {
      const s = this.strands[i];

      if (s.type === 'hand') {
        // Update emitter position to follow active hand
        if (emitterPos) {
          s.emitterPos.copy(emitterPos);
        }

        // Target position
        if (!s.targetObj || !s.targetObj.parent) {
          this.releaseStrand(s);
          continue;
        }

        const targetPos = s.targetObj.position;

        // Animate initial web projectile flight from hand to target
        if (!s.isAttached) {
          s.progress += clampedDt * 4.5; // ~220ms travel time
          if (s.progress >= 1.0) {
            s.progress = 1.0;
            s.isAttached = true;
            s.anchor.visible = true;
            this._triggerBurst(targetPos, s.color);
          }
        }

        // Current tip position during flight
        const currentTip = s.emitterPos.clone().lerp(targetPos, s.progress);
        s.anchor.position.copy(targetPos);
        s.anchor.lookAt(s.emitterPos);

        // Compute parabolic elastic catenary strand curve
        this._updateCurvedPositions(s.geo, s.emitterPos, currentTip, s.sagAmount, elapsed);

        // Pull interaction: smoothly pull target towards emitter
        if (s.isAttached && s.isPulling) {
          const dir = new THREE.Vector3().subVectors(s.emitterPos, targetPos);
          const dist = dir.length();
          if (dist > 1.2) {
            dir.normalize();
            s.targetObj.position.addScaledVector(dir, clampedDt * 5.0);
          }
        }

      } else if (s.type === 'object') {
        // Object-to-object tether line
        if (!s.objA.parent || !s.objB.parent) {
          this.releaseStrand(s);
          continue;
        }

        const posA = s.objA.position;
        const posB = s.objB.position;

        this._updateCurvedPositions(s.geo, posA, posB, 0.15, elapsed);
      }
    }

    // Update impact particle bursts
    this._updateBursts(clampedDt);
  }

  _updateCurvedPositions(geo, start, end, sag, elapsed) {
    const pos = geo.attributes.position.array;
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Gravity sag + energy vibration
    mid.y -= sag;
    mid.x += Math.sin(elapsed * 18.0) * 0.02;

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(this.segments);

    for (let i = 0; i <= this.segments; i++) {
      pos[i * 3] = pts[i].x;
      pos[i * 3 + 1] = pts[i].y;
      pos[i * 3 + 2] = pts[i].z;
    }

    geo.attributes.position.needsUpdate = true;
  }

  // =========================================================================
  // IMPACT & RELEASE PARTICLE BURSTS
  // =========================================================================

  _triggerBurst(position, hexColor) {
    const count = 16;
    const posArr = new Float32Array(count * 3);
    const velArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = position.x;
      posArr[i * 3 + 1] = position.y;
      posArr[i * 3 + 2] = position.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2.0 + Math.random() * 2.5;

      velArr[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velArr[i * 3 + 1] = Math.cos(phi) * speed;
      velArr[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({
      color: hexColor,
      size: 0.08,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    this.rootGroup.add(points);

    this.bursts.push({ points, geo, mat, velArr, life: 0.35 });
  }

  _updateBursts(dt) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.rootGroup.remove(b.points);
        b.geo.dispose();
        b.mat.dispose();
        this.bursts.splice(i, 1);
        continue;
      }

      const pos = b.geo.attributes.position.array;
      const count = pos.length / 3;
      for (let j = 0; j < count; j++) {
        pos[j * 3] += b.velArr[j * 3] * dt;
        pos[j * 3 + 1] += b.velArr[j * 3 + 1] * dt;
        pos[j * 3 + 2] += b.velArr[j * 3 + 2] * dt;
      }
      b.mat.opacity = b.life / 0.35;
      b.geo.attributes.position.needsUpdate = true;
    }
  }
}
