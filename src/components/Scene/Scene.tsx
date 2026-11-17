import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { CameraController } from './CameraController';
import { EnvironmentLoader } from './EnvironmentLoader';

export interface SceneProps {
  resetSignal?: number;
  onResetComplete?: () => void;
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
}

export const Scene: React.FC<SceneProps> = ({
  resetSignal = 0,
  onResetComplete,
  onSelectObject,
  onHoverObject,
  onStatusChange,
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
          toneMappingExposure: 1.1,
        }}
        camera={{
          position: SCENE_CONFIG.camera.initialPosition,
          fov: SCENE_CONFIG.camera.fov,
          near: SCENE_CONFIG.camera.near,
          far: SCENE_CONFIG.camera.far,
        }}
      >
        {/* Dark atmospheric background & depth fog */}
        <color attach="background" args={[SCENE_CONFIG.fog.color]} />
        <fog
          attach="fog"
          args={[
            SCENE_CONFIG.fog.color,
            SCENE_CONFIG.fog.near,
            SCENE_CONFIG.fog.far,
          ]}
        />

        {/* Ambient Fantasy Particles / Magical Sky Dust */}
        <Sparkles
          count={50}
          scale={24}
          size={2.5}
          speed={0.3}
          color="#a5b4fc"
          opacity={0.5}
        />

        {/* Lighting Setup */}
        <ambientLight
          name="HomeAmbient"
          color={SCENE_CONFIG.lighting.ambient.color}
          intensity={SCENE_CONFIG.lighting.ambient.intensity}
        />

        <directionalLight
          name="HomeSun"
          castShadow
          position={SCENE_CONFIG.lighting.directional.position}
          intensity={SCENE_CONFIG.lighting.directional.intensity}
          color={SCENE_CONFIG.lighting.directional.color}
          shadow-bias={SCENE_CONFIG.lighting.directional.shadowBias}
          shadow-normalBias={0.012}
          shadow-mapSize-width={SCENE_CONFIG.lighting.directional.shadowMapSize}
          shadow-mapSize-height={SCENE_CONFIG.lighting.directional.shadowMapSize}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Fantasy Indigo/Cyan Rim Light */}
        <directionalLight
          name="HomeRim"
          position={SCENE_CONFIG.lighting.rim.position}
          intensity={SCENE_CONFIG.lighting.rim.intensity}
          color={SCENE_CONFIG.lighting.rim.color}
        />

        {/* Ground Bounce Fill Light */}
        <hemisphereLight
          name="HomeSky"
          args={[
            SCENE_CONFIG.lighting.hemisphere.skyColor,
            SCENE_CONFIG.lighting.hemisphere.groundColor,
            SCENE_CONFIG.lighting.hemisphere.intensity,
          ]}
        />

        {/* Floating Island Model (or Placeholder fallback) */}
        <EnvironmentLoader
          onSelectObject={onSelectObject}
          onHoverObject={onHoverObject}
          onStatusChange={onStatusChange}
        />

        {/* Camera and Navigation Controller */}
        <CameraController
          resetSignal={resetSignal}
          onResetComplete={onResetComplete}
        />
      </Canvas>
    </div>
  );
};

