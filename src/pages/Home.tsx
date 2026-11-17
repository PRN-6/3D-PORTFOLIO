import React, { useCallback, useState } from 'react';
import { Scene } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import { StartAdventureButton } from '../components/UI/StartAdventureButton';
import { useModelInteraction } from '../hooks/useModelInteraction';

export const Home: React.FC = () => {
  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  const {
    handleHover,
    handleSelect,
  } = useModelInteraction();

  const handleResetCamera = useCallback(() => {
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleStatusChange = useCallback(
    (status: 'checking' | 'loading' | 'loaded' | 'fallback') => {
      setModelStatus(status);
    },
    []
  );

  const handleStartAdventure = useCallback(() => {
    console.log("[Hero's Home] Start Adventure invoked.");
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090f]">
      {/* 3D Canvas Scene with Dynamic Fantasy Atmosphere */}
      <Scene
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
      />

      {/* Discreet Camera Reset Control (Top-Right) */}
      <Navigation onResetCamera={handleResetCamera} />

      {/* Minimal Clean START ADVENTURE Button (Bottom-Center) */}
      <StartAdventureButton onStartAdventure={handleStartAdventure} />

      {/* Minimal Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
