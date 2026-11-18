import React, { useCallback, useState } from 'react';
import { Scene } from '../components/Scene/Scene';
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

  // Showcase state
  const [showcaseActive, setShowcaseActive] = useState(false);
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

  const handleStartAdventure = useCallback(() => {
    setShowcaseActive(true);
  }, []);

  const handleReturnToIsland = useCallback(() => {
    setSelectedProject(null);
    setShowcaseActive(false);
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090f]">
      {/* 3D Canvas Scene with Hero's Island & 3D Project Cubes */}
      <Scene
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
        showcaseActive={showcaseActive}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
      />

      {/* Discreet Camera Reset Control (Top-Right) */}
      <Navigation onResetCamera={handleResetCamera} />

      {/* Return to Island Navigation when in Showcase Mode */}
      {showcaseActive && !selectedProject && (
        <div className="fixed top-5 left-5 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300">
          <button
            onClick={handleReturnToIsland}
            type="button"
            className="group flex items-center gap-2 bg-black/80 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Island</span>
          </button>
        </div>
      )}

      {/* Minimal Clean START ADVENTURE Button (Bottom-Center, on landing view) */}
      {!showcaseActive && (
        <StartAdventureButton onStartAdventure={handleStartAdventure} />
      )}

      {/* Project Information Panel Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={handleCloseProject}
      />

      {/* Minimal Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
