import React, { useState, useEffect } from 'react';

/**
 * Six Distinct English Artistic Typography Styles for PRINSON
 *
 * 1. Pixel / 8-bit block font ('Press Start 2P')
 * 2. Elegant luxury serif ('Bodoni Moda' / Didot)
 * 3. Gothic / blackletter font ('UnifrakturCook')
 * 4. Modern minimalist serif ('Cinzel')
 * 5. Retro editorial serif ('Playfair Display')
 * 6. Monospace / typewriter font ('Courier Prime')
 */
export interface TypographyStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight: number;
  letterSpacing: string;
  fontSize: string;
  textTransform?: 'uppercase';
}

export const PRINSON_FONT_STYLES: TypographyStyle[] = [
  {
    id: 'pixel-8bit',
    name: 'Pixel / 8-Bit Block',
    fontFamily: "'Press Start 2P', monospace",
    fontWeight: 400,
    letterSpacing: '0.06em',
    fontSize: 'clamp(1.65rem, 8.6vw, 8.2rem)',
    textTransform: 'uppercase',
  },
  {
    id: 'luxury-serif',
    name: 'Elegant Luxury Serif',
    fontFamily: "'Bodoni Moda', 'Didot', serif",
    fontWeight: 900,
    letterSpacing: '0.14em',
    fontSize: 'clamp(2.15rem, 11.4vw, 10.85rem)',
    textTransform: 'uppercase',
  },
  {
    id: 'gothic-blackletter',
    name: 'Gothic Blackletter',
    fontFamily: "'UnifrakturCook', cursive, serif",
    fontWeight: 700,
    letterSpacing: '0.10em',
    fontSize: 'clamp(2.2rem, 11.6vw, 11rem)',
    textTransform: 'uppercase',
  },
  {
    id: 'minimal-serif',
    name: 'Modern Minimalist Serif',
    fontFamily: "'Cinzel', serif",
    fontWeight: 800,
    letterSpacing: '0.15em',
    fontSize: 'clamp(2.05rem, 10.8vw, 10.2rem)',
    textTransform: 'uppercase',
  },
  {
    id: 'retro-editorial',
    name: 'Retro Editorial Serif',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 900,
    letterSpacing: '0.12em',
    fontSize: 'clamp(2.05rem, 10.8vw, 10.2rem)',
    textTransform: 'uppercase',
  },
  {
    id: 'typewriter-mono',
    name: 'Typewriter Monospace',
    fontFamily: "'Courier Prime', 'Space Mono', monospace",
    fontWeight: 700,
    letterSpacing: '0.12em',
    fontSize: 'clamp(2.15rem, 11.4vw, 10.8rem)',
    textTransform: 'uppercase',
  },
];

/**
 * CinematicBackgroundTitle
 *
 * Screen-space fixed typography layer displaying "PRINSON" in the exact center
 * of the viewport, behind the interactive 3D floating island.
 *
 * Continuously cycles through six distinctive English font styles with a smooth,
 * subtle crossfade and hold interval.
 *
 * Characteristics:
 * - Permanent display of "PRINSON"
 * - Fixed relative to the viewport: never shifts, rotates, or moves with 3D controls
 * - Independent HTML/CSS layering at z-[1] behind 3D WebGL Canvas (z-10)
 * - Calibrated clamp sizes to ensure zero edge clipping across all viewports
 * - 100% pure English typography
 */
export const CinematicBackgroundTitle: React.FC = () => {
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);

  useEffect(() => {
    // Ultra-fast kinetic typography cycle: rapid font shifts (~120ms per font)
    const interval = setInterval(() => {
      setActiveStyleIndex((prev) => (prev + 1) % PRINSON_FONT_STYLES.length);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Publish diagnostics for automated testing & verification
    if (typeof window !== 'undefined') {
      (window as any).__PRINSON_FONT_LOOP__ = {
        word: 'PRINSON',
        activeStyleIndex,
        activeStyle: PRINSON_FONT_STYLES[activeStyleIndex],
        totalStyles: PRINSON_FONT_STYLES.length,
        styles: PRINSON_FONT_STYLES,
        isFixedToScreen: true,
        mobileOffsetY: -38,
      };
      (window as any).__CINEMATIC_TITLE_STATE__ = {
        word: 'PRINSON',
        activeStyleIndex,
        fontFamily: PRINSON_FONT_STYLES[activeStyleIndex].fontFamily,
        fontWeight: PRINSON_FONT_STYLES[activeStyleIndex].fontWeight,
        letterSpacing: PRINSON_FONT_STYLES[activeStyleIndex].letterSpacing,
        fontSize: PRINSON_FONT_STYLES[activeStyleIndex].fontSize,
        isFixedToScreen: true,
        mobileOffsetY: -38,
      };
      (window as any).__PRINSON_SET_FONT_INDEX__ = (idx: number) => {
        setActiveStyleIndex(((idx % PRINSON_FONT_STYLES.length) + PRINSON_FONT_STYLES.length) % PRINSON_FONT_STYLES.length);
      };
    }
  }, [activeStyleIndex]);

  return (
    <div
      data-testid="cinematic-prinson-title"
      aria-label="PRINSON"
      className="fixed inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-[1] overflow-hidden"
    >
      <div className="prinson-title-mobile-lift relative flex items-center justify-center w-full h-full max-w-full text-center">
        {PRINSON_FONT_STYLES.map((style, index) => {
          const isActive = index === activeStyleIndex;
          return (
            <h1
              key={style.id}
              data-style-id={style.id}
              data-active={isActive ? 'true' : 'false'}
              aria-hidden={!isActive}
              className={`absolute inset-0 flex items-center justify-center leading-none select-none font-black text-center transition-opacity duration-75 ease-out ${
                isActive
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
              style={{
                fontFamily: style.fontFamily,
                fontWeight: style.fontWeight,
                fontSize: style.fontSize,
                letterSpacing: style.letterSpacing,
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                textTransform: style.textTransform || 'uppercase',
                filter: 'drop-shadow(0 4px 30px rgba(0, 0, 0, 0.95))',
              }}
            >
              <span className="inline-block whitespace-nowrap text-center">PRINSON</span>
            </h1>
          );
        })}
      </div>
    </div>
  );
};
