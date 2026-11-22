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
  leatherBorder: string;
  accentBg: string;
  ribbonColor: string;
  pageTintDark: string;
  pageTintLight: string;
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
        leatherBorder: '#0c2233',
        accentBg: 'rgba(56, 189, 248, 0.12)',
        ribbonColor: '#0284c7',
        pageTintDark: 'from-[#07131e] via-[#050d14] to-[#07131e]',
        pageTintLight: 'from-[#f5f8fb] via-[#eaf1f7] to-[#f5f8fb]',
      };
    case '#10b981':
      return {
        themeName: 'POLYHEDRAL GEOMETRY & 3D SOLVER CODEX',
        subTitle: 'INTERACTIVE TWISTY-PUZZLE LAB & REAL-TIME ALGORITHMS',
        runeGlyph: '⬡',
        glowColor: '#10b981',
        leatherBorder: '#0b261b',
        accentBg: 'rgba(16, 185, 129, 0.12)',
        ribbonColor: '#059669',
        pageTintDark: 'from-[#061710] via-[#030e0a] to-[#061710]',
        pageTintLight: 'from-[#f3f9f6] via-[#e4f2eb] to-[#f3f9f6]',
      };
    case '#a855f7':
      return {
        themeName: 'ARCANE SCRIPT & DEVELOPER ALCHEMY TOME',
        subTitle: 'SYNTACTIC ANALYSIS, REAL-TIME COMPILERS & WORKFLOWS',
        runeGlyph: 'ᛋ',
        glowColor: '#a855f7',
        leatherBorder: '#230f38',
        accentBg: 'rgba(168, 85, 247, 0.12)',
        ribbonColor: '#9333ea',
        pageTintDark: 'from-[#140822] via-[#0b0314] to-[#140822]',
        pageTintLight: 'from-[#f8f4fc] via-[#eee3f8] to-[#f8f4fc]',
      };
    case '#3b82f6':
      return {
        themeName: 'CELESTIAL SWARM & AGENT ORCHESTRATION',
        subTitle: 'DISTRIBUTED CONSENSUS, AUTONOMOUS WORKERS & MESH',
        runeGlyph: '☿',
        glowColor: '#3b82f6',
        leatherBorder: '#0e1e3b',
        accentBg: 'rgba(59, 130, 246, 0.12)',
        ribbonColor: '#2563eb',
        pageTintDark: 'from-[#081224] via-[#040813] to-[#081224]',
        pageTintLight: 'from-[#f4f7fc] via-[#e5edfb] to-[#f4f7fc]',
      };
    case '#f43f5e':
      return {
        themeName: 'HOGWARTS SORCERY & 3D INTERACTIVE TOME',
        subTitle: 'VOLUMETRIC PARTICLES, SHADERS & IMMERSIVE SCENARIOS',
        runeGlyph: '⚡',
        glowColor: '#f43f5e',
        leatherBorder: '#360c18',
        accentBg: 'rgba(244, 63, 94, 0.12)',
        ribbonColor: '#e11d48',
        pageTintDark: 'from-[#200810] via-[#100307] to-[#200810]',
        pageTintLight: 'from-[#fcf4f6] via-[#fae4e8] to-[#fcf4f6]',
      };
    case '#f59e0b':
    default:
      return {
        themeName: 'SOLAR FORGE & FULL-STACK INVENTIONS CODEX',
        subTitle: 'CLOUD-NATIVE ARCHITECTURE & SCALABLE DIGITAL APPARATUS',
        runeGlyph: '☼',
        glowColor: '#f59e0b',
        leatherBorder: '#331e07',
        accentBg: 'rgba(245, 158, 11, 0.12)',
        ribbonColor: '#d97706',
        pageTintDark: 'from-[#1e1104] via-[#0f0802] to-[#1e1104]',
        pageTintLight: 'from-[#fcf7f2] via-[#faede0] to-[#fcf7f2]',
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      aria-label={`Open Grimoire: ${project.title}`}
    >
      {/* 1. Atmospheric Ambient Backdrop with Vignette & Theme Color Embers */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      >
        {/* Subtle radial magical glow originating from center */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glowColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* 2. THE GRAND OPEN GRIMOIRE BOOK CONTAINER */}
      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
          });
        }}
        className={`relative z-50 w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] flex flex-col rounded-2xl md:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] border transition-all duration-500 overflow-hidden ${
          isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-4 opacity-0'
        }`}
        style={{
          borderColor: `${theme.glowColor}55`,
          boxShadow: `0 0 50px ${theme.glowColor}33, 0 25px 80px rgba(0, 0, 0, 0.95)`,
          backgroundColor: isLight ? '#f2ece0' : '#080c14',
        }}
      >
        {/* Leather Binding Outer Trim / Frame */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl md:rounded-3xl border-4 md:border-8 transition-colors"
          style={{
            borderColor: isLight ? '#d2c2a3' : theme.leatherBorder,
          }}
        />

        {/* 4 Filigree Corner Clasps */}
        <div
          className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 pointer-events-none z-30"
          style={{ borderColor: theme.glowColor }}
        />
        <div
          className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 pointer-events-none z-30"
          style={{ borderColor: theme.glowColor }}
        />
        <div
          className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 pointer-events-none z-30"
          style={{ borderColor: theme.glowColor }}
        />
        <div
          className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 pointer-events-none z-30"
          style={{ borderColor: theme.glowColor }}
        />

        {/* TOP BAR: Tome Header, Theme Banner, and Wax Seal Close Button */}
        <header
          className={`relative z-20 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b select-none transition-colors ${
            isLight
              ? 'bg-[#eae0ce] border-[#d2c2a3] text-[#3c3427]'
              : 'bg-[#060910] border-white/10 text-slate-300'
          }`}
        >
          {/* Theme Banner & Active Rune */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base shadow-inner transition-transform"
              style={{
                backgroundColor: theme.accentBg,
                color: theme.glowColor,
                border: `1px solid ${theme.glowColor}66`,
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
                className={`text-[9px] sm:text-[10px] font-mono tracking-wider truncate max-w-[200px] sm:max-w-[400px] ${
                  isLight ? 'text-[#6b5e48]' : 'text-slate-400'
                }`}
              >
                {theme.subTitle}
              </span>
            </div>
          </div>

          {/* Close & Shortcut Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded border ${
                isLight
                  ? 'border-[#c8bc9f] text-[#6b5e48] bg-[#f2ece0]'
                  : 'border-white/10 text-slate-400 bg-white/5'
              }`}
            >
              ESC TO CLOSE
            </span>

            {/* Antique Wax Seal Close Button */}
            <button
              onClick={onClose}
              type="button"
              aria-label="Close Grimoire"
              className="p-1.5 sm:p-2 rounded-xl border transition-all duration-200 cursor-pointer group hover:scale-105 active:scale-95"
              style={{
                borderColor: `${theme.glowColor}55`,
                backgroundColor: isLight ? '#e2d5be' : 'rgba(255,255,255,0.06)',
              }}
            >
              <X
                className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200"
                style={{ color: theme.glowColor }}
              />
            </button>
          </div>
        </header>

        {/* MOBILE VIEWPORT TAB SWITCHER (For compact screens < 768px) */}
        <div
          className={`flex md:hidden border-b select-none ${
            isLight ? 'bg-[#e2d5be] border-[#d2c2a3]' : 'bg-[#0a0d16] border-white/10'
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

        {/* MAIN TWO-PAGE OPEN GRIMOIRE BODY */}
        <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* CENTER BOOK SPINE SEAM & DANGLING SATIN BOOKMARK RIBBON (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-3 -ml-1.5 z-30 pointer-events-none shadow-[inset_0_0_10px_rgba(0,0,0,0.85)] bg-gradient-to-r from-black/45 via-black/80 to-black/45" />

          {/* Dangling Bookmark Ribbon */}
          <div
            className="hidden md:block absolute left-1/2 -ml-2 -top-1 w-4 h-36 z-40 pointer-events-none transition-all duration-300 rounded-b shadow-lg"
            style={{
              backgroundColor: theme.ribbonColor,
              boxShadow: `0 4px 14px ${theme.glowColor}55`,
            }}
          >
            {/* V-cut ribbon tail */}
            <div
              className="absolute bottom-0 left-0 right-0 h-3"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                backgroundColor: theme.ribbonColor,
              }}
            />
          </div>

          {/* ================================================================= */}
          {/* LEFT PAGE: CODEX LORE, ARCHITECTURE & THEMATIC EMBLEM (PAGE I)    */}
          {/* ================================================================= */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 custom-scrollbar select-text transition-all ${
              activeMobileTab !== 'lore' ? 'hidden md:block' : 'block'
            } ${
              isLight
                ? `bg-gradient-to-br ${theme.pageTintLight} text-[#2a241b]`
                : `bg-gradient-to-br ${theme.pageTintDark} text-slate-200`
            }`}
          >
            {/* Top Ornamental Header Flourish */}
            <div className="flex items-center justify-between border-b pb-3 border-current/15">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">
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
                  isLight ? 'text-[#5a4d3a]' : 'text-slate-300'
                }`}
              >
                &ldquo;{project.tagline}&rdquo;
              </p>
            </div>

            {/* Interactive Holographic Spell Matrix Box */}
            <div
              className={`relative rounded-xl p-3.5 sm:p-4 border overflow-hidden transition-all duration-300 group ${
                isLight
                  ? 'bg-[#e7decb]/70 border-[#cfc1a5]'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              {/* Subtle animated background grid & radial bloom */}
              <div
                className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glowColor} 0%, transparent 75%)`,
                }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Rotating Arcane Seal Wheel */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border font-mono text-lg transition-transform duration-700 group-hover:rotate-180 shadow-md"
                    style={{
                      borderColor: theme.glowColor,
                      backgroundColor: theme.accentBg,
                      color: theme.glowColor,
                      boxShadow: `0 0 14px ${theme.glowColor}44`,
                      transform: `perspective(400px) rotateX(${mousePos.y * 0.5}deg) rotateY(${mousePos.x * 0.5}deg)`,
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
                    <div className="text-[11px] font-mono opacity-70">
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
                  isLight ? 'text-[#3d3427]' : 'text-slate-200'
                }`}
              >
                {/* Large Drop-Cap first letter */}
                <span
                  className="float-left text-3xl sm:text-4xl font-serif font-black pr-2 pt-0.5 leading-none transition-transform"
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
            <div className="border-t pt-4 border-current/15">
              <h2
                className="text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
                style={{ color: theme.glowColor }}
              >
                <span>✦ Arcane Architecture & Feats</span>
              </h2>
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isLight ? 'text-[#3d3427]' : 'text-slate-300'
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

          {/* ================================================================= */}
          {/* RIGHT PAGE: SPELLS, TECHNOLOGIES & ACTION PORTALS (PAGE II)       */}
          {/* ================================================================= */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 custom-scrollbar select-text transition-all ${
              activeMobileTab !== 'spells' ? 'hidden md:block' : 'block'
            } ${
              isLight
                ? `bg-gradient-to-bl ${theme.pageTintLight} text-[#2a241b]`
                : `bg-gradient-to-bl ${theme.pageTintDark} text-slate-200`
            }`}
          >
            {/* Top Ornamental Header Flourish */}
            <div className="flex items-center justify-between border-b pb-3 border-current/15">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">
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

            {/* ACTION PORTALS: GITHUB & LIVE DEMO (Prominent & immediately accessible) */}
            <div className="border-t pt-4 border-current/15">
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
              <div className="border-t pt-4 border-current/15">
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
                        isLight
                          ? 'bg-[#e7decb]/60 border-[#cfc1a5]'
                          : 'bg-black/35 border-white/10'
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
                              ? 'border-[#c8bc9f] text-[#6b5e48] bg-[#f2ece0]'
                              : 'border-white/15 text-slate-300 bg-white/5'
                          }`}
                        >
                          {spell.tier}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] sm:text-xs leading-relaxed ${
                          isLight ? 'text-[#4d4232]' : 'text-slate-300'
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
  );
};
