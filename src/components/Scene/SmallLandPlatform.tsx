import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

/**
 * Small floating fantasy landmass / island terrace positioned right beneath
 * the four Chibi companions so they have real grounded land to stand, idle, and walk upon.
 */
export const SmallLandPlatform: React.FC = () => {
  // Stepping stones / flagstones along the walkway path
  const flagstones = useMemo(() => {
    const stones: Array<{
      pos: [number, number, number];
      size: [number, number, number];
      rot: number;
      color: string;
    }> = [];

    const colors = ['#64748b', '#52525b', '#475569', '#3f3f46', '#5b6577'];
    const xPositions = [
      -3.6, -3.0, -2.4, -1.8, -1.2, -0.6, 0.0, 0.6, 1.2, 1.8, 2.4, 3.0, 3.6,
    ];

    xPositions.forEach((x, i) => {
      // Slightly alternate Z for an organic garden pathway feel
      const zOffset = Math.sin(i * 1.7) * 0.22;
      const z = 6.15 + zOffset;
      const width = 0.55 + ((i * 7) % 5) * 0.06;
      const depth = 0.45 + ((i * 11) % 4) * 0.05;
      const rot = ((i * 13) % 7) * 0.15;
      const color = colors[i % colors.length];

      stones.push({
        pos: [x, -1.693, z],
        size: [width, 0.024, depth],
        rot,
        color,
      });

      // Add a smaller secondary side stone for organic variety
      if (i % 2 === 0) {
        stones.push({
          pos: [x + 0.28, -1.694, z + (i % 4 === 0 ? 0.32 : -0.32)],
          size: [width * 0.65, 0.02, depth * 0.65],
          rot: rot + 0.6,
          color: colors[(i + 2) % colors.length],
        });
      }
    });

    return stones;
  }, []);

  // Clustered fantasy wildflowers along the edges
  const flowers = useMemo(() => {
    const list: Array<{
      pos: [number, number, number];
      color: string;
      scale: number;
    }> = [];

    const flowerColors = ['#fde047', '#c084fc', '#f8fafc', '#fb923c', '#e879f9'];

    // Back edge and corners of the island
    for (let i = 0; i < 28; i++) {
      const u = i / 27; // 0 to 1
      const x = THREE.MathUtils.lerp(-4.1, 4.1, u) + (Math.sin(i * 3.1) * 0.15);
      // Mostly on rear edge (Z ~ 5.3) or front perimeter (Z ~ 7.0)
      const isBack = i % 3 !== 0;
      const z = isBack ? 5.35 + (i % 4) * 0.08 : 6.95 - (i % 3) * 0.06;
      const color = flowerColors[i % flowerColors.length];
      const scale = 0.045 + (i % 4) * 0.015;

      list.push({
        pos: [x, -1.685, z],
        color,
        scale,
      });
    }

    return list;
  }, []);

  return (
    <group name="SmallLandPlatform" position={[0, 0, 0]}>
      {/* 1. Lush Green Meadow Top Turf (Receives Shadows from Characters) */}
      <RoundedBox
        receiveShadow
        args={[9.2, 0.16, 2.2]}
        radius={0.35}
        smoothness={4}
        position={[0, -1.78, 6.15]}
      >
        <meshStandardMaterial
          color="#426b1d" // Fantasy meadow green
          roughness={0.85}
          metalness={0.05}
        />
      </RoundedBox>

      {/* 2. Soft Sunlit Grass Lip / Rim Overhang */}
      <RoundedBox
        receiveShadow
        args={[9.35, 0.06, 2.32]}
        radius={0.32}
        smoothness={4}
        position={[0, -1.73, 6.15]}
      >
        <meshStandardMaterial
          color="#568a26" // Brighter edge crest
          roughness={0.8}
          metalness={0.05}
        />
      </RoundedBox>

      {/* 3. Cobblestone / Flagstone Walkway Stones */}
      {flagstones.map((stone, idx) => (
        <RoundedBox
          key={`flagstone-${idx}`}
          receiveShadow
          args={stone.size}
          radius={0.015}
          smoothness={3}
          position={stone.pos}
          rotation={[0, stone.rot, 0]}
        >
          <meshStandardMaterial
            color={stone.color}
            roughness={0.88}
            metalness={0.12}
          />
        </RoundedBox>
      ))}

      {/* 4. Rich Dark Soil & Loam Strata (Sub-layer) */}
      <RoundedBox
        args={[8.85, 0.32, 2.0]}
        radius={0.25}
        smoothness={4}
        position={[0, -1.96, 6.15]}
      >
        <meshStandardMaterial
          color="#382213" // Rich dark earth
          roughness={0.92}
          metalness={0.05}
        />
      </RoundedBox>

      {/* 5. Faceted Rocky Cliff Keel (Island Bedrock) */}
      <RoundedBox
        args={[7.9, 0.46, 1.65]}
        radius={0.2}
        smoothness={3}
        position={[0, -2.28, 6.15]}
      >
        <meshStandardMaterial
          color="#242120" // Dark stone
          roughness={0.88}
          metalness={0.15}
          flatShading
        />
      </RoundedBox>

      {/* 6. Floating Island Rock Stalactite Roots (Tapering downwards) */}
      {/* Root 1 (Left) */}
      <mesh position={[-2.4, -2.55, 6.18]} rotation={[0, 0.4, 0]}>
        <coneGeometry args={[0.75, 0.85, 5]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} flatShading />
      </mesh>
      {/* Root 2 (Center-Main) */}
      <mesh position={[0.4, -2.7, 6.12]} rotation={[0, -0.6, 0]}>
        <coneGeometry args={[0.95, 1.05, 6]} />
        <meshStandardMaterial color="#1a1816" roughness={0.9} flatShading />
      </mesh>
      {/* Root 3 (Right) */}
      <mesh position={[2.6, -2.52, 6.16]} rotation={[0, 0.8, 0]}>
        <coneGeometry args={[0.7, 0.78, 5]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} flatShading />
      </mesh>

      {/* 7. Charming Flank Boulders / Mossy Rocks on Corners */}
      {/* Left Boulder */}
      <mesh position={[-4.25, -1.68, 5.6]} rotation={[0.2, 0.5, -0.1]}>
        <dodecahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
      </mesh>
      {/* Right Boulder */}
      <mesh position={[4.25, -1.68, 5.6]} rotation={[-0.3, -0.4, 0.2]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
      </mesh>

      {/* 8. Tiny Fantasy Wildflowers along the edges */}
      {flowers.map((fl, idx) => (
        <group key={`flower-${idx}`} position={fl.pos}>
          {/* Stem */}
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.05, 4]} />
            <meshBasicMaterial color="#3f6212" />
          </mesh>
          {/* Blossom Petals */}
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[fl.scale, 5, 5]} />
            <meshBasicMaterial color={fl.color} />
          </mesh>
        </group>
      ))}

      {/* 9. Soft ethereal underglow highlighting the floating island edge */}
      <pointLight
        position={[0, -2.1, 6.2]}
        color="#818cf8"
        intensity={0.65}
        distance={7}
        decay={2}
      />
    </group>
  );
};
