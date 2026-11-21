import React, { useEffect } from 'react';
import { X, Sparkles, BookOpen } from 'lucide-react';
import type { GrimoireItem } from '../../data/archiveData';
import { useTheme } from '../../context/ThemeContext';

export interface GrimoireDetailModalProps {
  grimoire: GrimoireItem | null;
  onClose: () => void;
}

export const GrimoireDetailModal: React.FC<GrimoireDetailModalProps> = ({
  grimoire,
  onClose,
}) => {
  const { isLight } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!grimoire) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-end p-4 sm:p-6 md:p-8 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label={grimoire.title}
    >
      {/* Invisible backdrop to allow click-outside dismissal without obscuring 3D floating books */}
      <div
        className="fixed inset-0 pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Grimoire Details Drawer */}
      <aside className="relative z-50 w-full max-w-[92vw] sm:max-w-[500px] h-full max-h-[90vh] flex flex-col pointer-events-auto select-text animate-in fade-in slide-in-from-right-6 duration-300">
        <div
          className={`relative flex flex-col h-full overflow-hidden rounded-2xl backdrop-blur-xl ${
            isLight
              ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_20px_50px_rgba(180,160,130,0.35)]'
              : 'bg-[#080a14]/90 border border-white/10 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
          }`}
        >
          {/* Top Magical Glowing Edge */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              backgroundColor: grimoire.accentColor,
              boxShadow: `0 0 16px ${grimoire.accentColor}`,
            }}
          />

          {/* Header */}
          <div
            className={`flex items-center justify-between p-5 pb-3 border-b ${
              isLight ? 'border-[#c8bc9f]' : 'border-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shadow-md"
                style={{
                  backgroundColor: `${grimoire.accentColor}22`,
                  color: grimoire.accentColor,
                  border: `1px solid ${grimoire.accentColor}55`,
                }}
              >
                {grimoire.runeSymbol}
              </span>
              <div>
                <span
                  className={`text-[11px] font-mono tracking-widest uppercase block ${
                    isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                  }`}
                >
                  {grimoire.category}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    isLight ? 'text-[#9a8e7b]' : 'text-slate-500'
                  }`}
                >
                  ARCHIVE CODEX • 02
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close grimoire modal"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {/* Title & Tagline */}
            <div>
              <h2
                className={`font-fantasy text-xl sm:text-2xl font-bold tracking-wider ${
                  isLight ? 'text-[#1c1a17]' : 'text-white'
                }`}
              >
                {grimoire.title}
              </h2>
              <p
                className={`text-xs sm:text-sm mt-1 font-medium leading-relaxed ${
                  isLight ? 'text-[#5c5446]' : 'text-slate-300'
                }`}
              >
                {grimoire.tagline}
              </p>
            </div>

            {/* Ancient Lore Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs italic leading-relaxed flex items-start gap-2.5 ${
                isLight
                  ? 'bg-[#eae1cf] border-[#cfc3a9] text-[#4d4436]'
                  : 'bg-white/[0.03] border-white/5 text-slate-400'
              }`}
            >
              <Sparkles
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: grimoire.accentColor }}
              />
              <p>{grimoire.lore}</p>
            </div>

            {/* Spells / Skills Section */}
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                  isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Inscribed Spells &amp; Proficiencies</span>
              </div>

              <div className="space-y-3">
                {grimoire.spells.map((spell) => (
                  <div
                    key={spell.id}
                    className={`p-3.5 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? 'bg-[#eae1cf] hover:bg-[#e2d7c2] border-[#cfc3a9]'
                        : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4
                        className={`text-sm font-semibold tracking-wide ${
                          isLight ? 'text-[#1c1a17]' : 'text-white'
                        }`}
                      >
                        {spell.name}
                      </h4>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: `${grimoire.accentColor}18`,
                          color: grimoire.accentColor,
                          border: `1px solid ${grimoire.accentColor}33`,
                        }}
                      >
                        {spell.tier}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed mb-2.5 ${
                        isLight ? 'text-[#4d4436]' : 'text-slate-400'
                      }`}
                    >
                      {spell.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {spell.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isLight
                              ? 'bg-[#d8cbb2] text-[#3d372e] border-[#c8bc9f]'
                              : 'bg-white/5 text-slate-300 border-white/5'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div
            className={`p-4 border-t flex items-center justify-between text-[11px] font-mono ${
              isLight
                ? 'border-[#c8bc9f] bg-[#eae1cf] text-[#7a6f5d]'
                : 'border-white/5 bg-black/20 text-slate-500'
            }`}
          >
            <span>ISLAND 02 • GRAND MAGE ARCHIVE</span>
            <span className={isLight ? 'text-[#5c5446]' : 'text-slate-400'}>
              CLICK OUTSIDE TO DISMISS
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};
