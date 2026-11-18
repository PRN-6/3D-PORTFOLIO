import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { WorldA_HeroIsland } from '../WorldA_HeroIsland';
import { WorldC_ArchiveIsland } from '../WorldC_ArchiveIsland';
import { WorldD_WhisperingForest } from '../WorldD_WhisperingForest';
import { WorldE_RuneWorkshop } from '../WorldE_RuneWorkshop';
import { UnifiedPresentationCameraController } from './UnifiedPresentationCameraController';
import {
  HERO_HOME_EXPLODED_PROFILE,
  ARCHIVE_EXPLODED_PROFILE,
  FOREST_EXPLODED_PROFILE,
  WORKSHOP_EXPLODED_PROFILE,
  getIslandExplodedProfile,
  snapshotOriginalTransforms,
  restoreOriginalTransforms,
  applyExplodedTransform,
  type OriginalTransform,
  type IslandExplodedProfile,
  type DestinationId,
} from './explodedConfig';
import type { WorldState } from '../Scene';
import type { GrimoireItem } from '../../../data/archiveData';
import type { ProjectItem } from '../../../data/projectsData';
import type { ForestLandmark } from '../Forest/ForestCameraController';

export interface ModularExplodedTransitionProps {
  worldState: WorldState;
  activeDestination?: DestinationId;
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
  selectedProject?: ProjectItem | null;
  onSelectProject?: (project: ProjectItem) => void;
  // Handover callbacks
  onTransitionToArchiveComplete?: () => void;
  onTransitionFromArchiveToHomeComplete?: () => void;
  onTransitionToForestComplete?: () => void;
  onTransitionFromForestToArchiveComplete?: () => void;
  onTransitionToWorkshopComplete?: () => void;
  onDestinationReached?: (dest: DestinationId) => void;
}

type TransitionPhase =
  | 'IDLE'
  | 'DISASSEMBLE'
  | 'PAUSE'
  | 'REASSEMBLE'
  | 'HANDOVER';

export const ModularExplodedTransition: React.FC<ModularExplodedTransitionProps> = ({
  worldState,
  activeDestination,
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
  selectedProject = null,
  onSelectProject = () => {},
  onTransitionToArchiveComplete = () => {},
  onTransitionFromArchiveToHomeComplete = () => {},
  onTransitionToForestComplete = () => {},
  onTransitionFromForestToArchiveComplete = () => {},
  onTransitionToWorkshopComplete = () => {},
  onDestinationReached = () => {},
}) => {
  const { camera, gl } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);

  const homeGroupRef = useRef<THREE.Group>(null);
  const archiveGroupRef = useRef<THREE.Group>(null);
  const forestGroupRef = useRef<THREE.Group>(null);
  const workshopGroupRef = useRef<THREE.Group>(null);

  // Original transforms snapshots
  const homeOriginalsRef = useRef<Map<string, OriginalTransform> | null>(null);
  const archiveOriginalsRef = useRef<Map<string, OriginalTransform> | null>(null);
  const forestOriginalsRef = useRef<Map<string, OriginalTransform> | null>(null);
  const workshopOriginalsRef = useRef<Map<string, OriginalTransform> | null>(null);

  // Animation state tracking (pure ref-based, zero React re-renders in useFrame)
  const phaseRef = useRef<TransitionPhase>('IDLE');
  const phaseStartTimeRef = useRef<number>(0);
  const outgoingProfileRef = useRef<IslandExplodedProfile | null>(null);
  const incomingProfileRef = useRef<IslandExplodedProfile | null>(null);
  const outgoingGroupRef = useRef<THREE.Group | null>(null);
  const incomingGroupRef = useRef<THREE.Group | null>(null);
  const targetDestinationRef = useRef<DestinationId>('HOME');
  const currentActiveIslandRef = useRef<DestinationId>('HOME');

  // Fixed camera frozen pose snapshot to guarantee 100% stationary camera
  const frozenCamPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const frozenCamRot = useRef<THREE.Euler>(new THREE.Euler());

  const PAUSE_DURATION = 0.25; // 250ms pause in empty space with lingering particles

  // Helper to ensure snapshots are captured
  const ensureSnapshots = useCallback(() => {
    if (homeGroupRef.current) {
      homeOriginalsRef.current = snapshotOriginalTransforms(
        homeGroupRef.current,
        HERO_HOME_EXPLODED_PROFILE,
        homeOriginalsRef.current || undefined
      );
    }
    if (archiveGroupRef.current) {
      archiveOriginalsRef.current = snapshotOriginalTransforms(
        archiveGroupRef.current,
        ARCHIVE_EXPLODED_PROFILE,
        archiveOriginalsRef.current || undefined
      );
    }
    if (forestGroupRef.current) {
      forestOriginalsRef.current = snapshotOriginalTransforms(
        forestGroupRef.current,
        FOREST_EXPLODED_PROFILE,
        forestOriginalsRef.current || undefined
      );
    }
    if (workshopGroupRef.current) {
      workshopOriginalsRef.current = snapshotOriginalTransforms(
        workshopGroupRef.current,
        WORKSHOP_EXPLODED_PROFILE,
        workshopOriginalsRef.current || undefined
      );
    }

    if (typeof window !== 'undefined') {
      (window as any).__EXPLODED_COMPONENT_COVERAGE__ = {
        HOME: homeOriginalsRef.current ? Array.from(homeOriginalsRef.current.keys()) : [],
        ARCHIVE: archiveOriginalsRef.current ? Array.from(archiveOriginalsRef.current.keys()) : [],
        FOREST: forestOriginalsRef.current ? Array.from(forestOriginalsRef.current.keys()) : [],
        WORKSHOP: workshopOriginalsRef.current ? Array.from(workshopOriginalsRef.current.keys()) : [],
      };
    }
  }, []);

  const getIslandGroup = (id: DestinationId): THREE.Group | null => {
    switch (id) {
      case 'HOME':
        return homeGroupRef.current;
      case 'ARCHIVE':
        return archiveGroupRef.current;
      case 'FOREST':
        return forestGroupRef.current;
      case 'WORKSHOP':
        return workshopGroupRef.current;
    }
  };

  const getIslandOriginals = (id: DestinationId): Map<string, OriginalTransform> | null => {
    switch (id) {
      case 'HOME':
        return homeOriginalsRef.current;
      case 'ARCHIVE':
        return archiveOriginalsRef.current;
      case 'FOREST':
        return forestOriginalsRef.current;
      case 'WORKSHOP':
        return workshopOriginalsRef.current;
    }
  };

  // Helper to start a modular exploded transition from source to target
  const initiateTransition = useCallback(
    (fromId: DestinationId, toId: DestinationId) => {
      ensureSnapshots();
      const fromGroup = getIslandGroup(fromId);
      const toGroup = getIslandGroup(toId);
      const fromProfile = getIslandExplodedProfile(fromId);
      const toProfile = getIslandExplodedProfile(toId);

      if (!fromGroup || !toGroup) return;

      outgoingProfileRef.current = fromProfile;
      incomingProfileRef.current = toProfile;
      outgoingGroupRef.current = fromGroup;
      incomingGroupRef.current = toGroup;
      targetDestinationRef.current = toId;

      // Lock camera pose 100% stationary
      frozenCamPos.current.copy(camera.position);
      frozenCamRot.current.copy(camera.rotation);

      fromGroup.visible = true;
      toGroup.visible = false;

      phaseRef.current = 'DISASSEMBLE';
      phaseStartTimeRef.current = 0; // Trigger on next frame
      setIsAnimating(true);
      if (gl.shadowMap) gl.shadowMap.autoUpdate = false;

      const originals = getIslandOriginals(fromId);
      if (typeof window !== 'undefined') {
        (window as any).__EXPLODED_TRANSITION_STATE__ = {
          phase: 'DISASSEMBLE',
          progress: 0,
          from: fromId,
          to: toId,
          componentsCount: originals ? originals.size : 0,
          camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        };
      }
    },
    [camera, gl, ensureSnapshots]
  );

  // ---------------------------------------------------------------------------
  // Synchronize Active Worlds and Handle Transition Triggers
  // ---------------------------------------------------------------------------
  useEffect(() => {
    ensureSnapshots();

    if (worldState === 'HOME_IDLE') {
      phaseRef.current = 'IDLE';
      currentActiveIslandRef.current = 'HOME';
      if (homeGroupRef.current) {
        homeGroupRef.current.visible = true;
        if (homeOriginalsRef.current) restoreOriginalTransforms(homeGroupRef.current, homeOriginalsRef.current);
      }
      if (archiveGroupRef.current) archiveGroupRef.current.visible = false;
      if (forestGroupRef.current) forestGroupRef.current.visible = false;
      if (workshopGroupRef.current) workshopGroupRef.current.visible = false;
      if (gl.shadowMap) gl.shadowMap.autoUpdate = true;
    } else if (worldState === 'ARCHIVE_WORLD') {
      phaseRef.current = 'IDLE';
      currentActiveIslandRef.current = 'ARCHIVE';
      if (homeGroupRef.current) homeGroupRef.current.visible = false;
      if (archiveGroupRef.current) {
        archiveGroupRef.current.visible = true;
        if (archiveOriginalsRef.current) restoreOriginalTransforms(archiveGroupRef.current, archiveOriginalsRef.current);
      }
      if (forestGroupRef.current) forestGroupRef.current.visible = false;
      if (workshopGroupRef.current) workshopGroupRef.current.visible = false;
      if (gl.shadowMap) gl.shadowMap.autoUpdate = true;
    } else if (worldState === 'FOREST_WORLD') {
      phaseRef.current = 'IDLE';
      currentActiveIslandRef.current = 'FOREST';
      if (homeGroupRef.current) homeGroupRef.current.visible = false;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = false;
      if (forestGroupRef.current) {
        forestGroupRef.current.visible = true;
        if (forestOriginalsRef.current) restoreOriginalTransforms(forestGroupRef.current, forestOriginalsRef.current);
      }
      if (workshopGroupRef.current) workshopGroupRef.current.visible = false;
      if (gl.shadowMap) gl.shadowMap.autoUpdate = true;
    } else if (worldState === 'WORKSHOP_WORLD') {
      phaseRef.current = 'IDLE';
      currentActiveIslandRef.current = 'WORKSHOP';
      if (homeGroupRef.current) homeGroupRef.current.visible = false;
      if (archiveGroupRef.current) archiveGroupRef.current.visible = false;
      if (forestGroupRef.current) forestGroupRef.current.visible = false;
      if (workshopGroupRef.current) {
        workshopGroupRef.current.visible = true;
        if (workshopOriginalsRef.current) restoreOriginalTransforms(workshopGroupRef.current, workshopOriginalsRef.current);
      }
      if (gl.shadowMap) gl.shadowMap.autoUpdate = true;
    } else if (worldState === 'TRANSITION_HOME_TO_ARCHIVE') {
      initiateTransition('HOME', 'ARCHIVE');
    } else if (worldState === 'TRANSITION_ARCHIVE_TO_HOME') {
      initiateTransition('ARCHIVE', 'HOME');
    } else if (worldState === 'TRANSITION_ARCHIVE_TO_FOREST') {
      initiateTransition('ARCHIVE', 'FOREST');
    } else if (worldState === 'TRANSITION_FOREST_TO_ARCHIVE') {
      initiateTransition('FOREST', 'ARCHIVE');
    }

    if (typeof window !== 'undefined') {
      (window as any).__CURRENT_ACTIVE_ISLAND__ = currentActiveIslandRef.current;
    }
  }, [worldState, gl, ensureSnapshots, initiateTransition]);

  // Handle direct destination transitions triggered via DestinationSelector UI
  useEffect(() => {
    if (!activeDestination) return;
    ensureSnapshots();

    if (phaseRef.current === 'IDLE' && currentActiveIslandRef.current !== activeDestination) {
      initiateTransition(currentActiveIslandRef.current, activeDestination);
    }
  }, [activeDestination, ensureSnapshots, initiateTransition]);

  // ---------------------------------------------------------------------------
  // Frame Animation Loop (Pure Three.js Mutation, Zero React Re-renders)
  // ---------------------------------------------------------------------------
  useFrame((state) => {
    if (phaseRef.current === 'IDLE') return;

    // CRITICAL: Camera remains 100% stationary throughout the transition
    camera.position.copy(frozenCamPos.current);
    camera.rotation.copy(frozenCamRot.current);

    const now = state.clock.getElapsedTime();
    if (phaseStartTimeRef.current === 0) {
      phaseStartTimeRef.current = now;
      return;
    }

    const elapsed = now - phaseStartTimeRef.current;
    const outgoingProfile = outgoingProfileRef.current;
    const incomingProfile = incomingProfileRef.current;
    const outgoingGroup = outgoingGroupRef.current;
    const incomingGroup = incomingGroupRef.current;

    ensureSnapshots();

    // =========================================================================
    // PHASE 1: DISASSEMBLE OUTGOING ISLAND
    // =========================================================================
    if (phaseRef.current === 'DISASSEMBLE') {
      if (!outgoingProfile || !outgoingGroup) return;

      const duration = outgoingProfile.disassemblyDuration;
      const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
      const originals = getIslandOriginals(outgoingProfile.islandId);

      if (originals) {
        originals.forEach((orig, name) => {
          const obj = outgoingGroup.getObjectByName(name);
          const comp = orig.config || outgoingProfile.components.find((c) => c.name === name);
          if (obj && orig && comp) {
            applyExplodedTransform(obj, orig, comp, progress);
          }
        });
      }

      // Telemetry for testing and QA
      if (typeof window !== 'undefined') {
        (window as any).__EXPLODED_TRANSITION_STATE__ = {
          phase: 'DISASSEMBLE',
          progress,
          from: outgoingProfile.islandId,
          to: incomingProfile?.islandId,
          componentsCount: originals ? originals.size : 0,
          camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        };
      }

      if (progress >= 1.0) {
        // Disassembly complete -> hide outgoing island and restore its components
        outgoingGroup.visible = false;
        if (originals) restoreOriginalTransforms(outgoingGroup, originals);

        // Advance to brief PAUSE in empty presentation space
        phaseRef.current = 'PAUSE';
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 2: BRIEF MAGICAL PAUSE (Incoming Island Prepared in Exploded State)
    // =========================================================================
    else if (phaseRef.current === 'PAUSE') {
      if (!incomingProfile || !incomingGroup) return;

      const inOriginals = getIslandOriginals(incomingProfile.islandId);

      // Set incoming island visible with its components at initial exploded transforms (progress = 1.0)
      incomingGroup.visible = true;
      if (inOriginals) {
        inOriginals.forEach((orig, name) => {
          const obj = incomingGroup.getObjectByName(name);
          const comp = orig.config || incomingProfile.components.find((c) => c.name === name);
          if (obj && orig && comp) {
            applyExplodedTransform(obj, orig, comp, 1.0);
          }
        });
      }

      if (typeof window !== 'undefined') {
        (window as any).__EXPLODED_TRANSITION_STATE__ = {
          phase: 'PAUSE',
          progress: elapsed / PAUSE_DURATION,
          from: outgoingProfile?.islandId,
          to: incomingProfile.islandId,
          componentsCount: inOriginals ? inOriginals.size : 0,
          camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        };
      }

      if (elapsed >= PAUSE_DURATION) {
        phaseRef.current = 'REASSEMBLE';
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 3: REASSEMBLE INCOMING ISLAND
    // =========================================================================
    else if (phaseRef.current === 'REASSEMBLE') {
      if (!incomingProfile || !incomingGroup) return;

      const duration = incomingProfile.reassemblyDuration;
      const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
      const inOriginals = getIslandOriginals(incomingProfile.islandId);

      if (inOriginals) {
        inOriginals.forEach((orig, name) => {
          const obj = incomingGroup.getObjectByName(name);
          const comp = orig.config || incomingProfile.components.find((c) => c.name === name);
          if (obj && orig && comp) {
            // Reassembly is inverse: from 1.0 down to 0.0
            applyExplodedTransform(obj, orig, comp, 1.0 - progress);
          }
        });
      }

      if (typeof window !== 'undefined') {
        (window as any).__EXPLODED_TRANSITION_STATE__ = {
          phase: 'REASSEMBLE',
          progress,
          from: outgoingProfile?.islandId,
          to: incomingProfile.islandId,
          componentsCount: inOriginals ? inOriginals.size : 0,
          camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        };
      }

      if (progress >= 1.0) {
        // EXACT ORIGINAL RESTORATION GUARANTEE (0.00000 delta)
        if (inOriginals) restoreOriginalTransforms(incomingGroup, inOriginals);

        phaseRef.current = 'HANDOVER';
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 4: HANDOVER TO TARGET IDLE WORLD
    // =========================================================================
    else if (phaseRef.current === 'HANDOVER') {
      phaseRef.current = 'IDLE';
      setIsAnimating(false);
      const targetId = targetDestinationRef.current;
      currentActiveIslandRef.current = targetId;

      if (typeof window !== 'undefined') {
        (window as any).__CURRENT_ACTIVE_ISLAND__ = targetId;
        (window as any).__EXPLODED_TRANSITION_STATE__ = {
          phase: 'COMPLETE',
          target: targetId,
          camPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        };
      }

      onDestinationReached(targetId);

      // Legacy trigger triggers
      if (targetId === 'ARCHIVE') {
        if (outgoingProfile?.islandId === 'FOREST') {
          onTransitionFromForestToArchiveComplete();
        } else {
          onTransitionToArchiveComplete();
        }
      } else if (targetId === 'HOME') {
        onTransitionFromArchiveToHomeComplete();
      } else if (targetId === 'FOREST') {
        onTransitionToForestComplete();
      } else if (targetId === 'WORKSHOP') {
        onTransitionToWorkshopComplete();
      }
    }
  });

  const isTransitioning =
    isAnimating ||
    worldState === 'TRANSITION_HOME_TO_ARCHIVE' ||
    worldState === 'TRANSITION_ARCHIVE_TO_HOME' ||
    worldState === 'TRANSITION_ARCHIVE_TO_FOREST' ||
    worldState === 'TRANSITION_FOREST_TO_ARCHIVE' ||
    worldState === 'TRANSITIONING_ISLAND';

  return (
    <>
      {/* UNIFIED PRESENTATION CAMERA CONTROLLER (Stationary During Transitions, Zero Zoom) */}
      <UnifiedPresentationCameraController
        isTransitioning={isTransitioning}
        resetSignal={resetSignal}
        onResetComplete={onResetComplete}
      />

      {/* SINGLE PRESENTATION ANCHOR GROUP AT EXACT PHYSICAL COORDINATES [0, 0, 0] */}
      <group name="PresentationAnchorGroup" position={[0, 0, 0]}>
        {/* DESTINATION 1: Hero's Home */}
        <group
          ref={homeGroupRef}
          name="ExplodedHomeGroup"
          visible={worldState === 'HOME_IDLE'}
        >
          <WorldA_HeroIsland
            disableCamera={true}
            resetSignal={resetSignal}
            onResetComplete={onResetComplete}
            onSelectObject={onSelectObject}
            onHoverObject={onHoverObject}
            onStatusChange={onStatusChange}
          />
        </group>

        {/* DESTINATION 2: Grand Mage's Archive */}
        <group
          ref={archiveGroupRef}
          name="ExplodedArchiveGroup"
          visible={worldState === 'ARCHIVE_WORLD'}
        >
          <WorldC_ArchiveIsland
            disableCamera={true}
            selectedGrimoire={selectedGrimoire}
            onSelectGrimoire={onSelectGrimoire}
            resetSignal={resetSignal}
            onResetComplete={onResetComplete}
          />
        </group>

        {/* DESTINATION 3: Whispering Forest — About Me */}
        <group
          ref={forestGroupRef}
          name="ExplodedForestGroup"
          visible={worldState === 'FOREST_WORLD'}
        >
          <WorldD_WhisperingForest
            disableCamera={true}
            onOpenAboutModal={onOpenAboutModal}
            isModalOpen={isAboutModalOpen}
            resetSignal={resetSignal}
            focusedLandmark={focusedForestLandmark}
            onResetComplete={onResetComplete}
          />
        </group>

        {/* DESTINATION 4: Rune Creation Workshop — Projects */}
        <group
          ref={workshopGroupRef}
          name="ExplodedWorkshopGroup"
          visible={worldState === 'WORKSHOP_WORLD'}
        >
          <WorldE_RuneWorkshop
            disableCamera={true}
            onSelectProject={onSelectProject}
            selectedProject={selectedProject}
          />
        </group>
      </group>
    </>
  );
};
