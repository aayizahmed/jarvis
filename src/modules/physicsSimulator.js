/**
 * GestureFlow Reality Engine — Virtual Physics Simulator
 * Lightweight, deterministic physics: inertia damping, web spring tension,
 * force field repulsion, gravitational vortex attraction, and stage boundary clamping.
 */

import * as THREE from 'three';

export class PhysicsSimulator {
  constructor() {
    this.enabled = true;
    this.gravity = -1.2; // Gentle low-g floating feel
    this.damping = 0.92; // Air drag
    this.groundY = -1.2;

    // Bounds in 3D world units
    this.bounds = {
      minX: -6.5, maxX: 6.5,
      minY: -1.2, maxY: 4.8,
      minZ: -5.5, maxZ: 5.5
    };
  }

  /**
   * Step physics for all active entities and webs
   * @param {number} dt Delta time
   * @param {Array<THREE.Object3D>} entities Active spawned entities
   * @param {THREE.Object3D|null} heldObject Currently grabbed object (exempt from free motion)
   */
  step(dt, entities = [], heldObject = null) {
    if (!this.enabled) return;
    const clampedDt = Math.max(0.001, Math.min(0.05, dt));

    // 1. Process Force Fields and Gravity Vortices
    const forceFields = entities.filter(e => e.userData && e.userData.itemDef && e.userData.itemDef.type === 'force_field');
    const vortices = entities.filter(e => e.userData && e.userData.itemDef && e.userData.itemDef.type === 'gravity_vortex');

    // 2. Iterate entities
    for (let i = 0; i < entities.length; i++) {
      const obj = entities[i];
      if (obj === heldObject || !obj.userData || !obj.userData.hasInertia) continue;

      const vel = obj.userData.velocity;
      if (!vel) continue;

      // Apply Force Field Repulsion
      forceFields.forEach(ff => {
        if (ff === obj) return;
        const diff = new THREE.Vector3().subVectors(obj.position, ff.position);
        const dist = diff.length();
        const fieldRadius = 2.4;
        if (dist < fieldRadius && dist > 0.1) {
          const force = (1.0 - dist / fieldRadius) * 12.0;
          diff.normalize().multiplyScalar(force * clampedDt);
          vel.add(diff);
        }
      });

      // Apply Gravity Vortex Attraction
      vortices.forEach(vor => {
        if (vor === obj) return;
        const diff = new THREE.Vector3().subVectors(vor.position, obj.position);
        const dist = diff.length();
        const vortexRadius = 3.8;
        if (dist < vortexRadius && dist > 0.4) {
          const pull = (1.0 - dist / vortexRadius) * 8.0;
          diff.normalize().multiplyScalar(pull * clampedDt);
          vel.add(diff);
        }
      });

      // Apply Web Spring Forces
      if (obj.userData.webConnections && obj.userData.webConnections.length > 0) {
        obj.userData.webConnections.forEach(strand => {
          if (strand.type === 'object') {
            const other = (strand.objA === obj) ? strand.objB : strand.objA;
            if (other && other.parent) {
              const delta = new THREE.Vector3().subVectors(other.position, obj.position);
              const curDist = delta.length();
              const displacement = curDist - (strand.restLength || 2.0);

              if (Math.abs(displacement) > 0.05 && curDist > 0.01) {
                const springForce = delta.normalize().multiplyScalar(displacement * (strand.stiffness || 14.0) * clampedDt);
                vel.add(springForce);
              }
            }
          }
        });
      }

      // Step position with velocity
      obj.position.addScaledVector(vel, clampedDt);

      // Apply drag
      vel.multiplyScalar(this.damping);

      // Angular velocity step
      if (obj.userData.angularVelocity) {
        obj.rotation.x += obj.userData.angularVelocity.x * clampedDt;
        obj.rotation.y += obj.userData.angularVelocity.y * clampedDt;
        obj.rotation.z += obj.userData.angularVelocity.z * clampedDt;
        obj.userData.angularVelocity.multiplyScalar(this.damping);
      }

      // Boundary soft bouncing / clamping
      if (obj.position.x < this.bounds.minX) { obj.position.x = this.bounds.minX; vel.x *= -0.5; }
      if (obj.position.x > this.bounds.maxX) { obj.position.x = this.bounds.maxX; vel.x *= -0.5; }
      if (obj.position.y < this.bounds.minY) { obj.position.y = this.bounds.minY; vel.y *= -0.5; }
      if (obj.position.y > this.bounds.maxY) { obj.position.y = this.bounds.maxY; vel.y *= -0.5; }
      if (obj.position.z < this.bounds.minZ) { obj.position.z = this.bounds.minZ; vel.z *= -0.5; }
      if (obj.position.z > this.bounds.maxZ) { obj.position.z = this.bounds.maxZ; vel.z *= -0.5; }
    }
  }
}
