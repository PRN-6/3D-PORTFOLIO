import React from 'react';
import { GardenEnvironment } from './BlueFlowerGarden/GardenEnvironment';
import { GardenPartyCharacters } from './BlueFlowerGarden/GardenPartyCharacters';
import { GardenBiographyInteraction } from './BlueFlowerGarden/GardenBiographyInteraction';
import { GardenCameraController } from './BlueFlowerGarden/GardenCameraController';
import type { ForestLandmark } from './Forest/ForestCameraController';

export interface WorldDWhisperingForestProps {
  disableCamera?: boolean;
  onOpenAboutModal: () => void;
  isModalOpen?: boolean;
  resetSignal?: number;
  focusedLandmark?: ForestLandmark;
  onResetComplete?: () => void;
}

/**
 * Level 05: Blue Flower Garden — About Me World
 * Features Himmel & Frieren standing amidst the vast Nemophila blue flower meadow,
 * surrounded by flowering trees, dreamy clouds, and an interactive biography pedestal.
 */
export const WorldD_WhisperingForest: React.FC<WorldDWhisperingForestProps> = ({
  disableCamera = false,
  onOpenAboutModal,
  isModalOpen = false,
  resetSignal = 0,
  focusedLandmark = 'overview',
  onResetComplete,
}) => {
  return (
    <group name="WorldD_WhisperingForestRoot">
      {/* 1. Warm Golden Sunlight illuminating the flower meadow */}
      <directionalLight
        position={[-7.5, 14.0, 9.5]}
        intensity={2.3}
        color="#fff5e4"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* 2. Dreamy Pastel Sky to Meadow Grass Hemisphere Light */}
      <hemisphereLight args={['#d0e5fc', '#52855b', 1.4]} />

      {/* 3. Soft Pink Rim Light defining character silhouettes and cherry blossoms */}
      <directionalLight position={[9.5, 7.5, -11.0]} intensity={1.6} color="#fadcee" />

      {/* 4. Sky-Blue Underbounce Light for rocky underside and crystals */}
      <directionalLight position={[0, -6.5, 7.0]} intensity={0.8} color="#8ec2fa" />

      {/* 5. Ethereal Cyan Floral Center Glow */}
      <pointLight position={[0, 1.2, 0.5]} color="#aee2ff" intensity={1.2} distance={8} decay={2} />

      {/* MASTER BLUE FLOWER GARDEN ENVIRONMENT (Island, Dense Flowers, Trees, Clouds, Petals, Motes) */}
      <GardenEnvironment />

      {/* HIMMEL & FRIEREN ORIGINAL CHARACTERS WITH CEL-SHADING & FLOWER WREATHS */}
      <GardenPartyCharacters />

      {/* INTERACTIVE BIOGRAPHY PEDESTAL (Opens Archmage's Chronicle & Bio modal) */}
      <GardenBiographyInteraction onOpenAboutModal={onOpenAboutModal} isModalOpen={isModalOpen} />

      {/* BLUE FLOWER GARDEN CAMERA CONTROLLER & LANDMARK NAVIGATION */}
      {!disableCamera && (
        <GardenCameraController
          resetSignal={resetSignal}
          focusedLandmark={focusedLandmark}
          onResetComplete={onResetComplete}
        />
      )}
    </group>
  );
};
