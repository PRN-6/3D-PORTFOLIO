import React, { useCallback, useState, useEffect } from 'react';
import { Scene, type WorldState } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { Footer } from '../components/UI/Footer';
import { MusicControls } from '../components/UI/MusicControls';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import type { NavTabId } from '../components/UI/DestinationSelector';
import { audioManager } from '../services/audioManager';
import { HeroSubtitle } from '../components/UI/HeroSubtitle';
import { FunModal } from '../components/UI/FunModal';
import { ContactModal } from '../components/UI/ContactModal';
import { ProjectsModal } from '../components/UI/ProjectsModal';
import { ProductsModal } from '../components/UI/ProductsModal';
import { ProjectDetailModal } from '../components/UI/ProjectDetailModal';
import { GrimoireDetailModal } from '../components/UI/GrimoireDetailModal';
import { ArchiveScrollModal } from '../components/UI/ArchiveScrollModal';
import { useModelInteraction } from '../hooks/useModelInteraction';
import type { ProjectItem } from '../data/projectsData';
import type { GrimoireItem } from '../data/archiveData';
import type { ForestLandmark } from '../components/Scene/Forest/ForestCameraController';
import type { DestinationId } from '../components/Scene/Transitions/explodedConfig';
import {
  Trees,
  BookOpen,
  Compass,
  Sparkles,
  Droplets,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  // Application World State & Destination Tracking
  const [worldState, setWorldState] = useState<WorldState>('HOME_IDLE');
  const [activeDestination, setActiveDestination] = useState<DestinationId>('HOME');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isFunOpen, setIsFunOpen] = useState(false);

  // Archive World (Island 02) State
  const [selectedGrimoire, setSelectedGrimoire] = useState<GrimoireItem | null>(null);
  const [isScrollOpen, setIsScrollOpen] = useState(false);

  // Whispering Forest (Island 03) State
  const [focusedForestLandmark, setFocusedForestLandmark] = useState<ForestLandmark>('overview');

  const {
    handleHover,
    handleSelect,
  } = useModelInteraction();

  const handleResetCamera = useCallback(() => {
    setFocusedForestLandmark('overview');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleStatusChange = useCallback(
    (status: 'checking' | 'loading' | 'loaded' | 'fallback') => {
      setModelStatus(status);
    },
    []
  );

  // =========================================================================
  // UNIFIED MULTI-ISLAND DESTINATION SELECTION & HANDOVER
  // =========================================================================
  const handleDestinationReached = useCallback((dest: DestinationId) => {
    setActiveDestination(dest);
    if (dest === 'HOME') setWorldState('HOME_IDLE');
    else if (dest === 'ARCHIVE') setWorldState('ARCHIVE_WORLD');
    else if (dest === 'FOREST') setWorldState('FOREST_WORLD');
    else if (dest === 'WORKSHOP') setWorldState('WORKSHOP_WORLD');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleSelectDestination = useCallback(
    (dest: DestinationId | 'GARDEN') => {
      if (dest === 'GARDEN') return; // Handled with informative modal in DestinationSelector

      if (dest === activeDestination) {
        setResetSignal((prev) => prev + 1);
        return;
      }

      setSelectedGrimoire(null);
      setSelectedProject(null);
      setIsScrollOpen(false);
      setActiveDestination(dest);
    },
    [activeDestination]
  );


  const handleTransitionToArchiveComplete = useCallback(() => {
    setActiveDestination('ARCHIVE');
    setWorldState('ARCHIVE_WORLD');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleTransitionFromArchiveToHomeComplete = useCallback(() => {
    setActiveDestination('HOME');
    setWorldState('HOME_IDLE');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleTransitionToForestComplete = useCallback(() => {
    setActiveDestination('FOREST');
    setWorldState('FOREST_WORLD');
    setFocusedForestLandmark('overview');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleTransitionFromForestToArchiveComplete = useCallback(() => {
    setActiveDestination('ARCHIVE');
    setWorldState('ARCHIVE_WORLD');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // =========================================================================
  // ISLAND 02 & 03: MODALS & CONTROLS
  // =========================================================================
  const handleSelectGrimoire = useCallback((grimoire: GrimoireItem) => {
    setSelectedGrimoire(grimoire);
  }, []);

  const handleCloseGrimoire = useCallback(() => {
    setSelectedGrimoire(null);
  }, []);

  const handleOpenScroll = useCallback(() => {
    setIsScrollOpen(true);
  }, []);

  const handleCloseScroll = useCallback(() => {
    setIsScrollOpen(false);
  }, []);

  // =========================================================================
  // SIMPLIFIED FIVE NAVIGATION ACTIONS
  // 1. Home -> Hero's Home
  // 2. Products -> Rune Creation Workshop (The 4th existing 3D model)
  // 3. About Me -> Whispering Forest (The 3rd existing 3D model)
  // 4. Projects -> Grand Mage's Archive (the existing magical library 3D model)
  // 5. Contact -> Contact Modal (Keep existing Contact section/page)
  // =========================================================================
  const handleSelectNav = useCallback(
    (tab: NavTabId) => {
      if (tab === 'HOME') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsContactOpen(false);
        setIsFunOpen(false);
        handleSelectDestination('HOME');
      } else if (tab === 'PRODUCTS') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsContactOpen(false);
        setIsFunOpen(false);
        handleSelectDestination('WORKSHOP');
      } else if (tab === 'PROJECTS') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsContactOpen(false);
        setIsFunOpen(false);
        handleSelectDestination('ARCHIVE');
      } else if (tab === 'ABOUT') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsContactOpen(false);
        setIsFunOpen(false);
        handleSelectDestination('FOREST');
      } else if (tab === 'CONTACT') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsFunOpen(false);
        setIsContactOpen(true);
      } else if (tab === 'FUN') {
        setIsProjectsOpen(false);
        setIsProductsOpen(false);
        setIsContactOpen(false);
        setIsFunOpen(true);
      }
    },
    [handleSelectDestination]
  );

  const activeNavTab: NavTabId = isFunOpen
    ? 'FUN'
    : isContactOpen
    ? 'CONTACT'
    : isProjectsOpen
    ? 'PROJECTS'
    : isProductsOpen
    ? 'PRODUCTS'
    : activeDestination === 'WORKSHOP'
    ? 'PRODUCTS'
    : activeDestination === 'FOREST'
    ? 'ABOUT'
    : activeDestination === 'ARCHIVE'
    ? 'PROJECTS'
    : 'HOME';

  // Synchronize Website-Wide Background Music with Active Section
  useEffect(() => {
    audioManager.setSection(activeNavTab);
  }, [activeNavTab]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#000000]">
      {/* 3D Canvas Scene Hosting All Worlds & Transitions */}
      <Scene
        worldState={worldState}
        activeDestination={activeDestination}
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        selectedGrimoire={selectedGrimoire}
        onSelectGrimoire={handleSelectGrimoire}
        onOpenAboutModal={handleOpenScroll}
        isAboutModalOpen={isScrollOpen}
        focusedForestLandmark={focusedForestLandmark}
        onTransitionToArchiveComplete={handleTransitionToArchiveComplete}
        onTransitionFromArchiveToHomeComplete={handleTransitionFromArchiveToHomeComplete}
        onTransitionToForestComplete={handleTransitionToForestComplete}
        onTransitionFromForestToArchiveComplete={handleTransitionFromForestToArchiveComplete}
        onDestinationReached={handleDestinationReached}
      />

      {/* Fixed Top-Left Minimalist Music Player Capsule (Desktop & Mobile) */}
      <MusicControls />

      {/* Top-Right Navigation Header (Reset View + Responsive Mobile Hamburger Menu) */}
      <Navigation
        onResetCamera={handleResetCamera}
        activeNav={activeNavTab}
        onSelectNav={handleSelectNav}
      />

      {/* HERO SUBTITLE: Just a Developer */}
      {worldState === 'HOME_IDLE' && <HeroSubtitle />}





      {/* WORLD D (WHISPERING FOREST): Landmark Exploration & Biography Pedestal */}
      {worldState === 'FOREST_WORLD' && (
        <>

          {/* Bottom Center Landmark Navigation Toolbar (Elevated above global destination bar) */}
          <div className="fixed bottom-20 sm:bottom-22 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw] overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-emerald-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 px-2 hidden md:inline">
                Whispering Forest:
              </span>

              <button
                type="button"
                onClick={() => setFocusedForestLandmark('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  focusedForestLandmark === 'overview'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusedForestLandmark('biography')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  focusedForestLandmark === 'biography'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Biography Pedestal</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusedForestLandmark('heiter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  focusedForestLandmark === 'heiter'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Heiter's Haven</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusedForestLandmark('ancientTree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  focusedForestLandmark === 'ancientTree'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ancient Tree</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusedForestLandmark('pond')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  focusedForestLandmark === 'pond'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enchanted Pond</span>
              </button>
            </div>
          </div>

          {/* WORLD D (WHISPERING FOREST): Minimal Navigation handled globally by Top Header */}
        </>
      )}



      {/* Selected Project Information Panel (Interactive stations in WORKSHOP_WORLD) */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={handleCloseProject}
        />
      )}

      {/* 2D Projects Catalog Modal: Clean, standard presentation ready for content */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onNavigateToWorkshop={() => {
          setIsProjectsOpen(false);
          handleSelectDestination('WORKSHOP');
        }}
      />

      {/* Products Modal: Clean, minimal digital inventions ready for content */}
      <ProductsModal
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        onOpenContact={() => {
          setIsProductsOpen(false);
          setIsContactOpen(true);
        }}
      />

      {/* WORLD C: Interactive Grimoire Details Modal */}
      {worldState === 'ARCHIVE_WORLD' && (
        <GrimoireDetailModal
          grimoire={selectedGrimoire}
          onClose={handleCloseGrimoire}
        />
      )}

      {/* WORLD C & D: Archmage's Chronicle & Biography Parchment Scroll (About Modal) */}
      <ArchiveScrollModal
        isOpen={isScrollOpen}
        onClose={handleCloseScroll}
      />

      {/* Contact & Inquiries Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Fun & Experiments Playground Modal */}
      <FunModal
        isOpen={isFunOpen}
        onClose={() => setIsFunOpen(false)}
        onTriggerOrbit={handleResetCamera}
      />

      {/* Fixed Bottom Footer (Desktop: Left Icons + Right Vis Counter; Mobile: Responsive Safe Insets) */}
      <Footer />

      {/* Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
