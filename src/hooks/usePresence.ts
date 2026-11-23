import { useEffect, useState } from 'react';

const reducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export interface Presence {
  /** Keep the element in the tree (true while open and during the exit animation). */
  isMounted: boolean;
  /** True only while the exit animation is running. */
  isClosing: boolean;
  /** Convenience value for `data-state`, consumed by `styles/motion.css`. */
  state: 'open' | 'closed';
}

/**
 * usePresence
 *
 * Keeps an overlay mounted for `exitMs` after `isOpen` turns false so CSS can
 * play its exit animation (`[data-state='closed']`). Collapses to an immediate
 * unmount when the user prefers reduced motion.
 */
export function usePresence(isOpen: boolean, exitMs = 220): Presence {
  const [isRendered, setIsRendered] = useState(isOpen);

  // Derived-state update during render: mount immediately when opened.
  if (isOpen && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    if (isOpen || !isRendered) return;
    const delay = reducedMotionQuery?.matches ? 0 : exitMs;
    const timer = window.setTimeout(() => setIsRendered(false), delay);
    return () => window.clearTimeout(timer);
  }, [isOpen, isRendered, exitMs]);

  const isClosing = !isOpen && isRendered;
  return {
    isMounted: isOpen || isRendered,
    isClosing,
    state: isClosing ? 'closed' : 'open',
  };
}
