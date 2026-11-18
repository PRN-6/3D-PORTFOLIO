import React, { useCallback, useState } from 'react';
import { Scene, type WorldState } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import { StartAdventureButton } from '../components/UI/StartAdventureButton';
import { ProjectDetailModal } from '../components/UI/ProjectDetailModal';
import { useModelInteraction } from '../hooks/useModelInteraction';
import type { ProjectItem } from '../data/projectsData';
import { ArrowLeft, FastForward, Compass } from 'lucide-react';

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

  // START ADVENTURE: Begin cinematic transition from World A to World B
  const handleStartAdventure = useCallback(() => {
    if (worldState !== 'HOME_IDLE') return;
    setWorldState('TRANSITIONING_TO_PROJECTS');
  }, [worldState]);

  // Transition sequence completed
  const handleTransitionToProjectsComplete = useCallback(() => {
    setWorldState('PROJECT_WORLD');
  }, []);

  // Skip cinematic transition if user clicks Skip
  const handleSkipTransition = useCallback(() => {
    setWorldState('PROJECT_WORLD');
  }, []);

  // RETURN TO ISLAND: Smooth reverse transition from World B to World A
  const handleReturnToIsland = useCallback(() => {
    setSelectedProject(null);
    setWorldState('TRANSITIONING_TO_HOME');
    setTimeout(() => {
      setWorldState('HOME_IDLE');
      setResetSignal((prev) => prev + 1);
    }, 1100);
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#030408]">
      {/* 3D Canvas Scene Hosting Separate Worlds */}
      <Scene
        worldState={worldState}
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        onTransitionToProjectsComplete={handleTransitionToProjectsComplete}
      />

      {/* Top-Right Discreet Camera Reset Control */}
      {worldState !== 'TRANSITIONING_TO_PROJECTS' && worldState !== 'TRANSITIONING_TO_HOME' && (
        <Navigation onResetCamera={handleResetCamera} />
      )}

      {/* WORLD A (HERO'S HOME): START ADVENTURE Call-to-Action */}
      {worldState === 'HOME_IDLE' && (
        <StartAdventureButton onStartAdventure={handleStartAdventure} />
      )}

      {/* CINEMATIC TRANSITION OVERLAY CONTROLS */}
      {worldState === 'TRANSITIONING_TO_PROJECTS' && (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-auto animate-in fade-in duration-500">
          <button
            onClick={handleSkipTransition}
            type="button"
            aria-label="Skip transition sequence"
            className="group flex items-center gap-2 bg-black/75 hover:bg-white text-slate-300 hover:text-black border border-white/20 hover:border-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer backdrop-blur-md shadow-xl"
          >
            <span>Skip Cinematic</span>
            <FastForward className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* RETURN TRANSITION STARRY DISSOLVE EFFECT */}
      {worldState === 'TRANSITIONING_TO_HOME' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04050a] transition-opacity duration-700 pointer-events-none animate-in fade-in">
          <div className="flex flex-col items-center gap-3">
            <Compass className="w-7 h-7 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-fantasy text-xs text-slate-300 tracking-[0.2em] uppercase">
              Returning to Hero's Home...
            </span>
          </div>
        </div>
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
