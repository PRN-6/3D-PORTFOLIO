import * as THREE from 'three';
import type { AnalyzedComponent } from './ModelAnalyzer';
import type { ComponentTransformSnapshot } from './TransformStore';
import type { AnimationPreset } from './AnimationPresets';

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

/**
 * Procedural Kinematic Path Generator.
 * Calculates 3D curved Bézier splines, inward orbital spiral paths,
 * dynamic quaternion orientation, and volume-preserving squash & stretch.
 */
export class PathGenerator {
  // Preallocated math structures to prevent runtime GC allocations
  private static vP0 = new THREE.Vector3();
  private static vC1 = new THREE.Vector3();
  private static vC2 = new THREE.Vector3();
  private static vP3 = new THREE.Vector3();
  private static vResultPos = new THREE.Vector3();
  private static vSpiralOffset = new THREE.Vector3();

  private static qStart = new THREE.Quaternion();
  private static qDispersal = new THREE.Quaternion();
  private static qSpin = new THREE.Quaternion();
  private static qResultRot = new THREE.Quaternion();

  private static vResultScale = new THREE.Vector3();

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
    outObject: THREE.Object3D
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
      const mult = preset.spiralRadiusMultiplier;
      outObject.position.set(
        orig.localPosition.x + comp.dispersalOffset.x * mult,
        orig.localPosition.y + comp.dispersalOffset.y * mult,
        orig.localPosition.z + comp.dispersalOffset.z * mult
      );
      this.qDispersal.setFromEuler(comp.dispersalRotation);
      outObject.quaternion.copy(orig.localQuaternion).multiply(this.qDispersal);
      outObject.scale.set(0.001, 0.001, 0.001);
      outObject.visible = false;
      return;
    }

    const easedU = easeInOutCubic(u);
    const w = 1.0 - easedU; // Inverted distance from assembled state

    // -------------------------------------------------------------------------
    // 3. CURVED 3D BÉZIER ARC TRAJECTORY
    // -------------------------------------------------------------------------
    const radiusMult = preset.spiralRadiusMultiplier;
    const liftHeight = preset.liftArcHeight * (1.0 + comp.layerOrder * 0.15);

    // P0: Dispersed initial point
    this.vP0.set(
      orig.localPosition.x + comp.dispersalOffset.x * radiusMult,
      orig.localPosition.y + comp.dispersalOffset.y * radiusMult,
      orig.localPosition.z + comp.dispersalOffset.z * radiusMult
    );

    // P3: Assembled landing target
    this.vP3.copy(orig.localPosition);

    // C1: First control point lifting upward and flaring slightly outward
    this.vC1.set(
      this.vP0.x * 0.85,
      Math.max(this.vP0.y, this.vP3.y) + liftHeight * 0.65,
      this.vP0.z * 0.85
    );

    // C2: Second control point smoothly dropping into landing tangent
    this.vC2.set(
      this.vP3.x + (this.vP0.x - this.vP3.x) * 0.25,
      this.vP3.y + liftHeight * 0.85,
      this.vP3.z + (this.vP0.z - this.vP3.z) * 0.25
    );

    // Cubic Bézier position
    const oneMinusU = 1.0 - easedU;
    const b0 = oneMinusU * oneMinusU * oneMinusU;
    const b1 = 3 * oneMinusU * oneMinusU * easedU;
    const b2 = 3 * oneMinusU * easedU * easedU;
    const b3 = easedU * easedU * easedU;

    this.vResultPos.set(
      b0 * this.vP0.x + b1 * this.vC1.x + b2 * this.vC2.x + b3 * this.vP3.x,
      b0 * this.vP0.y + b1 * this.vC1.y + b2 * this.vC2.y + b3 * this.vP3.y,
      b0 * this.vP0.z + b1 * this.vC1.z + b2 * this.vC2.z + b3 * this.vP3.z
    );

    // -------------------------------------------------------------------------
    // 4. INWARD ORBITAL SPIRAL COMPONENT (Level 3 Viscous Realm Swoop)
    // -------------------------------------------------------------------------
    if (preset.spiralTurns > 0.01 && w > 0.001) {
      const spiralRadius = Math.max(0, comp.radius * radiusMult * 0.85 * Math.pow(w, 1.25));
      const spiralAngle =
        comp.azimuthAngle +
        comp.orbitalDirection * preset.spiralTurns * Math.PI * 2 * w;

      this.vSpiralOffset.set(
        spiralRadius * Math.cos(spiralAngle),
        Math.sin(Math.PI * easedU) * liftHeight * 0.35,
        spiralRadius * Math.sin(spiralAngle)
      );

      this.vResultPos.add(this.vSpiralOffset);
    }

    outObject.position.copy(this.vResultPos);

    // -------------------------------------------------------------------------
    // 5. DYNAMIC ROTATION (Dispersal Orientation -> Target Slerp + Orbital Spin)
    // -------------------------------------------------------------------------
    this.qDispersal.setFromEuler(comp.dispersalRotation);
    this.qStart.copy(orig.localQuaternion).multiply(this.qDispersal);

    // Slerp from start rotation to target rotation
    this.qResultRot.copy(this.qStart).slerp(orig.localQuaternion, easedU);

    // Secondary flight spin along spinAxis (damps to 0 as u -> 1.0)
    if (easedU < 0.95 && preset.spinRate > 0) {
      const spinAngle = preset.spinRate * w * w * comp.orbitalDirection;
      this.qSpin.setFromAxisAngle(comp.spinAxis, spinAngle);
      this.qResultRot.multiply(this.qSpin);
    }

    outObject.quaternion.copy(this.qResultRot);

    // -------------------------------------------------------------------------
    // 6. VOLUME-PRESERVING SQUASH, STRETCH & DAMPED REBOUND ON ARRIVAL
    // -------------------------------------------------------------------------
    let scaleMultiplier = 1.0;
    let squashDelta = 0.0;

    const ss = preset.squashStretch;
    if (ss.enabled && u > 1.0 - ss.arrivalWindow) {
      const arrivalWindow = ss.arrivalWindow;
      const tau = (u - (1.0 - arrivalWindow)) / arrivalWindow; // 0.0 to 1.0 in arrival phase

      if (tau < 0.35) {
        // Aerodynamic flight stretch before impact: stretched lengthwise, narrowed widthwise
        const stretchT = tau / 0.35;
        squashDelta = -ss.amplitude * 0.4 * Math.sin(stretchT * Math.PI);
      } else {
        // Ground impact & harmonic rebound: decaying oscillation
        const impactTau = (tau - 0.35) / 0.65;
        const decay = Math.exp(-ss.damping * impactTau);
        const osc = Math.cos(ss.frequency * impactTau * Math.PI);
        squashDelta = ss.amplitude * decay * osc * (1.0 - impactTau);
      }
    }

    // Base scale growth from zero to full size during early flight
    const earlyScaleFactor = Math.min(1.0, u * 5.0); // reached 1.0 size by 20% flight
    scaleMultiplier = earlyScaleFactor;

    // Apply volume-conserving deformation: Sy = 1 - delta, Sx = Sz = 1 + 0.5*delta
    const sy = (1.0 - squashDelta) * scaleMultiplier;
    const sxz = (1.0 + 0.5 * squashDelta) * scaleMultiplier;

    this.vResultScale.set(
      orig.localScale.x * sxz,
      orig.localScale.y * sy,
      orig.localScale.z * sxz
    );

    outObject.scale.copy(this.vResultScale);
    outObject.visible = scaleMultiplier > 0.01;
  }
}

