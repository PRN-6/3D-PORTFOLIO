import * as THREE from 'three';
import { ModelAnalyzer, type AnalyzedComponent } from './ModelAnalyzer.ts';
import { TransformStore, type ComponentTransformSnapshot } from './TransformStore.ts';
import { HingeAnimator } from './HingeAnimator.ts';
import { PopScaleAnimator } from './PopScaleAnimator.ts';
import { FoliageAnimator } from './FoliageAnimator.ts';
import { FluidStretchFlightAnimator } from './FluidStretchFlightAnimator.ts';
import { PapercraftMaterialManager } from './PapercraftMaterialManager.ts';

export type PopUpCategory =
  | 'FLOOR'
  | 'WALL_HINGE'
  | 'PRIMARY_FURNITURE'
  | 'SECONDARY_PROP'
  | 'FOLIAGE'
  | 'CHARACTER'
  | 'EFFECT'
  | 'FLUID_STRETCH';

export interface PopUpComponentMeta {
  component: AnalyzedComponent;
  category: PopUpCategory;
  timingWindow: [number, number]; // [start, end] in [0, 1]
  staggerIndex: number;
}

export type PlaybackDirection = 'forward' | 'reverse';

export interface PopUpEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  direction: PlaybackDirection;
  progress: number;
  speed: number;
  duration: number; // in seconds
  activeIsland: string;
  componentCount: number;
  isPapercraftMaterial: boolean;
  isIsometricCamera: boolean;
}

export type PopUpStateListener = (state: PopUpEngineState) => void;

/**
 * PopUpAssemblyEngine
 * Drives the Master Cinematic 3D Papercraft Pop-Up Assembly Animation:
 * 1. Floor & Foundation unfold into position (Frames 1–16).
 * 2. Walls fold upward from bottom hinges like pop-up book flaps (Frames 5–25).
 * 3. Primary furniture pops into place with elastic overshoot (Frames 12–40).
 * 4. Secondary props & accessories cascade in a domino wave (Frames 20–55).
 * 5. Sweeping foliage and decorative ribbons arc into position (Frames 15–60).
 * 6. Non-destructive material styling and locked orthographic isometric framing.
 */
export class PopUpAssemblyEngine {
  private root: THREE.Object3D | null = null;
  private store: TransformStore = new TransformStore();
  private metaList: PopUpComponentMeta[] = [];
  private metaMap = new Map<string, PopUpComponentMeta>();

  private progress = 1.0; // Defaults to fully assembled
  private isPlaying = false;
  private direction: PlaybackDirection = 'forward';
  private speed = 1.0;
  private duration = 2.0; // 2.0 seconds default (60 frames at 30fps) matching HerosHome HTML
  private activeIsland = 'HOME';
  private isIsometricCamera = false;

  private listeners: Set<PopUpStateListener> = new Set();
  private lastNotifiedProgress = 1.0;

  // Preallocated temp vector for floor emergence
  private vFloorPos = new THREE.Vector3();
  private vFloorScale = new THREE.Vector3();

  public init(root: THREE.Object3D, islandProfileName = 'HOME'): void {
    this.root = root;
    this.activeIsland = islandProfileName;

    // 1. Analyze model hierarchy
    const analysis = ModelAnalyzer.analyze(root, islandProfileName);

    // 2. Capture pristine initial transforms in high-precision store
    this.store.capture(analysis.components);

    // 3. Clear animator caches
    HingeAnimator.clearCache();
    PopScaleAnimator.clearCache();
    FoliageAnimator.clearCache();

    // 4. Classify each component into papercraft pop-up choreography stages
    this.metaList = [];
    this.metaMap.clear();

    // Exact choreography definitions from HerosHome Papercraft Pop-Up Assembly HTML
    const fTiming: Record<string, [number, number, number]> = {
      FloatingIsland: [1, 16, -0.55],
      Meadow: [5, 16, -0.08],
      WaystonePath: [7, 16, -0.06],
    };

    const hSpec: Record<string, { start: number; end: number; edge: string; axis: string; angle: number }> = {
      BackBoundary: { start: 5, end: 19, edge: 'back', axis: 'x', angle: Math.PI * 0.48 },
      TimberFrame: { start: 7, end: 22, edge: 'back', axis: 'x', angle: Math.PI * 0.5 },
      PorchAndOakDoor: { start: 10, end: 24, edge: 'front', axis: 'x', angle: -Math.PI * 0.5 },
      ShingledGables: { start: 13, end: 25, edge: 'back', axis: 'x', angle: Math.PI * 0.44 },
      FieldstoneChimney: { start: 15, end: 25, edge: 'left', axis: 'z', angle: Math.PI * 0.42 },
    };

    const pOrder = [
      'PracticeYard', 'GardenSupplies', 'HearthsideSeats', 'Campfire',
      'Woodpile', 'GardenStool', 'MainTree', 'WindwardFir', 'YoungFir',
      'Frieren', 'Himmel', 'Heiter', 'Eisen'
    ];

    const sOrder = [
      'CropPatchCarrots', 'CropPatchCabbages', 'CropPatchSquash', 'Scarecrow',
      'WateringCan', 'WeaponRack', 'TrainingDummy', 'PracticeTarget', 'WoodenSword',
      'PorchSign', 'GardenGateLantern', 'HearthFlame1', 'HearthFlame2', 'HearthFlame3',
      'ChimneyWisp1', 'ChimneyWisp2', 'ChimneyWisp3', 'ChimneyWisp4'
    ];

    const comps = analysis.components;
    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i];
      const name = comp.name.toLowerCase();
      let category: PopUpCategory;
      let timingWindow: [number, number];

      // Exact match against HerosHome specification
      if (fTiming[comp.name]) {
        category = 'FLOOR';
        timingWindow = [fTiming[comp.name][0] / 60, fTiming[comp.name][1] / 60];
      } else if (hSpec[comp.name]) {
        category = 'WALL_HINGE';
        timingWindow = [hSpec[comp.name].start / 60, hSpec[comp.name].end / 60];
      } else if (pOrder.includes(comp.name)) {
        category = 'PRIMARY_FURNITURE';
        const pIdx = pOrder.indexOf(comp.name);
        const pStart = Math.min(30, 12 + pIdx * 1.4);
        timingWindow = [pStart / 60, Math.min(40, pStart + 11) / 60];
      } else if (sOrder.includes(comp.name)) {
        category = 'SECONDARY_PROP';
        const sIdx = sOrder.indexOf(comp.name);
        const sStart = Math.min(47, 20 + sIdx * 1.6);
        timingWindow = [sStart / 60, Math.min(55, sStart + 8) / 60];
      } else if (comp.name === 'CliffIvyAndRoots') {
        category = 'FOLIAGE';
        timingWindow = [15 / 60, 43 / 60];
      } else if (comp.name === 'WildflowerBanks') {
        category = 'FOLIAGE';
        timingWindow = [26 / 60, 54 / 60];
      }
      // General fallbacks for multi-island compatibility (Archive, Forest, Workshop)
      else if (
        name.includes('island') ||
        name.includes('meadow') ||
        name.includes('waystone') ||
        name.includes('boundary') ||
        name.includes('ground') ||
        name.includes('terrain') ||
        name.includes('floor')
      ) {
        category = 'FLOOR';
        timingWindow = [0.0, 0.28];
      } else if (
        name.includes('timber') ||
        name.includes('wall') ||
        name.includes('porch') ||
        name.includes('door') ||
        name.includes('chimney') ||
        name.includes('gable') ||
        name.includes('roof') ||
        name.includes('library') ||
        name.includes('pillar') ||
        name.includes('arch') ||
        name.includes('workshop')
      ) {
        category = 'WALL_HINGE';
        const wallOffset = (i % 4) * 0.04;
        timingWindow = [0.08 + wallOffset, 0.42 + wallOffset];
      } else if (
        name.includes('seat') ||
        name.includes('bench') ||
        name.includes('table') ||
        name.includes('stool') ||
        name.includes('woodpile') ||
        name.includes('scarecrow') ||
        name.includes('dummy') ||
        name.includes('target') ||
        name.includes('rack') ||
        name.includes('desk') ||
        name.includes('shelves') ||
        name.includes('station')
      ) {
        category = 'PRIMARY_FURNITURE';
        const furnOffset = (i % 6) * 0.035;
        timingWindow = [0.20 + furnOffset, 0.62 + furnOffset];
      } else if (
        name.includes('tree') ||
        name.includes('fir')
      ) {
        category = 'FLUID_STRETCH';
        const treeOffset = (i % 4) * 0.05;
        timingWindow = [0.20 + treeOffset, 0.72 + treeOffset];
      } else if (
        name.includes('frieren') ||
        name.includes('himmel') ||
        name.includes('heiter') ||
        name.includes('eisen')
      ) {
        category = 'FLUID_STRETCH';
        const charOffset = (i % 4) * 0.04;
        timingWindow = [0.40 + charOffset, 0.88 + charOffset];
      } else if (
        name.includes('wildflower') ||
        name.includes('ivy') ||
        name.includes('flower') ||
        name.includes('shrub') ||
        name.includes('vegetation')
      ) {
        category = 'FOLIAGE';
        const folOffset = (i % 5) * 0.03;
        timingWindow = [0.25 + folOffset, 0.85 + folOffset];
      } else if (
        name.includes('wisp') ||
        name.includes('flame') ||
        name.includes('mote')
      ) {
        category = 'EFFECT';
        timingWindow = [0.60, 0.98];
      } else {
        category = 'SECONDARY_PROP';
        const propOffset = (i % 12) * 0.032;
        timingWindow = [0.32 + propOffset, 0.78 + propOffset];
      }

      const meta: PopUpComponentMeta = {
        component: comp,
        category,
        timingWindow,
        staggerIndex: i,
      };

      this.metaList.push(meta);
      this.metaMap.set(comp.name, meta);
    }

    // Default to fully assembled
    this.progress = 1.0;
    this.isPlaying = false;
    this.restoreOriginals();

    if (typeof window !== 'undefined') {
      (window as any).__POPUP_ASSEMBLY_ENGINE__ = this;
    }

    this.notifyState();
  }

  /**
   * Per-frame animation tick called by useFrame.
   */
  public update(deltaSeconds: number): void {
    if (!this.root || this.metaList.length === 0) return;

    if (this.isPlaying) {
      const deltaP = (deltaSeconds * this.speed) / Math.max(0.2, this.duration);

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

      if (Math.abs(this.progress - this.lastNotifiedProgress) >= 0.02) {
        this.lastNotifiedProgress = this.progress;
        this.notifyState();
      }
    }
  }

  /**
   * Evaluates all components based on current progress.
   */
  public applyTransforms(): void {
    if (!this.root || this.metaList.length === 0) return;

    // 100% Exact Boundary Lock at progress = 1.0
    if (this.progress >= 0.99999) {
      this.restoreOriginals();
      return;
    }

    for (let i = 0; i < this.metaList.length; i++) {
      const meta = this.metaList[i];
      const orig = this.store.get(meta.component.name);
      if (!orig) continue;

      const obj = this.root.getObjectByName(meta.component.name);
      if (!obj) continue;

      // Compute normalized component local time t in [0, 1]
      const [tStart, tEnd] = meta.timingWindow;
      const rawT = THREE.MathUtils.clamp((this.progress - tStart) / (tEnd - tStart), 0, 1);

      // Delegate to category-specific kinematic animator
      switch (meta.category) {
        case 'FLOOR':
          this.evaluateFloor(obj, orig, rawT);
          break;
        case 'WALL_HINGE':
          HingeAnimator.evaluateHinge(obj, orig, rawT);
          break;
        case 'PRIMARY_FURNITURE':
          PopScaleAnimator.evaluatePop(obj, orig, rawT, false);
          break;
        case 'SECONDARY_PROP':
          PopScaleAnimator.evaluatePop(obj, orig, rawT, true);
          break;
        case 'FOLIAGE':
          FoliageAnimator.evaluateFoliage(obj, orig, rawT);
          break;
        case 'FLUID_STRETCH':
          FluidStretchFlightAnimator.evaluateFlight(obj, orig, rawT);
          break;
        case 'CHARACTER':
        case 'EFFECT':
          PopScaleAnimator.evaluatePop(obj, orig, rawT, true);
          break;
      }
    }
  }

  /**
   * Stage 1: Floor & Foundation emergence from below with subtle elastic overshoot.
   */
  private evaluateFloor(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number
  ): void {
    if (t >= 0.99999) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.copy(orig.localScale);
      obj.visible = true;
      return;
    }

    if (t <= 0.00001) {
      obj.position.set(orig.localPosition.x, orig.localPosition.y - 3.5, orig.localPosition.z);
      obj.scale.set(orig.localScale.x * 0.1, orig.localScale.y * 0.1, orig.localScale.z * 0.1);
      obj.visible = false;
      return;
    }

    // Ease out with subtle elastic overshoot
    const inv = 1.0 - t;
    const easedT = 1.0 - inv * inv * inv;
    const overshoot = t > 0.65 ? 0.04 * Math.exp(-5.0 * (t - 0.65) / 0.35) * Math.sin((t - 0.65) / 0.35 * Math.PI) : 0;

    const ySubmerged = (1.0 - (easedT + overshoot)) * -3.5;
    this.vFloorPos.set(
      orig.localPosition.x,
      orig.localPosition.y + ySubmerged,
      orig.localPosition.z
    );
    obj.position.copy(this.vFloorPos);

    const scaleMult = Math.min(1.0, (easedT + overshoot));
    this.vFloorScale.set(
      orig.localScale.x * scaleMult,
      orig.localScale.y * Math.min(1.0, t * 1.5),
      orig.localScale.z * scaleMult
    );
    obj.scale.copy(this.vFloorScale);
    obj.quaternion.copy(orig.localQuaternion);
    obj.visible = scaleMult > 0.01;
  }

  public scrub(targetProgress: number): void {
    this.progress = THREE.MathUtils.clamp(targetProgress, 0.0, 1.0);
    this.applyTransforms();
    this.lastNotifiedProgress = this.progress;
    this.notifyState();
  }

  public play(direction: PlaybackDirection = 'forward'): void {
    this.direction = direction;
    this.isPlaying = true;

    if (direction === 'forward' && this.progress >= 0.9999) {
      this.progress = 0.0;
      this.applyTransforms();
    } else if (direction === 'reverse' && this.progress <= 0.0001) {
      this.progress = 1.0;
      this.applyTransforms();
    }

    this.notifyState();
  }

  public pause(): void {
    this.isPlaying = false;
    this.notifyState();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.progress >= 0.9999) {
        this.play('reverse');
      } else if (this.progress <= 0.0001) {
        this.play('forward');
      } else {
        this.play(this.direction);
      }
    }
  }

  public restart(): void {
    this.progress = 0.0;
    this.direction = 'forward';
    this.isPlaying = true;
    this.applyTransforms();
    this.notifyState();
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(5.0, speed));
    this.notifyState();
  }

  public setDuration(seconds: number): void {
    this.duration = Math.max(0.5, Math.min(15.0, seconds));
    this.notifyState();
  }

  public togglePapercraftMaterial(): void {
    if (this.root) {
      PapercraftMaterialManager.togglePapercraft(this.root);
      this.notifyState();
    }
  }

  public toggleIsometricCamera(): void {
    this.isIsometricCamera = !this.isIsometricCamera;
    this.notifyState();
  }

  public restoreOriginals(): void {
    if (this.root) {
      this.store.restore(this.root);
    }
  }

  public getState(): PopUpEngineState {
    return {
      isInitialized: this.root !== null && this.metaList.length > 0,
      isPlaying: this.isPlaying,
      direction: this.direction,
      progress: this.progress,
      speed: this.speed,
      duration: this.duration,
      activeIsland: this.activeIsland,
      componentCount: this.metaList.length,
      isPapercraftMaterial: PapercraftMaterialManager.isPapercraft(),
      isIsometricCamera: this.isIsometricCamera,
    };
  }

  public subscribe(listener: PopUpStateListener): () => void {
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
    PapercraftMaterialManager.dispose();
    this.root = null;
    this.metaList = [];
    this.metaMap.clear();
    if (typeof window !== 'undefined' && (window as any).__POPUP_ASSEMBLY_ENGINE__ === this) {
      delete (window as any).__POPUP_ASSEMBLY_ENGINE__;
    }
  }
}

export const popUpAssemblyEngine = new PopUpAssemblyEngine();
