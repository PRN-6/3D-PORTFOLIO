import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface CharacterDesc {
  name: string;
  modelPath: string;
  fallClip: string;
  landingClip: string;
  idleClip: string;
  specialClip?: string;
  landTime: number; // Seconds into descent when feet touch down
  homePos: [number, number, number]; // Final standing position [X, Y, Z]
  patrolBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  initialFacing: number;
}

const CHARACTERS_CONFIG: CharacterDesc[] = [
  {
    name: 'Eisen',
    modelPath: '/models/transition/eisen.glb',
    fallClip: 'eisen_fall',
    landingClip: 'eisen_landing',
    idleClip: 'eisen_idle',
    landTime: 3.2,
    homePos: [-3.8, -1.6, 5.8],
    patrolBounds: { minX: -4.8, maxX: -2.8, minZ: 5.2, maxZ: 6.6 },
    initialFacing: 0.25,
  },
  {
    name: 'Frieren',
    modelPath: '/models/transition/frieren.glb',
    fallClip: 'frieren_fall',
    landingClip: 'frieren_landing',
    idleClip: 'frieren_idle',
    specialClip: 'frieren_magic_land',
    landTime: 4.2,
    homePos: [-1.3, -1.6, 6.6],
    patrolBounds: { minX: -2.2, maxX: -0.4, minZ: 5.8, maxZ: 7.2 },
    initialFacing: 0.1,
  },
  {
    name: 'Himmel',
    modelPath: '/models/transition/himmel.glb',
    fallClip: 'himmel_fall',
    landingClip: 'himmel_landing',
    idleClip: 'himmel_idle',
    landTime: 3.5,
    homePos: [1.3, -1.6, 6.4],
    patrolBounds: { minX: 0.4, maxX: 2.2, minZ: 5.6, maxZ: 7.0 },
    initialFacing: -0.15,
  },
  {
    name: 'Heiter',
    modelPath: '/models/transition/heiter.glb',
    fallClip: 'heiter_fall',
    landingClip: 'heiter_landing',
    idleClip: 'heiter_idle',
    landTime: 3.8,
    homePos: [3.8, -1.6, 5.8],
    patrolBounds: { minX: 2.8, maxX: 4.8, minZ: 5.2, maxZ: 6.6 },
    initialFacing: -0.25,
  },
];

interface ActorRuntime {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAction: THREE.AnimationAction | null;
  config: CharacterDesc;
  hasLanded: boolean;
  hasFinishedLanding: boolean;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  facing: number;
  targetFacing: number;
  nextRoamTime: number;
  isWalking: boolean;
}

export const ShowcaseCharacters: React.FC = () => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const actorsRef = useRef<ActorRuntime[]>([]);

  // Load character and magic GLB assets
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const himmelGltf = useGLTF('/models/transition/himmel.glb');
  const heiterGltf = useGLTF('/models/transition/heiter.glb');
  const eisenGltf = useGLTF('/models/transition/eisen.glb');
  const magicGltf = useGLTF('/models/transition/frieren-magic.glb');

  const gltfMap = useMemo(
    () => ({
      Frieren: frierenGltf,
      Himmel: himmelGltf,
      Heiter: heiterGltf,
      Eisen: eisenGltf,
    }),
    [frierenGltf, himmelGltf, heiterGltf, eisenGltf]
  );

  // Magic particle points and glyph
  const magicCircleRef = useRef<THREE.Object3D | null>(null);
  const magicParticlesRef = useRef<THREE.Points | null>(null);
  const magicLightRef = useRef<THREE.PointLight | null>(null);

  // Setup actors and magic effect on mount
  useEffect(() => {
    const palette = createPartyPalette();
    const actors: ActorRuntime[] = [];
    const group = rootGroupRef.current;
    if (!group) return;

    // Build Character Runtimes
    for (const config of CHARACTERS_CONFIG) {
      const gltf = gltfMap[config.name as keyof typeof gltfMap];
      const model = cloneSkeleton(gltf.scene);
      const root = model.getObjectByName(config.name) || model;

      // Enable shadows and scale appropriately for Chibi visibility
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          child.frustumCulled = false;
        }
      });

      // Scale up so characters are distinct, lovable, and clearly visible
      root.scale.setScalar(1.55);

      palette.dress(root);

      const mixer = new THREE.AnimationMixer(root);
      const actions = new Map<string, THREE.AnimationAction>();

      for (const clip of gltf.animations) {
        const action = mixer.clipAction(clip);
        actions.set(clip.name, action);
      }

      // Initial fall pose
      const fallAction = actions.get(config.fallClip);
      if (fallAction) {
        fallAction.play();
      }

      group.add(model);

      actors.push({
        root,
        mixer,
        actions,
        currentAction: fallAction || null,
        config,
        hasLanded: false,
        hasFinishedLanding: false,
        currentPos: new THREE.Vector3(config.homePos[0], 10.5, config.homePos[2]),
        targetPos: new THREE.Vector3(...config.homePos),
        facing: config.initialFacing,
        targetFacing: config.initialFacing,
        nextRoamTime: 6.5 + Math.random() * 4.0,
        isWalking: false,
      });
    }

    actorsRef.current = actors;

    // Clone Magic Glyph
    const magicScene = magicGltf.scene.clone(true);
    magicScene.scale.setScalar(1.4);
    magicScene.position.set(0, -1.58, 6.2);
    magicScene.visible = false;
    magicCircleRef.current = magicScene;
    group.add(magicScene);

    // Create 45 magical starlight particles around magic circle
    const count = 45;
    const posArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);
    const gold = new THREE.Color('#ffe2a2');
    const violet = new THREE.Color('#cdb8ff');

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.0 + Math.random() * 1.6;
      posArray[i * 3] = Math.cos(angle) * radius;
      posArray[i * 3 + 1] = 0.05 + Math.random() * 0.6;
      posArray[i * 3 + 2] = Math.sin(angle) * radius;
      (i % 2 === 0 ? gold : violet).toArray(colArray, i * 3);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(pGeo, pMat);
    particles.position.set(0, -1.56, 6.2);
    particles.visible = false;
    magicParticlesRef.current = particles;
    group.add(particles);

    // Subtle magic violet point light
    const mLight = new THREE.PointLight('#d8b4fe', 0, 8, 2);
    mLight.position.set(0, -1.2, 6.2);
    magicLightRef.current = mLight;
    group.add(mLight);

    return () => {
      palette.dispose();
      actors.forEach((a) => {
        a.mixer.stopAllAction();
        a.mixer.uncacheRoot(a.root);
      });
      pGeo.dispose();
      pMat.dispose();
      group.clear();
    };
  }, [gltfMap, magicGltf]);

  // Animation & Roaming Render Loop
  const startTimeRef = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const actors = actorsRef.current;
    if (actors.length === 0) return;

    // ----------------------------------------------------
    // PHASE 1: DESCENT FROM ABOVE THE SCREEN (t = 0 to ~4.5s)
    // ----------------------------------------------------
    if (elapsed < 5.5) {
      // Magic Circle Appearance (t = 1.6s to 4.8s)
      if (magicCircleRef.current && magicParticlesRef.current && magicLightRef.current) {
        if (elapsed > 1.6 && elapsed < 4.8) {
          const fadeIn = THREE.MathUtils.smoothstep(elapsed, 1.6, 2.4);
          const fadeOut = 1.0 - THREE.MathUtils.smoothstep(elapsed, 3.8, 4.8);
          const strength = fadeIn * fadeOut;

          magicCircleRef.current.visible = strength > 0.01;
          magicParticlesRef.current.visible = strength > 0.01;
          magicCircleRef.current.rotation.y = elapsed * 0.45;
          magicCircleRef.current.scale.setScalar(1.2 * strength);

          const pMat = magicParticlesRef.current.material as THREE.PointsMaterial;
          pMat.opacity = strength * 0.85;
          magicLightRef.current.intensity = strength * 2.2;
        } else {
          // Completely disappeared after landing sequence!
          magicCircleRef.current.visible = false;
          magicParticlesRef.current.visible = false;
          magicLightRef.current.intensity = 0;
        }
      }

      // Update each character descent & landing
      for (const actor of actors) {
        const { config, root, mixer, actions } = actor;

        if (elapsed < config.landTime) {
          // Floating descent from top of screen Y = +11 down to homePos Y = -1.6
          const progress = elapsed / config.landTime;
          // Ease-out curve to mimic Frieren's magic decelerating their fall
          const easeProgress = 1.0 - Math.pow(1.0 - progress, 2.5);
          const currentY = THREE.MathUtils.lerp(10.5, config.homePos[1], easeProgress);

          // Gentle floating sway
          const swayX = Math.sin(elapsed * 1.8 + config.initialFacing * 4.0) * 0.08;
          const swayZ = Math.cos(elapsed * 1.6 + config.initialFacing * 3.0) * 0.06;

          actor.currentPos.set(
            config.homePos[0] + swayX,
            currentY,
            config.homePos[2] + swayZ
          );
          root.position.copy(actor.currentPos);

          // Gentle character rotation while floating down
          root.rotation.set(
            Math.sin(elapsed * 1.2) * 0.05,
            config.initialFacing + Math.sin(elapsed * 0.9) * 0.12,
            Math.cos(elapsed * 1.4) * 0.04
          );

          // Frieren magic cast animation trigger
          if (config.name === 'Frieren' && elapsed > 1.6 && config.specialClip) {
            const castAction = actions.get(config.specialClip);
            if (castAction && actor.currentAction !== castAction) {
              actor.currentAction?.fadeOut(0.2);
              castAction.reset().fadeIn(0.2).play();
              actor.currentAction = castAction;
            }
          }
        } else if (!actor.hasLanded) {
          // TOUCHDOWN: Transition to individual landing animation!
          actor.hasLanded = true;
          actor.currentPos.set(...config.homePos);
          root.position.copy(actor.currentPos);
          root.rotation.set(0, config.initialFacing, 0);

          const landAction = actions.get(config.landingClip);
          const idleAction = actions.get(config.idleClip);

          if (landAction) {
            actor.currentAction?.fadeOut(0.15);
            landAction.reset().setLoop(THREE.LoopOnce, 1);
            landAction.clampWhenFinished = true;
            landAction.fadeIn(0.15).play();
            actor.currentAction = landAction;

            // When landing clip ends, blend smoothly into idle
            setTimeout(() => {
              actor.hasFinishedLanding = true;
              if (idleAction) {
                landAction.fadeOut(0.3);
                idleAction.reset().fadeIn(0.3).play();
                actor.currentAction = idleAction;
              }
            }, 1100);
          } else if (idleAction) {
            actor.currentAction?.fadeOut(0.2);
            idleAction.reset().fadeIn(0.2).play();
            actor.currentAction = idleAction;
            actor.hasFinishedLanding = true;
          }
        }

        mixer.update(delta);
      }
      return;
    }

    // ----------------------------------------------------
    // PHASE 2: NATURAL ROAMING & IDLE (t >= 5.5s)
    // ----------------------------------------------------
    // Ensure magic artifacts are fully hidden
    if (magicCircleRef.current) magicCircleRef.current.visible = false;
    if (magicParticlesRef.current) magicParticlesRef.current.visible = false;
    if (magicLightRef.current) magicLightRef.current.intensity = 0;

    for (const actor of actors) {
      const { root, mixer, config } = actor;

      // Handle roaming AI
      if (elapsed > actor.nextRoamTime && actor.hasFinishedLanding) {
        if (!actor.isWalking) {
          // Pick a new destination within patrol bounds
          const targetX = THREE.MathUtils.lerp(
            config.patrolBounds.minX,
            config.patrolBounds.maxX,
            Math.random()
          );
          const targetZ = THREE.MathUtils.lerp(
            config.patrolBounds.minZ,
            config.patrolBounds.maxZ,
            Math.random()
          );

          actor.targetPos.set(targetX, config.homePos[1], targetZ);

          // Calculate facing angle towards target
          const dx = targetX - actor.currentPos.x;
          const dz = targetZ - actor.currentPos.z;
          actor.targetFacing = Math.atan2(dx, dz);
          actor.isWalking = true;
        }
      }

      // Movement execution
      if (actor.isWalking) {
        // Smoothly rotate towards movement direction
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 4.0, delta);
        root.rotation.set(0, actor.facing, 0);

        // Move towards target position at gentle stroll speed
        const walkSpeed = 0.75 * delta;
        actor.currentPos.lerp(actor.targetPos, THREE.MathUtils.clamp(walkSpeed, 0, 0.2));
        root.position.copy(actor.currentPos);

        // Check if reached destination
        const dist = actor.currentPos.distanceTo(actor.targetPos);
        if (dist < 0.15) {
          actor.isWalking = false;
          // Next roam in 6 to 14 seconds (mostly peaceful idle watching)
          actor.nextRoamTime = elapsed + 6.0 + Math.random() * 8.0;

          // Face naturally toward the floating project cubes (facing -Z / forward)
          actor.targetFacing = (Math.random() - 0.5) * 0.4;
        }
      } else {
        // Idling: gently face towards the cubes or companions
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 2.5, delta);
        root.rotation.set(0, actor.facing, 0);
      }

      mixer.update(delta);
    }
  });

  return (
    <group ref={rootGroupRef} name="ShowcaseCharactersContainer">
      {/* Container for the 4 Characters & Frieren's temporary magic effect */}
    </group>
  );
};
