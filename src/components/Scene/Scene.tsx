import React from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { Level01_To_Level02_Transition } from './Transitions/Level01_To_Level02_Transition';
import { ModularExplodedTransition } from './Transitions/ModularExplodedTransition';
import { CinematicBackgroundTitle } from './Title/CinematicBackgroundTitle';
import type { ProjectItem } from '../../data/projectsData';
import type { GrimoireItem } from '../../data/archiveData';

import type { ForestLandmark } from './Forest/ForestCameraController';
import { usePreventZoomGestures } from './useFixedCameraControls';

import type { DestinationId } from './Transitions/explodedConfig';

export type WorldState =
  | 'HOME_IDLE'
  | 'TRANSITION_HOME_TO_ARCHIVE'
  | 'ARCHIVE_WORLD'
  | 'TRANSITION_ARCHIVE_TO_HOME'
  | 'TRANSITION_ARCHIVE_TO_FOREST'
  | 'FOREST_WORLD'
  | 'TRANSITION_FOREST_TO_ARCHIVE'
  | 'WORKSHOP_WORLD'
  | 'TRANSITIONING_ISLAND';

export interface SceneProps {
  worldState: WorldState;
  activeDestination?: DestinationId;
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
  selectedProject?: ProjectItem | null;
  onSelectProject?: (project: ProjectItem) => void;
  selectedGrimoire?: GrimoireItem | null;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
  onOpenAboutModal?: () => void;
  isAboutModalOpen?: boolean;
  focusedForestLandmark?: ForestLandmark;
  onTransitionToArchiveComplete?: () => void;
  onTransitionFromArchiveToHomeComplete?: () => void;
  onTransitionToForestComplete?: () => void;
  onTransitionFromForestToArchiveComplete?: () => void;
  onTransitionToWorkshopComplete?: () => void;
  onDestinationReached?: (dest: DestinationId) => void;
}

const PerformanceProfiler: React.FC = () => {
  const { gl, camera, scene } = useThree();
  useFrame(() => {
    (window as any).__THREE_CAMERA__ = camera;
    (window as any).__THREE_SCENE__ = scene;
    (window as any).__THREE_STATS__ = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length || 0,
    };
  });
  return null;
};

export const Scene: React.FC<SceneProps> = ({
  worldState,
  activeDestination,
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
  selectedProject = null,
  onSelectProject = () => {},
  selectedGrimoire = null,
  onSelectGrimoire = () => {},
  onOpenAboutModal = () => {},
  isAboutModalOpen = false,
  focusedForestLandmark = 'overview',
  onTransitionToArchiveComplete = () => {},
  onTransitionFromArchiveToHomeComplete = () => {},
  onTransitionToForestComplete = () => {},
  onTransitionFromForestToArchiveComplete = () => {},
  onTransitionToWorkshopComplete = () => {},
  onDestinationReached = () => {},
}) => {
  usePreventZoomGestures();

  const isMultiLevelWorld =
    worldState === 'HOME_IDLE' ||
    worldState === 'TRANSITION_HOME_TO_ARCHIVE' ||
    worldState === 'ARCHIVE_WORLD' ||
    worldState === 'TRANSITION_ARCHIVE_TO_HOME' ||
    worldState === 'TRANSITION_ARCHIVE_TO_FOREST' ||
    worldState === 'FOREST_WORLD' ||
    worldState === 'TRANSITION_FOREST_TO_ARCHIVE' ||
    worldState === 'WORKSHOP_WORLD' ||
    worldState === 'TRANSITIONING_ISLAND';

  return (
    <div
      className="relative w-full h-full bg-[#000000] overflow-hidden select-none"
      onWheel={(e) => e.preventDefault()}
    >
      {/* 1. Fixed cinematic screen-space DOM typography layer */}
      <CinematicBackgroundTitle />

      {/* 2. Three.js Canvas with transparent WebGL alpha (island renders in front) */}
      <Canvas
        className="relative z-10 w-full h-full"
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        camera={{
          position: SCENE_CONFIG.camera.initialPosition,
          fov: SCENE_CONFIG.camera.fov,
          near: SCENE_CONFIG.camera.near,
          far: SCENE_CONFIG.camera.far,
        }}
      >
        <PerformanceProfiler />

        {/* MULTI-ISLAND FANTASY REALM: EXPLODED 3D ARCHITECTURAL OR VERTICAL STAIRCASE */}
        {isMultiLevelWorld && (
          SCENE_CONFIG.transitionMode === 'STAIRCASE' ? (
            <Level01_To_Level02_Transition
              worldState={worldState}
              resetSignal={resetSignal}
              onResetComplete={onResetComplete}
              onSelectObject={onSelectObject}
              onHoverObject={onHoverObject}
              onStatusChange={onStatusChange}
              selectedGrimoire={selectedGrimoire}
              onSelectGrimoire={onSelectGrimoire}
              onOpenAboutModal={onOpenAboutModal}
              isAboutModalOpen={isAboutModalOpen}
              focusedForestLandmark={focusedForestLandmark}
              onTransitionToArchiveComplete={onTransitionToArchiveComplete}
              onTransitionFromArchiveToHomeComplete={onTransitionFromArchiveToHomeComplete}
              onTransitionToForestComplete={onTransitionToForestComplete}
              onTransitionFromForestToArchiveComplete={onTransitionFromForestToArchiveComplete}
            />
          ) : (
            <ModularExplodedTransition
              worldState={worldState}
              activeDestination={activeDestination}
              resetSignal={resetSignal}
              onResetComplete={onResetComplete}
              onSelectObject={onSelectObject}
              onHoverObject={onHoverObject}
              onStatusChange={onStatusChange}
              selectedGrimoire={selectedGrimoire}
              onSelectGrimoire={onSelectGrimoire}
              onOpenAboutModal={onOpenAboutModal}
              isAboutModalOpen={isAboutModalOpen}
              focusedForestLandmark={focusedForestLandmark}
              selectedProject={selectedProject}
              onSelectProject={onSelectProject}
              onTransitionToArchiveComplete={onTransitionToArchiveComplete}
              onTransitionFromArchiveToHomeComplete={onTransitionFromArchiveToHomeComplete}
              onTransitionToForestComplete={onTransitionToForestComplete}
              onTransitionFromForestToArchiveComplete={onTransitionFromForestToArchiveComplete}
              onTransitionToWorkshopComplete={onTransitionToWorkshopComplete}
              onDestinationReached={onDestinationReached}
            />
          )
        )}
      </Canvas>
    </div>
  );
};
