import React, { useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useAnimations, useGLTF } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

// Preload all Grand Mage Archive assets immediately so transitions are instantaneous
useGLTF.preload('/models/archive/archive-island.glb');
useGLTF.preload('/models/archive/archive-library.glb');
useGLTF.preload('/models/archive/archive-decorations.glb');
useGLTF.preload('/models/archive/archive-grimoires.glb');
useGLTF.preload('/models/archive/archive-floating-books.glb');
useGLTF.preload('/models/transition/frieren.glb');
useGLTF.preload('/models/transition/frieren-magic.glb');

/**
 * Loads Base Island (`archive-island.glb`) with animated drifting floating rocks
 */
const IslandBaseModel: React.FC = () => {
  const gltf = useGLTF('/models/archive/archive-island.glb');
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false; // Decorations do not need heavy shadow passes
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, scene);

  useEffect(() => {
    const loops = Object.values(actions).filter((action) => action !== null);
    loops.forEach((action) => {
      action.reset().fadeIn(0.4).play();
    });
    return () => {
      loops.forEach((action) => action?.fadeOut(0.3));
    };
  }, [actions]);

  return <primitive object={scene} />;
};

/**
 * Loads Grand Library Structure (`archive-library.glb`)
 */
const LibraryModel: React.FC = () => {
  const gltf = useGLTF('/models/archive/archive-library.glb');
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false; // Decorations do not need heavy shadow passes
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  return <primitive object={scene} />;
};

/**
 * Loads Decorations & Chandeliers (`archive-decorations.glb`) with ambient drifting animations
 */
const DecorationsModel: React.FC = () => {
  const gltf = useGLTF('/models/archive/archive-decorations.glb');
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = false; // Decorations do not need heavy shadow passes
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, scene);

  useEffect(() => {
    const loops = Object.values(actions).filter((action) => action !== null);
    loops.forEach((action) => {
      action.reset().fadeIn(0.4).play();
    });
    return () => {
      loops.forEach((action) => action?.fadeOut(0.3));
    };
  }, [actions]);

  return <primitive object={scene} />;
};

export const ArchiveEnvironment: React.FC = () => {
  return (
    <group name="ArchiveEnvironmentRoot">
      <ModelErrorBoundary fallback={null}>
        {/* Base Island Terrain & Floating Rocks with Drift Animations */}
        <Suspense fallback={null}>
          <IslandBaseModel />
        </Suspense>

        {/* Grand Two-Level Library Architecture */}
        <Suspense fallback={null}>
          <LibraryModel />
        </Suspense>

        {/* Chandeliers, Desk Furniture, Candles & Drifting Motes */}
        <Suspense fallback={null}>
          <DecorationsModel />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};
