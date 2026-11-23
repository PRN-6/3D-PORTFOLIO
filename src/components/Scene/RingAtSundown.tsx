import { Suspense, useEffect, useMemo } from 'react';
import { Html, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { AnimationMixer, Mesh, Skeleton, SkinnedMesh } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export const RING_SCENE_URL = '/models/fun/ring-at-sundown.glb';

function ModelPoster({ message }: { message: string }) {
  return (
    <Html fullscreen>
      <div className="ring-poster">
        <img src="/models/fun/ring-at-sundown.webp" alt="Frieren and Himmel exchanging a ring in the clock square" />
        <span className="ring-view-status" role="status">{message}</span>
      </div>
    </Html>
  );
}

function Figures() {
  const { scene, animations } = useGLTF(RING_SCENE_URL, '/draco/gltf/');
  const reduced = useReducedMotion();
  const model = useMemo(() => clone(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);

  useEffect(() => {
    const skeletons = new Set<Skeleton>();
    model.traverse(node => {
      if (node instanceof Mesh) node.receiveShadow = true;
      if (node instanceof SkinnedMesh) {
        node.castShadow = true;
        skeletons.add(node.skeleton);
      }
    });
    for (const clip of animations) mixer.clipAction(clip).play();
    mixer.update(0);
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      skeletons.forEach(skeleton => skeleton.dispose());
    };
  }, [model, mixer, animations]);

  useFrame((_, delta) => {
    if (!reduced) mixer.update(Math.min(delta, 0.05));
  });
  return <primitive object={model} dispose={null} />;
}

export function RingAtSundown() {
  const { width, height } = useThree(state => state.size);
  const distance = Math.max(3.35, 3.35 * height / width);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.18, distance]} fov={36} near={0.05} far={30} />
      <OrbitControls makeDefault target={[0, 0.91, 0.02]} enablePan={false}
        minDistance={1.65} maxDistance={7} minPolarAngle={0.92} maxPolarAngle={1.57}
        minAzimuthAngle={-0.68} maxAzimuthAngle={0.68} />
      <hemisphereLight args={['#ffedf4', '#c38d85', 1.6]} />
      <directionalLight castShadow position={[-2.8, 4, 2.2]} color="#ffdfab" intensity={2.0}
        shadow-normalBias={0.012} shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[2, 2, -3]} color="#ffb0aa" intensity={1.3} />
      <ModelErrorBoundary fallback={<ModelPoster message="3D preview unavailable" />}>
        <Suspense fallback={<ModelPoster message="Loading the square…" />}>
          <Figures />
        </Suspense>
      </ModelErrorBoundary>
    </>
  );
}
