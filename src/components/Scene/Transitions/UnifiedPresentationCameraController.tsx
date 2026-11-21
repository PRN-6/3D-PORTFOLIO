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
  inspectDescentY?: number;
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
  inspectDescentY = 0,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isResetting = useRef(false);
  const isReturningFromInspect = useRef(false);
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.8, 0));

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
    // 1. BOOK INSPECTION ANIMATION: Camera follows the bubble down to front eye-level!
    // =========================================================================
    if (isInspecting) {
      controlsRef.current.enabled = false;

      // Progress from 0 (at island) to 1 (at new page Y = -10.0)
      const progress = THREE.MathUtils.clamp(-inspectDescentY / 10.0, 0.0, 1.0);

      // Target front framing at new page: [0, -10.0, 16.5], looking at [0, -10.0, 0]
      const frontCamX = 0.0;
      const frontCamY = -10.0;
      const frontCamZ = isMobile ? 18.0 : 16.5;

      const frontLookX = 0.0;
      const frontLookY = -10.0;
      const frontLookZ = 0.0;

      const targetCamX = THREE.MathUtils.lerp(defaultCamPos.x, frontCamX, progress);
      const targetCamY = THREE.MathUtils.lerp(defaultCamPos.y, frontCamY, progress);
      const targetCamZ = THREE.MathUtils.lerp(defaultCamPos.z, frontCamZ, progress);

      const targetLookX = THREE.MathUtils.lerp(presentationTarget.x, frontLookX, progress);
      const targetLookY = THREE.MathUtils.lerp(presentationTarget.y, frontLookY, progress);
      const targetLookZ = THREE.MathUtils.lerp(presentationTarget.z, frontLookZ, progress);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.5, delta);

      currentLookAtRef.current.x = THREE.MathUtils.damp(currentLookAtRef.current.x, targetLookX, 3.5, delta);
      currentLookAtRef.current.y = THREE.MathUtils.damp(currentLookAtRef.current.y, targetLookY, 3.5, delta);
      currentLookAtRef.current.z = THREE.MathUtils.damp(currentLookAtRef.current.z, targetLookZ, 3.5, delta);

      camera.lookAt(currentLookAtRef.current);
      return;
    }

    // =========================================================================
    // 2. RETURNING FROM INSPECTION: Camera returns back UP to resting framing
    // =========================================================================
    if (isReturningFromInspect.current) {
      controlsRef.current.enabled = false;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, defaultCamPos.x, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, defaultCamPos.y, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, defaultCamPos.z, 3.5, delta);

      currentLookAtRef.current.x = THREE.MathUtils.damp(currentLookAtRef.current.x, presentationTarget.x, 3.5, delta);
      currentLookAtRef.current.y = THREE.MathUtils.damp(currentLookAtRef.current.y, presentationTarget.y, 3.5, delta);
      currentLookAtRef.current.z = THREE.MathUtils.damp(currentLookAtRef.current.z, presentationTarget.z, 3.5, delta);

      camera.lookAt(currentLookAtRef.current);

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

