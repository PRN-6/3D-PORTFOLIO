import React, { useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

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
 * Japanese Vintage Poster Decorative Accents (Light Mode)
 * - Concentric red orbital arcs looping behind the 3D model
 * - Traditional Japanese Hanko seals (red stamps)
 * - Fine vertical calligraphy / editorial glyphs
 */
const JapanesePosterDecorations: React.FC = () => {
  return (
    <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-[4] overflow-hidden">
      {/* 1. Red Concentric Orbital Circles & Curving Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Center Concentric Circles behind the 3D Island */}
        <circle
          cx="960"
          cy="530"
          r="320"
          fill="none"
          stroke="#b91c1c"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />
        <circle
          cx="950"
          cy="540"
          r="275"
          fill="none"
          stroke="#c53030"
          strokeWidth="1.0"
          strokeOpacity="0.40"
        />
        <circle
          cx="965"
          cy="525"
          r="355"
          fill="none"
          stroke="#991b1b"
          strokeWidth="0.75"
          strokeDasharray="6 4"
          strokeOpacity="0.30"
        />

        {/* Dynamic Sweeping Orbital Arc Lines */}
        <path
          d="M 240,410 C 390,210 780,250 990,390 C 1200,530 1480,740 1700,630"
          fill="none"
          stroke="#b91c1c"
          strokeWidth="1.4"
          strokeOpacity="0.48"
        />
        <path
          d="M 210,460 C 360,260 740,300 960,450 C 1170,610 1440,790 1660,690"
          fill="none"
          stroke="#c53030"
          strokeWidth="0.85"
          strokeOpacity="0.32"
        />
      </svg>

      {/* 2. Top-Left Japanese Hanko Seal Stamp (印) */}
      <div className="hidden md:flex flex-col items-center absolute top-20 sm:top-24 left-[14.2%] lg:left-[14.8%] pointer-events-none select-none opacity-90">
        <div className="w-6 h-6 border-[1.5px] border-[#b91c1c] bg-[#b91c1c]/15 p-0.5 flex items-center justify-center rounded-[2px] shadow-sm">
          <div className="w-full h-full border border-[#b91c1c] flex items-center justify-center text-[10px] font-serif font-bold text-[#b91c1c] leading-none">
            印
          </div>
        </div>
      </div>

      {/* 3. Mid-Left Japanese Vertical Calligraphy (若嵐香) & Hanko Stamp (吉) */}
      <div className="hidden md:flex flex-col items-center absolute top-[44%] left-[13.2%] lg:left-[13.8%] pointer-events-none select-none opacity-85">
        <span className="font-serif text-[#a3927d] text-[12px] sm:text-[13px] tracking-[0.42em] [writing-mode:vertical-rl] leading-tight select-none font-medium mb-1.5">
          若嵐香
        </span>
        <div className="w-5 h-5 bg-[#b91c1c] text-white flex items-center justify-center rounded-[1px] text-[9px] font-serif font-bold shadow-sm">
          吉
        </div>
      </div>

      {/* 4. Top-Right Vertical Japanese Editorial Text (日本を揃エ) */}
      <div className="hidden md:flex flex-col items-center absolute top-20 sm:top-24 right-[16.2%] lg:right-[17%] pointer-events-none select-none opacity-85">
        <span className="font-serif text-[#a3927d] text-xs sm:text-[13px] tracking-[0.45em] [writing-mode:vertical-rl] leading-tight select-none font-medium">
          日本を揃エ
        </span>
      </div>
    </div>
  );
};

/**
 * CinematicBackgroundTitle
 *
 * Implements the monumental editorial background typography:
 *
 * - Dark Mode: Pure deep dark black background (#000000), crisp white typography, amber embers.
 * - Light Mode: Warm cream vintage parchment background (#f4eee0), Japanese vintage poster aesthetic,
 *   deep charcoal typography, red concentric orbital lines, and Hanko stamps.
 */
export interface CinematicBackgroundTitleProps {
  hidden?: boolean;
}

export const CinematicBackgroundTitle: React.FC<CinematicBackgroundTitleProps> = ({
  hidden = false,
}) => {
  const { isLight, theme } = useTheme();

  useEffect(() => {
    // Publish diagnostics for automated testing & verification
    if (typeof window !== 'undefined') {
      (window as any).__CINEMATIC_TITLE_STATE__ = {
        word: 'PRINSON',
        secondaryWords: ['ROYAL', 'NAZARETH'],
        fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
        isFixedToScreen: true,
        design: 'PRINSON_ROYAL_NAZARETH_EDITORIAL',
        theme,
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
        theme,
      };
    }
  }, [theme]);

  // Color assignments based on theme
  const textColorPrimary = isLight ? '#1c1a17' : '#ffffff';
  const textColorSecondary = isLight ? '#24211d' : '#ececec';
  const textShadowPrimary = isLight
    ? 'drop-shadow(0 6px 25px rgba(180, 160, 130, 0.45))'
    : 'drop-shadow(0 14px 55px rgba(0,0,0,0.98))';
  const textShadowSecondary = isLight
    ? 'drop-shadow(0 6px 20px rgba(180, 160, 130, 0.40))'
    : 'drop-shadow(0 10px 40px rgba(0,0,0,0.98))';

  return (
    <div
      data-testid="cinematic-prinson-title"
      data-theme={theme}
      aria-label="PRINSON - ROYAL NAZARETH"
      className={`fixed inset-0 w-full h-full flex flex-col pointer-events-none select-none z-[1] overflow-hidden transition-colors duration-500 ${
        isLight ? 'vintage-paper-bg' : 'bg-[#000000]'
      }`}
    >
      {/* 1. Subtle Editorial Film Grain Texture Overlay */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full pointer-events-none z-[1] ${
          isLight ? 'editorial-grain opacity-[0.06] mix-blend-multiply' : 'editorial-grain opacity-[0.045]'
        }`}
      />

      {/* TYPOGRAPHY & DECORATIVE POSTER ELEMENTS */}
      <div className={`w-full h-full flex flex-col transition-opacity duration-700 ease-out ${hidden ? 'opacity-0' : 'opacity-100'}`}>
        {/* 2. Light Mode: Japanese Vintage Poster Red Circles & Stamps */}
        {isLight && <JapanesePosterDecorations />}

        {/* 3. Dark Mode: Delicate Campfire Amber Embers / Glowing Particles */}
        {!isLight && (
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
        )}

        {/* 4. Soft Ambient Depth Shadow directly behind the 3D Island */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72vw] h-[72vh] max-w-[680px] max-h-[680px] rounded-full pointer-events-none z-[2] transition-opacity duration-500"
          style={{
            background: isLight
              ? 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(160, 135, 100, 0.38) 0%, rgba(190, 170, 140, 0.18) 50%, rgba(244, 238, 224, 0) 75%)'
              : 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0) 72%)',
          }}
        />

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (>= 768px): KINETIC TRAVELING LOOP MARQUEE TYPOGRAPHY       */}
      {/* Upper Line: PRINSON ROYAL NAZARETH traveling RIGHT (->)                   */}
      {/* Lower Line: PRINSON ROYAL NAZARETH traveling LEFT (<-)                    */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col justify-between w-full h-full pt-[70px] pb-16 lg:pb-20 relative z-[3] overflow-hidden select-none pointer-events-none">
        {/* UPPER LINE: Full Name traveling RIGHT in continuous loop */}
        <div
          data-testid="prinson-text"
          className="relative w-full h-[54vh] flex items-start overflow-hidden pointer-events-none select-none"
        >
          <div className="flex w-max will-change-transform">
            <div className="animate-marquee-right flex shrink-0 items-center">
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
            <div className="animate-marquee-right flex shrink-0 items-center" aria-hidden="true">
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
          </div>
        </div>

        {/* LOWER LINE: Full Name traveling LEFT in continuous loop (Positioned higher to avoid covering footer) */}
        <div
          data-testid="royal-text"
          className="relative w-full h-[46vh] lg:h-[48vh] flex items-end pb-8 lg:pb-12 overflow-hidden pointer-events-none select-none -translate-y-3 lg:-translate-y-6"
        >
          <div data-testid="nazareth-text" className="flex w-max will-change-transform">
            <div className="animate-marquee-left flex shrink-0 items-center">
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
            <div className="animate-marquee-left flex shrink-0 items-center" aria-hidden="true">
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-16 lg:mr-24 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(140px, 48vh, 520px)',
                  lineHeight: '0.82',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< 768px): KINETIC TRAVELING LOOP MARQUEE TYPOGRAPHY          */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col justify-between items-center w-full h-full pt-[54px] pb-16 relative z-[3] overflow-hidden select-none pointer-events-none">
        {/* UPPER MOBILE TIER: Traveling RIGHT */}
        <div
          data-testid="prinson-mobile-text"
          className="relative w-full h-[36vh] flex items-center overflow-hidden pointer-events-none select-none"
        >
          <div className="flex w-max will-change-transform">
            <div className="animate-marquee-right flex shrink-0 items-center">
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
            <div className="animate-marquee-right flex shrink-0 items-center" aria-hidden="true">
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorPrimary,
                  filter: textShadowPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
          </div>
        </div>

        {/* LOWER MOBILE TIER: Traveling LEFT (Positioned higher to avoid covering footer) */}
        <div
          data-testid="royal-mobile-text"
          className="relative w-full h-[34vh] flex items-center pb-6 overflow-hidden pointer-events-none select-none -translate-y-3"
        >
          <div data-testid="nazareth-mobile-text" className="flex w-max will-change-transform">
            <div className="animate-marquee-left flex shrink-0 items-center">
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
            <div className="animate-marquee-left flex shrink-0 items-center" aria-hidden="true">
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
              <span
                className="mr-10 inline-block shrink-0 uppercase tracking-tighter"
                style={{
                  fontFamily: "'Anton', 'Bebas Neue', 'Oswald', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 26vh, 220px)',
                  lineHeight: '0.85',
                  color: textColorSecondary,
                  filter: textShadowSecondary,
                  letterSpacing: '-0.02em',
                }}
              >
                PRINSON ROYAL NAZARETH
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
