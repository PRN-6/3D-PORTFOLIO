import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface StaircaseTimingConfig {
  /**
   * Total number of individual floating steps (default: 18)
   */
  stepCount: number;
  /**
   * Duration in milliseconds for an individual step to emerge and form (default: 500ms, target 450–600ms)
   */
  stepMaterializeMs: number;
  /**
   * Pause in milliseconds between consecutive steps (default: 300ms, target 250–350ms)
   */
  stepPauseMs: number;
  /**
   * Delay in milliseconds before the first step begins materializing (default: 600ms)
   */
  introDelayMs: number;
  /**
   * Settling window in milliseconds for the destination island after the last step (default: 2000ms)
   */
  outroSettleMs: number;
}

export const DEFAULT_STAIRCASE_CONFIG: StaircaseTimingConfig = {
  stepCount: 18,
  stepMaterializeMs: 500, // 500 ms (within 450–600 ms target)
  stepPauseMs: 300,       // 300 ms (within 250–350 ms target)
  introDelayMs: 600,      // 0.6s camera lift & island descent initialization
  outroSettleMs: 2000,    // 2.0s destination island arrival & settle
};

/**
 * Computes the total transition duration in seconds based on the timing configuration.
 * Formula: (introDelayMs + stepCount * (stepMaterializeMs + stepPauseMs) + outroSettleMs) / 1000
 * With default 18 steps: (600 + 18 * 800 + 2000) / 1000 = 17.0s
 */
export function getStaircaseTotalDuration(config: StaircaseTimingConfig = DEFAULT_STAIRCASE_CONFIG): number {
  const stepsDurationMs = config.stepCount * (config.stepMaterializeMs + config.stepPauseMs);
  return (config.introDelayMs + stepsDurationMs + config.outroSettleMs) / 1000;
}

export interface MagicalFloatingStairsProps {
  /**
   * Mutable ref for transition progress from 0.0 to 1.0 (zero React re-render overhead)
   */
  progressRef?: React.MutableRefObject<number>;
  /**
   * Optional fallback static progress (0.0 to 1.0)
   */
  progress?: number;
  /**
   * Custom spline control points for connecting different islands in 3D sky
   */
  customControlPoints?: THREE.Vector3[];
  /**
   * Custom palette accents
   */
  crystalColor?: string;
  emissiveColor?: string;
  edgeColor?: string;
  /**
   * Optional custom staircase timing configuration
   */
  timingConfig?: Partial<StaircaseTimingConfig>;
}

interface StepData {
  index: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  tStartMs: number;
  tEndMs: number;
  tPauseEndMs: number;
}

export const MagicalFloatingStairs: React.FC<MagicalFloatingStairsProps> = ({
  progressRef,
  progress = 0,
  customControlPoints,
  crystalColor = '#bae6fd',
  emissiveColor = '#38bdf8',
  edgeColor = '#a78bfa',
  timingConfig,
}) => {
  const config = useMemo<StaircaseTimingConfig>(() => ({
    ...DEFAULT_STAIRCASE_CONFIG,
    ...timingConfig,
  }), [timingConfig]);

  const stepCount = config.stepCount;
  const totalDuration = useMemo(() => getStaircaseTotalDuration(config), [config]);

  const stepMeshRefs = useRef<(THREE.Group | null)[]>([]);
  const leadLightRef = useRef<THREE.PointLight>(null);

  // ---------------------------------------------------------------------------
  // 1. Compute the Elegant Curved 3D Spline Through Empty Sky
  // ---------------------------------------------------------------------------
  const steps = useMemo(() => {
    const controlPoints = customControlPoints || [
      new THREE.Vector3(6.2, 0.7, 2.2),    // Just off the Hero's Home edge in open air
      new THREE.Vector3(7.5, 4.5, 0.0),    // Rising gracefully into open sky
      new THREE.Vector3(6.5, 10.0, -5.5),  // Ascending along the vista
      new THREE.Vector3(0.5, 15.5, -8.0),  // High panoramic apex in starry sky
      new THREE.Vector3(-5.5, 20.8, -5.0), // Sweeping across the flank
      new THREE.Vector3(-6.0, 25.0, 1.0),  // Rising toward Archive terrace
      new THREE.Vector3(-3.0, 27.2, 5.8),  // Aligning with entrance walkway
      new THREE.Vector3(0.0, 28.2, 7.0),   // Final step at Archive entrance
    ];

    const spline = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

    const generatedSteps: StepData[] = [];
    const cycleMs = config.stepMaterializeMs + config.stepPauseMs;

    for (let i = 0; i < stepCount; i++) {
      const u = i / (stepCount - 1);
      const pos = spline.getPointAt(u);
      const tangent = spline.getTangentAt(u).normalize();

      const yaw = Math.atan2(tangent.x, tangent.z);
      const tStartMs = config.introDelayMs + i * cycleMs;
      const tEndMs = tStartMs + config.stepMaterializeMs;
      const tPauseEndMs = tEndMs + config.stepPauseMs;

      generatedSteps.push({
        index: i,
        position: pos,
        rotation: new THREE.Euler(0, yaw, 0),
        tStartMs,
        tEndMs,
        tPauseEndMs,
      });
    }

    return generatedSteps;
  }, [stepCount, customControlPoints, config]);

  // ---------------------------------------------------------------------------
  // 2. High-Performance Reusable Geometries (Shared across all steps)
  // ---------------------------------------------------------------------------
  const geometries = useMemo(() => {
    return {
      body: new THREE.BoxGeometry(1.9, 0.12, 0.68),
      edge: new THREE.BoxGeometry(1.94, 0.13, 0.72),
      outerRune: new THREE.RingGeometry(0.22, 0.25, 32),
      innerRune: new THREE.RingGeometry(0.12, 0.15, 32),
      diamondRune: new THREE.RingGeometry(0.04, 0.07, 4),
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 3. High-Performance Reusable Materials (Single Forward Pass)
  // ---------------------------------------------------------------------------
  const materials = useMemo(() => {
    const crystalMat = new THREE.MeshStandardMaterial({
      color: crystalColor,
      transparent: true,
      opacity: 0.65,
      roughness: 0.12,
      metalness: 0.1,
      emissive: emissiveColor,
      emissiveIntensity: 0.45,
      toneMapped: false,
    });

    const edgeMat = new THREE.MeshStandardMaterial({
      color: edgeColor,
      emissive: emissiveColor,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.75,
      toneMapped: false,
    });

    const runeMat = new THREE.MeshStandardMaterial({
      color: edgeColor,
      emissive: edgeColor,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
    });

    const outerRuneMat = new THREE.MeshStandardMaterial({
      color: emissiveColor,
      emissive: emissiveColor,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    });

    return { crystalMat, edgeMat, runeMat, outerRuneMat };
  }, [crystalColor, emissiveColor, edgeColor]);

  // ---------------------------------------------------------------------------
  // 4. Frame Update: Pure Three.js Mutation (Zero React State Reconciliations)
  // ---------------------------------------------------------------------------
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const curProgress = progressRef ? progressRef.current : progress;

    // Subtle breathing pulse of magical runes
    materials.runeMat.emissiveIntensity = 1.8 + Math.sin(time * 3.0) * 0.35;
    materials.outerRuneMat.emissiveIntensity = 1.5 + Math.sin(time * 2.5 + 1.0) * 0.25;

    // Calculate elapsed time along the transition in milliseconds
    const elapsedMs = curProgress * totalDuration * 1000;

    // When arriving at destination island, dissolve/fade steps away cleanly
    let exitScale = 1.0;
    if (curProgress > 0.88) {
      exitScale = THREE.MathUtils.clamp((0.98 - curProgress) / 0.10, 0, 1);
    }

    let activeStepIdx = -1;

    for (let idx = 0; idx < stepCount; idx++) {
      const step = steps[idx];
      const group = stepMeshRefs.current[idx];
      if (!group) continue;

      if (exitScale <= 0.001 || elapsedMs < step.tStartMs) {
        // Step has NOT started materializing yet (or has dissolved at the end)
        group.visible = false;
        group.scale.set(0, 0, 0);
        group.userData = { stepIdx: idx, state: 'HIDDEN', scale: 0, progress: 0 };
      } else if (elapsedMs >= step.tStartMs && elapsedMs < step.tEndMs) {
        // EXACTLY THIS STEP IS ACTIVELY FORMING! (One step at a time)
        group.visible = true;
        activeStepIdx = idx;

        const u = THREE.MathUtils.clamp((elapsedMs - step.tStartMs) / config.stepMaterializeMs, 0, 1);
        // Smooth ease-out cubic animation
        const easeOut = 1 - Math.pow(1 - u, 3);

        // Gentle scale-up and fade-in
        const scale = easeOut * exitScale;
        // Natural settling cushion: descends gently from 0.16 units above into final placement
        const settleY = (1 - easeOut) * 0.16;
        const hoverY = Math.sin(time * 2.2 + idx * 0.45) * 0.032;

        group.position.set(
          step.position.x,
          step.position.y + hoverY + settleY,
          step.position.z
        );
        group.scale.set(scale, scale, scale);
        group.userData = { stepIdx: idx, state: 'FORMING', scale, progress: u };
      } else {
        // Step has FINISHED forming!
        group.visible = exitScale > 0.001;

        if (elapsedMs < step.tPauseEndMs) {
          // Pause window right after this step has finished forming
          activeStepIdx = idx;
          group.userData = { stepIdx: idx, state: 'PAUSE_AFTER_FORMED', scale: exitScale, progress: 1.0 };
        } else {
          // Permanently settled in final position until exit dissolve
          group.userData = { stepIdx: idx, state: 'SETTLED', scale: exitScale, progress: 1.0 };
        }

        const hoverY = Math.sin(time * 2.2 + idx * 0.45) * 0.032;
        group.position.set(
          step.position.x,
          step.position.y + hoverY,
          step.position.z
        );
        group.scale.set(exitScale, exitScale, exitScale);
      }
    }

    // Position single leading light & sparkles at the actively materializing or newly formed step
    const leadingStep = activeStepIdx >= 0 ? steps[activeStepIdx] : null;
    const lightActive = leadingStep !== null && curProgress > 0.02 && curProgress < 0.90;

    if (leadLightRef.current) {
      if (leadingStep && lightActive) {
        leadLightRef.current.position.set(
          leadingStep.position.x,
          leadingStep.position.y + 0.45,
          leadingStep.position.z
        );
        leadLightRef.current.visible = true;
      } else {
        leadLightRef.current.visible = false;
      }
    }

    // Expose debug telemetry for automated acceptance testing and profiling
    if (typeof window !== 'undefined') {
      (window as any).__MAGICAL_STAIRS_DEBUG__ = {
        curProgress,
        elapsedMs,
        activeStepIdx,
        stepCount,
        steps: steps.map((_, i) => {
          const g = stepMeshRefs.current[i];
          return {
            idx: i,
            state: g?.userData?.state || 'HIDDEN',
            scale: g?.scale?.x || 0,
            visible: g?.visible || false,
            pos: g ? { x: g.position.x, y: g.position.y, z: g.position.z } : null,
          };
        }),
      };
    }
  });

  return (
    <group name="MagicalFloatingStairsRoot">
      {/* ------------------------------------------------------------------- */}
      {/* SINGLE DYNAMIC KEY POINT LIGHT                                      */}
      {/* ------------------------------------------------------------------- */}
      <pointLight
        ref={leadLightRef}
        color={emissiveColor}
        intensity={2.2}
        distance={7.5}
        decay={2}
      />

      {/* ------------------------------------------------------------------- */}
      {/* INDIVIDUAL FLOATING CRYSTAL STEPS                                    */}
      {/* ------------------------------------------------------------------- */}
      {steps.map((step, idx) => (
        <group
          key={`magical_step_${idx}`}
          ref={(el) => {
            stepMeshRefs.current[idx] = el;
          }}
          position={step.position}
          rotation={step.rotation}
          visible={false}
        >
          {/* A. Translucent Glass/Crystal Step Body */}
          <mesh geometry={geometries.body} material={materials.crystalMat} />

          {/* B. Slightly Glowing Edges */}
          <mesh geometry={geometries.edge} material={materials.edgeMat} />

          {/* C. Subtle Magical Rune Glyph */}
          <group position={[0, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={geometries.outerRune} material={materials.outerRuneMat} />
            <mesh geometry={geometries.innerRune} material={materials.runeMat} />
            <mesh
              geometry={geometries.diamondRune}
              material={materials.runeMat}
              rotation={[0, 0, Math.PI / 4]}
            />
          </group>
        </group>
      ))}
    </group>
  );
};
