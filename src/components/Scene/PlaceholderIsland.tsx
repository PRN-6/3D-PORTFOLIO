import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';

interface PlaceholderIslandProps {
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  position?: [number, number, number];
  scale?: [number, number, number];
}

interface AnchorPoint {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  description: string;
}

const PLANNED_AREAS: AnchorPoint[] = [
  {
    id: 'hero_house',
    name: "Hero's House",
    position: [0, 0.8, -1.5],
    color: '#60a5fa',
    description: 'Medieval cottage & personal quarters',
  },
  {
    id: 'training_area',
    name: 'Training Grounds',
    position: [-2.5, 0.8, 1.2],
    color: '#f87171',
    description: 'Combat practice & skill display',
  },
  {
    id: 'farm_area',
    name: 'Small Farm',
    position: [2.5, 0.8, 1.2],
    color: '#4ade80',
    description: 'Crops, windmill & nature',
  },
  {
    id: 'party_members',
    name: 'Party Gathering',
    position: [0.2, 0.8, 2],
    color: '#fbbf24',
    description: 'Campfire & companion characters',
  },
];

export const PlaceholderIsland: React.FC<PlaceholderIslandProps> = ({
  onSelectObject,
  onHoverObject,
  position = [0, 0, 0],
  scale = [1, 1, 1],
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);

  // Gentle idle rotation for runes and slight floating effect
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
    }
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.08;
    }
  });

  const handlePointerOver = (name: string, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredAnchor(name);
    onHoverObject?.(name);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredAnchor(null);
    onHoverObject?.(null);
  };

  const handleClick = (name: string, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectObject?.(name, e.point);
  };

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Upper Floating Pedestal (Island Base Placeholder) */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[5, 4.2, 1.2, 32]} />
        <meshStandardMaterial
          color="#1e2235"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Floating Underside Crags (Rocky lower base) */}
      <mesh position={[0, -1.2, 0]}>
        <coneGeometry args={[4.2, 1.8, 8]} />
        <meshStandardMaterial
          color="#131624"
          roughness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Island Boundary Ring Indicator */}
      <mesh ref={ringRef} position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.9, 5.05, 48]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Rune Circle */}
      <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.85, 32]} />
        <meshBasicMaterial
          color="#818cf8"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Center Crystal / Beacon */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 2.2, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#8b5cf6"
            emissiveIntensity={1.2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* 3D Label indicating foundation status */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.28}
        color="#e0e7ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        ISLAND FOUNDATION READY
      </Text>

      <Text
        position={[0, 0.9, 0]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Awaiting public/models/home-island.glb
      </Text>

      {/* Interactive Anchor Placeholders for future model zones */}
      {PLANNED_AREAS.map((anchor) => {
        const isHovered = hoveredAnchor === anchor.id;
        return (
          <group
            key={anchor.id}
            position={anchor.position}
            onPointerOver={(e) => handlePointerOver(anchor.id, e)}
            onPointerOut={handlePointerOut}
            onClick={(e) => handleClick(anchor.id, e)}
          >
            {/* Zone Beacon */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.2, 0.25, 0.5, 6]} />
              <meshStandardMaterial
                color={anchor.color}
                emissive={anchor.color}
                emissiveIntensity={isHovered ? 1.5 : 0.4}
                roughness={0.4}
              />
            </mesh>

            {/* Pulsing Base Ring */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 0.45, 16]} />
              <meshBasicMaterial
                color={anchor.color}
                transparent
                opacity={isHovered ? 0.9 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Floating Zone Name */}
            <Text
              position={[0, 0.75, 0]}
              fontSize={0.18}
              color={isHovered ? '#ffffff' : '#cbd5e1'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.015}
              outlineColor="#090a0f"
            >
              {anchor.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
};
