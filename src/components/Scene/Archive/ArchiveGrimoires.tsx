import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
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
 *
 * Implements dramatic screen-space book levitation:
 * - When any book is clicked, all books elevate off their pedestals and float in mid-air.
 * - The selected book floats prominently forward toward the camera/screen with magical tilt and glow.
 * - Smoothly docks back down to pedestals when inspection is closed.
 */
const GrimoiresMasterScene: React.FC<ArchiveGrimoiresProps> = ({
  selectedGrimoire,
  onSelectGrimoire,
}) => {
  const gltf = useGLTF('/models/archive/archive-grimoires.glb');
  const reducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const runeRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const bookWrappersRef = useRef<Map<string, THREE.Group>>(new Map());
  const bookTiltsRef = useRef<Map<string, THREE.Group>>(new Map());
  const bookHitGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Clone scene cleanly and attach float wrappers for cinematic elevation
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    GRIMOIRES_DATA.forEach((grimoire) => {
      const bookNode = clone.getObjectByName(grimoire.nodeName);
      if (bookNode && bookNode.parent) {
        const parent = bookNode.parent;

        // 1. Outer wrapper for translation and scaling
        const wrapper = new THREE.Group();
        wrapper.name = `${grimoire.nodeName}_FloatWrapper`;
        parent.remove(bookNode);
        wrapper.add(bookNode);
        parent.add(wrapper);
        bookWrappersRef.current.set(grimoire.id, wrapper);

        // 2. Inner tilt group for pure local rotation around the book's center
        const tiltGroup = new THREE.Group();
        tiltGroup.name = `${grimoire.nodeName}_TiltGroup`;
        while (bookNode.children.length > 0) {
          tiltGroup.add(bookNode.children[0]);
        }
        bookNode.add(tiltGroup);
        bookTiltsRef.current.set(grimoire.id, tiltGroup);
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
                mat.emissiveIntensity = 0.95;
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

  // Levitate books and rotate ground rune circles in useFrame
  useFrame((state, delta) => {
    // 1. Rotate ground rune circles slowly
    runeRingsRef.current.forEach((ring) => {
      ring.rotation.z += delta * 0.35;
    });

    const time = state.clock.getElapsedTime();
    const isAnySelected = !!selectedGrimoire;

    // 2. Levitate and float books on screen
    GRIMOIRES_DATA.forEach((grimoire, index) => {
      const wrapper = bookWrappersRef.current.get(grimoire.id);
      const tiltGroup = bookTiltsRef.current.get(grimoire.id);
      const hitGroup = bookHitGroupsRef.current.get(grimoire.id);
      if (!wrapper) return;

      const isSelected = selectedGrimoire?.id === grimoire.id;
      const [gx, _gy, _gz] = grimoire.position;

      let targetLiftY = 0.0;
      let targetForwardZ = 0.0;
      let targetShiftX = 0.0;
      let targetScale = 1.0;
      let targetTiltX = 0.0;
      let targetYawY = 0.0;

      if (isSelected) {
        // SELECTED BOOK: Elevates prominently off its pedestal and floats forward toward the camera!
        const bob = Math.sin(time * 2.6) * 0.12;
        targetLiftY = 2.2 + bob;
        targetForwardZ = 1.4;
        targetShiftX = gx > 0 ? -0.4 : 0.4;
        targetScale = 1.42;
        // Tilt forward and yaw toward the camera for a dramatic hero presentation
        targetTiltX = 0.38 + Math.sin(time * 1.8) * 0.04;
        targetYawY = gx > 0 ? -0.25 : 0.25;
      } else if (isAnySelected) {
        // OTHER 5 BOOKS: Elevate off pedestals and float in mystical arc around the screen
        const staggerBob = Math.sin(time * 2.0 + index * 1.1) * 0.10;
        targetLiftY = 1.0 + staggerBob;
        targetForwardZ = 0.40;
        targetShiftX = 0.0;
        targetScale = 1.05;
        targetTiltX = 0.12;
        targetYawY = 0.0;
      } else if (hoveredId === grimoire.id && !reducedMotion) {
        targetLiftY = 0.24;
        targetTiltX = 0.13;
        targetYawY = gx > 0 ? -0.08 : 0.08;
      }

      // Smooth damping
      wrapper.position.y = THREE.MathUtils.damp(wrapper.position.y, targetLiftY, 3.8, delta);
      wrapper.position.z = THREE.MathUtils.damp(wrapper.position.z, targetForwardZ, 3.8, delta);
      wrapper.position.x = THREE.MathUtils.damp(wrapper.position.x, targetShiftX, 3.8, delta);

      const curScale = wrapper.scale.x;
      const newScale = THREE.MathUtils.damp(curScale, targetScale, 3.8, delta);
      wrapper.scale.set(newScale, newScale, newScale);

      if (tiltGroup) {
        tiltGroup.rotation.x = THREE.MathUtils.damp(tiltGroup.rotation.x, targetTiltX, 3.8, delta);
        tiltGroup.rotation.y = THREE.MathUtils.damp(tiltGroup.rotation.y, targetYawY, 3.8, delta);
      }

      // Sync hit box and point light
      if (hitGroup) {
        hitGroup.position.set(wrapper.position.x, wrapper.position.y, wrapper.position.z);
      }
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
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.hypot(dx, dy) < 18) {
          const hitGrimoire = getGrimoireFromHit(e.object);
          if (hitGrimoire) {
            e.stopPropagation();
            onSelectGrimoire(hitGrimoire);
          }
        }
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

            {/* Floating Container for Hit Box & Point Light (moves with the book) */}
            <group
              ref={(el) => {
                if (el) bookHitGroupsRef.current.set(grimoire.id, el);
                else bookHitGroupsRef.current.delete(grimoire.id);
              }}
            >
              {/* Glowing Accent Point Light */}
              <pointLight
                position={[0, y, 0]}
                color={grimoire.accentColor}
                intensity={isSelected ? 3.6 : isHovered ? 1.8 : 0.7}
                distance={4.5}
                decay={2}
              />

              {/* Generous Hit Box for 100% Reliable Mobile/Desktop Raycasting */}
              <mesh
                position={[0, y, 0]}
                userData={{ grimoireId: grimoire.id }}
              >
                <boxGeometry args={[1.4, 1.5, 1.4]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
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
