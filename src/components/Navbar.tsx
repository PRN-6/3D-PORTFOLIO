import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { NAV_ITEMS, type NavItem, type NavTabId } from '../config/navigationConfig';
import { useTheme } from '../context/ThemeContext';
import { usePresence } from '../hooks/usePresence';
import { ThemeToggle } from './UI/ThemeToggle';

export interface NavbarProps {
  onResetCamera?: () => void;
  activeNav?: NavTabId;
  onSelectNav?: (tab: NavTabId) => void;
  brandRef?: React.RefObject<HTMLAnchorElement | null>;
  showBrand?: boolean;
}

/** Routes that open overlays over the current world rather than changing it. */
const OVERLAY_TABS: ReadonlySet<NavTabId> = new Set<NavTabId>(['CONTACT', 'FUN']);
const BRAND_LETTERS = ['P', 'R', 'N'] as const;

interface ChapterCue {
  key: number;
  item: NavItem;
  index: number;
}

interface IndicatorBox {
  x: number;
  width: number;
}

const formatIndex = (value: number) => String(value).padStart(2, '0');

/**
 * Navbar
 *
 * Persistent, responsive navigation bar containing:
 * 1. Top-Left: Persistent P R N brand wordmark (data-flip-id="brand-prn") that docks here
 *    after the curved preloader flight, persistent across all routes (home, products, projects, about me, contact, fun).
 * 2. Top-Center: Desktop navigation links with a sliding active/hover indicator.
 * 3. Top-Right: Theme switcher toggle + reset camera view button.
 * 4. Mobile: Morphing burger button and an animated menu sheet with staggered items.
 * 5. Route chapter cue: a top progress thread and a small chapter card whenever
 *    the destination world changes (overlay routes are skipped).
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
  const menuPresence = usePresence(isMenuOpen, 220);

  // ---------------------------------------------------------------------------
  // Desktop sliding indicator
  // ---------------------------------------------------------------------------
  const linkRefs = useRef(new Map<NavTabId, HTMLAnchorElement>());
  const [hoverId, setHoverId] = useState<NavTabId | null>(null);
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null);
  const indicatorTarget = hoverId ?? activeNav;

  const measureIndicator = useCallback(() => {
    const link = linkRefs.current.get(indicatorTarget);
    if (!link || link.offsetWidth === 0) {
      setIndicator(null);
      return;
    }
    const padding = 12;
    setIndicator({ x: link.offsetLeft - padding, width: link.offsetWidth + padding * 2 });
  }, [indicatorTarget]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  useEffect(() => {
    window.addEventListener('resize', measureIndicator);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measureIndicator();
    });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', measureIndicator);
    };
  }, [measureIndicator]);

  // ---------------------------------------------------------------------------
  // Route chapter cue (skips initial mount and overlay routes)
  // ---------------------------------------------------------------------------
  const [chapter, setChapter] = useState<ChapterCue | null>(null);
  const [previousNav, setPreviousNav] = useState<NavTabId>(activeNav);

  // Derived-state update during render (React's recommended alternative to an effect).
  if (previousNav !== activeNav) {
    setPreviousNav(activeNav);
    const index = NAV_ITEMS.findIndex((item) => item.id === activeNav);
    if (index >= 0 && !OVERLAY_TABS.has(activeNav) && !OVERLAY_TABS.has(previousNav)) {
      setChapter({ key: (chapter?.key ?? 0) + 1, item: NAV_ITEMS[index], index });
    }
  }

  // ---------------------------------------------------------------------------
  // Mobile menu behaviour
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

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

  const setLinkRef = (id: NavTabId) => (node: HTMLAnchorElement | null) => {
    if (node) linkRefs.current.set(id, node);
    else linkRefs.current.delete(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none select-none">
      {/* 0. ROUTE PROGRESS THREAD + CHAPTER CARD (decorative; document title announces the page) */}
      {chapter && (
        <React.Fragment key={chapter.key}>
          <div
            aria-hidden="true"
            className={`prn-route-thread fixed top-0 inset-x-0 z-50 h-[2px] ${
              isDark
                ? 'bg-gradient-to-r from-transparent via-white/90 to-white/40 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                : 'bg-gradient-to-r from-transparent via-[#262422] to-[#262422]/50'
            }`}
          />
          <div
            aria-hidden="true"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setChapter(null);
            }}
            className="prn-chapter fixed top-[3.75rem] md:top-[4.75rem] left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#1c1a17]/90 border border-[#38332c] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)] font-mono whitespace-nowrap"
          >
            <span className="text-[10px] tracking-[0.2em] text-[#a89d8c]">
              {formatIndex(chapter.index + 1)}
              <span className="text-[#5a5245]"> / {formatIndex(NAV_ITEMS.length)}</span>
            </span>
            <span className="prn-chapter-rule block w-6 h-px bg-[#a89d8c]/70" />
            <span className="overflow-hidden inline-flex">
              <span className="prn-chapter-label text-[11px] sm:text-xs tracking-[0.32em] lowercase text-[#f4eee0]">
                {chapter.item.label}
              </span>
            </span>
          </div>
        </React.Fragment>
      )}

      {/* 1. TOP-LEFT PERSISTENT BRAND WORDMARK (Docking Slot) */}
      <div className="fixed top-3.5 left-3.5 sm:top-5 sm:left-5 md:top-6 md:left-8 z-40 pointer-events-auto flex items-center h-8 sm:h-9">
        <a
          ref={brandRef}
          href="/"
          onClick={handleBrandClick}
          data-flip-id="brand-prn"
          aria-label="P R N - Return to Home"
          className={`prn-brand font-mono font-bold text-sm sm:text-[15px] md:text-base tracking-[0.20em] transition-[opacity,color,filter] duration-300 cursor-pointer ${
            showBrand ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${
            isDark
              ? 'text-[#F5F5F5] hover:text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]'
              : 'text-[#262422] hover:text-black'
          }`}
        >
          {BRAND_LETTERS.map((letter, index) => (
            <React.Fragment key={letter}>
              {index > 0 && ' '}
              <span className="prn-brand-letter" style={{ '--i': index } as React.CSSProperties}>
                {letter}
              </span>
            </React.Fragment>
          ))}
        </a>
      </div>

      {/* 2. TOP-CENTER DESKTOP NAVIGATION LINKS (Floating Capsule Pill) */}
      <nav
        data-testid="top-center-navigation"
        data-nav-control="nav-links"
        aria-label="Main Navigation"
        onMouseLeave={() => setHoverId(null)}
        className={`hidden md:flex fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto items-center font-mono text-xs sm:text-[13px] tracking-wider transition-[background-color,box-shadow] duration-300 px-5 sm:px-6 py-2 rounded-full backdrop-blur-md ${
          isLight
            ? 'bg-[#1c1a17] text-[#f4eee0] border border-[#38332c] shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
            : 'bg-[#1c1a17]/95 text-[#f4eee0] border border-[#38332c] shadow-[0_8px_30px_rgba(0,0,0,0.7)]'
        }`}
      >
        <span
          aria-hidden="true"
          className="prn-nav-indicator"
          style={{
            width: indicator?.width ?? 0,
            transform: `translate3d(${indicator?.x ?? 0}px, -50%, 0)`,
            opacity: indicator ? 1 : 0,
          }}
        />
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeNav === item.id;
          return (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <span className="relative z-[1] select-none px-2 sm:px-3 text-[11px] text-[#5a5245]">
                  &middot;
                </span>
              )}
              <a
                ref={setLinkRef(item.id)}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item.id);
                }}
                onMouseEnter={() => setHoverId(item.id)}
                onFocus={() => setHoverId(item.id)}
                onBlur={() => setHoverId(null)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`prn-nav-link cursor-pointer lowercase ${
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
          <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 group-active:-rotate-[360deg] duration-500" />
          <span className="lowercase">reset view</span>
        </button>
      </div>

      {/* 4. MOBILE BACKDROP & TOP-RIGHT CONTROLS */}
      {menuPresence.isMounted && (
        <div
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
          data-state={menuPresence.state}
          className="prn-backdrop md:hidden fixed inset-0 z-30 pointer-events-auto bg-black/50 backdrop-blur-[2px]"
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
            className={`pointer-events-auto group flex items-center justify-center active:scale-90 w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer shadow-lg select-none ${
              isDark
                ? 'bg-black/80 text-zinc-400 hover:text-white border border-white/10'
                : 'bg-[#e6decb]/95 text-[#2b2723] hover:text-black border border-[#c8bc9f]'
            }`}
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90 group-active:-rotate-[360deg] duration-500" />
          </button>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-panel"
            className={`pointer-events-auto group flex items-center justify-center active:scale-90 w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer shadow-lg select-none relative ${
              isMenuOpen
                ? 'bg-[#1c1a17] text-white border border-[#38332c]'
                : isDark
                ? 'bg-black/80 text-zinc-400 hover:text-white border border-white/10'
                : 'bg-[#e6decb]/95 text-[#2b2723] hover:text-black border border-[#c8bc9f]'
            }`}
          >
            <span className="prn-burger" data-open={isMenuOpen ? 'true' : 'false'} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          {menuPresence.isMounted && (
            <div
              id="mobile-nav-panel"
              role="menu"
              aria-label="Mobile Navigation"
              data-state={menuPresence.state}
              className={`prn-menu-panel flex flex-col pointer-events-auto absolute top-full right-0 mt-2.5 w-52 rounded-xl backdrop-blur-xl p-2 z-40 ${
                isDark
                  ? 'bg-black/95 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.9)]'
                  : 'bg-[#1c1a17] border border-[#38332c] shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
              }`}
            >
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, index) => {
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
                      style={{ '--i': index } as React.CSSProperties}
                      className={`prn-menu-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-mono text-xs tracking-wider transition-[background-color,color,transform] duration-200 select-none cursor-pointer text-left active:scale-[0.97] ${
                        isActive
                          ? 'bg-white/15 text-white font-medium border border-white/20 shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                          : 'text-[#a89d8c] hover:text-[#f4eee0] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-[9px] text-[#5a5245] tabular-nums">{formatIndex(index + 1)}</span>
                        <span className="lowercase">{item.label}</span>
                      </span>
                      {isActive && (
                        <span className="prn-menu-dot w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
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
