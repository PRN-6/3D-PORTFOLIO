import React, { useEffect } from 'react';

/**
 * Pre-defined deterministic atmospheric campfire ember particles.
 * Subtle, warm amber motes floating gently in the dark space around the island.
 */
const ATMOSPHERIC_EMBERS = [
  { id: 1, left: '22%', top: '36%', size: 2.0, delay: '0.2s', anim: 'animate-ember-1', color: '#f59e0b' },
  { id: 2, left: '28%', top: '56%', size: 2.5, delay: '1.4s', anim: 'animate-ember-2', color: '#f97316' },
  { id: 3, left: '34%', top: '42%', size: 1.8, delay: '2.1s', anim: 'animate-ember-3', color: '#fbbf24' },
  { id: 4, left: '42%', top: '64%', size: 3.0, delay: '0.8s', anim: 'animate-ember-1', color: '#f59e0b' },
  { id: 5, left: '47%', top: '32%', size: 1.5, delay: '3.0s', anim: 'animate-ember-2', color: '#ea580c' },
  { id: 6, left: '54%', top: '58%', size: 2.2, delay: '1.8s', anim: 'animate-ember-3', color: '#fbbf24' },
  { id: 7, left: '62%', top: '46%', size: 2.8, delay: '0.5s', anim: 'animate-ember-1', color: '#f97316' },
  { id: 8, left: '68%', top: '38%', size: 1.8, delay: '2.5s', anim: 'animate-ember-2', color: '#f59e0b' },
  { id: 9, left: '74%', top: '54%', size: 2.0, delay: '1.1s', anim: 'animate-ember-3', color: '#fbbf24' },
  { id: 10, left: '78%', top: '66%', size: 2.5, delay: '2.9s', anim: 'animate-ember-1', color: '#ea580c' },
  { id: 11, left: '25%', top: '70%', size: 1.8, delay: '0.9s', anim: 'animate-ember-2', color: '#f59e0b' },
  { id: 12, left: '38%', top: '76%', size: 2.2, delay: '2.0s', anim: 'animate-ember-3', color: '#f97316' },
  { id: 13, left: '58%', top: '72%', size: 2.0, delay: '1.5s', anim: 'animate-ember-1', color: '#fbbf24' },
  { id: 14, left: '66%', top: '80%', size: 1.6, delay: '3.2s', anim: 'animate-ember-2', color: '#f59e0b' },
  { id: 15, left: '18%', top: '48%', size: 2.2, delay: '1.7s', anim: 'animate-ember-3', color: '#f97316' },
  { id: 16, left: '82%', top: '44%', size: 2.0, delay: '0.3s', anim: 'animate-ember-1', color: '#fbbf24' },
];

/**
 * CinematicBackgroundTitle
 *
 * Implements the new monumental editorial background typography:
 *
 * Desktop Layout:
 * - Upper/Middle: "PRINSON" in massive, condensed bold uppercase spanning edge-to-edge
 * - Lower: "ROYAL" on left and "NAZARETH" on right with centered space for the 3D island
 * - Island is centered between the two typography sections, overlapping naturally
 *
 * Mobile Layout:
 * - Arranged vertically in 3 tiers:
 *   - Tier 1 (Top): "PRINSON"
 *   - Tier 2 (Middle): "ROYAL" (directly behind the island center)
 *   - Tier 3 (Bottom): "NAZARETH" (behind lower island base)
 *
 * Atmosphere:
 * - Pure deep dark black background (#000000)
 * - Subtle editorial film grain texture overlay
 * - Very subtle warm campfire amber embers / glowing particles
 * - Soft depth shadow behind the 3D island for authentic physical layering
 * - Fixed relative to the viewport: never shifts, rotates, or moves with 3D controls
 * - Independent HTML/CSS layering at z-[1] strictly behind 3D WebGL Canvas (z-10)
 */
export const CinematicBackgroundTitle: React.FC = () => {
  useEffect(() => {
    // Publish diagnostics for automated testing & verification
    if (typeof window !== 'undefined') {
      (window as any).__CINEMATIC_TITLE_STATE__ = {
        word: 'PRINSON',
        secondaryWords: ['ROYAL', 'NAZARETH'],
        fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
        isFixedToScreen: true,
        design: 'PRINSON_ROYAL_NAZARETH_EDITORIAL',
      };
      (window as any).__PRINSON_DESIGN__ = {
        desktop: {
          topWord: 'PRINSON',
          bottomLeft: 'ROYAL',
          bottomRight: 'NAZARETH',
        },
        mobile: {
          tier1: 'PRINSON',
          tier2: 'ROYAL',
          tier3: 'NAZARETH',
        },
        atmosphere: {
          grain: true,
          embers: true,
          depthShadow: true,
        },
      };
    }
  }, []);

  return (
    <div
      data-testid="cinematic-prinson-title"
      aria-label="PRINSON - ROYAL NAZARETH"
      className="fixed inset-0 w-full h-full flex flex-col pointer-events-none select-none z-[1] overflow-hidden bg-[#000000]"
    >
      {/* 1. Subtle Editorial Film Grain Texture Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full editorial-grain opacity-[0.045] pointer-events-none z-[1]"
      />

      {/* 2. Delicate Campfire Amber Embers / Glowing Particles */}
      <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-[2] overflow-hidden">
        {ATMOSPHERIC_EMBERS.map((ember) => (
          <span
            key={ember.id}
            className={`absolute rounded-full pointer-events-none ${ember.anim}`}
            style={{
              left: ember.left,
              top: ember.top,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              backgroundColor: ember.color,
              boxShadow: `0 0 6px ${ember.color}, 0 0 14px rgba(245, 158, 11, 0.45)`,
              animationDelay: ember.delay,
            }}
          />
        ))}
      </div>

      {/* 3. Soft Ambient Depth Shadow directly behind the 3D Island */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72vw] h-[72vh] max-w-[680px] max-h-[680px] rounded-full pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0) 72%)',
        }}
      />


      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (>= 768px): PRINSON (Upper) + ROYAL NAZARETH (Lower)       */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col justify-between w-full h-full pt-3 sm:pt-4 pb-8 px-2 sm:px-3 relative z-[3] overflow-hidden">
        {/* UPPER: PRINSON (Monumental, thick condensed editorial typography matching reference) */}
        <div className="w-full h-[53vh] lg:h-[55vh] flex items-start justify-center overflow-hidden">
          <svg
            data-testid="prinson-text"
            viewBox="0 0 980 240"
            className="w-full h-full select-none"
            preserveAspectRatio="none"
          >
            <text
              x="490"
              y="218"
              textAnchor="middle"
              textLength="950"
              lengthAdjust="spacing"
              fontSize="242"
              fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
              fontWeight="900"
              fill="#f4f4f4"
              style={{ filter: 'drop-shadow(0 12px 50px rgba(0,0,0,0.98))' }}
            >
              PRINSON
            </text>
          </svg>
        </div>

        {/* LOWER: ROYAL (Left) + NAZARETH (Right) framing the 3D Island base */}
        <div className="w-full h-[45vh] flex items-end justify-between overflow-hidden">
          {/* ROYAL (Left side) */}
          <div className="w-[37vw] h-full flex items-end">
            <svg
              data-testid="royal-text"
              viewBox="0 0 720 240"
              className="w-full h-full select-none"
              preserveAspectRatio="none"
            >
              <text
                x="360"
                y="220"
                textAnchor="middle"
                textLength="695"
                lengthAdjust="spacing"
                fontSize="240"
                fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
                fontWeight="900"
                fill="#f4f4f4"
                style={{ filter: 'drop-shadow(0 12px 50px rgba(0,0,0,0.98))' }}
              >
                ROYAL
              </text>
            </svg>
          </div>

          {/* NAZARETH (Right side) */}
          <div className="w-[55vw] h-full flex items-end">
            <svg
              data-testid="nazareth-text"
              viewBox="0 0 1100 240"
              className="w-full h-full select-none"
              preserveAspectRatio="none"
            >
              <text
                x="550"
                y="220"
                textAnchor="middle"
                textLength="1065"
                lengthAdjust="spacing"
                fontSize="240"
                fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
                fontWeight="900"
                fill="#f4f4f4"
                style={{ filter: 'drop-shadow(0 12px 50px rgba(0,0,0,0.98))' }}
              >
                NAZARETH
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< 768px): PRINSON (Top) + ROYAL (Middle) + NAZARETH (Bottom) */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col justify-between items-center w-full h-full pt-10 pb-12 px-1 relative z-[3] overflow-hidden">
        {/* TIER 1 (Top): PRINSON (Towering, bold, edge-to-edge) */}
        <div className="w-full h-[32vh] flex items-center justify-center overflow-hidden">
          <svg
            data-testid="prinson-mobile-text"
            viewBox="0 0 980 240"
            className="w-full h-full select-none"
            preserveAspectRatio="none"
          >
            <text
              x="490"
              y="218"
              textAnchor="middle"
              textLength="950"
              lengthAdjust="spacing"
              fontSize="242"
              fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
              fontWeight="900"
              fill="#f4f4f4"
              style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.98))' }}
            >
              PRINSON
            </text>
          </svg>
        </div>

        {/* TIER 2 (Middle): ROYAL (positioned directly behind the 3D island center) */}
        <div className="w-full h-[30vh] flex items-center justify-center overflow-hidden">
          <svg
            data-testid="royal-mobile-text"
            viewBox="0 0 720 240"
            className="w-full h-full select-none"
            preserveAspectRatio="none"
          >
            <text
              x="360"
              y="220"
              textAnchor="middle"
              textLength="695"
              lengthAdjust="spacing"
              fontSize="240"
              fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
              fontWeight="900"
              fill="#f4f4f4"
              style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.98))' }}
            >
              ROYAL
            </text>
          </svg>
        </div>

        {/* TIER 3 (Bottom): NAZARETH (behind lower island rock cliff and campfire) */}
        <div className="w-full h-[32vh] flex items-center justify-center overflow-hidden">
          <svg
            data-testid="nazareth-mobile-text"
            viewBox="0 0 1100 240"
            className="w-full h-full select-none"
            preserveAspectRatio="none"
          >
            <text
              x="550"
              y="220"
              textAnchor="middle"
              textLength="1065"
              lengthAdjust="spacing"
              fontSize="240"
              fontFamily="'Anton', 'Bebas Neue', 'Oswald', sans-serif"
              fontWeight="900"
              fill="#f4f4f4"
              style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.98))' }}
            >
              NAZARETH
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
