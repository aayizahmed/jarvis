/**
 * GestureFlow Reality Engine — Procedural Spawn Manager
 * Generates, instances, clones, and cleanly disposes real Three.js 3D objects,
 * environments, visual effects, and force fields with zero memory leaks.
 */

import * as THREE from 'three';

export class SpawnManager {
  constructor(scene) {
    this.scene = scene;
    this.spawnedObjects = [];
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Reality Engine Spawn Root';
    this.scene.add(this.rootGroup);

    this.idCounter = 0;
  }

  /**
   * Spawn a new 3D entity from an inventory item definition
   * @param {Object} itemDef Item from INVENTORY_ITEMS
   * @param {THREE.Vector3|null} position Optional spawn position
   * @returns {THREE.Object3D} Created 3D entity
   */
  spawn(itemDef, position = null) {
    this.idCounter++;
    const id = `item_${this.idCounter}`;
    const name = `${itemDef.name} #${this.idCounter}`;

    let object3D = null;

    switch (itemDef.type) {
      // Shapes
      case 'cube': object3D = this._createCube(itemDef); break;
      case 'sphere': object3D = this._createSphere(itemDef); break;
      case 'torus': object3D = this._createTorus(itemDef); break;
      case 'cone': object3D = this._createCone(itemDef); break;
      case 'pyramid': object3D = this._createPyramid(itemDef); break;
      case 'icosahedron': object3D = this._createIcosahedron(itemDef); break;
      case 'cylinder': object3D = this._createCylinder(itemDef); break;
      case 'ring': object3D = this._createRing(itemDef); break;

      // Environments & Objects
      case 'planet': object3D = this._createPlanet(itemDef); break;
      case 'moon': object3D = this._createMoon(itemDef); break;
      case 'platform': object3D = this._createPlatform(itemDef); break;
      case 'crystal': object3D = this._createCrystal(itemDef); break;
      case 'energy_core': object3D = this._createEnergyCore(itemDef); break;
      case 'portal_frame': object3D = this._createPortalFrame(itemDef); break;

      // Powers & Effects
      case 'energy_orb': object3D = this._createEnergyOrb(itemDef); break;
      case 'force_field': object3D = this._createForceField(itemDef); break;
      case 'gravity_vortex': object3D = this._createGravityVortex(itemDef); break;
      case 'shockwave': object3D = this._createShockwave(itemDef); break;
      case 'lightning': object3D = this._createLightning(itemDef); break;

      default:
        object3D = this._createCube(itemDef);
        break;
    }

    object3D.name = name;
    object3D.userData = {
      isRealityObject: true,
      instanceId: id,
      itemDef: itemDef,
      accentColor: itemDef.color || 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      hasInertia: true,
      webConnections: [],
      ...object3D.userData
    };

    // Calculate spawn position (staggered around center if position is null)
    if (position) {
      object3D.position.copy(position);
    } else {
      const angle = (this.idCounter * 0.9) % (Math.PI * 2);
      const radius = 1.0 + (this.idCounter % 3) * 0.7;
      object3D.position.set(
        Math.cos(angle) * radius,
        0.5 + (this.idCounter % 3) * 0.35,
        Math.sin(angle) * 0.8
      );
    }

    this.rootGroup.add(object3D);
    this.spawnedObjects.push(object3D);
    return object3D;
  }

  // =========================================================================
  // SHAPE GENERATORS
  // =========================================================================

  _createCube(item) {
    const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2, 2, 2, 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Glowing wireframe
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.65 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createSphere(item) {
    const geo = new THREE.SphereGeometry(0.85, 36, 36);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      metalness: 0.2,
      roughness: 0.15,
      transmission: 0.4,
      thickness: 1.0,
      clearcoat: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    // Core glow
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.75 })
    );
    mesh.add(core);
    return mesh;
  }

  _createTorus(item) {
    const geo = new THREE.TorusGeometry(0.85, 0.28, 24, 48);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x3b0764,
      metalness: 0.75,
      roughness: 0.2,
      clearcoat: 0.6
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.5 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createCone(item) {
    const geo = new THREE.ConeGeometry(0.75, 1.5, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x451a03,
      metalness: 0.6,
      roughness: 0.25,
      clearcoat: 0.6
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.6 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createPyramid(item) {
    const geo = new THREE.TetrahedronGeometry(1.0, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x4c0519,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.75 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createIcosahedron(item) {
    const geo = new THREE.IcosahedronGeometry(0.9, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x082f49,
      metalness: 0.5,
      roughness: 0.15,
      transmission: 0.35,
      clearcoat: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.8 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createCylinder(item) {
    const geo = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.65 })
    );
    mesh.add(wire);
    return mesh;
  }

  _createRing(item) {
    const geo = new THREE.TorusGeometry(1.0, 0.08, 16, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: item.color,
      transparent: true,
      opacity: 0.95
    });
    return new THREE.Mesh(geo, mat);
  }

  // =========================================================================
  // ENVIRONMENT & OBJECT GENERATORS
  // =========================================================================

  _createPlanet(item) {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(1.1, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.45,
      metalness: 0.15
    });
    const planetMesh = new THREE.Mesh(geo, mat);
    planetMesh.castShadow = true;
    group.add(planetMesh);

    // Atmosphere Glow Shell
    const atmoGeo = new THREE.SphereGeometry(1.25, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Latitude rings
    const ringGeo = new THREE.RingGeometry(1.4, 1.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2.5;
    group.add(rings);

    group.userData.isPlanet = true;
    return group;
  }

  _createMoon(item) {
    const geo = new THREE.SphereGeometry(0.6, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.1
    });
    return new THREE.Mesh(geo, mat);
  }

  _createPlatform(item) {
    const group = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.4, 0.2, 32);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.receiveShadow = true;
    group.add(base);

    // Neon edge beacon
    const edgeGeo = new THREE.TorusGeometry(1.5, 0.04, 12, 48);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.1;
    group.add(edge);

    return group;
  }

  _createCrystal(item) {
    const geo = new THREE.ConeGeometry(0.7, 2.0, 6);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x00f59b,
      emissive: 0x064e3b,
      emissiveIntensity: 0.4,
      transmission: 0.65,
      roughness: 0.1,
      thickness: 1.2,
      clearcoat: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  _createEnergyCore(item) {
    const group = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(0.45, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbiting electromagnetic rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.85 + i * 0.15, 0.035, 12, 36);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f59b });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.set(i * 0.8, i * 0.6, 0);
      group.add(ring);
    }
    group.userData.isEnergyCore = true;
    return group;
  }

  _createPortalFrame(item) {
    const group = new THREE.Group();
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, -0.8, 0),
      new THREE.Vector3(-1.2, 1.2, 0),
      new THREE.Vector3(0, 1.8, 0),
      new THREE.Vector3(1.2, 1.2, 0),
      new THREE.Vector3(1.2, -0.8, 0)
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 32, 0.12, 12, false);
    const archMat = new THREE.MeshPhysicalMaterial({ color: 0x1e1b4b, metalness: 0.9, roughness: 0.2 });
    group.add(new THREE.Mesh(archGeo, archMat));

    // Swirling portal vortex plane
    const vortexGeo = new THREE.PlaneGeometry(2.2, 2.5);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.position.set(0, 0.5, 0);
    group.add(vortex);
    group.userData.isPortal = true;
    return group;
  }

  // =========================================================================
  // POWERS & VISUAL EFFECTS
  // =========================================================================

  _createEnergyOrb(item) {
    const group = new THREE.Group();
    const orbGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffb800,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(orbGeo, orbMat));

    const coronaGeo = new THREE.SphereGeometry(0.95, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));

    group.userData.isEnergyOrb = true;
    return group;
  }

  _createForceField(item) {
    const geo = new THREE.SphereGeometry(1.6, 24, 24);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.isForceField = true;
    return mesh;
  }

  _createGravityVortex(item) {
    const group = new THREE.Group();
    // Concentric spiral rings
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(0.3 + i * 0.3, 0.38 + i * 0.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6 - i * 0.1,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = (i - 2) * 0.12;
      group.add(ring);
    }
    group.userData.isGravityVortex = true;
    return group;
  }

  _createShockwave(item) {
    const geo = new THREE.RingGeometry(0.2, 1.8, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f59b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.userData.isShockwave = true;
    return mesh;
  }

  _createLightning(item) {
    const pts = [];
    let cur = new THREE.Vector3(0, 1.5, 0);
    pts.push(cur.clone());
    for (let i = 0; i < 8; i++) {
      cur = new THREE.Vector3(
        cur.x + (Math.random() - 0.5) * 0.6,
        cur.y - 0.35,
        cur.z + (Math.random() - 0.5) * 0.6
      );
      pts.push(cur.clone());
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 16, 0.04, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.isLightning = true;
    return mesh;
  }

  // =========================================================================
  // ACTIONS: DUPLICATE, REMOVE, CLEAR
  // =========================================================================

  duplicate(obj) {
    if (!obj || !obj.userData || !obj.userData.itemDef) return null;
    const itemDef = obj.userData.itemDef;
    const newPos = obj.position.clone().add(new THREE.Vector3(0.5, 0.3, 0));
    const clone = this.spawn(itemDef, newPos);
    clone.rotation.copy(obj.rotation);
    clone.scale.copy(obj.scale);
    return clone;
  }

  remove(obj) {
    if (!obj) return;
    const idx = this.spawnedObjects.indexOf(obj);
    if (idx !== -1) {
      this.spawnedObjects.splice(idx, 1);
    }
    this.rootGroup.remove(obj);
    this._disposeObject(obj);
  }

  clearAll() {
    while (this.spawnedObjects.length > 0) {
      const obj = this.spawnedObjects.pop();
      this.rootGroup.remove(obj);
      this._disposeObject(obj);
    }
    this.idCounter = 0;
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

  // =========================================================================
  // ANIMATION TICK
  // =========================================================================

  update(dt, elapsed) {
    this.spawnedObjects.forEach((obj, idx) => {
      // Idle rotation for specific items
      if (obj.userData.isPlanet) {
        obj.rotation.y += dt * 0.4;
      } else if (obj.userData.isEnergyCore) {
        obj.children.forEach((child, cIdx) => {
          if (cIdx > 0) child.rotation.z += dt * (1.2 + cIdx * 0.5);
        });
      } else if (obj.userData.isPortal) {
        obj.rotation.y = Math.sin(elapsed * 0.5) * 0.15;
      } else if (obj.userData.isGravityVortex) {
        obj.rotation.y += dt * 3.5;
      }
    });
  }
}
