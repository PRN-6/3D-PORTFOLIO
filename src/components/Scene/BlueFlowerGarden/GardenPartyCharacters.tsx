import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../partyMaterials';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

const bouquetUrl = '/models/blue-flower-garden/flowers/flower-wreath.glb';
const actors = {
  Himmel: { x: -0.48, yaw: 0.28, hand: 'L', beats: ['idle', 'speak', 'listen', 'watch'] },
  Frieren: { x: 0.48, yaw: -0.28, hand: 'R', beats: ['flowers', 'listen', 'speak', 'idle'] },
} as const;

type ActorName = keyof typeof actors;

function GardenActor({ name, moving }: { name: ActorName; moving: boolean }) {
  const gltf = useGLTF('/models/transition/' + name.toLowerCase() + '.glb');
  const bouquet = useGLTF(bouquetUrl);
  const mount = useRef<THREE.Group>(null);
  const advance = useRef<((delta: number) => void) | null>(null);
  const staging = actors[name];

  useEffect(() => {
    const character = clone(gltf.scene);
    const actor = character.getObjectByName(name) ?? character;
    const skeletons = new Set<THREE.Skeleton>();
    character.traverse(node => {
      if (node instanceof THREE.SkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        skeletons.add(node.skeleton);
      }
    });
    const palette = createPartyPalette();
    const paint = palette.dress(actor);
    const eyes = actor.getObjectByName(name + 'EyeL');
    const flowers = bouquet.scene.clone(true);
    flowers.name = 'flower-wreath-' + name.toLowerCase();
    flowers.rotation.x = 0.35;
    flowers.scale.setScalar(name === 'Himmel' ? 0.85 : 0.8);
    actor.getObjectByName(name + 'Hand' + staging.hand)?.add(flowers);

    const mixer = new THREE.AnimationMixer(actor);
    const beats = staging.beats.map(beat => {
      const clip = THREE.AnimationClip.findByName(gltf.animations, name.toLowerCase() + '_' + beat);
      return clip ? mixer.clipAction(clip) : undefined;
    });
    let time = 0;
    let beat = 0;
    beats[0]?.play();
    mixer.update(0);
    mount.current?.add(character);

    advance.current = delta => {
      time = (time + delta) % 24;
      const next = Math.floor(time / 6);
      if (next !== beat) {
        beats[beat]?.fadeOut(0.8);
        beats[next]?.reset().fadeIn(0.8).play();
        beat = next;
      }
      mixer.update(delta);
      const speaking = staging.beats[beat] === 'speak' && Math.sin(time * 12) > 0.1;
      const smiling = staging.beats[beat] === 'listen' && Math.sin(time * 1.6) > 0.5;
      paint?.setExpression((eyes?.scale.y ?? 1) < 0.53 ? 'blink' :
        speaking ? 'speaking' : smiling ? 'smile' : 'neutral');
    };
    return () => {
      advance.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(actor);
      paint?.dispose();
      palette.dispose();
      skeletons.forEach(skeleton => skeleton.dispose());
      character.removeFromParent();
    };
  }, [gltf, bouquet, name, staging]);

  useFrame((_, delta) => {
    if (moving) advance.current?.(Math.min(delta, 0.05));
  });
  return <group name={name + 'Root'} ref={mount} position={[staging.x, 0.42, 0.1]} rotation={[0, staging.yaw, 0]} />;
}

export function GardenPartyCharacters({ moving }: { moving: boolean }) {
  return (
    <ModelErrorBoundary fallback={null}>
      <group name="GardenPartyCharactersRoot">
        <GardenActor name="Himmel" moving={moving} />
        <GardenActor name="Frieren" moving={moving} />
      </group>
    </ModelErrorBoundary>
  );
}

useGLTF.preload('/models/transition/himmel.glb');
useGLTF.preload('/models/transition/frieren.glb');
useGLTF.preload(bouquetUrl);
