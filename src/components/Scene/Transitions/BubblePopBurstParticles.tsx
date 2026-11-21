import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BubblePopBurstParticlesProps {
  active: boolean;
  center?: [number, number, number];
  burstRadius?: number;
  particleCount?: number;
}

interface ParticleData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

/**
 * BubblePopBurstParticles
 *
 * Renders an explosion of sparkling, iridescent water droplets and an expanding
 * shockwave ring when the bubble pops, dissolving cleanly into the air.
 */
export const BubblePopBurstParticles: React.FC<BubblePopBurstParticlesProps> = ({
  active,
  center = [0, 0.5, 0],
  burstRadius = 9.5,
  particleCount = 110,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const isBurstingRef = useRef(false);

  const colors = useMemo(
    () => [
      new THREE.Color('#38bdf8'), // Cyan
      new THREE.Color('#f472b6'), // Rose
      new THREE.Color('#facc15'), // Gold
      new THREE.Color('#c084fc'), // Violet
      new THREE.Color('#ffffff'), // White glint
    ],
    []
  );

  const particles = useMemo<ParticleData[]>(() => {
    const list: ParticleData[] = [];
    for (let i = 0; i < particleCount; i++) {
      // Random point on sphere of radius ~burstRadius
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = burstRadius * (0.95 + Math.random() * 0.1);

      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.sin(phi) * Math.sin(theta);
      const nz = Math.cos(phi);

      const pos = new THREE.Vector3(
        center[0] + nx * r,
        center[1] + ny * r,
        center[2] + nz * r
      );

      // Velocity shoots outward radially with slight upward drift
      const speed = 7.0 + Math.random() * 8.0;
      const vel = new THREE.Vector3(nx * speed, ny * speed + 1.5, nz * speed);

      const color = colors[i % colors.length];
      const size = 0.25 + Math.random() * 0.35;

      list.push({ pos, vel, color, size });
    }
    return list;
  }, [burstRadius, center, colors, particleCount]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = particles[i].pos.x;
      positions[i * 3 + 1] = particles[i].pos.y;
      positions[i * 3 + 2] = particles[i].pos.z;

      colArray[i * 3 + 0] = particles[i].color.r;
      colArray[i * 3 + 1] = particles[i].color.g;
      colArray[i * 3 + 2] = particles[i].color.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    return geom;
  }, [particles, particleCount]);

  // Points material with circular alpha
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const ringMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  useEffect(() => {
    if (active) {
      elapsedRef.current = 0;
      isBurstingRef.current = true;

      // Reset initial positions
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        posAttr.setXYZ(i, particles[i].pos.x, particles[i].pos.y, particles[i].pos.z);
      }
      posAttr.needsUpdate = true;
    }
  }, [active, geometry, particles, particleCount]);

  useFrame((_, delta) => {
    if (!isBurstingRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const duration = 0.45; // 450ms particle life
    const progress = Math.min(1.0, t / duration);

    // Fade out over duration
    const alpha = (1.0 - progress) * (1.0 - progress);
    material.opacity = alpha;
    ringMaterial.opacity = alpha * 0.45;

    // Expand shockwave ring
    if (ringRef.current) {
      const ringScale = burstRadius * (0.8 + progress * 0.7);
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }

    // Move droplets radially outwards with drag
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const drag = Math.exp(-4.5 * delta);

    for (let i = 0; i < particleCount; i++) {
      particles[i].vel.multiplyScalar(drag);
      particles[i].vel.y -= 2.0 * delta; // slight gravity

      const x = posAttr.getX(i) + particles[i].vel.x * delta;
      const y = posAttr.getY(i) + particles[i].vel.y * delta;
      const z = posAttr.getZ(i) + particles[i].vel.z * delta;

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    if (progress >= 1.0) {
      isBurstingRef.current = false;
      material.opacity = 0.0;
      ringMaterial.opacity = 0.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <mesh
        ref={ringRef}
        position={center}
        rotation={[-Math.PI / 2, 0, 0]}
        material={ringMaterial}
      >
        <ringGeometry args={[0.98, 1.05, 48]} />
      </mesh>
    </group>
  );
};
