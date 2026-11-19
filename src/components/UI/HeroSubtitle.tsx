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
      className="fixed bottom-[27vh] sm:bottom-[28vh] md:bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-center"
    >
      <p className="font-mono text-[10px] sm:text-[11px] md:text-xs text-zinc-400/90 tracking-[0.30em] uppercase whitespace-nowrap">
        Just a Developer
      </p>
    </div>
  );
};

