import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from '../useFixedCameraControls';

export type ForestLandmark = 'overview' | 'biography' | 'heiter' | 'ancientTree' | 'pond' | 'arrival';

export interface ForestCameraControllerProps {
  resetSignal?: number;
  focusedLandmark?: ForestLandmark;
  onResetComplete?: () => void;
}

export const ForestCameraController: React.FC<ForestCameraControllerProps> = ({
  resetSignal = 0,
  focusedLandmark = 'overview',
  onResetComplete,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isTransitioning = useRef(true);

  // Responsive focal length adjustments consistent with Islands 01 & 02
  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / size.height;
      const framingScale = isMobile
        ? Math.min(0.65, aspect * 1.20)
        : isTablet
        ? Math.min(0.85, aspect * 0.95)
        : Math.min(1.0, aspect * 0.84);
      const halfFov = THREE.MathUtils.degToRad(45 / 2);
      camera.setFocalLength((camera.getFilmHeight() * framingScale) / (2 * Math.tan(halfFov)));
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, isMobile, isTablet]);

  // Compute fixed camera positions and distances per landmark
  const { defaultCamPos, defaultTarget, fixedDistance, targetLookAtArray } = useMemo(() => {
    let defaultCamPos: THREE.Vector3;
    let defaultTarget: THREE.Vector3;

    switch (focusedLandmark) {
      case 'biography':
        defaultCamPos = isMobile
          ? new THREE.Vector3(1.35, 2.1, 3.2)
          : new THREE.Vector3(1.35, 1.85, 2.6);
        defaultTarget = new THREE.Vector3(1.35, 1.25, 0.5);
        break;
      case 'heiter':
        defaultCamPos = new THREE.Vector3(-2.2, 2.4, 4.2);
        defaultTarget = new THREE.Vector3(-5.58, 1.0, 1.7);
        break;
      case 'ancientTree':
        defaultCamPos = new THREE.Vector3(-8.5, 7.5, 9.5);
        defaultTarget = new THREE.Vector3(0.7, 3.2, -2.6);
        break;
      case 'pond':
        defaultCamPos = new THREE.Vector3(-11.5, 7.5, 12.0);
        defaultTarget = new THREE.Vector3(-3.7, 0.3, 3.1);
        break;
      case 'arrival':
        defaultCamPos = new THREE.Vector3(0.8, 2.8, 12.5);
        defaultTarget = new THREE.Vector3(0.8, 0.5, 6.3);
        break;
      case 'overview':
      default:
        // Matches preview overview framing
        defaultCamPos = isMobile
          ? new THREE.Vector3(22.0, 16.0, 26.0)
          : isTablet
          ? new THREE.Vector3(21.0, 16.0, 25.0)
          : new THREE.Vector3(19.0, 15.0, 23.0);
        defaultTarget = isMobile
          ? new THREE.Vector3(0.0, 1.0, 0.0)
          : new THREE.Vector3(0.0, 1.2, 0.0);
        break;
    }

    const fixedDistance = defaultCamPos.distanceTo(defaultTarget);
    const targetLookAtArray: [number, number, number] = [
      defaultTarget.x,
      defaultTarget.y,
      defaultTarget.z,
    ];

    return { defaultCamPos, defaultTarget, fixedDistance, targetLookAtArray };
  }, [focusedLandmark, isMobile, isTablet]);

  useEffect(() => {
    isTransitioning.current = true;
  }, [resetSignal, focusedLandmark]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      const step = Math.min(delta * 3.5, 0.18);
      camera.position.lerp(defaultCamPos, step);
      controlsRef.current.target.lerp(defaultTarget, step);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(defaultCamPos);
      const distTarget = controlsRef.current.target.distanceTo(defaultTarget);

      if (distPos < 0.08 && distTarget < 0.08) {
        camera.position.copy(defaultCamPos);
        controlsRef.current.target.copy(defaultTarget);
        controlsRef.current.update();
        isTransitioning.current = false;
        onResetComplete?.();
      }
    } else {
      // RULE: ROTATION IS ALLOWED. ZOOM IS NEVER ALLOWED.
      // Strict mathematical spherical locking: radius is constant at fixedDistance
      enforceFixedDistance(camera, controlsRef.current.target, fixedDistance, 0.65);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false} // NEVER allow zoom
      enablePan={false}  // NEVER allow pan (maintains fixed center target)
      enableDamping
      dampingFactor={GLOBAL_ORBIT_CONFIG.dampingFactor}
      minDistance={fixedDistance} // Strict distance lock
      maxDistance={fixedDistance} // Strict distance lock
      minPolarAngle={Math.PI / 4.5}
      maxPolarAngle={Math.PI / 2.05} // Prevents camera from passing beneath the ground plane
      rotateSpeed={GLOBAL_ORBIT_CONFIG.rotateSpeed}
      touches={GLOBAL_ORBIT_CONFIG.touches}
      mouseButtons={GLOBAL_ORBIT_CONFIG.mouseButtons}
      target={targetLookAtArray}
    />
  );
};
