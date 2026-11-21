import React, { useEffect } from 'react';
import { X, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { GRIMOIRES_DATA, type GrimoireItem } from '../../data/archiveData';
import { useTheme } from '../../context/ThemeContext';

export interface GrimoireDetailModalProps {
  grimoire: GrimoireItem | null;
  onClose: () => void;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
}

export const GrimoireDetailModal: React.FC<GrimoireDetailModalProps> = ({
  grimoire,
  onClose,
  onSelectGrimoire,
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
      className="fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 md:p-8 pointer-events-none select-none"
      role="dialog"
      aria-modal="true"
      aria-label={grimoire.title}
    >
      {/* Invisible backdrop to allow click-outside dismissal */}
      <div
        className="fixed inset-0 pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* TOP FLOATING BAR: Return to Island Button & Active Realm Header */}
      <header className="relative z-50 flex items-center justify-between w-full pointer-events-auto">
        <button
          onClick={onClose}
          type="button"
          aria-label="Return to Archive Island"
          className={`group flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl border transition-all duration-300 shadow-xl cursor-pointer ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f] text-[#2c2823] hover:bg-[#e8dec7]'
              : 'bg-[#080a14]/90 border-white/15 text-slate-200 hover:border-white/40 hover:bg-[#12162a]'
          }`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-mono font-medium tracking-wide">
            Return to Island
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 opacity-70 ml-1">
            ESC
          </span>
        </button>

        {/* Center Title Pill */}
        <div
          className={`hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl backdrop-blur-xl border shadow-xl ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f] text-[#2c2823]'
              : 'bg-[#080a14]/90 border-white/15 text-slate-200'
          }`}
        >
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
            style={{ color: grimoire.accentColor }}
          >
            {grimoire.runeSymbol}
          </span>
          <span className="text-xs font-mono uppercase tracking-widest">
            Floating Codices Realm
          </span>
        </div>

        {/* Quick Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className={`p-2 rounded-xl backdrop-blur-xl border transition-colors cursor-pointer ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f] text-[#5c5446] hover:text-[#1c1a17]'
              : 'bg-[#080a14]/90 border-white/15 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* BOTTOM AREA: 6-Book Selector Switcher & Focused Book Information Drawer */}
      <footer className="relative z-50 flex flex-col md:flex-row items-end justify-between gap-4 w-full pointer-events-auto">
        {/* Left: 6 Floating Codices Selector Pills */}
        <nav
          aria-label="Grimoire Switcher"
          className={`flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-xl max-w-full overflow-x-auto ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f]'
              : 'bg-[#080a14]/90 border-white/15'
          }`}
        >
          {GRIMOIRES_DATA.map((item) => {
            const isCurrent = item.id === grimoire.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectGrimoire?.(item)}
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'shadow-md font-semibold'
                    : 'opacity-65 hover:opacity-100 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isCurrent ? `${item.accentColor}25` : 'transparent',
                  color: isCurrent ? item.accentColor : isLight ? '#5c5446' : '#cbd5e1',
                  border: isCurrent ? `1px solid ${item.accentColor}66` : '1px solid transparent',
                }}
              >
                <span>{item.runeSymbol}</span>
                <span className="hidden lg:inline">{item.category}</span>
                <span className="lg:hidden">{item.category.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Focused Grimoire Details Card */}
        <aside className="w-full md:max-w-[460px] max-h-[46vh] sm:max-h-[50vh] flex flex-col pointer-events-auto select-text animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`relative flex flex-col h-full overflow-hidden rounded-2xl backdrop-blur-xl ${
              isLight
                ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_20px_50px_rgba(180,160,130,0.35)]'
                : 'bg-[#080a14]/92 border border-white/10 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
            }`}
          >
            {/* Top Accent Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                backgroundColor: grimoire.accentColor,
                boxShadow: `0 0 14px ${grimoire.accentColor}`,
              }}
            />

            {/* Header */}
            <div
              className={`p-4 pb-2 border-b flex items-center justify-between ${
                isLight ? 'border-[#c8bc9f]' : 'border-white/5'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase block ${
                    isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                  }`}
                >
                  {grimoire.category}
                </span>
                <h2 className="text-base sm:text-lg font-serif font-bold tracking-tight">
                  {grimoire.title}
                </h2>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
              {/* Tagline */}
              <p className={isLight ? 'text-[#5c5446]' : 'text-slate-300'}>
                {grimoire.tagline}
              </p>

              {/* Lore quote */}
              <div
                className={`p-2.5 rounded-xl border italic flex items-start gap-2 ${
                  isLight
                    ? 'bg-black/5 border-[#c8bc9f] text-[#5c5446]'
                    : 'bg-white/5 border-white/5 text-slate-400'
                }`}
              >
                <Sparkles
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: grimoire.accentColor }}
                />
                <p className="text-[11px] leading-relaxed">{grimoire.lore}</p>
              </div>

              {/* Inscribed Spells */}
              <div>
                <h3
                  className={`text-[10px] font-mono tracking-widest uppercase mb-2 flex items-center gap-1.5 ${
                    isLight ? 'text-[#7a6f5d]' : 'text-slate-400'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  Inscribed Spells & Proficiencies
                </h3>
                <div className="space-y-2">
                  {grimoire.spells.map((spell) => (
                    <div
                      key={spell.id}
                      className={`p-2.5 rounded-xl border ${
                        isLight
                          ? 'bg-black/[0.02] border-[#c8bc9f]/60'
                          : 'bg-white/[0.03] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs">{spell.name}</span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase"
                          style={{
                            color: grimoire.accentColor,
                            backgroundColor: `${grimoire.accentColor}18`,
                          }}
                        >
                          {spell.tier}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed mb-1.5 ${
                          isLight ? 'text-[#6b6251]' : 'text-slate-400'
                        }`}
                      >
                        {spell.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {spell.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isLight
                                ? 'bg-black/5 text-[#5c5446]'
                                : 'bg-white/5 text-slate-300'
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
          </div>
        </aside>
      </footer>
    </div>
  );
};
