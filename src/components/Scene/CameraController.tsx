import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import type { ProjectItem } from '../../data/projectsData';

export interface CameraControllerProps {
  resetSignal?: number;
  onResetComplete?: () => void;
  showcaseActive?: boolean;
  selectedProject?: ProjectItem | null;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  resetSignal = 0,
  onResetComplete,
  showcaseActive = false,
  selectedProject = null,
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const framingScale = Math.min(1, ((size.width / size.height) * 0.84));
      const halfFov = THREE.MathUtils.degToRad(SCENE_CONFIG.camera.fov / 2);
      camera.setFocalLength((camera.getFilmHeight() * framingScale) / (2 * Math.tan(halfFov)));
    }
  }, [camera, size.width, size.height]);

  // Target positions
  const islandPos = useRef(new THREE.Vector3(...SCENE_CONFIG.camera.initialPosition));
  const islandTarget = useRef(new THREE.Vector3(...SCENE_CONFIG.camera.target));

  const showcasePos = useRef(new THREE.Vector3(0, 2.4, 13.5));
  const showcaseTarget = useRef(new THREE.Vector3(0, 1.8, 0));

  const inspectingPos = useRef(new THREE.Vector3(-1.2, 1.5, 10.5));
  const inspectingTarget = useRef(new THREE.Vector3(-0.4, 1.3, 7.5));

  const isTransitioning = useRef(false);

  // Trigger transition when showcase mode or selected project changes
  useEffect(() => {
    isTransitioning.current = true;
  }, [showcaseActive, selectedProject, resetSignal]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    let targetCamPos: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    if (!showcaseActive) {
      targetCamPos = islandPos.current;
      targetLookAt = islandTarget.current;
    } else if (selectedProject) {
      // Offset slightly to left on widescreen so right-hand modal doesn't occlude cube
      targetCamPos = size.width > 768 ? inspectingPos.current : new THREE.Vector3(0, 1.5, 11);
      targetLookAt = size.width > 768 ? inspectingTarget.current : new THREE.Vector3(0, 1.3, 7.8);
    } else {
      targetCamPos = showcasePos.current;
      targetLookAt = showcaseTarget.current;
    }

    if (isTransitioning.current) {
      const step = Math.min(delta * 3.8, 0.2);
      camera.position.lerp(targetCamPos, step);
      controlsRef.current.target.lerp(targetLookAt, step);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetCamPos);
      const distTarget = controlsRef.current.target.distanceTo(targetLookAt);

      if (distPos < 0.08 && distTarget < 0.08) {
        camera.position.copy(targetCamPos);
        controlsRef.current.target.copy(targetLookAt);
        controlsRef.current.update();
        isTransitioning.current = false;
        onResetComplete?.();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={SCENE_CONFIG.camera.dampingFactor}
      minDistance={showcaseActive ? 4 : SCENE_CONFIG.camera.minDistance}
      maxDistance={showcaseActive ? 28 : SCENE_CONFIG.camera.maxDistance}
      minPolarAngle={showcaseActive ? Math.PI / 4 : SCENE_CONFIG.camera.minPolarAngle}
      maxPolarAngle={showcaseActive ? Math.PI / 1.8 : SCENE_CONFIG.camera.maxPolarAngle}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
      enabled={!selectedProject} // Lock orbit while inspecting a selected project cube
      target={showcaseActive ? [0, 1.8, 0] : SCENE_CONFIG.camera.target}
    />
  );
};
