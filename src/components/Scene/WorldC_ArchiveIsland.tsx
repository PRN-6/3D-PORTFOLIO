import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ArchiveEnvironment } from './Archive/ArchiveEnvironment';
import { ArchiveFrieren } from './Archive/ArchiveFrieren';
import { FloatingBooks } from './Archive/FloatingBooks';
import { ArchiveGrimoires } from './Archive/ArchiveGrimoires';
import type { GrimoireItem } from '../../data/archiveData';

import { GLOBAL_ORBIT_CONFIG, enforceFixedDistance } from './useFixedCameraControls';

export interface WorldCArchiveIslandProps {
  disableCamera?: boolean;
  selectedGrimoire: GrimoireItem | null;
  onSelectGrimoire: (grimoire: GrimoireItem) => void;
  resetSignal?: number;
  onResetComplete?: () => void;
}

/**
 * Orbit & Inspection Camera Controller with strict fixed distance and zero zoom for Island 02
 */
const ArchiveCameraController: React.FC<{
  selectedGrimoire: GrimoireItem | null;
  resetSignal: number;
  onResetComplete?: () => void;
}> = ({ selectedGrimoire, resetSignal, onResetComplete }) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const isTransitioning = useRef(true);

  // Responsive focal length adjustments consistent with Hero's Home
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

  // Compute fixed viewing distance and target
  const { defaultCamPos, defaultTarget, fixedDistance } = useMemo(() => {
    let defaultCamPos: THREE.Vector3;
    let defaultTarget: THREE.Vector3;

    if (selectedGrimoire) {
      // Focus on the inspected grimoire with left offset on widescreen so right modal doesn't obstruct
      const [gx, gy, gz] = selectedGrimoire.position;
      defaultTarget = new THREE.Vector3(gx, gy + 0.15, gz);
      defaultCamPos = isMobile
        ? new THREE.Vector3(gx, gy + 1.1, gz + 3.8)
        : isTablet
        ? new THREE.Vector3(gx - 1.1, gy + 1.0, gz + 3.5)
        : new THREE.Vector3(gx - 1.6, gy + 0.9, gz + 3.1);
    } else {
      // Predetermined frontal viewing position of Grand Mage's Archive (Island 02)
      defaultCamPos = isMobile
        ? new THREE.Vector3(0.0, 10.8, 28.5)
        : isTablet
        ? new THREE.Vector3(0.0, 10.0, 26.5)
        : new THREE.Vector3(0.0, 9.2, 23.5);
      defaultTarget = new THREE.Vector3(0.0, 2.0, 0.0);
    }

    const fixedDistance = defaultCamPos.distanceTo(defaultTarget);
    return { defaultCamPos, defaultTarget, fixedDistance };
  }, [selectedGrimoire, isMobile, isTablet]);

  // Retrigger camera lerp on selection or reset signal
  useEffect(() => {
    isTransitioning.current = true;
  }, [selectedGrimoire, resetSignal]);

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

      // Library back wall collision: When orbiting behind the library (Z < -4.2),
      // ensure camera stays elevated above the upper roof
      if (camera.position.z < -4.2 && camera.position.y < 3.8) {
        camera.position.y = 3.8;
      }
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
      maxPolarAngle={Math.PI / 2.06} // Prevents camera from passing beneath the ground plane
      rotateSpeed={GLOBAL_ORBIT_CONFIG.rotateSpeed}
      touches={GLOBAL_ORBIT_CONFIG.touches}
      mouseButtons={GLOBAL_ORBIT_CONFIG.mouseButtons}
      enabled={!selectedGrimoire}
      target={[0, 2.0, 0]}
    />
  );
};

export const WorldC_ArchiveIsland: React.FC<WorldCArchiveIslandProps> = ({
  disableCamera = false,
  selectedGrimoire,
  onSelectGrimoire,
  resetSignal = 0,
  onResetComplete,
}) => {
  return (
    <group name="WorldC_ArchiveIslandRoot">
      {/* Deep Magical Twilight Atmosphere & Celestial Stars */}
      <color attach="background" args={['#030409']} />
      <fog attach="fog" args={['#030409', 22, 75]} />

      <Stars
        radius={220}
        depth={50}
        count={2500}
        factor={4.5}
        saturation={0.95}
        fade
        speed={1.2}
      />

      {/* Floating Arcane Dust Particles */}
      <Sparkles
        count={65}
        scale={[24, 14, 24]}
        position={[0, 4, 2]}
        size={2.6}
        speed={0.3}
        color="#818cf8"
        opacity={0.5}
      />

      {/* Local Archive Atmosphere Accents */}
      {/* Electric Cyan Edge Bounce */}
      <directionalLight position={[12, -2, 6]} intensity={0.7} color="#38bdf8" />

      {/* Warm Candle Light from Chandeliers and Reading Area */}
      <pointLight position={[-1.25, 2.5, 0.5]} color="#fbbf24" intensity={1.8} distance={7} decay={2} />
      <pointLight position={[0, 4.0, 3.0]} color="#f59e0b" intensity={1.4} distance={9} decay={2} />

      {/* 1. Grand Archive Environment (Island + Library + Chandeliers) */}
      <ArchiveEnvironment />

      {/* 2. Floating Books & Turning Parchment Pages */}
      <FloatingBooks />

      {/* 3. Frieren Studious Reading in Sanctuary with Rotating Magic Circle */}
      <ArchiveFrieren
        position={[-1.25, 0.36, 0.25]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />

      {/* 4. 6 Interactive Grimoires Arc on Carved Pedestals with built-in Hover Animations */}
      <ArchiveGrimoires
        selectedGrimoire={selectedGrimoire}
        onSelectGrimoire={onSelectGrimoire}
      />

      {/* 5. Archive Orbit & Focus Camera with Collision Boundaries */}
      {!disableCamera && (
        <ArchiveCameraController
          selectedGrimoire={selectedGrimoire}
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
        />
      )}
    </group>
  );
};
