import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { BlackBubbleMesh } from './BlackBubbleMesh';
import { GRIMOIRES_DATA, type GrimoireItem } from '../../../data/archiveData';

// Preload all 6 individual grimoire 3D models for instant pop-reveal transitions
GRIMOIRES_DATA.forEach((grimoire) => {
  useGLTF.preload(grimoire.modelFile);
});

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
  { id: 0, screenX: -7.5, screenY:  3.2, depth:  0.4, radius: 2.10, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.8, depth: -0.6, radius: 1.95, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  7.5, screenY:  3.2, depth:  0.5, radius: 2.20, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  7.5, screenY: -3.0, depth: -0.5, radius: 2.15, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -4.5, depth:  0.3, radius: 2.35, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -7.5, screenY: -3.0, depth: -0.4, radius: 2.05, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Tablet (4:3 / medium width) balanced 6-bubble distribution */
export const TABLET_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -5.2, screenY:  2.8, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.3, phase: 0.0 },
  { id: 1, screenX:  0.0, screenY:  4.5, depth: -0.6, radius: 1.75, delay: 0.16, wobbleSpeed: 1.5, phase: 1.1 },
  { id: 2, screenX:  5.2, screenY:  2.8, depth:  0.5, radius: 1.95, delay: 0.32, wobbleSpeed: 1.1, phase: 2.3 },
  { id: 3, screenX:  5.2, screenY: -2.8, depth: -0.5, radius: 1.90, delay: 0.48, wobbleSpeed: 1.4, phase: 3.5 },
  { id: 4, screenX:  0.0, screenY: -4.4, depth:  0.3, radius: 2.05, delay: 0.64, wobbleSpeed: 1.0, phase: 4.4 },
  { id: 5, screenX: -5.2, screenY: -2.8, depth: -0.4, radius: 1.80, delay: 0.80, wobbleSpeed: 1.6, phase: 5.2 },
];

/** Mobile portrait organic constellation 6-bubble distribution (full screen coverage) */
export const MOBILE_BUBBLE_PRESETS: SmallBubbleItem[] = [
  { id: 0, screenX: -2.6, screenY:  8.8, depth:  0.4, radius: 1.85, delay: 0.00, wobbleSpeed: 1.2, phase: 0.0 },
  { id: 1, screenX:  2.4, screenY:  6.8, depth: -0.5, radius: 1.95, delay: 0.16, wobbleSpeed: 1.4, phase: 1.2 },
  { id: 2, screenX: -0.8, screenY:  2.6, depth:  0.8, radius: 2.15, delay: 0.32, wobbleSpeed: 1.0, phase: 2.5 },
  { id: 3, screenX:  2.8, screenY: -1.2, depth: -0.6, radius: 1.85, delay: 0.48, wobbleSpeed: 1.5, phase: 3.7 },
  { id: 4, screenX: -2.6, screenY: -4.8, depth:  0.4, radius: 1.95, delay: 0.64, wobbleSpeed: 1.1, phase: 4.8 },
  { id: 5, screenX:  1.2, screenY: -8.8, depth: -0.3, radius: 1.80, delay: 0.80, wobbleSpeed: 1.3, phase: 5.6 },
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
  index: number;
  baseScale: number;
  isPopped: boolean;
  popTime: number;
  floatingTimerRef: React.MutableRefObject<number>;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
}

const RevealedGrimoireBook: React.FC<RevealedGrimoireBookProps> = ({
  grimoire,
  index,
  baseScale,
  isPopped,
  popTime,
  floatingTimerRef,
  isHovered,
  onPointerOver,
  onPointerOut,
  onClick,
}) => {
  const gltf = useGLTF(grimoire.modelFile);
  const ringRef = useRef<THREE.Mesh>(null);
  const bookGroupRef = useRef<THREE.Group>(null);
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
    if (!isPopped || popTime < 0) {
      bookGroupRef.current.visible = false;
      bookGroupRef.current.scale.set(0, 0, 0);
      return;
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
      ringRef.current.rotation.z += delta * (isHovered ? 1.4 : 0.45);
    }
  });

  return (
    <group
      ref={bookGroupRef}
      visible={false}
      scale={[0, 0, 0]}
    >
      {/* 3D Grimoire Book Model */}
      <primitive object={clonedScene} />

      {/* Delicate Rotating Arcane Aura Ring Beneath Floating Book */}
      <mesh
        ref={ringRef}
        position={[0, -0.65, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.52, 0.62, 48]} />
        <meshBasicMaterial
          color={grimoire.accentColor}
          transparent
          opacity={isHovered ? 0.75 : 0.22}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Dedicated Book Illumination for Rich 3D Textures & Bindings */}
      <pointLight
        position={[0, 0.4, 1.2]}
        color="#ffffff"
        intensity={isHovered ? 2.5 : 1.6}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0, -0.2, 0.8]}
        color={grimoire.accentColor}
        intensity={isHovered ? 3.8 : 2.2}
        distance={5}
        decay={2}
      />

      {/* Hover Floating Title Badge */}
      {isHovered && (
        <Html position={[0, 1.35, 0]} center pointerEvents="none">
          <div className="px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/20 text-xs font-mono text-white whitespace-nowrap shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            <span style={{ color: grimoire.accentColor }} className="font-bold">{grimoire.runeSymbol}</span>
            <span>{grimoire.title}</span>
          </div>
        </Html>
      )}

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
  isTearing?: boolean;
  onSelectGrimoire?: (grimoire: GrimoireItem) => void;
  selectedGrimoire?: GrimoireItem | null;
}

export const ReleasedSmallBubbles: React.FC<ReleasedSmallBubblesProps> = ({
  active,
  releaseProgress,
  isTearing = false,
  onSelectGrimoire,
  selectedGrimoire: _selectedGrimoire,
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

  // Reset pop states if deactivated
  useEffect(() => {
    if (!active || releaseProgress < 0.1) {
      setPoppedMask([false, false, false, false, false, false]);
      popTimesRef.current = [-1, -1, -1, -1, -1, -1];
      floatingTimerRef.current = 0;
    }
  }, [active, releaseProgress]);

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

      grp.position.set(curX + floatX, curY + floatY, curZ + floatZ);

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

      // Bubble container scale (applied while traveling)
      grp.scale.set(finalScale, finalScale, finalScale);
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
        const isPopped = poppedMask[index];
        const popTime = popTimesRef.current[index];

        // Anticipation swell just before popping (0.08s before pop)
        const scheduledTime = 0.20 + index * 0.15;
        const timeUntilPop = scheduledTime - floatingTimerRef.current;
        let bubbleScaleMultiplier = 1.0;
        if (!isPopped && timeUntilPop > 0 && timeUntilPop < 0.08) {
          const u = 1.0 - timeUntilPop / 0.08;
          bubbleScaleMultiplier = 1.0 + Math.sin(u * Math.PI) * 0.14;
        }

        return (
          <group
            key={b.id}
            ref={(el) => {
              bubbleRefs.current[index] = el;
            }}
            visible={false}
          >
            {/* 1. BLACK BUBBLE MESH (Visible before popping, vanishes upon pop) */}
            {!isPopped && (
              <group
                scale={[bubbleScaleMultiplier, bubbleScaleMultiplier, bubbleScaleMultiplier]}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerBubblePop(index);
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

            {/* 2. POP BURST PARTICLES & SHOCKWAVE RING (FRAME DRIVEN) */}
            <PopBurstEffect
              color={grimoire.accentColor}
              radius={b.radius}
              isPopped={isPopped}
              popTime={popTime}
              floatingTimerRef={floatingTimerRef}
            />

            {/* 3. REVEALED 3D GRIMOIRE BOOK (FRAME DRIVEN) */}
            <RevealedGrimoireBook
              grimoire={grimoire}
              index={index}
              baseScale={baseBookScale}
              isPopped={isPopped}
              popTime={popTime}
              floatingTimerRef={floatingTimerRef}
              isHovered={hoveredIndex === index}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
              onClick={() => onSelectGrimoire?.(grimoire)}
            />
          </group>
        );
      })}
    </group>
  );
};
