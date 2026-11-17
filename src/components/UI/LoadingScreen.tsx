import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { Compass } from 'lucide-react';

interface LoadingScreenProps {
  manualFinished?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ manualFinished = false }) => {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);

  const isComplete = (!active || progress >= 100) || manualFinished;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080d] transition-opacity duration-700 ease-out ${
        isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Fantasy Emblem Glow */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-fantasy text-xl md:text-2xl font-bold tracking-[0.25em] text-slate-100 uppercase mb-2">
          Hero's Home
        </h1>
        <p className="text-xs uppercase tracking-widest text-indigo-300/70 mb-6">
          Initializing 3D Realm
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-56 h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress, isComplete ? 100 : 15)}%` }}
          />
        </div>

        {/* Percentage */}
        <span className="mt-3 text-[11px] font-mono text-slate-400 tracking-wider">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

