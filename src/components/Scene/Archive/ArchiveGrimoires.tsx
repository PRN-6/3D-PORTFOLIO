import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';
import { GRIMOIRES_DATA, type GrimoireItem } from '../../../data/archiveData';

export interface ArchiveGrimoiresProps {
  selectedGrimoire: GrimoireItem | null;
  onSelectGrimoire: (grimoire: GrimoireItem) => void;
}

function getGrimoireFromHit(obj: THREE.Object3D | null): GrimoireItem | undefined {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr.name.startsWith('Grimoire_')) {
      const idx = parseInt(curr.name.replace('Grimoire_', ''), 10) - 1;
      if (idx >= 0 && idx < GRIMOIRES_DATA.length) return GRIMOIRES_DATA[idx];
    }
    if (curr.name.startsWith('GrimoirePedestal_')) {
      const idx = parseInt(curr.name.replace('GrimoirePedestal_', ''), 10);
      if (idx >= 0 && idx < GRIMOIRES_DATA.length) return GRIMOIRES_DATA[idx];
    }
    const gId = curr.userData?.grimoireId as string | undefined;
    if (gId) {
      return GRIMOIRES_DATA.find((g) => g.id === gId);
    }
    curr = curr.parent;
  }
  return undefined;
}

/**
 * Handles the 6 Skill Grimoires from `archive-grimoires.glb`
 * with built-in pedestal geometry, hover animations, hit detection, and magical highlights.
 */
const GrimoiresMasterScene: React.FC<ArchiveGrimoiresProps> = ({
  selectedGrimoire,
  onSelectGrimoire,
}) => {
  const gltf = useGLTF('/models/archive/archive-grimoires.glb');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const runeRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Clone scene cleanly so multiple instances or hot-reloads don't corrupt cached GLTF
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  // Hook up all 6 GrimoireHover animations
  const { actions } = useAnimations(gltf.animations, clonedScene);

  useEffect(() => {
    const loops = Object.values(actions).filter((action) => action !== null);
    loops.forEach((action) => {
      action.reset().fadeIn(0.4).play();
    });
    return () => {
      loops.forEach((action) => action?.fadeOut(0.3));
    };
  }, [actions]);

  // Apply visual highlights to book meshes when hovered or selected
  useEffect(() => {
    GRIMOIRES_DATA.forEach((grimoire) => {
      const isSelected = selectedGrimoire?.id === grimoire.id;
      const isHovered = hoveredId === grimoire.id;
      const bookNode = clonedScene.getObjectByName(grimoire.nodeName);

      if (bookNode) {
        bookNode.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material && 'emissive' in mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (isSelected) {
                mat.emissive = new THREE.Color(grimoire.accentColor);
                mat.emissiveIntensity = 0.85;
              } else if (isHovered) {
                mat.emissive = new THREE.Color(grimoire.accentColor);
                mat.emissiveIntensity = 0.45;
              } else {
                // Return to base palette emissive
                if (mesh.name.endsWith('_glow') || mesh.name.endsWith('_rune')) {
                  mat.emissive = new THREE.Color(grimoire.accentColor);
                  mat.emissiveIntensity = 0.25;
                } else {
                  mat.emissive = new THREE.Color(0x000000);
                  mat.emissiveIntensity = 0;
                }
              }
            }
          }
        });
      }
    });
  }, [clonedScene, selectedGrimoire, hoveredId]);

  // Rotate ground rune circles slowly in useFrame
  useFrame((_, delta) => {
    runeRingsRef.current.forEach((ring) => {
      ring.rotation.z += delta * 0.35;
    });
  });

  return (
    <group
      name="ArchiveGrimoiresContainer"
      onPointerOver={(e) => {
        const hitGrimoire = getGrimoireFromHit(e.object);
        if (hitGrimoire) {
          e.stopPropagation();
          setHoveredId(hitGrimoire.id);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHoveredId(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        const hitGrimoire = getGrimoireFromHit(e.object);
        if (hitGrimoire) {
          e.stopPropagation();
          onSelectGrimoire(hitGrimoire);
        }
      }}
    >
      {/* 3D Model: Pedestals and Animated Grimoires */}
      <primitive object={clonedScene} />

      {/* Interactive Raycasting Hit Volumes & Ground Magical Rune Inlays */}
      {GRIMOIRES_DATA.map((grimoire) => {
        const isSelected = selectedGrimoire?.id === grimoire.id;
        const isHovered = hoveredId === grimoire.id;
        const [x, y, z] = grimoire.position;

        return (
          <group key={grimoire.id} position={[x, 0, z]}>
            {/* Ground Rune Ring around Pedestal Base */}
            <mesh
              ref={(el) => {
                if (el) runeRingsRef.current.set(grimoire.id, el);
                else runeRingsRef.current.delete(grimoire.id);
              }}
              position={[0, 0.04, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.55, 0.72, 32]} />
              <meshBasicMaterial
                color={grimoire.accentColor}
                transparent
                opacity={isSelected ? 0.85 : isHovered ? 0.6 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing Accent Point Light */}
            <pointLight
              position={[0, y, 0]}
              color={grimoire.accentColor}
              intensity={isSelected ? 2.6 : isHovered ? 1.6 : 0.6}
              distance={3.8}
              decay={2}
            />

            {/* Generous Hit Box for 100% Reliable Mobile/Desktop Raycasting */}
            <mesh
              position={[0, y, 0]}
              userData={{ grimoireId: grimoire.id }}
            >
              <boxGeometry args={[1.3, 1.4, 1.3]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const ArchiveGrimoires: React.FC<ArchiveGrimoiresProps> = (props) => {
  return (
    <group name="ArchiveGrimoiresSystem">
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <GrimoiresMasterScene {...props} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};

