/**
 * GestureFlow — Science Modules Engine
 * Fully procedural, interactive 3D scientific discovery modules:
 * 1. Solar System (Planetary orbits, rings, speed control, scale indicator)
 * 2. Human Anatomy (Beating heart, breathing lungs, brain cortex, ribcage)
 * 3. Atoms & Molecules (Bohr atom, H2O, CH4, CO2, DNA double helix)
 * 4. Geometry Lab (Platonic solids, Euler formula, mesh/particle modes)
 * 5. Earth Explorer (3D globe, atmosphere, coordinate grid, geographic hotspots)
 */

import * as THREE from 'three';

export class ScienceModulesManager {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.scene = sceneManager.scene;
    this.activeModuleId = null;
    this.activeGroup = new THREE.Group();
    this.activeGroup.name = 'Science Module Group';
    this.scene.add(this.activeGroup);

    // Current module interactive objects (for raycasting)
    this.interactiveObjects = [];

    // Module instances state
    this.moduleStates = {
      solar: { speedMultiplier: 1.0, paused: false, planets: [] },
      anatomy: { pulseRate: 1.0, selectedOrgan: null },
      chemistry: { activeSubModel: 'atom', models: {} },
      geometry: { activeSolid: 'Icosahedron', isParticleMode: false, solids: {} },
      earth: { rotationSpeed: 0.003, isRotating: true, hotspots: [] }
    };
  }

  // =========================================================================
  // LIFECYCLE & SWITCHING
  // =========================================================================

  activateModule(moduleId) {
    if (this.activeModuleId === moduleId) return;
    this.clearActiveModule();
    this.activeModuleId = moduleId;

    switch (moduleId) {
      case 'solar':
        this._buildSolarSystem();
        break;
      case 'anatomy':
        this._buildHumanAnatomy();
        break;
      case 'chemistry':
        this._buildAtomsAndMolecules();
        break;
      case 'geometry':
        this._buildGeometryLab();
        break;
      case 'earth':
        this._buildEarthExplorer();
        break;
      default:
        break;
    }

    // Synchronize interactive objects with scene manager
    this.sm.setInteractiveObjects(this.interactiveObjects);
  }

  clearActiveModule() {
    this.interactiveObjects = [];

    // Cleanly dispose of all meshes, geometries, and materials in active group
    while (this.activeGroup.children.length > 0) {
      const child = this.activeGroup.children[0];
      this.activeGroup.remove(child);
      this._disposeObject(child);
    }
  }

  _disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      obj.children.forEach(c => this._disposeObject(c));
    }
  }

  // =========================================================================
  // MODULE A: SOLAR SYSTEM
  // =========================================================================

  _buildSolarSystem() {
    const group = new THREE.Group();
    group.name = 'Solar System Root';
    this.activeGroup.add(group);

    // 1. Central Glowing Sun
    const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.95
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.name = 'Sun';
    sun.userData = {
      category: 'Star',
      accentColor: 0xffb703,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
    group.add(sun);
    this.interactiveObjects.push(sun);

    // Sun Corona Glow Shell
    const coronaGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfb8500,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    sun.add(corona);

    // Sun Light Source
    const sunLight = new THREE.PointLight(0xffedd5, 3.0, 30);
    sun.add(sunLight);

    // 2. Planets configuration: [Name, Radius, Dist, Period(Speed), Color, HasRings]
    const planetDefs = [
      { name: 'Mercury', r: 0.18, dist: 2.1, speed: 1.6, col: 0xa8a29e },
      { name: 'Venus',   r: 0.32, dist: 3.1, speed: 1.2, col: 0xeab308 },
      { name: 'Earth',   r: 0.36, dist: 4.2, speed: 1.0, col: 0x38bdf8, hasMoon: true },
      { name: 'Mars',    r: 0.24, dist: 5.3, speed: 0.8, col: 0xef4444 },
      { name: 'Jupiter', r: 0.75, dist: 6.9, speed: 0.45, col: 0xd97706 },
      { name: 'Saturn',  r: 0.62, dist: 8.7, speed: 0.32, col: 0xfcd34d, hasRings: true },
      { name: 'Uranus',  r: 0.44, dist: 10.4, speed: 0.22, col: 0x67e8f9 },
      { name: 'Neptune', r: 0.42, dist: 12.0, speed: 0.16, col: 0x3b82f6 }
    ];

    const planetsList = [];

    planetDefs.forEach(p => {
      // Orbit Line
      const orbitGeo = new THREE.BufferGeometry();
      const segments = 64;
      const orbitPts = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPts.push(new THREE.Vector3(Math.cos(theta) * p.dist, 0, Math.sin(theta) * p.dist));
      }
      orbitGeo.setFromPoints(orbitPts);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.16
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      group.add(orbitLine);

      // Planet Orbit Pivot
      const pivot = new THREE.Group();
      pivot.name = `${p.name} Orbit Pivot`;
      group.add(pivot);

      // Planet Mesh
      const pGeo = new THREE.SphereGeometry(p.r, 24, 24);
      const pMat = new THREE.MeshStandardMaterial({
        color: p.col,
        roughness: 0.5,
        metalness: 0.1
      });
      const planetMesh = new THREE.Mesh(pGeo, pMat);
      planetMesh.name = p.name;
      planetMesh.position.set(p.dist, 0, 0);
      planetMesh.castShadow = true;
      planetMesh.userData = {
        category: 'Planet',
        orbitDist: p.dist,
        orbitSpeed: p.speed,
        angle: Math.random() * Math.PI * 2,
        accentColor: p.col,
        baseScale: new THREE.Vector3(1, 1, 1)
      };

      // Saturn Rings
      if (p.hasRings) {
        const ringGeo = new THREE.RingGeometry(p.r * 1.4, p.r * 2.5, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.72
        });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2.6;
        planetMesh.add(rings);
      }

      // Earth Moon
      if (p.hasMoon) {
        const moonGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1 });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.name = 'Moon';
        moon.position.set(0.65, 0, 0);
        planetMesh.add(moon);
        planetMesh.userData.moon = moon;
      }

      pivot.add(planetMesh);
      this.interactiveObjects.push(planetMesh);
      planetsList.push(planetMesh);
    });

    this.moduleStates.solar.planets = planetsList;
  }

  // =========================================================================
  // MODULE B: HUMAN ANATOMY
  // =========================================================================

  _buildHumanAnatomy() {
    const group = new THREE.Group();
    group.name = 'Human Anatomy Root';
    this.activeGroup.add(group);

    // 1. Holographic Translucent Spine & Ribcage
    const ribcageGroup = new THREE.Group();
    ribcageGroup.name = 'Skeletal Ribcage & Spine';
    ribcageGroup.userData = {
      category: 'Skeletal System',
      accentColor: 0x67e8f9,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
    group.add(ribcageGroup);
    this.interactiveObjects.push(ribcageGroup);

    const boneMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.45,
      thickness: 0.8,
      clearcoat: 0.6
    });

    // Vertebral spine column
    for (let i = 0; i < 14; i++) {
      const vGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.14, 16);
      const vMesh = new THREE.Mesh(vGeo, boneMat);
      vMesh.position.set(0, (i - 7) * 0.22, -0.6);
      ribcageGroup.add(vMesh);
    }

    // Curved rib arches
    for (let i = 0; i < 8; i++) {
      const y = (i - 4) * 0.24 + 0.1;
      const width = 1.35 - Math.abs(i - 4) * 0.12;

      // Left rib
      const ribCurveL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, -0.6),
        new THREE.Vector3(-width, y, -0.2),
        new THREE.Vector3(-width * 0.95, y - 0.08, 0.5),
        new THREE.Vector3(0, y - 0.1, 0.6)
      ]);
      const ribGeoL = new THREE.TubeGeometry(ribCurveL, 20, 0.05, 8, false);
      const ribMeshL = new THREE.Mesh(ribGeoL, boneMat);
      ribcageGroup.add(ribMeshL);

      // Right rib
      const ribCurveR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, -0.6),
        new THREE.Vector3(width, y, -0.2),
        new THREE.Vector3(width * 0.95, y - 0.08, 0.5),
        new THREE.Vector3(0, y - 0.1, 0.6)
      ]);
      const ribGeoR = new THREE.TubeGeometry(ribCurveR, 20, 0.05, 8, false);
      const ribMeshR = new THREE.Mesh(ribGeoR, boneMat);
      ribcageGroup.add(ribMeshR);
    }

    // 2. Anatomical Pulsing Beating Heart (Center-Left)
    const heartGroup = new THREE.Group();
    heartGroup.name = 'Human Heart';
    heartGroup.position.set(-0.35, 0.2, 0.05);
    heartGroup.userData = {
      category: 'Cardiovascular System',
      accentColor: 0xef4444,
      baseScale: new THREE.Vector3(1, 1, 1),
      isBeating: true
    };
    group.add(heartGroup);
    this.interactiveObjects.push(heartGroup);

    // Heart muscular chambers
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8
    });

    const vLeft = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 24), heartMat);
    vLeft.position.set(0.12, -0.1, 0);
    vLeft.scale.set(0.9, 1.25, 0.85);
    heartGroup.add(vLeft);

    const vRight = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 24), heartMat);
    vRight.position.set(-0.24, 0.05, 0);
    vRight.scale.set(0.85, 1.1, 0.8);
    heartGroup.add(vRight);

    // Aortic Arch vessel
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0.1, 0.65, 0),
      new THREE.Vector3(0, 0.8, -0.1),
      new THREE.Vector3(-0.2, 0.6, -0.25)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 16, 0.12, 12, false);
    const aortaMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.2 });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    heartGroup.add(aortaMesh);

    // 3. Respiratory Lungs (Left & Right)
    const lungsGroup = new THREE.Group();
    lungsGroup.name = 'Lungs & Respiratory Tree';
    lungsGroup.userData = {
      category: 'Respiratory System',
      accentColor: 0x38bdf8,
      baseScale: new THREE.Vector3(1, 1, 1),
      isBreathing: true
    };
    group.add(lungsGroup);
    this.interactiveObjects.push(lungsGroup);

    const lungMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.3,
      roughness: 0.35,
      thickness: 1.0,
      opacity: 0.85,
      transparent: true
    });

    const lungLeft = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.9, 16, 24), lungMat);
    lungLeft.position.set(-1.15, 0.1, -0.1);
    lungLeft.rotation.z = -0.12;
    lungsGroup.add(lungLeft);

    const lungRight = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.0, 16, 24), lungMat);
    lungRight.position.set(1.05, 0.1, -0.1);
    lungRight.rotation.z = 0.12;
    lungsGroup.add(lungRight);

    // Trachea airway tube
    const tracheaGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 16);
    const tracheaMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.3 });
    const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
    trachea.position.set(0, 1.25, -0.3);
    lungsGroup.add(trachea);

    // 4. Brain & Neural Cortex (Elevated above)
    const brainGroup = new THREE.Group();
    brainGroup.name = 'Brain & Nervous Cortex';
    brainGroup.position.set(0, 2.3, -0.2);
    brainGroup.userData = {
      category: 'Nervous System',
      accentColor: 0xa855f7,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
    group.add(brainGroup);
    this.interactiveObjects.push(brainGroup);

    const cortexMat = new THREE.MeshPhysicalMaterial({
      color: 0x9333ea,
      emissive: 0x581c87,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.15,
      clearcoat: 0.5
    });

    const hemisphereL = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), cortexMat);
    hemisphereL.position.set(-0.25, 0, 0);
    hemisphereL.scale.set(0.9, 0.85, 1.25);
    brainGroup.add(hemisphereL);

    const hemisphereR = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), cortexMat);
    hemisphereR.position.set(0.25, 0, 0);
    hemisphereR.scale.set(0.9, 0.85, 1.25);
    brainGroup.add(hemisphereR);

    // Synaptic particles pulsing around brain
    const synCount = 180;
    const synPos = new Float32Array(synCount * 3);
    for (let i = 0; i < synCount * 3; i += 3) {
      synPos[i] = (Math.random() - 0.5) * 1.5;
      synPos[i + 1] = (Math.random() - 0.5) * 1.2;
      synPos[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    const synGeo = new THREE.BufferGeometry();
    synGeo.setAttribute('position', new THREE.BufferAttribute(synPos, 3));
    const synMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const synapses = new THREE.Points(synGeo, synMat);
    brainGroup.add(synapses);
    brainGroup.userData.synapses = synapses;
  }

  // =========================================================================
  // MODULE C: ATOMS AND MOLECULES
  // =========================================================================

  _buildAtomsAndMolecules() {
    const group = new THREE.Group();
    group.name = 'Chemistry Root';
    this.activeGroup.add(group);

    // 1. Bohr Atom Model (Center-Left: -2.8, 0, 0)
    const atomGroup = new THREE.Group();
    atomGroup.name = 'Bohr Atom';
    atomGroup.position.set(-2.6, 0.4, 0);
    atomGroup.userData = {
      category: 'Quantum Atom',
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1),
      isSpinningElectrons: true
    };
    group.add(atomGroup);
    this.interactiveObjects.push(atomGroup);

    // Dense Nucleus (Protons = Red, Neutrons = Ice Blue)
    const nucGroup = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.2, roughness: 0.3 });
    const nMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.2, roughness: 0.3 });
    const sphereGeoSmall = new THREE.SphereGeometry(0.12, 16, 16);

    for (let i = 0; i < 9; i++) {
      const isProton = i % 2 === 0;
      const m = new THREE.Mesh(sphereGeoSmall, isProton ? pMat : nMat);
      m.position.set(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      nucGroup.add(m);
    }
    atomGroup.add(nucGroup);

    // 3 Quantized Electron Orbital Rings
    const orbitAngles = [
      { rx: 0, ry: 0, rz: 0, r: 1.1 },
      { rx: Math.PI / 3, ry: Math.PI / 4, rz: 0, r: 1.55 },
      { rx: -Math.PI / 3, ry: -Math.PI / 4, rz: Math.PI / 6, r: 2.0 }
    ];
    const electronPivots = [];

    orbitAngles.forEach((orb, idx) => {
      const ringG = new THREE.RingGeometry(orb.r - 0.015, orb.r + 0.015, 64);
      const ringM = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ringMesh = new THREE.Mesh(ringG, ringM);
      ringMesh.rotation.set(orb.rx, orb.ry, orb.rz);
      atomGroup.add(ringMesh);

      // Orbiting electron
      const ePivot = new THREE.Group();
      ePivot.rotation.set(orb.rx, orb.ry, orb.rz);
      const eMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00f59b })
      );
      eMesh.position.set(orb.r, 0, 0);
      ePivot.add(eMesh);
      atomGroup.add(ePivot);
      electronPivots.push({ pivot: ePivot, speed: 2.2 + idx * 0.8 });
    });
    atomGroup.userData.electronPivots = electronPivots;

    // 2. Water Molecule H2O (Center: 0, 0.4, 0)
    const waterGroup = new THREE.Group();
    waterGroup.name = 'Water Molecule';
    waterGroup.position.set(0, 0.4, 0);
    waterGroup.userData = {
      category: 'Molecule (H₂O)',
      accentColor: 0xef4444,
      baseScale: new THREE.Vector3(1, 1, 1)
    };
    group.add(waterGroup);
    this.interactiveObjects.push(waterGroup);

    // Oxygen Atom (Center Red)
    const oxGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const oxMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.2, clearcoat: 0.6 });
    const oxygenMesh = new THREE.Mesh(oxGeo, oxMat);
    oxygenMesh.name = 'Oxygen Atom';
    oxygenMesh.userData = { parentMolecule: 'Water Molecule' };
    waterGroup.add(oxygenMesh);

    // 2 Hydrogen Atoms at 104.5 degrees
    const hyGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const hyMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.2, clearcoat: 0.6 });
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const halfAngle = (104.5 * Math.PI) / 360; // 52.25 degrees

    [-1, 1].forEach(dir => {
      const hx = Math.sin(halfAngle * dir) * 1.1;
      const hy = -Math.cos(halfAngle) * 1.1;
      const hMesh = new THREE.Mesh(hyGeo, hyMat);
      hMesh.name = `Hydrogen Atom ${dir > 0 ? '1' : '2'}`;
      hMesh.position.set(hx, hy, 0);
      waterGroup.add(hMesh);

      // Covalent bond cylinder
      const bondCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(hx, hy, 0)]);
      const bondGeo = new THREE.TubeGeometry(bondCurve, 8, 0.08, 12, false);
      const bondMesh = new THREE.Mesh(bondGeo, bondMat);
      waterGroup.add(bondMesh);
    });

    // 3. DNA Double Helix (Right: 2.6, 0.4, 0)
    const dnaGroup = new THREE.Group();
    dnaGroup.name = 'DNA Double Helix';
    dnaGroup.position.set(2.6, 0.4, 0);
    dnaGroup.userData = {
      category: 'Nucleic Acid',
      accentColor: 0x10b981,
      baseScale: new THREE.Vector3(1, 1, 1),
      isRotatingDNA: true
    };
    group.add(dnaGroup);
    this.interactiveObjects.push(dnaGroup);

    // Build 18 base-pair rungs of the double helix
    const numRungs = 20;
    const helixRadius = 0.75;
    const helixHeight = 3.6;

    const bMatA = new THREE.MeshStandardMaterial({ color: 0xef4444 }); // Adenine
    const bMatT = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // Thymine
    const bMatG = new THREE.MeshStandardMaterial({ color: 0x10b981 }); // Guanine
    const bMatC = new THREE.MeshStandardMaterial({ color: 0xf59e0b }); // Cytosine
    const strandMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, roughness: 0.1, clearcoat: 0.8 });

    for (let i = 0; i < numRungs; i++) {
      const t = i / numRungs;
      const y = (t - 0.5) * helixHeight;
      const theta = t * Math.PI * 4; // 2 full rotations

      const x1 = Math.cos(theta) * helixRadius;
      const z1 = Math.sin(theta) * helixRadius;
      const x2 = -x1;
      const z2 = -z1;

      // Backbone sugar spheres
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), strandMat);
      s1.position.set(x1, y, z1);
      dnaGroup.add(s1);

      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), strandMat);
      s2.position.set(x2, y, z2);
      dnaGroup.add(s2);

      // Base pair bridge (left half and right half)
      const isAT = i % 2 === 0;
      const mLeft = isAT ? bMatA : bMatG;
      const mRight = isAT ? bMatT : bMatC;

      const rungMid = new THREE.Vector3(0, y, 0);
      const rungP1 = new THREE.Vector3(x1, y, z1);
      const rungP2 = new THREE.Vector3(x2, y, z2);

      const tube1 = new THREE.TubeGeometry(new THREE.LineCurve3(rungP1, rungMid), 4, 0.04, 8);
      const tube2 = new THREE.TubeGeometry(new THREE.LineCurve3(rungMid, rungP2), 4, 0.04, 8);

      dnaGroup.add(new THREE.Mesh(tube1, mLeft));
      dnaGroup.add(new THREE.Mesh(tube2, mRight));
    }
  }

  // =========================================================================
  // MODULE D: GEOMETRY LAB
  // =========================================================================

  _buildGeometryLab() {
    const group = new THREE.Group();
    group.name = 'Geometry Lab Root';
    this.activeGroup.add(group);

    // 6 Polyhedra arranged in a curved scientific stage
    const polyDefs = [
      { name: 'Cube',          geo: new THREE.BoxGeometry(1.4, 1.4, 1.4),             pos: [-3.2, 1.3, -0.6], col: 0x00f0ff },
      { name: 'Sphere',        geo: new THREE.SphereGeometry(0.9, 32, 32),            pos: [-1.3, 1.3, 0.2],  col: 0x00f59b },
      { name: 'Torus',         geo: new THREE.TorusGeometry(0.8, 0.35, 24, 48),       pos: [0.6, 1.3, 0.2],   col: 0xa855f7 },
      { name: 'Cone',          geo: new THREE.ConeGeometry(0.85, 1.7, 32),            pos: [2.5, 1.3, -0.6],  col: 0xf59e0b },
      { name: 'Icosahedron',   geo: new THREE.IcosahedronGeometry(1.0, 0),            pos: [-1.2, -0.4, 0.6], col: 0x38bdf8 },
      { name: 'Dodecahedron',  geo: new THREE.DodecahedronGeometry(1.0, 0),          pos: [1.2, -0.4, 0.6],  col: 0xec4899 }
    ];

    polyDefs.forEach(p => {
      const solidGroup = new THREE.Group();
      solidGroup.name = p.name;
      solidGroup.position.set(...p.pos);
      solidGroup.userData = {
        category: 'Polyhedron',
        accentColor: p.col,
        baseScale: new THREE.Vector3(1, 1, 1),
        isRotatingIdle: true
      };

      // Faceted Physical Mesh
      const mat = new THREE.MeshPhysicalMaterial({
        color: p.col,
        emissive: 0x000000,
        metalness: 0.3,
        roughness: 0.15,
        transmission: 0.35,
        thickness: 0.8,
        clearcoat: 0.7
      });
      const mesh = new THREE.Mesh(p.geo, mat);
      solidGroup.add(mesh);

      // Wireframe Holographic Edges
      const wireGeo = new THREE.WireframeGeometry(p.geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: p.col,
        transparent: true,
        opacity: 0.65
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      solidGroup.add(wire);

      group.add(solidGroup);
      this.interactiveObjects.push(solidGroup);
    });
  }

  // =========================================================================
  // MODULE E: EARTH EXPLORER
  // =========================================================================

  _buildEarthExplorer() {
    const group = new THREE.Group();
    group.name = 'Earth Explorer Root';
    this.activeGroup.add(group);

    // Earth Axial Tilt Pivot (23.5 degrees)
    const earthPivot = new THREE.Group();
    earthPivot.name = 'Earth';
    earthPivot.rotation.z = (-23.5 * Math.PI) / 180;
    earthPivot.userData = {
      category: 'Terrestrial Planet',
      accentColor: 0x00f0ff,
      baseScale: new THREE.Vector3(1, 1, 1),
      isEarthGlobe: true
    };
    group.add(earthPivot);
    this.interactiveObjects.push(earthPivot);

    // 1. Procedural High-Detail Earth Texture Canvas (Continents + Oceans + Grid)
    const earthTexture = this._createProceduralEarthTexture();

    // 2. Earth Sphere
    const earthGeo = new THREE.SphereGeometry(1.85, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthPivot.add(earthMesh);

    // 3. Coordinate Grid Wireframe (Latitude & Longitude)
    const gridGeo = new THREE.SphereGeometry(1.86, 24, 16);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    earthPivot.add(gridMesh);

    // 4. Atmospheric Blue Glow Rim
    const atmoGeo = new THREE.SphereGeometry(2.1, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthPivot.add(atmoMesh);

    // 5. Geographic Hotspots (Selectable pins)
    const hotspots = [
      { name: 'Mariana Trench',    lat: 11.35,  lon: 142.2,  col: 0x38bdf8 },
      { name: 'Mount Everest',     lat: 27.98,  lon: 86.92,  col: 0xffedd5 },
      { name: 'Amazon Rainforest', lat: -3.12,  lon: -60.02, col: 0x10b981 },
      { name: 'Sahara Desert',     lat: 23.06,  lon: 12.6,   col: 0xf59e0b },
      { name: 'Great Barrier Reef',lat: -18.28, lon: 147.7,  col: 0x06b6d4 }
    ];

    hotspots.forEach(spot => {
      // Convert lat/lon to spherical 3D coordinates
      const phi = (90 - spot.lat) * (Math.PI / 180);
      const theta = (spot.lon + 180) * (Math.PI / 180);
      const r = 1.88;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      const pinGroup = new THREE.Group();
      pinGroup.name = spot.name;
      pinGroup.position.set(x, y, z);
      pinGroup.userData = {
        category: 'Geographic Hotspot',
        accentColor: spot.col,
        baseScale: new THREE.Vector3(1, 1, 1)
      };

      // Glowing beacon marker
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshBasicMaterial({ color: spot.col })
      );
      pinGroup.add(marker);

      // Radar pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.16, 16),
        new THREE.MeshBasicMaterial({
          color: spot.col,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide
        })
      );
      ring.lookAt(0, 0, 0);
      pinGroup.add(ring);

      earthPivot.add(pinGroup);
      this.interactiveObjects.push(pinGroup);
    });
  }

  _createProceduralEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep ocean base
    ctx.fillStyle = '#061a38';
    ctx.fillRect(0, 0, 1024, 512);

    // Oceanic bathymetric gradients
    const oceanGrad = ctx.createRadialGradient(512, 256, 100, 512, 256, 500);
    oceanGrad.addColorStop(0, '#0a254e');
    oceanGrad.addColorStop(1, '#040d1e');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Draw stylized landmasses (Eurasia, Americas, Africa, Australia)
    ctx.fillStyle = '#1e3a2b';

    // Africa & Europe
    ctx.beginPath();
    ctx.ellipse(540, 260, 90, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eurasia
    ctx.beginPath();
    ctx.ellipse(680, 170, 180, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // North America
    ctx.beginPath();
    ctx.ellipse(250, 170, 130, 80, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.ellipse(330, 340, 80, 120, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.ellipse(840, 360, 65, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antarctica
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 480, 1024, 32);

    // Fine latitude and longitude grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= 1024; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // =========================================================================
  // ANIMATION TICK (Called inside 60+ FPS Three.js loop)
  // =========================================================================

  update(dt, elapsed) {
    if (!this.activeModuleId) return;

    // 1. Solar System orbital animation
    if (this.activeModuleId === 'solar' && !this.moduleStates.solar.paused) {
      const mult = this.moduleStates.solar.speedMultiplier;
      this.moduleStates.solar.planets.forEach(p => {
        p.userData.angle += dt * p.userData.orbitSpeed * 0.45 * mult;
        const d = p.userData.orbitDist;
        p.position.x = Math.cos(p.userData.angle) * d;
        p.position.z = Math.sin(p.userData.angle) * d;
        p.rotation.y += dt * 1.5;

        // Animate moon orbit if present
        if (p.userData.moon) {
          const mAngle = elapsed * 3.5;
          p.userData.moon.position.x = Math.cos(mAngle) * 0.65;
          p.userData.moon.position.z = Math.sin(mAngle) * 0.65;
        }
      });
    }

    // 2. Human Anatomy physiological pulsation
    if (this.activeModuleId === 'anatomy') {
      const heart = this.activeGroup.getObjectByName('Human Heart');
      if (heart) {
        // Dual-peak cardiac rhythm (systole + diastole)
        const t = elapsed * 4.8;
        const cardiacCycle = Math.sin(t) * 0.08 + Math.sin(t * 2.0) * 0.04;
        const s = 1.0 + Math.max(0, cardiacCycle);
        heart.scale.set(s, s * 1.05, s);
      }

      const lungs = this.activeGroup.getObjectByName('Lungs & Respiratory Tree');
      if (lungs) {
        const respCycle = Math.sin(elapsed * 1.4) * 0.06;
        lungs.scale.set(1.0 + respCycle, 1.0 + respCycle * 0.8, 1.0 + respCycle);
      }

      const brain = this.activeGroup.getObjectByName('Brain & Nervous Cortex');
      if (brain && brain.userData.synapses) {
        brain.userData.synapses.rotation.y += 0.008;
      }
    }

    // 3. Chemistry electron spin & DNA rotation
    if (this.activeModuleId === 'chemistry') {
      const atom = this.activeGroup.getObjectByName('Bohr Atom');
      if (atom && atom.userData.electronPivots) {
        atom.userData.electronPivots.forEach(item => {
          item.pivot.rotation.z += dt * item.speed;
        });
      }

      const dna = this.activeGroup.getObjectByName('DNA Double Helix');
      if (dna) {
        dna.rotation.y += dt * 0.85;
      }
    }

    // 4. Geometry Lab polyhedra idle float
    if (this.activeModuleId === 'geometry') {
      this.interactiveObjects.forEach((obj, idx) => {
        obj.rotation.x += dt * (0.35 + idx * 0.05);
        obj.rotation.y += dt * (0.5 + idx * 0.05);
      });
    }

    // 5. Earth Explorer axial spin
    if (this.activeModuleId === 'earth') {
      const earth = this.activeGroup.getObjectByName('Earth');
      if (earth && this.moduleStates.earth.isRotating) {
        earth.rotation.y += dt * 0.15;
      }
    }
  }
}
