import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BubbleAnimationMode } from './BlackBubbleMesh';

interface BlackBubbleRimDropletsProps {
  radius?: number;
  progress: number;
  mode: BubbleAnimationMode;
  position?: [number, number, number];
  dropletCount?: number;
}

interface DropletParticle {
  angle: number; // Angle around the rim circle [0, 2pi]
  radialOffset: number; // Slight radial variance
  size: number;
  tearVel: THREE.Vector3; // Ejection velocity when tearing
  currentPos: THREE.Vector3;
}

/**
 * BlackBubbleRimDroplets
 *
 * Simulates the liquid droplet beads that drip and spray from the tear rim,
 * replicating the hand-crafted frames of the reference bubble animation sprite.
 */
export const BlackBubbleRimDroplets: React.FC<BlackBubbleRimDropletsProps> = ({
  radius = 10.2,
  progress,
  mode,
  position = [0, 0.5, 0],
  dropletCount = 90,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Sweep axis: diagonal vector towards bottom-right (matching BlackBubbleMesh)
  const sweepAxis = useMemo(() => new THREE.Vector3(0.55, -0.65, 0.45).normalize(), []);

  // Compute basis vectors perpendicular to sweepAxis for the rim circle
  const { tangentU, tangentV } = useMemo(() => {
    const up = Math.abs(sweepAxis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(sweepAxis, up).normalize();
    const v = new THREE.Vector3().crossVectors(sweepAxis, u).normalize();
    return { tangentU: u, tangentV: v };
  }, [sweepAxis]);

  const dropletData = useMemo<DropletParticle[]>(() => {
    const list: DropletParticle[] = [];
    for (let i = 0; i < dropletCount; i++) {
      const angle = (i / dropletCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const radialOffset = 1.0 + (Math.random() - 0.5) * 0.12;
      const size = 0.35 + Math.random() * 0.45;

      // Random ejection velocity vector for when tearing occurs
      const spread = 5.0 + Math.random() * 7.0;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        Math.random() * 4.0 + 1.5,
        (Math.random() - 0.5) * spread
      );

      list.push({
        angle,
        radialOffset,
        size,
        tearVel: vel,
        currentPos: new THREE.Vector3(),
      });
    }
    return list;
  }, [dropletCount]);

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(dropletCount * 3);
    const colors = new Float32Array(dropletCount * 3);

    for (let i = 0; i < dropletCount; i++) {
      // Glossy deep black droplets with crisp silver/cyan highlight glints
      const isGlint = i % 3 === 0;
      colors[i * 3 + 0] = isGlint ? 0.85 : 0.05;
      colors[i * 3 + 1] = isGlint ? 0.90 : 0.05;
      colors[i * 3 + 2] = isGlint ? 0.98 : 0.08;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    return { geometry: geom, material: mat };
  }, [dropletCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!pointsRef.current) return;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const t = timeRef.current;

    // Active sweep height along sweepAxis (-1.0 to +1.0)
    let sweepProgress = progress;
    if (mode === 'TEARING') {
      sweepProgress = progress; // tear advances
    }
    // Clamped height in [-0.98, +0.98] so the rim circle exists
    const h = (sweepProgress * 2.0 - 1.0) * 0.96;
    const rRim = Math.max(0.1, radius * Math.sqrt(Math.max(0.01, 1.0 - h * h)));
    const centerDist = radius * h;

    for (let i = 0; i < dropletCount; i++) {
      const p = dropletData[i];

      if (mode === 'FORMING') {
        // Droplets cling directly to the advancing wave front
        const wobble = Math.sin(p.angle * 4.0 + t * 6.0) * 0.25;
        const currentR = (rRim + wobble) * p.radialOffset;

        const cosA = Math.cos(p.angle + t * 0.5);
        const sinA = Math.sin(p.angle + t * 0.5);

        const x = position[0] + sweepAxis.x * centerDist + (tangentU.x * cosA + tangentV.x * sinA) * currentR;
        const y = position[1] + sweepAxis.y * centerDist + (tangentU.y * cosA + tangentV.y * sinA) * currentR;
        const z = position[2] + sweepAxis.z * centerDist + (tangentU.z * cosA + tangentV.z * sinA) * currentR;

        p.currentPos.set(x, y, z);
      } else if (mode === 'SEALED') {
        // Sealed: droplets quickly dissolve into the bubble skin
        material.opacity = Math.max(0, material.opacity - delta * 4.0);
      } else if (mode === 'TEARING') {
        // Tearing: droplets spray outward into the air from the receding rip
        material.opacity = Math.max(0, 1.0 - progress * 1.1);

        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);
        const ejectDist = progress * 8.0;

        // Radial outward direction from center
        const radialDir = new THREE.Vector3(
          tangentU.x * cosA + tangentV.x * sinA,
          tangentU.y * cosA + tangentV.y * sinA,
          tangentU.z * cosA + tangentV.z * sinA
        ).normalize();

        const x = position[0] + sweepAxis.x * centerDist + radialDir.x * (rRim + ejectDist) + p.tearVel.x * progress * 0.5;
        const y = position[1] + sweepAxis.y * centerDist + radialDir.y * (rRim + ejectDist) + p.tearVel.y * progress * 0.5 - progress * progress * 2.0;
        const z = position[2] + sweepAxis.z * centerDist + radialDir.z * (rRim + ejectDist) + p.tearVel.z * progress * 0.5;

        p.currentPos.set(x, y, z);
      }

      posAttr.setXYZ(i, p.currentPos.x, p.currentPos.y, p.currentPos.z);
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
