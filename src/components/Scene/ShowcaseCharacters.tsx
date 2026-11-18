import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface CharacterConfig {
  name: 'Frieren' | 'Himmel' | 'Heiter' | 'Eisen';
  targetX: number;
  targetY: number;
  targetZ: number;
  facing: number;
  startDelay: number;
  speed: number;
}

// Staggered arrival configs and distinct Z-depth lanes to prevent overlapping
const CHARACTERS: CharacterConfig[] = [
  {
    name: 'Frieren',
    targetX: -0.9,
    targetY: -1.7,
    targetZ: 6.05,
    facing: 0.04,
    startDelay: 0.15, // Frieren enters first
    speed: 2.1,
  },
  {
    name: 'Himmel',
    targetX: 0.9,
    targetY: -1.7,
    targetZ: 5.85,
    facing: -0.04,
    startDelay: 0.95, // Himmel follows
    speed: 2.15,
  },
  {
    name: 'Heiter',
    targetX: 2.8,
    targetY: -1.7,
    targetZ: 6.25,
    facing: -0.12,
    startDelay: 1.80, // Heiter follows
    speed: 2.25,
  },
  {
    name: 'Eisen',
    targetX: -2.8,
    targetY: -1.7,
    targetZ: 6.45,
    facing: 0.12,
    startDelay: 2.65, // Eisen follows
    speed: 1.95,
  },
];

type ActorState = 'WAITING' | 'WALKING' | 'DECELERATING' | 'IDLE';

interface ActorRuntime {
  name: string;
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction | null;
  idleAction: THREE.AnimationAction | null;
  palette: ReturnType<typeof createPartyPalette>;
  paint?: ReturnType<ReturnType<typeof createPartyPalette>['dress']>;
  state: ActorState;
  startDelay: number;
  configTargetX: number;
  targetY: number;
  targetZ: number;
  facing: number;
  speed: number;
  currentX: number;
  currentFacing: number;
}

export interface ShowcaseCharactersProps {
  active?: boolean;
}

export const ShowcaseCharacters: React.FC<ShowcaseCharactersProps> = ({ active = true }) => {
  const { size } = useThree();
  const isMobile = size.width < 768;
  const characterScale = isMobile ? 0.44 : 0.51;

  const rootGroupRef = useRef<THREE.Group>(null);
  const actorsRef = useRef<ActorRuntime[]>([]);
  const elapsedRef = useRef<number>(0);

  // Load character models & the master island file which contains the walk cycles
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const himmelGltf = useGLTF('/models/transition/himmel.glb');
  const heiterGltf = useGLTF('/models/transition/heiter.glb');
  const eisenGltf = useGLTF('/models/transition/eisen.glb');
  const islandGltf = useGLTF('/models/home-island.glb');

  const gltfMap = useMemo(
    () => ({
      Frieren: frierenGltf,
      Himmel: himmelGltf,
      Heiter: heiterGltf,
      Eisen: eisenGltf,
    }),
    [frierenGltf, himmelGltf, heiterGltf, eisenGltf]
  );

  // Initialize all 4 Characters positioned off-screen to the left
  useEffect(() => {
    if (!rootGroupRef.current || !active) return;
    const group = rootGroupRef.current;
    const actors: ActorRuntime[] = [];
    elapsedRef.current = 0;

    // Start position far beyond the left visible edge
    const startX = isMobile ? -6.0 : -11.0;

    for (const config of CHARACTERS) {
      const gltf = gltfMap[config.name];
      const clone = cloneSkeleton(gltf.scene);
      const root = clone.getObjectByName(config.name) || clone;

      const palette = createPartyPalette();
      const paint = palette.dress(root);

      clone.scale.set(characterScale, characterScale, characterScale);
      // Positioned offscreen left at start
      clone.position.set(startX, config.targetY, config.targetZ);
      // Facing walking direction (+X)
      clone.rotation.set(0, Math.PI / 2, 0);
      clone.visible = false; // Hidden until startDelay

      // Soft shadows
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });

      group.add(clone);

      const mixer = new THREE.AnimationMixer(clone);

      // 1. Walk animation from home-island.glb
      const walkClip = islandGltf.animations.find(
        (c) => c.name.toLowerCase() === `${config.name.toLowerCase()}_walk`
      );
      let walkAction: THREE.AnimationAction | null = null;
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
      }

      // 2. Idle animation
      const idleClip =
        gltf.animations.find((c) => c.name.toLowerCase().endsWith('_idle')) ||
        islandGltf.animations.find(
          (c) => c.name.toLowerCase() === `${config.name.toLowerCase()}_idle`
        );
      let idleAction: THREE.AnimationAction | null = null;
      if (idleClip) {
        idleAction = mixer.clipAction(idleClip);
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
      }

      actors.push({
        name: config.name,
        root: clone,
        mixer,
        walkAction,
        idleAction,
        palette,
        paint,
        state: 'WAITING',
        startDelay: config.startDelay,
        configTargetX: config.targetX,
        targetY: config.targetY,
        targetZ: config.targetZ,
        facing: config.facing,
        speed: config.speed,
        currentX: startX,
        currentFacing: Math.PI / 2,
      });
    }

    actorsRef.current = actors;

    return () => {
      for (const actor of actors) {
        actor.root.removeFromParent();
        actor.paint?.dispose();
        actor.palette.dispose();
      }
      actorsRef.current = [];
    };
  }, [gltfMap, islandGltf, active, characterScale, isMobile]);

  // Frame update: Handle walking entrance from left, deceleration, pivot, and idle stance
  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;
    const actors = actorsRef.current;
    if (actors.length === 0) return;

    const isMobileNow = size.width < 768;
    const spread = isMobileNow ? 0.62 : 1.0;
    const curScale = isMobileNow ? 0.44 : 0.51;

    for (const actor of actors) {
      // Responsive scale
      actor.root.scale.set(curScale, curScale, curScale);
      const actualTargetX = actor.configTargetX * spread;

      // 1. WAITING: Hidden offscreen until individual staggered start time
      if (actor.state === 'WAITING') {
        if (elapsed < actor.startDelay) {
          actor.root.visible = false;
          continue;
        }
        actor.root.visible = true;
        actor.state = 'WALKING';
        if (actor.walkAction) {
          actor.walkAction.reset().play();
          actor.walkAction.timeScale = actor.speed / 2.0;
        }
      }

      // 2. WALKING: Striding across screen from left to right
      if (actor.state === 'WALKING') {
        const distRemaining = actualTargetX - actor.currentX;
        const decelZone = 0.85;

        if (distRemaining > decelZone) {
          actor.currentX += actor.speed * dt;
          actor.root.position.set(actor.currentX, actor.targetY, actor.targetZ);
          actor.root.rotation.set(0, Math.PI / 2, 0);

          // Synchronize stride frequency with speed to eliminate foot sliding
          if (actor.walkAction) {
            actor.walkAction.timeScale = actor.speed / 2.0;
          }
          actor.mixer.update(dt);
        } else {
          // Reached deceleration zone: begin smooth cross-fade to idle
          actor.state = 'DECELERATING';
          if (actor.idleAction && actor.walkAction) {
            actor.idleAction.reset().play();
            actor.walkAction.crossFadeTo(actor.idleAction, 0.45, true);
          } else if (actor.idleAction) {
            actor.idleAction.reset().play();
          }
        }
      }

      // 3. DECELERATING: Smoothly slowing down, pivoting from +X to face forward
      if (actor.state === 'DECELERATING') {
        const distRemaining = actualTargetX - actor.currentX;
        const decelZone = 0.85;

        if (distRemaining > 0.04) {
          const ratio = Math.max(0.12, distRemaining / decelZone);
          const currentSpeed = actor.speed * ratio;
          actor.currentX += currentSpeed * dt;
          actor.root.position.set(actor.currentX, actor.targetY, actor.targetZ);

          // Smoothly pivot to face forward toward project cubes / viewer
          const rotProgress = THREE.MathUtils.clamp(1 - distRemaining / decelZone, 0, 1);
          const easedPivot = Math.sin(rotProgress * Math.PI * 0.5);
          actor.currentFacing = THREE.MathUtils.lerp(Math.PI / 2, actor.facing, easedPivot);
          actor.root.rotation.set(0, actor.currentFacing, 0);

          if (actor.walkAction) {
            actor.walkAction.timeScale = currentSpeed / 2.0;
          }
          actor.mixer.update(dt);
        } else {
          // Arrived at final destination: lock transform and settle into idle
          actor.currentX = actualTargetX;
          actor.currentFacing = actor.facing;
          actor.root.position.set(actualTargetX, actor.targetY, actor.targetZ);
          actor.root.rotation.set(0, actor.facing, 0);
          actor.state = 'IDLE';
          if (actor.walkAction) {
            actor.walkAction.stop();
          }
          if (actor.idleAction) {
            actor.idleAction.timeScale = 1.0;
          }
        }
      }

      // 4. IDLE: Strictly stationary in world space with continuous breathing/blinking
      if (actor.state === 'IDLE') {
        actor.root.position.set(actualTargetX, actor.targetY, actor.targetZ);
        actor.root.rotation.set(0, actor.facing, 0);
        actor.mixer.update(dt);
      }
    }
  });

  if (!active) return null;

  return <group ref={rootGroupRef} name="StationaryCharactersContainer" />;
};

// Preload models for instantaneous transition without asset pop-in
useGLTF.preload('/models/transition/frieren.glb');
useGLTF.preload('/models/transition/himmel.glb');
useGLTF.preload('/models/transition/heiter.glb');
useGLTF.preload('/models/transition/eisen.glb');
useGLTF.preload('/models/home-island.glb');
