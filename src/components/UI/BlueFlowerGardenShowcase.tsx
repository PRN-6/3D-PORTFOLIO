import React, { useState } from 'react';
import { Sparkles, Eye, Compass, Heart, Layers } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ShowcaseView {
  id: string;
  name: string;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
  src: string;
}

const SHOWCASE_VIEWS: ShowcaseView[] = [
  {
    id: 'hero',
    name: 'Hero Reference',
    label: 'Himmel & Frieren',
    caption: 'Himmel and Frieren resting together in the infinite sea of Nemophila blue flowers, crowned with handcrafted floral wreaths.',
    icon: Sparkles,
    src: '/models/blue-flower-garden/previews/01_hero_reference_view.png',
  },
  {
    id: 'aerial',
    name: 'Meadow Overview',
    label: 'Full Floating Island',
    caption: 'Sweeping perspective over the lush flower knoll, flowering sakura trees, and soft cumulus clouds on the horizon.',
    icon: Compass,
    src: '/models/blue-flower-garden/previews/02_aerial_overview.png',
  },
  {
    id: 'romance',
    name: 'Intimate View',
    label: 'Cherished Memory',
    caption: 'Cinematic close-up preserving the nostalgic, gentle connection inspired by Frieren: Beyond Journey’s End.',
    icon: Heart,
    src: '/models/blue-flower-garden/previews/03_romance_closeup.png',
  },
  {
    id: 'horizon',
    name: 'Horizon Clouds',
    label: 'Atmospheric Backdrop',
    caption: 'Dreamy pastel sky with towering anime clouds framing the garden perimeter without foreground occlusion.',
    icon: Layers,
    src: '/models/blue-flower-garden/previews/04_horizon_distant.png',
  },
  {
    id: 'underside',
    name: 'Underside & Crystals',
    label: 'Floating Rocks',
    caption: 'Detailed rocky crags and floating crystal monoliths levitating below the island base.',
    icon: Eye,
    src: '/models/blue-flower-garden/previews/05_underside_crystals.png',
  },
];

export const BlueFlowerGardenShowcase: React.FC = () => {
  const { isLight } = useTheme();
  const [activeView, setActiveView] = useState<ShowcaseView>(SHOWCASE_VIEWS[0]);

  return (
    <div
      data-testid="blue-flower-garden-showcase"
      className={`relative w-full rounded-2xl overflow-hidden border transition-colors duration-300 ${
        isLight
          ? 'bg-[#eae1cf] border-[#cfc3a9] shadow-[0_8px_24px_rgba(180,160,130,0.3)]'
          : 'bg-[#060810]/95 border-sky-500/25 shadow-[0_12px_36px_rgba(0,0,0,0.7)]'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isLight ? 'bg-[#e2d7c2] border-[#cfc3a9]' : 'bg-sky-950/30 border-sky-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="font-fantasy text-sm font-semibold tracking-wide">
            Level 05: Blue Flower Garden
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isLight
                ? 'bg-[#d8cbb2] text-[#3d372d] border border-[#c5b79d]'
                : 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
            }`}
          >
            Himmel &amp; Frieren
          </span>
        </div>
      </div>

      {/* Main Preview Image Display */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
        <img
          src={activeView.src}
          alt={activeView.name}
          className="w-full h-full object-cover transition-all duration-300 select-none pointer-events-none"
        />

        {/* View Badge overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-mono border border-white/15">
          <activeView.icon className="w-3.5 h-3.5 text-sky-300" />
          <span>{activeView.label}</span>
        </div>
      </div>

      {/* Caption & Description */}
      <div className="p-3.5 sm:p-4">
        <p
          className={`text-xs sm:text-[13px] leading-relaxed ${
            isLight ? 'text-[#3d372e]' : 'text-slate-300'
          }`}
        >
          {activeView.caption}
        </p>

        {/* Interactive View Thumbnails */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/10 dark:border-white/10 overflow-x-auto no-scrollbar">
          {SHOWCASE_VIEWS.map((view) => {
            const isSelected = activeView.id === view.id;
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-[#1c1a17] text-[#f4eee0] shadow-sm'
                      : 'bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-sm'
                    : isLight
                    ? 'bg-[#e2d7c2]/80 text-[#5a5245] hover:text-[#1c1a17] hover:bg-[#d8cbb2]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{view.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
