import React from 'react';
import { ForestEnvironment } from './Forest/ForestEnvironment';
import { ForestConnectors } from './Forest/ForestConnectors';
import { ForestHeiter } from './Forest/ForestHeiter';
import { ForestBiographyInteraction } from './Forest/ForestBiographyInteraction';
import { ForestCameraController, type ForestLandmark } from './Forest/ForestCameraController';

export interface WorldDWhisperingForestProps {
  disableCamera?: boolean;
  onOpenAboutModal: () => void;
  isModalOpen?: boolean;
  resetSignal?: number;
  focusedLandmark?: ForestLandmark;
  onResetComplete?: () => void;
}

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
      {/* Verified Lighting Scheme from preview.js */}
      {/* 1. Celestial Moon Directional Light */}
      <directionalLight position={[6, 12, 9]} intensity={1.8} color="#c4d0ef" />

      {/* 2. Soft Ambient Forest Canopy Hemisphere Light */}
      <hemisphereLight args={['#c4d3ee', '#5c597c', 1.0]} />

      {/* 3. Rim Light defining the foliage and twisted branches */}
      <directionalLight position={[-8, 9, -5]} intensity={1.2} color="#b3a0ec" />

      {/* 4. Bounce Light from forest floor */}
      <directionalLight position={[-5, -5, 10]} intensity={0.6} color="#8baebf" />

      {/* 5. Warm Point Light at Heiter's Resting Area */}
      <pointLight position={[-5.5, 1.5, 1]} color="#ffd097" intensity={3} distance={6} decay={2} />

      {/* 6. Warm Point Light at Ancient Tree Lanterns */}
      <pointLight position={[0.7, 3.8, -2.6]} color="#ffd097" intensity={3} distance={6} decay={2} />

      {/* 7. Soft Arcane Glow from Enchanted Pond */}
      <pointLight position={[-2.5, 0.6, 2.5]} color="#38bdf8" intensity={1.6} distance={6} decay={2} />

      {/* CORE ENVIRONMENT: 9 Loaded Modules with Animations */}
      <ForestEnvironment />

      {/* CONNECTION KIT: 20 Loaded Connector Modules (Gateway, Bridges, Lookouts, Stairs) */}
      <ForestConnectors />

      {/* PRESERVED HEITER MODEL AT HEITER IDLE ANCHOR WITH CEL SHADING */}
      <ForestHeiter />

      {/* INTERACTIVE BIOGRAPHY BOOK LANDMARK */}
      <ForestBiographyInteraction onOpenAboutModal={onOpenAboutModal} isModalOpen={isModalOpen} />

      {/* CAMERA CONTROLLER WITH COLLISION BOUNDARIES & LANDMARK NAVIGATION */}
      {!disableCamera && (
        <ForestCameraController
          resetSignal={resetSignal}
          focusedLandmark={focusedLandmark}
          onResetComplete={onResetComplete}
        />
      )}
    </group>
  );
};
