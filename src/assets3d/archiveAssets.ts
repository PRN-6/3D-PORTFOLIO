import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../components/Scene/partyMaterials';

export async function loadArchiveAssets(loader: GLTFLoader) {
  const files = ['archive-island', 'archive-library', 'archive-decorations', 'archive-grimoires', 'archive-floating-books'];
  const [modules, frieren, home, magic] = await Promise.all([
    Promise.all(files.map(file => loader.loadAsync('/models/archive/' + file + '.glb'))),
    loader.loadAsync('/models/transition/frieren.glb'),
    loader.loadAsync('/models/home-island.glb'),
    loader.loadAsync('/models/transition/frieren-magic.glb'),
  ]);
  const group = new THREE.Group();
  group.name = 'GrandMagesArchive';
  const mixers: THREE.AnimationMixer[] = [];
  for (const asset of modules) {
    const scene = asset.scene.clone(true);
    group.add(scene);
    const mixer = new THREE.AnimationMixer(scene);
    asset.animations.forEach(clip => mixer.clipAction(clip).play());
    mixers.push(mixer);
  }
  const character = clone(frieren.scene);
  const root = character.getObjectByName('Frieren')!;
  // Existing home clips omit bindings equal to their original rest pose.
  // Restore that pose before applying Read to the standalone, identical rig.
  root.traverse(node => {
    const original = home.scene.getObjectByName(node.name);
    if (original && (node as THREE.Bone).isBone) {
      node.position.copy(original.position);
      node.quaternion.copy(original.quaternion);
      node.scale.copy(original.scale);
    }
  });
  const anchor = group.getObjectByName('FrierenReadAnchor')!;
  root.position.copy(anchor.position);
  root.quaternion.identity();
  group.add(character);
  const palette = createPartyPalette();
  const paint = palette.dress(root);
  const reader = new THREE.AnimationMixer(root);
  const read = home.animations.find(clip => clip.name === 'Frieren_Read');
  if (!read) throw new Error('The source home asset is missing Frieren_Read.');
  reader.clipAction(read).play();
  mixers.push(reader);
  const seal = magic.scene.clone(true);
  seal.name = 'ReusedReadingMagic';
  seal.position.copy(anchor.position).add(new THREE.Vector3(0, .035, .05));
  seal.scale.setScalar(.42);
  group.add(seal);
  group.traverse(object => {
    if ((object as THREE.Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  let elapsed = 0;
  let disposed = false;
  return {
    group,
    update(delta: number) {
      if (disposed || !Number.isFinite(delta)) return;
      const step = Math.max(0, delta);
      elapsed += step;
      mixers.forEach(mixer => mixer.update(step));
      const eye = root.getObjectByName('FrierenEyeL');
      paint?.setExpression((eye?.scale.y ?? 1) < .53 ? 'blink' : 'neutral');
      seal.rotation.y = elapsed * .06;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixers.forEach(mixer => {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      });
      paint?.dispose();
      palette.dispose();
      root.traverse(object => {
        if ((object as THREE.SkinnedMesh).isSkinnedMesh) (object as THREE.SkinnedMesh).skeleton.dispose();
      });
      group.removeFromParent();
    },
  };
}

