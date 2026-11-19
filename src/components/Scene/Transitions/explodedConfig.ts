import * as THREE from 'three';

export interface ExplodedComponentConfig {
  /** Target object name in Three.js scene hierarchy */
  name: string;
  /** Translation delta [x, y, z] when fully exploded */
  offset: [number, number, number];
  /** Rotation delta [x, y, z] in radians when fully exploded */
  rotation?: [number, number, number];
  /** Scale multiplier when fully exploded (default: 0.0) */
  explodedScale?: number;
  /** Normalized time window [start, end] in range [0, 1] */
  timing: [number, number];
}

export type DestinationId = 'HOME' | 'ARCHIVE' | 'FOREST' | 'WORKSHOP';

export interface IslandDisplayTransform {
  scale: [number, number, number];
  position: [number, number, number];
}

/**
 * Standardized visual scale and vertical framing offsets across all 4 islands.
 * Calibrated against Hero's Home island as the exact 1.0 visual size reference:
 * - Products (Rune Creation Workshop): scale 0.59, matched apparent screen footprint
 * - Projects (Grand Mage's Archive): scale 0.70, matched apparent screen footprint
 * - About Me (Whispering Forest): scale 0.61, matched apparent screen footprint
 */
export const ISLAND_DISPLAY_TRANSFORMS: Record<DestinationId, IslandDisplayTransform> = {
  HOME: {
    scale: [1, 1, 1],
    position: [0, 0, 0],
  },
  ARCHIVE: {
    scale: [0.70, 0.70, 0.70],
    position: [-0.85, -0.45, -0.2],
  },
  FOREST: {
    scale: [0.58, 0.58, 0.58],
    position: [0.0, 0.50, 0.0],
  },
  WORKSHOP: {
    scale: [0.59, 0.59, 0.59],
    position: [-0.48, 0.65, 0.35],
  },
};

export interface IslandExplodedProfile {
  islandId: DestinationId;
  displayName: string;
  /** Duration in seconds for disassembly */
  disassemblyDuration: number;
  /** Duration in seconds for reassembly */
  reassemblyDuration: number;
  /** Components configuration */
  components: ExplodedComponentConfig[];
}

/**
 * Hero's Home Disassembly/Reassembly Configuration
 * 100% component coverage: 41/41 components (37 environmental + 4 atomic characters)
 * Coordinated architectural exploded view:
 * 1. Smoke wisps, flame embers, and party characters depart/arrive
 * 2. Crops, training gear, benches, woodpile, and lanterns disperse outward
 * 3. Wildflowers and foliage lift and separate
 * 4. Shingled roof, chimney, doors, and timber frame expand outward
 * 5. Waystone path, meadow, and base floating island sink into the depths
 */
export const HERO_HOME_EXPLODED_PROFILE: IslandExplodedProfile = {
  islandId: 'HOME',
  displayName: "Hero's Home",
  disassemblyDuration: 1.8,
  reassemblyDuration: 2.2,
  components: [
    // --- Characters (Complete atomic models, gentle fade/scale) ---
    { name: 'Frieren', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'Himmel', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'Heiter', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.08, 0.52] },
    { name: 'Eisen', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.1, 0.55] },

    // --- Chimney Smoke Wisps (Lift into the night sky) ---
    { name: 'ChimneyWisp1', offset: [0.5, 12.0, 0.5], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'ChimneyWisp2', offset: [-0.5, 13.0, 0.2], explodedScale: 0, timing: [0.02, 0.47] },
    { name: 'ChimneyWisp3', offset: [0.3, 14.0, -0.4], explodedScale: 0, timing: [0.04, 0.49] },
    { name: 'ChimneyWisp4', offset: [-0.3, 15.0, 0.6], explodedScale: 0, timing: [0.06, 0.51] },

    // --- Campfire Flames (Dancing embers lift and dissipate) ---
    { name: 'HearthFlame1', offset: [0.2, 4.0, 0.2], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'HearthFlame2', offset: [-0.2, 4.5, -0.1], explodedScale: 0, timing: [0.07, 0.52] },
    { name: 'HearthFlame3', offset: [0.1, 5.0, 0.3], explodedScale: 0, timing: [0.09, 0.54] },

    // --- Farm Details & Crops ---
    { name: 'CropPatchCarrots', offset: [-6, 3, 4], rotation: [0.1, 0.2, 0], explodedScale: 0, timing: [0.05, 0.55] },
    { name: 'CropPatchCabbages', offset: [-7, 3, 3], rotation: [0.1, 0.15, 0], explodedScale: 0, timing: [0.08, 0.58] },
    { name: 'CropPatchSquash', offset: [-6.5, 3, 2], rotation: [0.1, 0.1, 0], explodedScale: 0, timing: [0.1, 0.6] },
    { name: 'Scarecrow', offset: [-5, 5, 2], rotation: [0.2, 0, 0.1], explodedScale: 0, timing: [0.12, 0.62] },
    { name: 'GardenSupplies', offset: [-4, 2, 3], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'WateringCan', offset: [-4.5, 2.5, 4], explodedScale: 0, timing: [0.15, 0.65] },

    // --- Training Gear & Props ---
    { name: 'PracticeYard', offset: [5, 2, -3], explodedScale: 0, timing: [0.1, 0.6] },
    { name: 'TrainingDummy', offset: [6, 4, -2], rotation: [0, -0.2, 0.15], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'PracticeTarget', offset: [7, 4, -3], rotation: [0.1, -0.2, 0], explodedScale: 0, timing: [0.18, 0.68] },
    { name: 'WeaponRack', offset: [6, 3, -4], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'WoodenSword', offset: [5, 3.5, -2], rotation: [0.3, 0.2, 0], explodedScale: 0, timing: [0.12, 0.62] },

    // --- Campfire & Outdoor Furnishings ---
    { name: 'HearthsideSeats', offset: [0, 3, 6], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'Campfire', offset: [0, 3, 5], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'GardenGateLantern', offset: [3, 4, 3], explodedScale: 0, timing: [0.22, 0.72] },
    { name: 'Woodpile', offset: [-3.5, 2, -1], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'GardenStool', offset: [-2, 2, 2], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'PorchSign', offset: [1, 3, 3], explodedScale: 0, timing: [0.25, 0.75] },

    // --- Vegetation & Foliage ---
    { name: 'WildflowerBanks', offset: [0, 2.5, 0], rotation: [0, 0.2, 0], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'YoungFir', offset: [-5, 6, 6], rotation: [-0.1, 0, -0.1], explodedScale: 0.1, timing: [0.28, 0.78] },
    { name: 'WindwardFir', offset: [6, 8, -5], rotation: [0.1, 0, -0.12], explodedScale: 0.1, timing: [0.32, 0.82] },
    { name: 'MainTree', offset: [-6, 8, -6], rotation: [-0.12, 0, 0.12], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'CliffIvyAndRoots', offset: [0, -2, 1], explodedScale: 0.1, timing: [0.45, 0.9] },

    // --- Architecture (House components separate along architectural axes) ---
    { name: 'PorchAndOakDoor', offset: [0, 2.5, 4.5], rotation: [0.05, 0, 0], explodedScale: 0.1, timing: [0.25, 0.75] },
    { name: 'TimberFrame', offset: [0, 4.5, -4.5], rotation: [-0.05, 0, 0], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'ShingledGables', offset: [0, 8.5, 0], rotation: [0.08, 0, 0.04], explodedScale: 0.1, timing: [0.35, 0.85] },
    { name: 'FieldstoneChimney', offset: [0, 10.5, 0], rotation: [0.05, 0, 0], explodedScale: 0.1, timing: [0.4, 0.9] },

    // --- Ground & Base Terrain ---
    { name: 'WaystonePath', offset: [0, -3.5, 0], explodedScale: 0.2, timing: [0.5, 0.92] },
    { name: 'BackBoundary', offset: [0, -4, -6], explodedScale: 0, timing: [0.55, 0.95] },
    { name: 'Meadow', offset: [0, -5.5, 0], explodedScale: 0.2, timing: [0.55, 0.96] },
    { name: 'FloatingIsland', offset: [0, -10.0, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
  ],
};

/**
 * Grand Mage's Archive Disassembly/Reassembly Configuration
 * 100% component coverage: 39/39 components covering all 162 meshes
 */
export const ARCHIVE_EXPLODED_PROFILE: IslandExplodedProfile = {
  islandId: 'ARCHIVE',
  displayName: "Grand Mage's Archive",
  disassemblyDuration: 1.8,
  reassemblyDuration: 2.2,
  components: [
    // --- Character & Motes ---
    { name: 'ArchiveFrierenRoot', offset: [0, 3, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'ArchiveMotes', offset: [0, 8, 0], explodedScale: 0, timing: [0.0, 0.5] },

    // --- 8 Floating Grimoires / Turning Books ---
    { name: 'FloatingBook_0', offset: [3, 6, -2], rotation: [0.2, 0.4, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'FloatingBook_1', offset: [-3, 7, -1], rotation: [-0.2, -0.3, 0], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'FloatingBook_2', offset: [4, 6.5, 2], rotation: [0.3, 0.1, 0], explodedScale: 0, timing: [0.08, 0.52] },
    { name: 'FloatingBook_3', offset: [-4, 7.5, 2], rotation: [-0.1, 0.4, 0], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'FloatingBook_4', offset: [2, 8, 4], rotation: [0.2, -0.2, 0], explodedScale: 0, timing: [0.12, 0.58] },
    { name: 'FloatingBook_5', offset: [-2, 8.5, 4], rotation: [-0.2, 0.2, 0], explodedScale: 0, timing: [0.14, 0.6] },
    { name: 'FloatingBook_6', offset: [0, 9, 3], rotation: [0.4, 0, 0], explodedScale: 0, timing: [0.16, 0.62] },
    { name: 'FloatingBook_7', offset: [1, 9.5, -3], rotation: [-0.3, 0.3, 0], explodedScale: 0, timing: [0.18, 0.64] },

    // --- Chandeliers (Lift into ceiling space) ---
    { name: 'CandleChandelier_0', offset: [0, 11, 0], explodedScale: 0.1, timing: [0.15, 0.65] },
    { name: 'CandleChandelier_-3.4', offset: [-3.4, 11, 0], explodedScale: 0.1, timing: [0.18, 0.68] },
    { name: 'CandleChandelier_3.1', offset: [3.1, 11, 0], explodedScale: 0.1, timing: [0.2, 0.7] },

    // --- 6 Skill Grimoires (Levitate gently outward) ---
    { name: 'Grimoire_1', offset: [-5, 7, 5], rotation: [0.2, 0, 0], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'Grimoire_2', offset: [-3, 7, 5.5], rotation: [0.15, 0, 0], explodedScale: 0, timing: [0.12, 0.57] },
    { name: 'Grimoire_3', offset: [-1, 7, 6], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.14, 0.6] },
    { name: 'Grimoire_4', offset: [1, 7, 6], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.16, 0.62] },
    { name: 'Grimoire_5', offset: [3, 7, 5.5], rotation: [0.15, 0, 0], explodedScale: 0, timing: [0.18, 0.64] },
    { name: 'Grimoire_6', offset: [5, 7, 5], rotation: [0.2, 0, 0], explodedScale: 0, timing: [0.2, 0.66] },

    // --- 6 Stone Grimoire Pedestals ---
    { name: 'GrimoirePedestal_0', offset: [-5, -6, 5], explodedScale: 0, timing: [0.25, 0.75] },
    { name: 'GrimoirePedestal_1', offset: [-3, -6, 5.5], explodedScale: 0, timing: [0.27, 0.77] },
    { name: 'GrimoirePedestal_2', offset: [-1, -6, 6], explodedScale: 0, timing: [0.29, 0.79] },
    { name: 'GrimoirePedestal_3', offset: [1, -6, 6], explodedScale: 0, timing: [0.31, 0.81] },
    { name: 'GrimoirePedestal_4', offset: [3, -6, 5.5], explodedScale: 0, timing: [0.33, 0.83] },
    { name: 'GrimoirePedestal_5', offset: [5, -6, 5], explodedScale: 0, timing: [0.35, 0.85] },

    // --- Furniture ---
    { name: 'ReadingDesk', offset: [0, 4, 6], rotation: [-0.08, 0, 0], explodedScale: 0.1, timing: [0.2, 0.7] },
    { name: 'ArchiveReadingFurniture', offset: [-4, 3, 2], explodedScale: 0.1, timing: [0.25, 0.75] },

    // --- Architecture (Grand Library structure & spiral stairs) ---
    { name: 'SpiralStaircase', offset: [6, 7, 2], rotation: [0, 0.35, 0], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'GrandLibrary', offset: [0, 11, -4], rotation: [0.06, 0, 0], explodedScale: 0.1, timing: [0.4, 0.9] },

    // --- 9 Satellite Drifting Rocks ---
    { name: 'FloatingRock_0', offset: [8, 2, -6], explodedScale: 0, timing: [0.45, 0.9] },
    { name: 'FloatingRock_1', offset: [-8, 3, -5], explodedScale: 0, timing: [0.48, 0.92] },
    { name: 'FloatingRock_2', offset: [9, -2, 4], explodedScale: 0, timing: [0.5, 0.94] },
    { name: 'FloatingRock_3', offset: [-9, -1, 5], explodedScale: 0, timing: [0.52, 0.95] },
    { name: 'FloatingRock_4', offset: [0, -5, 10], explodedScale: 0, timing: [0.54, 0.96] },
    { name: 'FloatingRock_5', offset: [7, 5, 0], explodedScale: 0, timing: [0.56, 0.97] },
    { name: 'FloatingRock_6', offset: [-7, 4, -1], explodedScale: 0, timing: [0.58, 0.98] },
    { name: 'FloatingRock_7', offset: [5, -4, -7], explodedScale: 0, timing: [0.6, 0.99] },
    { name: 'FloatingRock_8', offset: [-5, -3, -8], explodedScale: 0, timing: [0.62, 1.0] },

    // --- Island Base ---
    { name: 'ArchiveIsland', offset: [0, -12, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
  ],
};

/**
 * Whispering Forest (Level 03 — About Me) Disassembly/Reassembly Configuration
 * 100% component coverage: 59 components covering all 29 GLBs, 20 connectors, all water ripples, pages, floating rocks, and character
 */
export const FOREST_EXPLODED_PROFILE: IslandExplodedProfile = {
  islandId: 'FOREST',
  displayName: 'Blue Flower Garden',
  disassemblyDuration: 1.8,
  reassemblyDuration: 2.2,
  components: [
    // --- Level 05: Blue Flower Garden Characters & Wreaths ---
    { name: 'HimmelRoot', offset: [0, 3, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'FrierenRoot', offset: [0, 3, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'flower-wreath-himmel', offset: [0, 3.5, 0], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'flower-wreath-frieren', offset: [0, 3.5, 0], explodedScale: 0, timing: [0.05, 0.5] },

    // --- Floating Petals, Magical Motes & Satellite Rocks ---
    { name: 'floating-petals', offset: [0, 8, 0], explodedScale: 0, timing: [0.0, 0.5] },
    { name: 'magical-motes', offset: [0, 9, 0], explodedScale: 0, timing: [0.0, 0.5] },
    { name: 'floating-rocks', offset: [0, -5, 0], explodedScale: 0.1, timing: [0.1, 0.6] },

    // --- Garden Environment Nodes (Island, Meadow, Trees, Clouds) ---
    { name: 'DreamyClouds', offset: [0, 10, 0], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'FloweringTrees', offset: [5, 4, 3], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'GardenShrubs', offset: [-4, 3, -3], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'ForegroundFlowers', offset: [0, 2, 2], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'DenseFlowerMeadow', offset: [0, 1.5, 0], explodedScale: 0.5, timing: [0.2, 0.75] },
    { name: 'IslandTerrain', offset: [0, -6, 0], explodedScale: 0.2, timing: [0.25, 0.85] },
    { name: 'BlueFlowerGarden_Complete', offset: [0, -4, 0], explodedScale: 0.2, timing: [0.2, 0.8] },

    // --- Character & Forest Effects (Gentle fade, atomic) ---
    { name: 'ForestHeiterContainer', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'forest-effects', offset: [0, 8, 0], explodedScale: 0, timing: [0.0, 0.5] },

    // --- Floating Story Pages & Delicate Forest Lights ---
    { name: 'FloatingStoryPage_0', offset: [2, 5, 1], explodedScale: 0, timing: [0.05, 0.5] },
    { name: 'FloatingStoryPage_1', offset: [-2, 5.5, 1], explodedScale: 0, timing: [0.07, 0.52] },
    { name: 'FloatingStoryPage_2', offset: [0, 6, 2], explodedScale: 0, timing: [0.09, 0.54] },
    { name: 'detail-crystal-light', offset: [2.5, 3, 6], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'detail-runestone', offset: [-2.5, 3, 6], explodedScale: 0, timing: [0.12, 0.57] },
    { name: 'detail-lantern-1', offset: [-3, 3.5, 7], explodedScale: 0, timing: [0.14, 0.6] },
    { name: 'detail-lantern-2', offset: [3, 3.5, 7], explodedScale: 0, timing: [0.16, 0.62] },

    // --- Water Elements (Ripples & Waterfall Flow Ribbons) ---
    { name: 'PondRipple_0', offset: [-2, 1, 2], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'PondRipple_1', offset: [-2.5, 1.2, 2.5], explodedScale: 0, timing: [0.12, 0.57] },
    { name: 'PondRipple_2', offset: [-1.8, 1.4, 2.8], explodedScale: 0, timing: [0.14, 0.6] },
    { name: 'PondRipple_3', offset: [-2.2, 1.6, 3.2], explodedScale: 0, timing: [0.16, 0.62] },

    { name: 'WaterFlowRibbon_0', offset: [0, -3, 4], explodedScale: 0, timing: [0.18, 0.64] },
    { name: 'WaterFlowRibbon_1', offset: [0.5, -3.5, 4.5], explodedScale: 0, timing: [0.2, 0.66] },
    { name: 'WaterFlowRibbon_2', offset: [-0.5, -4, 5], explodedScale: 0, timing: [0.22, 0.68] },
    { name: 'WaterFlowRibbon_3', offset: [0.3, -4.5, 5.2], explodedScale: 0, timing: [0.24, 0.7] },
    { name: 'WaterFlowRibbon_4', offset: [-0.3, -5, 5.5], explodedScale: 0, timing: [0.26, 0.72] },
    { name: 'WaterFlowRibbon_5', offset: [0.2, -5.5, 5.8], explodedScale: 0, timing: [0.28, 0.74] },
    { name: 'WaterFlowRibbon_6', offset: [-0.2, -6, 6], explodedScale: 0, timing: [0.3, 0.76] },

    // --- Landmarks & Interactive Props ---
    { name: 'ForestBiographyInteractionRoot', offset: [1.35, 4, 0.5], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'BiographyBook', offset: [1.35, 4.5, 0.5], explodedScale: 0, timing: [0.12, 0.57] },
    { name: 'ForestStoryPlatform', offset: [1.35, 3.5, 0.5], explodedScale: 0.1, timing: [0.2, 0.7] },
    { name: 'about-interaction-assets', offset: [1.35, 4, 0.5], explodedScale: 0, timing: [0.1, 0.55] },
    { name: 'forest-decorations', offset: [-4, 3, -3], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'forest-vegetation', offset: [5, 4, 3], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'heiter-resting-area', offset: [-5, 4, 1], explodedScale: 0.1, timing: [0.25, 0.75] },
    { name: 'enchanted-pond', offset: [-3, -4, 3], explodedScale: 0, timing: [0.25, 0.75] },
    { name: 'forest-waterfall', offset: [0, -6, 5], explodedScale: 0, timing: [0.3, 0.8] },

    // --- Connector Stepping Stones & Bridges ---
    { name: 'stepping-stone-1', offset: [-2, -2, 2], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'stepping-stone-2', offset: [-1.4, -2, 1.6], explodedScale: 0, timing: [0.22, 0.72] },
    { name: 'stepping-stone-3', offset: [-0.8, -2, 1.2], explodedScale: 0, timing: [0.24, 0.74] },
    { name: 'bridge-stone', offset: [-5, 3, 4], rotation: [0, 0.1, 0], explodedScale: 0.1, timing: [0.25, 0.75] },
    { name: 'bridge-wooden', offset: [4, 3, -2], rotation: [0, -0.1, 0], explodedScale: 0.1, timing: [0.27, 0.77] },
    { name: 'bridge-curved', offset: [-6, 3, -2], rotation: [0, 0.15, 0], explodedScale: 0.1, timing: [0.29, 0.79] },
    { name: 'walkway-narrow', offset: [-6, 2, -2], explodedScale: 0.1, timing: [0.3, 0.8] },

    // --- Pillars, Arches & Railings ---
    { name: 'detail-pillar-1', offset: [-3, 4, 6], explodedScale: 0.1, timing: [0.28, 0.78] },
    { name: 'detail-pillar-2', offset: [3, 4, 6], explodedScale: 0.1, timing: [0.28, 0.78] },
    { name: 'detail-arch', offset: [0.8, 6, 6.8], explodedScale: 0.1, timing: [0.32, 0.82] },
    { name: 'detail-railing', offset: [6, 7, -3], explodedScale: 0.1, timing: [0.34, 0.84] },

    // --- Stairways & Platforms ---
    { name: 'stairs-small', offset: [-6, 2, 0], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'stairs-straight', offset: [5, 3, -3], explodedScale: 0.1, timing: [0.32, 0.82] },
    { name: 'stairs-curved', offset: [-3, 3, -5], explodedScale: 0.1, timing: [0.34, 0.84] },
    { name: 'stairs-ceremonial', offset: [6, 4, 1], explodedScale: 0.1, timing: [0.36, 0.86] },
    { name: 'stairs-spiral', offset: [7, 6, -5], explodedScale: 0.1, timing: [0.38, 0.88] },
    { name: 'platform-decorative', offset: [0.8, -3, 8], explodedScale: 0.1, timing: [0.4, 0.88] },
    { name: 'platform-small', offset: [5, -2, 4], explodedScale: 0.1, timing: [0.42, 0.9] },
    { name: 'platform-medium', offset: [-8, -3, 2], explodedScale: 0.1, timing: [0.44, 0.92] },
    { name: 'platform-large', offset: [7, 8, -5], explodedScale: 0.1, timing: [0.46, 0.94] },

    // --- Ancient Tree & Forest Connectors Root ---
    { name: 'ancient-tree', offset: [0, 10, -2], rotation: [0.08, 0, 0.05], explodedScale: 0.1, timing: [0.4, 0.9] },
    { name: 'ForestConnectorsRoot', offset: [0, -4, 0], explodedScale: 0.2, timing: [0.45, 0.92] },

    // --- 8 Satellite Floating Stones ---
    { name: 'ForestFloatingStone_0', offset: [7, 2, -6], explodedScale: 0, timing: [0.48, 0.92] },
    { name: 'ForestFloatingStone_1', offset: [-7, 3, -5], explodedScale: 0, timing: [0.5, 0.94] },
    { name: 'ForestFloatingStone_2', offset: [8, -2, 4], explodedScale: 0, timing: [0.52, 0.95] },
    { name: 'ForestFloatingStone_3', offset: [-8, -1, 5], explodedScale: 0, timing: [0.54, 0.96] },
    { name: 'ForestFloatingStone_4', offset: [0, -5, 9], explodedScale: 0, timing: [0.56, 0.97] },
    { name: 'ForestFloatingStone_5', offset: [6, 4, 0], explodedScale: 0, timing: [0.58, 0.98] },
    { name: 'ForestFloatingStone_6', offset: [-6, 4, -1], explodedScale: 0, timing: [0.6, 0.99] },
    { name: 'ForestFloatingStone_7', offset: [4, -4, -6], explodedScale: 0, timing: [0.62, 1.0] },

    // --- Island Base Terrain ---
    { name: 'ForestTerrain', offset: [0, -12, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
    { name: 'whispering-forest-island', offset: [0, -12, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
  ],
};

/**
 * Rune Creation Workshop (Level 04 — Projects) Disassembly/Reassembly Configuration
 * 100% component coverage: 45 components covering all 20 GLBs, 5 stations, 5 artifacts, 3 ring pivots, 6 satellite rocks, and character
 */
export const WORKSHOP_EXPLODED_PROFILE: IslandExplodedProfile = {
  islandId: 'WORKSHOP',
  displayName: 'Rune Creation Workshop',
  disassemblyDuration: 1.8,
  reassemblyDuration: 2.2,
  components: [
    // --- Character & Motes ---
    { name: 'EisenContainer', offset: [0, 2.5, 0], explodedScale: 0, timing: [0.0, 0.45] },
    { name: 'workshop-motes', offset: [0, 8, 0], explodedScale: 0, timing: [0.0, 0.5] },
    { name: 'WorkshopMotes', offset: [0, 8, 0], explodedScale: 0, timing: [0.0, 0.5] },

    // --- Floating Ring Pivots & Arcane Rings ---
    { name: 'RingPivot_0', offset: [0.55, 6, -0.5], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'RingPivot_1', offset: [0.55, 7, -0.5], explodedScale: 0, timing: [0.22, 0.72] },
    { name: 'RingPivot_2', offset: [0.55, 8, -0.5], explodedScale: 0, timing: [0.24, 0.74] },
    { name: 'arcane-rings', offset: [0.55, 6, -0.5], explodedScale: 0, timing: [0.25, 0.75] },
    { name: 'rune-symbol', offset: [0, 8, -3.5], explodedScale: 0, timing: [0.3, 0.8] },
    { name: 'FloatingRune', offset: [0, 8, -3.5], explodedScale: 0, timing: [0.3, 0.8] },

    // --- 5 Interactive Project Display Stations & Artifacts ---
    { name: 'Artifact_01', offset: [-6.4, 4.5, 1.55], explodedScale: 0, timing: [0.06, 0.52] },
    { name: 'station-01', offset: [-6.4, 3.5, 1.55], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.08, 0.55] },
    { name: 'Artifact_02', offset: [-3.6, 4.5, 4.1], explodedScale: 0, timing: [0.08, 0.55] },
    { name: 'station-02', offset: [-3.6, 3.5, 4.1], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.1, 0.58] },
    { name: 'Artifact_03', offset: [0, 4.5, 5.15], explodedScale: 0, timing: [0.1, 0.58] },
    { name: 'station-03', offset: [0, 3.5, 5.15], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.12, 0.6] },
    { name: 'Artifact_04', offset: [3.6, 4.5, 4.1], explodedScale: 0, timing: [0.12, 0.6] },
    { name: 'station-04', offset: [3.6, 3.5, 4.1], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.14, 0.62] },
    { name: 'Artifact_05', offset: [6.4, 4.5, 1.55], explodedScale: 0, timing: [0.14, 0.62] },
    { name: 'station-05', offset: [6.4, 3.5, 1.55], rotation: [0.1, 0, 0], explodedScale: 0, timing: [0.16, 0.65] },

    // --- Enchanted Lamps & Crystals ---
    { name: 'enchanted-lamp', offset: [-7, 4, 3.7], explodedScale: 0, timing: [0.18, 0.68] },
    { name: 'enchanted-lamp-2', offset: [7, 4, 3.7], explodedScale: 0, timing: [0.18, 0.68] },
    { name: 'crystal-cluster', offset: [-6.9, 3, -1.8], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'crystal-cluster-2', offset: [6.9, 3, -2.1], explodedScale: 0, timing: [0.2, 0.7] },

    // --- Workshop Furnishings & Arcane Objects ---
    { name: 'crafting-tools', offset: [3.45, 3.0, -2.9], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'CraftingEquipment', offset: [3.45, 3.0, -2.9], explodedScale: 0, timing: [0.15, 0.65] },
    { name: 'enchanted-scroll', offset: [-3.2, 4.0, -2.9], explodedScale: 0, timing: [0.18, 0.68] },
    { name: 'floating-tome', offset: [3.55, 4.0, -2.8], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'decorative-artifacts', offset: [-4.5, 3.0, -2.9], explodedScale: 0, timing: [0.2, 0.7] },
    { name: 'rune-crafting-table', offset: [0.55, 4.0, -0.5], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'CentralCraftingTable', offset: [0.55, 4.0, -0.5], explodedScale: 0.1, timing: [0.3, 0.8] },
    { name: 'shelves-and-benches', offset: [0, 5.0, -2.5], explodedScale: 0.1, timing: [0.35, 0.85] },
    { name: 'WorkshopFurnishings', offset: [0, 5.0, -2.5], explodedScale: 0.1, timing: [0.35, 0.85] },

    // --- Architecture Pavilion ---
    { name: 'rune-workshop', offset: [0, 9.0, -2.0], rotation: [0.06, 0, 0], explodedScale: 0.1, timing: [0.4, 0.9] },
    { name: 'RuneWorkshopPavilion', offset: [0, 9.0, -2.0], rotation: [0.06, 0, 0], explodedScale: 0.1, timing: [0.4, 0.9] },

    // --- Floor Circle & Landscaping ---
    { name: 'rune-floor-circle', offset: [0.55, -2.5, -0.5], explodedScale: 0.1, timing: [0.45, 0.9] },
    { name: 'CraftingFloorCircle', offset: [0.55, -2.5, -0.5], explodedScale: 0.1, timing: [0.45, 0.9] },
    { name: 'island-landscaping', offset: [0, -4.0, 0], explodedScale: 0.2, timing: [0.5, 0.95] },
    { name: 'WorkshopLandscaping', offset: [0, -4.0, 0], explodedScale: 0.2, timing: [0.5, 0.95] },

    // --- 6 Satellite Rocks ---
    { name: 'SatelliteRock_0', offset: [6, 2, -5], explodedScale: 0, timing: [0.48, 0.92] },
    { name: 'SatelliteRock_1', offset: [-6, 3, -4], explodedScale: 0, timing: [0.5, 0.94] },
    { name: 'SatelliteRock_2', offset: [7, -2, 4], explodedScale: 0, timing: [0.52, 0.95] },
    { name: 'SatelliteRock_3', offset: [-7, -1, 4], explodedScale: 0, timing: [0.54, 0.96] },
    { name: 'SatelliteRock_4', offset: [0, -4, 8], explodedScale: 0, timing: [0.56, 0.97] },
    { name: 'SatelliteRock_5', offset: [5, 4, 0], explodedScale: 0, timing: [0.58, 0.98] },

    // --- Island Base ---
    { name: 'workshop-island', offset: [0, -12.0, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
    { name: 'WorkshopIsland', offset: [0, -12.0, 0], explodedScale: 0.1, timing: [0.6, 1.0] },
  ],
};

export function getIslandExplodedProfile(islandId: DestinationId): IslandExplodedProfile {
  switch (islandId) {
    case 'HOME':
      return HERO_HOME_EXPLODED_PROFILE;
    case 'ARCHIVE':
      return ARCHIVE_EXPLODED_PROFILE;
    case 'FOREST':
      return FOREST_EXPLODED_PROFILE;
    case 'WORKSHOP':
      return WORKSHOP_EXPLODED_PROFILE;
  }
}

export interface OriginalTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  config?: ExplodedComponentConfig;
}

/**
 * Snapshots the exact original local transform of all registered components.
 * Also scans for any meshes without an explicit configuration and attaches
 * a procedural radial explosion trajectory, mathematically guaranteeing
 * 100% component participation across all four islands.
 */
export function snapshotOriginalTransforms(
  root: THREE.Object3D,
  profile: IslandExplodedProfile,
  existingMap?: Map<string, OriginalTransform>
): Map<string, OriginalTransform> {
  const map = existingMap || new Map<string, OriginalTransform>();

  // 1. Snapshot all explicitly configured components
  profile.components.forEach((comp) => {
    if (!map.has(comp.name)) {
      const obj = root.getObjectByName(comp.name);
      if (obj) {
        map.set(comp.name, {
          position: obj.position.clone(),
          rotation: obj.rotation.clone(),
          scale: obj.scale.clone(),
          config: comp,
        });
      }
    }
  });

  // 2. Recursive Scan: Identify any unmanaged meshes or groups with meshes
  // that have no configured ancestor, and dynamically assign radial trajectories
  root.traverse((node) => {
    if (!node.name || map.has(node.name)) return;

    // Check if any ancestor is already configured and animating
    let hasConfiguredAncestor = false;
    let curr = node.parent;
    while (curr && curr !== root) {
      if (curr.name && map.has(curr.name)) {
        hasConfiguredAncestor = true;
        break;
      }
      curr = curr.parent;
    }

    // Only assign procedural trajectory if neither the node nor its ancestors are animating
    if (!hasConfiguredAncestor && ((node as THREE.Mesh).isMesh || (node as THREE.SkinnedMesh).isSkinnedMesh)) {
      const pos = node.position;
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z) || 1.0;
      const normX = pos.x / dist;
      const normZ = pos.z / dist;

      // Staggered timing based on vertical level
      const y = pos.y;
      const timing: [number, number] =
        y > 2.0
          ? [0.1, 0.6]
          : y >= 0.5
          ? [0.25, 0.75]
          : [0.5, 0.95];

      const proceduralConfig: ExplodedComponentConfig = {
        name: node.name,
        offset: [normX * 5.0, y > 0 ? y + 4.0 : y - 6.0, normZ * 5.0],
        rotation: [0.1, normX * 0.2, 0],
        explodedScale: 0.0,
        timing,
      };

      map.set(node.name, {
        position: node.position.clone(),
        rotation: node.rotation.clone(),
        scale: node.scale.clone(),
        config: proceduralConfig,
      });
    }
  });

  return map;
}

/**
 * Restores all registered components to their exact original transforms (0.00000 error)
 */
export function restoreOriginalTransforms(
  root: THREE.Object3D,
  originals: Map<string, OriginalTransform>
) {
  originals.forEach((orig, name) => {
    const obj = root.getObjectByName(name);
    if (obj) {
      obj.position.copy(orig.position);
      obj.rotation.copy(orig.rotation);
      obj.scale.copy(orig.scale);
      obj.visible = true;
    }
  });
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Applies exploded interpolation to an object based on progress (0.0 = assembled, 1.0 = exploded)
 */
export function applyExplodedTransform(
  obj: THREE.Object3D,
  orig: OriginalTransform,
  config: ExplodedComponentConfig,
  progress: number
) {
  // Staggered timing clamp
  const [tStart, tEnd] = config.timing;
  const rawT = THREE.MathUtils.clamp((progress - tStart) / (tEnd - tStart), 0, 1);
  const factor = easeInOutCubic(rawT);

  // Position
  obj.position.set(
    orig.position.x + config.offset[0] * factor,
    orig.position.y + config.offset[1] * factor,
    orig.position.z + config.offset[2] * factor
  );

  // Rotation
  if (config.rotation) {
    obj.rotation.set(
      orig.rotation.x + config.rotation[0] * factor,
      orig.rotation.y + config.rotation[1] * factor,
      orig.rotation.z + config.rotation[2] * factor
    );
  }

  // Scale
  const targetScale = config.explodedScale !== undefined ? config.explodedScale : 0.0;
  const curScale = THREE.MathUtils.lerp(1.0, targetScale, factor);
  obj.scale.set(
    orig.scale.x * curScale,
    orig.scale.y * curScale,
    orig.scale.z * curScale
  );

  obj.visible = curScale > 0.005;
}
