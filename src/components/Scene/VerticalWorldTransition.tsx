import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { WorldA_HeroIsland } from './WorldA_HeroIsland';
import { WorldB_ProjectUniverse } from './WorldB_ProjectUniverse';
import type { ProjectItem } from '../../data/projectsData';

interface VerticalWorldTransitionProps {
  direction: 'DOWN' | 'UP';
  onComplete: () => void;
  selectedProject: ProjectItem | null;
  onSelectProject: (project: ProjectItem) => void;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export const VerticalWorldTransition: React.FC<VerticalWorldTransitionProps> = ({
  direction,
  onComplete,
  selectedProject,
  onSelectProject,
}) => {
  const { camera, size } = useThree();
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Group reference for island translation only
  const islandGroupRef = useRef<THREE.Group>(null);
  const [cubeOffsetY, setCubeOffsetY] = React.useState<number>(
    direction === 'DOWN' ? -38 : 0
  );

  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  // Island default camera pose
  const islandCamPos = useMemo(() => new THREE.Vector3(14, 10, 14), []);
  const islandTarget = useMemo(() => new THREE.Vector3(0, 0.5, 0), []);

  // Showcase default camera pose: closely framed for mobile and tablet to eliminate empty space
  const showcaseCamPos = useMemo(
    () =>
      isMobile
        ? new THREE.Vector3(0, 1.65, 17.5)
        : isTablet
        ? new THREE.Vector3(0, 1.65, 16.0)
        : new THREE.Vector3(0, 2.2, 14.8),
    [isMobile, isTablet]
  );
  const showcaseTarget = useMemo(
    () =>
      isMobile || isTablet
        ? new THREE.Vector3(0, 1.65, 0)
        : new THREE.Vector3(0, 1.5, 0),
    [isMobile, isTablet]
  );

  // Snapshot the camera position and look direction at the start of transition
  const startCamPos = useMemo(() => camera.position.clone(), [camera]);
  const startTarget = useMemo(() => {
    // Project ray forward to determine current focus target
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const dist = camera.position.length();
    return camera.position.clone().add(dir.multiplyScalar(dist > 5 ? dist : 15));
  }, [camera]);

  const DURATION = 2.4; // 2.4 seconds for cinematic easing
  const VERTICAL_TRAVEL = 38; // Vertical travel distance in units

  useFrame((state) => {
    if (completedRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const rawProgress = THREE.MathUtils.clamp(elapsed / DURATION, 0, 1);
    const eased = easeInOutCubic(rawProgress);

    if (direction === 'DOWN') {
      // -----------------------------------------------------------
      // TRAVEL DOWNWARD:
      // Island moves UP & out of view
      // Characters remain STATIONARY at their grounded positions
      // ONLY the project cubes smoothly emerge upward from below
      // -----------------------------------------------------------
      const islandY = eased * VERTICAL_TRAVEL;
      const currentCubeOffset = (1 - eased) * -VERTICAL_TRAVEL;

      if (islandGroupRef.current) islandGroupRef.current.position.set(0, islandY, 0);
      setCubeOffsetY(currentCubeOffset);

      // Camera smoothly descends from current island position to showcase position
      const plungeDip = Math.sin(eased * Math.PI) * 1.2;
      const curCamX = THREE.MathUtils.lerp(startCamPos.x, showcaseCamPos.x, eased);
      const curCamY = THREE.MathUtils.lerp(startCamPos.y, showcaseCamPos.y, eased) - plungeDip;
      const curCamZ = THREE.MathUtils.lerp(startCamPos.z, showcaseCamPos.z, eased);

      const curTargetX = THREE.MathUtils.lerp(startTarget.x, showcaseTarget.x, eased);
      const curTargetY = THREE.MathUtils.lerp(startTarget.y, showcaseTarget.y, eased);
      const curTargetZ = THREE.MathUtils.lerp(startTarget.z, showcaseTarget.z, eased);

      camera.position.set(curCamX, curCamY, curCamZ);
      camera.lookAt(curTargetX, curTargetY, curTargetZ);
    } else {
      // -----------------------------------------------------------
      // TRAVEL UPWARD (RETURN):
      // ONLY the project cubes smoothly sink downward out of view
      // Characters remain STATIONARY at their grounded positions
      // Island smoothly descends into view from above
      // -----------------------------------------------------------
      const currentCubeOffset = eased * -VERTICAL_TRAVEL;
      const islandY = (1 - eased) * VERTICAL_TRAVEL;

      if (islandGroupRef.current) islandGroupRef.current.position.set(0, islandY, 0);
      setCubeOffsetY(currentCubeOffset);

      // Camera smoothly ascends from showcase back to island home
      const liftArc = Math.sin(eased * Math.PI) * 1.2;
      const curCamX = THREE.MathUtils.lerp(startCamPos.x, islandCamPos.x, eased);
      const curCamY = THREE.MathUtils.lerp(startCamPos.y, islandCamPos.y, eased) + liftArc;
      const curCamZ = THREE.MathUtils.lerp(startCamPos.z, islandCamPos.z, eased);

      const curTargetX = THREE.MathUtils.lerp(startTarget.x, islandTarget.x, eased);
      const curTargetY = THREE.MathUtils.lerp(startTarget.y, islandTarget.y, eased);
      const curTargetZ = THREE.MathUtils.lerp(startTarget.z, islandTarget.z, eased);

      camera.position.set(curCamX, curCamY, curCamZ);
      camera.lookAt(curTargetX, curTargetY, curTargetZ);
    }

    if (rawProgress >= 1.0 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group name="VerticalWorldTransitionRoot">
      {/* World A: Floating Island (Animates vertically during transition) */}
      <group ref={islandGroupRef} name="TransitionIslandGroup">
        <WorldA_HeroIsland disableCamera={true} />
      </group>

      {/* World B: Project Universe
          - Only ProjectCubeGroup translates with cubeGroupOffsetY */}
      <WorldB_ProjectUniverse
        disableCamera={true}
        selectedProject={selectedProject}
        onSelectProject={onSelectProject}
        cubeGroupOffsetY={cubeOffsetY}
      />
    </group>
  );
};

