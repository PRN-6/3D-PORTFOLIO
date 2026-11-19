import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BookOpen, Sparkles as SparklesIcon } from 'lucide-react';

export interface GardenBiographyInteractionProps {
  onOpenAboutModal: () => void;
  isModalOpen?: boolean;
}

export const GardenBiographyInteraction: React.FC<GardenBiographyInteractionProps> = ({
  onOpenAboutModal,
  isModalOpen = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const pedestalRef = useRef<THREE.Group>(null);

  // Subtle floating rotation on the arcane concentric ring
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
    }
    if (pedestalRef.current) {
      pedestalRef.current.position.y = 0.45 + Math.sin(t * 1.8) * 0.03;
    }
  });

  return (
    <group position={[1.4, 0.42, 0.8]} name="ForestBiographyInteractionRoot">
      {/* 1. Invisible Raycast Hit Trigger Box */}
      <mesh
        position={[0, 0.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenAboutModal();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[1.2, 1.0, 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 2. Floating Concentric Arcane Magic Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.25, 0]}
      >
        <ringGeometry args={[0.55, 0.65, 32]} />
        <meshBasicMaterial
          color={hovered ? '#38bdf8' : '#818cf8'}
          transparent
          opacity={hovered ? 0.9 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Floating 3D HTML Tooltip Badge only on Hover when modal is not open */}
      {hovered && !isModalOpen && (
        <group ref={pedestalRef}>
          <Html
            position={[0, 0.35, 0]}
            center
            distanceFactor={10}
            className="pointer-events-none select-none transition-all duration-200"
          >
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-md text-xs font-semibold tracking-wide cursor-pointer bg-sky-950/90 text-sky-200 border-sky-400 shadow-sky-500/30"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Biography &amp; Lore</span>
              <SparklesIcon className="w-3 h-3 text-sky-300 animate-pulse" />
            </button>
          </Html>
        </group>
      )}
    </group>
  );
};
