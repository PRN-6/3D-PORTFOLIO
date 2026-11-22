import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECTS_DATA, type ProjectItem } from '../../../data/projectsData';

export interface MetaballGridMorphProps {
  active: boolean;
  releaseProgress: number; // 0.0 to 1.0
  isReversing?: boolean;
  onClose?: () => void;
  onSelectProject?: (project: ProjectItem) => void;
}

/** Easing helper: GSAP back.in(1.4) */
function easeBackIn(p: number, s = 1.4): number {
  return p * p * ((s + 1) * p - s);
}

/** Easing helper: GSAP power3.inOut */
function easePower3InOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/** Easing helper: Cubic ease-out */
function easeCubicOut(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

/** Quadratic Bezier curve interpolation */
function quadBezier(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number): THREE.Vector3 {
  const inv = 1 - t;
  return new THREE.Vector3(
    inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
    inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z
  );
}

/**
 * MetaballGridMorph
 *
 * Implements the continuous 4-Phase Metaball Grid Morph:
 * 1. Phase 1 — Contraction & Detach (0.0s – 0.6s): Spheres contract to ~0.45x with back.in(1.4)
 * 2. Phase 2 — Guided Trajectory & Pairing (0.6s – 1.3s): Droplets glide along Bezier paths into 5 columns
 * 3. Phase 3 — Vertical Elongation & Metaball Fusion (1.3s – 2.0s): Droplets stretch into 5 vertical rounded capsules
 * 4. Phase 4 — Idle Viscous Breathing & Hover (2.0s+): Sinusoidal breathing, waist pinch, dual-lobe highlights
 */
export const MetaballGridMorph: React.FC<MetaballGridMorphProps> = ({
  active,
  releaseProgress,
  isReversing = false,
  onClose,
  onSelectProject,
}) => {
  const { camera, size } = useThree();
  const { isLight } = useTheme();

  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;

  const timeRef = useRef(0);
  const morphTimeRef = useRef(0);
  const reverseTimeRef = useRef(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Center anchor in 3D camera space
  const centerAnchor = useMemo(() => new THREE.Vector3(0, 0.7, 0), []);

  // Compute camera basis vectors
  const { rightVec, upVec, lookVec } = useMemo(() => {
    const look = new THREE.Vector3().subVectors(centerAnchor, camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(look, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, look).normalize();
    return { rightVec: right, upVec: up, lookVec: look };
  }, [camera, centerAnchor]);

  // Viewport responsive dimensions matching reference image exact aspect ratio and gaps
  const { totalHeight, capsuleRadius, cylinderHeight, colPositions } =
    useMemo(() => {
      const scaleFactor = isMobile ? 0.65 : isTablet ? 0.88 : 1.0;
      // 5 columns spanning across the negative space between nav and footer with tight gaps
      const colWidth = (isMobile ? 2.65 : isTablet ? 3.5 : 4.35) * scaleFactor;
      const gap = (isMobile ? 0.12 : isTablet ? 0.15 : 0.18) * scaleFactor;
      const height = (isMobile ? 12.2 : isTablet ? 10.8 : 10.4) * scaleFactor;
      const radius = colWidth * 0.49;
      const cylHeight = Math.max(0.1, height - 2 * radius);

      // 5 Column centers along X axis (-2, -1, 0, +1, +2)
      const positions: number[] = [];
      for (let i = -2; i <= 2; i++) {
        positions.push(i * (colWidth + gap));
      }

      return {
        totalHeight: height,
        capsuleRadius: radius,
        cylinderHeight: cylHeight,
        colPositions: positions,
      };
    }, [isMobile, isTablet]);

  // Initial 6 bubble resting positions (in camera coordinates)
  const initialBubblePos = useMemo(() => {
    return [
      new THREE.Vector3(-7.2, 2.8, 0.4),  // 0: top left
      new THREE.Vector3(0.0, 4.2, -0.6),   // 1: top center
      new THREE.Vector3(7.2, 2.8, 0.5),   // 2: top right
      new THREE.Vector3(7.2, -2.3, -0.5),  // 3: bottom right
      new THREE.Vector3(0.0, -3.5, 0.3),   // 4: bottom center
      new THREE.Vector3(-7.2, -2.3, -0.4), // 5: bottom left
    ];
  }, []);

  // Target positions for the droplets in Phase 2
  const dropletTargets = useMemo(() => {
    return [
      new THREE.Vector3(colPositions[0], 2.4, 0.0),   // 0 -> Col 0 Top
      new THREE.Vector3(colPositions[1], 0.0, 0.0),   // 1 -> Col 1 Mid
      new THREE.Vector3(colPositions[4], 2.4, 0.0),   // 2 -> Col 4 Top
      new THREE.Vector3(colPositions[4], -2.4, 0.0),  // 3 -> Col 4 Bot
      new THREE.Vector3(colPositions[3], 0.0, 0.0),   // 4 -> Col 3 Mid
      new THREE.Vector3(colPositions[0], -2.4, 0.0),  // 5 -> Col 0 Bot
      new THREE.Vector3(colPositions[2], 0.0, 0.0),   // 6 -> Col 2 Mid (center)
    ];
  }, [colPositions]);

  // Droplet Bezier control points (curving outward/inward for organic liquid trajectory)
  const bezierControls = useMemo(() => {
    return [
      new THREE.Vector3(colPositions[0] - 1.2, 4.0, 0.5),
      new THREE.Vector3(colPositions[1] - 0.8, 3.2, -0.3),
      new THREE.Vector3(colPositions[4] + 1.2, 4.0, 0.5),
      new THREE.Vector3(colPositions[4] + 1.2, -3.8, -0.3),
      new THREE.Vector3(colPositions[3] + 0.8, -3.0, 0.2),
      new THREE.Vector3(colPositions[0] - 1.2, -3.8, -0.3),
      new THREE.Vector3(0.0, 1.8, 0.0),
    ];
  }, [colPositions]);

  // 3D Capsule Geometry for the 5 vertical columns
  const capsuleGeometry = useMemo(() => {
    return new THREE.CapsuleGeometry(capsuleRadius, cylinderHeight, 32, 64);
  }, [capsuleRadius, cylinderHeight]);

  // 3D Sphere Geometry for the contracting/gliding droplets
  const sphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(capsuleRadius * 0.92, 32, 32);
  }, [capsuleRadius]);

  // Shader Material Factory for the Obsidian Liquid Capsules
  const columnMaterials = useMemo(() => {
    return colPositions.map((_, i) => {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uPhase: { value: i * 0.75 },
          uWaistPinch: { value: 0.17 },
          uHalfHeight: { value: totalHeight * 0.5 },
          uElongation: { value: 0.0 },
          uScaleX: { value: 1.0 },
          uOpacity: { value: 0.0 },
          uRimBoost: { value: 1.0 },
          uBaseColor: { value: new THREE.Color(isLight ? '#22201d' : '#050508') },
          uRimColor: { value: new THREE.Color(isLight ? '#8a7d65' : '#2d3748') },
          uSpecularColor: { value: new THREE.Color('#ffffff') },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPhase;
          uniform float uWaistPinch;
          uniform float uHalfHeight;
          uniform float uElongation;
          uniform float uScaleX;

          varying vec3 vViewNormal;
          varying vec3 vViewPosition;
          varying float vNormY;
          varying float vNormX;

          void main() {
            vec3 pos = position;

            // Phase 3 Vertical elongation: scale along Y
            pos.y *= max(0.01, uElongation);

            float effectiveHalfHeight = max(0.001, uHalfHeight * max(0.01, uElongation));
            float normY = clamp(pos.y / effectiveHalfHeight, -1.0, 1.0);
            vNormY = normY;
            vNormX = clamp(pos.x / 2.0, -1.0, 1.0);

            // Waist pinch: maximum pinch at normY = 0, zero at caps normY = +-1
            // Smooth cosine curve: cos(normY * PI / 2)
            float waistPinchCurve = cos(normY * 1.57079632679);
            float pinch = uWaistPinch * waistPinchCurve;

            // Subtle living breathing undulation
            float breath = sin(uTime * 2.2 + uPhase) * 0.016 * (1.0 - abs(normY));
            float radialScale = (1.0 - pinch + breath) * uScaleX;

            pos.x *= radialScale;
            pos.z *= radialScale;

            // Front cushion volume along Z so front surface has 3D dome curvature
            float bulge = (1.0 - pow(normY, 4.0)) * 0.22;
            pos.z += bulge * max(0.0, normal.z);

            // Calculate analytical normal with waist pinch slope
            vec3 modNormal = normal;
            float slopeY = uWaistPinch * 1.57079632679 * sin(normY * 1.57079632679) / effectiveHalfHeight;
            modNormal.y += slopeY * modNormal.x;
            modNormal = normalize(modNormal);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPosition = -mvPosition.xyz;
            vViewNormal = normalize(normalMatrix * modNormal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uPhase;
          uniform float uOpacity;
          uniform float uRimBoost;
          uniform vec3 uBaseColor;
          uniform vec3 uRimColor;
          uniform vec3 uSpecularColor;

          varying vec3 vViewNormal;
          varying vec3 vViewPosition;
          varying float vNormY;
          varying float vNormX;

          void main() {
            if (uOpacity < 0.005) discard;

            // Normal in view space (camera space: +X is right, +Y is up, +Z is forward)
            vec3 normal = normalize(vViewNormal);
            if (!gl_FrontFacing) normal = -normal;

            vec3 viewDir = normalize(vViewPosition);

            // 1. Edge Fresnel rim lighting (#1a202c / #2d3748) outlining silhouette
            float fresnel = 1.0 - max(normal.z, 0.0);
            float rimPower = pow(fresnel, 2.0) * uRimBoost;
            vec3 rimLight = uRimColor * (rimPower * 1.85);

            // 2. Dual-Lobe Specular Highlights in View Space:
            // Upper-right lobe: sharp, curved highlight on top-right shoulder (45 degrees)
            vec3 lightDir1 = normalize(vec3(0.72, 0.70, 0.75));
            vec3 half1 = normalize(lightDir1 + viewDir);
            float NdotH1 = max(dot(normal, half1), 0.0);
            float isUpperRight = smoothstep(0.12, 0.65, vNormY) * smoothstep(-0.25, 0.55, normal.x);
            float spec1 = pow(NdotH1, 42.0) * (2.6 * isUpperRight);

            // Lower-right lobe: softer, broader secondary reflection on lower half
            vec3 lightDir2 = normalize(vec3(0.68, -0.32, 0.75));
            vec3 half2 = normalize(lightDir2 + viewDir);
            float NdotH2 = max(dot(normal, half2), 0.0);
            float isLowerRight = smoothstep(-0.15, -0.65, vNormY) * smoothstep(-0.35, 0.45, normal.x);
            float spec2 = pow(NdotH2, 28.0) * (1.35 * isLowerRight);

            // Suppress specular in the pinched waist center so the middle stays dark and glassy
            float inWaist = smoothstep(0.40, 0.0, abs(vNormY));
            float waistSuppression = 1.0 - inWaist * 0.92;

            vec3 specular = uSpecularColor * ((spec1 + spec2) * waistSuppression);

            vec3 color = uBaseColor + rimLight + specular;

            gl_FragColor = vec4(color, uOpacity);
          }
        `,
      });
    });
  }, [colPositions, totalHeight, isLight]);

  // Droplet Shader Materials (matching exact obsidian black)
  const dropletMaterials = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uPhase: { value: i * 0.9 },
          uScale: { value: 1.0 },
          uOpacity: { value: 1.0 },
          uBaseColor: { value: new THREE.Color(isLight ? '#22201d' : '#050508') },
          uRimColor: { value: new THREE.Color(isLight ? '#8a7d65' : '#222938') },
          uSpecularColor: { value: new THREE.Color('#ffffff') },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPhase;
          uniform float uScale;

          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;

          void main() {
            vec3 pos = position * uScale;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPosition = -mvPosition.xyz;
            vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          uniform vec3 uBaseColor;
          uniform vec3 uRimColor;
          uniform vec3 uSpecularColor;

          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;

          void main() {
            if (uOpacity < 0.01) discard;

            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);

            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float rimPower = pow(fresnel, 2.5);
            vec3 rimLight = uRimColor * (rimPower * 1.35);

            vec3 lightDir1 = normalize(vec3(0.55, 0.85, 0.65));
            vec3 half1 = normalize(lightDir1 + viewDir);
            float spec = pow(max(dot(normal, half1), 0.0), 80.0) * 1.6;

            vec3 color = uBaseColor + rimLight + uSpecularColor * spec;
            gl_FragColor = vec4(color, uOpacity);
          }
        `,
      });
    });
  }, [isLight]);

  // Mesh references
  const columnRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dropletRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Update theme colors when mode changes
  useEffect(() => {
    const baseColor = new THREE.Color(isLight ? '#22201d' : '#050508');
    const rimColor = new THREE.Color(isLight ? '#8a7d65' : '#222938');

    columnMaterials.forEach((mat) => {
      mat.uniforms.uBaseColor.value = baseColor;
      mat.uniforms.uRimColor.value = rimColor;
    });
    dropletMaterials.forEach((mat) => {
      mat.uniforms.uBaseColor.value = baseColor;
      mat.uniforms.uRimColor.value = rimColor;
    });
  }, [isLight, columnMaterials, dropletMaterials]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  useFrame((_, delta) => {
    if (!active) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // -------------------------------------------------------------------------
    // REVERSE MODE: Morph back from capsules to droplets then center
    // -------------------------------------------------------------------------
    if (isReversing) {
      reverseTimeRef.current += delta * 1.8;
      const revP = Math.min(1.0, reverseTimeRef.current / 1.0);

      columnMaterials.forEach((mat) => {
        mat.uniforms.uOpacity.value = Math.max(0.0, 1.0 - revP * 1.8);
      });
      dropletMaterials.forEach((mat) => {
        mat.uniforms.uOpacity.value = Math.max(0.0, 1.0 - revP);
      });
      return;
    }

    reverseTimeRef.current = 0;

    // Advance morph timeline once released bubbles arrive (releaseProgress >= 0.95)
    if (releaseProgress >= 0.95) {
      morphTimeRef.current += delta;
    } else {
      morphTimeRef.current = 0;
    }
    const mt = morphTimeRef.current;

    // -------------------------------------------------------------------------
    // 4-PHASE ANIMATION TIMELINE (Total: ~2.4s)
    // -------------------------------------------------------------------------
    // Phase 1 (0.0s – 0.6s): Contraction & Detach
    // Phase 2 (0.6s – 1.3s): Guided Trajectory & Pairing
    // Phase 3 (1.3s – 2.0s): Vertical Elongation & Metaball Fusion
    // Phase 4 (2.0s+): Idle Viscous Breathing & Hover

    const p1 = THREE.MathUtils.clamp(mt / 0.6, 0.0, 1.0);
    const p2 = THREE.MathUtils.clamp((mt - 0.6) / 0.7, 0.0, 1.0);
    const p3 = THREE.MathUtils.clamp((mt - 1.3) / 0.7, 0.0, 1.0);

    // Phase 1 Contraction Factor: 1.0 -> 0.45 with back.in(1.4)
    const e1 = easeBackIn(p1, 1.4);
    const dropletScale = 1.0 - (1.0 - 0.45) * THREE.MathUtils.clamp(e1, 0.0, 1.0);

    // Phase 2 Trajectory Progress: power3.inOut
    const e2 = easePower3InOut(p2);

    // -------------------------------------------------------------------------
    // UPDATE 7 CONTRACTED DROPLETS
    // -------------------------------------------------------------------------
    const dropletOpacity = THREE.MathUtils.clamp(1.0 - (p3 * 1.6), 0.0, 1.0);

    for (let i = 0; i < 7; i++) {
      const mesh = dropletRefs.current[i];
      const mat = dropletMaterials[i];
      if (!mesh || !mat) continue;

      mat.uniforms.uTime.value = t;
      mat.uniforms.uScale.value = dropletScale;
      mat.uniforms.uOpacity.value = dropletOpacity;

      // Start position (from initial constellation)
      const startP = i < 6 ? initialBubblePos[i] : new THREE.Vector3(0, 0, 0);
      const targetP = dropletTargets[i];
      const ctrlP = bezierControls[i];

      // Interpolate along Bezier curve in Phase 2
      const curLocal = quadBezier(startP, ctrlP, targetP, e2);

      // Convert local camera coordinates into world position
      const worldP = centerAnchor
        .clone()
        .addScaledVector(rightVec, curLocal.x)
        .addScaledVector(upVec, curLocal.y)
        .addScaledVector(lookVec, -curLocal.z);

      mesh.position.copy(worldP);
      mesh.visible = dropletOpacity > 0.01;
    }

    // -------------------------------------------------------------------------
    // UPDATE 5 VERTICAL COLUMNS
    // -------------------------------------------------------------------------
    colPositions.forEach((posX, colIndex) => {
      const mesh = columnRefs.current[colIndex];
      const mat = columnMaterials[colIndex];
      if (!mesh || !mat) return;

      mat.uniforms.uTime.value = t;

      // Phase 3 Stagger: 0.08s per column from left to right
      const colStart = 1.30 + colIndex * 0.08;
      const colDuration = 0.55;
      const localP3 = THREE.MathUtils.clamp((mt - colStart) / colDuration, 0.0, 1.0);
      const e3 = easeCubicOut(localP3);

      // Capsule elongation: stretches from round droplet into full capsule height
      mat.uniforms.uElongation.value = e3;

      // Capsule waist pinch: starts at 0.38 (fusing metaball), relaxes to 0.17
      const settledPinch = 0.17 + 0.018 * Math.sin(t * 2.2 + colIndex * 0.85);
      const currentPinch = THREE.MathUtils.lerp(0.38, settledPinch, e3);
      mat.uniforms.uWaistPinch.value = currentPinch;

      // Capsule opacity: fades in as droplets fuse into it
      mat.uniforms.uOpacity.value = THREE.MathUtils.clamp(e3 * 1.6, 0.0, 1.0);

      // Hover interactivity: scaleX expands to 1.03, rim brightness lifts by 80%
      const isHovered = hoveredIndex === colIndex && mt >= 2.0;
      const targetScaleX = isHovered ? 1.03 : 1.0;
      const targetRimBoost = isHovered ? 1.8 : 1.0;

      mat.uniforms.uScaleX.value = THREE.MathUtils.damp(
        mat.uniforms.uScaleX.value,
        targetScaleX,
        8.0,
        delta
      );
      mat.uniforms.uRimBoost.value = THREE.MathUtils.damp(
        mat.uniforms.uRimBoost.value,
        targetRimBoost,
        8.0,
        delta
      );

      // Set world position of column
      const worldColPos = centerAnchor
        .clone()
        .addScaledVector(rightVec, posX)
        .addScaledVector(upVec, 0.0)
        .addScaledVector(lookVec, 0.0);

      mesh.position.copy(worldColPos);
      mesh.quaternion.copy(camera.quaternion);
      mesh.visible = mat.uniforms.uOpacity.value > 0.01;
    });
  });

  if (!active) return null;

  return (
    <group name="MetaballGridMorphContainer">
      {/* 1. CONTRACTING & GUIDED TRAJECTORY DROPLETS (Active in Phase 1 & 2) */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={`droplet-${i}`}
          ref={(el) => {
            dropletRefs.current[i] = el;
          }}
          geometry={sphereGeometry}
          material={dropletMaterials[i]}
          visible={false}
        />
      ))}

      {/* 2. 5 VERTICAL OBSIDIAN-BLACK LIQUID CAPSULES (Phase 3 & 4) */}
      {colPositions.map((_, colIndex) => {
        const project = PROJECTS_DATA[colIndex] || PROJECTS_DATA[0];

        return (
          <mesh
            key={`column-capsule-${colIndex}`}
            ref={(el) => {
              columnRefs.current[colIndex] = el;
            }}
            geometry={capsuleGeometry}
            material={columnMaterials[colIndex]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (morphTimeRef.current >= 1.8) {
                if (onSelectProject) {
                  onSelectProject(project);
                } else if (onClose) {
                  onClose();
                }
              }
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (morphTimeRef.current >= 1.8) {
                setHoveredIndex(colIndex);
                document.body.style.cursor = 'pointer';
              }
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredIndex(null);
              document.body.style.cursor = 'auto';
            }}
          />
        );
      })}
    </group>
  );
};
