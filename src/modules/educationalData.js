/**
 * GestureFlow — Interactive Science Universe
 * Comprehensive Educational Science Database, Challenges & Achievements
 */

export const SCIENCE_MODULE_DEFS = {
  MATTER: 'matter',
  SOLAR: 'solar',
  ANATOMY: 'anatomy',
  CHEMISTRY: 'chemistry',
  GEOMETRY: 'geometry',
  EARTH: 'earth'
};

export const EDUCATIONAL_CONTENT = {
  // 1. Matter Manipulation Data
  matter: {
    title: 'Matter Manipulation Studio',
    subtitle: 'QUANTUM MORPHOLOGY & FIELD DYNAMICS',
    intro: 'Explore how energy and fundamental forces shape physical matter across the cosmos.',
    facts: [
      { label: 'FUNDAMENTAL FORCES', value: 'Gravity, Electromagnetism, Strong & Weak Nuclear' },
      { label: 'STATES OF MATTER', value: 'Solid, Liquid, Gas, Plasma, Bose-Einstein Condensate' },
      { label: 'COHESION LAW', value: 'Particle arrangements determine macroscopic matter properties' }
    ],
    challenge: {
      id: 'matter_morph_galaxy',
      title: 'Cosmic Genesis',
      description: 'Morph the particle field into the Spiral Galaxy configuration.',
      targetShape: 'GALAXY',
      reward: 'Master of Matter'
    },
    shapes: {
      CLOUD: {
        name: 'Quantum Nebula Cloud',
        desc: 'Turbulent gaseous cloud of interstellar particles where stars and planets are born.',
        stats: { temperature: '10 - 20 K', density: '10² - 10⁶ particles/cm³', phase: 'Gas & Dust' }
      },
      SPHERE: {
        name: 'Glowing Quantum Sphere',
        desc: 'Symmetric surface minimizing surface energy, found in water droplets and celestial bodies.',
        stats: { symmetry: 'O(3) Spherical', curvature: 'Constant Positive', energyState: 'Minimal' }
      },
      CUBE: {
        name: 'Crystalline Hypercube',
        desc: 'Periodic lattice structure characteristic of ionic crystals like Sodium Chloride (NaCl).',
        stats: { faces: '6', vertices: '8', lattice: 'Face-Centered Cubic' }
      },
      TORUS: {
        name: 'Magnetic Torus Confinement',
        desc: 'Tokamak fusion geometry used to confine high-energy plasma using helical magnetic fields.',
        stats: { genus: '1', topology: 'Toroidal', application: 'Thermonuclear Fusion' }
      },
      GALAXY: {
        name: 'Double Spiral Galaxy',
        desc: 'A spinning cosmic vortex containing hundreds of billions of stars bound by supermassive black hole gravity.',
        stats: { diameter: '100,000 Light Years', stars: '~200-400 Billion', type: 'Barred Spiral (SBbc)' }
      },
      SOLAR_SYSTEM: {
        name: 'Heliospheric Planetary System',
        desc: 'Gravitationally bound system consisting of a central star and orbiting planetary bodies.',
        stats: { centralMass: '99.86% Solar Mass', age: '4.6 Billion Years', boundary: 'Oort Cloud' }
      }
    }
  },

  // 2. Solar System Module
  solar: {
    title: 'Solar System Explorer',
    subtitle: 'HELIOCENTRIC ORBITAL MECHANICS',
    intro: 'Touch the cosmos. Inspect planets, examine real orbital mechanics, and uncover planetary science.',
    scaleNote: 'Educational Visualization: Planetary sizes and orbital distances are scaled logarithmically for interactive exploration.',
    challenge: {
      id: 'solar_inspect_saturn',
      title: 'Ring Master',
      description: 'Find and select Saturn to inspect its majestic icy ring system.',
      targetObject: 'Saturn',
      reward: 'Cosmic Navigator'
    },
    planets: {
      Sun: {
        name: 'The Sun (Sol)',
        type: 'Yellow Dwarf Star (G2V)',
        diameter: '1,392,700 km (109x Earth)',
        distance: '0 AU (Center of System)',
        period: '225-250 Million Years (Galactic Orbit)',
        temp: '5,500 °C (Surface) / 15,000,000 °C (Core)',
        funFact: 'The Sun accounts for 99.86% of all mass in our entire Solar System.'
      },
      Mercury: {
        name: 'Mercury',
        type: 'Terrestrial Planet',
        diameter: '4,879 km (0.38x Earth)',
        distance: '0.39 AU (57.9M km)',
        period: '88 Earth Days',
        temp: '-180 °C to 430 °C',
        funFact: 'Mercury experiences the most extreme temperature swings in the solar system due to having virtually no atmosphere.'
      },
      Venus: {
        name: 'Venus',
        type: 'Terrestrial Planet (Runaway Greenhouse)',
        diameter: '12,104 km (0.95x Earth)',
        distance: '0.72 AU (108.2M km)',
        period: '225 Earth Days (Day: 243 Earth Days)',
        temp: '465 °C (Hottest Planet)',
        funFact: 'Venus rotates in the opposite direction (retrograde) compared to most other planets, so the Sun rises in the west.'
      },
      Earth: {
        name: 'Earth (Terra)',
        type: 'Terrestrial Oasis (Life-Supporting)',
        diameter: '12,742 km (1.00x Earth)',
        distance: '1.00 AU (149.6M km)',
        period: '365.25 Days',
        temp: 'Average 15 °C',
        funFact: 'Earth is the only known planet in the universe with liquid surface water, plate tectonics, and thriving life.'
      },
      Mars: {
        name: 'Mars (The Red Planet)',
        type: 'Terrestrial Planet (Iron Oxide Surface)',
        diameter: '6,779 km (0.53x Earth)',
        distance: '1.52 AU (227.9M km)',
        period: '687 Earth Days',
        temp: '-63 °C (Average)',
        funFact: 'Mars is home to Olympus Mons, the largest volcano in the Solar System, three times taller than Mount Everest.'
      },
      Jupiter: {
        name: 'Jupiter',
        type: 'Gas Giant (Hydrogen & Helium)',
        diameter: '139,820 km (11.0x Earth)',
        distance: '5.20 AU (778.5M km)',
        period: '11.86 Earth Years',
        temp: '-110 °C (Cloud Tops)',
        funFact: 'Jupiter’s Great Red Spot is a colossal anticyclonic storm larger than Earth that has raged for over 350 years.'
      },
      Saturn: {
        name: 'Saturn',
        type: 'Gas Giant with Planetary Rings',
        diameter: '116,460 km (9.1x Earth)',
        distance: '9.58 AU (1.43B km)',
        period: '29.45 Earth Years',
        temp: '-140 °C (Cloud Tops)',
        funFact: 'Saturn’s spectacular rings are made of billions of chunks of ice and rock, ranging from dust grains to house-sized boulders.'
      },
      Uranus: {
        name: 'Uranus',
        type: 'Ice Giant (Methane Atmosphere)',
        diameter: '50,724 km (4.0x Earth)',
        distance: '19.22 AU (2.87B km)',
        period: '84.0 Earth Years',
        temp: '-195 °C (Coldest Atmosphere)',
        funFact: 'Uranus rotates on its side with an axial tilt of 97.8 degrees, effectively rolling around the Sun like a ball.'
      },
      Neptune: {
        name: 'Neptune',
        type: 'Ice Giant (Supersonic Winds)',
        diameter: '49,244 km (3.9x Earth)',
        distance: '30.05 AU (4.50B km)',
        period: '164.8 Earth Years',
        temp: '-200 °C (Average)',
        funFact: 'Neptune experiences supersonic winds reaching up to 2,100 km/h (1,300 mph), the fastest recorded anywhere in the Solar System.'
      }
    }
  },

  // 3. Human Anatomy Module
  anatomy: {
    title: 'Human Anatomy Lab',
    subtitle: 'BIOMEDICAL SYSTEMS & PHYSIOLOGY',
    intro: 'Explore fundamental human anatomy. Inspect vital organs, cardiac mechanics, and biological architecture.',
    challenge: {
      id: 'anatomy_inspect_heart',
      title: 'Cardiovascular Pulse',
      description: 'Select the Human Heart and observe the simulated cardiac rhythm.',
      targetObject: 'Human Heart',
      reward: 'Cellular Biologist'
    },
    organs: {
      'Human Heart': {
        name: 'Human Heart (Cor)',
        system: 'Cardiovascular System',
        function: 'Pumps oxygenated blood to tissues and deoxygenated blood to the lungs.',
        rate: '60 - 100 Beats per Minute',
        volume: '~70 mL Stroke Volume (5 Liters/min)',
        chambers: '4 (Left/Right Atria & Ventricles)',
        funFact: 'In an average lifetime, the human heart beats over 2.5 billion times without stopping for rest.'
      },
      'Lungs & Respiratory Tree': {
        name: 'Lungs & Bronchial Tree',
        system: 'Respiratory System',
        function: 'Facilitates gas exchange: absorbs Oxygen (O₂) into capillaries and expels Carbon Dioxide (CO₂).',
        surfaceArea: '~70 m² (Size of a tennis court)',
        alveoli: '~480 Million Microscopic Sacs',
        rate: '12 - 20 Breaths per Minute',
        funFact: 'Your lungs contain approximately 2,400 kilometers (1,500 miles) of airways to maximize gas exchange surface.'
      },
      'Brain & Nervous Cortex': {
        name: 'Human Brain & Cerebrum',
        system: 'Central Nervous System (CNS)',
        function: 'Controls cognition, motor coordination, sensory perception, and homeostatic regulation.',
        neurons: '~86 Billion Neurons',
        synapses: '~100 Trillion Synaptic Connections',
        power: '~20 Watts (Consumes 20% of resting body energy)',
        funFact: 'Information travels along neural axons at speeds of up to 430 km/h (268 mph).'
      },
      'Skeletal Ribcage & Spine': {
        name: 'Thoracic Cage & Vertebral Column',
        system: 'Skeletal System',
        function: 'Protects vital thoracic organs (heart, lungs) and provides structural anchors for respiration muscles.',
        bones: '12 pairs of ribs (24 total) + 24 articulating vertebrae',
        composition: 'Calcium Hydroxyapatite & Collagen protein lattice',
        funFact: 'The ribcage expands and contracts over 20,000 times a day as you breathe without fatiguing.'
      }
    }
  },

  // 4. Atoms and Molecules Module
  chemistry: {
    title: 'Atoms & Molecular Lab',
    subtitle: 'QUANTUM MECHANICS & CHEMICAL BONDS',
    intro: 'Peer into the nanoscale. Discover Bohr atomic shells, molecular bond angles, and genetic DNA architecture.',
    note: 'Visual model represents schematic Bohr orbital shells and VSEPR molecular bond geometry.',
    challenge: {
      id: 'chemistry_select_oxygen',
      title: 'Water Architect',
      description: 'Select the Oxygen atom in the Water molecule to inspect covalent bonding.',
      targetObject: 'Oxygen Atom',
      reward: 'Quantum Chemist'
    },
    models: {
      'Bohr Atom': {
        name: 'Bohr Quantum Atom Model',
        elements: 'Nucleus (Protons + Neutrons) surrounded by quantized electron shells.',
        principle: 'Electrons occupy discrete energy levels (n = 1, 2, 3) without radiating energy.',
        diameter: '~0.1 Nanometers (1 Ångström)',
        funFact: 'If an atom were the size of a football stadium, the nucleus would be like a marble on the 50-yard line, and the rest is mostly empty space.'
      },
      'Water Molecule': {
        name: 'Water Molecule (H₂O)',
        geometry: 'Bent Molecular Geometry (C₂ᵥ Symmetry)',
        bondAngle: '104.5° (Compressed from 109.5° by unshared electron pairs)',
        bondType: 'Polar Covalent Bonds with Hydrogen Bonding capacity',
        funFact: 'Water’s bent shape creates a strong dipole moment, making it the universal solvent essential for all known biochemistry.'
      },
      'Methane Molecule': {
        name: 'Methane Molecule (CH₄)',
        geometry: 'Tetrahedral Geometry (sp³ Hybridization)',
        bondAngle: '109.5° (Equal repulsion of 4 bonding electron pairs)',
        bondType: 'Nonpolar Covalent Carbon-Hydrogen bonds',
        funFact: 'Methane is the primary constituent of natural gas and a potent greenhouse gas in planetary atmospheres.'
      },
      'Carbon Dioxide': {
        name: 'Carbon Dioxide (CO₂)',
        geometry: 'Linear Geometry (D∞h Symmetry)',
        bondAngle: '180.0°',
        bondType: 'Two Polar Double Bonds (C=O)',
        funFact: 'Although C=O bonds are polar, their linear opposition cancels out net polarity, making CO₂ nonpolar.'
      },
      'DNA Double Helix': {
        name: 'Deoxyribonucleic Acid (DNA)',
        structure: 'Right-handed B-DNA Double Helix',
        basePairs: 'Adenine = Thymine (2 H-bonds), Guanine ≡ Cytosine (3 H-bonds)',
        pitch: '3.4 nm per complete turn (10.5 base pairs/turn)',
        funFact: 'If unraveled, the DNA in just one human cell would measure 2 meters (6.5 feet) long, yet fits in a 6-micron nucleus.'
      }
    }
  },

  // 5. Geometry Lab Module
  geometry: {
    title: 'Geometry & Polyhedra Lab',
    subtitle: 'TOPOLOGY, PLATONIC SOLIDS & EULER FORMULA',
    intro: 'Manipulate mathematical solids in real time. Switch between solid faceted geometry and dynamic particle matrix mode.',
    challenge: {
      id: 'geometry_inspect_icosahedron',
      title: 'Platonic Master',
      description: 'Select the Icosahedron and inspect Euler’s characteristic formula (V - E + F = 2).',
      targetObject: 'Icosahedron',
      reward: 'Topologist'
    },
    solids: {
      'Cube': {
        name: 'Hexahedron (Cube)',
        faces: 6,
        vertices: 8,
        edges: 12,
        euler: 'V - E + F = 8 - 12 + 6 = 2',
        symmetry: 'Oh (Octahedral Symmetry)',
        funFact: 'The cube is the only regular polyhedron that can tile three-dimensional space without leaving gaps.'
      },
      'Sphere': {
        name: 'Smooth Riemannian Sphere',
        faces: 'Infinite (Continuous Limiting Surface)',
        vertices: 'Continuous Point Cloud',
        edges: 'Zero (Non-polygonal manifold)',
        euler: 'Euler Characteristic χ = 2',
        symmetry: 'O(3) Continuous Spherical Symmetry',
        funFact: 'The sphere encloses the maximum volume for any given surface area of any 3D geometric shape.'
      },
      'Torus': {
        name: 'Topological Torus (Genus 1)',
        faces: 'Parametric Ring',
        vertices: 'Continuous Revolving Manifold',
        edges: '0 (Manifold with Genus g = 1)',
        euler: 'Euler Characteristic χ = 0 (2 - 2g)',
        symmetry: 'Continuous Cylindrical Azimuthal',
        funFact: 'In topology, a coffee mug and a torus are mathematically identical because each has exactly one hole.'
      },
      'Cone': {
        name: 'Right Circular Cone',
        faces: 2,
        vertices: 1,
        edges: 1,
        euler: 'Developable Quadric Surface',
        symmetry: 'C∞v Axial Symmetry',
        funFact: 'Conic sections (cutting a cone at different angles) generate all orbital paths: circles, ellipses, parabolas, and hyperbolas.'
      },
      'Icosahedron': {
        name: 'Regular Icosahedron (Platonic Solid)',
        faces: 20,
        vertices: 12,
        edges: 30,
        euler: 'V - E + F = 12 - 30 + 20 = 2',
        symmetry: 'Ih (Icosahedral Symmetry, 120 operations)',
        funFact: 'Many viruses, including adenovirus and bacteriophages, construct their outer protein capsids as icosahedrons for maximum geometric efficiency.'
      },
      'Dodecahedron': {
        name: 'Regular Dodecahedron (Platonic Solid)',
        faces: 12,
        vertices: 20,
        edges: 30,
        euler: 'V - E + F = 20 - 30 + 12 = 2',
        symmetry: 'Ih (Dual of the Icosahedron)',
        funFact: 'Plato associated the dodecahedron with the quintessence or the cosmos itself: "God used this for embroidering the constellations on the whole heaven."'
      }
    }
  },

  // 6. Earth Explorer Module
  earth: {
    title: 'Planetary Earth Explorer',
    subtitle: 'GEOPHYSICS, BIOMES & COORDINATE GEOMETRY',
    intro: 'Navigate our home planet. Rotate the globe, inspect geological wonders, and explore ecological biomes.',
    challenge: {
      id: 'earth_locate_mariana',
      title: 'Abyssal Depth',
      description: 'Locate and select the Mariana Trench hotspot in the western Pacific Ocean.',
      targetObject: 'Mariana Trench',
      reward: 'Planetary Explorer'
    },
    hotspots: {
      'Mariana Trench': {
        name: 'Mariana Trench (Challenger Deep)',
        region: 'Western Pacific Ocean',
        coords: '11°21′N, 142°12′E',
        depth: '10,994 meters (36,070 ft)',
        pressure: '1,086 bar (Over 1,000 atmospheres)',
        funFact: 'If Mount Everest were placed in the Mariana Trench, its peak would still be submerged under more than 2 kilometers of water.'
      },
      'Mount Everest': {
        name: 'Mount Everest (Sagarmatha / Qomolangma)',
        region: 'Himalayan Tectonic Collision Zone (Nepal / China)',
        coords: '27°59′N, 86°55′E',
        elevation: '8,848.86 meters (29,031.7 ft)',
        geology: 'Formed by continental collision of Indian and Eurasian plates',
        funFact: 'Everest grows approximately 4 millimeters taller every year as the Indian tectonic plate continues pushing northward.'
      },
      'Amazon Rainforest': {
        name: 'Amazon River Basin & Tropical Biome',
        region: 'South America (spanning 9 nations)',
        coords: '3°07′S, 60°01′W',
        area: '6.7 Million km² (Largest rainforest on Earth)',
        biodiversity: 'Home to 1 in 10 known species on Earth',
        funFact: 'The Amazon basin produces roughly 20% of Earth’s river water discharge into oceans and cycles massive atmospheric moisture.'
      },
      'Sahara Desert': {
        name: 'Sahara Desert Hyper-Arid System',
        region: 'Northern Africa',
        coords: '23°04′N, 12°36′E',
        area: '9.2 Million km² (Comparable in size to the United States)',
        climate: 'Summer temperatures exceed 50 °C; annual rainfall < 100 mm',
        funFact: 'Dust blown from the Sahara travels thousands of miles across the Atlantic Ocean to fertilize the Amazon rainforest with phosphorus.'
      },
      'Great Barrier Reef': {
        name: 'Great Barrier Reef Marine Ecosystem',
        region: 'Coral Sea, Northeast Australia',
        coords: '18°17′S, 147°42′E',
        length: '2,300 kilometers (1,400 miles)',
        organism: 'Largest living structure on Earth, visible from space',
        funFact: 'The reef is built by trillions of microscopic coral polyps that secrete calcium carbonate skeletons over thousands of years.'
      }
    }
  }
};

export const ACHIEVEMENTS = [
  {
    id: 'matter_morph_galaxy',
    title: 'Master of Matter',
    desc: 'Morphed particle energy field into a Spiral Galaxy',
    icon: '✨'
  },
  {
    id: 'solar_inspect_saturn',
    title: 'Cosmic Navigator',
    desc: 'Inspected Saturn and its planetary ring system',
    icon: '🪐'
  },
  {
    id: 'anatomy_inspect_heart',
    title: 'Cellular Biologist',
    desc: 'Observed cardiac cycle in Human Heart',
    icon: '🫀'
  },
  {
    id: 'chemistry_select_oxygen',
    title: 'Quantum Chemist',
    desc: 'Analyzed covalent bond structure in Water (H₂O)',
    icon: '⚛️'
  },
  {
    id: 'geometry_inspect_icosahedron',
    title: 'Topologist',
    desc: 'Verified Euler’s polyhedral formula on Icosahedron',
    icon: '📐'
  },
  {
    id: 'earth_locate_mariana',
    title: 'Planetary Explorer',
    desc: 'Discovered Mariana Trench abyssal trench hotspot',
    icon: '🌍'
  }
];
