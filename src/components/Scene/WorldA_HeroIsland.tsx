import React from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { CameraController } from './CameraController';
import { EnvironmentLoader } from './EnvironmentLoader';
import { FantasySky } from './FantasySky';

interface WorldAHeroIslandProps {
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
}

export const WorldA_HeroIsland: React.FC<WorldAHeroIslandProps> = ({
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
}) => {
  return (
    <group name="WorldA_HeroIslandRoot">
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

      {/* Silvery Moonlight Directional Light with Soft Shadows */}
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

      {/* Floating Island Model & Chibi Characters at Home */}
      <EnvironmentLoader
        onSelectObject={onSelectObject}
        onHoverObject={onHoverObject}
        onStatusChange={onStatusChange}
      />

      {/* Island Orbit Camera and Navigation Controller */}
      <CameraController
        resetSignal={resetSignal}
        onResetComplete={onResetComplete}
        showcaseActive={false}
      />
    </group>
  );
};
