import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  MagicalFloatingStairs,
  DEFAULT_STAIRCASE_CONFIG,
  getStaircaseTotalDuration,
} from './MagicalFloatingStairs';

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface CinematicLevelTransitionProps {
  /** Unique key or name for this level transition */
  transitionName?: string;
  /** Direction: FORWARD (e.g. Level 1 -> Level 2) or BACKWARD (Level 2 -> Level 1) */
  direction: 'FORWARD' | 'BACKWARD';
  /** Total animation duration in seconds (configurable, default 5.5s) */
  duration?: number;
  /** Vertical descent of origin island: [startY, endY] (default [0, -28]) */
  originYRange?: [number, number];
  /** Vertical descent of destination island: [startY, endY] (default [28, 0]) */
  destYRange?: [number, number];
  /** Origin level scene (rendered with disabled internal camera) */
  originLevel: React.ReactNode;
  /** Destination level scene (rendered with disabled internal camera) */
  destLevel: React.ReactNode;
  /** Called when the cinematic journey finishes */
  onComplete: () => void;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export const CinematicLevelTransition: React.FC<CinematicLevelTransitionProps> = ({
  transitionName = 'LevelTransition',
  direction = 'FORWARD',
  duration = getStaircaseTotalDuration(DEFAULT_STAIRCASE_CONFIG), // Synchronized with staircase timing (17.0s)
  originYRange = [0, -28],
  destYRange = [28, 0],
  originLevel,
  destLevel,
  onComplete,
}) => {
  const { camera, size } = useThree();
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  // Track raw and eased progress for reactive child components
  const [transitionProgress, setTransitionProgress] = useState(
    direction === 'FORWARD' ? 0 : 1
  );

  // Scene group references for vertical world-space translations
  const originGroupRef = useRef<THREE.Group>(null);
  const destGroupRef = useRef<THREE.Group>(null);
  const staircaseGroupRef = useRef<THREE.Group>(null);

  // -------------------------------------------------------------------------
  // Smooth, Stable Camera Movement Independent of Individual Stairs
  // -------------------------------------------------------------------------
  const { startPos, endPos, startTarget, endTarget } = useMemo(() => {
    // Desktop vs Mobile terminal poses
    const endPos = isMobile
      ? new THREE.Vector3(0.0, 10.8, 28.5)
      : isTablet
      ? new THREE.Vector3(0.0, 10.0, 26.5)
      : new THREE.Vector3(0.0, 9.2, 23.5);

    const endTarget = new THREE.Vector3(0.0, 2.0, 0.0);

    const startPos = isMobile
      ? new THREE.Vector3(12.5, 12.0, 12.5)
      : isTablet
      ? new THREE.Vector3(13.0, 11.0, 13.0)
      : new THREE.Vector3(14.0, 10.0, 14.0);

    const startTarget = isMobile
      ? new THREE.Vector3(0.0, 1.0, 0.0)
      : new THREE.Vector3(0.0, 0.5, 0.0);

    return { startPos, endPos, startTarget, endTarget };
  }, [isMobile, isTablet]);

  useFrame((state) => {
    if (completedRef.current) return;

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

    // Direction-aware progress
    const forwardEased = direction === 'FORWARD' ? eased : 1 - eased;
    const forwardRaw = direction === 'FORWARD' ? rawProgress : 1 - rawProgress;

    // Update state for staircase step assembly
    setTransitionProgress(forwardRaw);

    // 1. Move Origin Island (Hero's Home descends smoothly from 0 to -28)
    const originY = THREE.MathUtils.lerp(originYRange[0], originYRange[1], forwardEased);
    if (originGroupRef.current) {
      originGroupRef.current.position.set(0, originY, 0);
    }

    // 2. Move Destination Island (Archive descends smoothly from 28 to 0)
    const destY = THREE.MathUtils.lerp(destYRange[0], destYRange[1], forwardEased);
    if (destGroupRef.current) {
      destGroupRef.current.position.set(0, destY, 0);
    }

    // 3. Move Staircase group synchronously with the origin base offset
    if (staircaseGroupRef.current) {
      staircaseGroupRef.current.position.set(0, originY, 0);
    }

    // 4. Drive Camera along smooth, stable upward trajectory independent of individual stairs
    const s = THREE.MathUtils.clamp(forwardEased, 0, 1);
    const curPos = new THREE.Vector3(
      THREE.MathUtils.lerp(startPos.x, endPos.x, s),
      THREE.MathUtils.lerp(startPos.y, endPos.y, s),
      THREE.MathUtils.lerp(startPos.z, endPos.z, s)
    );
    const curTarget = new THREE.Vector3(
      THREE.MathUtils.lerp(startTarget.x, endTarget.x, s),
      THREE.MathUtils.lerp(startTarget.y, endTarget.y, s),
      THREE.MathUtils.lerp(startTarget.z, endTarget.z, s)
    );

    const forcedCam =
      typeof window !== 'undefined' ? (window as any).__FORCE_CAM_POSE__ : undefined;

    if (forcedCam) {
      camera.position.set(forcedCam.pos[0], forcedCam.pos[1], forcedCam.pos[2]);
      camera.lookAt(forcedCam.target[0], forcedCam.target[1], forcedCam.target[2]);
    } else {
      camera.position.copy(curPos);
      camera.lookAt(curTarget);
    }

    // 5. Terminal Handover Check
    if (rawProgress >= 1.0 && !completedRef.current) {
      completedRef.current = true;
      const finalPos = direction === 'FORWARD' ? endPos : startPos;
      const finalTarget = direction === 'FORWARD' ? endTarget : startTarget;
      camera.position.copy(finalPos);
      camera.lookAt(finalTarget);
      onComplete();
    }
  });

  return (
    <group name={`CinematicTransitionRoot_${transitionName}`}>
      {/* Dedicated Transition Shaft Lighting illuminating the stone flights */}
      <ambientLight color="#334155" intensity={1.1} />
      <directionalLight position={[12, 24, 16]} intensity={1.6} color="#dbeafe" />
      <directionalLight position={[-14, 16, -10]} intensity={1.3} color="#818cf8" />
      <directionalLight position={[0, -10, 10]} intensity={0.7} color="#38bdf8" />

      {/* Origin Level (Hero's Home) */}
      <group ref={originGroupRef} name="TransitionOriginGroup">
        {originLevel}
      </group>

      {/* Magical Floating Steps (Individual translucent crystal steps materializing in sky) */}
      <group ref={staircaseGroupRef} name="TransitionStaircaseGroup">
        <MagicalFloatingStairs progress={transitionProgress} />
      </group>

      {/* Destination Level (Grand Mage's Archive) */}
      <group ref={destGroupRef} name="TransitionDestGroup">
        {destLevel}
      </group>
    </group>
  );
};
