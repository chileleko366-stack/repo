// Session 15 — Celestial Visual Factsheet
// Every body has a real, specific signatureFeature that drives camera framing and on-screen labels.
// This is the single source of truth for what makes each celestial body visually distinctive.
// Sources: NASA planetary fact sheets, Solar System Scope textures (CC BY 4.0).

export type CameraFraming =
  | 'must-show-on-visible-hemisphere'
  | 'must-show-ring-tilt'
  | 'must-show-polar-region'
  | 'must-show-full-disc';

export interface CelestialFactsheet {
  body: string;
  textures: {
    map: string;
    normal?: string;
    specular?: string;
    cloud?: string;
    ring?: string;
  };
  signatureFeature: {
    name: string;
    description: string;
    cameraFraming: CameraFraming;
    rotationOffsetAtMidpointDeg: number;
  };
  trueColor: {
    primaryHex: string;
    secondaryHex: string;
    description: string;
  };
  axialTiltDeg: number;
  rings?: {
    innerRadiusMultiplier: number;
    outerRadiusMultiplier: number;
    tiltFromOrbitalPlaneDeg: number;
    visibleGapName?: string;
  };
  atmosphere: {
    hasClouds: boolean;
    bandedStructure: boolean;
    description: string;
  };
  diameterKm: number;
}

export const CELESTIAL_FACTSHEETS: Record<string, CelestialFactsheet> = {
  Sun: {
    body: 'Sun',
    textures: { map: '2k_sun.jpg' },
    signatureFeature: {
      name: 'Granulation & solar prominences',
      description:
        'The visible photosphere shows a granulated, boiling texture from convection cells; bright arcs of plasma extend from the edge.',
      cameraFraming: 'must-show-full-disc',
      rotationOffsetAtMidpointDeg: 0,
    },
    trueColor: {
      primaryHex: '#fff4d6',
      secondaryHex: '#ff8c1a',
      description: 'Bright yellow-white core fading to deep orange at the limb',
    },
    axialTiltDeg: 7.25,
    atmosphere: {
      hasClouds: false,
      bandedStructure: false,
      description: 'No atmosphere in the planetary sense; glowing corona and solar prominences at the edge',
    },
    diameterKm: 1391000,
  },
  Mercury: {
    body: 'Mercury',
    textures: { map: '2k_mercury.jpg' },
    signatureFeature: {
      name: 'Heavy cratering',
      description:
        'Densely cratered, Moon-like surface with no atmosphere to erode impact scars — among them the Caloris Basin, one of the largest impact craters in the solar system.',
      cameraFraming: 'must-show-on-visible-hemisphere',
      rotationOffsetAtMidpointDeg: 45,
    },
    trueColor: {
      primaryHex: '#9c9690',
      secondaryHex: '#6b645d',
      description: 'Grey-brown, low contrast, similar tone to the Moon',
    },
    axialTiltDeg: 0.034,
    atmosphere: { hasClouds: false, bandedStructure: false, description: 'Essentially no atmosphere' },
    diameterKm: 4879,
  },
  Venus: {
    body: 'Venus',
    textures: { map: '2k_venus_surface.jpg', cloud: '2k_venus_atmosphere.jpg' },
    signatureFeature: {
      name: 'Thick sulfuric-acid cloud cover',
      description:
        'A featureless, swirling pale yellow-white cloud deck completely hides the rocky surface — Venus is the brightest planet seen from Earth because these clouds reflect so much sunlight.',
      cameraFraming: 'must-show-full-disc',
      rotationOffsetAtMidpointDeg: 0,
    },
    trueColor: {
      primaryHex: '#e8d9a8',
      secondaryHex: '#c9b87a',
      description: 'Pale, hazy yellow-white, almost featureless',
    },
    axialTiltDeg: 177.4, // retrograde — render rotating opposite direction
    atmosphere: {
      hasClouds: true,
      bandedStructure: false,
      description: 'Total cloud cover, no surface visible, subtle swirl patterns in upper deck',
    },
    diameterKm: 12104,
  },
  Earth: {
    body: 'Earth',
    textures: {
      map: '2k_earth_daymap.jpg',
      normal: '2k_earth_normal_map.jpg',
      specular: '2k_earth_specular_map.jpg',
      cloud: '2k_earth_clouds.jpg',
    },
    signatureFeature: {
      name: 'Blue oceans & swirling white cloud bands',
      description:
        'Deep blue oceans cover most of the visible disc, green-brown continents break the surface, and white cyclonic cloud swirls drift over both — the only body in this set with visible liquid water.',
      cameraFraming: 'must-show-full-disc',
      rotationOffsetAtMidpointDeg: 20, // Africa/Atlantic — the "blue marble" framing
    },
    trueColor: {
      primaryHex: '#2e6fb0',
      secondaryHex: '#4a7c3f',
      description: 'Blue ocean dominant, green-brown landmass, white cloud cover',
    },
    axialTiltDeg: 23.44,
    atmosphere: {
      hasClouds: true,
      bandedStructure: false,
      description: 'Dynamic, non-banded cloud systems — visible weather fronts and cyclones, not static bands',
    },
    diameterKm: 12742,
  },
  Moon: {
    body: 'Moon',
    textures: { map: '2k_moon.jpg' },
    signatureFeature: {
      name: 'Maria (dark basaltic plains)',
      description:
        'Dark, smooth basaltic plains (maria) contrast against brighter, heavily cratered highlands — together they form the familiar "man in the Moon" pattern visible from Earth.',
      cameraFraming: 'must-show-on-visible-hemisphere',
      rotationOffsetAtMidpointDeg: 0, // tidally locked — Earth-facing hemisphere is always 0
    },
    trueColor: {
      primaryHex: '#bdbdbd',
      secondaryHex: '#6e6e6e',
      description: 'Grey, low-contrast, dark maria patches against lighter highlands',
    },
    axialTiltDeg: 6.68,
    atmosphere: { hasClouds: false, bandedStructure: false, description: 'No atmosphere' },
    diameterKm: 3474,
  },
  Mars: {
    body: 'Mars',
    textures: { map: '2k_mars.jpg' },
    signatureFeature: {
      name: 'Rust-red surface, polar ice caps, Valles Marineris',
      description:
        'Iron-oxide-rich rust-red and orange terrain, brilliant white polar ice caps at both poles, and the vast Valles Marineris canyon system — over 4,000 km long — cutting across the equatorial region.',
      cameraFraming: 'must-show-polar-region',
      rotationOffsetAtMidpointDeg: 60, // brings Valles Marineris and a polar cap into frame together
    },
    trueColor: {
      primaryHex: '#c1440e',
      secondaryHex: '#7a2b08',
      description: 'Rust-red and burnt orange, darker volcanic regions, white polar caps',
    },
    axialTiltDeg: 25.19,
    atmosphere: {
      hasClouds: false,
      bandedStructure: false,
      description: 'Thin atmosphere, occasional pale dust-storm haze near limb',
    },
    diameterKm: 6779,
  },
  Jupiter: {
    body: 'Jupiter',
    textures: { map: '2k_jupiter.jpg' },
    signatureFeature: {
      name: 'Banded cloud zones and the Great Red Spot',
      description:
        'Alternating light-coloured zones and darker belts circle the planet in distinct horizontal bands. The Great Red Spot — a storm larger than Earth — sits in the southern hemisphere and has persisted for centuries.',
      cameraFraming: 'must-show-on-visible-hemisphere',
      rotationOffsetAtMidpointDeg: 90, // rotates the Great Red Spot into clear view at beat midpoint
    },
    trueColor: {
      primaryHex: '#c8a165',
      secondaryHex: '#8a5a2e',
      description: 'Cream, tan, and rust-orange horizontal bands',
    },
    axialTiltDeg: 3.13,
    atmosphere: {
      hasClouds: true,
      bandedStructure: true,
      description: 'Strongly banded — alternating zones (light) and belts (dark), with visible storm systems',
    },
    diameterKm: 139820,
  },
  Saturn: {
    body: 'Saturn',
    textures: { map: '2k_saturn.jpg', ring: '2k_saturn_ring_alpha.png' },
    signatureFeature: {
      name: 'Ring system with the Cassini Division',
      description:
        'A broad, flat ring system of ice and rock extends far beyond the planet, tilted to read as a dramatic ellipse. The Cassini Division — a visible dark gap — separates the outer A ring from the brighter B ring.',
      cameraFraming: 'must-show-ring-tilt',
      rotationOffsetAtMidpointDeg: 0,
    },
    trueColor: {
      primaryHex: '#e8d9ab',
      secondaryHex: '#c4a86b',
      description: 'Pale gold, muted bands, far less contrast than Jupiter',
    },
    axialTiltDeg: 26.73,
    rings: {
      innerRadiusMultiplier: 1.2,
      outerRadiusMultiplier: 2.3,
      tiltFromOrbitalPlaneDeg: 26.73,
      visibleGapName: 'Cassini Division',
    },
    atmosphere: {
      hasClouds: true,
      bandedStructure: true,
      description: 'Faint banding, much softer contrast than Jupiter',
    },
    diameterKm: 116460,
  },
  Uranus: {
    body: 'Uranus',
    textures: { map: '2k_uranus.jpg' },
    signatureFeature: {
      name: 'Extreme axial tilt — rotates on its side',
      description:
        "A near-featureless pale cyan disc coloured by methane absorbing red light — but its defining trait is rolling almost exactly on its side, with rings and moons orbiting nearly perpendicular to every other planet's orbital plane.",
      cameraFraming: 'must-show-polar-region',
      rotationOffsetAtMidpointDeg: 0,
    },
    trueColor: {
      primaryHex: '#9fe0e0',
      secondaryHex: '#6fc4c4',
      description: 'Pale cyan, almost featureless, very low contrast',
    },
    axialTiltDeg: 97.77, // visibly sideways — the rotation axis IS the signature feature
    atmosphere: { hasClouds: true, bandedStructure: false, description: 'Faint haze, essentially featureless to the eye' },
    diameterKm: 50724,
  },
  Neptune: {
    body: 'Neptune',
    textures: { map: '2k_neptune.jpg' },
    signatureFeature: {
      name: 'Deep azure colour and high-speed storm systems',
      description:
        'A deeper, more saturated blue than Uranus, with the fastest winds recorded in the solar system; historically showed a Great Dark Spot storm system analogous to Jupiter\'s Red Spot but transient.',
      cameraFraming: 'must-show-on-visible-hemisphere',
      rotationOffsetAtMidpointDeg: 50,
    },
    trueColor: {
      primaryHex: '#3b54d3',
      secondaryHex: '#26399c',
      description: 'Deep, saturated azure blue',
    },
    axialTiltDeg: 28.32,
    atmosphere: {
      hasClouds: true,
      bandedStructure: true,
      description: 'Visible faint banding and occasional bright cloud streaks against deep blue',
    },
    diameterKm: 49244,
  },
};
