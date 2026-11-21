import * as THREE from 'three';
import type { ComponentTransformSnapshot } from './TransformStore';

export interface FluidFlightTrajectory {
  curve: THREE.CubicBezierCurve3;
  archetype: 'OVERHEAD_LOOP' | 'PERIMETER_SWOOP' | 'HELICAL_SPIRAL';
}

/**
 * FluidStretchFlightAnimator
 *
 * Implements the stylized motion graphics "Smear / Stretched Stick to 3D Shape" reveal:
 * 1. Elements (trees, characters, props) travel along fluid 3D curves from far away.
 * 2. In mid-flight, elements are stretched along the velocity tangent into a smooth stick/noodle
 *    (longitudinal stretch 3.6x - 4.2x, radial compression 0.32x to preserve visual volume).
 * 3. Near arrival (u in [0.70, 0.90]), the stretch rapidly contracts and blossoms laterally,
 *    re-forming the true 3D mesh geometry (branches, leaves, character limbs).
 * 4. Touchdown (u in [0.90, 1.00]) features subtle impact squash and damped harmonic settling.
 * 5. Guarantees 0.000000 drift at u = 1.0.
 */
export class FluidStretchFlightAnimator {
  private static vUp = new THREE.Vector3(0, 1, 0);
  private static vPos = new THREE.Vector3();
  private static vTangent = new THREE.Vector3();
  private static vScale = new THREE.Vector3();
  private static qAlign = new THREE.Quaternion();
  private static qFlight = new THREE.Quaternion();
  private static qResult = new THREE.Quaternion();

  private static trajectories = new Map<string, FluidFlightTrajectory>();

  /**
   * Generates or retrieves a 3D fluid curve from far away based on component name and resting position.
   */
  public static getOrCreateTrajectory(
    name: string,
    origPos: THREE.Vector3
  ): FluidFlightTrajectory {
    let traj = this.trajectories.get(name);
    if (traj) return traj;

    const lower = name.toLowerCase();
    let archetype: FluidFlightTrajectory['archetype'] = 'PERIMETER_SWOOP';
    let startOffset: THREE.Vector3;
    let ctrl1Offset: THREE.Vector3;
    let ctrl2Offset: THREE.Vector3;

    if (lower.includes('maintree') || lower.includes('oak')) {
      archetype = 'OVERHEAD_LOOP';
      startOffset = new THREE.Vector3(14, 15, -12);
      ctrl1Offset = new THREE.Vector3(7, 18, -4);
      ctrl2Offset = new THREE.Vector3(2, 6, 1);
    } else if (lower.includes('windward') || lower.includes('fir')) {
      archetype = 'PERIMETER_SWOOP';
      startOffset = new THREE.Vector3(-16, 12, 10);
      ctrl1Offset = new THREE.Vector3(-8, 14, 5);
      ctrl2Offset = new THREE.Vector3(-2, 5, 2);
    } else if (lower.includes('youngfir') || lower.includes('tree')) {
      archetype = 'PERIMETER_SWOOP';
      startOffset = new THREE.Vector3(15, 11, 12);
      ctrl1Offset = new THREE.Vector3(8, 13, 6);
      ctrl2Offset = new THREE.Vector3(2, 4, 2);
    } else if (lower.includes('frieren')) {
      archetype = 'HELICAL_SPIRAL';
      startOffset = new THREE.Vector3(-12, 16, -9);
      ctrl1Offset = new THREE.Vector3(-6, 10, 4);
      ctrl2Offset = new THREE.Vector3(1.5, 4.5, 2);
    } else if (lower.includes('himmel')) {
      archetype = 'OVERHEAD_LOOP';
      startOffset = new THREE.Vector3(13, 14, 9);
      ctrl1Offset = new THREE.Vector3(6, 15, 3);
      ctrl2Offset = new THREE.Vector3(1, 5, 1);
    } else if (lower.includes('heiter')) {
      archetype = 'PERIMETER_SWOOP';
      startOffset = new THREE.Vector3(-13, 12, -7);
      ctrl1Offset = new THREE.Vector3(-6, 11, -2);
      ctrl2Offset = new THREE.Vector3(-1, 4, 1);
    } else if (lower.includes('eisen')) {
      archetype = 'OVERHEAD_LOOP';
      startOffset = new THREE.Vector3(10, 13, -12);
      ctrl1Offset = new THREE.Vector3(4, 14, -5);
      ctrl2Offset = new THREE.Vector3(1, 4.5, -1);
    } else {
      // General prop trajectory
      const hash = Math.abs(name.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0));
      const angle = (hash % 100) / 100 * Math.PI * 2;
      const radius = 14 + (hash % 6);
      const height = 11 + (hash % 5);
      startOffset = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      ctrl1Offset = new THREE.Vector3(Math.cos(angle + 0.5) * (radius * 0.55), height * 0.9, Math.sin(angle + 0.5) * (radius * 0.55));
      ctrl2Offset = new THREE.Vector3(Math.cos(angle + 0.8) * 3.5, 4.0, Math.sin(angle + 0.8) * 3.5);
    }

    const start = origPos.clone().add(startOffset);
    const ctrl1 = origPos.clone().add(ctrl1Offset);
    const ctrl2 = origPos.clone().add(ctrl2Offset);
    const end = origPos.clone();

    const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
    traj = { curve, archetype };
    this.trajectories.set(name, traj);
    return traj;
  }

  /**
   * Evaluates the fluid stretched stick-to-shape animation for a component at local time t in [0, 1].
   */
  public static evaluateFlight(
    obj: THREE.Object3D,
    orig: ComponentTransformSnapshot,
    t: number
  ): void {
    // 1. Boundary Lock at t >= 0.99999 (Zero Drift)
    if (t >= 0.99999) {
      obj.position.copy(orig.localPosition);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.copy(orig.localScale);
      obj.visible = true;
      return;
    }

    // 2. Boundary Lock at t <= 0.00001 (Fully Dispersed Far Away)
    if (t <= 0.00001) {
      const traj = this.getOrCreateTrajectory(obj.name, orig.localPosition);
      obj.position.copy(traj.curve.v0);
      obj.quaternion.copy(orig.localQuaternion);
      obj.scale.set(0.0001, 0.0001, 0.0001);
      obj.visible = false;
      return;
    }

    const traj = this.getOrCreateTrajectory(obj.name, orig.localPosition);

    // Authentic Blender F-Curve Easing
    const inv = 1.0 - t;
    const easedT = Math.min(1.0, 1.0 - inv * inv * inv * (1.0 + 2.4 * t));

    // 3. Position along 3D fluid curve
    traj.curve.getPoint(easedT, this.vPos);
    obj.position.copy(this.vPos);

    // 4. Instantaneous Curve Velocity Tangent
    traj.curve.getTangent(easedT, this.vTangent).normalize();

    // Align local height axis (+Y) with tangent
    if (this.vTangent.lengthSq() > 0.0001) {
      this.qAlign.setFromUnitVectors(this.vUp, this.vTangent);
      this.qFlight.copy(this.qAlign).multiply(orig.localQuaternion);
    } else {
      this.qFlight.copy(orig.localQuaternion);
    }

    // 5. Kinematics: Stretched Stick vs. Formed 3D Shape
    let sParallel = 1.0;
    let sPerp = 1.0;
    let dockFactor = 0.0;

    if (t < 0.70) {
      // PHASE A: Pure Stretched Stick in mid-flight from far away
      sParallel = 3.8;
      sPerp = 0.32; // Volume-preserving radial compression
      dockFactor = 0.0;
    } else if (t < 0.90) {
      // PHASE B: Decelerating & Blossoming into original 3D shape
      const alpha = (t - 0.70) / 0.20;
      const smoothAlpha = alpha * alpha * (3.0 - 2.0 * alpha);
      sParallel = THREE.MathUtils.lerp(3.8, 0.88, smoothAlpha); // Impact compression
      sPerp = THREE.MathUtils.lerp(0.32, 1.14, smoothAlpha);    // Lateral flare
      dockFactor = smoothAlpha;
    } else {
      // PHASE C: Touchdown rebound & settle
      const settleT = (t - 0.90) / 0.10;
      const decay = Math.exp(-9.0 * settleT);
      const osc = Math.cos(settleT * Math.PI * 4.0);
      sParallel = 1.0 - 0.12 * decay * osc;
      sPerp = 1.0 + 0.08 * decay * osc;
      dockFactor = 1.0;
    }

    // Smoothly slerp from flight tangent orientation to resting orientation
    this.qResult.copy(this.qFlight).slerp(orig.localQuaternion, dockFactor);
    obj.quaternion.copy(this.qResult);

    // Apply longitudinal stretch along local Y (which points along tangent during flight)
    // and radial compression along local X and Z
    this.vScale.set(
      orig.localScale.x * sPerp,
      orig.localScale.y * sParallel,
      orig.localScale.z * sPerp
    );

    obj.scale.copy(this.vScale);
    obj.visible = true;
  }
}
