import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';
import { FOREST_ENVIRONMENT_FILES } from '../../../assets3d/forestAssets';

// Preload all 9 Forest Environment modules
FOREST_ENVIRONMENT_FILES.forEach(({ file }) => {
  useGLTF.preload(`/models/whispering-forest/${file}`);
});

interface EnvironmentModuleProps {
  file: string;
  position: [number, number, number];
}

/**
 * Loads a single Whispering Forest environment module with proper materials,
 * shadows, and auto-looping transform animations.
 */
const ForestModule: React.FC<EnvironmentModuleProps> = ({ file, position }) => {
  const gltf = useGLTF(`/models/whispering-forest/${file}`);
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // Optimize draw calls and disable redundant shadow casting on small foliage
        child.receiveShadow = true;
        child.castShadow = file === 'ancient-tree.glb' || file === 'whispering-forest-island.glb';
      }
    });
    return clone;
  }, [gltf.scene, file]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const activeActions = Object.values(actions).filter((action): action is THREE.AnimationAction => action !== null);
    activeActions.forEach((action) => {
      action.reset().fadeIn(0.3).play();
    });
    return () => {
      activeActions.forEach((action) => action.fadeOut(0.2));
    };
  }, [actions]);

  return (
    <group ref={groupRef} position={position} name={file.replace('.glb', '')}>
      <primitive object={scene} />
    </group>
  );
};

export const ForestEnvironment: React.FC = () => {
  return (
    <group name="ForestEnvironmentRoot">
      <ModelErrorBoundary fallback={null}>
        {FOREST_ENVIRONMENT_FILES.map(({ file, position }) => (
          <Suspense key={file} fallback={null}>
            <ForestModule file={file} position={position} />
          </Suspense>
        ))}
      </ModelErrorBoundary>
    </group>
  );
};

