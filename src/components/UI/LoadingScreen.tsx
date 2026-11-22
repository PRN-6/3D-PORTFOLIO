import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useTheme } from '../../context/ThemeContext';

interface LoadingScreenProps {
  manualFinished?: boolean;
}

/**
 * LoadingScreen (Cover Page)
 *
 * Minimalist, ultra-clean branding screen:
 * - Dark Mode: 100% full black background with white "PRN" logo letters in the center.
 * - Light Mode: Warm cream parchment background with black "PRN" logo letters in the center.
 * - Gentle ambient breathing animation while assets initialize.
 * - Smooth fade-out transition once loading completes.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ manualFinished = false }) => {
  const { progress, active } = useProgress();
  const { isLight } = useTheme();
  const [visible, setVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Guarantee at least a brief smooth presentation so cached loads don't flash abruptly
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 600);
    return () => clearTimeout(minTimer);
  }, []);

  const isLoaded = manualFinished || (!active && progress >= 100) || progress >= 100;
  const isComplete = isLoaded && minTimeElapsed;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isComplete]);

  if (!visible) return null;

  return (
    <div
      data-testid="loading-cover-screen"
      aria-label="Loading"
      className={`fixed inset-0 z-50 flex items-center justify-center select-none transition-opacity duration-700 ease-out ${
        isLight ? 'bg-[#f4eee0]' : 'bg-black'
      } ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Central PRN Logo */}
        <h1
          className={`font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.35em] pl-[0.35em] transition-colors duration-500 animate-pulse ${
            isLight ? 'text-black' : 'text-white'
          }`}
        >
          PRN
        </h1>
      </div>
    </div>
  );
};
