import * as THREE from 'three';
import type { AnalyzedComponent } from './ModelAnalyzer.ts';
import type { ComponentTransformSnapshot } from './TransformStore.ts';
import type { AnimationPreset } from './AnimationPresets.ts';

export type RailArchetype =
  | 'OVERHEAD_LOOP'
  | 'PERIMETER_SWOOP'
  | 'HELICAL_CORKSCREW'
  | 'FOUNDATION_ASCENT';

export interface ComponentSplineRail {
  componentName: string;
  archetype: RailArchetype;
  curve: THREE.CatmullRomCurve3;
  controlPoints: THREE.Vector3[];
  samplePoints: THREE.Vector3[]; // 48 discretized points for rendering 3D guide rails
  spinAxis: THREE.Vector3;
  bankStrength: number;
}

/**
 * Custom F-Curve easing matching Blender Graph Editor's Object Transfer curve (Frame 0 -> 75):
 * High initial acceleration into the 3D spline rail, soaring velocity in mid-flight,
 * and a smooth horizontal zero-slope tangent arrival docking at frame 75 (u = 1.0).
 */
export function blenderGraphEase(u: number): number {
  if (u <= 0.0) return 0.0;
  if (u >= 1.0) return 1.0;
  // Authentic Blender F-Curve: f(u) = 1 - (1 - u)^3 * (1 + 2.4 * u)
  // Guarantees f(0) = 0, f(1) = 1, and f'(1) = 0 (perfect flat tangent at frame 75)
  const inv = 1.0 - u;
  return Math.min(1.0, 1.0 - inv * inv * inv * (1.0 + 2.4 * u));
}

/**
 * SplineRailEngine
 * Generates and evaluates authentic 3D NURBS/Catmull-Rom spline curve rails for every component,
 * matching the Blender Level 3 Viscous Realm reference.
 *
 * Provides:
 * 1. Looping 3D trajectories (overhead loop-de-loops, perimeter S-curves, helical coils).
 * 2. Tangential velocity alignment (objects bank and roll along curve curvature).
 * 3. Exact 0.000000 mathematical landing lock at u = 1.0.
 * 4. Discretized 3D spline rails for real-time WebGL guide wireframe rendering.
 */
export class SplineRailEngine {
  private static railsCache = new Map<string, ComponentSplineRail>();

  // Preallocated math structures to eliminate runtime GC allocations
  private static vForward = new THREE.Vector3(0, 0, 1);
  private static vUp = new THREE.Vector3(0, 1, 0);
  private static vPos = new THREE.Vector3();
  private static vTangent = new THREE.Vector3();
  private static vTangentAhead = new THREE.Vector3();
  private static vCurvatureVec = new THREE.Vector3();
  private static vScale = new THREE.Vector3();

  private static qAlign = new THREE.Quaternion();
  private static qBank = new THREE.Quaternion();
  private static qFlight = new THREE.Quaternion();
  private static qSpin = new THREE.Quaternion();
  private static qResult = new THREE.Quaternion();

  /**
   * Clears the cached rails (e.g. when switching islands).
   */
  public static clearCache(): void {
    this.railsCache.clear();
  }

  /**
   * Returns all currently cached spline rails for rendering visible 3D guide tracks.
   */
  public static getAllRails(): ComponentSplineRail[] {
    return Array.from(this.railsCache.values());
  }

  /**
   * Builds or retrieves the 3D spline rail for a given component.
   */
  public static getOrCreateRail(
    comp: AnalyzedComponent,
    orig: ComponentTransformSnapshot,
    preset: AnimationPreset,
    islandKey = 'HOME'
  ): ComponentSplineRail {
    const cacheKey = `${islandKey}_${comp.name}_${preset.key}`;
    const cached = this.railsCache.get(cacheKey);
    if (cached) return cached;

    const landingPos = orig.localPosition.clone();
    const layer = comp.layer;
    const index = comp.layerOrder * 7 + Math.abs(Math.round(landingPos.x * 3 + landingPos.z * 5));

    // Determine archetype based on layer and component characteristics
    let archetype: RailArchetype;
    if (layer === 'FOUNDATION') {
      archetype = 'FOUNDATION_ASCENT';
    } else if (layer === 'ARCHITECTURE') {
      // Half overhead loops, half sweeping perimeter arcs
      archetype = index % 2 === 0 ? 'OVERHEAD_LOOP' : 'PERIMETER_SWOOP';
    } else if (layer === 'FOLIAGE' || layer === 'PROPS') {
      archetype = index % 3 === 0 ? 'OVERHEAD_LOOP' : 'PERIMETER_SWOOP';
    } else {
      // CHARACTERS, EFFECTS, Arcane objects
      archetype = 'HELICAL_CORKSCREW';
    }

    const radiusMult = preset.spiralRadiusMultiplier;
    const liftMult = preset.liftArcHeight / 4.2; // normalized against base preset
    const controlPoints: THREE.Vector3[] = [];

    // -------------------------------------------------------------------------
    // ARCHETYPE 1: OVERHEAD LOOP (Blender Cube.008 & Wall Lamp style)
    // High-altitude parabolic loop that arches over the diorama before diving in
    // -------------------------------------------------------------------------
    if (archetype === 'OVERHEAD_LOOP') {
      const side = index % 2 === 0 ? 1 : -1;
      const loopHeight = (12.0 + (index % 5) * 1.5) * liftMult;
      const flareX = (8.0 + (index % 4) * 2.0) * radiusMult * side;
      const flareZ = (landingPos.z < 0 ? -1 : 1) * (10.0 + (index % 3) * 2.0) * radiusMult;

      // K0: Dispersed initial knot in space
      const k0 = new THREE.Vector3(
        landingPos.x + flareX * 1.2,
        landingPos.y + loopHeight * 0.75,
        landingPos.z + flareZ * 1.2
      );

      // K1: Apex of the high overhead roller-coaster loop
      const k1 = new THREE.Vector3(
        landingPos.x + flareX * 0.45,
        landingPos.y + loopHeight * 1.2,
        landingPos.z - flareZ * 0.25
      );

      // K2: Swoop inflection knot diving downward
      const k2 = new THREE.Vector3(
        landingPos.x - flareX * 0.25,
        landingPos.y + loopHeight * 0.45,
        landingPos.z + flareZ * 0.35
      );

      // K3: Tangential approach knot aligning with landing socket
      const k3 = new THREE.Vector3(
        landingPos.x + flareX * 0.08,
        landingPos.y + 1.6,
        landingPos.z + (landingPos.z < 0 ? -0.8 : 0.8)
      );

      // K4: Exact assembled landing position
      const k4 = landingPos.clone();

      controlPoints.push(k0, k1, k2, k3, k4);
    }

    // -------------------------------------------------------------------------
    // ARCHETYPE 2: PERIMETER SWOOP (Blender Part 2 Planters & Cornices style)
    // Wide horizontal S-curve sweeping in from around the perimeter of the island
    // -------------------------------------------------------------------------
    else if (archetype === 'PERIMETER_SWOOP') {
      const baseAngle = Math.atan2(landingPos.z, landingPos.x) || (index * 0.75);
      const sweepDir = index % 2 === 0 ? 1 : -1;
      const outerR = (14.0 + (index % 4) * 2.0) * radiusMult;
      const midR = (8.5 + (index % 3) * 1.5) * radiusMult;

      // K0: Outer perimeter launch knot
      const k0 = new THREE.Vector3(
        outerR * Math.cos(baseAngle + sweepDir * 1.6),
        landingPos.y + 7.5 * liftMult,
        outerR * Math.sin(baseAngle + sweepDir * 1.6)
      );

      // K1: Mid-arc sweeping knot
      const k1 = new THREE.Vector3(
        midR * Math.cos(baseAngle + sweepDir * 0.9),
        landingPos.y + 5.0 * liftMult,
        midR * Math.sin(baseAngle + sweepDir * 0.9)
      );

      // K2: Inner curve inflection knot
      const k2 = new THREE.Vector3(
        (midR * 0.55) * Math.cos(baseAngle + sweepDir * 0.35),
        landingPos.y + 2.8 * liftMult,
        (midR * 0.55) * Math.sin(baseAngle + sweepDir * 0.35)
      );

      // K3: Final approach knot
      const k3 = new THREE.Vector3(
        landingPos.x + Math.cos(baseAngle + sweepDir * 0.15) * 1.2,
        landingPos.y + 1.0,
        landingPos.z + Math.sin(baseAngle + sweepDir * 0.15) * 1.2
      );

      // K4: Landing target
      const k4 = landingPos.clone();

      controlPoints.push(k0, k1, k2, k3, k4);
    }

    // -------------------------------------------------------------------------
    // ARCHETYPE 3: HELICAL CORKSCREW (Characters, Magic Motes, Arcane Objects)
    // 3D spiral rollercoaster winding inward toward landing socket
    // -------------------------------------------------------------------------
    else if (archetype === 'HELICAL_CORKSCREW') {
      const dir = comp.orbitalDirection || (index % 2 === 0 ? 1 : -1);
      const turns = (preset.spiralTurns || 1.75) * Math.PI * 2;
      const baseAngle = comp.azimuthAngle || Math.atan2(landingPos.z, landingPos.x) || index;
      const startRadius = Math.max(8.0, comp.radius * 1.8 * radiusMult);

      // 5 knots along inward logarithmic spiral
      const k0 = new THREE.Vector3(
        startRadius * Math.cos(baseAngle + dir * turns),
        landingPos.y + 11.0 * liftMult,
        startRadius * Math.sin(baseAngle + dir * turns)
      );

      const k1 = new THREE.Vector3(
        startRadius * 0.72 * Math.cos(baseAngle + dir * turns * 0.75),
        landingPos.y + 7.5 * liftMult,
        startRadius * 0.72 * Math.sin(baseAngle + dir * turns * 0.75)
      );

      const k2 = new THREE.Vector3(
        startRadius * 0.48 * Math.cos(baseAngle + dir * turns * 0.45),
        landingPos.y + 4.5 * liftMult,
        startRadius * 0.48 * Math.sin(baseAngle + dir * turns * 0.45)
      );

      const k3 = new THREE.Vector3(
        startRadius * 0.22 * Math.cos(baseAngle + dir * turns * 0.18),
        landingPos.y + 1.8 * liftMult,
        startRadius * 0.22 * Math.sin(baseAngle + dir * turns * 0.18)
      );

      const k4 = landingPos.clone();

      controlPoints.push(k0, k1, k2, k3, k4);
    }

    // -------------------------------------------------------------------------
    // ARCHETYPE 4: FOUNDATION ASCENT (Island Base Terrain & Bedrock)
    // Curving upward ascent from subterranean depths with stabilizing flare
    // -------------------------------------------------------------------------
    else {
      const flareX = (landingPos.x < 0 ? -1 : 1) * 2.5 * radiusMult;
      const flareZ = (landingPos.z < 0 ? -1 : 1) * 2.5 * radiusMult;

      const k0 = new THREE.Vector3(
        landingPos.x + flareX * 1.5,
        landingPos.y - 14.0 * liftMult,
        landingPos.z + flareZ * 1.5
      );

      const k1 = new THREE.Vector3(
        landingPos.x + flareX * 0.9,
        landingPos.y - 8.5 * liftMult,
        landingPos.z + flareZ * 0.9
      );

      const k2 = new THREE.Vector3(
        landingPos.x - flareX * 0.3,
        landingPos.y - 4.2 * liftMult,
        landingPos.z - flareZ * 0.3
      );

      const k3 = new THREE.Vector3(
        landingPos.x,
        landingPos.y - 1.2,
        landingPos.z
      );

      const k4 = landingPos.clone();

      controlPoints.push(k0, k1, k2, k3, k4);
    }

    // Build Centripetal Catmull-Rom spline curve
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

    // Discretize 48 sample points along the curve for rendering visible 3D guide rails
    const samplePoints: THREE.Vector3[] = [];
    const divisions = 48;
    for (let s = 0; s <= divisions; s++) {
      samplePoints.push(curve.getPointAt(s / divisions));
    }

    const rail: ComponentSplineRail = {
      componentName: comp.name,
      archetype,
      curve,
      controlPoints,
      samplePoints,
      spinAxis: comp.spinAxis || new THREE.Vector3(0, 1, 0),
      bankStrength: archetype === 'OVERHEAD_LOOP' ? 0.45 : 0.35,
    };

    this.railsCache.set(cacheKey, rail);
    return rail;
  }

  /**
   * Evaluates the complete transform of a component at normalized time u in [0, 1].
   * u = 0.0 -> fully exploded / dispersed along rail
   * u = 1.0 -> fully assembled (exact 0.000000 mathematical landing lock)
   */
  public static evaluate(
    comp: AnalyzedComponent,
    orig: ComponentTransformSnapshot,
    preset: AnimationPreset,
    u: number,
    outObject: THREE.Object3D,
    islandKey = 'HOME'
  ): void {
    // -------------------------------------------------------------------------
    // 1. BOUNDARY LOCK AT u >= 0.99999 (Mathematical Zero-Drift Guarantee)
    // -------------------------------------------------------------------------
    if (u >= 0.99999) {
      outObject.position.copy(orig.localPosition);
      outObject.quaternion.copy(orig.localQuaternion);
      outObject.scale.copy(orig.localScale);
      outObject.visible = true;
      return;
    }

    const rail = this.getOrCreateRail(comp, orig, preset, islandKey);

    // -------------------------------------------------------------------------
    // 2. BOUNDARY LOCK AT u <= 0.00001 (Fully Dispersed at Start of Rail)
    // -------------------------------------------------------------------------
    if (u <= 0.00001) {
      outObject.position.copy(rail.controlPoints[0]);
      outObject.quaternion.copy(orig.localQuaternion);
      outObject.scale.set(0.001, 0.001, 0.001);
      outObject.visible = false;
      return;
    }

    // Apply Blender graph editor easing
    const easedU = blenderGraphEase(u);

    // -------------------------------------------------------------------------
    // 3. 3D SPLINE RAIL POSITION
    // -------------------------------------------------------------------------
    rail.curve.getPointAt(easedU, this.vPos);
    outObject.position.copy(this.vPos);

    // -------------------------------------------------------------------------
    // 4. TANGENT VELOCITY ALIGNMENT & CURVE BANKING
    // -------------------------------------------------------------------------
    rail.curve.getTangentAt(easedU, this.vTangent);

    // Calculate tangent slightly ahead to estimate local curvature vector
    const deltaU = 0.02;
    const nextU = Math.min(1.0, easedU + deltaU);
    rail.curve.getTangentAt(nextU, this.vTangentAhead);
    this.vCurvatureVec.subVectors(this.vTangentAhead, this.vTangent).divideScalar(deltaU);

    // Align forward axis with velocity tangent
    if (this.vTangent.lengthSq() > 0.0001) {
      this.qAlign.setFromUnitVectors(this.vForward, this.vTangent);
      this.qFlight.copy(this.qAlign).multiply(orig.localQuaternion);

      // Bank roll around tangent proportional to turning curvature
      const lateralCurvature = this.vCurvatureVec.dot(this.vUp);
      const bankAngle = THREE.MathUtils.clamp(
        lateralCurvature * rail.bankStrength * (1.0 - easedU),
        -0.55,
        0.55
      );
      this.qBank.setFromAxisAngle(this.vTangent, bankAngle);
      this.qFlight.premultiply(this.qBank);
    } else {
      this.qFlight.copy(orig.localQuaternion);
    }

    // Secondary flight spin (gradually damps out as u -> 1.0)
    if (easedU < 0.88 && preset.spinRate > 0) {
      const spinAngle = preset.spinRate * Math.pow(1.0 - easedU, 2) * comp.orbitalDirection;
      this.qSpin.setFromAxisAngle(rail.spinAxis, spinAngle);
      this.qFlight.multiply(this.qSpin);
    }

    // Smoothly transition from flight orientation to resting orientation in landing window (u in [0.78, 1.0])
    if (easedU > 0.78) {
      const dockFactor = THREE.MathUtils.smoothstep(easedU, 0.78, 1.0);
      this.qResult.copy(this.qFlight).slerp(orig.localQuaternion, dockFactor);
    } else {
      this.qResult.copy(this.qFlight);
    }

    outObject.quaternion.copy(this.qResult);

    // -------------------------------------------------------------------------
    // 5. STRETCHED STICK TO 3D SHAPE REVEAL (Longitudinal Tangent Elongation)
    // -------------------------------------------------------------------------
    let sParallel = 1.0;
    let sPerp = 1.0;

    if (easedU < 0.70) {
      // PHASE A: Pure Stretched Stick in mid-flight from far away
      sParallel = 3.8;
      sPerp = 0.32; // Volume-preserving radial compression
    } else if (easedU < 0.90) {
      // PHASE B: Decelerating & Blossoming into original 3D shape
      const alpha = (easedU - 0.70) / 0.20;
      const smoothAlpha = alpha * alpha * (3.0 - 2.0 * alpha);
      sParallel = THREE.MathUtils.lerp(3.8, 0.88, smoothAlpha); // Impact compression
      sPerp = THREE.MathUtils.lerp(0.32, 1.14, smoothAlpha);    // Lateral flare
    } else {
      // PHASE C: Touchdown rebound & settle
      const settleT = (easedU - 0.90) / 0.10;
      const decay = Math.exp(-9.0 * settleT);
      const osc = Math.cos(settleT * Math.PI * 4.0);
      sParallel = 1.0 - 0.12 * decay * osc;
      sPerp = 1.0 + 0.08 * decay * osc;
    }

    // Fast scale-in from zero to full size in initial 5% flight
    const earlyScaleFactor = Math.min(1.0, u * 12.0);

    this.vScale.set(
      orig.localScale.x * sPerp * earlyScaleFactor,
      orig.localScale.y * sParallel * earlyScaleFactor,
      orig.localScale.z * sPerp * earlyScaleFactor
    );

    outObject.scale.copy(this.vScale);
    outObject.visible = earlyScaleFactor > 0.01;
  }
}
