import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface CharacterConfig {
  name: 'Frieren' | 'Himmel' | 'Heiter' | 'Eisen';
  groundPos: [number, number, number];
  patrolBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

const CHARACTERS: CharacterConfig[] = [
  {
    name: 'Frieren',
    groundPos: [-0.9, -1.7, 6.0],
    patrolBounds: { minX: -1.7, maxX: -0.2, minZ: 5.8, maxZ: 6.4 },
  },
  {
    name: 'Himmel',
    groundPos: [0.9, -1.7, 6.0],
    patrolBounds: { minX: 0.2, maxX: 1.7, minZ: 5.8, maxZ: 6.4 },
  },
  {
    name: 'Heiter',
    groundPos: [2.8, -1.7, 6.2],
    patrolBounds: { minX: 1.9, maxX: 3.8, minZ: 6.0, maxZ: 6.6 },
  },
  {
    name: 'Eisen',
    groundPos: [-2.8, -1.7, 6.2],
    patrolBounds: { minX: -3.8, maxX: -1.9, minZ: 6.0, maxZ: 6.6 },
  },
];

interface ActorRuntime {
  name: string;
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  palette: ReturnType<typeof createPartyPalette>;
  paint?: ReturnType<ReturnType<typeof createPartyPalette>['dress']>;
  config: CharacterConfig;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  facing: number;
  targetFacing: number;
  isWalking: boolean;
  nextRoamTime: number;
}

export const ShowcaseCharacters: React.FC = () => {
  const { size } = useThree();
  const isMobile = size.width < 768;
  // Scaled down to ~35% of previous 1.45 (1.45 * 0.35 = 0.5075)
  // Responsive: 0.51 on desktop (~10-11% viewport height), 0.44 on mobile
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

  // Initialize all 4 Characters in their grounded positions with idle animations
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
      const initialPos = new THREE.Vector3(...config.groundPos);
      clone.position.copy(initialPos);
      clone.visible = true;

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
        config,
        currentPos: initialPos.clone(),
        targetPos: initialPos.clone(),
        facing: 0,
        targetFacing: (Math.random() - 0.5) * 0.3,
        isWalking: false,
        nextRoamTime: 4.0 + Math.random() * 6.0,
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

  // Autonomous natural roaming & idle breathing
  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const actors = actorsRef.current;
    if (actors.length === 0) return;

    for (const actor of actors) {
      // Maintain responsive scale across window resizing
      actor.root.scale.set(characterScale, characterScale, characterScale);

      const bounds = actor.config.patrolBounds;

      // Roaming destination pick
      if (elapsed > actor.nextRoamTime && !actor.isWalking) {
        const targetX = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random());
        const targetZ = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random());

        actor.targetPos.set(targetX, actor.config.groundPos[1], targetZ);

        const dx = targetX - actor.currentPos.x;
        const dz = targetZ - actor.currentPos.z;
        actor.targetFacing = Math.atan2(dx, dz);
        actor.isWalking = true;
      }

      // Smooth strolling movement
      if (actor.isWalking) {
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 4.0, delta);
        actor.root.rotation.set(0, actor.facing, 0);

        const walkStep = 0.38 * delta;
        actor.currentPos.lerp(actor.targetPos, THREE.MathUtils.clamp(walkStep, 0, 0.15));
        actor.root.position.copy(actor.currentPos);

        if (actor.currentPos.distanceTo(actor.targetPos) < 0.1) {
          actor.isWalking = false;
          // Next gentle stroll in 8 to 16 seconds
          actor.nextRoamTime = elapsed + 8.0 + Math.random() * 8.0;
          // Naturally face forward toward the floating project cubes
          actor.targetFacing = (Math.random() - 0.5) * 0.35;
        }
      } else {
        // Idle gentle orientation toward project cubes
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 2.5, delta);
        actor.root.rotation.set(0, actor.facing, 0);
      }

      actor.mixer.update(delta);
    }
  });

  return <group ref={rootGroupRef} name="ShowcaseCharactersContainer" />;
};
