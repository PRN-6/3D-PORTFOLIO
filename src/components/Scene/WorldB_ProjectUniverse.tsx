import React from 'react';
import { Stars, Sparkles } from '@react-three/drei';
import { CubeShowcase } from './CubeShowcase';
import { ShowcaseCharacters } from './ShowcaseCharacters';
import { CameraController } from './CameraController';
import type { ProjectItem } from '../../data/projectsData';

interface WorldBProjectUniverseProps {
  disableCamera?: boolean;
  selectedProject: ProjectItem | null;
  onSelectProject: (project: ProjectItem) => void;
  resetSignal?: number;
  onResetComplete?: () => void;
  cubeGroupOffsetY?: number;
  showCharacters?: boolean;
}

export const WorldB_ProjectUniverse: React.FC<WorldBProjectUniverseProps> = ({
  disableCamera = false,
  selectedProject,
  onSelectProject,
  resetSignal = 0,
  onResetComplete,
  cubeGroupOffsetY = 0,
  showCharacters = true,
}) => {
  return (
    <group name="WorldB_ProjectUniverseRoot">
      {/* Deep Celestial Black/Midnight Atmospheric Background */}
      <color attach="background" args={['#030409']} />
      <fog attach="fog" args={['#030409', 24, 85]} />

      {/* Shimmering Cosmic Starfield across the 3D Sphere */}
      <Stars
        radius={250}
        depth={60}
        count={2000}
        factor={4.5}
        saturation={0.9}
        fade
        speed={1.0}
      />

      {/* Ambient Cosmic Dust Particles */}
      <Sparkles
        count={55}
        scale={[28, 16, 28]}
        position={[0, 2.5, 0]}
        size={2.5}
        speed={0.25}
        color="#818cf8"
        opacity={0.4}
      />

      {/* Lighting tailored for Wide-Spread Metallic Cubes & Characters */}
      <ambientLight color="#181c30" intensity={0.7} />

      {/* Primary Key Light */}
      <directionalLight
        castShadow
        position={[12, 20, 14]}
        intensity={1.5}
        color="#dbeafe"
        shadow-bias={-0.0001}
        shadow-normalBias={0.015}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Violet Rim Highlight from Top-Left */}
      <directionalLight position={[-14, 10, -10]} intensity={1.6} color="#818cf8" />

      {/* Electric Cyan Edge Bounce */}
      <directionalLight position={[14, -4, 8]} intensity={0.8} color="#38bdf8" />

      {/* 1. INDEPENDENT STATIONARY CHARACTER GROUP - Never affected by cube motion */}
      {showCharacters && (
        <group name="CharacterGroup" position={[0, 0, 0]}>
          <ShowcaseCharacters />
        </group>
      )}

      {/* 2. INDEPENDENT PROJECT CUBE GROUP - Only cubes float and translate */}
      <group name="ProjectCubeGroup" position={[0, cubeGroupOffsetY, 0]}>
        <CubeShowcase
          active={true}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
        />
      </group>

      {/* Camera Controller for Project Universe */}
      {!disableCamera && (
        <CameraController
          showcaseActive={true}
          selectedProject={selectedProject}
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
        />
      )}
    </group>
  );
};
