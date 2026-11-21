import * as THREE from 'three';
import type { ComponentTransformSnapshot } from './TransformStore';

/**
 * FluidStretchFlightAnimator
 *
 * Implements the "Created On The Spot Out Of Nothing" 3D Genesis reveal:
 * 1. At t = 0, there is NOTHING there (scale = 0.0001, visible = false).
 * 2. On the exact spot where each 3D element belongs, it emerges out of thin air.
 * 3. In the initial phase (t in [0, 0.65]), it shoots upward as a smooth, stretched stick/spindle
 *    (longitudinal vertical stretch 3.6x - 4.0x, radial width compression 0.28x).
 * 4. At the apex (t in [0.65, 0.88]), right on the spot, it contracts its stretch and blossoms
 *    laterally into its true 3D mesh geometry (foliage canopy, branches, robes, character limbs).
 * 5. Touchdown (t in [0.88, 1.00]) settles with soft impact squash and damped harmonic settling.
 * 6. Guarantees 0.000000 drift at t = 1.0.
 */
export class FluidStretchFlightAnimator {
  private static vScale = new THREE.Vector3();

  /**
   * Evaluates the on-the-spot creation animation for a component at local time t in [0, 1].
   */
  public static evaluateFlight(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number,
    liftHeight = 2.6
  ): void {
    // 1. Boundary Lock at t >= 0.99999 (Zero Drift Guarantee)
    if (t >= 0.99999) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.copy(orig.localScale);
      obj.visible = true;
      return;
    }

    // 2. Boundary Lock at t <= 0.00001 (NOTHING THERE - Out of Nothing)
    if (t <= 0.00001) {
      obj.position.set(orig.localPosition.x, orig.localPosition.y - 0.4, orig.localPosition.z);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.set(0.0001, 0.0001, 0.0001);
      obj.visible = false;
      return;
    }

    obj.visible = true;

    // Authentic Blender F-Curve easing
    const inv = 1.0 - t;
    const easedT = Math.min(1.0, 1.0 - inv * inv * inv * (1.0 + 2.4 * t));

    let sY = 1.0;
    let sXZ = 1.0;
    let currentY = orig.localPosition.y;

    if (easedT < 0.78) {
      // PHASE 1: Created right on the spot out of nothing -> shoots up as stretched stick/spindle
      const shootT = Math.min(1.0, easedT / 0.78);
      currentY = orig.localPosition.y + liftHeight * (1.0 - Math.pow(1.0 - shootT, 2));

      sY = Math.min(3.8, shootT * 4.4);
      sXZ = Math.max(0.04, Math.min(0.28, shootT * 0.32));
    } else if (easedT < 0.92) {
      // PHASE 2: Right on the spot, blooms and expands into true 3D shape
      const bloomT = (easedT - 0.78) / 0.14;
      const smoothBloom = bloomT * bloomT * (3.0 - 2.0 * bloomT);

      currentY = orig.localPosition.y + liftHeight * (1.0 - smoothBloom) * 0.35;
      sY = THREE.MathUtils.lerp(3.8, 0.90, smoothBloom);  // contract elongation
      sXZ = THREE.MathUtils.lerp(0.28, 1.15, smoothBloom); // blossom full 3D shape
    } else {
      // PHASE 3: Touchdown impact squash & harmonic settle
      const settleT = (easedT - 0.92) / 0.08;
      const decay = Math.exp(-8.0 * settleT);
      const osc = Math.cos(settleT * Math.PI * 4.0);

      currentY = orig.localPosition.y;
      sY = 1.0 - 0.10 * decay * osc;
      sXZ = 1.0 + 0.06 * decay * osc;
    }

    // Set position and orientation (created on the spot with resting rotation)
    obj.position.set(orig.localPosition.x, currentY, orig.localPosition.z);
    obj.quaternion.copy(orig.localQuaternion);

    // Apply vertical stretch / horizontal bloom
    this.vScale.set(
      orig.localScale.x * sXZ,
      orig.localScale.y * sY,
      orig.localScale.z * sXZ
    );

    obj.scale.copy(this.vScale);
  }
}
