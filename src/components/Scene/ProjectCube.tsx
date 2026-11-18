import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import type { ProjectItem } from '../../data/projectsData';

interface ProjectCubeProps {
  project: ProjectItem;
  isSelected: boolean;
  isAnySelected: boolean;
  onSelect: (project: ProjectItem) => void;
  index: number;
}

export const ProjectCube: React.FC<ProjectCubeProps> = ({
  project,
  isSelected,
  isAnySelected,
  onSelect,
  index,
}) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const cubeMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Target positions & rotations
  const basePosition = useMemo(() => new THREE.Vector3(...project.position), [project.position]);
  const currentPos = useRef(basePosition.clone());
  
  // Independent floating phase and rotation speeds
  const phase = useMemo(() => index * 1.35, [index]);
  const rotSpeed = useMemo(() => project.rotationSpeed, [project.rotationSpeed]);

  // Accent color instance
  const accentColor = useMemo(() => new THREE.Color(project.accentColor), [project.accentColor]);

  // Subtle drag prevention so orbiting the camera doesn't accidentally click a cube
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshGroupRef.current) return;

    const t = state.clock.getElapsedTime();
    const group = meshGroupRef.current;

    if (isSelected) {
      // Smoothly fly towards camera center for inspection
      const targetPos = new THREE.Vector3(0, 1.3, 7.8);
      currentPos.current.lerp(targetPos, Math.min(delta * 4.5, 0.25));
      group.position.copy(currentPos.current);

      // Smoothly align rotation to face camera directly
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0, 8, delta);
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0, 8, delta);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, 0, 8, delta);

      // Scale up when inspected
      const targetScale = project.size * 1.35;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(delta * 5, 0.25));
    } else if (isAnySelected) {
      // Other cubes smoothly retreat into background and dim
      const backgroundPos = basePosition.clone().add(new THREE.Vector3(0, 0, -4.5));
      currentPos.current.lerp(backgroundPos, Math.min(delta * 3.5, 0.2));
      group.position.copy(currentPos.current);

      // Slow drift
      group.rotation.y += rotSpeed[1] * delta * 0.4;
      group.rotation.x += rotSpeed[0] * delta * 0.4;

      const dimScale = project.size * 0.85;
      group.scale.lerp(new THREE.Vector3(dimScale, dimScale, dimScale), Math.min(delta * 4, 0.2));
    } else {
      // Normal floating state
      const bobY = Math.sin(t * 0.8 + phase) * 0.22;
      const bobX = Math.cos(t * 0.6 + phase) * 0.12;
      const targetPos = basePosition.clone().add(new THREE.Vector3(bobX, bobY, 0));

      currentPos.current.lerp(targetPos, Math.min(delta * 3.5, 0.2));
      group.position.copy(currentPos.current);

      // Gentle continuous rotation
      group.rotation.y += rotSpeed[1] * delta;
      group.rotation.x += rotSpeed[0] * delta;
      group.rotation.z += rotSpeed[2] * delta * 0.5;

      // Hover scale feedback
      const hoverScaleMultiplier = hovered ? 1.1 : 1.0;
      const targetScale = project.size * hoverScaleMultiplier;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(delta * 6, 0.3));
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Only trigger if user didn't drag/orbit
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx < 6 && dy < 6) {
      onSelect(project);
    }
  };

  const halfSize = 0.5;

  return (
    <group
      ref={meshGroupRef}
      position={project.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Premium Metallic Rounded Cube Body */}
      <RoundedBox
        ref={cubeMeshRef}
        args={[1, 1, 1]}
        radius={0.06}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={isAnySelected && !isSelected ? '#080a0f' : '#0e111a'}
          metalness={0.88}
          roughness={0.24}
          envMapIntensity={1.2}
          transparent={isAnySelected && !isSelected}
          opacity={isAnySelected && !isSelected ? 0.35 : 1.0}
        />
      </RoundedBox>

      {/* Subtle Glowing Wireframe Accent Frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.002, 1.002, 1.002)]} />
        <lineBasicMaterial
          color={accentColor}
          transparent
          opacity={
            isSelected
              ? 0.95
              : hovered
              ? 0.85
              : isAnySelected
              ? 0.15
              : 0.45
          }
          toneMapped={false}
        />
      </lineSegments>

      {/* Front Face Minimal Project Badge */}
      <group position={[0, 0, halfSize + 0.005]}>
        {/* Subtle Face Panel Inset */}
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[0.88, 0.88]} />
          <meshStandardMaterial
            color="#080a12"
            metalness={0.92}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Minimal Category Tag */}
        <Text
          position={[0, 0.28, 0.005]}
          fontSize={0.052}
          color={hovered || isSelected ? project.accentColor : '#94a3b8'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          {project.category.toUpperCase()}
        </Text>

        {/* Project Title */}
        <Text
          position={[0, 0.08, 0.005]}
          fontSize={0.095}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          maxWidth={0.82}
          textAlign="center"
        >
          {project.title}
        </Text>

        {/* Primary Tech Badges Preview */}
        <Text
          position={[0, -0.16, 0.005]}
          fontSize={0.048}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
          maxWidth={0.82}
        >
          {project.technologies.slice(0, 3).join(' • ')}
        </Text>

        {/* Bottom Accent Dot */}
        <mesh position={[0, -0.32, 0.005]}>
          <circleGeometry args={[0.022, 16]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={hovered || isSelected ? 1.0 : 0.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Back Face Minimal Identifier */}
      <group position={[0, 0, -halfSize - 0.005]} rotation={[0, Math.PI, 0]}>
        <Text
          position={[0, 0.05, 0.005]}
          fontSize={0.09}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {project.title}
        </Text>
        <Text
          position={[0, -0.12, 0.005]}
          fontSize={0.05}
          color={project.accentColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          CLICK TO INSPECT
        </Text>
      </group>
    </group>
  );
};
