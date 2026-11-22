import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldA_HeroIsland } from '../WorldA_HeroIsland';
import { WorldC_ArchiveIsland } from '../WorldC_ArchiveIsland';
import { FloatingBooksRealm } from '../Archive/FloatingBooksRealm';
import { WorldD_WhisperingForest } from '../WorldD_WhisperingForest';
import { WorldE_RuneWorkshop } from '../WorldE_RuneWorkshop';
import { UnifiedPresentationCameraController } from './UnifiedPresentationCameraController';
import { BlackBubbleMesh, type BubbleAnimationMode } from './BlackBubbleMesh';
import { BlackBubbleRimDroplets } from './BlackBubbleRimDroplets';
import { ReleasedSmallBubbles } from './ReleasedSmallBubbles';
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
  const targetDestinationRef = useRef<DestinationId | null>(null);
  const archiveElevateGroupRef = useRef<THREE.Group>(null);

  type BookBubblePhase =
    | 'IDLE'
    | 'FORMING'
    | 'SEALED'
    | 'RELEASING'
    | 'FLOATING'
    | 'RETRACT_BUBBLES'
    | 'RETRACT_SEALED'
    | 'TEARING';

  // Dedicated Book Click Normal Bubble Transition with Small Bubbles Release
  const [bookBubblePhase, setBookBubblePhase] = useState<BookBubblePhase>('IDLE');
  const bookBubblePhaseRef = useRef<BookBubblePhase>('IDLE');
  const bookBubbleStartTime = useRef(0);
  const releaseStartTimeRef = useRef(0);
  const [bookBubbleProgress, setBookBubbleProgress] = useState(0);
  const [bookBubbleMode, setBookBubbleMode] = useState<BubbleAnimationMode>('FORMING');
  const [mainBubbleScale, setMainBubbleScale] = useState(1.0);
  const [releaseProgress, setReleaseProgress] = useState(0.0);
  const prevSelectedGrimoireRef = useRef<GrimoireItem | null>(null);

  // Trigger normal bubble when a book is clicked on Archive Island
  useEffect(() => {
    const wasInspecting = !!prevSelectedGrimoireRef.current;
    const isNowInspecting = currentIsland === 'ARCHIVE' && !!selectedGrimoire;
    prevSelectedGrimoireRef.current = selectedGrimoire || null;

    if (!wasInspecting && isNowInspecting) {
      // Normal bubble forms and wraps over the model
      bookBubblePhaseRef.current = 'FORMING';
      setBookBubblePhase('FORMING');
      setBookBubbleMode('FORMING');
      setBookBubbleProgress(0.0);
      setMainBubbleScale(1.0);
      setReleaseProgress(0.0);
      bookBubbleStartTime.current = performance.now() / 1000;
    } else if (wasInspecting && !isNowInspecting) {
      // EXACT REVERSE SEQUENCE TRIGGER:
      // When book is closed / unselected: 6 bubbles fly back to center into main bubble, then bubble tears open restoring island!
      if (
        bookBubblePhaseRef.current === 'FLOATING' ||
        bookBubblePhaseRef.current === 'RELEASING'
      ) {
        bookBubblePhaseRef.current = 'RETRACT_BUBBLES';
        setBookBubblePhase('RETRACT_BUBBLES');
        bookBubbleStartTime.current = performance.now() / 1000;
      }
    }
  }, [selectedGrimoire, currentIsland]);

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

    if (currentIsland !== activeDestination) {
      const isBubbleActive =
        bookBubblePhaseRef.current === 'FLOATING' ||
        bookBubblePhaseRef.current === 'RELEASING';

      if (isBubbleActive) {
        // Small bubble joining together and forming big and bursting and revealing new 3D model
        targetDestinationRef.current = activeDestination;
        bookBubblePhaseRef.current = 'RETRACT_BUBBLES';
        setBookBubblePhase('RETRACT_BUBBLES');
        bookBubbleStartTime.current = performance.now() / 1000;
      } else if (phaseRef.current === 'IDLE' && bookBubblePhaseRef.current === 'IDLE') {
        startBubbleTransition(currentIsland, activeDestination);
      }
    }
  }, [activeDestination, currentIsland, startBubbleTransition]);

  useFrame((_, _delta) => {
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // Book Click Normal Bubble Animation with Small Bubbles Release:
    // 1. Normal black bubble forms and wraps over model (0.7s)
    // 2. Sealed: 3D model disappears inside the bubble (0.2s pause)
    // 3. Releasing: Main bubble releases small bubbles across screen & shrinks down!
    // 4. Floating: Released small bubbles float peacefully across screen
    // -------------------------------------------------------------------------
    const now = performance.now() / 1000;

    // Island model remains stationary at default position [0, 0, 0]
    if (archiveElevateGroupRef.current) {
      archiveElevateGroupRef.current.position.set(0, 0, 0);
    }

    if (bookBubblePhaseRef.current === 'FORMING') {
      const FORMING_DURATION = 0.70; // Exact same duration as other page transitions
      const elapsed = now - bookBubbleStartTime.current;
      const t = Math.min(1.0, elapsed / FORMING_DURATION);
      const p = t * t * (3.0 - 2.0 * t);
      setBookBubbleProgress(p);
      setMainBubbleScale(1.0);

      // Model gently contracts inside the forming bubble so bounds stay inside
      if (archiveElevateGroupRef.current) {
        if (t >= 0.82) {
          // Model disappears completely inside before seal reaches absolute edge
          archiveElevateGroupRef.current.visible = false;
        } else {
          archiveElevateGroupRef.current.visible = true;
          const squeeze = Math.max(0.2, 1.0 - t * 0.35);
          archiveElevateGroupRef.current.scale.set(squeeze, squeeze, squeeze);
        }
      }

      if (t >= 1.0) {
        bookBubblePhaseRef.current = 'SEALED';
        setBookBubblePhase('SEALED');
        setBookBubbleMode('SEALED');
        setBookBubbleProgress(1.0);
        bookBubbleStartTime.current = now;

        // After this happens: the 3D model disappears inside the bubble
        if (archiveElevateGroupRef.current) {
          archiveElevateGroupRef.current.visible = false;
        }
      }
    } else if (bookBubblePhaseRef.current === 'SEALED') {
      setBookBubbleProgress(1.0);
      setMainBubbleScale(1.0);
      // Ensure the 3D model is completely disappeared inside the sealed bubble
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = false;
      }

      // Brief pause of 0.20s in sealed state before releasing small bubbles
      const elapsedSealed = now - bookBubbleStartTime.current;
      if (elapsedSealed >= 0.20) {
        bookBubblePhaseRef.current = 'RELEASING';
        setBookBubblePhase('RELEASING');
        releaseStartTimeRef.current = now;
      }
    } else if (bookBubblePhaseRef.current === 'RELEASING') {
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = false;
      }

      const RELEASE_DURATION = 1.60;
      const elapsedRel = now - releaseStartTimeRef.current;
      const pRel = Math.min(1.0, elapsedRel / RELEASE_DURATION);
      setReleaseProgress(pRel);

      // As it is releasing small bubbles, the main bubble gets smaller!
      const shrink = Math.max(0.0, 1.0 - pRel);
      // Fluid recoil squish on each release (6 beats for 6 bubbles)
      const squish = Math.sin(pRel * Math.PI * 6.0) * 0.05 * shrink;
      const currentScale = Math.max(0.0, shrink + squish);
      setMainBubbleScale(currentScale);

      if (pRel >= 1.0) {
        bookBubblePhaseRef.current = 'FLOATING';
        setBookBubblePhase('FLOATING');
        setMainBubbleScale(0.0);
      }
    } else if (bookBubblePhaseRef.current === 'FLOATING') {
      setMainBubbleScale(0.0);
      setReleaseProgress(1.0);
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = false;
      }
    } else if (bookBubblePhaseRef.current === 'RETRACT_BUBBLES') {
      // REVERSE: 6 bubbles fly back to center while main bubble grows (1.25s)
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = false;
      }
      const DURATION = 1.25;
      const elapsed = now - bookBubbleStartTime.current;
      const t = Math.min(1.0, elapsed / DURATION);
      // Smooth cubic curve
      const p = t * t * (3.0 - 2.0 * t);
      const relProg = Math.max(0.0, 1.0 - p);
      setReleaseProgress(relProg);

      // As small bubbles fly back inward, the main center bubble emerges and grows back to 1.0!
      const grow = Math.min(1.0, Math.pow(t, 0.95));
      const squish = Math.sin(t * Math.PI * 6.0) * 0.04 * (1.0 - t);
      const currentScale = Math.min(1.0, Math.max(0.0, grow + squish));
      setMainBubbleScale(currentScale);
      setBookBubbleMode('SEALED');
      setBookBubbleProgress(1.0);

      if (t >= 1.0) {
        bookBubblePhaseRef.current = 'RETRACT_SEALED';
        setBookBubblePhase('RETRACT_SEALED');
        setMainBubbleScale(1.0);
        setReleaseProgress(0.0);
        bookBubbleStartTime.current = now;
      }
    } else if (bookBubblePhaseRef.current === 'RETRACT_SEALED') {
      // 3. REVERSE STEP 3: Main bubble fully sealed at center (brief 0.15s pause)
      const targetDest = targetDestinationRef.current || currentIsland;
      const outgoingGroup = getIslandGroup(currentIsland);
      const incomingGroup = getIslandGroup(targetDest);
      const inBase = getBaseScale(targetDest);

      if (outgoingGroup && targetDest !== currentIsland) {
        outgoingGroup.visible = false;
      }
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = false;
      }
      if (incomingGroup) {
        incomingGroup.visible = true;
        incomingGroup.scale.set(inBase[0] * 0.82, inBase[1] * 0.82, inBase[2] * 0.82);
      }

      setMainBubbleScale(1.0);
      setBookBubbleMode('SEALED');
      setBookBubbleProgress(1.0);

      const elapsed = now - bookBubbleStartTime.current;
      if (elapsed >= 0.15) {
        // 4. REVERSE STEP 4: Tear open the bubble to reveal the new 3D model!
        bookBubblePhaseRef.current = 'TEARING';
        setBookBubblePhase('TEARING');
        setBookBubbleMode('TEARING');
        setBookBubbleProgress(0.0);
        bookBubbleStartTime.current = now;
      }
    } else if (bookBubblePhaseRef.current === 'TEARING') {
      // 4. TEARING: Main bubble tears open from bottom-right, revealing the 3D island model
      const targetDest = targetDestinationRef.current || currentIsland;
      const incomingGroup = getIslandGroup(targetDest);
      const inBase = getBaseScale(targetDest);

      const TEARING_DURATION = 0.65;
      const elapsed = now - bookBubbleStartTime.current;
      const t = Math.min(1.0, elapsed / TEARING_DURATION);
      const p = Math.pow(t, 1.2);
      setBookBubbleProgress(p);
      setMainBubbleScale(1.0);

      // Restore island model visibility with elastic settle
      if (incomingGroup) {
        if (t < 0.10) {
          incomingGroup.visible = false;
        } else {
          incomingGroup.visible = true;
          const s = THREE.MathUtils.lerp(0.82, 1.0, Math.min(1.0, (t - 0.10) / 0.90));
          incomingGroup.scale.set(inBase[0] * s, inBase[1] * s, inBase[2] * s);
        }
      }

      if (t >= 1.0) {
        bookBubblePhaseRef.current = 'IDLE';
        setBookBubblePhase('IDLE');
        setBookBubbleProgress(0.0);
        setMainBubbleScale(1.0);
        setReleaseProgress(0.0);

        if (incomingGroup) {
          incomingGroup.visible = true;
          incomingGroup.scale.set(inBase[0], inBase[1], inBase[2]);
        }
        if (archiveElevateGroupRef.current) {
          archiveElevateGroupRef.current.visible = true;
          archiveElevateGroupRef.current.scale.set(1, 1, 1);
        }

        if (targetDestinationRef.current) {
          const dest = targetDestinationRef.current;
          targetDestinationRef.current = null;
          setCurrentIsland(dest);
          onDestinationReached?.(dest);
          if (dest === 'ARCHIVE') onTransitionToArchiveComplete?.();
          else if (dest === 'HOME') onTransitionFromArchiveToHomeComplete?.();
          else if (dest === 'FOREST') onTransitionToForestComplete?.();
          else if (dest === 'WORKSHOP') onTransitionToWorkshopComplete?.();
        }
      }
    } else {
      // Default resting state: island fully visible and at 1.0 scale
      if (archiveElevateGroupRef.current) {
        archiveElevateGroupRef.current.visible = true;
        archiveElevateGroupRef.current.scale.set(1, 1, 1);
      }
    }

    const phase = phaseRef.current;
    if (phase === 'IDLE') return;

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
        // TRIGGER TEAR & POP (Silent transition, no audio effect)
        phaseRef.current = 'TEARING';
        setCurrentPhase('TEARING');
        setBubbleMode('TEARING');
        setBubbleProgress(0.0);
        phaseStartTimeRef.current = now;
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
    if (bookBubblePhase === 'RETRACT_SEALED' || bookBubblePhase === 'TEARING') {
      const targetDest = targetDestinationRef.current || currentIsland;
      return id === targetDest;
    }
    if (bookBubblePhase !== 'IDLE') {
      return id === 'ARCHIVE';
    }
    if (currentPhase === 'IDLE') return currentIsland === id;
    if (currentPhase === 'FORMING') return id === outgoingIslandRef.current;
    // SEALED, TEARING, REVEAL: only the incoming island is visible!
    return id === incomingIslandRef.current;
  };

  return (
    <>
      <UnifiedPresentationCameraController
        isTransitioning={isTransitioning || bookBubblePhase !== 'IDLE'}
        resetSignal={resetSignal}
        onResetComplete={onResetComplete}
        selectedGrimoire={selectedGrimoire}
        activeIsland={targetDestinationRef.current || currentIsland}
        inspectDescentY={0}
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
          {/* THE 3D ISLAND MODEL */}
          <group ref={archiveElevateGroupRef} name="ArchiveElevationContainer">
            <WorldC_ArchiveIsland
              disableCamera={true}
              selectedGrimoire={selectedGrimoire || null}
              onSelectGrimoire={onSelectGrimoire || (() => {})}
              resetSignal={resetSignal}
              onResetComplete={onResetComplete}
            />
          </group>

          {/* FloatingBooksRealm disabled per user request: only bubble is shown */}
          <FloatingBooksRealm
            selectedGrimoire={selectedGrimoire || null}
            onSelectGrimoire={onSelectGrimoire || (() => {})}
            active={false}
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

        {/* THE FULL BLACK SWEEPING BUBBLE (Reference Sprite Animation for Page Transitions) */}
        {showBubble && (
          <>
            <BlackBubbleMesh
              radius={6.9}
              progress={bubbleProgress}
              mode={bubbleMode}
              position={[0, 0.7, 0]}
            />
            <BlackBubbleRimDroplets
              radius={6.9}
              progress={bubbleProgress}
              mode={bubbleMode}
              position={[0, 0.7, 0]}
            />
          </>
        )}

        {/* THE MAIN NORMAL BUBBLE ON BOOK CLICK (Shrinks as it releases small bubbles) */}
        {bookBubblePhase !== 'IDLE' && mainBubbleScale > 0.001 && (
          <group position={[0, 0.7, 0]} scale={[mainBubbleScale, mainBubbleScale, mainBubbleScale]}>
            <BlackBubbleMesh
              radius={7.4}
              progress={bookBubbleProgress}
              mode={bookBubbleMode}
              position={[0, 0, 0]}
            />
            <BlackBubbleRimDroplets
              radius={7.4}
              progress={bookBubbleProgress}
              mode={bookBubbleMode}
              position={[0, 0, 0]}
            />
          </group>
        )}

        {/* THE RELEASED SMALL BUBBLES SWARM TO RANDOM PLACES ON SCREEN */}
        {bookBubblePhase !== 'IDLE' &&
          bookBubblePhase !== 'FORMING' &&
          bookBubblePhase !== 'SEALED' &&
          bookBubblePhase !== 'RETRACT_SEALED' &&
          bookBubblePhase !== 'TEARING' && (
          <ReleasedSmallBubbles
            active={true}
            releaseProgress={releaseProgress}
            isReversing={bookBubblePhase === 'RETRACT_BUBBLES'}
            onClose={() => onSelectGrimoire?.(null as any)}
            onSelectProject={onSelectProject}
          />
        )}
      </group>
    </>
  );
};
