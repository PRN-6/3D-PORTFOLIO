import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * HeroSubtitle
 *
 * Small, elegant monospace subtitle positioned beneath the central hero composition:
 * - Dark Mode: Subtle blue-grey tracking text
 * - Light Mode: Sleek dark rounded capsule with cream text matching the reference
 */
export const HeroSubtitle: React.FC = () => {
  const { isLight } = useTheme();

  return (
    <div
      data-testid="hero-subtitle"
      aria-label="Just a Developer"
      className="fixed bottom-[27vh] sm:bottom-[28vh] md:bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-center"
    >
      {isLight ? (
        <div className="inline-block bg-[#1c1a17] text-[#f4eee0] border border-[#38332c] px-4 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="font-mono text-[9.5px] sm:text-[10.5px] tracking-[0.28em] uppercase whitespace-nowrap font-medium">
            Just a Developer
          </p>
        </div>
      ) : (
        <p className="font-mono text-[10px] sm:text-[11px] md:text-xs text-zinc-400/90 tracking-[0.30em] uppercase whitespace-nowrap">
          Just a Developer
        </p>
      )}
    </div>
  );
};

