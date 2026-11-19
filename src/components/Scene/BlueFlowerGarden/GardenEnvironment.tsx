import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

// Preload master and satellite models
useGLTF.preload('/models/blue-flower-garden/blue-flower-garden-complete.glb');
useGLTF.preload('/models/blue-flower-garden/island/floating-rocks.glb');
useGLTF.preload('/models/blue-flower-garden/effects/floating-petals.glb');
useGLTF.preload('/models/blue-flower-garden/effects/magical-motes.glb');

const MasterGardenMesh: React.FC = () => {
  const gltf = useGLTF('/models/blue-flower-garden/blue-flower-garden-complete.glb');
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.side = THREE.DoubleSide;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const active = Object.values(actions).filter(Boolean);
    active.forEach((a) => a?.reset().play());
    return () => {
      active.forEach((a) => a?.fadeOut(0.2));
    };
  }, [actions]);

  return (
    <group ref={groupRef} name="BlueFlowerGarden_Complete">
      <primitive object={scene} />
    </group>
  );
};

const SatelliteFloatingRocks: React.FC = () => {
  const gltf = useGLTF('/models/blue-flower-garden/island/floating-rocks.glb');
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const active = Object.values(actions).filter(Boolean);
    active.forEach((a) => a?.reset().play());
    return () => {
      active.forEach((a) => a?.fadeOut(0.2));
    };
  }, [actions]);

  return (
    <group ref={groupRef} name="floating-rocks">
      <primitive object={scene} />
    </group>
  );
};

const FloatingPetalsAndMotes: React.FC = () => {
  const petalsGltf = useGLTF('/models/blue-flower-garden/effects/floating-petals.glb');
  const motesGltf = useGLTF('/models/blue-flower-garden/effects/magical-motes.glb');

  const petalsGroup = useRef<THREE.Group>(null);
  const motesGroup = useRef<THREE.Group>(null);

  const petalsScene = useMemo(() => petalsGltf.scene.clone(true), [petalsGltf.scene]);
  const motesScene = useMemo(() => motesGltf.scene.clone(true), [motesGltf.scene]);

  const petalsAnim = useAnimations(petalsGltf.animations, petalsGroup);
  const motesAnim = useAnimations(motesGltf.animations, motesGroup);

  useEffect(() => {
    const activePetals = Object.values(petalsAnim.actions).filter(Boolean);
    activePetals.forEach((a) => a?.reset().play());

    const activeMotes = Object.values(motesAnim.actions).filter(Boolean);
    activeMotes.forEach((a) => a?.reset().play());

    return () => {
      activePetals.forEach((a) => a?.fadeOut(0.2));
      activeMotes.forEach((a) => a?.fadeOut(0.2));
    };
  }, [petalsAnim.actions, motesAnim.actions]);

  return (
    <>
      <group ref={petalsGroup} name="floating-petals">
        <primitive object={petalsScene} />
      </group>
      <group ref={motesGroup} name="magical-motes">
        <primitive object={motesScene} />
      </group>
    </>
  );
};

export const GardenEnvironment: React.FC = () => {
  return (
    <group name="GardenEnvironmentRoot">
      <ModelErrorBoundary fallback={null}>
        <MasterGardenMesh />
        <SatelliteFloatingRocks />
        <FloatingPetalsAndMotes />
      </ModelErrorBoundary>
    </group>
  );
};
