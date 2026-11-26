import { Suspense, useEffect, useMemo, useRef } from 'react';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { AnimationMixer, LoopRepeat, Mesh, Skeleton, SkinnedMesh } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export const BATTLE_SCENE_URL = '/models/fun/demon-battle-grand-arena.glb';
export type BattleLoadStatus = 'loading' | 'ready' | 'error';
type OnBattleStatus = (status: BattleLoadStatus) => void;

function BattleStatus({ status, onStatus }: { status: BattleLoadStatus; onStatus: OnBattleStatus }) {
  useEffect(() => { onStatus(status); }, [status, onStatus]);
  return null;
}

function BattleModel({ paused, onStatus }: { paused: boolean; onStatus: OnBattleStatus }) {
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
    onStatus('ready');
    return () => {
      mixer.stopAllAction(); mixer.uncacheRoot(model);
      skeletons.forEach(skeleton => skeleton.dispose());
    };
  }, [model, mixer, animations, onStatus]);
  useFrame((_, delta) => { if (!paused && !reduced) mixer.update(Math.min(delta, .05)); });
  return <primitive object={model} dispose={null} />;
}

export function DemonBattle({ paused, resetSignal, onStatus }: {
  paused: boolean;
  resetSignal: number;
  onStatus: OnBattleStatus;
}) {
  const size = useThree(state => state.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const aspect = size.width / size.height;
  const distance = Math.max(15.4, 18 / aspect);
  const position = useMemo<[number, number, number]>(() => [distance * .45, distance * .46, distance * .78], [distance]);
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    // Drain residual drag/zoom before applying the new framing.
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.object.position.set(...position);
    orbit.target.set(0, .65, 0);
    orbit.update();
    orbit.enableDamping = damping;
  }, [resetSignal, position]);
  return <>
    <PerspectiveCamera makeDefault position={position} fov={39} near={.05} far={100} />
    <OrbitControls ref={controls} makeDefault target={[0, .65, 0]} enablePan={false}
      minDistance={4} maxDistance={36} minPolarAngle={.35} maxPolarAngle={1.45} />
    <hemisphereLight args={['#ebddff', '#57506b', 1.65]} />
    <directionalLight castShadow position={[-5, 9, 7]} color="#fff0db" intensity={2.4}
      shadow-normalBias={.018} shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={6} shadow-camera-bottom={-6} />
    <directionalLight position={[3, 3, -4]} color="#b8b7ff" intensity={1.8} />
    <pointLight position={[1.2, 1, -.7]} color="#f28bbd" intensity={1.3} distance={4} />
    <ModelErrorBoundary fallback={<BattleStatus status="error" onStatus={onStatus} />}>
      <Suspense fallback={<BattleStatus status="loading" onStatus={onStatus} />}>
        <BattleModel paused={paused} onStatus={onStatus} />
      </Suspense>
    </ModelErrorBoundary>
  </>;
}
