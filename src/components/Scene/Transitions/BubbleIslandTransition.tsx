import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldA_HeroIsland } from '../WorldA_HeroIsland';
import { WorldC_ArchiveIsland } from '../WorldC_ArchiveIsland';
import { WorldD_WhisperingForest } from '../WorldD_WhisperingForest';
import { WorldE_RuneWorkshop } from '../WorldE_RuneWorkshop';
import { UnifiedPresentationCameraController } from './UnifiedPresentationCameraController';
import { BlackBubbleMesh, type BubbleAnimationMode } from './BlackBubbleMesh';
import { BlackBubbleRimDroplets } from './BlackBubbleRimDroplets';
import {
  ISLAND_DISPLAY_TRANSFORMS,
  type DestinationId,
} from './explodedConfig';
import type { WorldState } from '../Scene';
import type { GrimoireItem } from '../../../data/archiveData';
import type { ProjectItem } from '../../../data/projectsData';
import type { ForestLandmark } from '../Forest/ForestCameraController';

export interface BubbleIslandTransitionProps {
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

type TransitionPhase = 'IDLE' | 'FORMING' | 'SEALED' | 'TEARING' | 'REVEAL';

/**
 * Synthesizes a crisp, liquid bubble pop and tear sound using Web Audio.
 */
function playBubblePopSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1050, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  } catch {
    // Audio might be muted or blocked until user interaction
  }
}

/**
 * BubbleIslandTransition
 *
 * Implements the Full Black Sweeping Bubble Formation & Tear Transition
 * based on the user's reference sprite sheet:
 * 1. FORMING: A full black glossy liquid bubble sweeps across from bottom-right,
 *    wrapping over the outgoing model with liquid droplet beads along the advancing rim.
 * 2. SEALED: Briefly forms a 100% enclosed solid black sphere concealing the model.
 * 3. TEARING: The black bubble ruptures and tears open from bottom-right (Frame 1 -> 8),
 *    spraying droplets along the receding boundary while revealing the new 3D island!
 * 4. REVEAL: The newly revealed island springs smoothly into place with elastic settle.
 */
export const BubbleIslandTransition: React.FC<BubbleIslandTransitionProps> = ({
  worldState: _worldState,
  activeDestination = 'HOME',
  resetSignal,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
  selectedGrimoire,
  onSelectGrimoire,
  onOpenAboutModal,
  isAboutModalOpen,
  focusedForestLandmark,
  selectedProject,
  onSelectProject,
  onTransitionToArchiveComplete,
  onTransitionFromArchiveToHomeComplete,
  onTransitionToForestComplete,
  onTransitionFromForestToArchiveComplete,
  onTransitionToWorkshopComplete,
  onDestinationReached,
}) => {
  // References to the 4 world root groups
  const homeGroupRef = useRef<THREE.Group>(null);
  const archiveGroupRef = useRef<THREE.Group>(null);
  const forestGroupRef = useRef<THREE.Group>(null);
  const workshopGroupRef = useRef<THREE.Group>(null);

  // Transition state
  const [currentIsland, setCurrentIsland] = useState<DestinationId>(activeDestination);
  const [currentPhase, setCurrentPhase] = useState<TransitionPhase>('IDLE');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Black Bubble Sweep Animation State
  const [bubbleMode, setBubbleMode] = useState<BubbleAnimationMode>('FORMING');
  const [bubbleProgress, setBubbleProgress] = useState(0);
  const [showBubble, setShowBubble] = useState(false);

  const phaseRef = useRef<TransitionPhase>('IDLE');
  const phaseStartTimeRef = useRef(0);
  const outgoingIslandRef = useRef<DestinationId>(activeDestination);
  const incomingIslandRef = useRef<DestinationId>(activeDestination);

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

  const getBaseScale = (id: DestinationId): [number, number, number] => {
    return ISLAND_DISPLAY_TRANSFORMS[id].scale;
  };

  const startBubbleTransition = useCallback(
    (fromId: DestinationId, toId: DestinationId) => {
      outgoingIslandRef.current = fromId;
      incomingIslandRef.current = toId;

      const fromGroup = getIslandGroup(fromId);
      const toGroup = getIslandGroup(toId);
      if (fromGroup) fromGroup.visible = true;
      if (toGroup) toGroup.visible = false;

      phaseRef.current = 'FORMING';
      setCurrentPhase('FORMING');
      setBubbleMode('FORMING');
      setBubbleProgress(0.0);
      setShowBubble(true);
      phaseStartTimeRef.current = performance.now() / 1000;
      setIsTransitioning(true);
    },
    []
  );

  // Trigger transition when activeDestination changes
  useEffect(() => {
    if (!activeDestination) return;

    if (phaseRef.current === 'IDLE' && currentIsland !== activeDestination) {
      startBubbleTransition(currentIsland, activeDestination);
    }
  }, [activeDestination, currentIsland, startBubbleTransition]);

  useFrame(() => {
    const phase = phaseRef.current;
    if (phase === 'IDLE') return;

    const now = performance.now() / 1000;
    const elapsed = now - phaseStartTimeRef.current;

    const outgoingGroup = getIslandGroup(outgoingIslandRef.current);
    const incomingGroup = getIslandGroup(incomingIslandRef.current);
    const outBase = getBaseScale(outgoingIslandRef.current);
    const inBase = getBaseScale(incomingIslandRef.current);

    // =========================================================================
    // PHASE 1: FULL BLACK BUBBLE FORMATION (0.0s -> 0.70s)
    // Sweeps across from bottom-right (Frame 8 -> Frame 1), enclosing island
    // =========================================================================
    if (phase === 'FORMING') {
      const FORMING_DURATION = 0.70;
      const t = Math.min(1.0, elapsed / FORMING_DURATION);

      // Smooth cubic curve for natural fluid sweep
      const p = t * t * (3.0 - 2.0 * t);
      setBubbleProgress(p);

      // Outgoing island gently contracts inside the forming black bubble
      if (outgoingGroup) {
        outgoingGroup.visible = true;
        const squeeze = 1.0 - t * 0.10;
        outgoingGroup.scale.set(outBase[0] * squeeze, outBase[1] * squeeze, outBase[2] * squeeze);
      }
      if (incomingGroup) {
        incomingGroup.visible = false;
      }

      if (elapsed >= FORMING_DURATION) {
        // Complete enclosure, switch to SEALED
        phaseRef.current = 'SEALED';
        setCurrentPhase('SEALED');
        setBubbleMode('SEALED');
        setBubbleProgress(1.0);
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 2: SEALED BLACK BUBBLE (0.70s -> 0.86s, 160ms pause)
    // The island is completely inside the 100% black glossy sphere
    // =========================================================================
    else if (phase === 'SEALED') {
      const SEALED_DURATION = 0.16;

      if (outgoingGroup) {
        outgoingGroup.visible = false;
        outgoingGroup.scale.set(outBase[0], outBase[1], outBase[2]);
      }
      if (incomingGroup) {
        // Prepare incoming island inside the black sphere
        incomingGroup.visible = true;
        incomingGroup.scale.set(inBase[0] * 0.82, inBase[1] * 0.82, inBase[2] * 0.82);
      }

      if (elapsed >= SEALED_DURATION) {
        // TRIGGER TEAR & POP!
        phaseRef.current = 'TEARING';
        setCurrentPhase('TEARING');
        setBubbleMode('TEARING');
        setBubbleProgress(0.0);
        phaseStartTimeRef.current = now;
        playBubblePopSound();
      }
    }

    // =========================================================================
    // PHASE 3: TEARING & RUPTURE POP (0.0s -> 0.45s after sealed)
    // Tears open from bottom-right (Frame 1 -> Frame 8), peeling away black shell
    // =========================================================================
    else if (phase === 'TEARING') {
      const TEAR_DURATION = 0.45;
      const t = Math.min(1.0, elapsed / TEAR_DURATION);

      // Accelerated rip curve
      const p = Math.pow(t, 1.3);
      setBubbleProgress(p);

      // Incoming island scales up as the black shell peels back
      if (incomingGroup) {
        incomingGroup.visible = true;
        const s = 0.82 + t * 0.16;
        incomingGroup.scale.set(inBase[0] * s, inBase[1] * s, inBase[2] * s);
      }
      if (outgoingGroup) {
        outgoingGroup.visible = false;
      }

      if (elapsed >= TEAR_DURATION) {
        // Bubble is now 100% torn away
        setShowBubble(false);
        phaseRef.current = 'REVEAL';
        setCurrentPhase('REVEAL');
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 4: JUICY ELASTIC SETTLE (0.0s -> 0.40s after tear)
    // Island settles into position with bounce
    // =========================================================================
    else if (phase === 'REVEAL') {
      const REVEAL_DURATION = 0.40;
      const t = Math.min(1.0, elapsed / REVEAL_DURATION);

      // Juicy elastic bounce: 0.98 -> 1.05 -> 0.99 -> 1.00
      const decay = Math.exp(-7.0 * t);
      const osc = Math.cos(t * Math.PI * 3.5);
      const spring = 1.0 - 0.16 * decay * osc;

      if (incomingGroup) {
        incomingGroup.visible = true;
        incomingGroup.scale.set(inBase[0] * spring, inBase[1] * spring, inBase[2] * spring);
      }
      if (outgoingGroup) {
        outgoingGroup.visible = false;
      }

      if (t >= 1.0) {
        if (incomingGroup) {
          incomingGroup.visible = true;
          incomingGroup.scale.set(inBase[0], inBase[1], inBase[2]);
        }
        if (outgoingGroup) {
          outgoingGroup.visible = false;
        }

        const targetId = incomingIslandRef.current;
        setCurrentIsland(targetId);
        setIsTransitioning(false);
        phaseRef.current = 'IDLE';
        setCurrentPhase('IDLE');

        // Fire destination handover callbacks
        onDestinationReached?.(targetId);
        if (targetId === 'ARCHIVE') {
          if (outgoingIslandRef.current === 'FOREST') {
            onTransitionFromForestToArchiveComplete?.();
          } else {
            onTransitionToArchiveComplete?.();
          }
        } else if (targetId === 'HOME') {
          onTransitionFromArchiveToHomeComplete?.();
        } else if (targetId === 'FOREST') {
          onTransitionToForestComplete?.();
        } else if (targetId === 'WORKSHOP') {
          onTransitionToWorkshopComplete?.();
        }
      }
    }
  });

  const isIslandVisible = (id: DestinationId): boolean => {
    if (currentPhase === 'IDLE') return currentIsland === id;
    if (currentPhase === 'FORMING') return id === outgoingIslandRef.current;
    // SEALED, TEARING, REVEAL: only the incoming island is visible!
    return id === incomingIslandRef.current;
  };

  return (
    <>
      <UnifiedPresentationCameraController
        isTransitioning={isTransitioning}
        resetSignal={resetSignal}
        onResetComplete={onResetComplete}
      />

      {/* SINGLE PRESENTATION ANCHOR GROUP AT EXACT PHYSICAL COORDINATES [0, 0, 0] */}
      <group name="BubblePresentationAnchor" position={[0, 0, 0]}>
        {/* DESTINATION 1: Hero's Home */}
        <group
          ref={homeGroupRef}
          name="BubbleHomeGroup"
          position={ISLAND_DISPLAY_TRANSFORMS.HOME.position}
          scale={ISLAND_DISPLAY_TRANSFORMS.HOME.scale}
          visible={isIslandVisible('HOME')}
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
          name="BubbleArchiveGroup"
          position={ISLAND_DISPLAY_TRANSFORMS.ARCHIVE.position}
          scale={ISLAND_DISPLAY_TRANSFORMS.ARCHIVE.scale}
          visible={isIslandVisible('ARCHIVE')}
        >
          <WorldC_ArchiveIsland
            disableCamera={true}
            selectedGrimoire={selectedGrimoire || null}
            onSelectGrimoire={onSelectGrimoire || (() => {})}
            resetSignal={resetSignal}
            onResetComplete={onResetComplete}
          />
        </group>

        {/* DESTINATION 3: Whispering Forest */}
        <group
          ref={forestGroupRef}
          name="BubbleForestGroup"
          position={ISLAND_DISPLAY_TRANSFORMS.FOREST.position}
          scale={ISLAND_DISPLAY_TRANSFORMS.FOREST.scale}
          visible={isIslandVisible('FOREST')}
        >
          <WorldD_WhisperingForest
            disableCamera={isTransitioning || _worldState !== 'FOREST_WORLD'}
            onOpenAboutModal={onOpenAboutModal || (() => {})}
            isModalOpen={isAboutModalOpen}
            resetSignal={resetSignal}
            focusedLandmark={focusedForestLandmark}
            onResetComplete={onResetComplete}
          />
        </group>

        {/* DESTINATION 4: Rune Creation Workshop */}
        <group
          ref={workshopGroupRef}
          name="BubbleWorkshopGroup"
          position={ISLAND_DISPLAY_TRANSFORMS.WORKSHOP.position}
          scale={ISLAND_DISPLAY_TRANSFORMS.WORKSHOP.scale}
          visible={isIslandVisible('WORKSHOP')}
        >
          <WorldE_RuneWorkshop
            disableCamera={true}
            onSelectProject={onSelectProject}
            selectedProject={selectedProject}
          />
        </group>

        {/* THE FULL BLACK SWEEPING BUBBLE (Reference Sprite Animation) */}
        {showBubble && (
          <>
            <BlackBubbleMesh
              radius={10.2}
              progress={bubbleProgress}
              mode={bubbleMode}
              position={[0, 0.5, 0]}
            />
            <BlackBubbleRimDroplets
              radius={10.2}
              progress={bubbleProgress}
              mode={bubbleMode}
              position={[0, 0.5, 0]}
            />
          </>
        )}
      </group>
    </>
  );
};
