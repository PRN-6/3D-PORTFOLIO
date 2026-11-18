import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface CharacterConfig {
  name: 'Frieren' | 'Himmel' | 'Heiter' | 'Eisen';
  groundPos: [number, number, number];
  facing: number;
}

// Fixed, stationary world positions and forward-facing angles for the 4 companions
const CHARACTERS: CharacterConfig[] = [
  {
    name: 'Eisen',
    groundPos: [-2.8, -1.7, 6.2],
    facing: 0.12, // Gently angled toward center
  },
  {
    name: 'Frieren',
    groundPos: [-0.9, -1.7, 6.0],
    facing: 0.04,
  },
  {
    name: 'Himmel',
    groundPos: [0.9, -1.7, 6.0],
    facing: -0.04,
  },
  {
    name: 'Heiter',
    groundPos: [2.8, -1.7, 6.2],
    facing: -0.12, // Gently angled toward center
  },
];

interface ActorRuntime {
  name: string;
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  palette: ReturnType<typeof createPartyPalette>;
  paint?: ReturnType<ReturnType<typeof createPartyPalette>['dress']>;
}

export const ShowcaseCharacters: React.FC = () => {
  const { size } = useThree();
  const isMobile = size.width < 768;
  // Scaled down to ~35% (0.51 desktop, 0.44 mobile)
  const characterScale = isMobile ? 0.44 : 0.51;

  const rootGroupRef = useRef<THREE.Group>(null);
  const actorsRef = useRef<ActorRuntime[]>([]);

  // Load character models
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const himmelGltf = useGLTF('/models/transition/himmel.glb');
  const heiterGltf = useGLTF('/models/transition/heiter.glb');
  const eisenGltf = useGLTF('/models/transition/eisen.glb');

  const gltfMap = useMemo(
    () => ({
      Frieren: frierenGltf,
      Himmel: himmelGltf,
      Heiter: heiterGltf,
      Eisen: eisenGltf,
    }),
    [frierenGltf, himmelGltf, heiterGltf, eisenGltf]
  );

  // Initialize all 4 Characters in their stationary grounded positions with idle animations
  useEffect(() => {
    if (!rootGroupRef.current) return;
    const group = rootGroupRef.current;
    const actors: ActorRuntime[] = [];

    for (const config of CHARACTERS) {
      const gltf = gltfMap[config.name];
      const clone = cloneSkeleton(gltf.scene);
      const root = clone.getObjectByName(config.name) || clone;

      const palette = createPartyPalette();
      const paint = palette.dress(root);

      clone.scale.set(characterScale, characterScale, characterScale);
      clone.position.set(...config.groundPos);
      clone.rotation.set(0, config.facing, 0);
      clone.visible = true;

      // Enable casting soft contact shadows onto the small land platform
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });

      group.add(clone);

      const mixer = new THREE.AnimationMixer(clone);
      const idleClip = gltf.animations.find((c) =>
        c.name.toLowerCase().endsWith('_idle')
      );
      if (idleClip) {
        const action = mixer.clipAction(idleClip);
        action.play();
      }

      actors.push({
        name: config.name,
        root: clone,
        mixer,
        palette,
        paint,
      });
    }

    actorsRef.current = actors;

    return () => {
      for (const actor of actors) {
        actor.root.removeFromParent();
        actor.paint?.dispose();
        actor.palette.dispose();
      }
      actorsRef.current = [];
    };
  }, [gltfMap, characterScale]);

  // Keep characters strictly stationary in world space: only update idle animation mixers
  useFrame((_, delta) => {
    const actors = actorsRef.current;
    if (actors.length === 0) return;

    for (const actor of actors) {
      // Keep scale responsive on window resize without affecting stationary position
      actor.root.scale.set(characterScale, characterScale, characterScale);
      // Advance idle animation (breathing, blinking, head motion)
      actor.mixer.update(delta);
    }
  });

  return <group ref={rootGroupRef} name="StationaryCharactersContainer" />;
};
