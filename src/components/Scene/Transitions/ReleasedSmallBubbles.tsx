import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BlackBubbleMesh } from './BlackBubbleMesh';
import { MetaballGridMorph } from './MetaballGridMorph';
import type { ProjectItem } from '../../../data/projectsData';

export interface SmallBubbleItem {
  id: number;
  screenX: number; // horizontal spread across screen
  screenY: number; // vertical spread across screen
  depth: number;   // z depth variation (-2 to +2)
  radius: number;  // bubble radius
  delay: number;   // normalized launch time within release window (0.0 to 0.8)
  wobbleSpeed: number;
  phase: number;
}

/** Desktop widescreen balanced 6-bubble distribution */
export const BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -7.2, screenY:  2.8, depth:  0.4, radius: 2.10, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.2, depth: -0.6, radius: 1.95, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  7.2, screenY:  2.8, depth:  0.5, radius: 2.20, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  7.2, screenY: -2.3, depth: -0.5, radius: 2.15, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -3.5, depth:  0.3, radius: 2.35, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -7.2, screenY: -2.3, depth: -0.4, radius: 2.05, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Tablet (4:3 / medium width) balanced 6-bubble distribution */
export const TABLET_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -5.0, screenY:  2.5, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.0, depth: -0.6, radius: 1.75, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  5.0, screenY:  2.5, depth:  0.5, radius: 1.95, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  5.0, screenY: -2.3, depth: -0.5, radius: 1.90, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -3.6, depth:  0.3, radius: 2.05, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -5.0, screenY: -2.3, depth: -0.4, radius: 1.80, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Mobile portrait organic constellation 6-bubble distribution (full screen coverage) */
export const MOBILE_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -2.4, screenY:  7.6, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.2, phase: 0.0 },
  { id: 1, screenX:  2.2, screenY:  5.8, depth: -0.5, radius: 1.95, delay: 0.16, wobbleSpeed: 1.4, phase: 1.2 },
  { id: 2, screenX: -0.6, screenY:  2.2, depth:  0.8, radius: 2.15, delay: 0.32, wobbleSpeed: 1.0, phase: 2.5 },
  { id: 3, screenX:  2.5, screenY: -1.2, depth: -0.6, radius: 1.85, delay: 0.48, wobbleSpeed: 1.5, phase: 3.7 },
  { id: 4, screenX: -2.4, screenY: -4.3, depth:  0.4, radius: 1.95, delay: 0.64, wobbleSpeed: 1.1, phase: 4.8 },
  { id: 5, screenX:  1.0, screenY: -7.4, depth: -0.3, radius: 1.80, delay: 0.80, wobbleSpeed: 1.3, phase: 5.6 },
];

// ============================================================================
// MAIN RELEASED SMALL BUBBLES COMPONENT
// ============================================================================
export interface ReleasedSmallBubblesProps {
  active: boolean;
  releaseProgress: number; // 0.0 to 1.0
  isReversing?: boolean;
  reverseStage?: 'BOOKS' | 'BUBBLES';
  reverseBooksProgress?: number;
  isTearing?: boolean;
  onClose?: () => void;
  onSelectGrimoire?: (grimoire: any) => void;
  selectedGrimoire?: any;
  onSelectProject?: (project: ProjectItem) => void;
  selectedProject?: any;
}

export const ReleasedSmallBubbles: React.FC<ReleasedSmallBubblesProps> = ({
  active,
  releaseProgress,
  isReversing = false,
  isTearing = false,
  onClose,
  onSelectProject,
}) => {
  const { camera, size } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const timeRef = useRef(0);
  const tearTimeRef = useRef(0);

  // Pick responsive preset based on viewport form factor
  const activePresets = useMemo(() => {
    if (isMobile) return MOBILE_BUBBLE_PRESETS;
    if (isTablet) return TABLET_BUBBLE_PRESETS;
    return BUBBLE_PRESETS;
  }, [isMobile, isTablet]);

  // Group refs for individual bubbles
  const bubbleRefs = useRef<(THREE.Group | null)[]>([]);

  // Center anchor where the main bubble was located
  const centerAnchor = useMemo(() => new THREE.Vector3(0, 0.7, 0), []);

  // Compute camera basis vectors for projecting targets across the screen
  const { rightVec, upVec, lookVec } = useMemo(() => {
    const look = new THREE.Vector3().subVectors(centerAnchor, camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(look, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, look).normalize();
    return { rightVec: right, upVec: up, lookVec: look };
  }, [camera, centerAnchor]);

  // Pre-calculate target positions in world space
  const targetPositions = useMemo(() => {
    return activePresets.map((b) => {
      return centerAnchor
        .clone()
        .addScaledVector(rightVec, b.screenX)
        .addScaledVector(upVec, b.screenY)
        .addScaledVector(lookVec, -b.depth);
    });
  }, [centerAnchor, rightVec, upVec, lookVec, activePresets]);

  // Pre-calculate start positions along main bubble surface
  const startPositions = useMemo(() => {
    const startDist = isMobile ? 3.0 : 4.2;
    return targetPositions.map((target) => {
      const dir = new THREE.Vector3().subVectors(target, centerAnchor).normalize();
      return centerAnchor.clone().addScaledVector(dir, startDist);
    });
  }, [targetPositions, centerAnchor, isMobile]);

  // Reset pointer on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  useFrame((_, delta) => {
    if (!active) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (isTearing) {
      tearTimeRef.current += delta * 2.8;
    } else {
      tearTimeRef.current = 0;
    }
    const tearFactor = Math.max(0.0, 1.0 - tearTimeRef.current);

    activePresets.forEach((b, index) => {
      const grp = bubbleRefs.current[index];
      if (!grp) return;

      // -----------------------------------------------------------------------
      // REVERSE: 6 bubbles fly back towards center into growing main bubble
      // -----------------------------------------------------------------------
      if (isReversing) {
        const returnProgress = THREE.MathUtils.clamp(1.0 - releaseProgress, 0.0, 1.0);
        // Staggered return: bubbles fly back in reverse order (5 -> 4 -> 3 -> 2 -> 1 -> 0)
        const returnDelay = (5 - index) * 0.06;
        const returnWindow = 0.55;
        const tauRet = Math.min(1.0, Math.max(0.0, (returnProgress - returnDelay) / returnWindow));
        // Smooth cubic ease towards center
        const retEase = tauRet * tauRet * (3.0 - 2.0 * tauRet);

        const start = startPositions[index];
        const target = targetPositions[index];

        const curX = THREE.MathUtils.lerp(target.x, start.x, retEase);
        const curY = THREE.MathUtils.lerp(target.y, start.y, retEase);
        const curZ = THREE.MathUtils.lerp(target.z, start.z, retEase);

        const floatDim = Math.max(0.0, 1.0 - retEase);
        const floatX = Math.sin(t * (1.3 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.12 : 0.18) * floatDim;
        const floatY = Math.cos(t * (1.6 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.16 : 0.24) * floatDim;
        const floatZ = Math.sin(t * (1.1 * b.wobbleSpeed) + b.phase) * 0.14 * floatDim;

        grp.position.set(curX + floatX, curY + floatY, curZ + floatZ);

        // Near center, merge and shrink smoothly into the expanding main bubble
        let mergeScale = 1.0;
        if (retEase > 0.65) {
          mergeScale = Math.max(0.0, 1.0 - ((retEase - 0.65) / 0.35));
        }
        grp.scale.set(mergeScale, mergeScale, mergeScale);
        grp.visible = mergeScale > 0.01;
        return;
      }

      // -----------------------------------------------------------------------
      // FORWARD ANIMATION: Budding, traveling outward, and hovering
      // -----------------------------------------------------------------------
      if (releaseProgress < b.delay) {
        grp.visible = false;
        grp.scale.set(0, 0, 0);
        return;
      }

      grp.visible = tearFactor > 0.01;

      // Local detachment progress (0.0 to 1.0)
      const travelWindow = 0.28;
      const tau = Math.min(1.0, (releaseProgress - b.delay) / travelWindow);

      // Smooth ease-out flight curve
      const ease = 1.0 - Math.pow(1.0 - tau, 3.0);

      const start = startPositions[index];
      const target = targetPositions[index];

      // Interpolate travel position
      const curX = THREE.MathUtils.lerp(start.x, target.x, ease);
      const curY = THREE.MathUtils.lerp(start.y, target.y, ease);
      const curZ = THREE.MathUtils.lerp(start.z, target.z, ease);

      // Ambient fluid floating bobbing once arrived
      const floatX = Math.sin(t * (1.3 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.12 : 0.18) * ease;
      const floatY = Math.cos(t * (1.6 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.16 : 0.24) * ease;
      const floatZ = Math.sin(t * (1.1 * b.wobbleSpeed) + b.phase) * 0.14 * ease;

      // Budding pop scale curve: expands to 1.16 then settles to 1.0
      let s = 0.0;
      if (tau < 0.35) {
        s = (tau / 0.35) * 1.16;
      } else {
        s = 1.16 - ((tau - 0.35) / 0.65) * 0.16;
      }

      // Gentle fluid breathing pulsation once arrived
      const breath = Math.sin(t * (2.2 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.035 : 0.025) * ease;
      const finalScale = Math.max(0.0, (s + breath) * tearFactor);

      grp.position.set(curX + floatX, curY + floatY, curZ + floatZ);
      grp.scale.set(finalScale, finalScale, finalScale);
    });
  });

  if (!active) return null;

  return (
    <group name="ReleasedSmallBubblesContainer">
      {/* Soft Fill & Ambient Lighting for Liquid Bubbles */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 8, 10]} intensity={1.2} />

      {/* 1. INITIAL BUDDING / REVERSE RETURN BUBBLES */}
      {(releaseProgress < 0.95 || isReversing) &&
        activePresets.map((b, index) => {
          return (
            <group
              key={b.id}
              ref={(el) => {
                bubbleRefs.current[index] = el;
              }}
              visible={false}
            >
              {/* Glossy Black Bubble Mesh */}
              <group
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReversing && onClose) {
                    onClose();
                  }
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
                }}
              >
                <BlackBubbleMesh
                  radius={b.radius}
                  progress={1.0}
                  mode="SEALED"
                  position={[0, 0, 0]}
                  wobbleIntensity={0.045}
                />
              </group>
            </group>
          );
        })}

      {/* 2. CONTINUOUS 4-PHASE METABALL GRID MORPH INTO 5 VERTICAL CAPSULES */}
      {releaseProgress >= 0.95 && (
        <MetaballGridMorph
          active={active}
          releaseProgress={releaseProgress}
          isReversing={isReversing}
          onClose={onClose}
          onSelectProject={onSelectProject}
        />
      )}
    </group>
  );
};
