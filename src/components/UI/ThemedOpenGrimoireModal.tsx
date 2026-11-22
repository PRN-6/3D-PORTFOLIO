import React, { useEffect, useState, useMemo } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
  latinTitle: string;
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
        latinTitle: 'LIBER DE INTELLIGENTIA AUTONOMA ET CIPHRIS',
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
        latinTitle: 'CODEX MATHEMATICUS POLYHEDRICUS ET ENIGMATA',
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
        latinTitle: 'TRACTATUS DE SYNTAXI ARCANO ET ALCHEMIA',
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
        latinTitle: 'MANUSCRIPTUM DE CONSTELATIONIBUS ET AGENTIBUS',
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
        latinTitle: 'GRIMORIUM MAGIAE ANTIQUAE ET INCANTATIONUM',
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
        latinTitle: 'FORUM METALLURGIAE DIGITALIS ET INVENTIONES',
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

  // Multi-folio state:
  // Spread 0: Folio I & II
  // Spread 1: Folio III & IV
  // Spread 2: Folio V & VI
  const [currentSpread, setCurrentSpread] = useState<number>(0);
  const [isRendered, setIsRendered] = useState(false);

  // 3D Book Opening Entrance Sequence State
  const [isBookOpening, setIsBookOpening] = useState(false);

  // 3D Page Turning Animation States
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [flipFrom, setFlipFrom] = useState<number>(0);
  const [flipTo, setFlipTo] = useState<number>(0);

  // Mobile Single-Page view offset (0 = Left folio, 1 = Right folio)
  const [mobilePageOffset, setMobilePageOffset] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsBookOpening(true);
      setCurrentSpread(0);
      setMobilePageOffset(0);
      const timer = setTimeout(() => {
        setIsBookOpening(false);
      }, 850);
      return () => clearTimeout(timer);
    } else {
      setIsBookOpening(false);
      const timer = setTimeout(() => setIsRendered(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNextPage = () => {
    if (isFlipping || isBookOpening) return;
    if (currentSpread < 2) {
      const from = currentSpread;
      const to = from + 1;
      setFlipFrom(from);
      setFlipTo(to);
      setFlipDirection('forward');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(to);
        setIsFlipping(false);
      }, 650);
    }
  };

  const handlePrevPage = () => {
    if (isFlipping || isBookOpening) return;
    if (currentSpread > 0) {
      const from = currentSpread;
      const to = from - 1;
      setFlipFrom(from);
      setFlipTo(to);
      setFlipDirection('backward');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(to);
        setIsFlipping(false);
      }, 650);
    }
  };

  const handleJumpToSpread = (idx: number) => {
    if (idx !== currentSpread && !isFlipping && !isBookOpening) {
      const from = currentSpread;
      const to = idx;
      setFlipFrom(from);
      setFlipTo(to);
      setFlipDirection(to > from ? 'forward' : 'backward');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(to);
        setIsFlipping(false);
      }, 650);
    }
  };

  // Mobile navigation between 6 individual folios (0 to 5)
  const currentMobileFolio = currentSpread * 2 + mobilePageOffset; // 0 to 5
  const handleMobileNext = () => {
    if (currentMobileFolio < 5) {
      if (mobilePageOffset === 0) {
        setMobilePageOffset(1);
      } else {
        handleNextPage();
        setMobilePageOffset(0);
      }
    }
  };
  const handleMobilePrev = () => {
    if (currentMobileFolio > 0) {
      if (mobilePageOffset === 1) {
        setMobilePageOffset(0);
      } else {
        handlePrevPage();
        setMobilePageOffset(1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSpread, isFlipping, isBookOpening, onClose]);

  const theme = useMemo(() => {
    return getBookThemeConfig(project?.accentColor || '#10b981');
  }, [project?.accentColor]);

  if (!isRendered || !project) return null;

  const spellsList = grimoire?.spells || [];

  // ===========================================================================
  // FOLIO RENDERERS (Strictly Antique Manuscript / Classical Medieval Layout)
  // ===========================================================================

  /** FOLIO I: Frontispiece, Title Inscription, Alchemical Sigil, & Lore Initial */
  const renderFolio1 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>❧</span> ARCHIVE CODEX · FOLIO I
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE I
          </span>
        </div>

        {/* Category Inscription */}
        <div className="flex items-center gap-2">
          <span className="text-amber-600 font-serif text-xs">✦</span>
          <span className="text-[11px] font-grimoire-title uppercase tracking-widest font-bold" style={{ color: theme.glowColor }}>
            {project.category}
          </span>
          <span className="text-amber-600 font-serif text-xs">✦</span>
        </div>

        {/* Title in Grand Classical Roman Capital Letters */}
        <h1
          className={`text-2xl sm:text-3xl md:text-[34px] font-black tracking-wide font-grimoire-title leading-tight ${
            isLight ? 'text-[#1e140a]' : 'text-white'
          }`}
          style={{ textShadow: `0 0 20px ${theme.glowColor}33` }}
        >
          {project.title}
        </h1>

        {/* Tagline as Classical Inscription Quote */}
        <p className={`text-xs sm:text-[13px] italic font-grimoire-body leading-relaxed ${isLight ? 'text-[#4d3a27]' : 'text-slate-300'}`}>
          &ldquo;{project.tagline}&rdquo;
        </p>

        {/* Woodblock Alchemical Seal Engraving */}
        <div
          className={`p-3 rounded border border-amber-800/30 flex items-center gap-3 ${
            isLight ? 'bg-amber-900/5' : 'bg-black/40'
          }`}
        >
          <div
            className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-grimoire-title flex-shrink-0 shadow-inner"
            style={{
              borderColor: theme.glowColor,
              color: theme.glowColor,
              backgroundColor: theme.accentBg,
            }}
          >
            {theme.runeGlyph}
          </div>
          <div>
            <div className="text-xs font-grimoire-title font-bold tracking-wider uppercase" style={{ color: theme.glowColor }}>
              ALCHEMICAL APPARATUS SIGIL
            </div>
            <div className={`text-[10px] font-grimoire-body italic ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
              Inscribed in the Archmage&apos;s Grand Codex · Artifact No. {project.id}
            </div>
          </div>
        </div>

        {/* Primary Inscription with Vermilion Drop-Cap */}
        <div>
          <div className="text-[10px] font-grimoire-title uppercase tracking-widest text-amber-700 font-bold mb-1">
            ✦ DE INSCRIPTIONE PRIMA (LORE)
          </div>
          <div className={`text-xs sm:text-[13px] leading-relaxed font-grimoire-body text-justify ${isLight ? 'text-[#2a1e12]' : 'text-slate-200'}`}>
            <span
              className="float-left text-4xl sm:text-5xl font-grimoire-title font-black pr-2.5 pt-0.5 leading-none select-none"
              style={{
                color: isLight ? '#991b1b' : theme.glowColor,
                textShadow: isLight ? '1px 1px 0px rgba(0,0,0,0.1)' : `0 0 14px ${theme.glowColor}`,
              }}
            >
              {project.description.charAt(0)}
            </span>
            <span>{project.description.slice(1)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Folio Margin Footnote */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <span>❧ ARCHIVUM MAGISTER · ANNO MMXXVI ☙</span>
        <span className="font-grimoire-title tracking-wider font-bold">FOLIO I</span>
      </div>
    </div>
  );

  /** FOLIO II: The Artifact Chronicles, Architecture Overview, and Action Relic Portals */
  const renderFolio2 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>✦</span> TRACTATUS PRIMUS · FOLIO II
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE II
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-grimoire-title font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.glowColor }}>
            ✦ The Artifact Chronicles
          </h2>
          <p className={`text-[11px] italic font-grimoire-body ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
            Inscribed records of performance, offline reliability, and surgical precision.
          </p>
        </div>

        {/* Narrative Paragraphs */}
        <div className={`space-y-2 font-grimoire-body text-xs sm:text-[13px] leading-relaxed text-justify ${
          isLight ? 'text-[#2a1e12]' : 'text-slate-200'
        }`}>
          <p>
            Inscribed as a foundational work within the Archmage&apos;s digital repository, this project exemplifies the synthesis of mathematical rigor and modern execution. Operating entirely independent of centralized cloud clusters, all computation resolves locally.
          </p>
          <p>
            Through fine-tuned models and surgical memory layouts, the system delivers responses with deterministic predictability and uncompromising speed.
          </p>
        </div>

        {/* Action Portals Inscribed as Antique Engraved Brass Plaques */}
        <div className="border-t border-b border-amber-800/25 py-2.5 space-y-2">
          <div className="text-[10px] font-grimoire-title uppercase tracking-widest text-amber-700 font-bold">
            ✦ REALM ACTION PORTALS ✦
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border border-amber-800/40 hover:border-amber-600 transition-all font-grimoire-title text-xs tracking-wider uppercase group shadow-md"
                style={{
                  backgroundColor: isLight ? '#f2e8d3' : '#0c131c',
                  color: isLight ? '#3b2512' : '#f1f5f9',
                }}
              >
                <span className="text-amber-600 font-bold text-sm">☩</span>
                <span className="font-bold">Inspect Source Code</span>
                <ExternalLink className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}

            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border border-amber-800/40 hover:border-amber-600 transition-all font-grimoire-title text-xs tracking-wider uppercase group shadow-md"
                style={{
                  backgroundColor: isLight ? '#f2e8d3' : '#0c131c',
                  color: isLight ? '#3b2512' : '#f1f5f9',
                }}
              >
                <span className="text-amber-600 font-bold text-sm">✦</span>
                <span className="font-bold">Enter Live Realm</span>
                <ExternalLink className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Folio Margin Footnote */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <span className="italic">Turn forward to inspect De Architectura</span>
        <button
          type="button"
          onClick={handleNextPage}
          className="hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-grimoire-title font-bold text-amber-700"
        >
          <span>Folio III ❯</span>
        </button>
      </div>
    </div>
  );

  /** FOLIO III: De Architectura, Computational Mechanics, & Core Pillars */
  const renderFolio3 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>✦</span> DE ARCHITECTURA ET SCHEMATIBUS · FOLIO III
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE III
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-grimoire-title font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.glowColor }}>
            ✦ Treatise on Architecture & Parity
          </h2>
          <p className={`text-[11px] italic font-grimoire-body ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
            Analysis of computational mechanics, local state isolation, and deterministic performance.
          </p>
        </div>

        {/* Core Architecture Thesis Box */}
        <div className={`p-3.5 rounded border border-amber-800/30 font-grimoire-body text-xs sm:text-[13px] leading-relaxed text-justify ${
          isLight ? 'bg-amber-900/5 text-[#2a1e12]' : 'bg-black/35 text-slate-200'
        }`}>
          <span className="font-grimoire-title font-bold block mb-1 text-amber-700 text-xs">
            I. THE ARCHITECTURAL THESIS
          </span>
          {project.details}
        </div>

        {/* 2 Foundational Pillars Formatted as Ancient Axioms */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-grimoire-title uppercase tracking-widest text-amber-700 font-bold block">
            ✦ FOUNDATIONAL PILLARS
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-grimoire-body">
            <div className={`p-2 rounded border border-amber-800/25 ${isLight ? 'bg-white/40' : 'bg-white/5'}`}>
              <div className="font-grimoire-title font-bold text-amber-600 text-xs">✦ Latency Determinism</div>
              <div className="opacity-80 mt-0.5">Sub-second execution loops with zero telemetry overhead.</div>
            </div>
            <div className={`p-2 rounded border border-amber-800/25 ${isLight ? 'bg-white/40' : 'bg-white/5'}`}>
              <div className="font-grimoire-title font-bold text-amber-600 text-xs">✦ Algorithmic Parity</div>
              <div className="opacity-80 mt-0.5">Strict mathematical correctness verified across all state trees.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Folio Margin Footnote */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <button
          type="button"
          onClick={handlePrevPage}
          className="hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-grimoire-title font-bold text-amber-700"
        >
          <span>❮ Folio I-II</span>
        </button>
        <span className="font-grimoire-title tracking-wider font-bold">FOLIO III</span>
      </div>
    </div>
  );

  /** FOLIO IV: Inscribed Grimoire Spells & Arcane Incantations (Detailed Commentary) */
  const renderFolio4 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>✦</span> INCANTATIONES MAGISTERII · FOLIO IV
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE IV
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-grimoire-title font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.glowColor }}>
            ✦ Inscribed Spells & Incantations
          </h2>
          <p className={`text-[11px] italic font-grimoire-body ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
            Core apparatus capabilities inscribed into the grimoire binding.
          </p>
        </div>

        {/* 4 Inscribed Spells in Antique Scholastic Commentary Format */}
        <div className="space-y-2">
          {(spellsList.length > 0
            ? spellsList.map((s) => ({ name: s.name, tier: s.tier, description: s.description }))
            : [
                { name: 'Deterministic Loop Optimization', tier: 'Grandmaster Spell', description: 'Zero-overhead concurrent execution with thread-isolated queues.' },
                { name: 'Strict Type Alchemy', tier: 'Mastery Incantation', description: 'Compile-time invariants with zero runtime ambiguity.' },
                { name: 'Local Neural Inference', tier: 'Grandmaster Spell', description: 'Low-latency quantized models executed purely on GPU hardware.' },
                { name: 'State Boundary Cryptography', tier: 'Mastery Incantation', description: 'Zero-leak telemetry sandboxing for total privacy guarantees.' },
              ]
          ).slice(0, 4).map((spell, idx) => (
            <div
              key={spell.name}
              className={`p-2 sm:p-2.5 rounded border border-amber-800/25 transition-all ${
                isLight ? 'bg-amber-900/5 hover:bg-amber-900/10' : 'bg-black/35 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-700 font-grimoire-title font-bold text-xs">
                    {['I.', 'II.', 'III.', 'IV.'][idx]}
                  </span>
                  <span className={`text-xs font-grimoire-title font-bold ${isLight ? 'text-[#2a1e12]' : 'text-white'}`}>
                    {spell.name}
                  </span>
                </div>
                <span className="text-[9px] font-grimoire-title uppercase tracking-wider text-amber-700 font-bold border border-amber-800/30 px-1.5 py-0.5 rounded">
                  {spell.tier}
                </span>
              </div>
              <p className={`text-[11px] font-grimoire-body mt-1 leading-snug ${isLight ? 'text-[#4d3a27]' : 'text-slate-300'}`}>
                {spell.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Folio Margin Footnote */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <span className="italic">Turn forward to inspect Technologies & Sigils</span>
        <button
          type="button"
          onClick={handleNextPage}
          className="hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-grimoire-title font-bold text-amber-700"
        >
          <span>Folio V ❯</span>
        </button>
      </div>
    </div>
  );

  /** FOLIO V: Inscribed Technologies & Runes (Antique Manuscript Cartouches) */
  const renderFolio5 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>✦</span> SIGILLA ET TECHNOLOGIAE · FOLIO V
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE V
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-grimoire-title font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.glowColor }}>
            ✦ Inscribed Technologies & Runes
          </h2>
          <p className={`text-[11px] italic font-grimoire-body ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
            The foundational languages, compilers, and tools forged into this artifact.
          </p>
        </div>

        {/* Technology Cartouches (Antique manuscript cards, zero modern plastic pills) */}
        <div className="grid grid-cols-2 gap-2">
          {project.technologies.map((tech, idx) => (
            <div
              key={tech}
              className={`p-2.5 rounded border border-amber-800/30 flex items-center gap-2 transition-all ${
                isLight ? 'bg-amber-900/5 hover:bg-amber-900/10' : 'bg-black/35 hover:bg-white/5'
              }`}
            >
              <span className="text-amber-600 font-grimoire-title text-xs font-bold">{idx + 1}.</span>
              <div className="flex flex-col">
                <span className={`text-xs font-grimoire-title font-bold ${isLight ? 'text-[#2a1e12]' : 'text-white'}`}>
                  {tech}
                </span>
                <span className="text-[9px] font-grimoire-body opacity-60 uppercase">
                  Sigil {theme.runeGlyph} · Verified
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Marginal Scholastic Note */}
        <div className={`p-3 rounded border border-dashed border-amber-800/30 text-[11px] font-grimoire-body italic ${
          isLight ? 'bg-amber-50 text-[#4a3520]' : 'bg-black/20 text-slate-300'
        }`}>
          &ldquo;Each technology is bound through deterministic compilation, with zero superfluous dependencies or cloud telemetry.&rdquo;
        </div>
      </div>

      {/* Bottom Folio Margin Footnote */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <button
          type="button"
          onClick={handlePrevPage}
          className="hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-grimoire-title font-bold text-amber-700"
        >
          <span>❮ Folio III-IV</span>
        </button>
        <span className="font-grimoire-title tracking-wider font-bold">FOLIO V</span>
      </div>
    </div>
  );

  /** FOLIO VI: Colophon & Archmage Wax Seal Verification */
  const renderFolio6 = () => (
    <div className="relative z-10 flex flex-col h-full justify-between select-text font-serif">
      <div className="space-y-2.5">
        {/* Folio Header Rule */}
        <div className="flex items-center justify-between border-b border-amber-800/25 pb-1.5">
          <span className="text-[10px] tracking-widest font-grimoire-title uppercase opacity-65 flex items-center gap-1">
            <span>✦</span> COLOPHON & SIGILLUM · FOLIO VI
          </span>
          <span className="text-[11px] font-grimoire-title font-bold tracking-widest" style={{ color: theme.glowColor }}>
            PAGE VI
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-grimoire-title font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.glowColor }}>
            ✦ Archmage Colophon & Seal
          </h2>
          <p className={`text-[11px] italic font-grimoire-body ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
            Official certification and archival inscription of this grimoire artifact.
          </p>
        </div>

        {/* Archmage Official Wax Seal Medallion */}
        <div
          className={`p-4 rounded border border-amber-800/35 flex flex-col sm:flex-row items-center gap-4 ${
            isLight ? 'bg-amber-900/5' : 'bg-black/40'
          }`}
        >
          {/* Authentic 3D Crimson Wax Seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xl relative select-none"
            style={{
              backgroundColor: '#991b1b',
              border: '3px solid #b91c1c',
              boxShadow: '0 4px 18px rgba(153, 27, 27, 0.6), inset 0 2px 6px rgba(255,255,255,0.3)',
            }}
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-amber-200/50 flex items-center justify-center">
              <span className="text-2xl font-serif text-amber-200 font-bold drop-shadow">
                {theme.runeGlyph}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="text-xs font-grimoire-title font-bold tracking-widest text-amber-600 uppercase">
              ARCHIVUM MAGISTER VERIFICATIO
            </div>
            <div className={`text-[11px] font-grimoire-body leading-relaxed ${isLight ? 'text-[#3b2713]' : 'text-slate-300'}`}>
              Codex bound with deterministic integrity. Verified for production deployment and perpetual open-source inspection.
            </div>
            <div className={`text-[9px] font-grimoire-title font-bold tracking-widest opacity-60 uppercase ${isLight ? 'text-[#5a4833]' : 'text-slate-400'}`}>
              Inscribed in the Archive Realm · Year 2026
            </div>
          </div>
        </div>

        {/* Repository Inspection Plaque */}
        {project.githubUrl && (
          <div className="pt-1">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded border border-amber-800/40 hover:border-amber-600 transition-all font-grimoire-title text-xs tracking-wider uppercase group shadow-md"
              style={{
                backgroundColor: isLight ? '#f2e8d3' : '#0c131c',
                color: isLight ? '#3b2512' : '#f1f5f9',
              }}
            >
              <span className="text-amber-600 font-bold text-sm">☩</span>
              <span className="font-bold">Inspect Complete Repository on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        )}
      </div>

      {/* Fold Grimoire & Close Action */}
      <div className="border-t border-amber-800/20 pt-2 flex items-center justify-between text-[10px] font-grimoire-body text-amber-800/60">
        <button
          type="button"
          onClick={handlePrevPage}
          className="hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-grimoire-title font-bold text-amber-700"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>Folio V</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1 rounded-full border border-amber-800/40 font-grimoire-title text-xs hover:bg-amber-500/10 transition-colors cursor-pointer font-bold"
          style={{ color: theme.glowColor }}
        >
          ✦ Fold Grimoire & Close ✦
        </button>
      </div>
    </div>
  );

  const renderLeftFolio = (spreadIdx: number) => {
    switch (spreadIdx) {
      case 0: return renderFolio1();
      case 1: return renderFolio3();
      case 2: return renderFolio5();
      default: return renderFolio1();
    }
  };

  const renderRightFolio = (spreadIdx: number) => {
    switch (spreadIdx) {
      case 0: return renderFolio2();
      case 1: return renderFolio4();
      case 2: return renderFolio6();
      default: return renderFolio2();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-serif transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`3D Grimoire Tome: ${project.title}`}
    >
      {/* 1. Atmospheric Dark Backdrop with Vignette & Theme Color Radiance */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
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
        style={{ perspective: '2200px' }}
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
              boxShadow: `0 0 50px ${theme.glowColor}30, 0 35px 90px rgba(0, 0, 0, 0.95)`,
            }}
          >
            {/* Stitched Leather Perimeter Inset */}
            <div className="absolute inset-2 sm:inset-3 rounded-xl md:rounded-2xl border border-dashed border-amber-600/35 pointer-events-none" />

            {/* 4 Antique Gilded Filigree Corner Clasps */}
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
          <div
            className="hidden md:block absolute -left-4 top-2 bottom-2 w-4 pointer-events-none z-10 rounded-l-sm"
            style={{
              background: `repeating-linear-gradient(to right, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.1) 1px, #d7c49b 2px, #ebdcb9 3px)`,
              boxShadow: `inset 2px 0 6px rgba(0,0,0,0.6), -4px 0 10px rgba(0,0,0,0.5)`,
            }}
          />

          <div
            className="hidden md:block absolute -right-4 top-2 bottom-2 w-4 pointer-events-none z-10 rounded-r-sm"
            style={{
              background: `repeating-linear-gradient(to left, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.1) 1px, #d7c49b 2px, #ebdcb9 3px)`,
              boxShadow: `inset -2px 0 6px rgba(0,0,0,0.6), 4px 0 10px rgba(0,0,0,0.5)`,
            }}
          />

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
            {/* Theme Emblem & Medieval Latin Subtitle */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-grimoire-title font-bold text-sm sm:text-base border shadow-inner"
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
                  className="text-[10px] sm:text-[11px] font-grimoire-title font-bold tracking-widest uppercase"
                  style={{ color: theme.glowColor }}
                >
                  {theme.themeName}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-grimoire-body tracking-wider italic truncate max-w-[130px] sm:max-w-[420px] ${
                    isLight ? 'text-[#5a4833]' : 'text-slate-400'
                  }`}
                >
                  {theme.latinTitle}
                </span>
              </div>
            </div>

            {/* Page Navigation & Wax Seal Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Turn Page Buttons in Header (Hidden on small mobile where footer handles it) */}
              <div
                className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-serif ${
                  isLight
                    ? 'border-[#c8b693] bg-[#eae0cb] text-[#4d3b26]'
                    : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentSpread === 0 || isFlipping || isBookOpening}
                  aria-label="Previous Page"
                  className="p-1 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono tracking-widest px-1 font-bold">
                  FOLIO {currentSpread * 2 + 1}-{currentSpread * 2 + 2} / 6
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentSpread === 2 || isFlipping || isBookOpening}
                  aria-label="Next Page"
                  className="p-1 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

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

          {/* ================================================================= */}
          {/* D. TWO-PAGE 3D OPEN SPREAD (With Realistic Page-Flip Animation)     */}
          {/* ================================================================= */}
          <div
            className="relative w-full min-h-[520px] md:min-h-[560px] max-h-[82vh] sm:max-h-[80vh] overflow-hidden rounded-b-xl"
            style={{
              perspective: '2000px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 1. DESKTOP TWO-PAGE SPREAD CONTAINER */}
            <div className="hidden md:flex w-full h-full min-h-[520px] md:min-h-[560px] relative">
              {/* CENTER DEEP SPINE CREASE & SHADOW CANYON */}
              <div
                className="absolute left-1/2 -ml-2 top-0 bottom-0 w-4 z-40 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.65) 100%)',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.95)',
                }}
              />

              {/* 3D DRAPED SATIN RIBBON BOOKMARK */}
              <div
                className="absolute left-1/2 -ml-2.5 -top-1 w-5 h-44 z-40 pointer-events-none transition-all duration-300 rounded-b shadow-[3px_8px_16px_rgba(0,0,0,0.7)]"
                style={{
                  backgroundColor: theme.ribbonColor,
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.45) 30%, rgba(0,0,0,0.35) 100%)',
                  boxShadow: `0 4px 14px ${theme.glowColor}55`,
                }}
              >
                {/* Swallowtail V-cut tip */}
                <div
                  className="absolute -bottom-3 left-0 right-0 h-4"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    backgroundColor: theme.ribbonColor,
                  }}
                />
              </div>

              {/* STATIONARY LEFT PAGE */}
              <div
                className="w-1/2 p-5 sm:p-7 md:p-9 flex flex-col justify-between relative overflow-hidden"
                style={{
                  transformOrigin: 'right center',
                  transform: 'rotateY(5deg)',
                  background: isLight
                    ? 'linear-gradient(to right, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                    : 'linear-gradient(to right, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                  boxShadow: 'inset -30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                }}
              >
                {/* Double-Ruled Gilded Border Inset */}
                <div
                  className="absolute inset-3 sm:inset-4 pointer-events-none rounded border-2 border-amber-800/20"
                  style={{
                    outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                    outlineOffset: '-4px',
                  }}
                />

                {/* Left Dog-Ear Previous Page Corner */}
                {currentSpread > 0 && !isFlipping && (
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    title="Turn to previous folio (❮)"
                    aria-label="Turn to previous folio"
                    className="absolute bottom-2 left-2 w-8 h-8 z-30 cursor-pointer group flex items-end justify-start p-1"
                  >
                    <div
                      className="w-5 h-5 transition-transform group-hover:scale-125 rounded-tr"
                      style={{
                        background: isLight ? '#d5c3a0' : '#1e293b',
                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                        boxShadow: '2px -2px 4px rgba(0,0,0,0.4)',
                      }}
                    />
                    <ChevronLeft className="w-3 h-3 text-amber-700 absolute bottom-1 left-1 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Render stationary left content */}
                {isFlipping
                  ? (flipDirection === 'forward' ? renderLeftFolio(flipFrom) : renderLeftFolio(flipTo))
                  : renderLeftFolio(currentSpread)}
              </div>

              {/* STATIONARY RIGHT PAGE */}
              <div
                className="w-1/2 p-5 sm:p-7 md:p-9 flex flex-col justify-between relative overflow-hidden"
                style={{
                  transformOrigin: 'left center',
                  transform: 'rotateY(-5deg)',
                  background: isLight
                    ? 'linear-gradient(to left, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                    : 'linear-gradient(to left, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                  boxShadow: 'inset 30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                }}
              >
                {/* Double-Ruled Gilded Border Inset */}
                <div
                  className="absolute inset-3 sm:inset-4 pointer-events-none rounded border-2 border-amber-800/20"
                  style={{
                    outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                    outlineOffset: '-4px',
                  }}
                />

                {/* Right Dog-Ear Next Page Corner */}
                {currentSpread < 2 && !isFlipping && (
                  <button
                    type="button"
                    onClick={handleNextPage}
                    title="Turn to next folio (❯)"
                    aria-label="Turn to next folio"
                    className="absolute bottom-2 right-2 w-8 h-8 z-30 cursor-pointer group flex items-end justify-end p-1"
                  >
                    <div
                      className="w-5 h-5 transition-transform group-hover:scale-125 rounded-tl"
                      style={{
                        background: isLight ? '#d5c3a0' : '#1e293b',
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                        boxShadow: '-2px -2px 4px rgba(0,0,0,0.4)',
                      }}
                    />
                    <ChevronRight className="w-3 h-3 text-amber-700 absolute bottom-1 right-1 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Render stationary right content */}
                {isFlipping
                  ? (flipDirection === 'forward' ? renderRightFolio(flipTo) : renderRightFolio(flipFrom))
                  : renderRightFolio(currentSpread)}
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* 3D TURNING PAGE LEAF OVERLAY (PHYSICAL 3D PAGE-FLIP ACROSS SPINE) */}
              {/* ----------------------------------------------------------------- */}
              {isFlipping && flipDirection === 'forward' && (
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-1/2 z-35 animate-page-turn-forward pointer-events-none"
                  style={{
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* FRONT SIDE (Outgoing Right Folio) */}
                  <div
                    className="absolute inset-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      background: isLight
                        ? 'linear-gradient(to left, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                        : 'linear-gradient(to left, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                      boxShadow: 'inset 30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    <div
                      className="absolute inset-3 sm:inset-4 rounded border-2 border-amber-800/20"
                      style={{
                        outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                        outlineOffset: '-4px',
                      }}
                    />
                    {renderRightFolio(flipFrom)}
                    {/* Dynamic Page Curl Shadow */}
                    <div
                      className="absolute inset-0 animate-page-flip-shadow"
                      style={{
                        background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 80%)',
                      }}
                    />
                  </div>

                  {/* BACK SIDE (Incoming Left Folio) */}
                  <div
                    className="absolute inset-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      background: isLight
                        ? 'linear-gradient(to right, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                        : 'linear-gradient(to right, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                      boxShadow: 'inset -30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    <div
                      className="absolute inset-3 sm:inset-4 rounded border-2 border-amber-800/20"
                      style={{
                        outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                        outlineOffset: '-4px',
                      }}
                    />
                    {renderLeftFolio(flipTo)}
                    {/* Dynamic Page Curl Shadow */}
                    <div
                      className="absolute inset-0 animate-page-flip-shadow"
                      style={{
                        background: 'linear-gradient(to left, rgba(0,0,0,0.55) 0%, transparent 80%)',
                      }}
                    />
                  </div>
                </div>
              )}

              {isFlipping && flipDirection === 'backward' && (
                <div
                  className="absolute top-0 bottom-0 left-0 w-1/2 z-35 animate-page-turn-backward pointer-events-none"
                  style={{
                    transformOrigin: 'right center',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* FRONT SIDE (Outgoing Left Folio) */}
                  <div
                    className="absolute inset-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      background: isLight
                        ? 'linear-gradient(to right, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                        : 'linear-gradient(to right, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                      boxShadow: 'inset -30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    <div
                      className="absolute inset-3 sm:inset-4 rounded border-2 border-amber-800/20"
                      style={{
                        outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                        outlineOffset: '-4px',
                      }}
                    />
                    {renderLeftFolio(flipFrom)}
                    {/* Dynamic Page Curl Shadow */}
                    <div
                      className="absolute inset-0 animate-page-flip-shadow"
                      style={{
                        background: 'linear-gradient(to left, rgba(0,0,0,0.55) 0%, transparent 80%)',
                      }}
                    />
                  </div>

                  {/* BACK SIDE (Incoming Right Folio) */}
                  <div
                    className="absolute inset-0 p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      background: isLight
                        ? 'linear-gradient(to left, #f1e9d7 0%, #faefe0 45%, #f6ecd5 85%, #d5c3a0 97%, #6d5b3d 100%)'
                        : 'linear-gradient(to left, #0a111a 0%, #101824 45%, #0d1520 85%, #070b10 97%, #020306 100%)',
                      boxShadow: 'inset 30px 0 35px -12px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    <div
                      className="absolute inset-3 sm:inset-4 rounded border-2 border-amber-800/20"
                      style={{
                        outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                        outlineOffset: '-4px',
                      }}
                    />
                    {renderRightFolio(flipTo)}
                    {/* Dynamic Page Curl Shadow */}
                    <div
                      className="absolute inset-0 animate-page-flip-shadow"
                      style={{
                        background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 80%)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* 3D BOOK OPENING SEQUENCE: FRONT COVER SWINGS OPEN (ON MOUNT)      */}
              {/* ----------------------------------------------------------------- */}
              {isBookOpening && (
                <>
                  {/* Radiant Spine Beam Flare */}
                  <div
                    className="absolute left-1/2 -ml-8 top-0 bottom-0 w-16 z-50 pointer-events-none animate-spine-beam"
                    style={{
                      background: `radial-gradient(ellipse at center, ${theme.glowColor} 0%, transparent 75%)`,
                    }}
                  />

                  {/* Swinging Heavy Leather Front Cover */}
                  <div
                    className="absolute top-0 bottom-0 left-1/2 w-1/2 z-50 animate-grimoire-cover-open pointer-events-none rounded-r-xl"
                    style={{
                      backgroundColor: isLight ? '#2f1a0d' : theme.leatherColor,
                      border: `3px solid ${isLight ? '#4a2c17' : theme.leatherBorder}`,
                      borderLeft: 'none',
                    }}
                  >
                    {/* Embossed Leather Front Cover Artwork */}
                    <div className="absolute inset-4 rounded-lg border-2 border-dashed border-amber-600/40 flex flex-col items-center justify-center p-6 text-center select-none">
                      <div
                        className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl font-grimoire-title mb-4 shadow-2xl"
                        style={{
                          borderColor: theme.claspColor,
                          color: theme.claspColor,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          boxShadow: `0 0 20px ${theme.glowColor}`,
                        }}
                      >
                        {theme.runeGlyph}
                      </div>
                      <div className="text-sm font-grimoire-title font-bold tracking-widest uppercase text-amber-500 mb-1">
                        {project.title}
                      </div>
                      <div className="text-[10px] font-grimoire-body italic text-amber-200/60 uppercase">
                        {theme.latinTitle}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2. MOBILE SINGLE-PAGE SPREAD CONTAINER */}
            <div className="flex md:hidden flex-col w-full min-h-[520px] p-4 relative overflow-hidden select-text font-serif"
              style={{
                background: isLight
                  ? 'linear-gradient(to bottom, #f1e9d7 0%, #faefe0 45%, #ebdcb9 100%)'
                  : 'linear-gradient(to bottom, #0a111a 0%, #101824 45%, #070b10 100%)',
              }}
            >
              <div
                className="absolute inset-2 pointer-events-none rounded border-2 border-amber-800/20"
                style={{
                  outline: `1px solid ${isLight ? 'rgba(180, 140, 70, 0.4)' : 'rgba(212, 175, 55, 0.25)'}`,
                  outlineOffset: '-3px',
                }}
              />

              {/* Render Selected Mobile Folio */}
              {currentMobileFolio === 0 && renderFolio1()}
              {currentMobileFolio === 1 && renderFolio2()}
              {currentMobileFolio === 2 && renderFolio3()}
              {currentMobileFolio === 3 && renderFolio4()}
              {currentMobileFolio === 4 && renderFolio5()}
              {currentMobileFolio === 5 && renderFolio6()}
            </div>
          </div>

          {/* ================================================================= */}
          {/* E. BOTTOM 3D FOLIO NAVIGATOR BAR & SPREAD SELECTOR TABS           */}
          {/* ================================================================= */}
          <footer
            className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-b-xl border-t select-none"
            style={{
              backgroundColor: isLight ? '#dfd2ba' : '#080d16',
              borderColor: isLight ? '#c8b693' : 'rgba(255,255,255,0.12)',
            }}
          >
            {/* Previous Page Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  handleMobilePrev();
                } else {
                  handlePrevPage();
                }
              }}
              disabled={
                (window.innerWidth < 768 ? currentMobileFolio === 0 : currentSpread === 0) ||
                isFlipping ||
                isBookOpening
              }
              className="flex items-center gap-1.5 px-3 py-1 rounded border border-amber-800/30 hover:bg-amber-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-grimoire-title text-[11px]"
              style={{ color: isLight ? '#4a3520' : '#e2e8f0' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>❮ Turn Back</span>
            </button>

            {/* Desktop 3-Spread Tabs */}
            <div className="hidden md:flex items-center gap-2">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJumpToSpread(idx)}
                  className={`px-3 py-0.5 rounded text-[11px] font-grimoire-title font-bold transition-all cursor-pointer ${
                    currentSpread === idx
                      ? 'border border-amber-600 bg-amber-600 text-white shadow-sm'
                      : 'border border-amber-800/30 hover:border-amber-600/50 opacity-60'
                  }`}
                >
                  Folio {idx * 2 + 1}-{idx * 2 + 2}
                </button>
              ))}
            </div>

            {/* Mobile Folio Indicator */}
            <div className="flex md:hidden items-center text-xs font-mono font-bold tracking-widest text-amber-700">
              FOLIO {currentMobileFolio + 1} / 6
            </div>

            {/* Next Page Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  handleMobileNext();
                } else {
                  handleNextPage();
                }
              }}
              disabled={
                (window.innerWidth < 768 ? currentMobileFolio === 5 : currentSpread === 2) ||
                isFlipping ||
                isBookOpening
              }
              className="flex items-center gap-1.5 px-3 py-1 rounded border border-amber-800/30 hover:bg-amber-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-grimoire-title text-[11px]"
              style={{ color: isLight ? '#4a3520' : '#e2e8f0' }}
            >
              <span>Turn Forward ❯</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};
