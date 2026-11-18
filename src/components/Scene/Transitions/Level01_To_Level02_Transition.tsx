import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { WorldA_HeroIsland } from '../WorldA_HeroIsland';
import { WorldC_ArchiveIsland } from '../WorldC_ArchiveIsland';
import { WorldD_WhisperingForest } from '../WorldD_WhisperingForest';
import {
  MagicalFloatingStairs,
  DEFAULT_STAIRCASE_CONFIG,
  getStaircaseTotalDuration,
} from './MagicalFloatingStairs';
import type { WorldState } from '../Scene';
import type { GrimoireItem } from '../../../data/archiveData';
import type { ForestLandmark } from '../Forest/ForestCameraController';

export interface Level01ToLevel02TransitionProps {
  worldState: WorldState;
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
  selectedGrimoire?: GrimoireItem | null;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
  onOpenAboutModal?: () => void;
  isAboutModalOpen?: boolean;
  focusedForestLandmark?: ForestLandmark;
  onTransitionToArchiveComplete?: () => void;
  onTransitionFromArchiveToHomeComplete?: () => void;
  onTransitionToForestComplete?: () => void;
  onTransitionFromForestToArchiveComplete?: () => void;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * MultiLevelFantasyWorldManager (Level01_To_Level02_Transition)
 *
 * Connected Vertical Multi-Level Architecture:
 * - Level 01: Hero's Home (Island 01)
 * - Level 02: Grand Mage's Archive (Island 02)
 * - Level 03: Whispering Forest (Island 03)
 *
 * Performance Architecture:
 * 1. Persistent World Instances: All three islands stay in memory. Zero unmount/remount stalls.
 * 2. Background Shader Pre-compilation: WebGL shaders for all 3 worlds compiled upfront.
 * 3. Consistent Lighting: Preserved unified lighting environment.
 * 4. Zero-React-State Frame Loop: Animates purely via Three.js node matrices in useFrame.
 * 5. Shadow Caching: Freezes shadow map auto-updates during camera flights.
 */
export const Level01_To_Level02_Transition: React.FC<Level01ToLevel02TransitionProps> = ({
  worldState,
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
  selectedGrimoire = null,
  onSelectGrimoire = () => {},
  onOpenAboutModal = () => {},
  isAboutModalOpen = false,
  focusedForestLandmark = 'overview',
  onTransitionToArchiveComplete = () => {},
  onTransitionFromArchiveToHomeComplete = () => {},
  onTransitionToForestComplete = () => {},
  onTransitionFromForestToArchiveComplete = () => {},
}) => {
  const { camera, size, gl, scene } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const homeGroupRef = useRef<THREE.Group>(null);
  const archiveGroupRef = useRef<THREE.Group>(null);
  const forestGroupRef = useRef<THREE.Group>(null);
  const stairsHomeToArchiveRef = useRef<THREE.Group>(null);
  const stairsArchiveToForestRef = useRef<THREE.Group>(null);

  const transitionProgressRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const activePhaseRef = useRef<'HOME_ARCHIVE' | 'ARCHIVE_FOREST'>('HOME_ARCHIVE');
  const activeDirectionRef = useRef<'FORWARD' | 'BACKWARD'>('FORWARD');

  // Total transition duration synchronized with slow, sequential staircase assembly
  const duration = getStaircaseTotalDuration(DEFAULT_STAIRCASE_CONFIG); // 17.0s default

  // ---------------------------------------------------------------------------
  // Camera Waypoints for Vertical Navigation
  // ---------------------------------------------------------------------------
  const { homeCamPos, homeTarget, archiveCamPos, archiveTarget, forestCamPos, forestTarget } =
    useMemo(() => {
      // 1. Hero's Home Default Framing
      const homeCamPos = isMobile
        ? new THREE.Vector3(12.5, 12.0, 12.5)
        : isTablet
        ? new THREE.Vector3(13.0, 11.0, 13.0)
        : new THREE.Vector3(14.0, 10.0, 14.0);
      const homeTarget = isMobile
        ? new THREE.Vector3(0.0, 1.0, 0.0)
        : new THREE.Vector3(0.0, 0.5, 0.0);

      // 2. Grand Mage's Archive Predetermined Frontal View
      const archiveCamPos = isMobile
        ? new THREE.Vector3(0.0, 10.8, 28.5)
        : isTablet
        ? new THREE.Vector3(0.0, 10.0, 26.5)
        : new THREE.Vector3(0.0, 9.2, 23.5);
      const archiveTarget = new THREE.Vector3(0.0, 2.0, 0.0);

      // 3. Whispering Forest Scenic Overview Framing
      const forestCamPos = isMobile
        ? new THREE.Vector3(22.0, 16.0, 26.0)
        : isTablet
        ? new THREE.Vector3(21.0, 16.0, 25.0)
        : new THREE.Vector3(19.0, 15.0, 23.0);
      const forestTarget = isMobile
        ? new THREE.Vector3(0.0, 1.0, 0.0)
        : new THREE.Vector3(0.0, 1.2, 0.0);

      return { homeCamPos, homeTarget, archiveCamPos, archiveTarget, forestCamPos, forestTarget };
    }, [isMobile, isTablet]);

  // ---------------------------------------------------------------------------
  // Archive -> Forest Curved Sky Spline (Connecting terrace to ForestArrivalAnchor)
  // ---------------------------------------------------------------------------
  const forestStairPoints = useMemo(() => [
    new THREE.Vector3(-3.0, 2.5, 5.8),   // Archive terrace edge
    new THREE.Vector3(-5.2, 6.5, 3.2),   // Rising into sky
    new THREE.Vector3(-6.8, 12.0, -1.5), // Sweeping high around open sky
    new THREE.Vector3(-3.5, 17.5, -6.0), // High vista apex
    new THREE.Vector3(2.5, 22.0, -2.5),  // Approaching forest elevation
    new THREE.Vector3(2.0, 26.0, 2.5),   // Approaching ceremonial gateway
    new THREE.Vector3(0.8, 28.0, 7.8),   // Meeting platform-decorative.glb
    new THREE.Vector3(0.8, 28.2, 6.3),   // Connecting to ceremonial stairs at ForestArrivalAnchor
  ], []);

  // ---------------------------------------------------------------------------
  // Precompile All Scene Shaders for ALL 3 WORLDS During Idle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (
          archiveGroupRef.current &&
          forestGroupRef.current &&
          stairsHomeToArchiveRef.current &&
          stairsArchiveToForestRef.current
        ) {
          const prevArchVis = archiveGroupRef.current.visible;
          const prevForestVis = forestGroupRef.current.visible;
          const prevStairs1Vis = stairsHomeToArchiveRef.current.visible;
          const prevStairs2Vis = stairsArchiveToForestRef.current.visible;

          archiveGroupRef.current.visible = true;
          forestGroupRef.current.visible = true;
          stairsHomeToArchiveRef.current.visible = true;
          stairsArchiveToForestRef.current.visible = true;

          // Wide-angle omni-camera encompassing entire vertical world column (Y = 0 to Y = 60)
          const compileCam = new THREE.PerspectiveCamera(140, 1, 0.1, 1000);
          compileCam.position.set(0, 28, 55);
          compileCam.lookAt(0, 28, 0);
          compileCam.updateMatrixWorld();

          // Force all meshes to compile
          const culledMeshes: THREE.Mesh[] = [];
          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              if ((obj as THREE.Mesh).frustumCulled) {
                culledMeshes.push(obj as THREE.Mesh);
                (obj as THREE.Mesh).frustumCulled = false;
              }
            }
          });

          scene.updateMatrixWorld(true);
          gl.compile(scene, compileCam);

          culledMeshes.forEach((mesh) => {
            mesh.frustumCulled = true;
          });

          archiveGroupRef.current.visible = prevArchVis;
          forestGroupRef.current.visible = prevForestVis;
          stairsHomeToArchiveRef.current.visible = prevStairs1Vis;
          stairsArchiveToForestRef.current.visible = prevStairs2Vis;

          console.log('[LevelTransition] ALL 3 Worlds shaders pre-warmed into WebGL cache!');
        }
      } catch (e) {
        console.warn('[LevelTransition] Shader pre-warm warning:', e);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [gl, scene]);

  // ---------------------------------------------------------------------------
  // Handle Transition State Changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (worldState === 'TRANSITION_HOME_TO_ARCHIVE') {
      startTimeRef.current = null;
      isTransitioningRef.current = true;
      activePhaseRef.current = 'HOME_ARCHIVE';
      activeDirectionRef.current = 'FORWARD';
      transitionProgressRef.current = 0;

      if (homeGroupRef.current) homeGroupRef.current.visible = true;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = true;
      if (forestGroupRef.current) forestGroupRef.current.visible = true;
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = true;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = false;

      if (gl.shadowMap) gl.shadowMap.autoUpdate = false;
    } else if (worldState === 'TRANSITION_ARCHIVE_TO_HOME') {
      startTimeRef.current = null;
      isTransitioningRef.current = true;
      activePhaseRef.current = 'HOME_ARCHIVE';
      activeDirectionRef.current = 'BACKWARD';
      transitionProgressRef.current = 1;

      if (homeGroupRef.current) homeGroupRef.current.visible = true;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = true;
      if (forestGroupRef.current) forestGroupRef.current.visible = true;
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = true;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = false;

      if (gl.shadowMap) gl.shadowMap.autoUpdate = false;
    } else if (worldState === 'TRANSITION_ARCHIVE_TO_FOREST') {
      startTimeRef.current = null;
      isTransitioningRef.current = true;
      activePhaseRef.current = 'ARCHIVE_FOREST';
      activeDirectionRef.current = 'FORWARD';
      transitionProgressRef.current = 0;

      if (homeGroupRef.current) homeGroupRef.current.visible = true;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = true;
      if (forestGroupRef.current) forestGroupRef.current.visible = true;
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = false;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = true;

      if (gl.shadowMap) gl.shadowMap.autoUpdate = false;
    } else if (worldState === 'TRANSITION_FOREST_TO_ARCHIVE') {
      startTimeRef.current = null;
      isTransitioningRef.current = true;
      activePhaseRef.current = 'ARCHIVE_FOREST';
      activeDirectionRef.current = 'BACKWARD';
      transitionProgressRef.current = 1;

      if (homeGroupRef.current) homeGroupRef.current.visible = true;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = true;
      if (forestGroupRef.current) forestGroupRef.current.visible = true;
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = false;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = true;

      if (gl.shadowMap) gl.shadowMap.autoUpdate = false;
    } else if (worldState === 'HOME_IDLE') {
      isTransitioningRef.current = false;
      transitionProgressRef.current = 0;

      if (homeGroupRef.current) {
        homeGroupRef.current.position.set(0, 0, 0);
        homeGroupRef.current.visible = true;
      }
      if (archiveGroupRef.current) {
        archiveGroupRef.current.position.set(0, 28, 0);
        archiveGroupRef.current.visible = true;
      }
      if (forestGroupRef.current) {
        forestGroupRef.current.position.set(0, 56, 0);
        forestGroupRef.current.visible = true;
      }
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = false;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = false;

      if (gl.shadowMap) {
        gl.shadowMap.autoUpdate = true;
        gl.shadowMap.needsUpdate = true;
      }
    } else if (worldState === 'ARCHIVE_WORLD') {
      isTransitioningRef.current = false;
      transitionProgressRef.current = 1;

      if (homeGroupRef.current) {
        homeGroupRef.current.position.set(0, -28, 0);
        homeGroupRef.current.visible = true;
      }
      if (archiveGroupRef.current) {
        archiveGroupRef.current.position.set(0, 0, 0);
        archiveGroupRef.current.visible = true;
      }
      if (forestGroupRef.current) {
        forestGroupRef.current.position.set(0, 28, 0);
        forestGroupRef.current.visible = true;
      }
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = false;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = false;

      if (gl.shadowMap) {
        gl.shadowMap.autoUpdate = true;
        gl.shadowMap.needsUpdate = true;
      }
    } else if (worldState === 'FOREST_WORLD') {
      isTransitioningRef.current = false;
      transitionProgressRef.current = 1;

      if (homeGroupRef.current) {
        homeGroupRef.current.position.set(0, -56, 0);
        homeGroupRef.current.visible = true;
      }
      if (archiveGroupRef.current) {
        archiveGroupRef.current.position.set(0, -28, 0);
        archiveGroupRef.current.visible = true;
      }
      if (forestGroupRef.current) {
        forestGroupRef.current.position.set(0, 0, 0);
        forestGroupRef.current.visible = true;
      }
      if (stairsHomeToArchiveRef.current) stairsHomeToArchiveRef.current.visible = false;
      if (stairsArchiveToForestRef.current) stairsArchiveToForestRef.current.visible = false;

      if (gl.shadowMap) {
        gl.shadowMap.autoUpdate = true;
        gl.shadowMap.needsUpdate = true;
      }
    }
  }, [worldState, gl]);

  // ---------------------------------------------------------------------------
  // Zero-React-State Frame Loop
  // ---------------------------------------------------------------------------
  useFrame((state) => {
    if (!isTransitioningRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
      return;
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const forcedProgress =
      typeof window !== 'undefined' ? (window as any).__FORCE_TRANSITION_PROGRESS__ : undefined;

    const rawProgress =
      typeof forcedProgress === 'number'
        ? forcedProgress
        : THREE.MathUtils.clamp(elapsed / duration, 0, 1);

    const eased = easeInOutCubic(rawProgress);
    const isForward = activeDirectionRef.current === 'FORWARD';
    const isHomeArchive = activePhaseRef.current === 'HOME_ARCHIVE';

    const forwardRaw = isForward ? rawProgress : 1 - rawProgress;
    const forwardEased = isForward ? eased : 1 - eased;

    transitionProgressRef.current = forwardRaw;

    if (isHomeArchive) {
      // 1. HOME <-> ARCHIVE TRANSITION
      const homeY = THREE.MathUtils.lerp(0, -28, forwardEased);
      const archiveY = THREE.MathUtils.lerp(28, 0, forwardEased);
      const forestY = THREE.MathUtils.lerp(56, 28, forwardEased);

      if (homeGroupRef.current) homeGroupRef.current.position.set(0, homeY, 0);
      if (archiveGroupRef.current) archiveGroupRef.current.position.set(0, archiveY, 0);
      if (forestGroupRef.current) forestGroupRef.current.position.set(0, forestY, 0);

      if (stairsHomeToArchiveRef.current) {
        stairsHomeToArchiveRef.current.position.set(0, homeY, 0);
        stairsHomeToArchiveRef.current.visible = forwardEased > 0.01 && forwardEased < 0.98;
      }

      // Camera: smooth, monotonic, independent upward rise from Home to Archive
      const s = THREE.MathUtils.clamp(forwardEased, 0, 1);
      const curTargetX = THREE.MathUtils.lerp(homeTarget.x, archiveTarget.x, s);
      const curTargetY = THREE.MathUtils.lerp(homeTarget.y, archiveTarget.y, s);
      const curTargetZ = THREE.MathUtils.lerp(homeTarget.z, archiveTarget.z, s);

      // Smooth straight upward movement independently without tracking individual stairs
      const curCamX = THREE.MathUtils.lerp(homeCamPos.x, archiveCamPos.x, s);
      const curCamY = THREE.MathUtils.lerp(homeCamPos.y, archiveCamPos.y, s);
      const curCamZ = THREE.MathUtils.lerp(homeCamPos.z, archiveCamPos.z, s);

      camera.position.set(curCamX, curCamY, curCamZ);
      camera.lookAt(curTargetX, curTargetY, curTargetZ);

      if (rawProgress >= 1.0 && typeof forcedProgress !== 'number') {
        isTransitioningRef.current = false;
        if (isForward) {
          onTransitionToArchiveComplete();
        } else {
          onTransitionFromArchiveToHomeComplete();
        }
      }
    } else {
      // 2. ARCHIVE <-> FOREST TRANSITION
      const homeY = THREE.MathUtils.lerp(-28, -56, forwardEased);
      const archiveY = THREE.MathUtils.lerp(0, -28, forwardEased);
      const forestY = THREE.MathUtils.lerp(28, 0, forwardEased);

      if (homeGroupRef.current) homeGroupRef.current.position.set(0, homeY, 0);
      if (archiveGroupRef.current) archiveGroupRef.current.position.set(0, archiveY, 0);
      if (forestGroupRef.current) forestGroupRef.current.position.set(0, forestY, 0);

      if (stairsArchiveToForestRef.current) {
        stairsArchiveToForestRef.current.position.set(0, archiveY, 0);
        stairsArchiveToForestRef.current.visible = forwardEased > 0.01 && forwardEased < 0.98;
      }

      // Camera: smooth, monotonic, independent upward rise from Archive to Whispering Forest
      const s = THREE.MathUtils.clamp(forwardEased, 0, 1);
      const curTargetX = THREE.MathUtils.lerp(archiveTarget.x, forestTarget.x, s);
      const curTargetY = THREE.MathUtils.lerp(archiveTarget.y, forestTarget.y, s);
      const curTargetZ = THREE.MathUtils.lerp(archiveTarget.z, forestTarget.z, s);

      // Smooth straight upward movement independently without tracking individual stairs
      const curCamX = THREE.MathUtils.lerp(archiveCamPos.x, forestCamPos.x, s);
      const curCamY = THREE.MathUtils.lerp(archiveCamPos.y, forestCamPos.y, s);
      const curCamZ = THREE.MathUtils.lerp(archiveCamPos.z, forestCamPos.z, s);

      camera.position.set(curCamX, curCamY, curCamZ);
      camera.lookAt(curTargetX, curTargetY, curTargetZ);

      if (rawProgress >= 1.0 && typeof forcedProgress !== 'number') {
        isTransitioningRef.current = false;
        if (isForward) {
          onTransitionToForestComplete();
        } else {
          onTransitionFromForestToArchiveComplete();
        }
      }
    }
  });

  return (
    <group name="ConnectedFantasyWorldRoot">
      {/* LEVEL 01: Hero's Home Floating Island */}
      <group ref={homeGroupRef} name="PersistentHomeIslandGroup">
        <WorldA_HeroIsland
          disableCamera={worldState !== 'HOME_IDLE'}
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
          onSelectObject={onSelectObject}
          onHoverObject={onHoverObject}
          onStatusChange={onStatusChange}
        />
      </group>

      {/* MAGICAL FLOATING STAIRS: Home <-> Archive */}
      <group ref={stairsHomeToArchiveRef} name="StairsHomeToArchiveGroup" visible={false}>
        <MagicalFloatingStairs progressRef={transitionProgressRef} />
      </group>

      {/* LEVEL 02: Grand Mage's Archive Floating Island */}
      <group ref={archiveGroupRef} name="PersistentArchiveIslandGroup" visible={true}>
        <WorldC_ArchiveIsland
          disableCamera={worldState !== 'ARCHIVE_WORLD'}
          selectedGrimoire={selectedGrimoire}
          onSelectGrimoire={onSelectGrimoire}
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
        />
      </group>

      {/* MAGICAL FLOATING STAIRS: Archive <-> Whispering Forest (Emerald & Cyan Runes) */}
      <group ref={stairsArchiveToForestRef} name="StairsArchiveToForestGroup" visible={false}>
        <MagicalFloatingStairs
          progressRef={transitionProgressRef}
          customControlPoints={forestStairPoints}
          crystalColor="#a7f3d0"
          emissiveColor="#10b981"
          edgeColor="#38bdf8"
        />
      </group>

      {/* LEVEL 03: Whispering Forest Floating Island */}
      <group ref={forestGroupRef} name="PersistentForestIslandGroup" visible={true}>
        <WorldD_WhisperingForest
          disableCamera={worldState !== 'FOREST_WORLD'}
          onOpenAboutModal={onOpenAboutModal}
          isModalOpen={isAboutModalOpen}
          resetSignal={resetSignal}
          focusedLandmark={focusedForestLandmark}
          onResetComplete={onResetComplete}
        />
      </group>
    </group>
  );
};
