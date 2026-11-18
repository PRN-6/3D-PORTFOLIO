import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useAnimations, useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface CharacterIdleProps {
  modelPath: string;
  name: string;
  clipName: string;
  position: [number, number, number];
  rotationY: number;
}

const SingleCharacterIdle: React.FC<CharacterIdleProps> = ({
  modelPath,
  name,
  clipName,
  position,
  rotationY,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(modelPath);

  const { scene: clonedScene, root } = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const foundRoot = clone.getObjectByName(name) || clone;
    return { scene: clone, root: foundRoot };
  }, [gltf.scene, name]);

  const { actions } = useAnimations(gltf.animations, root);

  useEffect(() => {
    const palette = createPartyPalette();
    const dressResult = palette.dress(root);

    // Play idle animation
    const idleAction = actions[clipName] || Object.values(actions)[0];
    if (idleAction) {
      idleAction.reset().fadeIn(0.3).play();
    }

    return () => {
      dressResult?.dispose();
      palette.dispose();
      idleAction?.stop();
    };
  }, [actions, clipName, root]);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};

export const ProjectCharactersGroup: React.FC = () => {
  return (
    <group name="ProjectShowcaseObservationParty">
      {/* Floating Dark Obsidian Observation Platform */}
      <group position={[0, -0.08, 5.9]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.3, 2.0, 0.22, 32]} />
          <meshStandardMaterial
            color="#0b0e17"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        {/* Subtle glowing edge ring */}
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.22, 2.27, 48]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* The 4 Chibi Characters in their Idle Stances */}
      {/* Frieren */}
      <SingleCharacterIdle
        modelPath="/models/transition/frieren.glb"
        name="Frieren"
        clipName="frieren_idle"
        position={[-0.72, 0, 6.45]}
        rotationY={0.12}
      />

      {/* Himmel */}
      <SingleCharacterIdle
        modelPath="/models/transition/himmel.glb"
        name="Himmel"
        clipName="himmel_idle"
        position={[0.71, 0, 6.4]}
        rotationY={-0.15}
      />

      {/* Heiter */}
      <SingleCharacterIdle
        modelPath="/models/transition/heiter.glb"
        name="Heiter"
        clipName="heiter_idle"
        position={[-0.67, 0, 5.35]}
        rotationY={0.22}
      />

      {/* Eisen */}
      <SingleCharacterIdle
        modelPath="/models/transition/eisen.glb"
        name="Eisen"
        clipName="eisen_idle"
        position={[0.77, 0, 5.38]}
        rotationY={-0.2}
      />
    </group>
  );
};

// Preload transition models for instant availability
useGLTF.preload('/models/transition/frieren.glb');
useGLTF.preload('/models/transition/himmel.glb');
useGLTF.preload('/models/transition/heiter.glb');
useGLTF.preload('/models/transition/eisen.glb');
useGLTF.preload('/models/transition/frieren-magic.glb');

