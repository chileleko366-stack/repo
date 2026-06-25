/**
 * ModelLibrary.tsx — single source of truth for all 3D models in Dopamine Studios.
 *
 * HOW TO USE:
 *   import { MODELS, Model3D } from '../../assets/ModelLibrary';
 *
 *   // In a ThreeCanvas component:
 *   const { scene } = useGLTF(MODELS.brain.path);
 *
 * HOW TO ADD A MODEL:
 *   1. Add it to scripts/download_models.py
 *   2. Run: python scripts/download_models.py
 *   3. Add entry to MODELS below with path, description, license, and suggestedChannels
 *
 * HOW TO DUPLICATE THIS REPO:
 *   Copy public/models/ folder to new repo.
 *   Run python scripts/download_models.py to re-fetch anything missing.
 *   All imports stay the same — paths are relative to public/.
 *
 * REMOTION USAGE:
 *   All paths work with staticFile():
 *   staticFile(MODELS.brain.path) → '/brain_stem.glb' served from public/models/
 *
 * LICENSE KEY:
 *   CC0   = public domain, zero restrictions
 *   CC-BY = free commercial use, attribution required
 *   CC-BY-NC = non-commercial only — do NOT use on monetized channels
 */

import { staticFile } from 'remotion';
import { useGLTF } from '@react-three/drei';

// ── Type definitions ──────────────────────────────────────────────────────────

export type ModelLicense = 'CC0' | 'CC-BY' | 'CC-BY-NC' | 'MIT' | 'Poser-EULA' | 'Other';

export interface ModelEntry {
  /** Path relative to public/ — use with staticFile(entry.path) */
  path: string;
  /** Human-readable description */
  description: string;
  /** License type — check before using on monetized channels */
  license: ModelLicense;
  /** Attribution string if CC-BY — put in video description */
  attribution?: string;
  /** Which channels this model is primarily designed for */
  suggestedChannels: Array<'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'any'>;
  /** Approximate file size in MB */
  sizeMB: number;
}

// ── Model registry ────────────────────────────────────────────────────────────

export const MODELS = {
  // ── Anatomical ─────────────────────────────────────────────────────────────
  brain: {
    path: 'models/brain_stem.glb',
    description: 'Real human brain stem anatomy with animations and skins',
    license: 'Poser-EULA',
    attribution: 'BrainStem by Smith Micro Software / Keith Hunter',
    suggestedChannels: ['ch4'],
    sizeMB: 3.0,
  },
  skull: {
    path: 'models/skull.glb',
    description: 'Human skull with light scattering material',
    license: 'CC0',
    suggestedChannels: ['ch4', 'ch1'],
    sizeMB: 8.5,
  },
  mosquitoAmber: {
    path: 'models/mosquito_amber.glb',
    description: 'Mosquito preserved in amber — resin transparency',
    license: 'CC-BY',
    attribution: 'MosquitoInAmber — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch5', 'ch4'],
    sizeMB: 23.1,
  },

  // ── Human Figures ──────────────────────────────────────────────────────────
  faceCap: {
    path: 'models/face_cap.glb',
    description: 'Realistic human face with blend shapes for expressions',
    license: 'MIT',
    attribution: 'facecap — three.js examples',
    suggestedChannels: ['ch1', 'ch4'],
    sizeMB: 0.3,
  },
  michelle: {
    path: 'models/michelle.glb',
    description: 'Animated female figure — walk/run cycles',
    license: 'CC-BY',
    attribution: 'Michelle — three.js examples',
    suggestedChannels: ['ch1', 'ch5'],
    sizeMB: 3.1,
  },
  soldier: {
    path: 'models/soldier.glb',
    description: 'Military soldier with animation clips',
    license: 'CC-BY',
    attribution: 'Soldier — three.js examples',
    suggestedChannels: ['ch3', 'ch5'],
    sizeMB: 2.1,
  },
  xbot: {
    path: 'models/xbot.glb',
    description: 'Robot humanoid — clean stylized figure',
    license: 'CC-BY',
    attribution: 'Xbot — three.js examples',
    suggestedChannels: ['ch1', 'ch4'],
    sizeMB: 2.8,
  },
  kira: {
    path: 'models/kira.glb',
    description: 'Detailed female character with clothing',
    license: 'CC-BY',
    attribution: 'Kira — three.js examples',
    suggestedChannels: ['ch1'],
    sizeMB: 11.6,
  },
  cesiumMan: {
    path: 'models/cesium_man.glb',
    description: 'Animated walking humanoid',
    license: 'CC-BY',
    attribution: '© Cesium CC-BY 4.0',
    suggestedChannels: ['any'],
    sizeMB: 0.4,
  },
  corset: {
    path: 'models/corset.glb',
    description: 'Detailed fabric mannequin with corset',
    license: 'CC0',
    suggestedChannels: ['ch5', 'ch1'],
    sizeMB: 12.9,
  },

  // ── Masks / Busts / Art ────────────────────────────────────────────────────
  veniceMask: {
    path: 'models/venice_mask.glb',
    description: 'Ornate Venetian carnival mask — mystery/identity',
    license: 'CC-BY',
    attribution: 'venice_mask — three.js examples',
    suggestedChannels: ['ch3', 'ch1'],
    sizeMB: 4.1,
  },
  tennysonBust: {
    path: 'models/tennyson_bust.glb',
    description: 'Historical bust sculpture — Tennyson',
    license: 'CC-BY',
    attribution: 'tennyson-bust — three.js examples',
    suggestedChannels: ['ch5', 'ch4'],
    sizeMB: 0.4,
  },
  nefertiti: {
    path: 'models/nefertiti.glb',
    description: 'Nefertiti bust — ancient Egyptian artifact scan',
    license: 'CC-BY',
    attribution: 'Nefertiti — three.js examples',
    suggestedChannels: ['ch5'],
    sizeMB: 1.2,
  },
  suzanne: {
    path: 'models/suzanne.glb',
    description: "Blender's Suzanne monkey head with iridescence",
    license: 'CC0',
    suggestedChannels: ['any'],
    sizeMB: 0.5,
  },

  // ── Animals ────────────────────────────────────────────────────────────────
  flamingo: {
    path: 'models/flamingo.glb',
    description: 'Animated flamingo — morphing wings',
    license: 'CC0',
    suggestedChannels: ['ch1', 'ch5'],
    sizeMB: 0.07,
  },
  horse: {
    path: 'models/horse.glb',
    description: 'Animated horse — galloping',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 0.17,
  },
  parrot: {
    path: 'models/parrot.glb',
    description: 'Animated parrot — wing flapping',
    license: 'CC0',
    suggestedChannels: ['ch1'],
    sizeMB: 0.09,
  },
  stork: {
    path: 'models/stork.glb',
    description: 'Animated stork in flight',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 0.07,
  },
  duck: {
    path: 'models/duck.glb',
    description: 'Classic COLLADA duck — textured',
    license: 'Other',
    attribution: '© Sony SCEA',
    suggestedChannels: ['any'],
    sizeMB: 0.1,
  },
  fox: {
    path: 'models/fox.glb',
    description: 'Animated fox — survey, walk, run clips',
    license: 'CC0',
    suggestedChannels: ['ch1', 'ch5'],
    sizeMB: 0.15,
  },
  fish: {
    path: 'models/fish.glb',
    description: 'Realistic barramundi fish — PBR materials',
    license: 'CC0',
    suggestedChannels: ['ch4', 'ch5'],
    sizeMB: 11.9,
  },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  ferrari: {
    path: 'models/ferrari.glb',
    description: 'Ferrari sports car — high detail PBR',
    license: 'Other',
    attribution: 'Ferrari model — three.js examples, used in demos only',
    suggestedChannels: ['ch2'],
    sizeMB: 1.6,
  },
  carConcept: {
    path: 'models/car_concept.glb',
    description: 'Concept car with material variants — Khronos logos',
    license: 'CC-BY',
    attribution: '© Darmstadt Graphics Group CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 11.2,
  },
  toyCar: {
    path: 'models/toy_car.glb',
    description: 'Vibrant toy car — bright colors, multiple materials',
    license: 'CC-BY',
    attribution: 'ToyCar — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch2', 'ch1'],
    sizeMB: 5.2,
  },
  milkTruck: {
    path: 'models/milk_truck.glb',
    description: 'Animated milk truck — doors open/close',
    license: 'CC-BY',
    attribution: '© Cesium CC-BY 4.0',
    suggestedChannels: ['ch2', 'ch5'],
    sizeMB: 0.35,
  },
  carbonBike: {
    path: 'models/carbon_bike.glb',
    description: 'Carbon frame racing bicycle',
    license: 'CC-BY',
    attribution: 'CarbonFrameBike — three.js examples',
    suggestedChannels: ['ch2', 'ch1'],
    sizeMB: 3.2,
  },

  // ── Cameras / Optics ───────────────────────────────────────────────────────
  antiqueCamera: {
    path: 'models/antique_camera.glb',
    description: 'Antique camera on a tripod — surveillance aesthetic',
    license: 'CC0',
    suggestedChannels: ['ch3', 'ch5'],
    sizeMB: 16.7,
  },
  steampunkCamera: {
    path: 'models/steampunk_camera.glb',
    description: 'Ornate steampunk-style camera — investigative',
    license: 'CC-BY',
    attribution: 'steampunk_camera — three.js examples',
    suggestedChannels: ['ch3', 'ch5'],
    sizeMB: 3.8,
  },

  // ── Watches / Luxury ───────────────────────────────────────────────────────
  chronographWatch: {
    path: 'models/chronograph_watch.glb',
    description: 'Detailed chronograph wristwatch — material variants',
    license: 'CC-BY',
    attribution: '© Darmstadt Graphics Group CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 7.1,
  },
  rolex: {
    path: 'models/rolex.glb',
    description: 'Luxury watch model — high detail',
    license: 'CC-BY',
    attribution: 'rolex — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 1.2,
  },
  sunglasses: {
    path: 'models/sunglasses.glb',
    description: 'Stylized sunglasses — Khronos branded',
    license: 'CC-BY',
    attribution: 'SunglassesKhronos — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch1', 'ch2'],
    sizeMB: 0.35,
  },

  // ── Furniture ──────────────────────────────────────────────────────────────
  velvetSofa: {
    path: 'models/velvet_sofa.glb',
    description: 'Glamorous velvet sofa — sheen materials',
    license: 'CC-BY',
    attribution: '© Wayfair LLC CC BY 4.0',
    suggestedChannels: ['ch1', 'ch2'],
    sizeMB: 3.0,
  },
  sheenChair: {
    path: 'models/sheen_chair.glb',
    description: 'Modern fabric chair — sheen extension',
    license: 'CC-BY',
    attribution: 'SheenChair — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch1'],
    sizeMB: 3.9,
  },
  silkPouf: {
    path: 'models/silk_pouf.glb',
    description: 'Silk upholstered ottoman — luxury',
    license: 'CC-BY',
    attribution: 'SpecularSilkPouf — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch1', 'ch2'],
    sizeMB: 4.4,
  },

  // ── Glass / Decorative ─────────────────────────────────────────────────────
  candleHolder: {
    path: 'models/candle_holder.glb',
    description: 'Glass hurricane candle holder — transmission/volume',
    license: 'CC-BY',
    attribution: '© Wayfair LLC CC BY 4.0',
    suggestedChannels: ['ch5', 'ch1'],
    sizeMB: 2.6,
  },
  vaseFlowers: {
    path: 'models/vase_flowers.glb',
    description: 'Glass vase with flowers — transparency showcase',
    license: 'CC0',
    suggestedChannels: ['ch5', 'ch1'],
    sizeMB: 1.7,
  },
  brokenWindow: {
    path: 'models/broken_window.glb',
    description: 'Shattered glass window — revelation/crisis',
    license: 'CC-BY',
    attribution: '© Wayfair CC BY 4.0',
    suggestedChannels: ['ch3', 'ch2'],
    sizeMB: 1.0,
  },
  lantern: {
    path: 'models/lantern.glb',
    description: 'Old wooden street lantern — time passing',
    license: 'CC0',
    suggestedChannels: ['ch5', 'ch3'],
    sizeMB: 9.1,
  },

  // ── Food / Nature ──────────────────────────────────────────────────────────
  avocado: {
    path: 'models/avocado.glb',
    description: 'Realistic avocado — PBR fruit',
    license: 'CC0',
    suggestedChannels: ['ch1', 'ch4'],
    sizeMB: 7.7,
  },
  plant: {
    path: 'models/plant.glb',
    description: 'Potted plant — diffuse transmission leaves',
    license: 'CC-BY',
    attribution: 'DiffuseTransmissionPlant — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch4', 'ch5'],
    sizeMB: 5.5,
  },
  teacup: {
    path: 'models/teacup.glb',
    description: 'Porcelain teacup — diffuse transmission',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 4.6,
  },
  dragon: {
    path: 'models/dragon.glb',
    description: 'Stanford dragon — glass/resin material',
    license: 'CC0',
    attribution: 'Stanford University Computer Graphics Laboratory',
    suggestedChannels: ['ch3', 'ch6'],
    sizeMB: 6.1,
  },

  // ── Appliances ─────────────────────────────────────────────────────────────
  refrigerator: {
    path: 'models/refrigerator.glb',
    description: 'Commercial refrigerator with animated door',
    license: 'CC-BY',
    attribution: '© Darmstadt Graphics Group CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 9.7,
  },
  boombox: {
    path: 'models/boombox.glb',
    description: 'Retro boombox — emissive front panel',
    license: 'CC0',
    suggestedChannels: ['ch1'],
    sizeMB: 10.1,
  },

  // ── Sci-Fi / Space ─────────────────────────────────────────────────────────
  ionDrive: {
    path: 'models/ion_drive.glb',
    description: 'Sci-fi ion drive engine — glowing energy',
    license: 'CC-BY',
    attribution: 'PrimaryIonDrive — three.js examples',
    suggestedChannels: ['ch6'],
    sizeMB: 5.5,
  },
  spaceshipHallway: {
    path: 'models/spaceship_hallway.glb',
    description: 'Sci-fi spacecraft corridor interior',
    license: 'CC-BY',
    attribution: 'space_ship_hallway — three.js examples',
    suggestedChannels: ['ch6'],
    sizeMB: 2.8,
  },
  damagedHelmet: {
    path: 'models/damaged_helmet.glb',
    description: 'Battle-worn flight helmet — PBR showcase',
    license: 'CC-BY-NC',
    attribution: '© ctxwing CC BY-NC 4.0 — NON-COMMERCIAL ONLY',
    suggestedChannels: ['ch3', 'ch5'],
    sizeMB: 3.6,
  },

  // ── Abstract / Spheres ─────────────────────────────────────────────────────
  metalSpheres: {
    path: 'models/metal_spheres.glb',
    description: 'PBR sphere array — metallic roughness showcase',
    license: 'CC-BY',
    attribution: 'MetalRoughSpheres — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch6', 'ch4'],
    sizeMB: 10.7,
  },
  sphereClean: {
    path: 'models/sphere_clean.glb',
    description: 'Clean metal sphere — minimal, versatile',
    license: 'CC-BY',
    attribution: 'MetalRoughSpheresNoTextures — KhronosGroup CC BY 4.0',
    suggestedChannels: ['any'],
    sizeMB: 0.27,
  },

  // ── Cities ─────────────────────────────────────────────────────────────────
  virtualCity: {
    path: 'models/virtual_city.glb',
    description: 'Abstract 3D city block — urban scale',
    license: 'CC-BY',
    attribution: 'VirtualCity — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch2', 'ch5'],
    sizeMB: 2.9,
  },
  littlestTokyo: {
    path: 'models/littlest_tokyo.glb',
    description: 'Miniature Tokyo street scene — animated',
    license: 'CC-BY',
    attribution: 'LittlestTokyo — three.js examples',
    suggestedChannels: ['ch5', 'ch1'],
    sizeMB: 3.9,
  },

  // ── Mechanical ─────────────────────────────────────────────────────────────
  gears: {
    path: 'models/gears.glb',
    description: 'Interlocking mechanical gears',
    license: 'CC-BY',
    attribution: 'gears — three.js examples',
    suggestedChannels: ['ch2', 'ch4'],
    sizeMB: 0.07,
  },

  // ── Ch1 per-channel variants ───────────────────────────────────────────────
  ch1Xbot: {
    path: 'models/xbot.glb',
    description: 'Robot humanoid — hook figure for ch1 social/psychology',
    license: 'CC-BY',
    attribution: 'Xbot — three.js examples',
    suggestedChannels: ['ch1'],
    sizeMB: 2.7,
  },
  ch1Michelle: {
    path: 'models/michelle.glb',
    description: 'Animated female figure — context beat for ch1',
    license: 'CC-BY',
    attribution: 'Michelle — three.js examples',
    suggestedChannels: ['ch1'],
    sizeMB: 3.1,
  },
  ch1Kira: {
    path: 'models/kira.glb',
    description: 'Detailed female character — outro for ch1',
    license: 'CC-BY',
    attribution: 'Kira — three.js examples',
    suggestedChannels: ['ch1'],
    sizeMB: 11.6,
  },
  ch1Flamingo: {
    path: 'models/flamingo.glb',
    description: 'Animated flamingo — morphing wings, ch1 accent',
    license: 'CC0',
    suggestedChannels: ['ch1'],
    sizeMB: 0.07,
  },
  ch1VeniceMask: {
    path: 'models/venice_mask.glb',
    description: 'Venetian carnival mask — identity/persona, ch1',
    license: 'CC-BY',
    attribution: 'venice_mask — three.js examples',
    suggestedChannels: ['ch1'],
    sizeMB: 4.0,
  },
  ch1VelvetSofa: {
    path: 'models/velvet_sofa.glb',
    description: 'Glamorous velvet sofa — lifestyle, ch1',
    license: 'CC-BY',
    attribution: '© Wayfair LLC CC BY 4.0',
    suggestedChannels: ['ch1'],
    sizeMB: 3.0,
  },
  ch1SheenChair: {
    path: 'models/sheen_chair.glb',
    description: 'Modern fabric chair — lifestyle, ch1',
    license: 'CC-BY',
    attribution: 'SheenChair — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch1'],
    sizeMB: 3.9,
  },
  ch1Fox: {
    path: 'models/fox.glb',
    description: 'Animated fox — survey/walk/run, ch1 accent',
    license: 'CC0',
    suggestedChannels: ['ch1'],
    sizeMB: 0.1,
  },

  // ── Ch2 per-channel variants ───────────────────────────────────────────────
  ch2Watch: {
    path: 'models/chronograph_watch.glb',
    description: 'Detailed chronograph wristwatch — finance/luxury ch2',
    license: 'CC-BY',
    attribution: '© Darmstadt Graphics Group CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 7.1,
  },
  ch2Rolex: {
    path: 'models/rolex.glb',
    description: 'Luxury watch — wealth signal, ch2',
    license: 'CC-BY',
    attribution: 'rolex — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 1.2,
  },
  ch2CarbonBike: {
    path: 'models/carbon_bike.glb',
    description: 'Carbon racing bicycle — performance/wealth, ch2',
    license: 'CC-BY',
    attribution: 'CarbonFrameBike — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 3.2,
  },
  ch2ToyCar: {
    path: 'models/toy_car.glb',
    description: 'Vibrant toy car — consumerism beat, ch2',
    license: 'CC-BY',
    attribution: 'ToyCar — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 5.1,
  },
  ch2CarConcept: {
    path: 'models/car_concept.glb',
    description: 'Concept car with material variants — future wealth, ch2',
    license: 'CC-BY',
    attribution: '© Darmstadt Graphics Group CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 11.2,
  },
  ch2Sunglasses: {
    path: 'models/sunglasses.glb',
    description: 'Stylized sunglasses — luxury accessory, ch2',
    license: 'CC-BY',
    attribution: 'SunglassesKhronos — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 0.3,
  },
  ch2Shoe: {
    path: 'models/shoe.glb',
    description: 'Designer shoe — luxury/fashion, ch2',
    license: 'CC-BY',
    attribution: 'shoe — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 7.4,
  },
  ch2VirtualCity: {
    path: 'models/virtual_city.glb',
    description: 'Abstract 3D city block — scale/wealth context, ch2',
    license: 'CC-BY',
    attribution: 'VirtualCity — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch2'],
    sizeMB: 2.9,
  },
  ch2Gears: {
    path: 'models/gears.glb',
    description: 'Mechanical gears — economic systems, ch2',
    license: 'CC-BY',
    attribution: 'gears — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 0.07,
  },
  ch2Tokyo: {
    path: 'models/littlest_tokyo.glb',
    description: 'Miniature Tokyo street scene — global economy, ch2',
    license: 'CC-BY',
    attribution: 'LittlestTokyo — three.js examples',
    suggestedChannels: ['ch2'],
    sizeMB: 3.9,
  },

  // ── Ch3 per-channel variants ───────────────────────────────────────────────
  ch3SteampunkCam: {
    path: 'models/steampunk_camera.glb',
    description: 'Ornate steampunk camera — surveillance/noir, ch3',
    license: 'CC-BY',
    attribution: 'steampunk_camera — three.js examples',
    suggestedChannels: ['ch3'],
    sizeMB: 3.7,
  },
  ch3Skull: {
    path: 'models/skull.glb',
    description: 'Human skull — mortality/danger, ch3',
    license: 'CC0',
    suggestedChannels: ['ch3'],
    sizeMB: 8.5,
  },
  ch3Lantern: {
    path: 'models/lantern.glb',
    description: 'Old wooden lantern — mystery/time, ch3',
    license: 'CC0',
    suggestedChannels: ['ch3'],
    sizeMB: 9.1,
  },
  ch3BrokenWindow: {
    path: 'models/broken_window.glb',
    description: 'Shattered glass window — crisis reveal, ch3',
    license: 'CC-BY',
    attribution: '© Wayfair CC BY 4.0',
    suggestedChannels: ['ch3'],
    sizeMB: 1.0,
  },
  ch3Coals: {
    path: 'models/pot_coals.glb',
    description: 'Glowing coals — heat/tension, ch3',
    license: 'CC-BY',
    attribution: 'coals — three.js examples',
    suggestedChannels: ['ch3'],
    sizeMB: 4.4,
  },
  ch3Soldier: {
    path: 'models/soldier.glb',
    description: 'Military soldier with animations — confrontation, ch3',
    license: 'CC-BY',
    attribution: 'Soldier — three.js examples',
    suggestedChannels: ['ch3'],
    sizeMB: 2.0,
  },
  ch3Bust: {
    path: 'models/tennyson_bust.glb',
    description: 'Historical bust — authority/power, ch3',
    license: 'CC-BY',
    attribution: 'tennyson-bust — three.js examples',
    suggestedChannels: ['ch3'],
    sizeMB: 0.4,
  },

  // ── Ch4 per-channel variants ───────────────────────────────────────────────
  ch4Skull: {
    path: 'models/skull.glb',
    description: 'Human skull — anatomy/mortality, ch4 neuroscience',
    license: 'CC0',
    suggestedChannels: ['ch4'],
    sizeMB: 8.5,
  },
  ch4MosquitoAmber: {
    path: 'models/mosquito_amber.glb',
    description: 'Mosquito in amber — prehistoric preservation, ch4',
    license: 'CC-BY',
    attribution: 'MosquitoInAmber — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch4'],
    sizeMB: 23.1,
  },
  ch4Plant: {
    path: 'models/plant.glb',
    description: 'Potted plant with diffuse leaves — growth, ch4',
    license: 'CC-BY',
    attribution: 'DiffuseTransmissionPlant — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch4'],
    sizeMB: 5.4,
  },
  ch4Fish: {
    path: 'models/fish.glb',
    description: 'Realistic barramundi fish — brain/evolution, ch4',
    license: 'CC0',
    suggestedChannels: ['ch4'],
    sizeMB: 11.9,
  },
  ch4CrystalDragon: {
    path: 'models/dragon.glb',
    description: 'Glass dragon — neural complexity/wonder, ch4',
    license: 'CC0',
    attribution: 'Stanford University Computer Graphics Laboratory',
    suggestedChannels: ['ch4'],
    sizeMB: 6.1,
  },
  ch4GlassVase: {
    path: 'models/vase_flowers.glb',
    description: 'Glass vase with flowers — fragility/beauty, ch4',
    license: 'CC0',
    suggestedChannels: ['ch4'],
    sizeMB: 1.7,
  },
  ch4MetalSpheres: {
    path: 'models/metal_spheres.glb',
    description: 'PBR metal spheres — neural network metaphor, ch4',
    license: 'CC-BY',
    attribution: 'MetalRoughSpheres — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch4'],
    sizeMB: 10.7,
  },

  // ── Ch5 per-channel variants ───────────────────────────────────────────────
  ch5Candle: {
    path: 'models/candle_holder.glb',
    description: 'Glass hurricane candle holder — historical atmosphere, ch5',
    license: 'CC-BY',
    attribution: '© Wayfair LLC CC BY 4.0',
    suggestedChannels: ['ch5'],
    sizeMB: 2.5,
  },
  ch5Lantern: {
    path: 'models/lantern.glb',
    description: 'Old wooden street lantern — period lighting, ch5',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 9.1,
  },
  ch5Corset: {
    path: 'models/corset.glb',
    description: 'Period fabric corset mannequin — historical fashion, ch5',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 12.8,
  },
  ch5MilkTruck: {
    path: 'models/milk_truck.glb',
    description: 'Animated vintage milk truck — period vehicle, ch5',
    license: 'CC-BY',
    attribution: '© Cesium CC-BY 4.0',
    suggestedChannels: ['ch5'],
    sizeMB: 0.3,
  },
  ch5Soldier: {
    path: 'models/soldier.glb',
    description: 'Military soldier — historical figure, ch5',
    license: 'CC-BY',
    attribution: 'Soldier — three.js examples',
    suggestedChannels: ['ch5'],
    sizeMB: 2.0,
  },
  ch5VeniceMask: {
    path: 'models/venice_mask.glb',
    description: 'Venetian carnival mask — historical identity, ch5',
    license: 'CC-BY',
    attribution: 'venice_mask — three.js examples',
    suggestedChannels: ['ch5'],
    sizeMB: 4.0,
  },
  ch5Boombox: {
    path: 'models/boombox.glb',
    description: 'Retro boombox — cultural artifact, ch5',
    license: 'CC0',
    suggestedChannels: ['ch5'],
    sizeMB: 10.1,
  },

  // ── Ch6 per-channel variants ───────────────────────────────────────────────
  ch6IonDrive: {
    path: 'models/ion_drive.glb',
    description: 'Sci-fi ion drive engine — propulsion beat, ch6',
    license: 'CC-BY',
    attribution: 'PrimaryIonDrive — three.js examples',
    suggestedChannels: ['ch6'],
    sizeMB: 5.5,
  },
  ch6ShipHallway: {
    path: 'models/spaceship_hallway.glb',
    description: 'Spacecraft corridor interior — immersive space, ch6',
    license: 'CC-BY',
    attribution: 'space_ship_hallway — three.js examples',
    suggestedChannels: ['ch6'],
    sizeMB: 2.7,
  },
  ch6MetalSpheres: {
    path: 'models/metal_spheres.glb',
    description: 'PBR metal spheres — material science beat, ch6',
    license: 'CC-BY',
    attribution: 'MetalRoughSpheres — KhronosGroup CC BY 4.0',
    suggestedChannels: ['ch6'],
    sizeMB: 10.7,
  },
  ch6Crystal: {
    path: 'models/dragon.glb',
    description: 'Glass crystal dragon — cosmic wonder, ch6',
    license: 'CC0',
    attribution: 'Stanford University Computer Graphics Laboratory',
    suggestedChannels: ['ch6'],
    sizeMB: 6.1,
  },
  ch6Dispersion: {
    path: 'models/dragon.glb',
    description: 'Prismatic dispersion model — light/spectrum, ch6',
    license: 'CC0',
    attribution: 'Stanford University Computer Graphics Laboratory',
    suggestedChannels: ['ch6'],
    sizeMB: 6.1,
  },
  ch6GlassShatter: {
    path: 'models/broken_window.glb',
    description: 'Shattered glass — explosive reveal, ch6',
    license: 'CC-BY',
    attribution: '© Wayfair CC BY 4.0',
    suggestedChannels: ['ch6'],
    sizeMB: 1.0,
  },
  ch6ShaderBall: {
    path: 'models/shader_ball.glb',
    description: 'Material showcase sphere — PBR reference, ch6',
    license: 'CC-BY',
    attribution: 'ShaderBall — three.js examples',
    suggestedChannels: ['ch6'],
    sizeMB: 1.3,
  },
} as const satisfies Record<string, ModelEntry>;

// ── Preload helper ────────────────────────────────────────────────────────────

/**
 * Preload all models at startup to prevent first-frame loading stalls.
 * Call once from Root.tsx or a top-level component.
 */
export function preloadAllModels(): void {
  Object.values(MODELS).forEach((entry) => {
    useGLTF.preload(staticFile(entry.path));
  });
}

/**
 * Get a static URL for a model — use inside ThreeCanvas components.
 * @example
 *   const { scene } = useGLTF(modelPath('brain'));
 */
export function modelPath(key: keyof typeof MODELS): string {
  return staticFile(MODELS[key].path);
}

/**
 * Get all models recommended for a specific channel.
 */
export function modelsForChannel(
  channelId: 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6'
): Array<[string, ModelEntry]> {
  return Object.entries(MODELS).filter(
    ([, entry]) =>
      (entry.suggestedChannels as readonly string[]).includes(channelId) ||
      (entry.suggestedChannels as readonly string[]).includes('any')
  );
}

// ── Type export ───────────────────────────────────────────────────────────────
export type ModelKey = keyof typeof MODELS;
