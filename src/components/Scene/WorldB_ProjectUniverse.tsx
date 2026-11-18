import React from 'react';
import { Stars, Sparkles } from '@react-three/drei';
import { CubeShowcase } from './CubeShowcase';
import { ProjectCharactersGroup } from './ProjectCharactersGroup';
import { CameraController } from './CameraController';
import type { ProjectItem } from '../../data/projectsData';

interface WorldBProjectUniverseProps {
  selectedProject: ProjectItem | null;
  onSelectProject: (project: ProjectItem) => void;
  resetSignal?: number;
  onResetComplete?: () => void;
}

export const WorldB_ProjectUniverse: React.FC<WorldBProjectUniverseProps> = ({
  selectedProject,
  onSelectProject,
  resetSignal = 0,
  onResetComplete,
}) => {
  return (
    <group name="WorldB_ProjectUniverseRoot">
      {/* Deep Space Background Atmosphere */}
      <color attach="background" args={['#030409']} />
      <fog attach="fog" args={['#030409', 24, 75]} />

      {/* Shimmering Cosmic Starfield */}
      <Stars
        radius={250}
        depth={60}
        count={1800}
        factor={4.5}
        saturation={0.9}
        fade
        speed={1.2}
      />

      {/* Floating Ambient Cosmic Dust */}
      <Sparkles
        count={50}
        scale={[24, 14, 24]}
        position={[0, 2, 0]}
        size={2.8}
        speed={0.3}
        color="#818cf8"
        opacity={0.45}
      />

      {/* Lighting Setup tailored for Floating Metallic Cubes */}
      <ambientLight color="#1a1d33" intensity={0.65} />

      {/* Primary Key Light */}
      <directionalLight
        castShadow
        position={[10, 18, 12]}
        intensity={1.4}
        color="#c7d2fe"
        shadow-bias={-0.0001}
        shadow-normalBias={0.015}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Cool Violet Rim Highlight */}
      <directionalLight position={[-12, 8, -10]} intensity={1.5} color="#818cf8" />

      {/* Electric Cyan Edge Bounce */}
      <directionalLight position={[10, -6, 6]} intensity={0.7} color="#38bdf8" />

      {/* Floating Observation Dais with Frieren, Himmel, Heiter, and Eisen */}
      <ProjectCharactersGroup />

      {/* Interactive 3D Floating Project Cubes */}
      <CubeShowcase
        active={true}
        selectedProject={selectedProject}
        onSelectProject={onSelectProject}
      />

      {/* Dedicated Camera Controller for Project Universe */}
      <CameraController
        showcaseActive={true}
        selectedProject={selectedProject}
        resetSignal={resetSignal}
        onResetComplete={onResetComplete}
      />
    </group>
  );
};
