import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from '../useFixedCameraControls';
import type { ForestLandmark } from '../Forest/ForestCameraController';

export interface GardenCameraControllerProps {
  resetSignal?: number;
  focusedLandmark?: ForestLandmark;
  onResetComplete?: () => void;
}

export const GardenCameraController: React.FC<GardenCameraControllerProps> = ({
  resetSignal = 0,
  focusedLandmark = 'overview',
  onResetComplete,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isTransitioning = useRef(true);

  // Responsive focal length adjustments
  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = 0.1;
      camera.far = 1000;
      const aspect = size.width / size.height;
      const framingScale = isMobile
        ? Math.min(0.68, aspect * 1.25)
        : isTablet
        ? Math.min(0.88, aspect * 0.95)
        : Math.min(1.0, aspect * 0.84);
      const halfFov = THREE.MathUtils.degToRad(42 / 2);
      camera.setFocalLength((camera.getFilmHeight() * framingScale) / (2 * Math.tan(halfFov)));
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, isMobile, isTablet]);

  // Compute fixed camera positions and targets per landmark
  const { defaultCamPos, defaultTarget, fixedDistance, targetLookAtArray } = useMemo(() => {
    let defaultCamPos: THREE.Vector3;
    let defaultTarget: THREE.Vector3;

    switch (focusedLandmark) {
      case 'biography':
        defaultCamPos = isMobile
          ? new THREE.Vector3(1.6, 1.8, 3.0)
          : new THREE.Vector3(1.4, 1.6, 2.4);
        defaultTarget = new THREE.Vector3(1.4, 0.75, 0.8);
        break;

      case 'heiter':
      case 'characters' as ForestLandmark:
        // Intimate frontal view of Himmel & Frieren
        defaultCamPos = isMobile
          ? new THREE.Vector3(0.0, 1.35, 4.2)
          : new THREE.Vector3(0.0, 1.25, 3.6);
        defaultTarget = new THREE.Vector3(0.0, 0.65, 0.1);
        break;

      case 'ancientTree':
      case 'flowers' as ForestLandmark:
        // Sweeping cinematic flower meadow view
        defaultCamPos = isMobile
          ? new THREE.Vector3(2.8, 1.4, 3.4)
          : new THREE.Vector3(2.4, 1.2, 2.8);
        defaultTarget = new THREE.Vector3(0.0, 0.52, 0.3);
        break;

      case 'pond':
      case 'underside' as ForestLandmark:
        // View of floating crystal rocks and crags
        defaultCamPos = isMobile
          ? new THREE.Vector3(2.8, -2.8, 11.5)
          : new THREE.Vector3(2.5, -2.4, 9.5);
        defaultTarget = new THREE.Vector3(0.0, -1.8, 0.0);
        break;

      case 'overview':
      default:
        // Aerial meadow overview (frames complete floating island including rocky underside)
        defaultCamPos = isMobile
          ? new THREE.Vector3(16.5, 11.5, 16.5)
          : isTablet
          ? new THREE.Vector3(14.8, 10.0, 14.8)
          : new THREE.Vector3(13.8, 9.2, 13.8);
        defaultTarget = isMobile
          ? new THREE.Vector3(0.0, 0.70, 0.0)
          : new THREE.Vector3(0.0, 0.65, 0.0);
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
      enforceFixedDistance(camera, controlsRef.current.target, fixedDistance, 0.65);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false}
      enablePan={false}
      enableDamping
      dampingFactor={GLOBAL_ORBIT_CONFIG.dampingFactor}
      minDistance={fixedDistance}
      maxDistance={fixedDistance}
      minPolarAngle={Math.PI / 4.5}
      maxPolarAngle={Math.PI / 1.95}
      rotateSpeed={GLOBAL_ORBIT_CONFIG.rotateSpeed}
      touches={GLOBAL_ORBIT_CONFIG.touches}
      mouseButtons={GLOBAL_ORBIT_CONFIG.mouseButtons}
      target={targetLookAtArray}
    />
  );
};

