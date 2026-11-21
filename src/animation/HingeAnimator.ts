import * as THREE from 'three';
import type { ComponentTransformSnapshot } from './TransformStore.ts';

export interface HingeConfig {
  componentName: string;
  hingeAxis: THREE.Vector3; // Unit axis of rotation (e.g. [1, 0, 0] or [0, 0, 1])
  hingePivot: THREE.Vector3; // Bottom hinge edge point in local coordinates
  foldAngle: number; // Initial fold angle in radians (e.g. -Math.PI * 0.48, ~85 deg)
}

/**
 * Custom Hinge Easing with Pop-Up Book Flap Overshoot:
 * Rises rapidly from flat, passes upright by ~4 degrees, and elastically settles.
 */
export function hingeOvershootEase(t: number): number {
  if (t <= 0.0) return 0.0;
  if (t >= 0.99999) return 1.0;

  // Base cubic rise
  const inv = 1.0 - t;
  const base = 1.0 - inv * inv * inv;

  // Elastic overshoot in the final 35% of the unfold phase
  let overshoot = 0.0;
  if (t > 0.65) {
    const tau = (t - 0.65) / 0.35; // 0.0 to 1.0
    const decay = Math.exp(-4.5 * tau);
    overshoot = 0.065 * decay * Math.sin(tau * Math.PI);
  }

  return base + overshoot;
}

/**
 * HingeAnimator
 * Computes non-destructive bottom-edge hinge rotations for walls, gables, doors,
 * and structural frames, creating authentic pop-up book unfolding motion.
 */
export class HingeAnimator {
  private static hingeCache = new Map<string, HingeConfig>();

  // Preallocated math objects to eliminate runtime GC allocations
  private static vRel = new THREE.Vector3();
  private static vRelRot = new THREE.Vector3();
  private static qHinge = new THREE.Quaternion();
  private static qResult = new THREE.Quaternion();
  private static vResultPos = new THREE.Vector3();
  private static vScale = new THREE.Vector3();

  public static clearCache(): void {
    this.hingeCache.clear();
  }

  /**
   * Automatically derives the bottom-edge hinge axis and pivot for an architectural object.
   */
  public static getOrCreateHinge(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot
  ): HingeConfig {
    const cached = this.hingeCache.get(orig.name);
    if (cached) return cached;

    // Calculate local bounding box
    const box = new THREE.Box3();
    obj.updateMatrixWorld(true);
    box.setFromObject(obj);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Convert world box center and bottom to local coordinates
    const localBox = new THREE.Box3();
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
        const geom = (child as THREE.Mesh).geometry;
        if (!geom.boundingBox) geom.computeBoundingBox();
        if (geom.boundingBox) {
          const childBox = geom.boundingBox.clone().applyMatrix4(child.matrix);
          localBox.union(childBox);
        }
      }
    });

    const localSize = new THREE.Vector3();
    const localCenter = new THREE.Vector3();
    if (!localBox.isEmpty()) {
      localBox.getSize(localSize);
      localBox.getCenter(localCenter);
    } else {
      localSize.copy(size);
      localCenter.set(0, size.y * 0.5, 0);
      localBox.min.set(-size.x * 0.5, 0, -size.z * 0.5);
      localBox.max.set(size.x * 0.5, size.y, size.z * 0.5);
    }

    // Determine principal horizontal orientation of the wall:
    // If length along X > length along Z, wall hinges along X axis
    const hingeAxis = new THREE.Vector3();
    const hingePivot = new THREE.Vector3();

    if (localSize.x >= localSize.z) {
      hingeAxis.set(1, 0, 0); // Rotates around X axis
      hingePivot.set(localCenter.x, localBox.min.y, localBox.min.z);
    } else {
      hingeAxis.set(0, 0, 1); // Rotates around Z axis
      hingePivot.set(localBox.min.x, localBox.min.y, localCenter.z);
    }

    // Default fold angle: -86 degrees (lying nearly flat on the floor plane)
    const foldAngle = -Math.PI * 0.48;

    const config: HingeConfig = {
      componentName: orig.name,
      hingeAxis,
      hingePivot,
      foldAngle,
    };

    this.hingeCache.set(orig.name, config);
    return config;
  }

  /**
   * Evaluates wall unfolding at normalized progress t in [0, 1].
   * t = 0.0 -> folded flat on floor
   * t = 1.0 -> 100% exact upright original pose (0.000000 error)
   */
  public static evaluateHinge(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number
  ): void {
    // -------------------------------------------------------------------------
    // 1. BOUNDARY LOCK AT t >= 0.99999 (Exact Mathematical Identity)
    // -------------------------------------------------------------------------
    if (t >= 0.99999) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.copy(orig.localScale);
      obj.visible = true;
      return;
    }

    // -------------------------------------------------------------------------
    // 2. BOUNDARY LOCK AT t <= 0.00001 (Fully Folded Flat & Scaled Thin)
    // -------------------------------------------------------------------------
    const config = this.getOrCreateHinge(obj, orig);

    if (t <= 0.00001) {
      this.qHinge.setFromAxisAngle(config.hingeAxis, config.foldAngle);
      this.qResult.copy(orig.localQuaternion).multiply(this.qHinge);
      obj.quaternion.copy(this.qResult);

      // Pinned bottom edge calculation
      this.vRel.subVectors(orig.localPosition, config.hingePivot);
      this.vRelRot.copy(this.vRel).applyQuaternion(this.qHinge);
      this.vResultPos.addVectors(config.hingePivot, this.vRelRot);
      obj.position.copy(this.vResultPos);

      // Thin paper scale when folded
      obj.scale.set(orig.localScale.x * 0.01, orig.localScale.y * 0.01, orig.localScale.z * 0.01);
      obj.visible = false;
      return;
    }

    // -------------------------------------------------------------------------
    // 3. CONTINUOUS HINGE UNFOLDING & PINNED BOTTOM EDGE
    // -------------------------------------------------------------------------
    const easedFactor = hingeOvershootEase(t);
    const currentAngle = config.foldAngle * (1.0 - easedFactor);

    // Apply hinge rotation relative to original orientation
    this.qHinge.setFromAxisAngle(config.hingeAxis, currentAngle);
    this.qResult.copy(orig.localQuaternion).multiply(this.qHinge);
    obj.quaternion.copy(this.qResult);

    // Offset position around hinge pivot so bottom edge stays strictly pinned
    this.vRel.subVectors(orig.localPosition, config.hingePivot);
    this.vRelRot.copy(this.vRel).applyQuaternion(this.qHinge);
    this.vResultPos.addVectors(config.hingePivot, this.vRelRot);
    obj.position.copy(this.vResultPos);

    // Scale pop: paper unfolds from thin sheet into full thickness
    const thicknessScale = THREE.MathUtils.lerp(0.05, 1.0, Math.min(1.0, t * 4.0));
    this.vScale.set(
      orig.localScale.x * thicknessScale,
      orig.localScale.y,
      orig.localScale.z * thicknessScale
    );
    obj.scale.copy(this.vScale);
    obj.visible = thicknessScale > 0.02;
  }
}
