import { useState, useEffect, useCallback } from 'react';
import { audioManager, type AudioManagerState } from '../services/audioManager';

export function useAudioPlayer(): AudioManagerState & {
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
  unlockAudio: () => void;
} {
  const [state, setState] = useState<AudioManagerState>(() => audioManager.getState());

  useEffect(() => {
    const unsubscribe = audioManager.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const togglePlay = useCallback(() => audioManager.togglePlay(), []);
  const toggleMute = useCallback(() => audioManager.toggleMute(), []);
  const setVolume = useCallback((val: number) => audioManager.setVolume(val), []);
  const unlockAudio = useCallback(() => audioManager.unlockAudio(), []);

  return {
    ...state,
    togglePlay,
    toggleMute,
    setVolume,
    unlockAudio,
  };
}

