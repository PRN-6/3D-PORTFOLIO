import React, { useCallback, useState } from 'react';
import { Scene, type WorldState } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import { StartAdventureButton } from '../components/UI/StartAdventureButton';
import { ProjectDetailModal } from '../components/UI/ProjectDetailModal';
import { useModelInteraction } from '../hooks/useModelInteraction';
import type { ProjectItem } from '../data/projectsData';
import { ArrowLeft } from 'lucide-react';

export const Home: React.FC = () => {
  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  // Application World State
  const [worldState, setWorldState] = useState<WorldState>('HOME_IDLE');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

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

  // START ADVENTURE: Begin cinematic vertical downward transition
  const handleStartAdventure = useCallback(() => {
    if (worldState !== 'HOME_IDLE') return;
    setWorldState('TRANSITIONING_DOWN');
  }, [worldState]);

  // Downward transition completed -> enter Project World
  const handleTransitionToProjectsComplete = useCallback(() => {
    setWorldState('PROJECT_WORLD');
  }, []);

  // RETURN TO ISLAND: Smooth vertical upward transition back to Island
  const handleReturnToIsland = useCallback(() => {
    setSelectedProject(null);
    setWorldState('TRANSITIONING_UP');
  }, []);

  // Upward transition completed -> arrive at Island Home
  const handleTransitionToHomeComplete = useCallback(() => {
    setWorldState('HOME_IDLE');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const isTransitioning =
    worldState === 'TRANSITIONING_DOWN' || worldState === 'TRANSITIONING_UP';

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030408]">
      {/* 3D Canvas Scene Hosting Vertical World Transitions */}
      <Scene
        worldState={worldState}
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        onTransitionToProjectsComplete={handleTransitionToProjectsComplete}
        onTransitionToHomeComplete={handleTransitionToHomeComplete}
      />

      {/* Top-Right Discreet Camera Reset Control */}
      {!isTransitioning && (
        <Navigation onResetCamera={handleResetCamera} />
      )}

      {/* WORLD A (HERO'S HOME): START ADVENTURE Call-to-Action */}
      {worldState === 'HOME_IDLE' && (
        <StartAdventureButton onStartAdventure={handleStartAdventure} />
      )}

      {/* WORLD B (PROJECT UNIVERSE): Minimal Return to Island Navigation */}
      {worldState === 'PROJECT_WORLD' && !selectedProject && (
        <div className="fixed top-5 left-5 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300">
          <button
            onClick={handleReturnToIsland}
            type="button"
            aria-label="Return to Island"
            className="group flex items-center gap-2 bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Island</span>
          </button>
        </div>
      )}

      {/* WORLD B: Selected Project Information Panel */}
      {worldState === 'PROJECT_WORLD' && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={handleCloseProject}
        />
      )}

      {/* Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
