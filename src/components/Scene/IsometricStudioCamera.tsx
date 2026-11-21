import React, { useRef } from 'react';
import * as THREE from 'three';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export interface IsometricStudioCameraProps {
  active?: boolean;
}

/**
 * IsometricStudioCamera
 * Provides a locked orthographic isometric projection with warm miniature studio lighting
 * and soft contact shadows, matching the papercraft diorama aesthetic.
 */
export const IsometricStudioCamera: React.FC<IsometricStudioCameraProps> = ({ active = true }) => {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);

  // Locked isometric position: (22, 18, 22) looking at (0, 0, 0)
  // Gives true 45-degree azimuth and ~35.3-degree isometric pitch
  const isoPosition: [number, number, number] = [22, 17, 22];

  useFrame(() => {
    if (active && cameraRef.current) {
      cameraRef.current.position.set(...isoPosition);
      cameraRef.current.lookAt(0, 0.2, 0);
    }
  });

  if (!active) return null;

  return (
    <>
      {/* 1. Locked Orthographic Isometric Camera */}
      <OrthographicCamera
        ref={cameraRef}
        makeDefault={active}
        position={isoPosition}
        zoom={52}
        near={0.1}
        far={200}
      />

      {/* 2. Warm Miniature Studio Lighting Setup */}
      <group name="StudioLightingSetup">
        {/* Warm Sunlight creating crisp diagonal contact shadows */}
        <directionalLight
          name="StudioSun"
          position={[14, 22, 10]}
          intensity={1.85}
          color="#FFF4E0"
          castShadow
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />

        {/* Soft Cool Sky Ambient Fill */}
        <ambientLight name="StudioAmbient" color="#E6F0FF" intensity={0.65} />

        {/* Rim Light for subtle cardstock edge highlights */}
        <directionalLight
          name="StudioRim"
          position={[-12, 14, -12]}
          intensity={0.45}
          color="#FFFDF8"
        />

        {/* Soft Ground Contact Shadow Plane */}
        <mesh
          position={[0, -4.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.18} />
        </mesh>
      </group>
    </>
  );
};
