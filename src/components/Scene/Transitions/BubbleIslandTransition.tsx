import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WorldA_HeroIsland } from '../WorldA_HeroIsland';
import { WorldC_ArchiveIsland } from '../WorldC_ArchiveIsland';
import { WorldD_WhisperingForest } from '../WorldD_WhisperingForest';
import { WorldE_RuneWorkshop } from '../WorldE_RuneWorkshop';
import { UnifiedPresentationCameraController } from './UnifiedPresentationCameraController';
import { SoapBubbleMesh } from './SoapBubbleMesh';
import { BubblePopBurstParticles } from './BubblePopBurstParticles';
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

type TransitionPhase = 'IDLE' | 'ENCLOSE' | 'POP' | 'REVEAL';

/**
 * Synthesizes a gentle, bubbly liquid "pop" sound using Web Audio.
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
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Audio might be muted or blocked until user interaction
  }
}

/**
 * BubbleIslandTransition
 *
 * Replaces all exploded/staircase transitions with a magical Soap Bubble Pop Reveal:
 * 1. An iridescent soap bubble forms and expands around the current 3D island, enclosing it.
 * 2. The bubble reaches peak size and tension, wobbling like a delicate liquid sphere.
 * 3. The bubble POPS with a burst of sparkling rainbow droplets!
 * 4. Beneath the burst, the new 3D island is revealed, springing smoothly into place.
 */
export const BubbleIslandTransition: React.FC<BubbleIslandTransitionProps> = ({
  worldState,
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

  // Bubble animation state
  const [bubbleRadius, setBubbleRadius] = useState(0);
  const [bubbleOpacity, setBubbleOpacity] = useState(0);
  const [burstActive, setBurstActive] = useState(false);

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

      phaseRef.current = 'ENCLOSE';
      setCurrentPhase('ENCLOSE');
      phaseStartTimeRef.current = performance.now() / 1000;
      setIsTransitioning(true);
      setBurstActive(false);
      setBubbleRadius(0.1);
      setBubbleOpacity(0.85);
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
    // PHASE 1: BUBBLE ENCLOSE (0.0s -> 0.48s)
    // =========================================================================
    if (phase === 'ENCLOSE') {
      const ENCLOSE_DURATION = 0.48;
      const t = Math.min(1.0, elapsed / ENCLOSE_DURATION);

      // Bubble expands from 0 to 10.2 units (encapsulating island and trees)
      // easeOutBack overshoot
      const s = 1.25;
      const inv = t - 1.0;
      const easedR = (inv * inv * ((s + 1.0) * inv + s) + 1.0) * 10.2;
      setBubbleRadius(Math.max(0.01, easedR));
      setBubbleOpacity(Math.min(0.88, t * 1.8));

      // Outgoing island gently contracts inside the bubble
      if (outgoingGroup) {
        outgoingGroup.visible = true;
        const squeeze = 1.0 - t * 0.12;
        outgoingGroup.scale.set(outBase[0] * squeeze, outBase[1] * squeeze, outBase[2] * squeeze);
      }
      if (incomingGroup) {
        incomingGroup.visible = false;
      }

      if (elapsed >= ENCLOSE_DURATION) {
        // TRIGGER THE POP!
        phaseRef.current = 'POP';
        setCurrentPhase('POP');
        phaseStartTimeRef.current = now;
      }
    }

    // =========================================================================
    // PHASE 2: BUBBLE POP & BURST (Instantaneous switch at 0.48s)
    // =========================================================================
    else if (phase === 'POP') {
      // 1. Vanish the bubble sphere
      setBubbleRadius(0);
      setBubbleOpacity(0);

      // 2. Hide outgoing, display incoming inside the burst
      if (outgoingGroup) {
        outgoingGroup.visible = false;
        outgoingGroup.scale.set(outBase[0], outBase[1], outBase[2]);
      }

      if (incomingGroup) {
        incomingGroup.visible = true;
        // Start incoming island slightly smaller, ready to spring out
        incomingGroup.scale.set(inBase[0] * 0.75, inBase[1] * 0.75, inBase[2] * 0.75);
      }

      // 3. Trigger droplet particle explosion & cute sound
      setBurstActive(true);
      playBubblePopSound();

      // Proceed immediately to REVEAL
      phaseRef.current = 'REVEAL';
      setCurrentPhase('REVEAL');
      phaseStartTimeRef.current = now;
    }

    // =========================================================================
    // PHASE 3: REVEAL & JUICY SPRING SETTLE (0.0s -> 0.55s after pop)
    // =========================================================================
    else if (phase === 'REVEAL') {
      const REVEAL_DURATION = 0.55;
      const t = Math.min(1.0, elapsed / REVEAL_DURATION);

      // Juicy elastic spring reveal: 0.75 -> 1.06 -> 0.98 -> 1.00
      const decay = Math.exp(-6.5 * t);
      const osc = Math.cos(t * Math.PI * 3.5);
      const spring = 1.0 - 0.25 * decay * osc;

      if (outgoingGroup) {
        outgoingGroup.visible = false;
      }

      if (incomingGroup) {
        incomingGroup.visible = true;
        incomingGroup.scale.set(inBase[0] * spring, inBase[1] * spring, inBase[2] * spring);
      }

      if (t >= 1.0) {
        // Complete transition
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
        setBurstActive(false);
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
    if (currentPhase === 'ENCLOSE') return id === outgoingIslandRef.current;
    // POP or REVEAL: only the incoming new island is visible!
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
            disableCamera={isTransitioning || worldState !== 'FOREST_WORLD'}
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

        {/* THE SHIMMERING SOAP BUBBLE */}
        {bubbleRadius > 0.05 && (
          <SoapBubbleMesh
            radius={bubbleRadius}
            opacity={bubbleOpacity}
            position={[0, 0.5, 0]}
          />
        )}

        {/* BUBBLE POP BURST DROPLETS & SHOCKWAVE RING */}
        <BubblePopBurstParticles
          active={burstActive}
          center={[0, 0.5, 0]}
          burstRadius={10.0}
        />
      </group>
    </>
  );
};
