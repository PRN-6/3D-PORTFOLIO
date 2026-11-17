import React, { useCallback, useState } from 'react';
import { Scene } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { ControlsHint } from '../components/UI/ControlsHint';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import { useModelInteraction } from '../hooks/useModelInteraction';

export const Home: React.FC = () => {
  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  const {
    hoveredObject,
    selectedObject,
    handleHover,
    handleSelect,
    clearSelection,
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

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090f]">
      {/* 3D Canvas Scene */}
      <Scene
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
      />

      {/* Minimal Header Navigation */}
      <Navigation
        onResetCamera={handleResetCamera}
        status={modelStatus}
        hoveredObject={hoveredObject}
      />

      {/* Floating Controls Overlay */}
      <ControlsHint />

      {/* Minimal Initial Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />

      {/* Subtle Toast / Notification when an object is clicked */}
      {selectedObject && (
        <aside
          role="status"
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto fantasy-glass px-4 py-2 rounded-xl border border-indigo-500/40 text-xs text-indigo-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span>
            Selected Target:{' '}
            <strong className="text-white capitalize">
              {selectedObject.name.replace(/_/g, ' ')}
            </strong>
          </span>
          <button
            onClick={clearSelection}
            type="button"
            className="text-slate-400 hover:text-white cursor-pointer ml-1 text-sm font-bold"
            aria-label="Dismiss selection"
          >
            ×
          </button>
        </aside>
      )}
    </main>
  );
};
