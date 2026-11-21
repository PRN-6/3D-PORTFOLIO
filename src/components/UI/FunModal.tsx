import React, { useEffect, useState } from 'react';
import { X, Sparkles, Orbit, Flame } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface FunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerOrbit?: () => void;
}

export const FunModal: React.FC<FunModalProps> = ({
  isOpen,
  onClose,
  onTriggerOrbit,
}) => {
  const { isLight } = useTheme();
  const [activeLore, setActiveLore] = useState<string | null>(null);
  const [sparkleActive, setSparkleActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSparkleBurst = () => {
    setSparkleActive(true);
    setTimeout(() => setSparkleActive(false), 2000);
  };

  const PARTY_LORE = [
    '✦ Frieren is reading a grimoire containing a rare spell to turn field flowers into sweet tea.',
    '✦ Fern is quietly watching the campfire, making sure Eisen did not fall asleep with his weapon.',
    '✦ The ancient stone lantern by the house has been glowing continuously for over three centuries.',
    '✦ Somewhere high above in the Whispering Forest, the Archmage leaves forgotten scrolls on pedestals.',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fun & Experiments"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 select-text overflow-hidden ${
          isLight
            ? 'bg-[#f4eee0]/95 border border-[#c8bc9f] text-[#2c2823] shadow-[0_20px_50px_rgba(180,160,130,0.4)]'
            : 'bg-black/95 border border-white/15 text-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b ${
            isLight ? 'border-[#cfc3a9]' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 animate-pulse ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <h2
              className={`font-mono text-sm uppercase tracking-wider font-semibold ${
                isLight ? 'text-[#1c1a17]' : 'text-white'
              }`}
            >
              fun.experiments
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-[#5c5446] hover:text-[#1c1a17] hover:bg-black/5'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p
          className={`mt-3 text-xs font-mono leading-relaxed ${
            isLight ? 'text-[#5c5446]' : 'text-slate-400'
          }`}
        >
          Interactive developer playground and hidden secrets of the floating RPG realm.
        </p>

        {/* Interactive Actions */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (onTriggerOrbit) onTriggerOrbit();
              onClose();
            }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer group active:scale-[0.98] ${
              isLight
                ? 'bg-[#eae1cf] hover:bg-[#e2d7c2] border-[#cfc3a9]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
            }`}
          >
            <Orbit className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <div>
              <div className={`text-xs font-mono font-medium ${isLight ? 'text-[#1c1a17]' : 'text-white'}`}>
                Reset &amp; Orbit Camera
              </div>
              <div className={`text-[11px] ${isLight ? 'text-[#5c5446]' : 'text-slate-400'}`}>
                Glide to the default cinematic angle
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSparkleBurst}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer group active:scale-[0.98] ${
              isLight
                ? 'bg-[#eae1cf] hover:bg-[#e2d7c2] border-[#cfc3a9]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
            }`}
          >
            <Sparkles className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
            <div>
              <div className={`text-xs font-mono font-medium ${isLight ? 'text-[#1c1a17]' : 'text-white'}`}>
                {sparkleActive ? '✦ Sparkles active!' : 'Starlight Sparkle'}
              </div>
              <div className={`text-[11px] ${isLight ? 'text-[#5c5446]' : 'text-slate-400'}`}>
                Trigger celestial star sparkles
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const rand = PARTY_LORE[Math.floor(Math.random() * PARTY_LORE.length)];
              setActiveLore(rand);
            }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer group active:scale-[0.98] ${
              isLight
                ? 'bg-[#eae1cf] hover:bg-[#e2d7c2] border-[#cfc3a9]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
            }`}
          >
            <Flame className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <div>
              <div className={`text-xs font-mono font-medium ${isLight ? 'text-[#1c1a17]' : 'text-white'}`}>
                Reveal Campfire Secret
              </div>
              <div className={`text-[11px] ${isLight ? 'text-[#5c5446]' : 'text-slate-400'}`}>
                Read a lore snippet from the hero party
              </div>
            </div>
          </button>
        </div>

        {/* Lore Snippet Box */}
        {activeLore && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-mono animate-in fade-in duration-200 ${
              isLight
                ? 'bg-[#e2d7c2] border-emerald-600/40 text-emerald-900'
                : 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {activeLore}
          </div>
        )}

        {/* Footer */}
        <div
          className={`mt-6 pt-3 border-t flex justify-end ${
            isLight ? 'border-[#cfc3a9]' : 'border-white/10'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              isLight
                ? 'bg-[#1c1a17] text-[#f4eee0] hover:bg-[#332e26]'
                : 'bg-white text-black hover:bg-slate-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
