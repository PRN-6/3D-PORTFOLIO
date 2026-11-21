import * as THREE from 'three';
import {
  HERO_HOME_EXPLODED_PROFILE,
  ARCHIVE_EXPLODED_PROFILE,
  FOREST_EXPLODED_PROFILE,
  WORKSHOP_EXPLODED_PROFILE,
  type IslandExplodedProfile,
  type ExplodedComponentConfig,
} from '../components/Scene/Transitions/explodedConfig';

export type ComponentLayer =
  | 'FOUNDATION'
  | 'ARCHITECTURE'
  | 'PROPS'
  | 'FOLIAGE'
  | 'CHARACTERS'
  | 'EFFECTS';

export interface AnalyzedComponent {
  name: string;
  object: THREE.Object3D;
  layer: ComponentLayer;
  layerOrder: number;
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
  azimuthAngle: number;
  elevation: number;
  timingWindow: [number, number];
  dispersalOffset: THREE.Vector3;
  dispersalRotation: THREE.Euler;
  orbitalTurns: number;
  orbitalDirection: number; // 1 (counter-clockwise) or -1 (clockwise)
  spinAxis: THREE.Vector3;
}

export interface ModelAnalysisResult {
  root: THREE.Object3D;
  components: AnalyzedComponent[];
  componentMap: Map<string, AnalyzedComponent>;
  bounds: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  layerDistribution: Record<ComponentLayer, number>;
}

// Layer classification rules
const LAYER_RULES: Record<ComponentLayer, { keywords: RegExp[]; defaultWindow: [number, number]; order: number }> = {
  FOUNDATION: {
    keywords: [/floatingisland/i, /meadow/i, /waystone/i, /boundary/i, /ground/i, /terrain/i, /base/i, /rock/i, /pedestal/i],
    defaultWindow: [0.0, 0.42],
    order: 0,
  },
  ARCHITECTURE: {
    keywords: [/timber/i, /frame/i, /gables/i, /chimney/i, /porch/i, /door/i, /roof/i, /wall/i, /stair/i, /library/i, /pillar/i, /arch/i, /workshop/i, /forge/i],
    defaultWindow: [0.15, 0.62],
    order: 1,
  },
  PROPS: {
    keywords: [/woodpile/i, /stool/i, /crop/i, /scarecrow/i, /supplies/i, /watering/i, /practice/i, /dummy/i, /target/i, /rack/i, /sword/i, /hearthside/i, /seat/i, /campfire/i, /lantern/i, /sign/i, /desk/i, /furniture/i, /grimoire/i, /book/i, /table/i, /bench/i, /anvil/i, /crystal/i],
    defaultWindow: [0.30, 0.78],
    order: 2,
  },
  FOLIAGE: {
    keywords: [/wildflower/i, /tree/i, /fir/i, /ivy/i, /root/i, /flower/i, /bush/i, /grass/i, /plant/i, /leaf/i, /vine/i, /petal/i],
    defaultWindow: [0.45, 0.86],
    order: 3,
  },
  CHARACTERS: {
    keywords: [/frieren/i, /himmel/i, /heiter/i, /eisen/i, /character/i, /costume/i, /party/i, /hero/i, /mage/i, /warrior/i, /priest/i],
    defaultWindow: [0.60, 0.94],
    order: 4,
  },
  EFFECTS: {
    keywords: [/wisp/i, /flame/i, /smoke/i, /fire/i, /mote/i, /spark/i, /particle/i, /glow/i, /magic/i, /rune/i],
    defaultWindow: [0.70, 1.00],
    order: 5,
  },
};

function classifyLayer(name: string, elevation: number): { layer: ComponentLayer; order: number; defaultWindow: [number, number] } {
  for (const [key, def] of Object.entries(LAYER_RULES)) {
    const layer = key as ComponentLayer;
    for (const regex of def.keywords) {
      if (regex.test(name)) {
        return { layer, order: def.order, defaultWindow: def.defaultWindow };
      }
    }
  }

  // Fallback by vertical elevation if name matches no pattern
  if (elevation < -1.5) {
    return { layer: 'FOUNDATION', order: 0, defaultWindow: LAYER_RULES.FOUNDATION.defaultWindow };
  } else if (elevation > 4.0) {
    return { layer: 'EFFECTS', order: 5, defaultWindow: LAYER_RULES.EFFECTS.defaultWindow };
  } else if (elevation > 2.0) {
    return { layer: 'ARCHITECTURE', order: 1, defaultWindow: LAYER_RULES.ARCHITECTURE.defaultWindow };
  }
  return { layer: 'PROPS', order: 2, defaultWindow: LAYER_RULES.PROPS.defaultWindow };
}

/**
 * Inspects a 3D model hierarchy, classifies components into structural animation layers,
 * and precalculates spatial kinematics (centroids, bounding dimensions, radial offsets,
 * orbital directions, and trajectory windows).
 */
export class ModelAnalyzer {
  public static analyze(
    root: THREE.Object3D,
    islandProfileName?: 'HOME' | 'ARCHIVE' | 'FOREST' | 'WORKSHOP' | string
  ): ModelAnalysisResult {
    root.updateMatrixWorld(true);

    const overallBox = new THREE.Box3().setFromObject(root);
    const overallCenter = new THREE.Vector3();
    const overallSize = new THREE.Vector3();
    overallBox.getCenter(overallCenter);
    overallBox.getSize(overallSize);

    // Resolve profile if matching island
    let profile: IslandExplodedProfile | undefined;
    if (islandProfileName === 'HOME' || root.name.includes('Hero') || root.getObjectByName('FloatingIsland')) {
      profile = HERO_HOME_EXPLODED_PROFILE;
    } else if (islandProfileName === 'ARCHIVE' || root.name.includes('Archive') || root.getObjectByName('GrandLibrary')) {
      profile = ARCHIVE_EXPLODED_PROFILE;
    } else if (islandProfileName === 'FOREST' || root.name.includes('Forest') || root.getObjectByName('BlueFlowerGardenMaster')) {
      profile = FOREST_EXPLODED_PROFILE;
    } else if (islandProfileName === 'WORKSHOP' || root.name.includes('Workshop') || root.getObjectByName('RuneWorkshop')) {
      profile = WORKSHOP_EXPLODED_PROFILE;
    }

    const componentMap = new Map<string, AnalyzedComponent>();
    const components: AnalyzedComponent[] = [];
    const layerDistribution: Record<ComponentLayer, number> = {
      FOUNDATION: 0,
      ARCHITECTURE: 0,
      PROPS: 0,
      FOLIAGE: 0,
      CHARACTERS: 0,
      EFFECTS: 0,
    };

    const targetObjects: Map<string, { obj: THREE.Object3D; config?: ExplodedComponentConfig }> = new Map();

    // 1. If profile is available, collect objects specified in profile
    if (profile) {
      for (const compConfig of profile.components) {
        const obj = root.getObjectByName(compConfig.name);
        if (obj) {
          targetObjects.set(compConfig.name, { obj, config: compConfig });
        }
      }
    }

    // 2. Also traverse to catch any independent mesh or group that isn't child of an already captured object
    root.traverse((node) => {
      if (node === root) return;
      if (!node.name || node.name === 'Scene') return;

      if (!targetObjects.has(node.name)) {
        // Check if an ancestor was already targeted
        let curr = node.parent;
        let hasTargetAncestor = false;
        while (curr && curr !== root) {
          if (curr.name && targetObjects.has(curr.name)) {
            hasTargetAncestor = true;
            break;
          }
          curr = curr.parent;
        }

        if (!hasTargetAncestor && ((node as THREE.Mesh).isMesh || (node as THREE.SkinnedMesh).isSkinnedMesh)) {
          targetObjects.set(node.name, { obj: node });
        }
      }
    });

    // 3. Analyze each candidate
    let index = 0;
    targetObjects.forEach(({ obj, config }, name) => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      // Relative to root center
      const relX = center.x - overallCenter.x;
      const relY = center.y - overallCenter.y;
      const relZ = center.z - overallCenter.z;
      const radius = Math.sqrt(relX * relX + relZ * relZ) || 1.0;
      const azimuthAngle = Math.atan2(relZ, relX);
      const elevation = relY;

      const classification = classifyLayer(name, elevation);
      layerDistribution[classification.layer]++;

      // Timing window: prefer profile config timing if available, otherwise classification timing
      const timingWindow: [number, number] = config ? config.timing : classification.defaultWindow;

      // Dispersal vector:
      // If profile config has offset, use it; otherwise compute procedural radial/spiral offset
      let dispersalOffset: THREE.Vector3;
      if (config?.offset) {
        dispersalOffset = new THREE.Vector3(...config.offset);
      } else {
        const normX = relX / radius;
        const normZ = relZ / radius;
        const liftY = elevation >= 0 ? elevation + 6.0 : elevation - 8.0;
        dispersalOffset = new THREE.Vector3(normX * 8.0, liftY, normZ * 8.0);
      }

      // Dispersal rotation
      const dispersalRotation = new THREE.Euler(
        config?.rotation ? config.rotation[0] : (index % 2 === 0 ? 0.35 : -0.25),
        config?.rotation ? config.rotation[1] : (index * 0.4) % Math.PI,
        config?.rotation ? config.rotation[2] : (index % 3 === 0 ? 0.2 : -0.15)
      );

      // Alternating orbital spin direction for rich visual counter-motion
      const orbitalDirection = index % 2 === 0 ? 1 : -1;
      const orbitalTurns = 1.0 + ((index * 37) % 100) / 100; // between 1.0 and 2.0 turns

      // Dynamic spin axis
      const spinAxis = new THREE.Vector3(
        Math.sin(index * 1.7),
        Math.cos(index * 0.9),
        Math.sin(index * 2.3)
      ).normalize();

      const analyzed: AnalyzedComponent = {
        name,
        object: obj,
        layer: classification.layer,
        layerOrder: classification.order,
        center,
        size,
        radius,
        azimuthAngle,
        elevation,
        timingWindow,
        dispersalOffset,
        dispersalRotation,
        orbitalTurns,
        orbitalDirection,
        spinAxis,
      };

      components.push(analyzed);
      componentMap.set(name, analyzed);
      index++;
    });

    // Sort components by layerOrder so foundation builds first, followed by architecture, props, foliage, characters, and effects
    components.sort((a, b) => {
      if (a.layerOrder !== b.layerOrder) {
        return a.layerOrder - b.layerOrder;
      }
      return a.timingWindow[0] - b.timingWindow[0];
    });

    return {
      root,
      components,
      componentMap,
      bounds: overallBox,
      center: overallCenter,
      size: overallSize,
      layerDistribution,
    };
  }
}

