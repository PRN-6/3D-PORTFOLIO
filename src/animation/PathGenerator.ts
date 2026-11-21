import * as THREE from 'three';
import type { AnalyzedComponent } from './ModelAnalyzer.ts';
import type { ComponentTransformSnapshot } from './TransformStore.ts';
import type { AnimationPreset } from './AnimationPresets.ts';
import { SplineRailEngine, blenderGraphEase } from './SplineRailEngine.ts';

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export { blenderGraphEase };

/**
 * Procedural Kinematic Path Generator.
 * Powered by SplineRailEngine for authentic 3D NURBS/Catmull-Rom spline curve rails,
 * tangential velocity orientation, banking, and volume-preserving arrival settling.
 */
export class PathGenerator {
  /**
   * Evaluates the full transform of a component at normalized local time u in [0, 1].
   * u = 0.0 -> fully exploded / disassembled
   * u = 1.0 -> fully assembled (exact original transform)
   */
  public static evaluateTransform(
    comp: AnalyzedComponent,
    orig: ComponentTransformSnapshot,
    preset: AnimationPreset,
    u: number,
    outObject: THREE.Object3D,
    islandKey = 'HOME'
  ): void {
    // -------------------------------------------------------------------------
    // 1. BOUNDARY LOCK AT u = 1.0 (Exact 0.000000 mathematical identity)
    // -------------------------------------------------------------------------
    if (u >= 0.99999) {
      outObject.position.copy(orig.localPosition);
      outObject.quaternion.copy(orig.localQuaternion);
      outObject.scale.copy(orig.localScale);
      outObject.visible = true;
      return;
    }

    // -------------------------------------------------------------------------
    // 2. BOUNDARY LOCK AT u <= 0.0 (Fully exploded)
    // -------------------------------------------------------------------------
    if (u <= 0.00001) {
      SplineRailEngine.evaluate(comp, orig, preset, 0.0, outObject, islandKey);
      outObject.visible = false;
      return;
    }

    // -------------------------------------------------------------------------
    // 3. FULL 3D SPLINE RAIL EVALUATION WITH TANGENTIAL VELOCITY & BANKING
    // -------------------------------------------------------------------------
    SplineRailEngine.evaluate(comp, orig, preset, u, outObject, islandKey);
  }
}
