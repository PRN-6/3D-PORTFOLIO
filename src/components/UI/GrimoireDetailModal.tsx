import React, { useEffect } from 'react';
import { X, Sparkles, BookOpen } from 'lucide-react';
import type { GrimoireItem } from '../../data/archiveData';

export interface GrimoireDetailModalProps {
  grimoire: GrimoireItem | null;
  onClose: () => void;
}

export const GrimoireDetailModal: React.FC<GrimoireDetailModalProps> = ({
  grimoire,
  onClose,
}) => {
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
      {/* Dim backdrop to allow click-outside dismissal */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Grimoire Details Drawer */}
      <aside className="relative z-50 w-full max-w-[92vw] sm:max-w-[500px] h-full max-h-[90vh] flex flex-col pointer-events-auto select-text animate-in fade-in slide-in-from-right-6 duration-300">
        <div className="relative flex flex-col h-full overflow-hidden rounded-2xl bg-[#080a14]/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          {/* Top Magical Glowing Edge */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              backgroundColor: grimoire.accentColor,
              boxShadow: `0 0 16px ${grimoire.accentColor}`,
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5">
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
                <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 block">
                  {grimoire.category}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ARCHIVE CODEX • 02
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close grimoire modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {/* Title & Tagline */}
            <div>
              <h2 className="font-fantasy text-xl sm:text-2xl font-bold text-white tracking-wider">
                {grimoire.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                {grimoire.tagline}
              </p>
            </div>

            {/* Ancient Lore Banner */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 italic leading-relaxed flex items-start gap-2.5">
              <Sparkles
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: grimoire.accentColor }}
              />
              <p>{grimoire.lore}</p>
            </div>

            {/* Spells / Skills Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Inscribed Spells & Proficiencies</span>
              </div>

              <div className="space-y-3">
                {grimoire.spells.map((spell) => (
                  <div
                    key={spell.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold text-white tracking-wide">
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

                    <p className="text-xs text-slate-400 leading-relaxed mb-2.5">
                      {spell.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {spell.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5"
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
          <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>ISLAND 02 • GRAND MAGE ARCHIVE</span>
            <span className="text-slate-400">CLICK OUTSIDE TO DISMISS</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

