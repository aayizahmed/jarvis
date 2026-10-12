/**
 * GestureFlow — Functional 3D Entity Inventory & Spawning Manager
 * Instantiates, duplicates, deletes, and manages interactive Three.js assets:
 * Cube, Sphere, Torus, Pyramid, Cylinder, Energy Orb, Particle Cloud, Portal Ring.
 */

import * as THREE from 'three';

export const INVENTORY_ASSETS = [
  { id: 'cube',     name: 'Quantum Cube',       cat: 'shapes',   icon: '🧊', desc: 'Chamfered Titanium Cube with wireframe cage' },
  { id: 'sphere',   name: 'Emerald Reactor',    cat: 'shapes',   icon: '🟢', desc: 'Translucent Emerald sphere with inner reactor core' },
  { id: 'torus',    name: 'Accelerator Torus',  cat: 'shapes',   icon: '🍩', desc: 'Cobalt Toroid with magnetic induction ring' },
  { id: 'pyramid',  name: 'Golden Tetrahedron', cat: 'shapes',   icon: '🔺', desc: 'Specular gold pyramid with acute faceted vertices' },
  { id: 'cylinder', name: 'Power Cell',         cat: 'objects',  icon: '🔋', desc: 'Brushed silver cylindrical plasma storage cell' },
  { id: 'orb',      name: 'Energy Plasma Orb',  cat: 'powers',   icon: '⚡', desc: 'High-voltage electric cyan plasma anomaly' },
  { id: 'cloud',    name: 'Mini Nebula Cloud',  cat: 'particles',icon: '✨', desc: 'Swirling cluster of 400 quantum dust particles' },
  { id: 'portal',   name: 'Vortex Portal Ring', cat: 'effects',  icon: '🌀', desc: 'Helical spatial gateway with inward particle acceleration' }
];

export class InventoryManager {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.scene = sceneManager.scene;
    this.spawnedEntities = [];
    this.entityCounter = 0;

    // Materials Library for instant zero-lag spawning
    this._initMaterials();
  }

  _initMaterials() {
    this.matCube = new THREE.MeshPhysicalMaterial({
      color: 0x162032,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.6
    });

    this.matSphere = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      transmission: 0.35,
      thickness: 1.0,
      metalness: 0.2,
      roughness: 0.12,
      clearcoat: 0.85
    });

    this.matTorus = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.7
    });

    this.matPyramid = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 0.6
    });

    this.matCylinder = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      metalness: 0.92,
      roughness: 0.15,
      clearcoat: 0.8
    });
  }

  /**
   * Spawn a new 3D entity into the stage
   * @param {string} assetId 
   * @param {THREE.Vector3} [customPos] 
   * @returns {THREE.Object3D} Spawned entity
   */
  spawnEntity(assetId, customPos = null) {
    this.entityCounter++;
    let entity = null;
    const defaultColor = 0x00f0ff;

    switch (assetId) {
      case 'cube': {
        const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        entity = new THREE.Mesh(geo, this.matCube.clone());
        entity.name = `Quantum Cube #${this.entityCounter}`;

        // Holographic wireframe overlay
        const wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45 })
        );
        entity.add(wire);
        entity.userData = { defaultColor: 0x162032, accentColor: 0x00f0ff, type: 'cube' };
        break;
      }

      case 'sphere': {
        const geo = new THREE.SphereGeometry(0.85, 36, 36);
        entity = new THREE.Mesh(geo, this.matSphere.clone());
        entity.name = `Emerald Reactor #${this.entityCounter}`;

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x00f59b, transparent: true, opacity: 0.8 })
        );
        entity.add(core);
        entity.userData = { defaultColor: 0x064e3b, accentColor: 0x00f59b, type: 'sphere' };
        break;
      }

      case 'torus': {
        const geo = new THREE.TorusGeometry(0.85, 0.28, 24, 48);
        entity = new THREE.Mesh(geo, this.matTorus.clone());
        entity.name = `Accelerator Torus #${this.entityCounter}`;

        const innerRing = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.54, 32),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        entity.add(innerRing);
        entity.userData = { defaultColor: 0x0369a1, accentColor: 0x00f0ff, type: 'torus' };
        break;
      }

      case 'pyramid': {
        const geo = new THREE.ConeGeometry(0.9, 1.4, 4);
        entity = new THREE.Mesh(geo, this.matPyramid.clone());
        entity.name = `Golden Tetrahedron #${this.entityCounter}`;

        const wire = new THREE.LineSegments(
          new THREE.WireframeGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 })
        );
        entity.add(wire);
        entity.userData = { defaultColor: 0xd97706, accentColor: 0xf59e0b, type: 'pyramid' };
        break;
      }

      case 'cylinder': {
        const geo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 24);
        entity = new THREE.Mesh(geo, this.matCylinder.clone());
        entity.name = `Power Cell #${this.entityCounter}`;

        const ring = new THREE.Mesh(
          new THREE.CylinderGeometry(0.52, 0.52, 0.2, 24),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff })
        );
        entity.add(ring);
        entity.userData = { defaultColor: 0x64748b, accentColor: 0x00f0ff, type: 'cylinder' };
        break;
      }

      case 'orb': {
        entity = new THREE.Group();
        entity.name = `Plasma Orb #${this.entityCounter}`;
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 24, 24),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff, blending: THREE.AdditiveBlending })
        );
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 24, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.BackSide, blending: THREE.AdditiveBlending })
        );
        entity.add(core);
        entity.add(glow);
        entity.userData = { defaultColor: 0x00f0ff, accentColor: 0x00f0ff, type: 'orb' };
        break;
      }

      case 'cloud': {
        entity = new THREE.Group();
        entity.name = `Nebula Cloud #${this.entityCounter}`;
        const pCount = 350;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i += 3) {
          pPos[i] = (Math.random() - 0.5) * 1.6;
          pPos[i + 1] = (Math.random() - 0.5) * 1.6;
          pPos[i + 2] = (Math.random() - 0.5) * 1.6;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0xa855f7,
          size: 0.08,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        entity.add(new THREE.Points(pGeo, pMat));
        entity.userData = { defaultColor: 0xa855f7, accentColor: 0xa855f7, type: 'cloud' };
        break;
      }

      case 'portal': {
        entity = new THREE.Group();
        entity.name = `Portal Ring #${this.entityCounter}`;
        const ringGeo = new THREE.TorusGeometry(0.95, 0.08, 16, 48);
        const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        const vortexGeo = new THREE.CircleGeometry(0.85, 32);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x064e3b, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
        entity.add(ringMesh);
        entity.add(new THREE.Mesh(vortexGeo, vortexMat));
        entity.userData = { defaultColor: 0x00f0ff, accentColor: 0x00f0ff, type: 'portal' };
        break;
      }

      default:
        return null;
    }

    // Common properties & initial positioning
    entity.castShadow = true;
    entity.receiveShadow = true;
    entity.userData.baseScale = new THREE.Vector3(1, 1, 1);
    entity.userData.isSpawnedEntity = true;

    // Position offset spread
    if (customPos) {
      entity.position.copy(customPos);
    } else {
      const angle = (this.spawnedEntities.length * 1.25) % (Math.PI * 2);
      const rad = 2.4 + (this.spawnedEntities.length % 3) * 0.6;
      entity.position.set(Math.cos(angle) * rad, 0.35 + (this.spawnedEntities.length % 2) * 0.4, Math.sin(angle) * rad * 0.5);
    }

    // Spawn entrance scale pop
    entity.scale.set(0.01, 0.01, 0.01);
    this.scene.add(entity);
    this.spawnedEntities.push(entity);

    // Register into SceneManager interactive objects list
    this.sm.interactiveObjects.push(entity);
    this.sm.setSelectedObject(entity, false);

    // Smooth entrance pop animation
    let popProgress = 0;
    const popAnim = () => {
      popProgress += 0.12;
      const s = Math.min(1.0, popProgress);
      entity.scale.set(s, s, s);
      if (popProgress < 1.0) {
        requestAnimationFrame(popAnim);
      }
    };
    requestAnimationFrame(popAnim);

    return entity;
  }

  duplicateEntity(entity) {
    if (!entity || !entity.userData || !entity.userData.type) return null;
    const offset = new THREE.Vector3(0.5, 0.2, 0.3);
    const newPos = entity.position.clone().add(offset);
    return this.spawnEntity(entity.userData.type, newPos);
  }

  deleteEntity(entity) {
    if (!entity) return;
    const idx = this.spawnedEntities.indexOf(entity);
    if (idx !== -1) {
      this.spawnedEntities.splice(idx, 1);
    }

    const smIdx = this.sm.interactiveObjects.indexOf(entity);
    if (smIdx !== -1) {
      this.sm.interactiveObjects.splice(smIdx, 1);
    }

    if (this.sm.selectedObject === entity) {
      this.sm.setSelectedObject(this.sm.jarvisCore ? this.sm.jarvisCore.root : null, false);
    }

    this.scene.remove(entity);
    this._disposeObject(entity);
  }

  clearAll() {
    [...this.spawnedEntities].forEach(e => this.deleteEntity(e));
    this.spawnedEntities = [];
  }

  _disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
    if (obj.children) {
      obj.children.forEach(c => this._disposeObject(c));
    }
  }

  getEntityCount() {
    return this.spawnedEntities.length;
  }
}
