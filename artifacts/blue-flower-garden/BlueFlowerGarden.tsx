// Optional integration example: intentionally outside src and not mounted in the website.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createGardenRuntime } from './garden-runtime.mjs';

export function BlueFlowerGarden({ url, reducedMotion = false, shadows = false }: {
  url: string;
  reducedMotion?: boolean;
  shadows?: boolean;
}) {
  const gltf = useGLTF(url, '/draco/gltf/');
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const runtime = useRef<ReturnType<typeof createGardenRuntime> | null>(null);
  useEffect(() => {
    const instance = createGardenRuntime(scene, gltf.animations, { shadows, reducedMotion });
    runtime.current = instance;
    return () => { runtime.current = null; instance.dispose(); };
  }, [scene, gltf.animations, shadows, reducedMotion]);
  useFrame((_, delta) => runtime.current?.update(delta));
  return <primitive object={scene} dispose={null} />;
}
