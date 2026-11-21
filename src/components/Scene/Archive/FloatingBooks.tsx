import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

export interface FloatingBooksProps {
  isInspecting?: boolean;
}

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

export const FloatingBooks: React.FC<FloatingBooksProps> = ({ isInspecting = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const elevateRef = useRef(0);
  const driftRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetY = isInspecting ? 1.4 : 0.0;
    const targetZ = isInspecting ? 0.8 : 0.0;

    elevateRef.current = THREE.MathUtils.damp(elevateRef.current, targetY, 3.2, delta);
    driftRef.current = THREE.MathUtils.damp(driftRef.current, targetZ, 3.0, delta);

    const time = state.clock.getElapsedTime();
    const bob = isInspecting ? Math.sin(time * 1.8) * 0.16 : 0.0;

    groupRef.current.position.y = elevateRef.current + bob;
    groupRef.current.position.z = driftRef.current;
  });

  return (
    <group ref={groupRef} name="ArchiveFloatingBooksGroup">
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FloatingBooksScene />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};
