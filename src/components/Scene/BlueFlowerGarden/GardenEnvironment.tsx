import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

// Preload master assembly (contains island, dense meadow, perimeter clouds, floating rocks, petals, and motes)
useGLTF.preload('/models/blue-flower-garden/blue-flower-garden-complete.glb');

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
      }
    });

    // Cloud soft material treatment (clouds are already baked at perimeter r >= 11.5)
    const cloudsNode = clone.getObjectByName('DreamyClouds');
    if (cloudsNode) {
      cloudsNode.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const mat = m.clone() as THREE.MeshStandardMaterial;
              mat.transparent = true;
              mat.opacity = 0.88;
              mat.roughness = 0.98;
              mat.metalness = 0.0;
              mat.depthWrite = true;
              mesh.material = mat;
            });
          }
        }
      });
    }

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

export const GardenEnvironment: React.FC = () => {
  return (
    <group name="GardenEnvironmentRoot">
      <ModelErrorBoundary fallback={null}>
        <MasterGardenMesh />
      </ModelErrorBoundary>
    </group>
  );
};

