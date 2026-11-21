import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../partyMaterials';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

interface ArchiveFrierenProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

const ArchiveFrierenModel: React.FC<ArchiveFrierenProps> = ({
  position = [-1.25, 0.36, 0.25],
  rotation = [0, 0, 0],
  scale = 1.0, // Natural GLB character scale matching Hero's Home island
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const magicRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Object3D | null>(null);
  const paintRef = useRef<ReturnType<ReturnType<typeof createPartyPalette>['dress']>>(undefined);

  // Load standalone Frieren model and magic seal
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const magicGltf = useGLTF('/models/transition/frieren-magic.glb');

  // Clone skeleton cleanly so skinned mesh animations operate independently
  const { clonedRoot, magicScene, dressed, eyeNode, paletteCleanup } = useMemo(() => {
    const clone = cloneSkeleton(frierenGltf.scene);
    const root = clone.getObjectByName('Frieren') || clone;

    // Apply exact toon cel paint and ink outline from existing party materials
    const palette = createPartyPalette();
    const dressed = palette.dress(root);

    // Shadows
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Reused reading magic circle seal placed on floor beneath the reading area
    const magicClone = magicGltf.scene.clone(true);
    magicClone.name = 'ReusedReadingMagic';
    magicClone.scale.setScalar(0.42);
    magicClone.position.set(0, 0.035, 0.05);
    magicClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && 'transparent' in mesh.material) {
          (mesh.material as THREE.Material).transparent = true;
          (mesh.material as THREE.Material).opacity = 0.75;
        }
      }
    });

    return {
      clonedRoot: clone,
      magicScene: magicClone,
      dressed,
      eyeNode: root.getObjectByName('FrierenEyeL') || null,
      paletteCleanup: () => {
        dressed?.dispose();
        palette.dispose();
      },
    };
  }, [frierenGltf.scene, magicGltf.scene]);

  // Set refs and clean up material resources
  useEffect(() => {
    paintRef.current = dressed;
    eyeRef.current = eyeNode;
    return () => {
      paintRef.current = undefined;
      eyeRef.current = null;
      paletteCleanup();
    };
  }, [paletteCleanup]);

  // Bind animation mixer and play frieren_read
  useEffect(() => {
    if (!clonedRoot) return;

    const mixer = new THREE.AnimationMixer(clonedRoot);
    mixerRef.current = mixer;

    // Locate frieren_read animation clip from self-contained frieren.glb
    const readClip =
      frierenGltf.animations.find((clip) => clip.name.toLowerCase() === 'frieren_read') ||
      frierenGltf.animations[0];

    if (readClip) {
      const action = mixer.clipAction(readClip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().fadeIn(0.3).play();
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedRoot);
      mixerRef.current = null;
    };
  }, [clonedRoot, frierenGltf.animations]);

  // Advance animation mixer and synchronize blinking on each frame
  useFrame((state, delta) => {
    const step = Math.min(delta, 0.1);
    mixerRef.current?.update(step);

    // Synchronize natural facial eye blinking with eye scale
    if (eyeRef.current && paintRef.current) {
      paintRef.current.setExpression((eyeRef.current.scale.y ?? 1) < 0.53 ? 'blink' : 'neutral');
    }

    // Slowly rotate magic seal
    if (magicRef.current) {
      magicRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    }
  });

  return (
    <group ref={groupRef} name="ArchiveFrierenRoot" position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={clonedRoot} />

      {/* Floating Rotating Magic Circle Seal */}
      <group ref={magicRef}>
        <primitive object={magicScene} />
      </group>
    </group>
  );
};

export const ArchiveFrieren: React.FC<ArchiveFrierenProps> = (props) => {
  return (
    <group name="ArchiveFrierenCharacter">
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ArchiveFrierenModel {...props} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};
