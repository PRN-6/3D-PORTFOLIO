import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Menu, X } from 'lucide-react';
import { NAV_ITEMS, type NavTabId } from '../config/navigationConfig';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './UI/ThemeToggle';

export interface NavbarProps {
  onResetCamera?: () => void;
  activeNav?: NavTabId;
  onSelectNav?: (tab: NavTabId) => void;
  brandRef?: React.RefObject<HTMLAnchorElement | null>;
  showBrand?: boolean;
}

/**
 * Navbar
 *
 * Persistent, responsive navigation bar containing:
 * 1. Top-Left: Persistent P R N brand wordmark (data-flip-id="brand-prn") that docks here
 *    after the curved preloader flight, persistent across all routes (home, products, projects, about me, contact, fun).
 * 2. Top-Center: Desktop navigation links with active state indicator.
 * 3. Top-Right: Theme switcher toggle + reset camera view button.
 * 4. Mobile: Integrated responsive drawer menu with accessible touch targets.
 */
export const Navbar: React.FC<NavbarProps> = ({
  onResetCamera,
  activeNav = 'HOME',
  onSelectNav,
  brandRef,
  showBrand = true,
}) => {
  const navigate = useNavigate();
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

  // Close menu on desktop resize
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

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectNav) {
      onSelectNav('HOME');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none select-none">
      {/* 1. TOP-LEFT PERSISTENT BRAND WORDMARK (Docking Slot) */}
      <div className="fixed top-3.5 left-3.5 sm:top-5 sm:left-5 md:top-6 md:left-8 z-40 pointer-events-auto flex items-center h-8 sm:h-9">
        <a
          ref={brandRef}
          href="/"
          onClick={handleBrandClick}
          data-flip-id="brand-prn"
          aria-label="P R N - Return to Home"
          className={`font-mono font-bold text-sm sm:text-[15px] md:text-base tracking-[0.20em] transition-all duration-300 cursor-pointer ${
            showBrand ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${
            isDark
              ? 'text-[#F5F5F5] hover:text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]'
              : 'text-[#262422] hover:text-black'
          }`}
        >
          P R N
        </a>
      </div>

      {/* 2. TOP-CENTER DESKTOP NAVIGATION LINKS (Floating Capsule Pill) */}
      <nav
        data-testid="top-center-navigation"
        data-nav-control="nav-links"
        aria-label="Main Navigation"
        className={`hidden md:flex fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto items-center font-mono text-xs sm:text-[13px] tracking-wider transition-all duration-300 px-5 sm:px-6 py-2 rounded-full backdrop-blur-md ${
          isLight
            ? 'bg-[#1c1a17] text-[#f4eee0] border border-[#38332c] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
            : 'bg-[#1c1a17]/95 text-[#f4eee0] border border-[#38332c] shadow-[0_8px_30px_rgba(0,0,0,0.7)]'
        }`}
      >
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeNav === item.id;
          return (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <span className="select-none px-2 sm:px-3 text-[11px] text-[#5a5245]">
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
                    : 'text-[#a89d8c] hover:text-[#f4eee0]'
                }`}
              >
                {item.label}
              </a>
            </React.Fragment>
          );
        })}
      </nav>

      {/* 3. TOP-RIGHT DESKTOP CONTROLS: THEME TOGGLE + RESET CAMERA */}
      <div
        data-nav-control="right-controls"
        className="hidden md:flex fixed top-6 sm:top-8 right-6 sm:right-8 z-40 pointer-events-auto items-center gap-3.5 sm:gap-4"
      >
        <ThemeToggle variant="desktop" />

        <span className={isDark ? 'text-zinc-700 select-none text-xs' : 'text-[#b8ad99] select-none text-xs'}>
          &middot;
        </span>

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

      {/* 4. MOBILE BACKDROP & TOP-RIGHT CONTROLS */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
          className="md:hidden fixed inset-0 z-30 pointer-events-auto bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
        />
      )}

      <div
        data-nav-control="mobile-controls"
        aria-label="Mobile Navigation Controls"
        className="md:hidden fixed top-0 right-0 z-40 p-4 pointer-events-none pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]"
      >
        <div className="relative flex items-center gap-2">
          <ThemeToggle variant="mobile" />

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
      </div>
    </header>
  );
};

