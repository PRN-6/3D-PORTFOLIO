import React, { useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../partyMaterials';
import { HEITER_CONFIG } from '../../../assets3d/forestAssets';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

// Ensure Heiter GLB is preloaded
useGLTF.preload(HEITER_CONFIG.modelPath);

const HeiterCharacter: React.FC = () => {
  const gltf = useGLTF(HEITER_CONFIG.modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // 1. Clone skeletal hierarchy safely via SkeletonUtils.clone
    const character = clone(gltf.scene);
    const root = character.getObjectByName('Heiter')!;

    // 2. Position Heiter at documented HeiterIdleAnchor facing local yaw 1.0 rad
    root.position.fromArray(HEITER_CONFIG.position);
    root.rotation.set(0, HEITER_CONFIG.rotationY, 0);
    root.scale.setScalar(HEITER_CONFIG.scale);

    // 3. Apply party cel-shading palette and ink contour outline
    const palette = createPartyPalette();
    const dressed = palette.dress(root);

    // 4. Play verified standing idle animation
    const mixer = new THREE.AnimationMixer(root);
    const idleClip = gltf.animations.find((c) => c.name === HEITER_CONFIG.clipName);
    if (idleClip) {
      const action = mixer.clipAction(idleClip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }
    mixerRef.current = mixer;

    groupRef.current.add(character);

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      mixerRef.current = null;
      dressed?.dispose();
      palette.dispose();
      character.removeFromParent();
    };
  }, [gltf]);

  // Frame update loop with delta clamping for silky smooth rendering
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.05));
    }
  });

  return <group ref={groupRef} name="ForestHeiterContainer" />;
};

export const ForestHeiter: React.FC = () => {
  return (
    <ModelErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <HeiterCharacter />
      </Suspense>
    </ModelErrorBoundary>
  );
};

