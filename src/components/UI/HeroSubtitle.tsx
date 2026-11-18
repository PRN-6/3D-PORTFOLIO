import React from 'react';

/**
 * HeroSubtitle
 *
 * Small, elegant monospace subtitle in subtle blue-grey positioned
 * beneath the central hero composition (beneath PRINSON and the 3D island).
 */
export const HeroSubtitle: React.FC = () => {
  return (
    <div
      data-testid="hero-subtitle"
      aria-label="Just a Developer"
      className="fixed bottom-18 sm:bottom-22 md:bottom-26 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-center"
    >
      <p className="font-mono text-[11px] sm:text-xs md:text-[13px] text-slate-400/90 tracking-[0.24em] uppercase whitespace-nowrap">
        Just a Developer
      </p>
    </div>
  );
};

