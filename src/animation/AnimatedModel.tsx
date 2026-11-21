import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { assemblyEngine } from './AssemblyEngine';

export interface AnimatedModelProps {
  rootRef: React.RefObject<THREE.Group | null>;
  islandName?: string;
  autoInit?: boolean;
}

/**
 * React Three Fiber bridge component.
 * Attaches the high-performance AssemblyEngine to the target 3D model group,
 * driving per-frame kinematic evaluations through useFrame.
 */
export const AnimatedModelBridge: React.FC<AnimatedModelProps> = ({
  rootRef,
  islandName = 'HOME',
  autoInit = true,
}) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!autoInit) return;

    if (rootRef.current) {
      assemblyEngine.init(rootRef.current, islandName);
      initializedRef.current = true;
    }

    return () => {
      // Don't dispose immediately if switching worlds, but ensure transforms are pristine
      if (initializedRef.current) {
        assemblyEngine.restoreOriginals();
      }
    };
  }, [rootRef, islandName, autoInit]);

  useFrame((_, delta) => {
    assemblyEngine.update(delta);
  });

  return null;
};
