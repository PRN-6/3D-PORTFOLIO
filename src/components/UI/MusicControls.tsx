import React, { useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTheme } from '../../context/ThemeContext';

/**
 * MusicControls
 *
 * Minimal, elegant audio control capsule fixed in the bottom-center:
 * - Animated soundbar equalizer indicator (animates when actively playing)
 * - Active section soundtrack filename
 * - Play / Pause toggle
 * - Volume Mute / Unmute button
 * - Smooth volume slider (compact on mobile, extended on desktop)
 * - Fixed bottom-center positioning on BOTH mobile and desktop
 * - Theme-aware styling: Dark mode black capsule / Light mode warm parchment capsule
 */
export const MusicControls: React.FC = () => {
  const { isLight } = useTheme();
  const {
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    hasInteracted,
    togglePlay,
    toggleMute,
    setVolume,
  } = useAudioPlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const isAudioActive = hasInteracted && isPlaying && !isMuted;

  return (
    <div
      ref={containerRef}
      data-testid="music-controls"
      data-music-control="true"
      aria-label="Background Music Controls"
      className={`fixed bottom-3.5 sm:bottom-4 md:bottom-5 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full backdrop-blur-md transition-all select-none ${
        isLight
          ? 'bg-[#e8decb]/90 hover:bg-[#e2d6c0] border border-[#c4b79b] text-[#22201d] shadow-[0_4px_20px_rgba(180,160,130,0.45)]'
          : 'bg-black/90 hover:bg-black/95 border border-white/15 hover:border-white/25 text-white shadow-[0_4px_24px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* 1. Animated Equalizer Sound Bars */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        title={isPlaying ? 'Pause music' : 'Play music'}
        className="flex items-end gap-[1.5px] sm:gap-[2px] h-3 w-3 sm:h-3.5 sm:w-3.5 cursor-pointer focus:outline-none"
      >
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive
              ? isLight
                ? 'bg-[#22201d] animate-music-bar-1'
                : 'bg-white animate-music-bar-1'
              : isLight
              ? 'bg-[#968b74] h-[25%]'
              : 'bg-zinc-600 h-[25%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive
              ? isLight
                ? 'bg-[#22201d] animate-music-bar-2'
                : 'bg-white animate-music-bar-2'
              : isLight
              ? 'bg-[#968b74] h-[50%]'
              : 'bg-zinc-600 h-[50%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive
              ? isLight
                ? 'bg-[#22201d] animate-music-bar-3'
                : 'bg-white animate-music-bar-3'
              : isLight
              ? 'bg-[#968b74] h-[35%]'
              : 'bg-zinc-600 h-[35%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive
              ? isLight
                ? 'bg-[#22201d] animate-music-bar-4'
                : 'bg-white animate-music-bar-4'
              : isLight
              ? 'bg-[#968b74] h-[20%]'
              : 'bg-zinc-600 h-[20%]'
          }`}
        />
      </button>

      {/* 2. Current Track Filename Badge (Compact on mobile, readable on desktop) */}
      <span
        data-testid="current-track-name"
        className={`font-mono text-[9px] sm:text-[11px] lowercase tracking-wider whitespace-nowrap ${
          isLight ? 'text-[#22201d] font-medium' : 'text-zinc-300'
        }`}
      >
        {currentTrack.filename}
      </span>

      {/* 3. Play / Pause Button */}
      <button
        type="button"
        data-testid="audio-play-toggle"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause background soundtrack' : 'Play background soundtrack'}
        title={isPlaying ? 'Pause' : 'Play'}
        className={`transition-colors cursor-pointer p-0.5 sm:p-1 focus:outline-none flex items-center justify-center ${
          isLight ? 'text-[#4a4336] hover:text-[#110f0c]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ) : (
          <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        )}
      </button>

      {/* 4. Mute / Unmute Button */}
      <button
        type="button"
        data-testid="audio-mute-toggle"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
        title={isMuted ? 'Unmute' : 'Mute'}
        className={`transition-colors cursor-pointer p-0.5 sm:p-1 focus:outline-none flex items-center justify-center ${
          isLight ? 'text-[#4a4336] hover:text-[#110f0c]' : 'text-zinc-400 hover:text-white'
        }`}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLight ? 'text-[#968b74]' : 'text-zinc-500'}`} />
        ) : volume < 0.5 ? (
          <Volume1 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ) : (
          <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        )}
      </button>

      {/* 5. Smooth Volume Slider (Compact on mobile, extended on desktop) */}
      <div className="hidden xs:flex sm:flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          data-testid="audio-volume-slider"
          aria-label="Music volume slider"
          title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          className="w-10 sm:w-14 md:w-16 music-volume-slider cursor-pointer"
        />
      </div>
    </div>
  );
};
