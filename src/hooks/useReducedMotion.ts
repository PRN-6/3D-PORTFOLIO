import { useSyncExternalStore } from 'react';

const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

function subscribe(listener: () => void) {
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => preference.matches);
}
