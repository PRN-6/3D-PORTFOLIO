import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SCENE_CONFIG } from '../../config/sceneConfig';

export interface CameraControllerProps {
  resetSignal?: number;
  onResetComplete?: () => void;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  resetSignal = 0,
  onResetComplete,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const framingScale = Math.min(1, size.width / size.height * 0.84);
      const halfFov = THREE.MathUtils.degToRad(SCENE_CONFIG.camera.fov / 2);
      camera.setFocalLength(camera.getFilmHeight() * framingScale / (2 * Math.tan(halfFov)));
    }
  }, [camera, size.width, size.height]);

  // Desired reset targets
  const initialPos = useRef(new THREE.Vector3(...SCENE_CONFIG.camera.initialPosition));
  const initialTarget = useRef(new THREE.Vector3(...SCENE_CONFIG.camera.target));

  const isResetting = useRef(false);
  const resetProgress = useRef(0);

  // Trigger smooth reset when resetSignal increments
  useEffect(() => {
    if (resetSignal > 0) {
      isResetting.current = true;
      resetProgress.current = 0;
    }
  }, [resetSignal]);

  // Smooth lerp camera and target back to starting isometric pose
  useFrame((_, delta) => {
    if (!isResetting.current || !controlsRef.current) return;

    // Use exponential smooth approach
    const step = Math.min(delta * 4.5, 0.2);
    camera.position.lerp(initialPos.current, step);
    controlsRef.current.target.lerp(initialTarget.current, step);
    controlsRef.current.update();

    const distPos = camera.position.distanceTo(initialPos.current);
    const distTarget = controlsRef.current.target.distanceTo(initialTarget.current);

    if (distPos < 0.05 && distTarget < 0.05) {
      camera.position.copy(initialPos.current);
      controlsRef.current.target.copy(initialTarget.current);
      controlsRef.current.update();
      isResetting.current = false;
      onResetComplete?.();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={SCENE_CONFIG.camera.dampingFactor}
      minDistance={SCENE_CONFIG.camera.minDistance}
      maxDistance={SCENE_CONFIG.camera.maxDistance}
      minPolarAngle={SCENE_CONFIG.camera.minPolarAngle}
      maxPolarAngle={SCENE_CONFIG.camera.maxPolarAngle}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
      target={SCENE_CONFIG.camera.target}
    />
  );
};

