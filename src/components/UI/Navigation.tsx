import React from 'react';
import { RotateCcw } from 'lucide-react';

export interface NavigationProps {
  onResetCamera: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onResetCamera }) => {
  return (
    <nav className="fixed top-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
      {/* Discreet Camera Reset Button */}
      <button
        onClick={onResetCamera}
        type="button"
        aria-label="Reset camera view"
        className="pointer-events-auto group flex items-center gap-2 fantasy-glass hover:bg-slate-800/80 active:scale-95 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer border border-white/10 shadow-lg"
      >
        <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90 duration-300" />
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          Reset View
        </span>
      </button>
    </nav>
  );
};
