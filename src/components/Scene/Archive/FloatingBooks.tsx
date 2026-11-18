import React, { useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useAnimations, useGLTF } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

const FloatingBooksScene: React.FC = () => {
  const gltf = useGLTF('/models/archive/archive-floating-books.glb');

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, clonedScene);

  useEffect(() => {
    const loops = Object.values(actions).filter((action) => action !== null);
    loops.forEach((action) => {
      action.reset().fadeIn(0.5).play();
    });
    return () => {
      loops.forEach((action) => action?.fadeOut(0.3));
    };
  }, [actions]);

  return <primitive object={clonedScene} />;
};

export const FloatingBooks: React.FC = () => {
  return (
    <group name="ArchiveFloatingBooksGroup">
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FloatingBooksScene />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};

