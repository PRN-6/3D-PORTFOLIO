import React, { useRef } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

/**
 * MusicControls
 *
 * Minimal, elegant audio control widget:
 * - Animated soundbar equalizer indicator (animates when actively playing)
 * - Music ON / OFF / Play / Pause toggle
 * - Direct volume slider & mute button
 * - Displays active section soundtrack filename
 * - Discreet in bottom-right area on desktop, fully responsive on mobile
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
      className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-black/85 hover:bg-black/95 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all text-white shadow-lg select-none"
    >
      {/* 1. Animated Equalizer Sound Bars */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        title={isPlaying ? 'Pause music' : 'Play music'}
        className="flex items-end gap-[2px] h-3.5 w-3.5 cursor-pointer focus:outline-none"
      >
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-1' : 'bg-zinc-600 h-[25%]'
          }`}
        />
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-2' : 'bg-zinc-600 h-[50%]'
          }`}
        />
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-3' : 'bg-zinc-600 h-[35%]'
          }`}
        />
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            isAudioActive ? 'bg-white animate-music-bar-4' : 'bg-zinc-600 h-[20%]'
          }`}
        />
      </button>

      {/* 2. Current Track Filename Badge */}
      <span
        data-testid="current-track-name"
        className="font-mono text-[10px] text-zinc-400 lowercase tracking-wider whitespace-nowrap hidden sm:inline"
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
        className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 4. Mute / Unmute Button */}
      <button
        type="button"
        data-testid="audio-mute-toggle"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
        title={isMuted ? 'Unmute' : 'Mute'}
        className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 focus:outline-none"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
        ) : volume < 0.5 ? (
          <Volume1 className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 5. Smooth Volume Slider (Compact & accessible) */}
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
          className="w-12 sm:w-16 h-1 accent-white bg-zinc-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
