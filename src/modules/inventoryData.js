/**
 * GestureFlow Reality Engine — Inventory Catalog
 * Categorized catalog of procedural 3D assets, environmental structures,
 * visual effects, superhero webs, and particle tools.
 */

export const INVENTORY_CATEGORIES = {
  SHAPES: 'shapes',
  OBJECTS: 'objects',
  POWERS: 'powers',
  WEBS: 'webs',
  PARTICLES: 'particles'
};

export const INVENTORY_ITEMS = [
  // ==========================================
  // CATEGORY A: SHAPES
  // ==========================================
  {
    id: 'shape_cube',
    name: 'Quantum Cube',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '🧊',
    desc: 'Chamfered cybernetic cube with neon wireframe lattice.',
    type: 'cube',
    color: 0x00f0ff,
    scale: 1.2
  },
  {
    id: 'shape_sphere',
    name: 'Arc Sphere',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '🔮',
    desc: 'Luminous physical sphere with refractive inner core.',
    type: 'sphere',
    color: 0x00f59b,
    scale: 1.0
  },
  {
    id: 'shape_torus',
    name: 'Torus Ring',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '🍩',
    desc: 'Parametric doughnut accelerator ring.',
    type: 'torus',
    color: 0xa855f7,
    scale: 1.1
  },
  {
    id: 'shape_cone',
    name: 'Chrono Cone',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '🔺',
    desc: 'High-precision conical geometric solid.',
    type: 'cone',
    color: 0xffb800,
    scale: 1.2
  },
  {
    id: 'shape_pyramid',
    name: 'Tetra Pyramid',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '📐',
    desc: 'Four-sided regular geometric pyramid.',
    type: 'pyramid',
    color: 0xec4899,
    scale: 1.1
  },
  {
    id: 'shape_icosahedron',
    name: 'Icosahedron',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '💎',
    desc: '20-face regular Platonic polyhedron.',
    type: 'icosahedron',
    color: 0x38bdf8,
    scale: 1.15
  },
  {
    id: 'shape_cylinder',
    name: 'Power Cylinder',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '🔋',
    desc: 'Industrial cylindrical energy column.',
    type: 'cylinder',
    color: 0x10b981,
    scale: 1.2
  },
  {
    id: 'shape_ring',
    name: 'Singularity Ring',
    category: INVENTORY_CATEGORIES.SHAPES,
    icon: '⭕',
    desc: 'Thin levitating planetary gyro ring.',
    type: 'ring',
    color: 0x67e8f9,
    scale: 1.3
  },

  // ==========================================
  // CATEGORY B: ENVIRONMENTS & OBJECTS
  // ==========================================
  {
    id: 'obj_planet',
    name: 'Exo Planet',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '🪐',
    desc: 'Procedural planetary globe with atmospheric glow shell.',
    type: 'planet',
    color: 0x3b82f6,
    scale: 1.4
  },
  {
    id: 'obj_moon',
    name: 'Craters Moon',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '🌑',
    desc: 'Rocky lunar satellite with basalt craters.',
    type: 'moon',
    color: 0x94a3b8,
    scale: 0.8
  },
  {
    id: 'obj_platform',
    name: 'Floating Pad',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '🛸',
    desc: 'Sci-fi anti-gravity hover platform with neon edge beacons.',
    type: 'platform',
    color: 0x00f0ff,
    scale: 1.6
  },
  {
    id: 'obj_crystal',
    name: 'Kyber Crystal',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '💠',
    desc: 'Faceted double-terminated quartz with prismatic transmission.',
    type: 'crystal',
    color: 0x00f59b,
    scale: 1.3
  },
  {
    id: 'obj_energy_core',
    name: 'Arc Reactor Core',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '⚡',
    desc: 'Pulsing electromagnetic plasma generator with rotating coils.',
    type: 'energy_core',
    color: 0x00f0ff,
    scale: 1.1
  },
  {
    id: 'obj_portal_frame',
    name: 'Portal Arch',
    category: INVENTORY_CATEGORIES.OBJECTS,
    icon: '🚪',
    desc: 'Dimensional gateway arch with containment field struts.',
    type: 'portal_frame',
    color: 0xa855f7,
    scale: 1.7
  },

  // ==========================================
  // CATEGORY C: POWERS & VISUAL EFFECTS
  // ==========================================
  {
    id: 'fx_energy_orb',
    name: 'Plasma Orb',
    category: INVENTORY_CATEGORIES.POWERS,
    icon: '💥',
    desc: 'High-voltage swirling energy orb with corona discharges.',
    type: 'energy_orb',
    color: 0xffb800,
    scale: 1.0
  },
  {
    id: 'fx_force_field',
    name: 'Force Field',
    category: INVENTORY_CATEGORIES.POWERS,
    icon: '🛡️',
    desc: 'Hexagonal translucent energy dome that deflects physical objects.',
    type: 'force_field',
    color: 0x00f0ff,
    scale: 2.2
  },
  {
    id: 'fx_gravity_vortex',
    name: 'Gravity Vortex',
    category: INVENTORY_CATEGORIES.POWERS,
    icon: '🌀',
    desc: 'Gravitational singularity that pulls nearby objects inward.',
    type: 'gravity_vortex',
    color: 0xa855f7,
    scale: 1.4
  },
  {
    id: 'fx_shockwave',
    name: 'Pulse Shockwave',
    category: INVENTORY_CATEGORIES.POWERS,
    icon: '🌊',
    desc: 'Radial kinetic wave that pushes surrounding objects outward.',
    type: 'shockwave',
    color: 0x00f59b,
    scale: 1.5
  },
  {
    id: 'fx_lightning',
    name: 'Tesla Lightning',
    category: INVENTORY_CATEGORIES.POWERS,
    icon: '⚡',
    desc: 'Branching procedural electric discharge.',
    type: 'lightning',
    color: 0x67e8f9,
    scale: 1.2
  },

  // ==========================================
  // CATEGORY D: WEB & TETHER EFFECTS
  // ==========================================
  {
    id: 'web_strand',
    name: 'Web Tether',
    category: INVENTORY_CATEGORIES.WEBS,
    icon: '🕸️',
    desc: 'Superhero-inspired glowing strand connecting hand to target with elastic pull.',
    type: 'web_tether',
    color: 0xe2e8f0,
    scale: 1.0
  },
  {
    id: 'web_multi_anchor',
    name: 'Multi-Object Web',
    category: INVENTORY_CATEGORIES.WEBS,
    icon: '🕸️',
    desc: 'Spider web network linking two or more 3D objects with elastic tension.',
    type: 'multi_web',
    color: 0x00f0ff,
    scale: 1.0
  },

  // ==========================================
  // CATEGORY E: PARTICLE TOOLS
  // ==========================================
  {
    id: 'part_cloud',
    name: 'Particle Nebula',
    category: INVENTORY_CATEGORIES.PARTICLES,
    icon: '✨',
    desc: 'Swarm of 3,800 morphing particles responding to hand magnetic pull.',
    type: 'particle_cloud',
    color: 0x00f0ff,
    scale: 1.0
  },
  {
    id: 'part_galaxy',
    name: 'Spiral Galaxy',
    category: INVENTORY_CATEGORIES.PARTICLES,
    icon: '🌌',
    desc: 'Double-spiral cosmic particle vortex with supermassive nucleus.',
    type: 'particle_galaxy',
    color: 0xffb800,
    scale: 1.2
  }
];
