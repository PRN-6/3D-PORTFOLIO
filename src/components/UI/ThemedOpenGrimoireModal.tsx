import React, { useEffect, useState, useMemo } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import type { ProjectItem } from '../../data/projectsData';
import type { GrimoireItem } from '../../data/archiveData';
import { useTheme } from '../../context/ThemeContext';

export interface ThemedOpenGrimoireModalProps {
  isOpen: boolean;
  project: ProjectItem | null;
  grimoire: GrimoireItem | null;
  onClose: () => void;
}

interface BookThemeConfig {
  themeName: string;
  subTitle: string;
  runeGlyph: string;
  glowColor: string;
  leatherColor: string;
  leatherBorder: string;
  accentBg: string;
  ribbonColor: string;
  claspColor: string;
}

function getBookThemeConfig(accentColor: string): BookThemeConfig {
  switch (accentColor.toLowerCase()) {
    case '#38bdf8':
    case '#22d3ee':
      return {
        themeName: 'CIPHER & NEURAL CRYPTOGRAPHY GRIMOIRE',
        subTitle: 'AUTONOMOUS LOCAL INTELLIGENCE & ZERO-CLOUD SYSTEM',
        runeGlyph: 'ᚱ',
        glowColor: '#38bdf8',
        leatherColor: '#0a1926',
        leatherBorder: '#163852',
        accentBg: 'rgba(56, 189, 248, 0.12)',
        ribbonColor: '#0284c7',
        claspColor: '#38bdf8',
      };
    case '#10b981':
      return {
        themeName: 'POLYHEDRAL GEOMETRY & 3D SOLVER CODEX',
        subTitle: 'INTERACTIVE TWISTY-PUZZLE LAB & REAL-TIME ALGORITHMS',
        runeGlyph: '⬡',
        glowColor: '#10b981',
        leatherColor: '#071e15',
        leatherBorder: '#0f3d2b',
        accentBg: 'rgba(16, 185, 129, 0.12)',
        ribbonColor: '#059669',
        claspColor: '#10b981',
      };
    case '#a855f7':
      return {
        themeName: 'ARCANE SCRIPT & DEVELOPER ALCHEMY TOME',
        subTitle: 'SYNTACTIC ANALYSIS, REAL-TIME COMPILERS & WORKFLOWS',
        runeGlyph: 'ᛋ',
        glowColor: '#a855f7',
        leatherColor: '#1a0b29',
        leatherBorder: '#361754',
        accentBg: 'rgba(168, 85, 247, 0.12)',
        ribbonColor: '#9333ea',
        claspColor: '#a855f7',
      };
    case '#3b82f6':
      return {
        themeName: 'CELESTIAL SWARM & AGENT ORCHESTRATION',
        subTitle: 'DISTRIBUTED CONSENSUS, AUTONOMOUS WORKERS & MESH',
        runeGlyph: '☿',
        glowColor: '#3b82f6',
        leatherColor: '#09152b',
        leatherBorder: '#142c57',
        accentBg: 'rgba(59, 130, 246, 0.12)',
        ribbonColor: '#2563eb',
        claspColor: '#3b82f6',
      };
    case '#f43f5e':
      return {
        themeName: 'HOGWARTS SORCERY & 3D INTERACTIVE TOME',
        subTitle: 'VOLUMETRIC PARTICLES, SHADERS & IMMERSIVE SCENARIOS',
        runeGlyph: '⚡',
        glowColor: '#f43f5e',
        leatherColor: '#2b0913',
        leatherBorder: '#541527',
        accentBg: 'rgba(244, 63, 94, 0.12)',
        ribbonColor: '#e11d48',
        claspColor: '#f43f5e',
      };
    case '#f59e0b':
    default:
      return {
        themeName: 'SOLAR FORGE & FULL-STACK INVENTIONS CODEX',
        subTitle: 'CLOUD-NATIVE ARCHITECTURE & SCALABLE DIGITAL APPARATUS',
        runeGlyph: '☼',
        glowColor: '#f59e0b',
        leatherColor: '#2b1a09',
        leatherBorder: '#543312',
        accentBg: 'rgba(245, 158, 11, 0.12)',
        ribbonColor: '#d97706',
        claspColor: '#f59e0b',
      };
  }
}

export const ThemedOpenGrimoireModal: React.FC<ThemedOpenGrimoireModalProps> = ({
  isOpen,
  project,
  grimoire,
  onClose,
}) => {
  const { isLight } = useTheme();
  const [activeMobileTab, setActiveMobileTab] = useState<'lore' | 'spells'>('lore');
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const theme = useMemo(() => {
    return getBookThemeConfig(project?.accentColor || '#10b981');
  }, [project?.accentColor]);

  if (!isRendered || !project) return null;

  const spellsList = grimoire?.spells || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 select-none transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`3D Grimoire Tome: ${project.title}`}
    >
      {/* 1. Atmospheric Dark Backdrop with Vignette & Theme Color Radiance */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glowColor} 0%, transparent 75%)`,
          }}
        />
      </div>

      {/* 2. 3D PERSPECTIVE STAGE CONTAINER */}
      <div
        className="relative z-50 w-full max-w-5xl flex items-center justify-center pointer-events-auto"
        style={{
          perspective: '1800px',
        }}
      >
        {/* 3. 3D BOOK TOME ROOT (Tilted slightly in 3D for authentic RPG reading posture) */}
        <div
          className={`relative w-full flex flex-col items-center transition-all duration-500 ease-out ${
            isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-6 opacity-0'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(5deg)',
          }}
        >
          {/* ================================================================= */}
          {/* A. HEAVY LEATHER COVER (Hardcover Casing Protruding on All Sides)  */}
          {/* ================================================================= */}
          <div
            className="absolute -inset-3 sm:-inset-4 md:-inset-5 rounded-2xl md:rounded-3xl pointer-events-none transition-colors duration-300"
            style={{
              backgroundColor: isLight ? '#2f1a0d' : theme.leatherColor,
              border: `3px solid ${isLight ? '#4a2c17' : theme.leatherBorder}`,
              boxShadow: `0 0 45px ${theme.glowColor}30, 0 35px 90px rgba(0, 0, 0, 0.95)`,
            }}
          >
            {/* Stitched Leather Perimeter Inset */}
            <div className="absolute inset-2 sm:inset-3 rounded-xl md:rounded-2xl border border-dashed border-amber-600/35 pointer-events-none" />

            {/* 4 Antique Gilded Filigree Corner Clasps (Metal protectors on leather casing) */}
            <div
              className="absolute top-2 left-2 w-8 h-8 pointer-events-none z-30"
              style={{
                borderTop: `3px solid ${theme.claspColor}`,
                borderLeft: `3px solid ${theme.claspColor}`,
                borderRadius: '8px 0 0 0',
                filter: `drop-shadow(0 0 4px ${theme.glowColor})`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full absolute -top-1 -left-1"
                style={{ backgroundColor: theme.claspColor }}
              />
            </div>

            <div
              className="absolute top-2 right-2 w-8 h-8 pointer-events-none z-30"
              style={{
                borderTop: `3px solid ${theme.claspColor}`,
                borderRight: `3px solid ${theme.claspColor}`,
                borderRadius: '0 8px 0 0',
                filter: `drop-shadow(0 0 4px ${theme.glowColor})`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full absolute -top-1 -right-1"
                style={{ backgroundColor: theme.claspColor }}
              />
            </div>

            <div
              className="absolute bottom-2 left-2 w-8 h-8 pointer-events-none z-30"
              style={{
                borderBottom: `3px solid ${theme.claspColor}`,
                borderLeft: `3px solid ${theme.claspColor}`,
                borderRadius: '0 0 0 8px',
                filter: `drop-shadow(0 0 4px ${theme.glowColor})`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full absolute -bottom-1 -left-1"
                style={{ backgroundColor: theme.claspColor }}
              />
            </div>

            <div
              className="absolute bottom-2 right-2 w-8 h-8 pointer-events-none z-30"
              style={{
                borderBottom: `3px solid ${theme.claspColor}`,
                borderRight: `3px solid ${theme.claspColor}`,
                borderRadius: '0 0 8px 0',
                filter: `drop-shadow(0 0 4px ${theme.glowColor})`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full absolute -bottom-1 -right-1"
                style={{ backgroundColor: theme.claspColor }}
              />
            </div>

            {/* Spine Headcap & Tailcap (Rounded leather spine visible at top and bottom center) */}
            <div
              className="hidden md:block absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-7 rounded-t-full shadow-lg pointer-events-none"
              style={{
                backgroundColor: isLight ? '#221308' : '#050c14',
                border: `2px solid ${theme.leatherBorder}`,
                boxShadow: `0 -4px 10px rgba(0,0,0,0.8)`,
              }}
            />
            <div
              className="hidden md:block absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-16 h-7 rounded-b-full shadow-lg pointer-events-none"
              style={{
                backgroundColor: isLight ? '#221308' : '#050c14',
                border: `2px solid ${theme.leatherBorder}`,
                boxShadow: `0 4px 10px rgba(0,0,0,0.8)`,
              }}
            />
          </div>

          {/* ================================================================= */}
          {/* B. THE 3D PAPER STACK (Fore-Edge & Tail Depth - 500 Pages Block)  */}
          {/* ================================================================= */}
          {/* Left Fore-Edge Paper Block (Layered parchment sheets thickness) */}
          <div
            className="hidden md:block absolute -left-4 top-2 bottom-2 w-4 pointer-events-none z-10 rounded-l-sm"
            style={{
              background: `repeating-linear-gradient(to right, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.1) 1px, #d7c49b 2px, #ebdcb9 3px)`,
              boxShadow: `inset 2px 0 6px rgba(0,0,0,0.6), -4px 0 10px rgba(0,0,0,0.5)`,
            }}
          />

          {/* Right Fore-Edge Paper Block (Layered parchment sheets thickness) */}
          <div
            className="hidden md:block absolute -right-4 top-2 bottom-2 w-4 pointer-events-none z-10 rounded-r-sm"
            style={{
              background: `repeating-linear-gradient(to left, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.1) 1px, #d7c49b 2px, #ebdcb9 3px)`,
              boxShadow: `inset -2px 0 6px rgba(0,0,0,0.6), 4px 0 10px rgba(0,0,0,0.5)`,
            }}
          />

          {/* Bottom Curved Page Thickness (Curved paper fan along bottom) */}
          <div
            className="hidden md:block absolute -bottom-3 left-1 right-1 h-3 pointer-events-none z-10"
            style={{
              background: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.1) 1px, #d7c49b 2px, #ebdcb9 3px)`,
              boxShadow: `0 4px 8px rgba(0,0,0,0.7)`,
            }}
          />

          {/* ================================================================= */}
          {/* C. TOP EMBOSSED BRASS HEADER & WAX SEAL CLOSE BUTTON               */}
          {/* ================================================================= */}
          <header
            className="relative z-40 w-full flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b select-none rounded-t-xl"
            style={{
              backgroundColor: isLight ? '#dfd2ba' : '#080d16',
              borderColor: isLight ? '#c8b693' : 'rgba(255,255,255,0.12)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            }}
          >
            {/* Theme Emblem & Banner */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base border shadow-inner"
                style={{
                  backgroundColor: theme.accentBg,
                  color: theme.glowColor,
                  borderColor: `${theme.glowColor}66`,
                  boxShadow: `0 0 12px ${theme.glowColor}44`,
                }}
              >
                {theme.runeGlyph}
              </span>
              <div className="flex flex-col">
                <span
                  className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: theme.glowColor }}
                >
                  {theme.themeName}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono tracking-wider truncate max-w-[200px] sm:max-w-[420px] ${
                    isLight ? 'text-[#5a4833]' : 'text-slate-400'
                  }`}
                >
                  {theme.subTitle}
                </span>
              </div>
            </div>

            {/* Quick Close & Wax Seal Button */}
            <div className="flex items-center gap-2">
              <span
                className={`hidden md:inline text-[10px] font-mono px-2.5 py-0.5 rounded border ${
                  isLight
                    ? 'border-[#c8b693] text-[#5a4833] bg-[#eae0cb]'
                    : 'border-white/10 text-slate-400 bg-white/5'
                }`}
              >
                ESC TO CLOSE
              </span>

              {/* Antique Wax Seal Close Button */}
              <button
                onClick={onClose}
                type="button"
                aria-label="Close 3D Grimoire"
                className="p-1.5 sm:p-2 rounded-full border transition-all duration-200 cursor-pointer group hover:scale-110 active:scale-95 shadow-md"
                style={{
                  backgroundColor: isLight ? '#8a1f2d' : '#991b1b',
                  borderColor: '#fca5a5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                <X className="w-4 h-4 text-white transition-transform group-hover:rotate-90 duration-200" />
              </button>
            </div>
          </header>

          {/* MOBILE VIEWPORT TAB SWITCHER (< 768px) */}
          <div
            className={`flex md:hidden w-full border-b select-none z-30 ${
              isLight ? 'bg-[#dfd2ba] border-[#c8b693]' : 'bg-[#0a0f1c] border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveMobileTab('lore')}
              className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeMobileTab === 'lore'
                  ? 'border-current text-white font-black'
                  : 'border-transparent text-slate-400'
              }`}
              style={{
                color: activeMobileTab === 'lore' ? theme.glowColor : undefined,
                borderColor: activeMobileTab === 'lore' ? theme.glowColor : 'transparent',
              }}
            >
              ✦ Page I: Inscription
            </button>
            <button
              type="button"
              onClick={() => setActiveMobileTab('spells')}
              className={`flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeMobileTab === 'spells'
                  ? 'border-current text-white font-black'
                  : 'border-transparent text-slate-400'
              }`}
              style={{
                color: activeMobileTab === 'spells' ? theme.glowColor : undefined,
                borderColor: activeMobileTab === 'spells' ? theme.glowColor : 'transparent',
              }}
            >
              ✦ Page II: Spells & Actions
            </button>
          </div>

          {/* ================================================================= */}
          {/* D. TWO-PAGE 3D OPEN SPREAD (Angled Fold with Curved Shading)       */}
          {/* ================================================================= */}
          <div
            className="relative w-full flex flex-col md:flex-row max-h-[82vh] sm:max-h-[80vh] overflow-hidden rounded-b-xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* CENTER DEEP SPINE CREASE & SHADOW CANYON */}
            <div
              className="hidden md:block absolute left-1/2 -ml-2 top-0 bottom-0 w-4 z-30 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.65) 100%)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.95)',
              }}
            />

            {/* 3D DRAPED SATIN RIBBON BOOKMARK */}
            <div
              className="hidden md:block absolute left-1/2 -ml-2.5 -top-1 w-5 h-44 z-40 pointer-events-none transition-all duration-300 rounded-b shadow-[3px_8px_16px_rgba(0,0,0,0.7)]"
              style={{
                backgroundColor: theme.ribbonColor,
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.45) 30%, rgba(0,0,0,0.35) 100%)',
                boxShadow: `0 4px 14px ${theme.glowColor}55`,
              }}
            >
              {/* Swallowtail V-cut tip with gold accent fringe */}
              <div
                className="absolute -bottom-3 left-0 right-0 h-4"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  backgroundColor: theme.ribbonColor,
                }}
              />
            </div>

            {/* =============================================================== */}
            {/* LEFT PAGE: CODEX INSCRIPTION & LORE (Angled in 3D: rotateY 6deg) */}
            {/* =============================================================== */}
            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 custom-scrollbar select-text transition-all ${
                activeMobileTab !== 'lore' ? 'hidden md:block' : 'block'
              }`}
              style={{
                transformOrigin: 'right center',
                transform: 'rotateY(5deg)',
                background: isLight
                  ? 'linear-gradient(to right, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                  : 'linear-gradient(to right, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                boxShadow: 'inset -30px 0 35px -12px rgba(0, 0, 0, 0.75)',
              }}
            >
              {/* Top Ornamental Header Flourish */}
              <div
                className={`flex items-center justify-between border-b pb-2.5 ${
                  isLight ? 'border-[#c8b693]/50' : 'border-white/10'
                }`}
              >
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase ${
                    isLight ? 'text-[#6b583f]' : 'text-slate-400'
                  }`}
                >
                  ✦ ARCHIVE CODEX // {project.category.toUpperCase()}
                </span>
                <span
                  className="text-xs font-mono font-bold tracking-widest"
                  style={{ color: theme.glowColor }}
                >
                  PAGE I
                </span>
              </div>

              {/* Project Title with Grand Typography */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor: theme.glowColor,
                      boxShadow: `0 0 10px ${theme.glowColor}`,
                    }}
                  />
                  <span
                    className="text-xs font-mono uppercase tracking-widest font-semibold"
                    style={{ color: theme.glowColor }}
                  >
                    {project.category}
                  </span>
                </div>

                <h1
                  className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide font-fantasy ${
                    isLight ? 'text-[#1c1812]' : 'text-white'
                  }`}
                  style={{
                    textShadow: `0 0 24px ${theme.glowColor}33`,
                  }}
                >
                  {project.title}
                </h1>

                {/* Tagline as Arcane Quotation */}
                <p
                  className={`text-xs sm:text-sm mt-1.5 italic font-medium leading-relaxed ${
                    isLight ? 'text-[#5a4833]' : 'text-slate-300'
                  }`}
                >
                  &ldquo;{project.tagline}&rdquo;
                </p>
              </div>

              {/* Interactive Holographic Spell Matrix Box */}
              <div
                className={`relative rounded-xl p-3.5 sm:p-4 border overflow-hidden transition-all duration-300 group ${
                  isLight ? 'bg-[#e5d9c2]/70 border-[#cfc1a5]' : 'bg-black/40 border-white/10'
                }`}
              >
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glowColor} 0%, transparent 75%)`,
                  }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border font-mono text-lg transition-transform duration-700 group-hover:rotate-180 shadow-md"
                      style={{
                        borderColor: theme.glowColor,
                        backgroundColor: theme.accentBg,
                        color: theme.glowColor,
                        boxShadow: `0 0 14px ${theme.glowColor}44`,
                      }}
                    >
                      {theme.runeGlyph}
                    </div>
                    <div>
                      <div
                        className="text-xs font-mono font-bold tracking-wider uppercase"
                        style={{ color: theme.glowColor }}
                      >
                        ENCHANTED REALM APPARATUS
                      </div>
                      <div
                        className={`text-[11px] font-mono ${
                          isLight ? 'text-[#6b583f]' : 'text-slate-400'
                        }`}
                      >
                        Coordinates: {project.id} // Active Status: Inscribed
                      </div>
                    </div>
                  </div>

                  <div
                    className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: `${theme.glowColor}55`,
                      color: theme.glowColor,
                      backgroundColor: theme.accentBg,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Illuminated</span>
                  </div>
                </div>
              </div>

              {/* Codex Overview / Lore with Illuminated Drop-Cap */}
              <div>
                <h2
                  className="text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
                  style={{ color: theme.glowColor }}
                >
                  <span>✦ Codex Inscription & Overview</span>
                </h2>
                <div
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-[#2a2015]' : 'text-slate-200'
                  }`}
                >
                  <span
                    className="float-left text-3xl sm:text-4xl font-serif font-black pr-2.5 pt-0.5 leading-none"
                    style={{
                      color: theme.glowColor,
                      textShadow: `0 0 12px ${theme.glowColor}`,
                    }}
                  >
                    {project.description.charAt(0)}
                  </span>
                  <span>{project.description.slice(1)}</span>
                </div>
              </div>

              {/* Architecture & Feats */}
              <div
                className={`border-t pt-4 ${
                  isLight ? 'border-[#c8b693]/50' : 'border-white/10'
                }`}
              >
                <h2
                  className="text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
                  style={{ color: theme.glowColor }}
                >
                  <span>✦ Arcane Architecture & Feats</span>
                </h2>
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isLight ? 'text-[#2a2015]' : 'text-slate-300'
                  }`}
                >
                  {project.details}
                </p>
              </div>

              {/* Page I Bottom Stamp */}
              <div className="pt-2 text-center opacity-40 font-mono text-[9px] tracking-widest uppercase">
                ✦ End of Inscription I ✦
              </div>
            </div>

            {/* =============================================================== */}
            {/* RIGHT PAGE: SPELLS, ACTIONS & PORTALS (Angled in 3D: rotateY -6deg) */}
            {/* =============================================================== */}
            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 custom-scrollbar select-text transition-all ${
                activeMobileTab !== 'spells' ? 'hidden md:block' : 'block'
              }`}
              style={{
                transformOrigin: 'left center',
                transform: 'rotateY(-5deg)',
                background: isLight
                  ? 'linear-gradient(to left, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                  : 'linear-gradient(to left, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                boxShadow: 'inset 30px 0 35px -12px rgba(0, 0, 0, 0.75)',
              }}
            >
              {/* Top Ornamental Header Flourish */}
              <div
                className={`flex items-center justify-between border-b pb-2.5 ${
                  isLight ? 'border-[#c8b693]/50' : 'border-white/10'
                }`}
              >
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase ${
                    isLight ? 'text-[#6b583f]' : 'text-slate-400'
                  }`}
                >
                  ✦ SPELLS & ARTIFACT ACTION PORTALS
                </span>
                <span
                  className="text-xs font-mono font-bold tracking-widest"
                  style={{ color: theme.glowColor }}
                >
                  PAGE II
                </span>
              </div>

              {/* Section: Inscribed Technologies */}
              <div>
                <h2
                  className="text-xs font-mono font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                  style={{ color: theme.glowColor }}
                >
                  <span>✦ Inscribed Technologies & Runes</span>
                </h2>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: `${theme.glowColor}55`,
                        backgroundColor: theme.accentBg,
                        color: isLight ? '#1c1812' : '#ffffff',
                        boxShadow: `0 2px 8px ${theme.glowColor}18`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.glowColor }}
                      />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION PORTALS: GITHUB & LIVE DEMO (High-impact prominent placement) */}
              <div
                className={`border-t pt-4 ${
                  isLight ? 'border-[#c8b693]/50' : 'border-white/10'
                }`}
              >
                <h2
                  className="text-xs font-mono font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                  style={{ color: theme.glowColor }}
                >
                  <span>✦ Realm Action Portals</span>
                </h2>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* View GitHub Code Source */}
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition-all duration-200 text-xs font-bold tracking-wider uppercase cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      isLight
                        ? 'bg-[#2a241b] text-[#f2ece0] border-[#1c1812] hover:bg-[#3d3427]'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    style={{
                      boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
                    }}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>Inspect Source Code</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>

                  {/* Launch Live Demo (if available) */}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase border transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: theme.glowColor,
                        color: '#000000',
                        borderColor: theme.glowColor,
                        boxShadow: `0 0 20px ${theme.glowColor}66`,
                      }}
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>Launch Live Demo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Section: Enchanted Capabilities / Spells */}
              {spellsList.length > 0 && (
                <div
                  className={`border-t pt-4 ${
                    isLight ? 'border-[#c8b693]/50' : 'border-white/10'
                  }`}
                >
                  <h2
                    className="text-xs font-mono font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                    style={{ color: theme.glowColor }}
                  >
                    <span>✦ Grimoire Incantations & Feats</span>
                  </h2>

                  <div className="space-y-2.5">
                    {spellsList.map((spell, i) => (
                      <div
                        key={spell.id || i}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 hover:translate-x-1 ${
                          isLight ? 'bg-[#e5d9c2]/60 border-[#c8b693]' : 'bg-black/35 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs font-bold font-mono tracking-wide"
                            style={{ color: theme.glowColor }}
                          >
                            {i + 1}. {spell.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                              isLight
                                ? 'border-[#c8b693] text-[#5a4833] bg-[#eae0cb]'
                                : 'border-white/15 text-slate-300 bg-white/5'
                            }`}
                          >
                            {spell.tier}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] sm:text-xs leading-relaxed ${
                            isLight ? 'text-[#3d2e1c]' : 'text-slate-300'
                          }`}
                        >
                          {spell.description.replace('[Sample Content] ', '')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Return Button to fold book back */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-mono tracking-wider uppercase py-1.5 px-4 rounded-full border transition-all opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer"
                  style={{
                    borderColor: `${theme.glowColor}55`,
                    color: theme.glowColor,
                    backgroundColor: theme.accentBg,
                  }}
                >
                  ✦ Fold Grimoire & Return to Constellation ✦
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
