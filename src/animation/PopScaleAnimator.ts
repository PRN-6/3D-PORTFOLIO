import * as THREE from 'three';
import type { ComponentTransformSnapshot } from './TransformStore.ts';

export interface BasePivotConfig {
  componentName: string;
  baseYOffset: number; // Offset from object origin to bottom support plane
  popLift: number; // Gentle upward hop during emergence
}

/**
 * Handcrafted Paper Pop Easing:
 * 0.00 -> 0.45 -> 0.90 -> 1.08 (overshoot) -> 0.97 (correction) -> 1.00 (settle)
 */
export function popElasticOvershootEase(t: number): number {
  if (t <= 0.0) return 0.0;
  if (t >= 0.99999) return 1.0;

  // Elastic pop-up curve with distinct 1.08x overshoot and 0.97x rebound
  const c4 = (2 * Math.PI) / 3.5;
  if (t < 0.70) {
    // Sharp emergence to 1.08 peak
    const tau = t / 0.70;
    return Math.sin(tau * Math.PI * 0.5) * 1.08;
  } else {
    // Damped settling from 1.08 -> 0.97 -> 1.00
    const tau = (t - 0.70) / 0.30;
    const decay = Math.exp(-4.2 * tau);
    const osc = Math.cos(tau * c4);
    return 1.0 + 0.08 * decay * osc * (1.0 - tau);
  }
}

/**
 * Snappy Ease-Out-Back for Small Accessories & Cascading Props:
 */
export function propEaseOutBack(t: number): number {
  if (t <= 0.0) return 0.0;
  if (t >= 0.99999) return 1.0;
  const c1 = 1.65;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * PopScaleAnimator
 * Scales furniture and props upward from their bottom support contact planes
 * (preserving surface attachment) with tactile elastic pop-up overshoot.
 */
export class PopScaleAnimator {
  private static pivotCache = new Map<string, BasePivotConfig>();

  private static vScale = new THREE.Vector3();
  private static vPos = new THREE.Vector3();

  public static clearCache(): void {
    this.pivotCache.clear();
  }

  public static getOrCreateBasePivot(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot
  ): BasePivotConfig {
    const cached = this.pivotCache.get(orig.name);
    if (cached) return cached;

    // Estimate bottom plane offset
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Height offset from local origin down to bottom plane
    const baseYOffset = Math.max(0.1, size.y * 0.5);
    const popLift = Math.min(0.35, size.y * 0.15);

    const config: BasePivotConfig = {
      componentName: orig.name,
      baseYOffset,
      popLift,
    };

    this.pivotCache.set(orig.name, config);
    return config;
  }

  /**
   * Evaluates furniture and prop pop-up at normalized progress t in [0, 1].
   */
  public static evaluatePop(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number,
    isSmallProp = false
  ): void {
    // -------------------------------------------------------------------------
    // 1. BOUNDARY LOCK AT t >= 0.99999 (Zero Drift Guarantee)
    // -------------------------------------------------------------------------
    if (t >= 0.99999) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.copy(orig.localScale);
      obj.visible = true;
      return;
    }

    if (t <= 0.00001) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.set(0.001, 0.001, 0.001);
      obj.visible = false;
      return;
    }

    const config = this.getOrCreateBasePivot(obj, orig);
    const scaleFactor = isSmallProp ? propEaseOutBack(t) : popElasticOvershootEase(t);

    // Bottom-surface pivot pinning:
    // When scaling by S, the bottom plane shifts by (1 - S) * baseYOffset.
    // Compensate position.y so the object's bottom stays anchored to the supporting surface!
    const yCompensation = (scaleFactor - 1.0) * config.baseYOffset;
    const upwardHop = Math.sin(Math.PI * t) * config.popLift * (1.0 - t);

    this.vPos.set(
      orig.localPosition.x,
      orig.localPosition.y + yCompensation * 0.45 + upwardHop,
      orig.localPosition.z
    );
    obj.position.copy(this.vPos);

    // Scale with directional squash & stretch (grows vertically slightly faster than horizontally)
    const sxz = scaleFactor * (isSmallProp ? 1.0 : 0.96 + 0.04 * scaleFactor);
    const sy = scaleFactor * (isSmallProp ? 1.0 : 1.04 - 0.04 * scaleFactor);

    this.vScale.set(
      orig.localScale.x * Math.max(0.001, sxz),
      orig.localScale.y * Math.max(0.001, sy),
      orig.localScale.z * Math.max(0.001, sxz)
    );
    obj.scale.copy(this.vScale);
    obj.quaternion.copy(orig.localQuaternion);
    obj.visible = scaleFactor > 0.02;
  }
}
