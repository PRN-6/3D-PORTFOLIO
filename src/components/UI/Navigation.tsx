import React, { useState, useEffect } from 'react';
import { RotateCcw, Menu, X } from 'lucide-react';
import { NAV_ITEMS, type NavTabId } from './DestinationSelector';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

export interface NavigationProps {
  onResetCamera: () => void;
  activeNav?: NavTabId;
  onSelectNav?: (tab: NavTabId) => void;
  isTransitioning?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  onResetCamera,
  activeNav = 'HOME',
  onSelectNav,
}) => {
  const { isLight, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Close menu if viewport resizes to desktop breakpoint (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  const handleItemClick = (tabId: NavTabId) => {
    setIsMenuOpen(false);
    if (onSelectNav) {
      onSelectNav(tabId);
    }
  };

  return (
    <>
      {/* 1. TOP CENTRE DESKTOP NAVIGATION */}
      {/* Dark Mode: Minimal seamless text links | Light Mode: Dark rounded pill with cream text matching reference */}
      <nav
        data-testid="top-center-navigation"
        aria-label="Main Navigation"
        className={`hidden md:flex fixed left-1/2 -translate-x-1/2 z-40 pointer-events-auto items-center font-mono text-xs sm:text-[13px] tracking-wider select-none transition-all duration-300 ${
          isLight
            ? 'top-5 sm:top-6 bg-[#1c1a17] text-[#f4eee0] border border-[#38332c] px-5 sm:px-6 py-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md'
            : 'top-6 sm:top-8'
        }`}
      >
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeNav === item.id;
          return (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <span
                  className={`select-none px-2 sm:px-3 text-[11px] ${
                    isLight ? 'text-[#5a5245]' : 'text-zinc-600'
                  }`}
                >
                  &middot;
                </span>
              )}
              <a
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`transition-colors duration-200 cursor-pointer lowercase ${
                  isActive
                    ? 'text-white font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                    : isLight
                    ? 'text-[#a89d8c] hover:text-[#f4eee0]'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            </React.Fragment>
          );
        })}
      </nav>

      {/* 2. TOP RIGHT DESKTOP CONTROLS: THEME TOGGLE + RESET VIEW BUTTON */}
      <div className="hidden md:flex fixed top-6 sm:top-8 right-6 sm:right-8 z-40 pointer-events-auto items-center gap-3.5 sm:gap-4">
        {/* Theme Switcher Toggle (Sun / Moon) */}
        <ThemeToggle variant="desktop" />

        <span className={isDark ? 'text-zinc-700 select-none text-xs' : 'text-[#b8ad99] select-none text-xs'}>
          &middot;
        </span>

        {/* Reset Camera View Button */}
        <button
          onClick={onResetCamera}
          type="button"
          aria-label="Reset camera view"
          className={`group flex items-center gap-1.5 transition-colors duration-200 font-mono text-xs cursor-pointer select-none ${
            isDark ? 'text-zinc-500 hover:text-white' : 'text-[#5c5446] hover:text-[#1c1a17]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 duration-300" />
          <span className="lowercase">reset view</span>
        </button>
      </div>

      {/* 3. MOBILE BACKDROP & TOP-RIGHT CONTROLS (THEME TOGGLE + RESET VIEW + HAMBURGER) */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
          className="md:hidden fixed inset-0 z-30 pointer-events-auto bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
        />
      )}

      <header
        aria-label="Mobile Navigation Controls"
        className="md:hidden fixed top-0 right-0 z-40 p-4 pointer-events-none pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]"
      >
        <div className="relative flex items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <ThemeToggle variant="mobile" />

          {/* Mobile Camera Reset Button */}
          <button
            onClick={onResetCamera}
            type="button"
            aria-label="Reset camera view"
            className={`pointer-events-auto group flex items-center justify-center active:scale-95 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-lg select-none ${
              isDark
                ? 'bg-black/80 text-zinc-400 hover:text-white border border-white/10'
                : 'bg-[#e6decb]/95 text-[#2b2723] hover:text-black border border-[#c8bc9f]'
            }`}
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90 duration-300" />
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-panel"
            className={`pointer-events-auto group flex items-center justify-center active:scale-95 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-lg select-none relative ${
              isDark
                ? 'bg-black/80 text-zinc-400 hover:text-white border border-white/10'
                : 'bg-[#e6decb]/95 text-[#2b2723] hover:text-black border border-[#c8bc9f]'
            }`}
          >
            <div className="relative w-4 h-4 flex items-center justify-center">
              <Menu
                className={`w-4 h-4 transition-all duration-300 absolute ${
                  isMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <X
                className={`w-4 h-4 transition-all duration-300 absolute ${
                  isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                }`}
              />
            </div>
          </button>

          {/* Floating Mobile Dropdown Navigation Panel */}
          {isMenuOpen && (
            <div
              id="mobile-nav-panel"
              role="menu"
              aria-label="Mobile Navigation"
              className={`flex flex-col pointer-events-auto absolute top-full right-0 mt-2.5 w-48 rounded-xl backdrop-blur-xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200 ${
                isDark
                  ? 'bg-black/95 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.9)]'
                  : 'bg-[#1c1a17] border border-[#38332c] shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
              }`}
            >
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <a
                      key={item.id}
                      role="menuitem"
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleItemClick(item.id);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg font-mono text-xs tracking-wider transition-all select-none cursor-pointer text-left active:scale-[0.98] ${
                        isActive
                          ? 'bg-white/15 text-white font-medium border border-white/20 shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                          : 'text-[#a89d8c] hover:text-[#f4eee0] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="lowercase">{item.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
