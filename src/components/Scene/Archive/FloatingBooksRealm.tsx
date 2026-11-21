import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { GRIMOIRES_DATA, type GrimoireItem } from '../../../data/archiveData';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

export interface FloatingBooksRealmProps {
  selectedGrimoire: GrimoireItem | null;
  onSelectGrimoire: (grimoire: GrimoireItem) => void;
  active: boolean;
}

/**
 * Ambient floating books with animated turning parchment pages from archive-floating-books.glb
 */
const AmbientFloatingBooksLayer: React.FC<{ revealProgress: number }> = ({ revealProgress }) => {
  const gltf = useGLTF('/models/archive/archive-floating-books.glb');
  const groupRef = useRef<THREE.Group>(null);

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

  const { actions } = useAnimations(gltf.animations, clonedScene);

  useEffect(() => {
    const loops = Object.values(actions).filter((action) => action !== null);
    loops.forEach((action) => {
      action.reset().fadeIn(0.6).play();
    });
    return () => {
      loops.forEach((action) => action?.fadeOut(0.3));
    };
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, revealProgress * 1.25, 4.0, delta);
    groupRef.current.scale.set(s, s, s);
    groupRef.current.visible = s > 0.05;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, -1.5]} scale={0}>
      <primitive object={clonedScene} />
    </group>
  );
};

/**
 * Floating Open Grimoire with hover animation
 */
const AmbientOpenBook: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  revealProgress: number;
}> = ({ position, rotation = [0, 0, 0], revealProgress }) => {
  const gltf = useGLTF('/models/archive/floating-open-book.glb');
  const groupRef = useRef<THREE.Group>(null);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, scene);

  useEffect(() => {
    const action = actions['BookHover'];
    if (action) action.reset().fadeIn(0.5).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, revealProgress * 1.1, 4.0, delta);
    groupRef.current.scale.set(s, s, s);
    groupRef.current.visible = s > 0.05;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={0}>
      <primitive object={scene} />
    </group>
  );
};

/**
 * Individual Interactive Floating Grimoire in the Arcane Realm
 *
 * Implements the user's staged choreography:
 * - When clicking a book: ONLY this book is shown first while the camera smoothly glides down.
 * - Once down at the new page, the surrounding books smoothly fan out and reveal themselves!
 */
const FloatingGrimoireItem: React.FC<{
  grimoire: GrimoireItem;
  isSelected: boolean;
  isAnySelected: boolean;
  index: number;
  revealProgress: number;
  onSelect: (grimoire: GrimoireItem) => void;
}> = ({ grimoire, isSelected, index, revealProgress, onSelect }) => {
  const gltf = useGLTF(grimoire.modelFile);
  const groupRef = useRef<THREE.Group>(null);
  const runeRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  // Apply emissive highlights based on selected or hovered state
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && 'emissive' in mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissive = new THREE.Color(grimoire.accentColor);
            mat.emissiveIntensity = 1.0;
          } else if (hovered) {
            mat.emissive = new THREE.Color(grimoire.accentColor);
            mat.emissiveIntensity = 0.6;
          } else {
            if (mesh.name.endsWith('_glow') || mesh.name.endsWith('_rune')) {
              mat.emissive = new THREE.Color(grimoire.accentColor);
              mat.emissiveIntensity = 0.35;
            } else {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      }
    });
  }, [scene, isSelected, hovered, grimoire.accentColor]);

  // Arc formation coordinates for non-selected books
  const arcLayout = useMemo(() => {
    const positions: [number, number, number][] = [
      [-5.6, -0.2, 1.4], // 0: Frontend
      [-3.4, 0.35, 2.6], // 1: Backend
      [-1.3, 0.75, 3.5], // 2: AI Agents
      [1.3, 0.75, 3.5],  // 3: Systems
      [3.4, 0.35, 2.6],  // 4: Creative 3D
      [5.6, -0.2, 1.4],  // 5: Tools
    ];
    return positions[index] || [0, 0, 0];
  }, [index]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const camY = state.camera.position.y;

    if (isSelected) {
      // =======================================================================
      // 1. HERO BOOK: SHOWN FIRST! Floats smoothly dead-center in front of camera while descending!
      // =======================================================================
      groupRef.current.visible = true;

      // Keep book centered along camera line of sight during vertical descent
      const descentLocalY = (camY + 10.0) * 0.45;
      const heroBob = Math.sin(time * 2.4) * 0.16;

      const targetX = 0.0;
      const targetY = descentLocalY - 0.2 + heroBob;
      const targetZ = 4.8;
      const targetScale = 1.85;
      const targetRotX = 0.35 + Math.sin(time * 1.6) * 0.04;
      const targetRotY = Math.sin(time * 1.2) * 0.08;
      const targetRotZ = 0.0;

      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4.0, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 4.0, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4.0, delta);

      const curScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.damp(curScale, targetScale, 4.0, delta);
      groupRef.current.scale.set(newScale, newScale, newScale);

      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 4.0, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 4.0, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 4.0, delta);
    } else {
      // =======================================================================
      // 2. OTHER BOOKS: HIDDEN DURING DESCENT, THEN FAN OUT ONCE ARRIVED!
      // =======================================================================
      // Staggered reveal based on revealProgress (0 -> 1)
      const bookReveal = THREE.MathUtils.clamp((revealProgress - index * 0.08) / 0.35, 0.0, 1.0);

      if (bookReveal <= 0.01) {
        groupRef.current.visible = false;
        groupRef.current.scale.set(0, 0, 0);
        // Anchor at center ready to fan out
        groupRef.current.position.set(0, 0, 3.5);
        return;
      }

      groupRef.current.visible = true;

      // Fan out gracefully from center to arc formation
      const staggerBob = Math.sin(time * 1.8 + index * 1.05) * 0.12;
      const targetX = arcLayout[0] * bookReveal;
      const targetY = (arcLayout[1] + staggerBob) * bookReveal;
      const targetZ = arcLayout[2] * bookReveal;
      let targetScale = 1.25 * bookReveal;

      if (hovered) {
        targetScale = 1.45;
      }

      const targetRotX = 0.18;
      const targetRotY = arcLayout[0] > 0 ? -0.24 : 0.24;

      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4.2, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 4.2, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4.2, delta);

      const curScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.damp(curScale, targetScale, 4.2, delta);
      groupRef.current.scale.set(newScale, newScale, newScale);

      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 4.2, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 4.2, delta);
    }

    if (runeRingRef.current) {
      runeRingRef.current.rotation.z += delta * (isSelected ? 0.8 : 0.3);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      scale={isSelected ? 1.0 : 0.0}
      onPointerOver={(e) => {
        if (!groupRef.current?.visible) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        if (!groupRef.current?.visible) return;
        e.stopPropagation();
        onSelect(grimoire);
      }}
    >
      {/* 3D Grimoire Model */}
      <primitive object={scene} />

      {/* Rotating Arcane Rune Inlay Ring Beneath Floating Book */}
      <mesh
        ref={runeRingRef}
        position={[0, -0.65, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.55, 0.76, 32]} />
        <meshBasicMaterial
          color={grimoire.accentColor}
          transparent
          opacity={isSelected ? 0.85 : hovered ? 0.6 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point Light Casting Glow on Book and Surrounding Air */}
      <pointLight
        position={[0, 0.3, 0.6]}
        color={grimoire.accentColor}
        intensity={isSelected ? 3.5 : hovered ? 2.0 : 0.8}
        distance={4.8}
        decay={2}
      />

      {/* Generous Hit Box for 100% Reliable Raycasting */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.4, 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

/**
 * Floating Mana Motes Field drifting upwards
 */
const FloatingManaMotes: React.FC<{ revealProgress: number }> = ({ revealProgress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 48;

  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  });

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += delta * 0.45;
      if (array[i * 3 + 1] > 5) {
        array[i * 3 + 1] = -5;
      }
    }
    posAttr.needsUpdate = true;

    // Fade in particles with revealProgress
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.damp(mat.opacity, revealProgress * 0.65, 4.0, delta);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color="#fbbf24"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

/**
 * FloatingBooksRealm
 *
 * Dedicated 3D Realm located beneath the island (at Y = -10.0).
 * Implements user's staged choreography:
 * 1. Click book on island: 3D island flies up offscreen (Y -> +80).
 * 2. Camera glides smoothly down (Y -> -10): ONLY THIS CLICKED BOOK is shown first,
 *    floating smoothly right before the viewer on screen.
 * 3. Once arrived down at the new realm: THEN the other books smoothly fan out
 *    into their crescent floating formation with turning pages and motes!
 */
export const FloatingBooksRealm: React.FC<FloatingBooksRealmProps> = ({
  selectedGrimoire,
  onSelectGrimoire,
  active,
}) => {
  const realmGroupRef = useRef<THREE.Group>(null);
  const revealProgressRef = useRef(0);
  const [revealProgress, setRevealProgress] = useState(0);

  // Monitor camera position to detect when descent is complete
  useFrame((state, delta) => {
    if (!realmGroupRef.current) return;
    const camY = state.camera.position.y;

    // The camera has completed moving down when camY reaches <= -8.5
    const isArrivedAtBottom = active && camY <= -8.5;
    const targetReveal = isArrivedAtBottom ? 1.0 : 0.0;

    revealProgressRef.current = THREE.MathUtils.damp(
      revealProgressRef.current,
      targetReveal,
      3.2,
      delta
    );

    // Update state occasionally for child components
    if (Math.abs(revealProgressRef.current - revealProgress) > 0.02) {
      setRevealProgress(revealProgressRef.current);
    }

    realmGroupRef.current.visible = active;
  });

  return (
    <group
      ref={realmGroupRef}
      name="FloatingBooksRealm"
      position={[0, -10.0, 0]}
      visible={active}
    >
      {/* Realm Local Lighting */}
      <ambientLight intensity={0.65} color="#1e2540" />
      <directionalLight position={[6, 12, 8]} intensity={1.3} color="#a6c5ff" />
      <directionalLight position={[-6, 6, -6]} intensity={0.8} color="#818cf8" />

      {/* 1. Ambient Floating Books with Turning Parchment Pages (Reveals after moving down) */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <AmbientFloatingBooksLayer revealProgress={revealProgress} />
        </Suspense>
      </ModelErrorBoundary>

      {/* 2. Floating Open & Closed Decorative Books (Reveals after moving down) */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <AmbientOpenBook
            position={[-4.2, -0.6, 2.2]}
            rotation={[0.2, 0.4, 0]}
            revealProgress={revealProgress}
          />
          <AmbientOpenBook
            position={[4.2, -0.6, 2.2]}
            rotation={[0.2, -0.4, 0]}
            revealProgress={revealProgress}
          />
        </Suspense>
      </ModelErrorBoundary>

      {/* 3. The 6 Interactive Master Skill Grimoires */}
      {/* HERO BOOK IS SHOWN FIRST! Other books fan out after descent! */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          {GRIMOIRES_DATA.map((grimoire, index) => {
            const isSelected = selectedGrimoire?.id === grimoire.id;
            return (
              <FloatingGrimoireItem
                key={grimoire.id}
                grimoire={grimoire}
                isSelected={isSelected}
                isAnySelected={!!selectedGrimoire}
                index={index}
                revealProgress={revealProgress}
                onSelect={onSelectGrimoire}
              />
            );
          })}
        </Suspense>
      </ModelErrorBoundary>

      {/* 4. Drifting Golden Mana Motes Field (Reveals after moving down) */}
      <FloatingManaMotes revealProgress={revealProgress} />
    </group>
  );
};
