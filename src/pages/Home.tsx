import React, { useCallback, useState } from 'react';
import { Scene } from '../components/Scene/Scene';
import { Navigation } from '../components/UI/Navigation';
import { Footer } from '../components/UI/Footer';
import { LoadingScreen } from '../components/UI/LoadingScreen';
import type { NavTabId } from '../components/UI/DestinationSelector';
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

export const Home: React.FC = () => {
  const [resetSignal, setResetSignal] = useState(0);
  const [modelStatus, setModelStatus] = useState<
    'checking' | 'loading' | 'loaded' | 'fallback'
  >('checking');

  // Persistent Section Navigation State (Home, Products, Projects, About Me, Contact, Fun)
  const [activeSection, setActiveSection] = useState<NavTabId>('HOME');

  // Detail Modal States for Interactive 3D Objects
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedGrimoire, setSelectedGrimoire] = useState<GrimoireItem | null>(null);

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

  // =========================================================================
  // PERSISTENT SECTION NAVIGATION HANDLER
  // Switching sections updates the active section state without unmounting
  // the shared layout (3D canvas, particles, top navigation, footer).
  // =========================================================================
  const handleSelectNav = useCallback((tab: NavTabId) => {
    setActiveSection(tab);
  }, []);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleSelectGrimoire = useCallback((grimoire: GrimoireItem) => {
    setSelectedGrimoire(grimoire);
  }, []);

  const handleCloseGrimoire = useCallback(() => {
    setSelectedGrimoire(null);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#000000]">
      {/* 1. PERSISTENT 3D WORLD & BACKGROUND CANVAS (Never unmounted, never destroyed) */}
      <Scene
        worldState="HOME_IDLE"
        activeDestination="HOME"
        resetSignal={resetSignal}
        onSelectObject={handleSelect}
        onHoverObject={handleHover}
        onStatusChange={handleStatusChange}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        selectedGrimoire={selectedGrimoire}
        onSelectGrimoire={handleSelectGrimoire}
        onOpenAboutModal={() => setActiveSection('ABOUT')}
        isAboutModalOpen={activeSection === 'ABOUT'}
      />

      {/* 2. PERSISTENT TOP NAVIGATION HEADER (Fixed at viewport top, permanently mounted) */}
      <Navigation
        onResetCamera={handleResetCamera}
        activeNav={activeSection}
        onSelectNav={handleSelectNav}
      />

      {/* 3. HERO SUBTITLE: Just a Developer (Visible on clean Home section) */}
      {activeSection === 'HOME' && <HeroSubtitle />}

      {/* 4. SECTION-SPECIFIC CONTENT (Rendered with smooth fade/slide transitions over persistent 3D world) */}
      {/* Products Section */}
      <ProductsModal
        isOpen={activeSection === 'PRODUCTS'}
        onClose={() => setActiveSection('HOME')}
        onOpenContact={() => setActiveSection('CONTACT')}
      />

      {/* Projects Catalog Section */}
      <ProjectsModal
        isOpen={activeSection === 'PROJECTS'}
        onClose={() => setActiveSection('HOME')}
        onNavigateToWorkshop={() => setActiveSection('PRODUCTS')}
      />

      {/* About Me Section: Archmage's Chronicle & Biography Parchment Scroll */}
      <ArchiveScrollModal
        isOpen={activeSection === 'ABOUT'}
        onClose={() => setActiveSection('HOME')}
      />

      {/* Contact & Inquiries Section */}
      <ContactModal
        isOpen={activeSection === 'CONTACT'}
        onClose={() => setActiveSection('HOME')}
      />

      {/* Fun & Experiments Playground Section */}
      <FunModal
        isOpen={activeSection === 'FUN'}
        onClose={() => setActiveSection('HOME')}
        onTriggerOrbit={handleResetCamera}
      />

      {/* Interactive 3D Station / Item Detail Panels */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={handleCloseProject}
        />
      )}

      {selectedGrimoire && (
        <GrimoireDetailModal
          grimoire={selectedGrimoire}
          onClose={handleCloseGrimoire}
        />
      )}

      {/* 5. PERSISTENT FIXED BOTTOM FOOTER (Always mounted and visible) */}
      <Footer />

      {/* Initial Asset Loading Screen */}
      <LoadingScreen manualFinished={modelStatus === 'fallback' || modelStatus === 'loaded'} />
    </main>
  );
};
