import React from 'react';
import { RotateCcw, Shield } from 'lucide-react';

export interface NavigationProps {
  onResetCamera: () => void;
  status: 'checking' | 'loading' | 'loaded' | 'fallback';
  hoveredObject?: string | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  onResetCamera,
  status,
  hoveredObject,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none flex items-center justify-between p-4 md:p-6">
      {/* Minimal Brand Identity */}
      <div className="pointer-events-auto flex items-center gap-3 fantasy-glass px-4 py-2.5 rounded-2xl">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="font-fantasy text-sm md:text-base font-bold tracking-[0.15em] text-slate-100 uppercase">
            Hero's Home
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                status === 'loaded'
                  ? 'bg-emerald-400'
                  : status === 'fallback'
                  ? 'bg-amber-400'
                  : 'bg-indigo-400 animate-ping'
              }`}
            />
            {status === 'loaded'
              ? 'Model Loaded'
              : status === 'fallback'
              ? 'Placeholder Mode'
              : 'Syncing Realm...'}
          </div>
        </div>
      </div>

      {/* Hovered Object or Reset View Control */}
      <div className="pointer-events-auto flex items-center gap-2">
        {hoveredObject && (
          <div className="hidden sm:flex items-center gap-2 fantasy-glass px-3.5 py-2 rounded-xl text-xs font-medium text-indigo-200 border border-indigo-500/30 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="capitalize">{hoveredObject.replace(/_/g, ' ')}</span>
          </div>
        )}

        {/* Reset Camera Button */}
        <button
          onClick={onResetCamera}
          type="button"
          aria-label="Reset camera view"
          className="group flex items-center gap-2 fantasy-glass hover:bg-slate-800/80 active:scale-95 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer border border-white/10"
        >
          <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90 duration-300" />
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            Reset View
          </span>
        </button>
      </div>
    </header>
  );
};

