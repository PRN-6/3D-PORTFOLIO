import React, { useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

/**
 * MusicControls
 *
 * Minimal, elegant audio control capsule fixed in the top-left corner:
 * - Animated soundbar equalizer indicator (animates when actively playing)
 * - Active section soundtrack filename
 * - Play / Pause toggle
 * - Volume Mute / Unmute button
 * - Smooth volume slider (compact on mobile, extended on desktop)
 * - Fixed top-left positioning on BOTH mobile and desktop
 */
export const MusicControls: React.FC = () => {
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
      aria-label="Background Music Controls"
      className="fixed top-3.5 left-3.5 sm:top-5 sm:left-5 md:top-6 md:left-8 z-40 pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/90 hover:bg-black/95 backdrop-blur-md border border-white/15 hover:border-white/25 transition-all text-white shadow-[0_4px_24px_rgba(0,0,0,0.85)] select-none"
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
            isAudioActive ? 'bg-white animate-music-bar-1' : 'bg-zinc-600 h-[25%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-2' : 'bg-zinc-600 h-[50%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-3' : 'bg-zinc-600 h-[35%]'
          }`}
        />
        <span
          className={`w-[1.5px] sm:w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-4' : 'bg-zinc-600 h-[20%]'
          }`}
        />
      </button>

      {/* 2. Current Track Filename Badge (Compact on mobile, readable on desktop) */}
      <span
        data-testid="current-track-name"
        className="font-mono text-[9px] sm:text-[11px] text-zinc-300 lowercase tracking-wider whitespace-nowrap"
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
        className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 sm:p-1 focus:outline-none flex items-center justify-center"
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
        className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 sm:p-1 focus:outline-none flex items-center justify-center"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-500" />
        ) : volume < 0.5 ? (
          <Volume1 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ) : (
          <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        )}
      </button>

      {/* 5. Smooth Volume Slider (Compact on mobile, extended on desktop) */}
      <div className="flex items-center">
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
          className="w-8 sm:w-14 md:w-16 music-volume-slider cursor-pointer"
        />
      </div>
    </div>
  );
};
