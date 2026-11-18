import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { CameraController } from './CameraController';
import { EnvironmentLoader } from './EnvironmentLoader';
import { FantasySky } from './FantasySky';
import { CubeShowcase } from './CubeShowcase';
import type { ProjectItem } from '../../data/projectsData';

export interface SceneProps {
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
  showcaseActive?: boolean;
  selectedProject?: ProjectItem | null;
  onSelectProject?: (project: ProjectItem) => void;
}

export const Scene: React.FC<SceneProps> = ({
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
  showcaseActive = false,
  selectedProject = null,
  onSelectProject = () => {},
}) => {
  return (
    <div className="relative w-full h-full bg-[#08090f] overflow-hidden">
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
        {/* Dynamic Fog (locked to night) */}
        <fog
          attach="fog"
          args={[
            SCENE_CONFIG.fog.color,
            SCENE_CONFIG.fog.near,
            SCENE_CONFIG.fog.far,
          ]}
        />

        {/* Dynamic Fantasy Sky Dome, Clouds, Stars & Ambient Particles */}
        <FantasySky />

        {/* Ambient Fill Light */}
        <ambientLight
          name="HomeAmbient"
          color={SCENE_CONFIG.lighting.ambient.color}
          intensity={SCENE_CONFIG.lighting.ambient.intensity}
        />

        {/* Sun / Moon Directional Light with Soft Shadows */}
        <directionalLight
          name="HomeSun"
          castShadow
          position={SCENE_CONFIG.lighting.directional.position}
          intensity={SCENE_CONFIG.lighting.directional.intensity}
          color={SCENE_CONFIG.lighting.directional.color}
          shadow-bias={SCENE_CONFIG.lighting.directional.shadowBias}
          shadow-normalBias={0.015}
          shadow-mapSize-width={SCENE_CONFIG.lighting.directional.shadowMapSize}
          shadow-mapSize-height={SCENE_CONFIG.lighting.directional.shadowMapSize}
          shadow-camera-near={0.5}
          shadow-camera-far={45}
          shadow-camera-left={-11}
          shadow-camera-right={11}
          shadow-camera-top={11}
          shadow-camera-bottom={-11}
        />

        {/* Rim Light for Beautiful Edge Highlights */}
        <directionalLight
          name="HomeRim"
          position={SCENE_CONFIG.lighting.rim.position}
          intensity={SCENE_CONFIG.lighting.rim.intensity}
          color={SCENE_CONFIG.lighting.rim.color}
        />

        {/* Hemisphere Sky / Ground Fill Bounce */}
        <hemisphereLight
          name="HomeSky"
          args={[
            SCENE_CONFIG.lighting.hemisphere.skyColor,
            SCENE_CONFIG.lighting.hemisphere.groundColor,
            SCENE_CONFIG.lighting.hemisphere.intensity,
          ]}
        />

        {/* Floating Island Model & Chibi Characters (Preserved in Realm) */}
        <EnvironmentLoader
          onSelectObject={onSelectObject}
          onHoverObject={onHoverObject}
          onStatusChange={onStatusChange}
        />

        {/* 3D Floating Project Cubes Constellation */}
        <CubeShowcase
          active={showcaseActive}
          selectedProject={selectedProject}
          onSelectProject={onSelectProject}
        />

        {/* Orbit Camera and Navigation Controller */}
        <CameraController
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
          showcaseActive={showcaseActive}
          selectedProject={selectedProject}
        />
      </Canvas>
    </div>
  );
};
