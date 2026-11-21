import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SplineRailEngine, type ComponentSplineRail } from './SplineRailEngine';
import { assemblyEngine } from './AssemblyEngine';
import { useTheme } from '../context/ThemeContext';

export interface SplineGuideRailsProps {
  visible?: boolean;
}

/**
 * SplineGuideRails
 * Renders the authentic 3D NURBS/Catmull-Rom spline trajectory tracks looping through 3D space,
 * directly recreating the visual appearance of the Blender reference workspace (NurbsPath.001 - 011).
 */
export const SplineGuideRails: React.FC<SplineGuideRailsProps> = ({ visible = true }) => {
  const { isLight } = useTheme();
  const groupRef = useRef<THREE.Group>(null);
  const pulseBeadsRef = useRef<THREE.Points>(null);

  // Retrieve all registered component spline rails from the engine
  const rails: ComponentSplineRail[] = useMemo(() => {
    return SplineRailEngine.getAllRails();
  }, [SplineRailEngine.getAllRails().length]);

  // Construct combined LineSegments geometry for all 3D spline rails
  const lineGeometry = useMemo(() => {
    if (!rails || rails.length === 0) return null;

    const positions: number[] = [];
    const colors: number[] = [];

    // Base color
    const cStart = new THREE.Color(isLight ? '#c2410c' : '#38bdf8');
    const cMid = new THREE.Color(isLight ? '#d97706' : '#818cf8');
    const cEnd = new THREE.Color(isLight ? '#475569' : '#0284c7');

    for (const rail of rails) {
      const pts = rail.samplePoints;
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];

        positions.push(pA.x, pA.y, pA.z);
        positions.push(pB.x, pB.y, pB.z);

        const tA = i / (pts.length - 1);
        const tB = (i + 1) / (pts.length - 1);

        const colA = tA < 0.5 ? cStart.clone().lerp(cMid, tA * 2) : cMid.clone().lerp(cEnd, (tA - 0.5) * 2);
        const colB = tB < 0.5 ? cStart.clone().lerp(cMid, tB * 2) : cMid.clone().lerp(cEnd, (tB - 0.5) * 2);

        colors.push(colA.r, colA.g, colA.b);
        colors.push(colB.r, colB.g, colB.b);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [rails, isLight]);

  // Pulse particles that travel along rails
  const pulseGeometry = useMemo(() => {
    if (!rails || rails.length === 0) return null;
    const positions = new Float32Array(rails.length * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [rails]);

  useFrame(() => {
    if (!visible || !pulseBeadsRef.current || !rails || rails.length === 0) return;

    const state = assemblyEngine.getState();
    const progress = state.progress;
    const posAttr = pulseBeadsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    const vTemp = new THREE.Vector3();
    for (let i = 0; i < rails.length; i++) {
      const rail = rails[i];
      // Disperse beads based on progress
      const u = (progress + (i * 0.17)) % 1.0;
      rail.curve.getPointAt(u, vTemp);
      array[i * 3] = vTemp.x;
      array[i * 3 + 1] = vTemp.y;
      array[i * 3 + 2] = vTemp.z;
    }
    posAttr.needsUpdate = true;
  });

  if (!visible || !lineGeometry) return null;

  return (
    <group ref={groupRef} name="SplineGuideRailsLayer">
      {/* 1. Continuous 3D Spline Guide Rail Tracks */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={isLight ? 0.38 : 0.42}
          blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Traveling Magical Trajectory Beads */}
      {pulseGeometry && (
        <points ref={pulseBeadsRef} geometry={pulseGeometry}>
          <pointsMaterial
            size={isLight ? 0.18 : 0.22}
            color={isLight ? '#c2410c' : '#38bdf8'}
            transparent={true}
            opacity={0.8}
            blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
};
