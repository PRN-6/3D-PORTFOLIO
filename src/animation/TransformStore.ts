import * as THREE from 'three';
import type { AnalyzedComponent } from './ModelAnalyzer';

export interface ComponentTransformSnapshot {
  name: string;
  localPosition: THREE.Vector3;
  localQuaternion: THREE.Quaternion;
  localScale: THREE.Vector3;
  worldPosition: THREE.Vector3;
  worldQuaternion: THREE.Quaternion;
  visible: boolean;
}

export interface DriftReport {
  maxPositionDrift: number;
  maxRotationDrift: number;
  maxScaleDrift: number;
  driftByComponent: Record<string, number>;
}

/**
 * High-precision immutable transform cache.
 * Guarantees 0.000000 cumulative error when progress = 1.0 (assembled),
 * preventing floating point drift across millions of scrub or loop cycles.
 */
export class TransformStore {
  private snapshots: Map<string, ComponentTransformSnapshot> = new Map();

  /**
   * Captures the baseline pristine transforms from an analyzed component list.
   * If already captured for a component, preserves original snapshot to prevent overwrite.
   */
  public capture(components: AnalyzedComponent[], forceRecapture = false): void {
    for (const comp of components) {
      if (!forceRecapture && this.snapshots.has(comp.name)) {
        continue;
      }

      const obj = comp.object;
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      obj.getWorldPosition(worldPos);
      obj.getWorldQuaternion(worldQuat);

      this.snapshots.set(comp.name, {
        name: comp.name,
        localPosition: obj.position.clone(),
        localQuaternion: obj.quaternion.clone(),
        localScale: obj.scale.clone(),
        worldPosition: worldPos,
        worldQuaternion: worldQuat,
        visible: obj.visible,
      });
    }
  }

  /**
   * Restores every recorded component to its exact pristine local transform.
   */
  public restore(root: THREE.Object3D): void {
    this.snapshots.forEach((snap, name) => {
      const obj = root.getObjectByName(name);
      if (obj) {
        obj.position.copy(snap.localPosition);
        obj.quaternion.copy(snap.localQuaternion);
        obj.scale.copy(snap.localScale);
        obj.visible = snap.visible;
      }
    });
  }

  /**
   * Returns snapshot for a given component.
   */
  public get(name: string): ComponentTransformSnapshot | undefined {
    return this.snapshots.get(name);
  }

  /**
   * Checks if component exists in cache.
   */
  public has(name: string): boolean {
    return this.snapshots.has(name);
  }

  /**
   * Returns the total count of registered component snapshots.
   */
  public size(): number {
    return this.snapshots.size;
  }

  /**
   * Returns all stored snapshots as an iterable map.
   */
  public getAll(): Map<string, ComponentTransformSnapshot> {
    return this.snapshots;
  }

  /**
   * Measures current drift from original pristine transform.
   */
  public measureDrift(root: THREE.Object3D): DriftReport {
    let maxPos = 0;
    let maxRot = 0;
    let maxScale = 0;
    const driftByComponent: Record<string, number> = {};

    this.snapshots.forEach((snap, name) => {
      const obj = root.getObjectByName(name);
      if (obj) {
        const pDiff = obj.position.distanceTo(snap.localPosition);
        const rDiff = 2 * Math.acos(Math.min(1, Math.max(-1, Math.abs(obj.quaternion.dot(snap.localQuaternion)))));
        const sDiff = obj.scale.distanceTo(snap.localScale);

        if (pDiff > maxPos) maxPos = pDiff;
        if (rDiff > maxRot) maxRot = rDiff;
        if (sDiff > maxScale) maxScale = sDiff;

        driftByComponent[name] = pDiff;
      }
    });

    return {
      maxPositionDrift: maxPos,
      maxRotationDrift: maxRot,
      maxScaleDrift: maxScale,
      driftByComponent,
    };
  }

  /**
   * Clears the cached snapshots.
   */
  public clear(): void {
    this.snapshots.clear();
  }
}
