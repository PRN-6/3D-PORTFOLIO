import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';
import { PROJECTS_DATA } from '../../data/projectsData';

export interface ShowcaseCharactersProps {
  onOccupiedCubesChange?: (indices: number[]) => void;
}

interface AssignedCharacter {
  name: 'Frieren' | 'Himmel' | 'Heiter' | 'Eisen';
  cubeIndex: number;
  // Landing coordinates on the foreground floor
  groundPos: [number, number, number];
  patrolBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// 4 Assigned Characters on 4 Existing Cubes with balanced foreground spacing
const ASSIGNMENTS: AssignedCharacter[] = [
  {
    name: 'Frieren',
    cubeIndex: 1, // cubix68 (upper left)
    groundPos: [-0.9, -1.7, 6.0],
    patrolBounds: { minX: -1.7, maxX: -0.2, minZ: 5.8, maxZ: 6.4 },
  },
  {
    name: 'Himmel',
    cubeIndex: 2, // code68 (upper right)
    groundPos: [0.9, -1.7, 6.0],
    patrolBounds: { minX: 0.2, maxX: 1.7, minZ: 5.8, maxZ: 6.4 },
  },
  {
    name: 'Heiter',
    cubeIndex: 5, // programmer66 (mid left)
    groundPos: [2.8, -1.7, 6.2],
    patrolBounds: { minX: 1.9, maxX: 3.8, minZ: 6.0, maxZ: 6.6 },
  },
  {
    name: 'Eisen',
    cubeIndex: 6, // web68 (mid right)
    groundPos: [-2.8, -1.7, 6.2],
    patrolBounds: { minX: -3.8, maxX: -1.9, minZ: 6.0, maxZ: 6.6 },
  },
];

interface ActorRuntime {
  name: string;
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  palette: ReturnType<typeof createPartyPalette>;
  paint?: ReturnType<ReturnType<typeof createPartyPalette>['dress']>;
  assignment: AssignedCharacter;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  facing: number;
  targetFacing: number;
  hasLanded: boolean;
  hasFinishedLanding: boolean;
  isWalking: boolean;
  nextRoamTime: number;
  cubeBasePos: THREE.Vector3;
  cubeTopY: number;
  cubePhase: number;
}

export const ShowcaseCharacters: React.FC<ShowcaseCharactersProps> = ({
  onOccupiedCubesChange,
}) => {
  const { size } = useThree();
  const isMobile = size.width < 768;
  // Scaled down to ~35% of previous 1.45 (1.45 * 0.35 = 0.5075)
  // Responsive: 0.51 on desktop (~10-11% viewport height), 0.44 on mobile
  const characterScale = isMobile ? 0.44 : 0.51;

  const rootGroupRef = useRef<THREE.Group>(null);
  const actorsRef = useRef<ActorRuntime[]>([]);
  const startTimeRef = useRef<number | null>(null);

  // Load character and magic GLB models
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

  // Magic circle underneath cubes
  const magicCircleRef = useRef<THREE.Object3D | null>(null);
  const magicLightRef = useRef<THREE.PointLight | null>(null);
  const magicParticlesRef = useRef<THREE.Points | null>(null);

  // Initialize magic circle, light and particles
  useEffect(() => {
    if (!rootGroupRef.current) return;
    const group = rootGroupRef.current;

    // 1. Magic Circle GLTF
    const circle = magicGltf.scene.clone(true);
    circle.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.Material).clone();
        mat.transparent = true;
        mat.depthWrite = false;
        mesh.material = mat;
      }
    });
    circle.scale.set(0.001, 0.001, 0.001);
    circle.position.set(0, -0.6, 0);
    circle.visible = false;
    group.add(circle);
    magicCircleRef.current = circle;

    // 2. Magical point light
    const pLight = new THREE.PointLight('#cdb8ff', 0, 18, 1.8);
    pLight.position.set(0, 0.5, 0);
    group.add(pLight);
    magicLightRef.current = pLight;

    // 3. Circulating particles (double-helix starlight)
    const pCount = 90;
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const gold = new THREE.Color('#ffe2a2');
    const violet = new THREE.Color('#cdb8ff');

    for (let i = 0; i < pCount; i++) {
      (i % 2 === 0 ? gold : violet).toArray(pColors, i * 3);
      const angle = (i / pCount) * Math.PI * 4;
      const r = 2.5 + (i % 4) * 0.4;
      pPos[i * 3] = Math.cos(angle) * r;
      pPos[i * 3 + 1] = -1.2 + (i / pCount) * 7.5;
      pPos[i * 3 + 2] = Math.sin(angle) * r;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(pGeo, pMat);
    points.visible = false;
    group.add(points);
    magicParticlesRef.current = points;

    return () => {
      circle.removeFromParent();
      pLight.removeFromParent();
      points.removeFromParent();
      pGeo.dispose();
      pMat.dispose();
    };
  }, [magicGltf]);

  // Initialize the 4 Characters
  useEffect(() => {
    if (!rootGroupRef.current) return;
    const group = rootGroupRef.current;
    const actors: ActorRuntime[] = [];

    // Notify caller that these 4 cubes are occupied
    onOccupiedCubesChange?.(ASSIGNMENTS.map((a) => a.cubeIndex));

    for (const assignment of ASSIGNMENTS) {
      const gltf = gltfMap[assignment.name];
      const clone = cloneSkeleton(gltf.scene);
      const root = clone.getObjectByName(assignment.name) || clone;

      const palette = createPartyPalette();
      const paint = palette.dress(root);

      clone.scale.set(characterScale, characterScale, characterScale);
      clone.visible = false; // Hidden until materialization

      group.add(clone);

      const mixer = new THREE.AnimationMixer(clone);
      const actions = new Map<string, THREE.AnimationAction>();

      for (const clip of gltf.animations) {
        const action = mixer.clipAction(clip);
        actions.set(clip.name, action);
      }

      // Calculate cube world surface: CubeShowcase has position [0, 1.2, 0]
      const project = PROJECTS_DATA[assignment.cubeIndex];
      const cubeBasePos = new THREE.Vector3(
        project.position[0],
        project.position[1] + 1.2,
        project.position[2]
      );
      const cubeTopY = cubeBasePos.y + project.size / 2;
      const cubePhase = assignment.cubeIndex * 1.35;

      // Start position directly above assigned cube with proportionate hover offset
      const startPos = new THREE.Vector3(cubeBasePos.x, cubeTopY + 0.65, cubeBasePos.z);
      clone.position.copy(startPos);

      // Start with idle clip ready
      const idleAction = actions.get(`${assignment.name.toLowerCase()}_idle`);
      if (idleAction) {
        idleAction.play();
      }

      actors.push({
        name: assignment.name,
        root: clone,
        mixer,
        actions,
        palette,
        paint,
        assignment,
        currentPos: startPos.clone(),
        targetPos: startPos.clone(),
        facing: 0,
        targetFacing: 0,
        hasLanded: false,
        hasFinishedLanding: false,
        isWalking: false,
        nextRoamTime: 12.0 + Math.random() * 4.0,
        cubeBasePos,
        cubeTopY,
        cubePhase,
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
  }, [gltfMap, onOccupiedCubesChange]);

  // Main animation frame controller across the sequence phases
  useFrame((state, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const actors = actorsRef.current;
    if (actors.length === 0) return;

    // Maintain responsive scale across all screen resizes
    for (const actor of actors) {
      actor.root.scale.set(characterScale, characterScale, characterScale);
    }

    // -------------------------------------------------------------------------
    // PHASE 1: MATERIALIZATION ON TOP OF CUBES (t = 0.8s -> 2.2s)
    // -------------------------------------------------------------------------
    if (elapsed < 2.2) {
      const matProgress = THREE.MathUtils.smoothstep(elapsed, 0.8, 2.2);

      for (const actor of actors) {
        if (elapsed >= 0.8) {
          actor.root.visible = true;
        }

        // Cube gentle bobbing
        const tClock = state.clock.getElapsedTime();
        const bobY = Math.sin(tClock * 0.8 + actor.cubePhase) * 0.22;
        const bobX = Math.cos(tClock * 0.6 + actor.cubePhase) * 0.12;

        // Touchdown from Y_top + 0.65 down onto Y_top
        const dropOffset = (1.0 - matProgress) * 0.65;
        actor.currentPos.set(
          actor.cubeBasePos.x + bobX,
          actor.cubeTopY + bobY + dropOffset,
          actor.cubeBasePos.z
        );
        actor.root.position.copy(actor.currentPos);
        actor.root.rotation.set(0, 0, 0);

        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 2: CUBE IDLE STANDING (t = 2.2s -> 4.0s)
    // Characters stand gracefully on top of cubes, feet aligned with cube tops
    // -------------------------------------------------------------------------
    if (elapsed < 4.0) {
      const tClock = state.clock.getElapsedTime();

      for (const actor of actors) {
        actor.root.visible = true;

        const bobY = Math.sin(tClock * 0.8 + actor.cubePhase) * 0.22;
        const bobX = Math.cos(tClock * 0.6 + actor.cubePhase) * 0.12;

        // Feet 100% aligned with flat cube top face
        actor.currentPos.set(
          actor.cubeBasePos.x + bobX,
          actor.cubeTopY + bobY,
          actor.cubeBasePos.z
        );
        actor.root.position.copy(actor.currentPos);

        // Subtle natural body yaw looking out at the project universe
        const subtleYaw = Math.sin(tClock * 0.5 + actor.cubePhase) * 0.12;
        actor.root.rotation.set(0, subtleYaw, 0);

        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 3: FRIEREN'S SECOND MAGIC SPELL (t = 4.0s -> 5.5s)
    // Frieren raises her staff; magic circle blooms beneath the cubes;
    // Golden & pale violet particles circulate.
    // -------------------------------------------------------------------------
    if (elapsed < 5.5) {
      const tClock = state.clock.getElapsedTime();

      // Deploy magic circle underneath the cubes
      if (magicCircleRef.current) {
        magicCircleRef.current.visible = true;
        const circleScale = THREE.MathUtils.smoothstep(elapsed, 4.0, 5.2) * 13.0;
        magicCircleRef.current.scale.set(circleScale, circleScale, circleScale);
        magicCircleRef.current.rotation.y += delta * 0.5;

        magicCircleRef.current.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.opacity = THREE.MathUtils.smoothstep(elapsed, 4.0, 4.8);
          }
        });
      }

      if (magicLightRef.current) {
        magicLightRef.current.intensity = THREE.MathUtils.smoothstep(elapsed, 4.0, 5.2) * 4.0;
      }

      // Circulate particles
      if (magicParticlesRef.current) {
        magicParticlesRef.current.visible = true;
        const mat = magicParticlesRef.current.material as THREE.PointsMaterial;
        mat.opacity = THREE.MathUtils.smoothstep(elapsed, 4.2, 5.2) * 0.8;
      }

      for (const actor of actors) {
        const bobY = Math.sin(tClock * 0.8 + actor.cubePhase) * 0.22;
        const bobX = Math.cos(tClock * 0.6 + actor.cubePhase) * 0.12;

        actor.currentPos.set(
          actor.cubeBasePos.x + bobX,
          actor.cubeTopY + bobY,
          actor.cubeBasePos.z
        );
        actor.root.position.copy(actor.currentPos);

        // Frieren transitions into casting pose (raising staff)
        if (actor.name === 'Frieren') {
          const castAction = actor.actions.get('frieren_magic_land');
          const idleAction = actor.actions.get('frieren_idle');
          if (castAction && idleAction && !castAction.isRunning()) {
            castAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
            idleAction.crossFadeTo(castAction, 0.4, false);
          }
        }

        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 4: GENTLE LIFT-OFF & FLOAT DESCENT (t = 5.5s -> 8.2s)
    // Cubes stay in place; characters float down toward ground foreground
    // -------------------------------------------------------------------------
    if (elapsed < 8.2) {
      // Notify caller that cubes are no longer occupied, allowing full rotation
      onOccupiedCubesChange?.([]);

      // Rotate magic circle
      if (magicCircleRef.current) {
        magicCircleRef.current.rotation.y += delta * 0.6;
      }

      const u = THREE.MathUtils.clamp((elapsed - 5.5) / 2.7, 0, 1);
      // Cubic ease-out deceleration curve
      const easeOut = 1 - Math.pow(1 - u, 3);
      // Small initial lift-off arc proportionate to chibi scale
      const lift = Math.sin(u * Math.PI) * 0.18;

      for (const actor of actors) {
        const [targetX, targetY, targetZ] = actor.assignment.groundPos;

        // Interpolate smoothly from cube top to ground position
        const currentX = THREE.MathUtils.lerp(actor.cubeBasePos.x, targetX, easeOut);
        const currentY = THREE.MathUtils.lerp(actor.cubeTopY, targetY, easeOut) + lift;
        const currentZ = THREE.MathUtils.lerp(actor.cubeBasePos.z, targetZ, easeOut);

        actor.currentPos.set(currentX, currentY, currentZ);
        actor.root.position.copy(actor.currentPos);

        // Switch to appropriate falling/floating pose if not already active
        const fallClip = actor.actions.get(`${actor.name.toLowerCase()}_fall`);
        const idleClip = actor.actions.get(`${actor.name.toLowerCase()}_idle`);
        if (actor.name !== 'Frieren' && fallClip && idleClip && !fallClip.isRunning()) {
          fallClip.reset().setLoop(THREE.LoopRepeat, Infinity).play();
          idleClip.crossFadeTo(fallClip, 0.3, false);
        }

        // Slight float rotation tilt
        const wobble = Math.sin(elapsed * 1.5 + actor.cubePhase) * 0.05;
        actor.root.rotation.set(0, wobble, 0);

        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 5: INDIVIDUAL DISTINCT LANDING MOMENTS (t = 8.2s -> 10.2s)
    // Eisen lands first, then Himmel, then Heiter, then Frieren
    // -------------------------------------------------------------------------
    if (elapsed < 10.2) {
      // Individual touchdown milestones
      const landingTimes: Record<string, number> = {
        Eisen: 8.3,
        Himmel: 8.6,
        Heiter: 8.9,
        Frieren: 9.2,
      };

      for (const actor of actors) {
        const landTime = landingTimes[actor.name] ?? 8.5;
        const [targetX, targetY, targetZ] = actor.assignment.groundPos;

        if (elapsed >= landTime && !actor.hasLanded) {
          actor.hasLanded = true;
          actor.currentPos.set(targetX, targetY, targetZ);
          actor.root.position.copy(actor.currentPos);
          actor.root.rotation.set(0, 0, 0);

          // Play individual landing animation
          const landAction = actor.actions.get(`${actor.name.toLowerCase()}_landing`);
          const prevAction =
            actor.name === 'Frieren'
              ? actor.actions.get('frieren_magic_land')
              : actor.actions.get(`${actor.name.toLowerCase()}_fall`);

          if (landAction) {
            landAction.reset().setLoop(THREE.LoopOnce, 1);
            landAction.clampWhenFinished = true;
            landAction.play();
            if (prevAction) {
              prevAction.crossFadeTo(landAction, 0.15, false);
            }
          }

          // Character personality details
          if (actor.name === 'Heiter') {
            actor.paint?.setExpression('speaking'); // Surprised stumble
          }
        } else if (!actor.hasLanded) {
          // Still in final descent
          const approachU = THREE.MathUtils.clamp((elapsed - 8.2) / (landTime - 8.2 + 0.001), 0, 1);
          const currentY = THREE.MathUtils.lerp(targetY + 0.12, targetY, approachU);
          actor.currentPos.set(targetX, currentY, targetZ);
          actor.root.position.copy(actor.currentPos);
        } else if (actor.hasLanded && !actor.hasFinishedLanding) {
          // Transition from landing to idle
          const landAction = actor.actions.get(`${actor.name.toLowerCase()}_landing`);
          const idleAction = actor.actions.get(`${actor.name.toLowerCase()}_idle`);

          // Landing clip duration is ~1.1s
          if (elapsed >= landTime + 0.95 && idleAction) {
            actor.hasFinishedLanding = true;
            idleAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
            if (landAction) {
              landAction.crossFadeTo(idleAction, 0.35, false);
            }
            if (actor.name === 'Heiter') {
              actor.paint?.setExpression('smile'); // Happy recovery
            }
          }
        }

        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 6: MAGIC CLEANUP (t = 10.2s -> 11.2s)
    // Magic circle & particles fade out to 0 opacity
    // -------------------------------------------------------------------------
    if (elapsed < 11.2) {
      const fadeProgress = (elapsed - 10.2) / 1.0;
      const opacity = Math.max(0, 1.0 - fadeProgress);

      if (magicCircleRef.current) {
        magicCircleRef.current.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.opacity = opacity;
          }
        });
        if (opacity <= 0.05) {
          magicCircleRef.current.visible = false;
        }
      }

      if (magicLightRef.current) {
        magicLightRef.current.intensity = opacity * 3.0;
      }

      if (magicParticlesRef.current) {
        const mat = magicParticlesRef.current.material as THREE.PointsMaterial;
        mat.opacity = opacity * 0.8;
        if (opacity <= 0.05) {
          magicParticlesRef.current.visible = false;
        }
      }

      for (const actor of actors) {
        actor.mixer.update(delta);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // PHASE 7: NATURAL AUTONOMOUS ROAMING (t >= 11.2s)
    // Characters explore foreground sectors, look at project cubes & companions
    // -------------------------------------------------------------------------
    // Ensure all magic visuals are completely removed
    if (magicCircleRef.current) magicCircleRef.current.visible = false;
    if (magicParticlesRef.current) magicParticlesRef.current.visible = false;
    if (magicLightRef.current) magicLightRef.current.intensity = 0;

    for (const actor of actors) {
      const bounds = actor.assignment.patrolBounds;

      // Roaming destination selection
      if (elapsed > actor.nextRoamTime && !actor.isWalking) {
        const targetX = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random());
        const targetZ = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random());

        actor.targetPos.set(targetX, actor.assignment.groundPos[1], targetZ);

        const dx = targetX - actor.currentPos.x;
        const dz = targetZ - actor.currentPos.z;
        actor.targetFacing = Math.atan2(dx, dz);
        actor.isWalking = true;
      }

      // Movement execution
      if (actor.isWalking) {
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 4.0, delta);
        actor.root.rotation.set(0, actor.facing, 0);

        const walkStep = 0.38 * delta;
        actor.currentPos.lerp(actor.targetPos, THREE.MathUtils.clamp(walkStep, 0, 0.15));
        actor.root.position.copy(actor.currentPos);

        if (actor.currentPos.distanceTo(actor.targetPos) < 0.1) {
          actor.isWalking = false;
          // Next gentle roam in 7 to 15 seconds
          actor.nextRoamTime = elapsed + 7.0 + Math.random() * 8.0;
          // Face naturally toward the floating project cubes
          actor.targetFacing = (Math.random() - 0.5) * 0.35;
        }
      } else {
        // Idle gentle gaze toward project cubes
        actor.facing = THREE.MathUtils.damp(actor.facing, actor.targetFacing, 2.5, delta);
        actor.root.rotation.set(0, actor.facing, 0);
      }

      actor.mixer.update(delta);
    }
  });

  return (
    <group ref={rootGroupRef} name="ShowcaseCharactersContainer">
      {/* 4 Chibi Characters & Temporary Magic Circles / Light */}
    </group>
  );
};
