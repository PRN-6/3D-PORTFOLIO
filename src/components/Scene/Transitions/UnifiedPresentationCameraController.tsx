import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SCENE_CONFIG } from '../../../config/sceneConfig';
import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from '../useFixedCameraControls';
import type { GrimoireItem } from '../../../data/archiveData';
import type { DestinationId } from './explodedConfig';

export interface UnifiedPresentationCameraControllerProps {
  isTransitioning?: boolean;
  resetSignal?: number;
  onResetComplete?: () => void;
  selectedGrimoire?: GrimoireItem | null;
  activeIsland?: DestinationId;
}

/**
 * UnifiedPresentationCameraController
 *
 * Enforces:
 * 1. ZERO camera movement during transitions (camera remains 100% stationary).
 * 2. Strict fixed distance lock across all 4 islands (zero zoom).
 * 3. Smooth 360° rotation around the shared presentation anchor [0, 0.8, 0].
 * 4. Zero teleportation or position jumps between islands.
 * 5. Dramatic Cinematic Book Inspection: When a grimoire book is clicked on the Archive island,
 *    camera glides smoothly DOWN to a heroic low-angle upward tilt while the island rises and books float.
 *    Smoothly restores back to standard presentation framing when closed.
 */
export const UnifiedPresentationCameraController: React.FC<UnifiedPresentationCameraControllerProps> = ({
  isTransitioning = false,
  resetSignal = 0,
  onResetComplete,
  selectedGrimoire = null,
  activeIsland = 'HOME',
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isResetting = useRef(false);
  const isReturningFromInspect = useRef(false);

  // Responsive focal length adjustments consistent with established framing
  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / size.height;
      const framingScale = isMobile
        ? Math.min(0.65, aspect * 1.20)
        : isTablet
        ? Math.min(0.85, aspect * 0.95)
        : Math.min(1.0, aspect * 0.84);
      const halfFov = THREE.MathUtils.degToRad(SCENE_CONFIG.camera.fov / 2);
      camera.setFocalLength((camera.getFilmHeight() * framingScale) / (2 * Math.tan(halfFov)));
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, isMobile, isTablet]);

  // Unified presentation anchor target and default framing
  const { defaultCamPos, presentationTarget, fixedDistance } = useMemo(() => {
    const defaultCamPos = isMobile
      ? new THREE.Vector3(12.5, 12.0, 12.5)
      : isTablet
      ? new THREE.Vector3(13.0, 11.0, 13.0)
      : new THREE.Vector3(14.0, 10.0, 14.0);
    const presentationTarget = isMobile
      ? new THREE.Vector3(0.0, 1.0, 0.0)
      : new THREE.Vector3(0.0, 0.8, 0.0);
    const fixedDistance = defaultCamPos.distanceTo(presentationTarget);
    return { defaultCamPos, presentationTarget, fixedDistance };
  }, [isMobile, isTablet]);

  // Dramatic cinematic low camera position when inspecting a book on Archive island:
  // Camera moves DOWN (y drops from 10.0 down to ~2.2) and tilts UPWARD toward the rising island & books.
  // Framed to center the action in the open viewport to the left of the drawer modal.
  const { inspectCamPos, inspectTarget } = useMemo(() => {
    let inspectCamPos: THREE.Vector3;
    let inspectTarget: THREE.Vector3;

    if (isMobile) {
      inspectCamPos = new THREE.Vector3(6.5, 2.5, 11.0);
      inspectTarget = new THREE.Vector3(0.0, 2.8, 0.0);
    } else if (isTablet) {
      inspectCamPos = new THREE.Vector3(6.8, 2.3, 11.5);
      inspectTarget = new THREE.Vector3(1.2, 2.8, 0.0);
    } else {
      // Desktop: Camera at [7.0, 2.2, 12.0], target at [1.8, 2.8, 0.0]
      // This places the island and floating book centered in the left 60% of the screen!
      inspectCamPos = new THREE.Vector3(7.0, 2.2, 12.0);
      inspectTarget = new THREE.Vector3(1.8, 2.8, 0.0);
    }

    return { inspectCamPos, inspectTarget };
  }, [isMobile, isTablet]);

  const isInspecting = activeIsland === 'ARCHIVE' && !!selectedGrimoire;
  const prevInspectingRef = useRef(isInspecting);

  // Detect when inspection modal closes to smoothly return camera back UP
  useEffect(() => {
    if (prevInspectingRef.current && !isInspecting) {
      isReturningFromInspect.current = true;
    }
    prevInspectingRef.current = isInspecting;
  }, [isInspecting]);

  // Handle camera reset signal
  useEffect(() => {
    if (resetSignal > 0) {
      isResetting.current = true;
    }
  }, [resetSignal]);

  useFrame((_, delta) => {
    if (isTransitioning) {
      // RULE: Zero camera movement during island bubble transition
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      return;
    }

    if (!controlsRef.current) return;

    // =========================================================================
    // 1. BOOK INSPECTION ANIMATION: Camera moves DOWN, tilts UP toward floating books
    // =========================================================================
    if (isInspecting) {
      controlsRef.current.enabled = false;
      const step = Math.min(delta * 3.5, 0.16);
      camera.position.lerp(inspectCamPos, step);
      camera.lookAt(inspectTarget);
      return;
    }

    // =========================================================================
    // 2. RETURNING FROM INSPECTION: Camera glides back UP to default framing
    // =========================================================================
    if (isReturningFromInspect.current) {
      controlsRef.current.enabled = false;
      const step = Math.min(delta * 3.5, 0.16);
      camera.position.lerp(defaultCamPos, step);
      camera.lookAt(presentationTarget);

      const distPos = camera.position.distanceTo(defaultCamPos);
      if (distPos < 0.08) {
        camera.position.copy(defaultCamPos);
        controlsRef.current.target.copy(presentationTarget);
        controlsRef.current.update();
        controlsRef.current.enabled = true;
        isReturningFromInspect.current = false;
      }
      return;
    }

    // =========================================================================
    // 3. RESET CAMERA SIGNAL
    // =========================================================================
    if (isResetting.current) {
      controlsRef.current.enabled = false;
      const step = Math.min(delta * 3.5, 0.18);
      camera.position.lerp(defaultCamPos, step);
      controlsRef.current.target.lerp(presentationTarget, step);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(defaultCamPos);
      const distTarget = controlsRef.current.target.distanceTo(presentationTarget);

      if (distPos < 0.05 && distTarget < 0.05) {
        camera.position.copy(defaultCamPos);
        controlsRef.current.target.copy(presentationTarget);
        controlsRef.current.update();
        isResetting.current = false;
        if (onResetComplete) onResetComplete();
      }
      return;
    }

    // =========================================================================
    // 4. STANDARD PRESENTATION ORBIT CONTROLS
    // =========================================================================
    controlsRef.current.enabled = true;
    enforceFixedDistance(camera, controlsRef.current.target, fixedDistance, 2.5);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false} // NEVER allow zoom
      enablePan={false}  // NEVER allow pan
      enableDamping
      dampingFactor={GLOBAL_ORBIT_CONFIG.dampingFactor}
      minDistance={fixedDistance}
      maxDistance={fixedDistance}
      minPolarAngle={Math.PI / 4.5}
      maxPolarAngle={Math.PI / 2.06}
      rotateSpeed={GLOBAL_ORBIT_CONFIG.rotateSpeed}
      touches={GLOBAL_ORBIT_CONFIG.touches}
      mouseButtons={GLOBAL_ORBIT_CONFIG.mouseButtons}
      target={[presentationTarget.x, presentationTarget.y, presentationTarget.z]}
      enabled={!isTransitioning && !isInspecting && !isReturningFromInspect.current}
    />
  );
};

