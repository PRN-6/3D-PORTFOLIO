import React from 'react';
import type { DestinationId } from '../Scene/Transitions/explodedConfig';

export type NavTabId = 'HOME' | 'PRODUCTS' | 'PROJECTS' | 'ABOUT' | 'CONTACT' | 'FUN';

export interface DestinationSelectorProps {
  currentDestination?: DestinationId;
  activeNav?: NavTabId;
  isTransitioning?: boolean;
  onSelectNav?: (tab: NavTabId) => void;
  onSelectDestination?: (destination: DestinationId | 'GARDEN') => void;
  onOpenProducts?: () => void;
  onOpenProjects?: () => void;
  onOpenContact?: () => void;
  onOpenFun?: () => void;
}

export interface NavItem {
  id: NavTabId;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'HOME', label: 'home' },
  { id: 'PRODUCTS', label: 'products' },
  { id: 'PROJECTS', label: 'projects' },
  { id: 'ABOUT', label: 'about me' },
  { id: 'CONTACT', label: 'contact' },
  { id: 'FUN', label: 'fun' },
];

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  currentDestination = 'HOME',
  activeNav,
  isTransitioning = false,
  onSelectNav,
  onSelectDestination,
  onOpenContact,
}) => {
  // Determine active tab if not explicitly supplied
  const effectiveActiveNav: NavTabId =
    activeNav ||
    (currentDestination === 'HOME'
      ? 'HOME'
      : currentDestination === 'WORKSHOP'
      ? 'PRODUCTS'
      : currentDestination === 'FOREST'
      ? 'ABOUT'
      : currentDestination === 'ARCHIVE'
      ? 'PROJECTS'
      : 'HOME');

  const handleNavClick = (tabId: NavTabId) => {
    if (isTransitioning) return;

    if (onSelectNav) {
      onSelectNav(tabId);
      return;
    }

    // Default fallbacks
    switch (tabId) {
      case 'HOME':
        onSelectDestination?.('HOME');
        break;
      case 'PRODUCTS':
        onSelectDestination?.('WORKSHOP');
        break;
      case 'ABOUT':
        onSelectDestination?.('FOREST');
        break;
      case 'PROJECTS':
        onSelectDestination?.('ARCHIVE');
        break;
      case 'CONTACT':
        if (onOpenContact) onOpenContact();
        break;
    }
  };

  return (
    <div className="desktop-nav-only fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex-col items-center max-w-[95vw] px-2 sm:px-4">
      {/* Five Clean, Minimal Navigation Buttons (Desktop) */}
      <nav
        aria-label="Main Navigation"
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = effectiveActiveNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNavClick(item.id);
              }}
              disabled={isTransitioning}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`px-4 sm:px-5 py-2 h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 select-none cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
