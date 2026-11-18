import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BookOpen, Sparkles as SparklesIcon } from 'lucide-react';
import { BIOGRAPHY_CONFIG } from '../../../assets3d/forestAssets';

export interface ForestBiographyInteractionProps {
  onOpenAboutModal: () => void;
  isModalOpen?: boolean;
}

export const ForestBiographyInteraction: React.FC<ForestBiographyInteractionProps> = ({
  onOpenAboutModal,
  isModalOpen = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const runesRef = useRef<THREE.Group>(null);

  // Subtle magical floating rotation on the interaction rune circle
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
    }
    if (runesRef.current) {
      runesRef.current.position.y = BIOGRAPHY_CONFIG.position[1] + 0.35 + Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group position={BIOGRAPHY_CONFIG.position} name="ForestBiographyInteractionRoot">
      {/* 1. Invisible Raycast Hit Trigger over BiographyBook Pedestal */}
      <mesh
        position={[0, 0.1, 0]}
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
        <boxGeometry args={[1.4, 1.1, 1.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 2. Arcane Concentric Magic Ring Floating Around the Open Grimoire */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.22, 0]}
      >
        <ringGeometry args={[0.65, 0.72, 32]} />
        <meshBasicMaterial
          color={hovered ? '#67e8f9' : '#a855f7'}
          transparent
          opacity={hovered ? 0.85 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Floating 3D HTML Tooltip Badge only on Hover when modal is not open */}
      {hovered && !isModalOpen && (
        <group ref={runesRef}>
          <Html
            position={[0, 0.35, 0]}
            center
            distanceFactor={10}
            className="pointer-events-none select-none transition-all duration-200"
          >
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl backdrop-blur-md text-[11px] font-semibold tracking-wide cursor-pointer bg-purple-900/90 text-cyan-200 border-cyan-400 shadow-cyan-500/30"
            >
              <BookOpen className="w-3 h-3 text-amber-300" />
              <span>Biography & Lore</span>
              <SparklesIcon className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
            </button>
          </Html>
        </group>
      )}
    </group>
  );
};
