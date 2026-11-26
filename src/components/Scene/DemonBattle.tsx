import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Html, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { AnimationMixer, LoopRepeat, Mesh, Skeleton, SkinnedMesh } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export const BATTLE_SCENE_URL = '/models/fun/demon-battle.glb';

function BattleStatus({ failed = false }: { failed?: boolean }) {
  return <Html center><div className="battle-status" role="status">
    {failed ? 'The battle scene could not load. Please reload to try again.' : 'Gathering the hero party…'}
  </div></Html>;
}

function BattleModel({ paused }: { paused: boolean }) {
  const { scene, animations } = useGLTF(BATTLE_SCENE_URL, '/draco/gltf/');
  const model = useMemo(() => clone(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const reduced = useReducedMotion();
  useEffect(() => {
    const skeletons = new Set<Skeleton>();
    model.traverse(node => {
      if (node instanceof Mesh) {
        node.receiveShadow = true;
        node.castShadow = !node.name.includes('spelllight') && !node.name.includes('light');
      }
      if (node instanceof SkinnedMesh) {
        node.frustumCulled = false;
        skeletons.add(node.skeleton);
      }
    });
    for (const clip of animations) mixer.clipAction(clip).setLoop(LoopRepeat, Infinity).play();
    // A readable combat tableau also serves reduced-motion visitors.
    mixer.setTime(1.9);
    return () => {
      mixer.stopAllAction(); mixer.uncacheRoot(model);
      skeletons.forEach(skeleton => skeleton.dispose());
    };
  }, [model, mixer, animations]);
  useFrame((_, delta) => { if (!paused && !reduced) mixer.update(Math.min(delta, .05)); });
  return <primitive object={model} dispose={null} />;
}

export function DemonBattle({ paused, resetSignal }: { paused: boolean; resetSignal: number }) {
  const size = useThree(state => state.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const aspect = size.width / size.height;
  const distance = Math.max(8.7, 6.9 / aspect);
  const position = useMemo<[number, number, number]>(() => [distance * .45, distance * .46, distance * .78], [distance]);
  useEffect(() => {
    if (!controls.current) return;
    controls.current.object.position.set(...position);
    controls.current.target.set(0, .55, 0);
    controls.current.update();
  }, [resetSignal, position]);
  return <>
    <PerspectiveCamera makeDefault position={position} fov={39} near={.05} far={60} />
    <OrbitControls ref={controls} makeDefault target={[0, .55, 0]} enablePan={false}
      minDistance={5.2} maxDistance={17} minPolarAngle={.35} maxPolarAngle={1.5} />
    <hemisphereLight args={['#ebddff', '#57506b', 1.65]} />
    <directionalLight castShadow position={[-3, 6, 5]} color="#fff0db" intensity={2.4}
      shadow-normalBias={.018} shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
    <directionalLight position={[3, 3, -4]} color="#b8b7ff" intensity={1.8} />
    <pointLight position={[1.2, 1, -.7]} color="#f28bbd" intensity={1.3} distance={4} />
    <ModelErrorBoundary fallback={<BattleStatus failed />}>
      <Suspense fallback={<BattleStatus />}><BattleModel paused={paused} /></Suspense>
    </ModelErrorBoundary>
  </>;
}
