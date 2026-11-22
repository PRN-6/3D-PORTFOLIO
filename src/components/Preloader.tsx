import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useTheme } from '../context/ThemeContext';

export interface PreloaderProps {
  isReady: boolean;
  targetRef: React.RefObject<HTMLAnchorElement | null>;
  onDock?: () => void;
  onComplete?: () => void;
}

/**
 * Preloader
 *
 * Master Asset-Gated Preloader & Hero Brand-Flight Transition:
 * 1. Holds on solid warm off-white (#F2EDE4) with centered dark charcoal (#262422) P R N wordmark
 *    until all 3D assets, textures, fonts, and WebGL shaders are 100% loaded and compiled.
 * 2. Phase 1 (0.0s – 1.1s): Flights P R N along an upward-left curved trajectory
 *    (asymmetric x: power3.inOut, y: power2.out) while morphing scale and tracking down into navbar slot.
 * 3. Phase 2 (0.2s – 1.1s): Smoothly cross-fades the #F2EDE4 overlay out while interpolating text color
 *    to crisp off-white (#F5F5F5 in dark mode) or dark charcoal (#262422 in light mode).
 * 4. Phase 3 (0.9s – 1.5s): Docks seamlessly into persistent Navbar brand slot (data-flip-id="brand-prn")
 *    and stagger-reveals remaining header controls, music capsule, and footer links.
 */
export const Preloader: React.FC<PreloaderProps> = ({
  isReady,
  targetRef,
  onDock,
  onComplete,
}) => {
  const { isDark } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  const [hasStartedFlight, setHasStartedFlight] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Set initial hidden state for staggered controls immediately on mount
  useEffect(() => {
    gsap.set('[data-nav-control], [data-music-control], [data-footer-control]', {
      opacity: 0,
      y: -8,
    });
  }, []);

  const runBrandFlight = useCallback(() => {
    const overlayEl = overlayRef.current;
    const wordmarkEl = wordmarkRef.current;
    const targetEl = targetRef.current;

    if (!overlayEl || !wordmarkEl) return;

    // 1. Calculate trajectory deltas between viewport center and target navbar slot
    const startRect = wordmarkEl.getBoundingClientRect();
    const targetRect = targetEl?.getBoundingClientRect();

    let dX = 0;
    let dY = 0;
    let targetScale = 0.48;

    if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
      dX = targetRect.left - startRect.left;
      dY = targetRect.top - startRect.top;
      targetScale = targetRect.height / (startRect.height || 1);
    } else {
      // Deterministic fallback matching responsive navbar positions
      const isMobile = window.innerWidth < 768;
      const targetLeft = isMobile ? 14 : 32;
      const targetTop = isMobile ? 14 : 24;
      dX = targetLeft - startRect.left;
      dY = targetTop - startRect.top;
      targetScale = isMobile ? 0.42 : 0.48;
    }

    // Target fill color based on active mode
    const targetColor = isDark ? '#F5F5F5' : '#262422';

    // 2. Master GSAP Flight Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setIsFinished(true);
        onComplete?.();
      },
    });

    // Phase 1 (0.0s – 1.1s): Curved Upward-Left Flight Arc + Scale & Tracking Morph
    // Asymmetric easing produces an organic parabolic arc:
    // x with power3.inOut and y with power2.out
    tl.to(
      wordmarkEl,
      {
        x: dX,
        duration: 1.1,
        ease: 'power3.inOut',
      },
      0
    );

    tl.to(
      wordmarkEl,
      {
        y: dY,
        duration: 1.1,
        ease: 'power2.out',
      },
      0
    );

    tl.to(
      wordmarkEl,
      {
        scale: Math.max(0.35, Math.min(0.65, targetScale)),
        letterSpacing: '0.20em',
        transformOrigin: 'top left',
        duration: 1.1,
        ease: 'power3.inOut',
      },
      0
    );

    // Phase 2 (0.2s – 1.1s): Background Reveal & Color Shift
    tl.to(
      overlayEl,
      {
        opacity: 0,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0.2
    );

    tl.to(
      wordmarkEl,
      {
        color: targetColor,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0.2
    );

    // Phase 3 (0.9s – 1.5s): Persistent Navbar Docking & Header / Footer Stagger Reveal
    // At 0.9s: Hand off brand wordmark to persistent Navbar slot
    tl.add(() => {
      onDock?.();
    }, 0.9);

    // Hide preloader duplicate wordmark at flight completion (1.1s)
    tl.to(
      wordmarkEl,
      {
        opacity: 0,
        duration: 0.05,
        ease: 'none',
      },
      1.1
    );

    // Stagger reveal remaining header controls and bottom footer links
    tl.fromTo(
      '[data-nav-control], [data-music-control], [data-footer-control]',
      { opacity: 0, y: -8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      },
      0.9
    );
  }, [isDark, onDock, onComplete, targetRef]);

  const runBrandFlightRef = useRef(runBrandFlight);
  runBrandFlightRef.current = runBrandFlight;

  // Asset Readiness Gate: wait for isReady + 250ms settle beat before triggering flight
  useEffect(() => {
    if (!isReady || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setHasStartedFlight(true);
    const settleTimer = setTimeout(() => {
      runBrandFlightRef.current();
    }, 250);

    return () => clearTimeout(settleTimer);
  }, [isReady]);

  if (isFinished) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      data-testid="preloader-overlay"
      aria-label="Application Loading Screen"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F2EDE4] select-none pointer-events-auto"
      style={{
        overflow: 'hidden',
        pointerEvents: hasStartedFlight ? 'none' : 'auto',
      }}
    >
      <div
        ref={wordmarkRef}
        data-testid="preloader-brand-wordmark"
        className="font-mono font-bold text-3xl sm:text-4xl md:text-[34px] tracking-[0.28em] text-[#262422] select-none pointer-events-none uppercase inline-block whitespace-nowrap will-change-transform"
      >
        P R N
      </div>
    </div>
  );
};
