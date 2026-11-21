import React, { useEffect, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { type GrimoireItem } from '../../data/archiveData';
import { useTheme } from '../../context/ThemeContext';

export interface GrimoireDetailModalProps {
  grimoire: GrimoireItem | null;
  onClose: () => void;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
}

export const GrimoireDetailModal: React.FC<GrimoireDetailModalProps> = ({
  grimoire,
  onClose,
}) => {
  const { isLight } = useTheme();
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Delay UI entrance so only the floating book is shown while moving down
  useEffect(() => {
    if (grimoire) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      setIsRevealed(false);
    }
  }, [grimoire]);

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
      <header
        className={`relative z-50 flex items-center justify-between w-full pointer-events-auto transition-all duration-500 ease-out ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Return to Archive Island"
          className={`group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl backdrop-blur-xl border transition-all duration-300 shadow-xl cursor-pointer ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f] text-[#2c2823] hover:bg-[#e8dec7]'
              : 'bg-[#080a14]/90 border-white/15 text-slate-200 hover:border-white/40 hover:bg-[#12162a]'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-mono font-medium tracking-wide">
            Return to Island
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 opacity-70 ml-1">
            ESC
          </span>
        </button>


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
    </div>
  );
};
