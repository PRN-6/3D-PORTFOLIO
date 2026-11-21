import * as THREE from 'three';
import { ModelAnalyzer, type ModelAnalysisResult } from './ModelAnalyzer.ts';
import { TransformStore } from './TransformStore.ts';
import { ANIMATION_PRESETS, type AnimationPreset, type PresetKey } from './AnimationPresets.ts';
import { AssemblyTimeline } from './AssemblyTimeline.ts';
import { PathGenerator } from './PathGenerator.ts';
import { SplineRailEngine } from './SplineRailEngine.ts';
import { popUpAssemblyEngine } from './PopUpAssemblyEngine.ts';
import { PapercraftMaterialManager } from './PapercraftMaterialManager.ts';

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
  showRails: boolean;
  isPapercraftMaterial: boolean;
  isIsometricCamera: boolean;
}

export type StateListener = (state: AssemblyEngineState) => void;

/**
 * Production Three.js Assembly Engine.
 * Mutates 3D components in place along 3D NURBS/Catmull-Rom spline curve rails
 * with tangential velocity alignment, banking, and tactile arrival settling.
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
  private showRails = true;
  private isIsometricCamera = false;

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

    // 4. Pre-generate 3D spline rails for all components
    SplineRailEngine.clearCache();
    for (const comp of this.analysis.components) {
      const orig = this.store.get(comp.name);
      if (orig) {
        SplineRailEngine.getOrCreateRail(comp, orig, this.preset, islandProfileName);
      }
    }

    // 5. Initialize Papercraft Pop-Up Assembly Engine
    popUpAssemblyEngine.init(root, islandProfileName);

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

      // Notify progress listeners periodically (every ~2% change to avoid spamming React)
      if (Math.abs(this.progress - this.lastNotifiedProgress) >= 0.02) {
        this.lastNotifiedProgress = this.progress;
        this.notifyState();
      }
    }
  }

  /**
   * Applies the calculated transforms at current progress to every component along 3D spline rails.
   */
  public applyTransforms(): void {
    if (!this.root || !this.analysis || !this.timeline) return;

    // If fully assembled (progress = 1.0), lock to pristine original transforms
    if (this.progress >= 0.99999) {
      this.restoreOriginals();
      return;
    }

    // Route to Papercraft Pop-Up Assembly Engine when Papercraft preset is active
    if (this.preset.key === 'PAPERCRAFT') {
      popUpAssemblyEngine.scrub(this.progress);
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
      PathGenerator.evaluateTransform(comp, orig, this.preset, u, obj, this.activeIsland);
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
   * Starts playback in specified direction.
   */
  public play(direction: PlaybackDirection = 'forward'): void {
    this.direction = direction;
    this.isPlaying = true;

    // If already at boundary, wrap or reset
    if (direction === 'forward' && this.progress >= 0.9999) {
      this.progress = 0.0;
      this.applyTransforms();
    } else if (direction === 'reverse' && this.progress <= 0.0001) {
      this.progress = 1.0;
      this.applyTransforms();
    }

    this.notifyState();
  }

  /**
   * Pauses playback.
   */
  public pause(): void {
    this.isPlaying = false;
    this.notifyState();
  }

  /**
   * Toggles playback between playing and paused.
   */
  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      // If at end, play reverse; if at start, play forward; otherwise continue current direction
      if (this.progress >= 0.9999) {
        this.play('reverse');
      } else if (this.progress <= 0.0001) {
        this.play('forward');
      } else {
        this.play(this.direction);
      }
    }
  }

  /**
   * Restarts the animation from 0.0 and plays forward.
   */
  public restart(): void {
    this.progress = 0.0;
    this.direction = 'forward';
    this.isPlaying = true;
    this.applyTransforms();
    this.notifyState();
  }

  /**
   * Sets playback speed multiplier (e.g. 0.5x, 1.0x, 2.0x).
   */
  public setSpeed(speedMultiplier: number): void {
    this.speed = Math.max(0.1, Math.min(5.0, speedMultiplier));
    this.notifyState();
  }

  /**
   * Selects an animation preset (SPIRAL, SMOOTH, DRAMATIC, MINIMAL).
   */
  public setPreset(key: PresetKey): void {
    const selected = ANIMATION_PRESETS[key];
    if (selected) {
      this.preset = selected;
      if (this.analysis) {
        this.timeline = new AssemblyTimeline(this.analysis.components, this.preset);
        SplineRailEngine.clearCache();
        for (const comp of this.analysis.components) {
          const orig = this.store.get(comp.name);
          if (orig) {
            SplineRailEngine.getOrCreateRail(comp, orig, this.preset, this.activeIsland);
          }
        }
      }
      this.applyTransforms();
      this.notifyState();
    }
  }

  /**
   * Toggles 3D spline guide rails visibility.
   */
  public toggleRails(): void {
    this.showRails = !this.showRails;
    this.notifyState();
  }

  /**
   * Explicitly sets 3D spline guide rails visibility.
   */
  public setShowRails(show: boolean): void {
    this.showRails = show;
    this.notifyState();
  }

  /**
   * Toggles handcrafted papercraft cardstock materials.
   */
  public togglePapercraftMaterial(): void {
    if (this.root) {
      PapercraftMaterialManager.togglePapercraft(this.root);
      this.notifyState();
    }
  }

  /**
   * Toggles locked orthographic isometric studio camera.
   */
  public toggleIsometricCamera(): void {
    this.isIsometricCamera = !this.isIsometricCamera;
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
      showRails: this.showRails,
      isPapercraftMaterial: PapercraftMaterialManager.isPapercraft(),
      isIsometricCamera: this.isIsometricCamera,
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
    if (this.root) {
      PapercraftMaterialManager.restoreOriginalMaterials(this.root);
    }
    popUpAssemblyEngine.dispose();
    this.root = null;
    this.analysis = null;
    this.timeline = null;
    SplineRailEngine.clearCache();
    if (typeof window !== 'undefined' && (window as any).__ASSEMBLY_ENGINE__ === this) {
      delete (window as any).__ASSEMBLY_ENGINE__;
    }
  }
}

// Global singleton instance for app-wide coordination
export const assemblyEngine = new AssemblyEngine();
