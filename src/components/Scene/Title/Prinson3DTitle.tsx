import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  PRINSON_LANGUAGES,
  type LanguageGlyphEntry,
  type GlyphCommand,
} from './prinsonGlyphData';

interface Prinson3DTitleProps {
  /** Optional custom world position behind the island */
  position?: [number, number, number];
  /** Optional custom rotation facing the camera */
  rotation?: [number, number, number];
}

/** Converts pre-extracted glyph commands into Three.js 2D Shapes */
function glyphCommandsToShapes(
  commands: GlyphCommand[],
  scaleFactor: number
): THREE.Shape[] {
  const shapePath = new THREE.ShapePath();

  for (const cmd of commands) {
    if (cmd.type === 'M' && cmd.x !== undefined && cmd.y !== undefined) {
      shapePath.moveTo(cmd.x * scaleFactor, -cmd.y * scaleFactor);
    } else if (cmd.type === 'L' && cmd.x !== undefined && cmd.y !== undefined) {
      shapePath.lineTo(cmd.x * scaleFactor, -cmd.y * scaleFactor);
    } else if (
      cmd.type === 'C' &&
      cmd.x1 !== undefined &&
      cmd.y1 !== undefined &&
      cmd.x2 !== undefined &&
      cmd.y2 !== undefined &&
      cmd.x !== undefined &&
      cmd.y !== undefined
    ) {
      shapePath.bezierCurveTo(
        cmd.x1 * scaleFactor,
        -cmd.y1 * scaleFactor,
        cmd.x2 * scaleFactor,
        -cmd.y2 * scaleFactor,
        cmd.x * scaleFactor,
        -cmd.y * scaleFactor
      );
    } else if (
      cmd.type === 'Q' &&
      cmd.x1 !== undefined &&
      cmd.y1 !== undefined &&
      cmd.x !== undefined &&
      cmd.y !== undefined
    ) {
      shapePath.quadraticCurveTo(
        cmd.x1 * scaleFactor,
        -cmd.y1 * scaleFactor,
        cmd.x * scaleFactor,
        -cmd.y * scaleFactor
      );
    } else if (cmd.type === 'Z') {
      shapePath.currentPath?.closePath();
    }
  }

  return (shapePath as any).toShapes(true);
}

/** Smoothstep interpolation for easing */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const Prinson3DTitle: React.FC<Prinson3DTitleProps> = ({
  position,
  rotation,
}) => {
  const { size } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  // Reduced motion preference detection
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = mq.matches;
      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotion.current = e.matches;
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  // Responsive scale and stationary background position
  const responsiveScale = isMobile ? 0.58 : isTablet ? 0.78 : 0.95;
  const effectivePosition: [number, number, number] =
    position ||
    (isMobile
      ? [-8.2, 5.8, -8.2]
      : isTablet
      ? [-9.0, 6.1, -9.0]
      : [-9.8, 6.4, -9.8]);
  const effectiveRotation: [number, number, number] =
    rotation || [-0.065, Math.PI / 4, 0]; // Exact 45° angle directly facing default camera

  // Pre-bake all 6 3D ExtrudeGeometries once on mount
  const geometries = useMemo(() => {
    return PRINSON_LANGUAGES.map((lang: LanguageGlyphEntry) => {
      // Scale factor to normalize font units to world units
      const scaleFactor = (lang.targetWidth / lang.bbox.width) * responsiveScale;
      const shapes = glyphCommandsToShapes(lang.commands, scaleFactor);

      const geom = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.32 * responsiveScale,
        bevelEnabled: true,
        bevelThickness: 0.05 * responsiveScale,
        bevelSize: 0.028 * responsiveScale,
        bevelSegments: 3,
        curveSegments: 8,
      });

      // Center geometry precisely so all writing systems align on identical baseline and center
      geom.center();
      geom.computeVertexNormals();
      return { id: lang.id, name: lang.name, text: lang.text, geometry: geom };
    });
  }, [responsiveScale]);

  // Clean disposal of geometries on unmount
  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.geometry.dispose());
    };
  }, [geometries]);

  // Two dedicated mesh references for continuous smooth crossfading transitions
  const outgoingMeshRef = useRef<THREE.Mesh>(null);
  const incomingMeshRef = useRef<THREE.Mesh>(null);

  // Dedicated shared materials for outgoing and incoming
  const outgoingMatRef = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'), // Brilliant silver-white
      metalness: 0.78,
      roughness: 0.20,
      emissive: new THREE.Color('#38bdf8'), // Muted cyan rim illumination
      emissiveIntensity: 0.30,
      transparent: true,
      opacity: 1.0,
      depthTest: true,
      depthWrite: true,
    })
  );

  const incomingMatRef = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0.78,
      roughness: 0.20,
      emissive: new THREE.Color('#38bdf8'),
      emissiveIntensity: 0.30,
      transparent: true,
      opacity: 0.0,
      depthTest: true,
      depthWrite: false, // Avoid z-fighting during fade-in
    })
  );

  useEffect(() => {
    const outMat = outgoingMatRef.current;
    const inMat = incomingMatRef.current;
    return () => {
      outMat.dispose();
      inMat.dispose();
    };
  }, []);

  // Animation Timing Targets:
  // - HOLD_DURATION: 1.5s (1500ms) - each language visible for ~1.5s
  // - TRANSITION_DURATION: 0.85s (850ms) - transition duration
  // - Total duration per language: 2.35s
  const HOLD_DURATION = 1.5;
  const TRANSITION_DURATION = 0.85;
  const CYCLE_DURATION = HOLD_DURATION + TRANSITION_DURATION;

  const currentLangIndexRef = useRef(0);
  const timeAccumulatorRef = useRef(0);

  // Initialize geometries
  useEffect(() => {
    if (outgoingMeshRef.current && geometries[0]) {
      outgoingMeshRef.current.geometry = geometries[0].geometry;
    }
    if (incomingMeshRef.current && geometries[1]) {
      incomingMeshRef.current.geometry = geometries[1].geometry;
    }
  }, [geometries]);

  useFrame((state, delta) => {
    if (!outgoingMeshRef.current || !incomingMeshRef.current) return;

    // Gentle fantasy hover breathing: 0.07 units amplitude
    const gentleHover = Math.sin(state.clock.elapsedTime * 0.75) * 0.07;

    if (prefersReducedMotion.current) {
      // Reduced motion: maintain stable English display
      outgoingMeshRef.current.visible = true;
      incomingMeshRef.current.visible = false;
      outgoingMeshRef.current.position.set(0, gentleHover, 0);
      outgoingMatRef.current.opacity = 1.0;
      return;
    }

    timeAccumulatorRef.current += delta;

    // Advance cycle index when accumulator exceeds cycle duration
    while (timeAccumulatorRef.current >= CYCLE_DURATION) {
      timeAccumulatorRef.current -= CYCLE_DURATION;
      currentLangIndexRef.current =
        (currentLangIndexRef.current + 1) % geometries.length;
    }

    const currentIdx = currentLangIndexRef.current;
    const nextIdx = (currentIdx + 1) % geometries.length;

    // Synchronize mesh geometries
    if (outgoingMeshRef.current.geometry !== geometries[currentIdx].geometry) {
      outgoingMeshRef.current.geometry = geometries[currentIdx].geometry;
    }
    if (incomingMeshRef.current.geometry !== geometries[nextIdx].geometry) {
      incomingMeshRef.current.geometry = geometries[nextIdx].geometry;
    }

    const elapsed = timeAccumulatorRef.current;

    if (elapsed < HOLD_DURATION) {
      // 1. HOLD PHASE: Active language is 100% visible, incoming is hidden
      outgoingMeshRef.current.visible = true;
      incomingMeshRef.current.visible = false;

      outgoingMatRef.current.opacity = 1.0;
      outgoingMatRef.current.depthWrite = true;
      outgoingMatRef.current.emissiveIntensity = 0.22;
      outgoingMeshRef.current.position.set(0, gentleHover, 0);
    } else {
      // 2. TRANSITION PHASE: Smooth crossfade and subtle 3D vertical gliding
      outgoingMeshRef.current.visible = true;
      incomingMeshRef.current.visible = true;

      const progress = (elapsed - HOLD_DURATION) / TRANSITION_DURATION;
      const t = smoothstep(0, 1, progress);

      // Outgoing: Fades 1.0 -> 0.0 and gently rises +0.32
      outgoingMatRef.current.opacity = 1.0 - t;
      outgoingMatRef.current.depthWrite = t < 0.5;
      outgoingMeshRef.current.position.set(0, gentleHover + t * 0.32, 0);

      // Incoming: Fades 0.0 -> 1.0 and gently settles from -0.32 into baseline
      incomingMatRef.current.opacity = t;
      incomingMatRef.current.depthWrite = t > 0.5;
      incomingMeshRef.current.position.set(0, gentleHover + (1.0 - t) * -0.32, 0);

      // Emissive pulse during transition
      const pulseIntensity = 0.22 + Math.sin(t * Math.PI) * 0.16;
      outgoingMatRef.current.emissiveIntensity = pulseIntensity;
      incomingMatRef.current.emissiveIntensity = pulseIntensity;
    }
  });

  const titleRootRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && titleRootRef.current) {
      (window as any).__PRINSON_3D_TITLE__ = titleRootRef.current;
    }
  }, []);

  return (
    <group
      ref={titleRootRef}
      name="StationaryPrinson3DTitleRoot"
      position={effectivePosition}
      rotation={effectiveRotation}
      matrixAutoUpdate={true}
    >
      {/* Dedicated top/front rim light for specular metallic sheen */}
      <directionalLight
        position={[-6, 12, -4]}
        intensity={1.8}
        color="#bae6fd"
      />

      {/* Outgoing Language 3D Text Mesh */}
      <mesh
        ref={outgoingMeshRef}
        material={outgoingMatRef.current}
        castShadow={false}
        receiveShadow={false}
      />

      {/* Incoming Language 3D Text Mesh */}
      <mesh
        ref={incomingMeshRef}
        material={incomingMatRef.current}
        castShadow={false}
        receiveShadow={false}
        visible={false}
      />
    </group>
  );
};
