import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { WorldA_HeroIsland } from './WorldA_HeroIsland';
import { WorldB_ProjectUniverse } from './WorldB_ProjectUniverse';
import type { ProjectItem } from '../../data/projectsData';

export type WorldState =
  | 'HOME_IDLE'
  | 'ISLAND_TELEPORTING'
  | 'PROJECT_WORLD'
  | 'TRANSITIONING_TO_HOME';

export interface SceneProps {
  worldState: WorldState;
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
  selectedProject?: ProjectItem | null;
  onSelectProject?: (project: ProjectItem) => void;
  onTransitionToProjectsComplete: () => void;
  onFlashProgress?: (intensity: number) => void;
}

export const Scene: React.FC<SceneProps> = ({
  worldState,
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
  selectedProject = null,
  onSelectProject = () => {},
  onTransitionToProjectsComplete,
  onFlashProgress,
}) => {
  return (
    <div className="relative w-full h-full bg-[#030408] overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{
          position: SCENE_CONFIG.camera.initialPosition,
          fov: SCENE_CONFIG.camera.fov,
          near: SCENE_CONFIG.camera.near,
          far: SCENE_CONFIG.camera.far,
        }}
      >
        {/* WORLD A: Hero's Home Floating Island (Normal & Teleporting) */}
        {(worldState === 'HOME_IDLE' || worldState === 'ISLAND_TELEPORTING') && (
          <WorldA_HeroIsland
            isTeleporting={worldState === 'ISLAND_TELEPORTING'}
            onTeleportComplete={onTransitionToProjectsComplete}
            onFlashProgress={onFlashProgress}
            resetSignal={resetSignal}
            onResetComplete={onResetComplete}
            onSelectObject={onSelectObject}
            onHoverObject={onHoverObject}
            onStatusChange={onStatusChange}
          />
        )}

        {/* WORLD B: Deep Space Project Universe (Zero Island, Pure Cubes & Characters) */}
        {worldState === 'PROJECT_WORLD' && (
          <WorldB_ProjectUniverse
            selectedProject={selectedProject}
            onSelectProject={onSelectProject}
            resetSignal={resetSignal}
            onResetComplete={onResetComplete}
          />
        )}
      </Canvas>
    </div>
  );
};
