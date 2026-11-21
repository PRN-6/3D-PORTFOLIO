import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Layers,
  Sparkles,
  Compass,
  X,
  Eye,
} from 'lucide-react';
import { assemblyEngine, type AssemblyEngineState } from '../../animation/AssemblyEngine';
import { ANIMATION_PRESETS, type PresetKey } from '../../animation/AnimationPresets';
import { useTheme } from '../../context/ThemeContext';

export interface AnimationControlsProps {
  onResetCamera?: () => void;
  className?: string;
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  onResetCamera,
  className = '',
}) => {
  const { isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [engineState, setEngineState] = useState<AssemblyEngineState>(() =>
    assemblyEngine.getState()
  );

  // Subscribe to engine state
  useEffect(() => {
    const unsubscribe = assemblyEngine.subscribe((state) => {
      setEngineState(state);
    });
    return unsubscribe;
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (engineState.isPlaying) {
      assemblyEngine.pause();
    }
    assemblyEngine.scrub(val);
  }, [engineState.isPlaying]);

  const handlePlayAssemble = useCallback(() => {
    assemblyEngine.play('forward');
  }, []);

  const handlePlayDisassemble = useCallback(() => {
    assemblyEngine.play('reverse');
  }, []);

  const handleTogglePlay = useCallback(() => {
    assemblyEngine.togglePlay();
  }, []);

  const handleRestart = useCallback(() => {
    assemblyEngine.restart();
  }, []);

  const handleSpeedSelect = useCallback((spd: number) => {
    assemblyEngine.setSpeed(spd);
  }, []);

  const handlePresetSelect = useCallback((key: PresetKey) => {
    assemblyEngine.setPreset(key);
  }, []);

  const handleToggleRails = useCallback(() => {
    assemblyEngine.toggleRails();
  }, []);

  const progressPercent = Math.round(engineState.progress * 100);
  const activePreset = ANIMATION_PRESETS[engineState.presetKey] || ANIMATION_PRESETS.SPIRAL;

  // Base theme classes
  const panelBg = isLight
    ? 'bg-[#f4eee0]/95 border-[#c8bc9f] text-[#2c2823] shadow-xl backdrop-blur-md'
    : 'bg-[#090b14]/95 border-[#2a2e45] text-[#f1f5f9] shadow-2xl backdrop-blur-md';

  const subText = isLight ? 'text-[#655f54]' : 'text-[#94a3b8]';
  const pillActive = isLight
    ? 'bg-[#2c2823] text-[#f4eee0] font-medium shadow-sm'
    : 'bg-[#38bdf8] text-[#090b14] font-semibold shadow-[0_0_12px_rgba(56,189,248,0.35)]';
  const pillInactive = isLight
    ? 'bg-[#e9e1cf] text-[#4a443b] hover:bg-[#ded4bf]'
    : 'bg-[#1e2337] text-[#94a3b8] hover:bg-[#2b324c] hover:text-[#f1f5f9]';

  return (
    <div className={`fixed z-40 transition-all duration-300 pointer-events-auto ${className}`}>
      {/* 1. COMPACT LAUNCHER PILL (Always visible when minimized) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border text-xs font-serif tracking-wider transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-[#f4eee0]/90 border-[#c8bc9f] text-[#2c2823] shadow-md hover:border-[#b45309]'
              : 'bg-[#090b14]/90 border-[#38bdf8]/40 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:border-[#38bdf8]'
          }`}
          title="Open Cinematic Assembly Animation Controls"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Cinematic Assembly</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-black/10 dark:bg-white/10">
            {progressPercent}%
          </span>
        </button>
      )}

      {/* 2. EXPANDED ANIMATION CONTROL PANEL */}
      {isOpen && (
        <div
          className={`w-[340px] sm:w-[380px] p-4 rounded-2xl border flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-200 ${panelBg}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2.5 border-current/10">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isLight ? 'bg-[#b45309]/10 text-[#b45309]' : 'bg-[#38bdf8]/10 text-[#38bdf8]'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold tracking-wide leading-tight">
                  Cinematic 3D Assembly
                </h3>
                <p className="text-[10px] font-sans opacity-75">
                  Blender 3D Spline Rails & Kinematics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onResetCamera && (
                <button
                  onClick={onResetCamera}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight ? 'hover:bg-black/5 text-[#655f54]' : 'hover:bg-white/10 text-[#94a3b8]'
                  }`}
                  title="Reset Camera View"
                >
                  <Compass className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-black/5 text-[#655f54]' : 'hover:bg-white/10 text-[#94a3b8]'
                }`}
                title="Minimize Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Scrub Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={subText}>Scrub Timeline:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">{progressPercent}%</span>
                <span className={`text-[10px] ${subText}`}>
                  ({engineState.progress === 1.0 ? 'Assembled' : engineState.progress === 0.0 ? 'Exploded' : 'In Flight'})
                </span>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={engineState.progress}
                onChange={handleSliderChange}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#38bdf8] dark:accent-[#38bdf8] bg-black/10 dark:bg-white/10"
              />
            </div>
          </div>

          {/* Transport Controls (Assemble, Disassemble, Pause/Play, Restart) */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={handlePlayAssemble}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-serif transition-all duration-200 border border-current/15 ${
                engineState.isPlaying && engineState.direction === 'forward' ? pillActive : pillInactive
              }`}
              title="Assemble: Components swoop in along 3D curved rails"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Assemble</span>
            </button>

            <button
              onClick={handlePlayDisassemble}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-serif transition-all duration-200 border border-current/15 ${
                engineState.isPlaying && engineState.direction === 'reverse' ? pillActive : pillInactive
              }`}
              title="Disassemble: Components separate along 3D curved rails"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Explode</span>
            </button>

            <button
              onClick={handleTogglePlay}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-serif transition-all duration-200 border border-current/15 ${
                engineState.isPlaying ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : pillInactive
              }`}
              title={engineState.isPlaying ? 'Pause Animation' : 'Play Animation'}
            >
              {engineState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{engineState.isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleRestart}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-serif transition-all duration-200 border border-current/15 ${pillInactive}`}
              title="Restart assembly from beginning"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>

          {/* 3D Spline Guide Rails Toggle (Blender Viewport Mode) */}
          <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-serif text-[11px] font-medium">3D Trajectory Rails:</span>
            </div>
            <button
              onClick={handleToggleRails}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-colors font-semibold ${
                engineState.showRails ? pillActive : pillInactive
              }`}
              title="Toggle visible 3D NURBS spline trajectory guide rails (like Blender viewport)"
            >
              {engineState.showRails ? 'ON (Blender Mode)' : 'OFF'}
            </button>
          </div>

          {/* Cinematic Preset Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-serif ${subText}`}>Cinematic Preset:</span>
              <span className="text-[10px] font-sans opacity-70">
                {activePreset.tagline}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(Object.keys(ANIMATION_PRESETS) as PresetKey[]).map((key) => {
                const preset = ANIMATION_PRESETS[key];
                const isSelected = engineState.presetKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetSelect(key)}
                    className={`py-1.5 px-2.5 rounded-lg text-left transition-all duration-200 border text-[11px] font-serif ${
                      isSelected
                        ? `${pillActive} border-transparent`
                        : `${pillInactive} border-current/10`
                    }`}
                  >
                    <div className="font-semibold leading-none mb-0.5">{preset.name}</div>
                    <div className="text-[9px] opacity-75 truncate">{preset.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playback Speed Multipliers & Footer Stats */}
          <div className="flex items-center justify-between pt-1 border-t border-current/10 text-xs">
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-serif mr-1 ${subText}`}>Speed:</span>
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedSelect(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    engineState.speed === spd ? pillActive : pillInactive
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="text-[10px] font-mono opacity-60">
              {engineState.componentCount} components
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
