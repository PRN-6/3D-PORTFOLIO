import * as THREE from 'three';
import { ModelAnalyzer, type ModelAnalysisResult } from './ModelAnalyzer';
import { TransformStore } from './TransformStore';
import { ANIMATION_PRESETS, type AnimationPreset, type PresetKey } from './AnimationPresets';
import { AssemblyTimeline } from './AssemblyTimeline';
import { PathGenerator } from './PathGenerator';

export type PlaybackDirection = 'forward' | 'reverse';

export interface AssemblyEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  direction: PlaybackDirection;
  progress: number; // 0.0 (fully exploded) to 1.0 (fully assembled)
  speed: number;
  presetKey: PresetKey;
  activeIsland: string;
  componentCount: number;
}

export type StateListener = (state: AssemblyEngineState) => void;

/**
 * Production Three.js Assembly Engine.
 * Mutates 3D components in place along curved spiral trajectories without React render overhead.
 */
export class AssemblyEngine {
  private root: THREE.Object3D | null = null;
  private analysis: ModelAnalysisResult | null = null;
  private store: TransformStore = new TransformStore();
  private timeline: AssemblyTimeline | null = null;
  private preset: AnimationPreset = ANIMATION_PRESETS.SPIRAL;

  private progress = 1.0; // Defaults to fully assembled state
  private isPlaying = false;
  private direction: PlaybackDirection = 'forward';
  private speed = 1.0;
  private activeIsland = 'HOME';

  private listeners: Set<StateListener> = new Set();
  private lastNotifiedProgress = 1.0;

  /**
   * Initializes the engine with a Three.js scene root.
   */
  public init(root: THREE.Object3D, islandProfileName = 'HOME'): void {
    this.root = root;
    this.activeIsland = islandProfileName;

    // 1. Analyze model hierarchy
    this.analysis = ModelAnalyzer.analyze(root, islandProfileName);

    // 2. Capture pristine initial transforms in high-precision store
    this.store.capture(this.analysis.components);

    // 3. Build assembly timeline
    this.timeline = new AssemblyTimeline(this.analysis.components, this.preset);

    // Default to fully assembled
    this.progress = 1.0;
    this.isPlaying = false;
    this.restoreOriginals();

    // Register on window for debugging & automated testing
    if (typeof window !== 'undefined') {
      (window as any).__ASSEMBLY_ENGINE__ = this;
    }

    this.notifyState();
  }

  /**
   * Per-frame animation tick. Called by useFrame in the React Three Fiber loop.
   */
  public update(deltaSeconds: number): void {
    if (!this.root || !this.analysis || !this.timeline) return;

    if (this.isPlaying) {
      const duration =
        this.direction === 'forward'
          ? this.preset.duration
          : this.preset.disassemblyDuration;

      const deltaP = (deltaSeconds * this.speed) / Math.max(0.1, duration);

      if (this.direction === 'forward') {
        this.progress = Math.min(1.0, this.progress + deltaP);
        if (this.progress >= 1.0) {
          this.progress = 1.0;
          this.isPlaying = false;
          this.restoreOriginals();
          this.notifyState();
        }
      } else {
        this.progress = Math.max(0.0, this.progress - deltaP);
        if (this.progress <= 0.0) {
          this.progress = 0.0;
          this.isPlaying = false;
          this.notifyState();
        }
      }

      this.applyTransforms();

      // Notify progress listeners periodically (every ~3% change to avoid spamming React)
      if (Math.abs(this.progress - this.lastNotifiedProgress) >= 0.02) {
        this.lastNotifiedProgress = this.progress;
        this.notifyState();
      }
    }
  }

  /**
   * Applies the calculated transforms at current progress to every component.
   */
  public applyTransforms(): void {
    if (!this.root || !this.analysis || !this.timeline) return;

    // If fully assembled (progress = 1.0), lock to pristine original transforms
    if (this.progress >= 0.99999) {
      this.restoreOriginals();
      return;
    }

    const comps = this.analysis.components;
    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i];
      const orig = this.store.get(comp.name);
      if (!orig) continue;

      const obj = this.root.getObjectByName(comp.name);
      if (!obj) continue;

      // Local progress for this specific component
      const u = this.timeline.getComponentProgress(comp.name, this.progress);
      PathGenerator.evaluateTransform(comp, orig, this.preset, u, obj);
    }
  }

  /**
   * Scrubs the animation to an arbitrary progress value in [0, 1].
   */
  public scrub(targetProgress: number): void {
    this.progress = THREE.MathUtils.clamp(targetProgress, 0.0, 1.0);
    this.applyTransforms();
    this.lastNotifiedProgress = this.progress;
    this.notifyState();
  }

  /**
   * Begins playback in the specified direction.
   */
  public play(dir: PlaybackDirection = 'forward'): void {
    this.direction = dir;

    if (dir === 'forward' && this.progress >= 0.999) {
      this.progress = 0.0; // Restart from exploded state
    } else if (dir === 'reverse' && this.progress <= 0.001) {
      this.progress = 1.0; // Restart from assembled state
    }

    this.isPlaying = true;
    this.notifyState();
  }

  /**
   * Pauses active playback.
   */
  public pause(): void {
    this.isPlaying = false;
    this.notifyState();
  }

  /**
   * Resumes active playback.
   */
  public resume(): void {
    this.isPlaying = true;
    this.notifyState();
  }

  /**
   * Toggles play/pause state.
   */
  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      // If assembled, disassemble; if exploded, assemble
      if (this.progress >= 0.99) {
        this.play('reverse');
      } else {
        this.play('forward');
      }
    }
  }

  /**
   * Restarts the current assembly from 0.0.
   */
  public restart(): void {
    this.progress = 0.0;
    this.direction = 'forward';
    this.isPlaying = true;
    this.applyTransforms();
    this.notifyState();
  }

  /**
   * Reverses current playback direction.
   */
  public reverse(): void {
    this.direction = this.direction === 'forward' ? 'reverse' : 'forward';
    this.isPlaying = true;
    this.notifyState();
  }

  /**
   * Sets the playback speed multiplier.
   */
  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(4.0, speed));
    this.notifyState();
  }

  /**
   * Switches the active cinematic preset.
   */
  public setPreset(key: PresetKey): void {
    const p = ANIMATION_PRESETS[key];
    if (!p) return;
    this.preset = p;

    if (this.analysis) {
      this.timeline = new AssemblyTimeline(this.analysis.components, this.preset);
    }

    this.applyTransforms();
    this.notifyState();
  }

  /**
   * Restores all components to their 100% exact original transforms.
   */
  public restoreOriginals(): void {
    if (this.root) {
      this.store.restore(this.root);
    }
  }

  /**
   * Returns current engine state.
   */
  public getState(): AssemblyEngineState {
    return {
      isInitialized: this.root !== null && this.analysis !== null,
      isPlaying: this.isPlaying,
      direction: this.direction,
      progress: this.progress,
      speed: this.speed,
      presetKey: this.preset.key,
      activeIsland: this.activeIsland,
      componentCount: this.analysis ? this.analysis.components.length : 0,
    };
  }

  /**
   * Subscribes a listener to state changes.
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public dispose(): void {
    this.listeners.clear();
    this.restoreOriginals();
    this.root = null;
    this.analysis = null;
    this.timeline = null;
    if (typeof window !== 'undefined' && (window as any).__ASSEMBLY_ENGINE__ === this) {
      delete (window as any).__ASSEMBLY_ENGINE__;
    }
  }
}

// Global singleton instance for app-wide coordination
export const assemblyEngine = new AssemblyEngine();
