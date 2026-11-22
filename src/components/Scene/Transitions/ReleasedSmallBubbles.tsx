import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { BlackBubbleMesh } from './BlackBubbleMesh';
import { GRIMOIRES_DATA, type GrimoireItem } from '../../../data/archiveData';
import { PROJECTS_DATA, type ProjectItem } from '../../../data/projectsData';

// Preload all 6 individual grimoire 3D models for instant pop-reveal transitions
GRIMOIRES_DATA.forEach((grimoire) => {
  useGLTF.preload(grimoire.modelFile);
});
useGLTF.preload('/models/archive/floating-open-book.glb');

export interface SmallBubbleItem {
  id: number;
  screenX: number; // horizontal spread across screen
  screenY: number; // vertical spread across screen
  depth: number;   // z depth variation (-2 to +2)
  radius: number;  // bubble radius
  delay: number;   // normalized launch time within release window (0.0 to 0.8)
  wobbleSpeed: number;
  phase: number;
}

/** Desktop widescreen balanced 6-bubble distribution */
export const BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -7.2, screenY:  2.8, depth:  0.4, radius: 2.10, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.2, depth: -0.6, radius: 1.95, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  7.2, screenY:  2.8, depth:  0.5, radius: 2.20, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  7.2, screenY: -2.3, depth: -0.5, radius: 2.15, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -3.5, depth:  0.3, radius: 2.35, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -7.2, screenY: -2.3, depth: -0.4, radius: 2.05, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Tablet (4:3 / medium width) balanced 6-bubble distribution */
export const TABLET_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -5.0, screenY:  2.5, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.0, depth: -0.6, radius: 1.75, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  5.0, screenY:  2.5, depth:  0.5, radius: 1.95, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  5.0, screenY: -2.3, depth: -0.5, radius: 1.90, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -3.6, depth:  0.3, radius: 2.05, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -5.0, screenY: -2.3, depth: -0.4, radius: 1.80, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Mobile portrait organic constellation 6-bubble distribution (full screen coverage) */
export const MOBILE_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -2.4, screenY:  7.6, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.2, phase: 0.0 },
  { id: 1, screenX:  2.2, screenY:  5.8, depth: -0.5, radius: 1.95, delay: 0.16, wobbleSpeed: 1.4, phase: 1.2 },
  { id: 2, screenX: -0.6, screenY:  2.2, depth:  0.8, radius: 2.15, delay: 0.32, wobbleSpeed: 1.0, phase: 2.5 },
  { id: 3, screenX:  2.5, screenY: -1.2, depth: -0.6, radius: 1.85, delay: 0.48, wobbleSpeed: 1.5, phase: 3.7 },
  { id: 4, screenX: -2.4, screenY: -4.3, depth:  0.4, radius: 1.95, delay: 0.64, wobbleSpeed: 1.1, phase: 4.8 },
  { id: 5, screenX:  1.0, screenY: -7.4, depth: -0.3, radius: 1.80, delay: 0.80, wobbleSpeed: 1.3, phase: 5.6 },
];

// ============================================================================
// POP BURST PARTICLES & SHOCKWAVE RING COMPONENT (FRAME-DRIVEN)
// ============================================================================
interface PopBurstEffectProps {
  color: string;
  radius: number;
  isPopped: boolean;
  popTime: number;
  floatingTimerRef: React.MutableRefObject<number>;
}

const PopBurstEffect: React.FC<PopBurstEffectProps> = ({
  color,
  radius,
  isPopped,
  popTime,
  floatingTimerRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pointsMatRef = useRef<THREE.PointsMaterial>(null);
  const { camera } = useThree();

  const particleData = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = radius * (2.2 + Math.random() * 1.4);
      velocities.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        )
      );
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    return { positions, velocities, count };
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.positions.slice(), 3));
    return geo;
  }, [particleData]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!isPopped || popTime < 0) {
      groupRef.current.visible = false;
      return;
    }

    const ft = floatingTimerRef.current;
    const timeSincePop = Math.max(0.0, ft - popTime);
    const burstProgress = Math.min(1.0, timeSincePop / 0.45);

    if (burstProgress >= 1.0) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    if (ringRef.current) {
      ringRef.current.quaternion.copy(camera.quaternion);
      const ringScale = THREE.MathUtils.lerp(0.3, radius * 1.5, Math.pow(burstProgress, 0.6));
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      if (ringMatRef.current) {
        ringMatRef.current.opacity = Math.max(0.0, (1.0 - burstProgress) * 0.85);
      }
    }

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const ease = 1.0 - Math.pow(1.0 - burstProgress, 2.0);
      for (let i = 0; i < particleData.count; i++) {
        const vel = particleData.velocities[i];
        array[i * 3] = vel.x * ease;
        array[i * 3 + 1] = vel.y * ease;
        array[i * 3 + 2] = vel.z * ease;
      }
      posAttr.needsUpdate = true;
      if (pointsMatRef.current) {
        pointsMatRef.current.opacity = Math.max(0.0, Math.pow(1.0 - burstProgress, 1.4));
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Shockwave Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.92, 1.0, 32]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Burst Sparkling Droplets */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          ref={pointsMatRef}
          color={color}
          size={0.14}
          transparent
          opacity={1.0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// ============================================================================
// SINGLE REVEALED GRIMOIRE BOOK COMPONENT (FRAME-DRIVEN ANIMATION)
// ============================================================================
interface RevealedGrimoireBookProps {
  grimoire: GrimoireItem;
  project: ProjectItem;
  index: number;
  baseScale: number;
  isPopped: boolean;
  popTime: number;
  floatingTimerRef: React.MutableRefObject<number>;
  isHovered: boolean;
  isReversing?: boolean;
  reverseBooksProgress?: number;
  isOpened?: boolean;
  isOtherOpened?: boolean;
  openProgress?: number;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

const RevealedGrimoireBook: React.FC<RevealedGrimoireBookProps> = ({
  grimoire,
  project,
  index,
  baseScale,
  isPopped,
  popTime,
  floatingTimerRef,
  isHovered,
  isReversing = false,
  reverseBooksProgress = 0,
  isOpened = false,
  isOtherOpened = false,
  openProgress = 0,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const gltf = useGLTF(grimoire.modelFile);
  const openBookGltf = useGLTF('/models/archive/floating-open-book.glb');
  const ringRef = useRef<THREE.Mesh>(null);
  const bookGroupRef = useRef<THREE.Group>(null);
  const closedGroupRef = useRef<THREE.Group>(null);
  const openGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

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

  const clonedOpenScene = useMemo(() => {
    const clone = openBookGltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          if (mesh.name.toLowerCase().includes('violet')) {
            mat.color = new THREE.Color(grimoire.accentColor);
            mat.emissive = new THREE.Color(grimoire.accentColor);
            mat.emissiveIntensity = 0.45;
          } else if (mesh.name.toLowerCase().includes('paper')) {
            mat.color = new THREE.Color('#f4ede2');
          }
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [openBookGltf.scene, grimoire.accentColor]);

  // Apply emissive highlights on hover
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && 'emissive' in mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isHovered) {
            mat.emissive = new THREE.Color(grimoire.accentColor);
            mat.emissiveIntensity = 0.95;
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
  }, [clonedScene, isHovered, grimoire.accentColor]);

  useFrame((state, delta) => {
    if (!bookGroupRef.current) return;

    if (isReversing) {
      const revProg = THREE.MathUtils.clamp(reverseBooksProgress, 0.0, 1.0);
      const shrinkFactor = Math.max(0.0, 1.0 - Math.pow(revProg, 1.4));
      if (shrinkFactor <= 0.001) {
        bookGroupRef.current.visible = false;
        bookGroupRef.current.scale.set(0, 0, 0);
        return;
      }
      bookGroupRef.current.visible = true;
      const currentScale = baseScale * shrinkFactor;
      bookGroupRef.current.scale.set(currentScale, currentScale, currentScale);

      bookGroupRef.current.quaternion.copy(camera.quaternion);
      bookGroupRef.current.rotateX(0.18);
      const t = state.clock.getElapsedTime();
      bookGroupRef.current.rotateY(-0.24 + Math.sin(t * 1.5 + index * 1.1) * 0.07);
      return;
    }

    if (!isPopped || popTime < 0) {
      bookGroupRef.current.visible = false;
      bookGroupRef.current.scale.set(0, 0, 0);
      return;
    }

    if (isOtherOpened) {
      // Another book is clicked and opening: smoothly shrink away this book
      const s = THREE.MathUtils.damp(bookGroupRef.current.scale.x, 0.0, 10.0, delta);
      bookGroupRef.current.scale.set(s, s, s);
      bookGroupRef.current.visible = s > 0.005;
      return;
    }

    if (isOpened) {
      // THIS BOOK IS OPENED: Zoom forward to center screen, face camera, and unfold open book
      bookGroupRef.current.visible = true;
      const openProg = THREE.MathUtils.clamp(openProgress, 0.0, 1.0);
      const targetScale = baseScale * THREE.MathUtils.lerp(1.0, 1.6, openProg);
      bookGroupRef.current.scale.set(targetScale, targetScale, targetScale);

      // Smoothly slerp orientation to face the camera directly with reading tilt
      bookGroupRef.current.quaternion.slerp(camera.quaternion, delta * 7.5);
      bookGroupRef.current.rotateX(0.08);

      // Book opening unfolding effect:
      // When openProg passes 0.28, the closed tome opens up into the open book model
      if (closedGroupRef.current && openGroupRef.current) {
        if (openProg > 0.28) {
          const unfold = THREE.MathUtils.clamp((openProg - 0.28) / 0.72, 0.0, 1.0);
          const closedScale = Math.max(0.0, 1.0 - unfold * 1.5);
          closedGroupRef.current.scale.set(closedScale, closedScale, closedScale);
          closedGroupRef.current.rotation.y = -unfold * (Math.PI * 0.5);
          closedGroupRef.current.visible = closedScale > 0.01;

          openGroupRef.current.visible = true;
          const openScale = THREE.MathUtils.lerp(0.35, 1.0, unfold);
          openGroupRef.current.scale.set(openScale, openScale, openScale);
          openGroupRef.current.rotation.x = -Math.PI / 4;
        } else {
          closedGroupRef.current.visible = true;
          closedGroupRef.current.scale.set(1, 1, 1);
          closedGroupRef.current.rotation.y = -openProg * (Math.PI * 0.35);
          openGroupRef.current.visible = false;
          openGroupRef.current.scale.set(0, 0, 0);
        }
      }

      if (ringRef.current) {
        const ringScale = THREE.MathUtils.lerp(1.0, 1.65, openProg);
        ringRef.current.scale.set(ringScale, ringScale, ringScale);
        ringRef.current.rotation.z += delta * 2.2;
      }
      return;
    }

    // Normal floating state (no book opened)
    if (closedGroupRef.current) {
      closedGroupRef.current.visible = true;
      closedGroupRef.current.scale.set(1, 1, 1);
    }
    if (openGroupRef.current) {
      openGroupRef.current.visible = false;
      openGroupRef.current.scale.set(0, 0, 0);
    }

    const ft = floatingTimerRef.current;
    const timeSincePop = Math.max(0.0, ft - popTime);
    const tau = Math.min(1.0, timeSincePop / 0.35);

    if (tau <= 0.001) {
      bookGroupRef.current.visible = false;
      bookGroupRef.current.scale.set(0, 0, 0);
      return;
    }

    bookGroupRef.current.visible = true;

    // Snappy spring overshoot: 0 -> 1.18 -> 1.0
    const spring = Math.sin(tau * Math.PI * 0.5) + Math.sin(tau * Math.PI) * 0.18;
    const hoverMult = isHovered ? 1.15 : 1.0;
    const currentScale = baseScale * spring * hoverMult;
    bookGroupRef.current.scale.set(currentScale, currentScale, currentScale);

    // Orient gracefully towards camera viewpoint with 3/4 angle showing 3D depth, spine, and cover
    bookGroupRef.current.quaternion.copy(camera.quaternion);
    bookGroupRef.current.rotateX(0.18);
    const t = state.clock.getElapsedTime();
    bookGroupRef.current.rotateY(-0.24 + Math.sin(t * 1.5 + index * 1.1) * 0.07);

    if (ringRef.current) {
      ringRef.current.scale.set(1, 1, 1);
      ringRef.current.rotation.z += delta * (isHovered ? 1.4 : 0.45);
    }
  });

  return (
    <group
      ref={bookGroupRef}
      visible={false}
      scale={[0, 0, 0]}
    >
      {/* 1. Closed 3D Grimoire Book Model */}
      <group ref={closedGroupRef}>
        <primitive object={clonedScene} />
      </group>

      {/* 2. Opened 3D Grimoire Book Model (Unfolds on selection) */}
      <group ref={openGroupRef} visible={false} scale={[0, 0, 0]}>
        <primitive object={clonedOpenScene} />
      </group>

      {/* Delicate Rotating Arcane Aura Ring Beneath Floating Book */}
      <mesh
        ref={ringRef}
        position={[0, -0.55, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.38, 0.46, 48]} />
        <meshBasicMaterial
          color={grimoire.accentColor}
          transparent
          opacity={isOpened ? 0.95 : isHovered ? 0.75 : 0.22}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dedicated Book Illumination for Rich 3D Textures & Bindings */}
      <pointLight
        position={[0, 0.4, 1.2]}
        color="#ffffff"
        intensity={isOpened ? 4.5 : isHovered ? 2.5 : 1.6}
        distance={7}
        decay={2}
      />
      <pointLight
        position={[0, -0.2, 0.8]}
        color={grimoire.accentColor}
        intensity={isOpened ? 5.5 : isHovered ? 3.8 : 2.2}
        distance={6}
        decay={2}
      />

      {/* 3D Floating Project Name Plate (Always visible once popped, hidden when opened) */}
      <Html
        position={[0, -1.18, 0]}
        center
        distanceFactor={18}
        className="pointer-events-auto select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onPointerOver();
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onPointerOut();
          }}
          className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
            isPopped && !isReversing && !isOpened && !isOtherOpened
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-2 scale-75 pointer-events-none'
          }`}
        >
          {/* Main Project Name Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-2xl ${
              isHovered
                ? 'bg-black/95 scale-105'
                : 'bg-black/85 hover:bg-black/90'
            }`}
            style={{
              borderColor: isHovered ? project.accentColor : 'rgba(255, 255, 255, 0.22)',
              boxShadow: isHovered
                ? `0 0 24px ${project.accentColor}77, 0 8px 32px rgba(0,0,0,0.85)`
                : '0 4px 20px rgba(0, 0, 0, 0.65)',
            }}
          >
            {/* Glowing Accent Gem */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{
                backgroundColor: project.accentColor,
                boxShadow: `0 0 8px ${project.accentColor}`,
              }}
            />

            {/* Project Name */}
            <span
              className="text-xs sm:text-sm font-mono font-bold tracking-widest text-white whitespace-nowrap uppercase"
              style={{
                textShadow: isHovered ? `0 0 12px ${project.accentColor}` : undefined,
              }}
            >
              {project.title}
            </span>
          </div>

          {/* Subtitle / Category Tagline */}
          <span
            className="text-[9px] sm:text-[10px] font-mono tracking-wider uppercase mt-1 px-1.5 py-0.5 rounded transition-colors duration-200 whitespace-nowrap"
            style={{
              color: isHovered ? project.accentColor : 'rgba(255, 255, 255, 0.65)',
            }}
          >
            {project.category}
          </span>
        </div>
      </Html>

      {/* Generous Interactive Hit Box for Pointer Events */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[2.4, 2.7, 2.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ============================================================================
// MAIN RELEASED SMALL BUBBLES WITH AUTOMATIC POP-REVEAL SYSTEM
// ============================================================================
export interface ReleasedSmallBubblesProps {
  active: boolean;
  releaseProgress: number; // 0.0 to 1.0
  isReversing?: boolean;
  reverseStage?: 'BOOKS' | 'BUBBLES';
  reverseBooksProgress?: number;
  isTearing?: boolean;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
  selectedGrimoire?: GrimoireItem | null;
  onSelectProject?: (project: ProjectItem) => void;
  selectedProject?: ProjectItem | null;
}

export const ReleasedSmallBubbles: React.FC<ReleasedSmallBubblesProps> = ({
  active,
  releaseProgress,
  isReversing = false,
  reverseStage = 'BUBBLES',
  reverseBooksProgress = 0,
  isTearing = false,
  onSelectGrimoire,
  selectedGrimoire: _selectedGrimoire,
  onSelectProject,
  selectedProject,
}) => {
  const { camera, size } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const timeRef = useRef(0);
  const tearTimeRef = useRef(0);
  const floatingTimerRef = useRef(0);

  // Per-bubble popped state and pop timestamp
  const [poppedMask, setPoppedMask] = useState<boolean[]>([false, false, false, false, false, false]);
  const popTimesRef = useRef<number[]>([-1, -1, -1, -1, -1, -1]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Track which project book is currently opened to cover screen
  const openedBookIndex = useMemo(() => {
    if (!selectedProject) return null;
    const idx = PROJECTS_DATA.findIndex((p) => p.id === selectedProject.id);
    return idx >= 0 ? idx : null;
  }, [selectedProject]);
  const currentOpenProgress = useRef<number[]>([0, 0, 0, 0, 0, 0]);

  // Reset pop states if deactivated
  useEffect(() => {
    if (!active || (!isReversing && releaseProgress < 0.1)) {
      setPoppedMask([false, false, false, false, false, false]);
      popTimesRef.current = [-1, -1, -1, -1, -1, -1];
      floatingTimerRef.current = 0;
    }
  }, [active, releaseProgress, isReversing]);

  // Pick responsive preset based on viewport form factor
  const activePresets = useMemo(() => {
    if (isMobile) return MOBILE_BUBBLE_PRESETS;
    if (isTablet) return TABLET_BUBBLE_PRESETS;
    return BUBBLE_PRESETS;
  }, [isMobile, isTablet]);

  // Group refs for individual bubbles
  const bubbleRefs = useRef<(THREE.Group | null)[]>([]);

  // Center anchor where the main bubble was located
  const centerAnchor = useMemo(() => new THREE.Vector3(0, 0.7, 0), []);

  // Compute camera basis vectors for projecting targets across the screen
  const { rightVec, upVec, lookVec } = useMemo(() => {
    const look = new THREE.Vector3().subVectors(centerAnchor, camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(look, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, look).normalize();
    return { rightVec: right, upVec: up, lookVec: look };
  }, [camera, centerAnchor]);

  // Pre-calculate target positions in world space
  const targetPositions = useMemo(() => {
    return activePresets.map((b) => {
      return centerAnchor
        .clone()
        .addScaledVector(rightVec, b.screenX)
        .addScaledVector(upVec, b.screenY)
        .addScaledVector(lookVec, -b.depth);
    });
  }, [centerAnchor, rightVec, upVec, lookVec, activePresets]);

  // Pre-calculate center foreground target for opened book
  const centerFront = useMemo(() => {
    return centerAnchor.clone().addScaledVector(lookVec, isMobile ? -3.8 : -4.8);
  }, [centerAnchor, lookVec, isMobile]);

  // Pre-calculate start positions along main bubble surface
  const startPositions = useMemo(() => {
    const startDist = isMobile ? 3.0 : 4.2;
    return targetPositions.map((target) => {
      const dir = new THREE.Vector3().subVectors(target, centerAnchor).normalize();
      return centerAnchor.clone().addScaledVector(dir, startDist);
    });
  }, [targetPositions, centerAnchor, isMobile]);

  // Manual or interactive instant-pop trigger
  const triggerBubblePop = (index: number) => {
    if (popTimesRef.current[index] < 0) {
      popTimesRef.current[index] = floatingTimerRef.current;
      setPoppedMask((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
    }
  };

  useFrame((_, delta) => {
    if (!active) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (isTearing) {
      tearTimeRef.current += delta * 2.8;
    } else {
      tearTimeRef.current = 0;
    }
    const tearFactor = Math.max(0.0, 1.0 - tearTimeRef.current);

    // Track floating duration once arrived
    if (releaseProgress >= 0.99) {
      floatingTimerRef.current += delta;
      const ft = floatingTimerRef.current;

      // Staggered automatic self-popping schedule
      const POP_INITIAL_DELAY = 0.20; // 0.20s pause after bubbles arrive
      const POP_STAGGER_INTERVAL = 0.15; // 0.15s between each pop

      activePresets.forEach((_, index) => {
        const scheduleTime = POP_INITIAL_DELAY + index * POP_STAGGER_INTERVAL;
        if (ft >= scheduleTime && popTimesRef.current[index] < 0) {
          popTimesRef.current[index] = ft;
          setPoppedMask((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }
      });
    }

    activePresets.forEach((b, index) => {
      const grp = bubbleRefs.current[index];
      if (!grp) return;

      // -----------------------------------------------------------------------
      // REVERSE STEP 1: Books shrink down, 6 bubbles reform at target positions
      // -----------------------------------------------------------------------
      if (isReversing && reverseStage === 'BOOKS') {
        grp.visible = true;
        const target = targetPositions[index];
        const floatX = Math.sin(t * (1.3 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.12 : 0.18);
        const floatY = Math.cos(t * (1.6 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.16 : 0.24);
        const floatZ = Math.sin(t * (1.1 * b.wobbleSpeed) + b.phase) * 0.14;
        grp.position.set(target.x + floatX, target.y + floatY, target.z + floatZ);
        grp.scale.set(1.0, 1.0, 1.0);
        return;
      }

      // -----------------------------------------------------------------------
      // REVERSE STEP 2: 6 bubbles fly back towards center into growing main bubble
      // -----------------------------------------------------------------------
      if (isReversing && reverseStage === 'BUBBLES') {
        const returnProgress = THREE.MathUtils.clamp(1.0 - releaseProgress, 0.0, 1.0);
        // Staggered return: bubbles fly back in reverse order (5 -> 4 -> 3 -> 2 -> 1 -> 0)
        const returnDelay = (5 - index) * 0.06;
        const returnWindow = 0.55;
        const tauRet = Math.min(1.0, Math.max(0.0, (returnProgress - returnDelay) / returnWindow));
        // Smooth cubic ease towards center
        const retEase = tauRet * tauRet * (3.0 - 2.0 * tauRet);

        const start = startPositions[index];
        const target = targetPositions[index];

        const curX = THREE.MathUtils.lerp(target.x, start.x, retEase);
        const curY = THREE.MathUtils.lerp(target.y, start.y, retEase);
        const curZ = THREE.MathUtils.lerp(target.z, start.z, retEase);

        const floatDim = Math.max(0.0, 1.0 - retEase);
        const floatX = Math.sin(t * (1.3 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.12 : 0.18) * floatDim;
        const floatY = Math.cos(t * (1.6 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.16 : 0.24) * floatDim;
        const floatZ = Math.sin(t * (1.1 * b.wobbleSpeed) + b.phase) * 0.14 * floatDim;

        grp.position.set(curX + floatX, curY + floatY, curZ + floatZ);

        // Near center, merge and shrink smoothly into the expanding main bubble
        let mergeScale = 1.0;
        if (retEase > 0.65) {
          mergeScale = Math.max(0.0, 1.0 - ((retEase - 0.65) / 0.35));
        }
        grp.scale.set(mergeScale, mergeScale, mergeScale);
        grp.visible = mergeScale > 0.01;
        return;
      }

      // -----------------------------------------------------------------------
      // FORWARD ANIMATION: Budding, traveling outward, and hovering
      // -----------------------------------------------------------------------
      // Check if this bubble has begun budding
      if (releaseProgress < b.delay) {
        grp.visible = false;
        grp.scale.set(0, 0, 0);
        return;
      }

      grp.visible = tearFactor > 0.01;

      // Local detachment progress (0.0 to 1.0)
      const travelWindow = 0.28;
      const tau = Math.min(1.0, (releaseProgress - b.delay) / travelWindow);

      // Smooth ease-out flight curve
      const ease = 1.0 - Math.pow(1.0 - tau, 3.0);

      const start = startPositions[index];
      const target = targetPositions[index];

      // Interpolate travel position
      const curX = THREE.MathUtils.lerp(start.x, target.x, ease);
      const curY = THREE.MathUtils.lerp(start.y, target.y, ease);
      const curZ = THREE.MathUtils.lerp(start.z, target.z, ease);

      // Ambient fluid floating bobbing once arrived
      const floatX = Math.sin(t * (1.3 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.12 : 0.18) * ease;
      const floatY = Math.cos(t * (1.6 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.16 : 0.24) * ease;
      const floatZ = Math.sin(t * (1.1 * b.wobbleSpeed) + b.phase) * 0.14 * ease;

      // Budding pop scale curve: expands to 1.16 then settles to 1.0
      let s = 0.0;
      if (tau < 0.35) {
        s = (tau / 0.35) * 1.16;
      } else {
        s = 1.16 - ((tau - 0.35) / 0.65) * 0.16;
      }

      // Gentle fluid breathing pulsation once arrived
      const breath = Math.sin(t * (2.2 * b.wobbleSpeed) + b.phase) * (isMobile ? 0.035 : 0.025) * ease;
      const finalScale = Math.max(0.0, (s + breath) * tearFactor);

      // -----------------------------------------------------------------------
      // BOOK OPENING / SCREEN-COVERING ANIMATION COORDINATION
      // -----------------------------------------------------------------------
      if (openedBookIndex !== null) {
        if (index === openedBookIndex) {
          // THIS BOOK GLIDES TO CENTER FOREGROUND
          currentOpenProgress.current[index] = THREE.MathUtils.damp(
            currentOpenProgress.current[index],
            1.0,
            7.0,
            delta
          );
          grp.position.lerp(centerFront, Math.min(1.0, delta * 7.5));
          grp.scale.set(1.0, 1.0, 1.0);
          grp.visible = true;
          return;
        } else {
          // OTHER 5 BOOKS SHRINK AWAY SMOOTHLY
          currentOpenProgress.current[index] = THREE.MathUtils.damp(
            currentOpenProgress.current[index],
            0.0,
            10.0,
            delta
          );
          const curS = THREE.MathUtils.damp(grp.scale.x, 0.0, 9.0, delta);
          grp.scale.set(curS, curS, curS);
          grp.visible = curS > 0.005;
          return;
        }
      } else {
        // NO BOOK OPENED: RESTORE ALL BOOKS TO NORMAL CONSTELLATION
        currentOpenProgress.current[index] = THREE.MathUtils.damp(
          currentOpenProgress.current[index],
          0.0,
          8.0,
          delta
        );
        const normalPos = new THREE.Vector3(curX + floatX, curY + floatY, curZ + floatZ);
        grp.position.lerp(normalPos, Math.min(1.0, delta * 8.0));
        const curS = THREE.MathUtils.damp(grp.scale.x, finalScale, 8.0, delta);
        grp.scale.set(curS, curS, curS);
        grp.visible = tearFactor > 0.01;
      }
    });
  });

  if (!active) return null;

  // Substantial, majestic scale matching the volume of the original bubbles
  const baseBookScale = isMobile ? 2.05 : isTablet ? 2.45 : 2.75;

  return (
    <group name="ReleasedSmallBubblesContainer">
      {/* Soft Fill & Directional Lighting for Revealed 3D Grimoires */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 8, 10]} intensity={1.1} />

      {activePresets.map((b, index) => {
        const grimoire = GRIMOIRES_DATA[index] || GRIMOIRES_DATA[0];
        const project = PROJECTS_DATA[index] || PROJECTS_DATA[0];
        const isPopped = poppedMask[index];
        const popTime = popTimesRef.current[index];

        // Bubble scale handling for forward swell or reverse reformation
        let bubbleScaleMultiplier = 1.0;
        if (isReversing) {
          if (reverseStage === 'BOOKS') {
            bubbleScaleMultiplier = THREE.MathUtils.clamp(reverseBooksProgress / 0.85, 0.0, 1.0);
          } else {
            bubbleScaleMultiplier = 1.0;
          }
        } else if (!isPopped) {
          const scheduledTime = 0.20 + index * 0.15;
          const timeUntilPop = scheduledTime - floatingTimerRef.current;
          if (timeUntilPop > 0 && timeUntilPop < 0.08) {
            const u = 1.0 - timeUntilPop / 0.08;
            bubbleScaleMultiplier = 1.0 + Math.sin(u * Math.PI) * 0.14;
          }
        }

        return (
          <group
            key={b.id}
            ref={(el) => {
              bubbleRefs.current[index] = el;
            }}
            visible={false}
          >
            {/* 1. BLACK BUBBLE MESH (Visible before popping, and when reversing back into bubbles!) */}
            {(!isPopped || isReversing) && (
              <group
                scale={[bubbleScaleMultiplier, bubbleScaleMultiplier, bubbleScaleMultiplier]}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReversing) triggerBubblePop(index);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
                }}
              >
                <BlackBubbleMesh
                  radius={b.radius}
                  progress={1.0}
                  mode="SEALED"
                  position={[0, 0, 0]}
                  wobbleIntensity={0.045}
                />
              </group>
            )}

            {/* 2. POP BURST PARTICLES & SHOCKWAVE RING (FRAME DRIVEN - only on forward pop) */}
            {!isReversing && (
              <PopBurstEffect
                color={grimoire.accentColor}
                radius={b.radius}
                isPopped={isPopped}
                popTime={popTime}
                floatingTimerRef={floatingTimerRef}
              />
            )}

            {/* 3. REVEALED 3D GRIMOIRE BOOK (FRAME DRIVEN) */}
            <RevealedGrimoireBook
              grimoire={grimoire}
              project={project}
              index={index}
              baseScale={baseBookScale}
              isPopped={isPopped}
              popTime={popTime}
              floatingTimerRef={floatingTimerRef}
              isHovered={hoveredIndex === index}
              isReversing={isReversing}
              reverseBooksProgress={reverseBooksProgress}
              isOpened={openedBookIndex === index}
              isOtherOpened={openedBookIndex !== null && openedBookIndex !== index}
              openProgress={currentOpenProgress.current[index] || 0}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
              onClick={() => {
                onSelectGrimoire?.(grimoire);
                onSelectProject?.(project);
              }}
            />
          </group>
        );
      })}
    </group>
  );
};
