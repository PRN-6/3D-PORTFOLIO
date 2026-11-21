import * as THREE from 'three';
import type { ComponentTransformSnapshot } from './TransformStore.ts';

export interface FoliageConfig {
  componentName: string;
  stemPivot: THREE.Vector3;
  curveArcOffset: THREE.Vector3;
  swayAxis: THREE.Vector3;
}

/**
 * Damped swaying follow-through matching user's papercraft choreography:
 */
export function dampedSway(t: number, amplitude = 0.045, cycles = 2): number {
  const x = Math.max(0, Math.min(1, t));
  if (x <= 0 || x >= 1) return 0;
  return amplitude * Math.pow(1 - x, 2) * Math.sin(Math.PI * x) * Math.sin(cycles * Math.PI * 2 * x);
}

/**
 * FoliageAnimator
 * Coordinates curved growth trajectories, arc sweeping, and delicate secondary
 * sway settling for trees, firs, wildflower banks, ivy, and foliage elements.
 */
export class FoliageAnimator {
  private static foliageCache = new Map<string, FoliageConfig>();

  private static vPos = new THREE.Vector3();
  private static vScale = new THREE.Vector3();
  private static qSway = new THREE.Quaternion();
  private static qResult = new THREE.Quaternion();

  public static clearCache(): void {
    this.foliageCache.clear();
  }

  public static getOrCreateFoliageConfig(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot
  ): FoliageConfig {
    const cached = this.foliageCache.get(orig.name);
    if (cached) return cached;

    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const stemPivot = new THREE.Vector3(center.x, box.min.y, center.z);
    // Sweeping lateral arc based on radial angle
    const angle = Math.atan2(orig.localPosition.z, orig.localPosition.x) || 0.8;
    const curveArcOffset = new THREE.Vector3(
      Math.cos(angle + 0.4) * 2.2,
      size.y * 0.45,
      Math.sin(angle + 0.4) * 2.2
    );

    const swayAxis = new THREE.Vector3(
      Math.sin(angle * 2.1),
      0,
      Math.cos(angle * 2.1)
    ).normalize();

    const config: FoliageConfig = {
      componentName: orig.name,
      stemPivot,
      curveArcOffset,
      swayAxis,
    };

    this.foliageCache.set(orig.name, config);
    return config;
  }

  /**
   * Evaluates foliage growth along curved arc with secondary follow-through settling.
   */
  public static evaluateFoliage(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number
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

    const config = this.getOrCreateFoliageConfig(obj, orig);

    // Eased growth factor (smooth cubic)
    const inv = 1.0 - t;
    const easedT = 1.0 - inv * inv * inv;

    // Curved sweeping arc offset (maximum at mid-growth t ~ 0.45, fades to 0 at t=1)
    const arcMultiplier = Math.sin(Math.PI * t) * (1.0 - t * 0.65);
    this.vPos.set(
      orig.localPosition.x + config.curveArcOffset.x * arcMultiplier,
      orig.localPosition.y + config.curveArcOffset.y * arcMultiplier,
      orig.localPosition.z + config.curveArcOffset.z * arcMultiplier
    );
    obj.position.copy(this.vPos);

    // Secondary delicate leaf sway follow-through (fading to 0 at t=1)
    if (t > 0.40) {
      const swayFactor = (t - 0.40) / 0.60;
      const decay = Math.exp(-4.5 * swayFactor);
      const swayAngle = 0.08 * decay * Math.sin(swayFactor * Math.PI * 4.0) * (1.0 - swayFactor);
      this.qSway.setFromAxisAngle(config.swayAxis, swayAngle);
      this.qResult.copy(orig.localQuaternion).multiply(this.qSway);
      obj.quaternion.copy(this.qResult);
    } else {
      obj.quaternion.copy(orig.localQuaternion);
    }

    // Scale growth from stem base
    const scaleFactor = Math.min(1.0, easedT * 1.05);
    this.vScale.set(
      orig.localScale.x * scaleFactor,
      orig.localScale.y * easedT,
      orig.localScale.z * scaleFactor
    );
    obj.scale.copy(this.vScale);
    obj.visible = scaleFactor > 0.02;
  }
}
