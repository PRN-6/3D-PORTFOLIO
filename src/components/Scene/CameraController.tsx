import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import type { ProjectItem } from '../../data/projectsData';
import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from './useFixedCameraControls';

export interface CameraControllerProps {
  resetSignal?: number;
  onResetComplete?: () => void;
  selectedProject?: ProjectItem | null;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  resetSignal = 0,
  onResetComplete,
  selectedProject = null,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / size.height;

      // Frame the island to fill ~94-96% screen width on mobile
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

  // Target positions & established default island framing
  const { defaultCamPos, defaultTarget, fixedDistance, minPolarAngle, maxPolarAngle, targetLookAtArray } =
    useMemo(() => {
      // HERO'S HOME: Established front-facing default framing
      const defaultCamPos = isMobile
        ? new THREE.Vector3(12.5, 12.0, 12.5)
        : isTablet
        ? new THREE.Vector3(13.0, 11.0, 13.0)
        : new THREE.Vector3(14.0, 10.0, 14.0);
      const defaultTarget = isMobile
        ? new THREE.Vector3(0.0, 1.0, 0.0)
        : new THREE.Vector3(0.0, 0.5, 0.0);
      const minPolarAngle = Math.PI / 4.5;
      const maxPolarAngle = Math.PI / 2.08; // Cannot clip below ground

      const fixedDistance = defaultCamPos.distanceTo(defaultTarget);
      const targetLookAtArray: [number, number, number] = [
        defaultTarget.x,
        defaultTarget.y,
        defaultTarget.z,
      ];

      return {
        defaultCamPos,
        defaultTarget,
        fixedDistance,
        minPolarAngle,
        maxPolarAngle,
        targetLookAtArray,
      };
    }, [isMobile, isTablet]);

  const isTransitioning = useRef(false);

  // Trigger smooth transition/reset when reset is signaled
  useEffect(() => {
    isTransitioning.current = true;
  }, [resetSignal]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      const step = Math.min(delta * 3.8, 0.2);
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
      enforceFixedDistance(camera, controlsRef.current.target, fixedDistance, 0.5);
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
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      rotateSpeed={GLOBAL_ORBIT_CONFIG.rotateSpeed}
      touches={GLOBAL_ORBIT_CONFIG.touches}
      mouseButtons={GLOBAL_ORBIT_CONFIG.mouseButtons}
      enabled={!selectedProject} // Lock orbit while modal is open
      target={targetLookAtArray}
    />
  );
};
