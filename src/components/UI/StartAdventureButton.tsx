import React, { useState } from 'react';
import { Sparkles, Compass } from 'lucide-react';

export interface StartAdventureButtonProps {
  isNight: boolean;
  nightProgress: number;
  onStartAdventure?: () => void;
}

export const StartAdventureButton: React.FC<StartAdventureButtonProps> = ({
  isNight,
  nightProgress,
  onStartAdventure,
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setClicked(true);
    setTimeout(() => setClicked(false), 800);

    // Call the clean entry-point handler
    if (onStartAdventure) {
      onStartAdventure();
    } else {
      console.log("[Hero's Home] Start Adventure invoked. Ready for future adventure module integration.");
    }
  };

  return (
    <div
      className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ '--night-progress': nightProgress } as React.CSSProperties}
    >
      <button
        onClick={handleClick}
        type="button"
        aria-label="Start Adventure"
        className={`group relative flex items-center justify-center gap-3 rounded-full px-8 py-3.5 sm:px-11 sm:py-4 transition-all duration-700 ease-out cursor-pointer select-none active:scale-95 ${
          isNight
            ? 'bg-gradient-to-r from-[#121528] via-[#1d1e3d] to-[#14152e] text-[#fef3c7] border border-[#d4af37]/50 shadow-[0_8px_30px_-4px_rgba(124,58,237,0.4),0_0_24px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_36px_-4px_rgba(139,92,246,0.6),0_0_36px_rgba(192,132,252,0.45)] hover:border-[#facc15]/80 hover:scale-105'
            : 'bg-gradient-to-r from-[#fffbf0] via-[#fbf2d8] to-[#f6e6bd] text-[#2c2214] border border-[#d4af37]/60 shadow-[0_8px_28px_-4px_rgba(217,162,43,0.38),0_0_22px_rgba(254,243,199,0.55)] hover:shadow-[0_12px_36px_-4px_rgba(217,162,43,0.55),0_0_34px_rgba(254,243,199,0.85)] hover:border-[#b45309]/50 hover:scale-105'
        }`}
      >
        {/* Subtle Ambient Rune Shimmer Ring */}
        <span
          className={`absolute -inset-0.5 rounded-full blur-sm opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none ${
            isNight
              ? 'bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400'
              : 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200'
          }`}
        />

        {/* Content Container */}
        <span className="relative z-10 flex items-center gap-2.5 sm:gap-3">
          <span className="transition-transform duration-500 group-hover:rotate-45">
            {isNight ? (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
            ) : (
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 group-hover:rotate-180 transition-transform duration-700" />
            )}
          </span>

          <span className="font-fantasy text-sm sm:text-base font-bold tracking-[0.22em] uppercase whitespace-nowrap">
            Start Adventure
          </span>

          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              isNight ? 'bg-amber-300 shadow-[0_0_8px_#fde047]' : 'bg-amber-600 shadow-[0_0_8px_#d97706]'
            }`}
          />
        </span>

        {/* Click ripple feedback */}
        {clicked && (
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  );
};
