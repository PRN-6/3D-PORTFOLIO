import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ModelErrorBoundary } from '../ModelErrorBoundary';
import { createGardenRuntime, type GardenRuntime } from '../../../../artifacts/blue-flower-garden/garden-runtime.mjs';
import gardenUrl from '../../../../artifacts/blue-flower-garden/blue-flower-garden.glb?url';

useGLTF.preload(gardenUrl, '/draco/gltf/');

function GardenMesh({ moving }: { moving: boolean }) {
  const gltf = useGLTF(gardenUrl, '/draco/gltf/');
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const runtime = useRef<GardenRuntime | null>(null);

  useEffect(() => {
    const instance = createGardenRuntime(scene, gltf.animations, { shadows: true });
    runtime.current = instance;
    return () => {
      runtime.current = null;
      instance.dispose();
    };
  }, [scene, gltf.animations]);

  useFrame((_, delta) => {
    if (moving) runtime.current?.update(delta);
  });

  return <primitive object={scene} dispose={null} />;
}

export function GardenEnvironment({ moving }: { moving: boolean }) {
  return (
    <group name="GardenEnvironmentRoot">
      <ModelErrorBoundary fallback={null}>
        <group name="BlueFlowerGarden_Complete">
          <GardenMesh moving={moving} />
        </group>
      </ModelErrorBoundary>
    </group>
  );
}
