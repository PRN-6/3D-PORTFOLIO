import React, { useLayoutEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { PRELOADER_DONE_EVENT } from '../../config/motionEvents';

const SUBTITLE = 'Just a Developer';
const SUBTITLE_CHARS = Array.from(SUBTITLE);

// Once the intro has played, later mounts (returning to HOME) reveal immediately.
let introHasCompleted = false;

/**
 * Waits for the preloader brand to dock before starting the reveal so the
 * animation is not spent behind the loading overlay.
 */
function useAwaitIntro(): boolean {
  const [awaiting, setAwaiting] = useState(!introHasCompleted);

  useLayoutEffect(() => {
    if (introHasCompleted) return;
    const finish = () => {
      introHasCompleted = true;
      setAwaiting(false);
    };
    if (!document.querySelector('[data-testid="preloader-overlay"]')) {
      finish();
      return;
    }
    window.addEventListener(PRELOADER_DONE_EVENT, finish, { once: true });
    return () => window.removeEventListener(PRELOADER_DONE_EVENT, finish);
  }, []);

  return awaiting;
}

const AnimatedChars: React.FC = () => (
  <>
    <span className="sr-only">{SUBTITLE}</span>
    <span aria-hidden="true">
      {SUBTITLE_CHARS.map((char, index) => (
        <span key={index} className="prn-char" style={{ '--i': index } as React.CSSProperties}>
          {char}
        </span>
      ))}
    </span>
  </>
);

/**
 * HeroSubtitle
 *
 * Small, elegant monospace subtitle positioned beneath the central hero composition:
 * - Dark Mode: Subtle blue-grey tracking text
 * - Light Mode: Sleek dark rounded capsule with cream text matching the reference
 * Characters rise in with a stagger once the preloader has docked the brand.
 */
export const HeroSubtitle: React.FC = () => {
  const { isLight } = useTheme();
  const awaiting = useAwaitIntro();

  return (
    <div
      data-testid="hero-subtitle"
      data-awaiting={awaiting ? 'true' : 'false'}
      className="fixed bottom-[27vh] sm:bottom-[28vh] md:bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none text-center"
    >
      {isLight ? (
        <div className="prn-capsule-in inline-block bg-[#1c1a17] text-[#f4eee0] border border-[#38332c] px-4 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="font-mono text-[9.5px] sm:text-[10.5px] tracking-[0.28em] uppercase whitespace-nowrap font-medium">
            <AnimatedChars />
          </p>
        </div>
      ) : (
        <p className="font-mono text-[10px] sm:text-[11px] md:text-xs text-zinc-400/90 tracking-[0.30em] uppercase whitespace-nowrap">
          <AnimatedChars />
        </p>
      )}
    </div>
  );
};
