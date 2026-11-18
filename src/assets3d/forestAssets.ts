import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../components/Scene/partyMaterials';

export interface ForestManifestFile {
  file: string;
  position: [number, number, number];
}

export const FOREST_ENVIRONMENT_FILES: ForestManifestFile[] = [
  { file: 'whispering-forest-island.glb', position: [0, 0, 0] },
  { file: 'ancient-tree.glb', position: [0.7, 0.6453902581431961, -2.6] },
  { file: 'forest-vegetation.glb', position: [0, 0, 0] },
  { file: 'enchanted-pond.glb', position: [0, 0, 0] },
  { file: 'forest-waterfall.glb', position: [0, 0, 0] },
  { file: 'heiter-resting-area.glb', position: [-5.5, 0.2638593447222541, 1.0] },
  { file: 'about-interaction-assets.glb', position: [1.35, 0.43485320829303487, 0.5] },
  { file: 'forest-decorations.glb', position: [0, 0, 0] },
  { file: 'forest-effects.glb', position: [0, 0, 0] },
];

export const FOREST_CONNECTOR_FILES = [
  'stairs-straight.glb',
  'stairs-ceremonial.glb',
  'stairs-small.glb',
  'stairs-curved.glb',
  'stairs-spiral.glb',
  'bridge-wooden.glb',
  'bridge-stone.glb',
  'bridge-curved.glb',
  'walkway-narrow.glb',
  'platform-small.glb',
  'platform-medium.glb',
  'platform-large.glb',
  'stepping-stone.glb',
  'platform-decorative.glb',
  'detail-arch.glb',
  'detail-pillar.glb',
  'detail-railing.glb',
  'detail-lantern.glb',
  'detail-crystal-light.glb',
  'detail-runestone.glb',
] as const;

export const HEITER_CONFIG = {
  modelPath: '/models/transition/heiter.glb',
  clipName: 'heiter_idle',
  restingAreaOffset: [-5.5, 0.2638593447222541, 1.0] as const,
  anchorLocalOffset: [-0.08, 0, 0.70] as const,
  // Combined anchor position in forest local coordinates
  position: [-5.58, 0.2638593447222541, 1.70] as [number, number, number],
  rotationY: 1.0,
  scale: 1.0,
};

export const BIOGRAPHY_CONFIG = {
  targetNodeName: 'BiographyBook',
  contentId: 'about-me',
  platformOffset: [1.35, 0.43485320829303487, 0.5] as const,
  bookLocalOffset: [0, 1.12, 0] as const,
  // Combined anchor position in forest local coordinates
  position: [1.35, 1.554853208293035, 0.5] as [number, number, number],
};

/**
 * Procedural loader for Level 03 — Whispering Forest
 * Loads 9 core environment modules, connects Heiter at HeiterIdleAnchor,
 * applies toon cel shading and silhouette outline via createPartyPalette().
 */
export async function loadForestAssets(loader: GLTFLoader) {
  const base = '/models/whispering-forest/';
  const group = new THREE.Group();
  group.name = 'WhisperingForestLevel03';

  const mixers: THREE.AnimationMixer[] = [];
  const loadedModules = new Map<string, THREE.Group>();

  // 1. Load 9 Environment Modules in parallel
  await Promise.all(
    FOREST_ENVIRONMENT_FILES.map(async ({ file, position }) => {
      const gltf = await loader.loadAsync(base + file);
      const scene = gltf.scene.clone(true);
      scene.name = file.replace('.glb', '');
      scene.position.fromArray(position);
      group.add(scene);
      loadedModules.set(file, scene);

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(scene);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        mixers.push(mixer);
      }
    })
  );

  // 2. Load and dress Heiter at HeiterIdleAnchor
  const heiterGltf = await loader.loadAsync(HEITER_CONFIG.modelPath);
  const character = clone(heiterGltf.scene);
  const root = character.getObjectByName('Heiter')!;

  const restingScene = loadedModules.get('heiter-resting-area.glb');
  const anchor = restingScene?.getObjectByName('HeiterIdleAnchor');
  if (anchor) {
    anchor.getWorldPosition(root.position);
    group.worldToLocal(root.position);
  } else {
    root.position.fromArray(HEITER_CONFIG.position);
  }
  root.rotation.y = HEITER_CONFIG.rotationY;
  group.add(character);

  const palette = createPartyPalette();
  const paint = palette.dress(root);
  const actorMixer = new THREE.AnimationMixer(root);
  const idleClip = heiterGltf.animations.find((clip) => clip.name === HEITER_CONFIG.clipName);
  if (idleClip) {
    actorMixer.clipAction(idleClip).play();
    mixers.push(actorMixer);
  }

  let disposed = false;
  return {
    group,
    mixers,
    heiterRoot: root,
    dispose() {
      if (disposed) return;
      disposed = true;
      mixers.forEach((m) => {
        m.stopAllAction();
        m.uncacheRoot(m.getRoot());
      });
      paint?.dispose();
      palette.dispose();
      group.removeFromParent();
    },
  };
}

