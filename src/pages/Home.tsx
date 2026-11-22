import React, { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Scene, type WorldState } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { Footer } from '../components/UI/Footer';
import { MusicControls } from '../components/UI/MusicControls';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import type { NavTabId } from '../config/navigationConfig';
import { audioManager } from '../services/audioManager';
import { ROUTES, getRouteFromPath, updatePageSEO } from '../routes';
import { HeroSubtitle } from '../components/UI/HeroSubtitle';
import { FunModal } from '../components/UI/FunModal';
import { ContactModal } from '../components/UI/ContactModal';
import { ProjectsModal } from '../components/UI/ProjectsModal';
import { ProductsModal } from '../components/UI/ProductsModal';
import { ProjectDetailModal } from '../components/UI/ProjectDetailModal';
import { GrimoireDetailModal } from '../components/UI/GrimoireDetailModal';
import { ArchiveScrollModal } from '../components/UI/ArchiveScrollModal';
import { useModelInteraction } from '../hooks/useModelInteraction';
import { useTheme } from '../context/ThemeContext';
import type { ProjectItem } from '../data/projectsData';
import type { GrimoireItem } from '../data/archiveData';
import type { ForestLandmark } from '../components/Scene/Forest/ForestCameraController';
import type { DestinationId } from '../components/Scene/Transitions/explodedConfig';

export const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLight } = useTheme();

  // Current route resolved from browser location
  const currentRoute = getRouteFromPath(location.pathname);

  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  // Application World State & Destination Tracking initialized from URL
  const [worldState, setWorldState] = useState<WorldState>(() => {
    const r = getRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
    return r.worldState;
  });
  const [activeDestination, setActiveDestination] = useState<DestinationId>(() => {
    const r = getRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
    return r.destination;
  });
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(() => {
    const r = getRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
    return r.tabId === 'CONTACT';
  });
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isFunOpen, setIsFunOpen] = useState(() => {
    const r = getRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/');
    return r.tabId === 'FUN';
  });

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

  const handleTransitionToWorkshopComplete = useCallback(() => {
    setActiveDestination('WORKSHOP');
    setWorldState('WORKSHOP_WORLD');
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
  // URL ROUTING SYNCHRONIZATION WITH 3D WORLD & ACTIVE SECTIONS
  // =========================================================================
  const handleSelectNav = useCallback(
    (tab: NavTabId) => {
      const targetRoute = ROUTES[tab];
      if (!targetRoute) return;

      if (location.pathname === targetRoute.path) {
        handleResetCamera();
        return;
      }

      navigate(targetRoute.path);
    },
    [location.pathname, navigate, handleResetCamera]
  );

  const handleCloseContact = useCallback(() => {
    setIsContactOpen(false);
    const targetPath =
      activeDestination === 'WORKSHOP'
        ? '/products'
        : activeDestination === 'ARCHIVE'
        ? '/projects'
        : activeDestination === 'FOREST'
        ? '/about'
        : '/';
    navigate(targetPath);
  }, [activeDestination, navigate]);

  const handleCloseFun = useCallback(() => {
    setIsFunOpen(false);
    const targetPath =
      activeDestination === 'WORKSHOP'
        ? '/products'
        : activeDestination === 'ARCHIVE'
        ? '/projects'
        : activeDestination === 'FOREST'
        ? '/about'
        : '/';
    navigate(targetPath);
  }, [activeDestination, navigate]);

  // Synchronize route changes (via URL bar, links, back/forward buttons) with 3D worlds and modals
  useEffect(() => {
    const route = getRouteFromPath(location.pathname);
    updatePageSEO(route);

    if (route.tabId === 'CONTACT') {
      setIsContactOpen(true);
      setIsFunOpen(false);
      setIsScrollOpen(false);
    } else if (route.tabId === 'FUN') {
      setIsContactOpen(false);
      setIsFunOpen(true);
      setIsScrollOpen(false);
    } else {
      setIsContactOpen(false);
      setIsFunOpen(false);
      setIsScrollOpen(false);

      if (route.destination !== activeDestination) {
        handleSelectDestination(route.destination);
      }
    }
  }, [location.pathname, activeDestination, handleSelectDestination]);

  const activeNavTab: NavTabId = currentRoute.tabId;

  // Synchronize Website-Wide Background Music with Active Section
  useEffect(() => {
    audioManager.setSection(activeNavTab);
  }, [activeNavTab]);

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 ${
        isLight ? 'bg-[#f4eee0]' : 'bg-[#000000]'
      }`}
    >
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
        onTransitionToWorkshopComplete={handleTransitionToWorkshopComplete}
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

      {/* Selected Project Information Panel (Interactive stations in WORKSHOP_WORLD) */}
      {selectedProject && worldState !== 'ARCHIVE_WORLD' && (
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
          navigate('/products');
        }}
      />

      {/* Products Modal: Clean, minimal digital inventions ready for content */}
      <ProductsModal
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        onOpenContact={() => {
          setIsProductsOpen(false);
          navigate('/contact');
        }}
      />

      {/* WORLD C: Interactive Grimoire Details / Return Navigation (shown when inspecting floating books) */}
      {worldState === 'ARCHIVE_WORLD' && !selectedProject && (
        <GrimoireDetailModal
          grimoire={selectedGrimoire}
          onClose={handleCloseGrimoire}
          onSelectGrimoire={handleSelectGrimoire}
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
        onClose={handleCloseContact}
      />

      {/* Fun & Experiments Playground Modal */}
      <FunModal
        isOpen={isFunOpen}
        onClose={handleCloseFun}
        onTriggerOrbit={handleResetCamera}
      />

      {/* Fixed Bottom Footer (Desktop: Left Icons + Right Vis Counter; Mobile: Responsive Safe Insets) */}
      <Footer />

      {/* Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
