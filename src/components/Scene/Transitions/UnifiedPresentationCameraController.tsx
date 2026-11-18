import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SCENE_CONFIG } from '../../../config/sceneConfig';
import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from '../useFixedCameraControls';

export interface UnifiedPresentationCameraControllerProps {
  isTransitioning?: boolean;
  resetSignal?: number;
  onResetComplete?: () => void;
}

/**
 * UnifiedPresentationCameraController
 *
 * Enforces:
 * 1. ZERO camera movement during transitions (camera remains 100% stationary).
 * 2. Strict fixed distance lock across all 4 islands (zero zoom).
 * 3. Smooth 360° rotation around the shared presentation anchor [0, 0.8, 0].
 * 4. Zero teleportation or position jumps between islands.
 */
export const UnifiedPresentationCameraController: React.FC<UnifiedPresentationCameraControllerProps> = ({
  isTransitioning = false,
  resetSignal = 0,
  onResetComplete,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isResetting = useRef(false);

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

  // Handle camera reset signal
  useEffect(() => {
    if (resetSignal > 0) {
      isResetting.current = true;
    }
  }, [resetSignal]);

  useFrame((_, delta) => {
    if (isTransitioning) {
      // RULE: Zero camera movement during transition
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      return;
    }

    if (!controlsRef.current) return;
    controlsRef.current.enabled = true;

    if (isResetting.current) {
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

    // Keep camera at exact fixed distance during manual rotation
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
      enabled={!isTransitioning}
    />
  );
};

