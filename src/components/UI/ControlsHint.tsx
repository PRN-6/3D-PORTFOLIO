import React, { useState } from 'react';
import { HelpCircle, MousePointer, Move, ZoomIn, X } from 'lucide-react';

export const ControlsHint: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          aria-label="Show 3D controls hint"
          className="flex items-center justify-center w-10 h-10 rounded-full fantasy-glass text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[92vw] sm:max-w-none">
      <div className="flex items-center gap-3 sm:gap-6 fantasy-glass px-4 py-2.5 rounded-full text-[11px] sm:text-xs text-slate-300 border border-white/10 shadow-xl">
        {/* Rotate Hint */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
          <span><strong className="text-white font-medium">Drag:</strong> Rotate</span>
        </div>

        <div className="w-px h-3 bg-slate-700 hidden sm:block" />

        {/* Zoom Hint */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
          <span><strong className="text-white font-medium">Scroll / Pinch:</strong> Zoom</span>
        </div>

        <div className="w-px h-3 bg-slate-700 hidden sm:block" />

        {/* Pan Hint */}
        <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          <span><strong className="text-white font-medium">Right Click:</strong> Pan</span>
        </div>

        {/* Close hint button */}
        <button
          onClick={() => setIsOpen(false)}
          type="button"
          aria-label="Hide controls hint"
          className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

