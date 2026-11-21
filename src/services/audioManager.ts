import type { NavTabId } from '../config/navigationConfig';

export interface AudioTrackConfig {
  id: NavTabId;
  label: string;
  filename: string;
  src: string;
}

export const AUDIO_TRACKS: Record<NavTabId, AudioTrackConfig> = {
  HOME: {
    id: 'HOME',
    label: "Hero's Home",
    filename: 'home.mp3',
    src: '/audio/home.mp3',
  },
  PRODUCTS: {
    id: 'PRODUCTS',
    label: 'Rune Workshop',
    filename: 'products.mp3',
    src: '/audio/products.mp3',
  },
  PROJECTS: {
    id: 'PROJECTS',
    label: "Grand Mage's Archive",
    filename: 'projects.mp3',
    src: '/audio/projects.mp3',
  },
  ABOUT: {
    id: 'ABOUT',
    label: 'Whispering Forest',
    filename: 'about.mp3',
    src: '/audio/about.mp3',
  },
  CONTACT: {
    id: 'CONTACT',
    label: 'Contact & Inquiries',
    filename: 'contact.mp3',
    src: '/audio/contact.mp3',
  },
  FUN: {
    id: 'FUN',
    label: 'Playground & Orbit',
    filename: 'home.mp3', // Fallback to existing audio track since fun.mp3 is not on disk
    src: '/audio/home.mp3',
  },
};

const STORAGE_KEYS = {
  MUTED: 'prinson_music_muted',
  VOLUME: 'prinson_music_volume',
  ENABLED: 'prinson_music_enabled',
};

export interface AudioManagerState {
  currentSection: NavTabId;
  currentTrack: AudioTrackConfig;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  hasInteracted: boolean;
  isFading: boolean;
}

type AudioListener = (state: AudioManagerState) => void;

class AudioManager {
  private static instance: AudioManager | null = null;

  private currentSection: NavTabId = 'HOME';
  private isPlaying: boolean = true;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private hasInteracted: boolean = false;
  private isFading: boolean = false;

  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private fadingOutAudio: HTMLAudioElement | null = null;
  private fadeIntervalId: ReturnType<typeof setInterval> | null = null;

  private listeners: Set<AudioListener> = new Set();
  private isInitialized: boolean = false;

  private constructor() {
    this.loadStoredPreferences();
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private loadStoredPreferences() {
    if (typeof window === 'undefined') return;

    try {
      const storedMuted = localStorage.getItem(STORAGE_KEYS.MUTED);
      if (storedMuted !== null) {
        this.isMuted = storedMuted === 'true';
      }

      const storedVol = localStorage.getItem(STORAGE_KEYS.VOLUME);
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      const storedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);
      if (storedEnabled !== null) {
        this.isPlaying = storedEnabled === 'true';
      }
    } catch {
      // Ignore localStorage access restrictions in private mode
    }
  }

  private savePreferences() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.MUTED, this.isMuted ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.VOLUME, this.volume.toString());
      localStorage.setItem(STORAGE_KEYS.ENABLED, this.isPlaying ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Preload audio metadata for all unique track sources
    const uniqueSources = new Set(Object.values(AUDIO_TRACKS).map((t) => t.src));
    uniqueSources.forEach((src) => {
      const audio = new Audio();
      audio.src = src;
      audio.loop = true;
      audio.preload = 'metadata';
      audio.volume = 0;
      this.audioElements.set(src, audio);
    });

    // Set initial audio instance
    const initialTrack = AUDIO_TRACKS[this.currentSection];
    this.currentAudio = this.audioElements.get(initialTrack.src) || null;

    // 2. Global user interaction listener to unlock audio without blocking autoplay policy
    const handleFirstInteraction = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    // Expose diagnostics for verification & tests
    (window as any).__AUDIO_MANAGER__ = this;
  }

  /**
   * Unlock browser audio upon first user gesture
   */
  public unlockAudio() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;

    // Attempt to start current track if enabled
    if (this.isPlaying && !this.isMuted && this.currentAudio) {
      this.currentAudio.currentTime = 0;
      this.currentAudio.volume = 0;
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.fadeIn(this.currentAudio!, this.volume, 1500);
          })
          .catch(() => {
            // Autoplay blocked; wait for direct control click
          });
      }
    }

    this.notifyListeners();
  }

  /**
   * Switch soundtrack when navigating between sections
   * Smoothly crossfades over 1.5 seconds without abrupt cuts
   */
  public setSection(section: NavTabId) {
    if (section === this.currentSection && this.currentAudio && !this.currentAudio.paused) {
      return; // Already playing this section's soundtrack
    }

    this.currentSection = section;

    const previousAudio = this.currentAudio;
    const newTrack = AUDIO_TRACKS[section];
    const newAudio = this.audioElements.get(newTrack.src) || null;

    // If both sections share the same physical audio file, avoid restarting track
    if (previousAudio && newAudio && previousAudio.src === newAudio.src) {
      this.currentAudio = newAudio;
      this.notifyListeners();
      return;
    }

    this.currentAudio = newAudio;

    if (!newAudio) {
      if (previousAudio) {
        this.fadeOut(previousAudio, 1500);
      }
      this.notifyListeners();
      return;
    }

    if (!this.hasInteracted || !this.isPlaying || this.isMuted) {
      // User hasn't interacted or is muted/paused; switch track silently
      if (previousAudio) {
        previousAudio.pause();
        previousAudio.currentTime = 0;
        previousAudio.volume = 0;
      }
      this.notifyListeners();
      return;
    }

    // Execute smooth 1.5s crossfade between previousAudio and newAudio
    this.crossfade(previousAudio, newAudio, 1500);
    this.notifyListeners();
  }

  /**
   * Smooth crossfade from outgoing audio to incoming audio
   */
  private crossfade(outgoing: HTMLAudioElement | null, incoming: HTMLAudioElement, durationMs: number = 1500) {
    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }

    // Immediately stop any lingering previous audio tracks
    if (this.fadingOutAudio && this.fadingOutAudio !== outgoing) {
      this.fadingOutAudio.pause();
      this.fadingOutAudio.currentTime = 0;
      this.fadingOutAudio.volume = 0;
    }

    this.audioElements.forEach((audio) => {
      if (audio !== incoming && audio !== outgoing) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }
    });

    this.fadingOutAudio = outgoing;
    this.isFading = true;

    // Prepare incoming audio
    incoming.currentTime = 0;
    incoming.volume = 0;
    const playPromise = incoming.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Handled silently
      });
    }

    const targetVolume = this.isMuted ? 0 : this.volume;
    const startTime = Date.now();
    const startOutgoingVolume = outgoing ? outgoing.volume : 0;

    const stepInterval = 40; // 25 fps volume interpolation
    this.fadeIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Outgoing: fade down to 0
      if (outgoing) {
        outgoing.volume = Math.max(0, startOutgoingVolume * (1 - progress));
      }

      // Incoming: fade up to targetVolume
      incoming.volume = Math.min(targetVolume, targetVolume * progress);

      if (progress >= 1) {
        if (this.fadeIntervalId) {
          clearInterval(this.fadeIntervalId);
          this.fadeIntervalId = null;
        }
        if (outgoing) {
          outgoing.pause();
          outgoing.currentTime = 0;
          outgoing.volume = 0;
        }
        // Ensure strictly all other tracks are paused
        this.audioElements.forEach((audio) => {
          if (audio !== incoming) {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0;
          }
        });
        this.fadingOutAudio = null;
        this.isFading = false;
        incoming.volume = targetVolume;
        this.notifyListeners();
      }
    }, stepInterval);
  }

  private fadeIn(audio: HTMLAudioElement, targetVol: number, durationMs: number = 1500) {
    if (this.isMuted) {
      audio.volume = 0;
      return;
    }

    const startTime = Date.now();
    const stepInterval = 40;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = Math.min(targetVol, targetVol * progress);

      if (progress >= 1) {
        clearInterval(interval);
        audio.volume = targetVol;
      }
    }, stepInterval);
  }

  private fadeOut(audio: HTMLAudioElement, durationMs: number = 1500) {
    const startTime = Date.now();
    const startVol = audio.volume;
    const stepInterval = 40;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = Math.max(0, startVol * (1 - progress));

      if (progress >= 1) {
        clearInterval(interval);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }
    }, stepInterval);
  }

  /**
   * Toggle Music ON / OFF
   */
  public togglePlay() {
    this.unlockAudio();
    this.isPlaying = !this.isPlaying;
    this.savePreferences();

    if (!this.isPlaying) {
      // Pause active track
      if (this.currentAudio) {
        this.fadeOut(this.currentAudio, 600);
      }
    } else {
      // Resume active track
      if (this.currentAudio && !this.isMuted) {
        this.currentAudio.play().then(() => {
          this.fadeIn(this.currentAudio!, this.volume, 800);
        }).catch(() => {});
      }
    }

    this.notifyListeners();
  }

  /**
   * Toggle Mute / Unmute
   */
  public toggleMute() {
    this.unlockAudio();
    this.isMuted = !this.isMuted;
    this.savePreferences();

    if (this.currentAudio) {
      if (this.isMuted) {
        this.currentAudio.volume = 0;
      } else {
        this.currentAudio.volume = this.volume;
        if (this.isPlaying && this.currentAudio.paused) {
          this.currentAudio.play().catch(() => {});
        }
      }
    }

    this.notifyListeners();
  }

  /**
   * Set Master Volume (0.0 to 1.0)
   */
  public setVolume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    this.volume = clamped;
    if (this.isMuted && clamped > 0) {
      this.isMuted = false;
    }
    this.savePreferences();

    if (this.currentAudio && !this.isMuted && !this.isFading) {
      this.currentAudio.volume = clamped;
    }

    this.notifyListeners();
  }

  public getState(): AudioManagerState {
    return {
      currentSection: this.currentSection,
      currentTrack: AUDIO_TRACKS[this.currentSection],
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      hasInteracted: this.hasInteracted,
      isFading: this.isFading,
    };
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    // Send immediate state update
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }
}

export const audioManager = AudioManager.getInstance();
