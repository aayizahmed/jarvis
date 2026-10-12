/**
 * GestureFlow — Holographic Energy Beam / Tether Renderer
 * Draws an active procedural energy connector between the hand cursor
 * and the manipulated 3D object with zero per-frame memory allocation.
 */

import * as THREE from 'three';

export class EnergyBeamRenderer {
  constructor(scene) {
    this.scene = scene;
    this.segments = 24;

    this.positions = new Float32Array((this.segments + 1) * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Core beam material
    this.material = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });

    this.line = new THREE.Line(this.geometry, this.material);
    this.line.visible = false;
    this.scene.add(this.line);

    // Endpoint anchor pulses
    const ringGeo = new THREE.RingGeometry(0.08, 0.12, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f59b,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.anchorRing = new THREE.Mesh(ringGeo, ringMat);
    this.anchorRing.visible = false;
    this.scene.add(this.anchorRing);
  }

  /**
   * Update tether line coordinates between start (cursor) and end (object)
   * @param {THREE.Vector3} startPos 3D cursor position
   * @param {THREE.Vector3} endPos 3D object center
   * @param {number} elapsed Elapsed time in seconds for high-voltage jitter
   */
  update(startPos, endPos, elapsed = 0) {
    if (!startPos || !endPos) {
      this.line.visible = false;
      this.anchorRing.visible = false;
      return;
    }

    this.line.visible = true;
    this.anchorRing.visible = true;
    this.anchorRing.position.copy(endPos);
    this.anchorRing.rotation.z = elapsed * 4.0;

    const pos = this.positions;
    for (let i = 0; i <= this.segments; i++) {
      const t = i / this.segments;
      const idx = i * 3;

      // Base linear interpolation
      const x = THREE.MathUtils.lerp(startPos.x, endPos.x, t);
      const y = THREE.MathUtils.lerp(startPos.y, endPos.y, t);
      const z = THREE.MathUtils.lerp(startPos.z, endPos.z, t);

      // Energy micro-jitter along middle segments (sine displacement + noise)
      const envelope = Math.sin(t * Math.PI); // 0 at ends, 1 in middle
      const jitter = Math.sin(elapsed * 25.0 + i * 1.8) * 0.045 * envelope;

      pos[idx] = x + jitter;
      pos[idx + 1] = y + jitter * 0.8;
      pos[idx + 2] = z + jitter * 0.5;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  hide() {
    this.line.visible = false;
    this.anchorRing.visible = false;
  }

  dispose() {
    this.scene.remove(this.line);
    this.scene.remove(this.anchorRing);
    this.geometry.dispose();
    this.material.dispose();
    this.anchorRing.geometry.dispose();
    this.anchorRing.material.dispose();
  }
}
