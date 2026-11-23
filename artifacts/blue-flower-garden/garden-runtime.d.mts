import type { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';
export interface GardenRuntime {
  mixer: AnimationMixer;
  actions: AnimationAction[];
  setTime(seconds: number): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}
export function createGardenRuntime(scene: Object3D, clips: AnimationClip[], options?: {
  shadows?: boolean;
  reducedMotion?: boolean;
}): GardenRuntime;
