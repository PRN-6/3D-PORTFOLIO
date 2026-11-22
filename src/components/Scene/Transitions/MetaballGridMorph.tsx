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

  const timeRef = useRef(0);
  const morphTimeRef = useRef(0);
  const reverseTimeRef = useRef(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Center anchor in 3D camera space
  const centerAnchor = useMemo(() => new THREE.Vector3(0, 0.7, 0), []);

  // Viewport responsive dimensions matching reference image exact aspect ratio and gaps
  const { totalHeight, capsuleRadius, cylinderHeight, colPositions } =
    useMemo(() => {
      // Presentation camera fixed distance is 21.83 (from [14, 10, 14] to [0, 0.8, 0])
      const aspect = size.width / Math.max(1, size.height);
      const fixedDistance = isMobile ? 21.6 : 21.83;
      // SCENE_CONFIG.camera.fov is 45
      const vFov = THREE.MathUtils.degToRad(45);
      const frustumHeight = 2 * Math.tan(vFov / 2) * fixedDistance;
      const frustumWidth = frustumHeight * aspect;

      // 5 columns spanning 96% of screen width with clean margins (~2%) and tight gaps (~12px)
      const targetSpan = frustumWidth * (isMobile ? 0.94 : 0.96);
      const gap = frustumWidth * (isMobile ? 0.010 : 0.009);
      const width = (targetSpan - 4 * gap) / 5;
      const height = frustumHeight * (isMobile ? 0.74 : 0.82);
      const radius = width * 0.495;
      const cylHeight = Math.max(0.1, height - 2 * radius);

      // 5 Column centers along X axis (-2, -1, 0, +1, +2)
      const positions: number[] = [];
      for (let i = -2; i <= 2; i++) {
        positions.push(i * (width + gap));
      }

      return {
        totalHeight: height,
        capsuleRadius: radius,
        cylinderHeight: cylHeight,
        colPositions: positions,
      };
    }, [size.width, size.height, isMobile]);

  // Initial 6 bubble resting positions (in camera coordinates)
  const initialBubblePos = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fixedDistance = isMobile ? 21.6 : 21.83;
    const vFov = THREE.MathUtils.degToRad(45);
    const frustumHeight = 2 * Math.tan(vFov / 2) * fixedDistance;
    const frustumWidth = frustumHeight * aspect;

    const spreadX = frustumWidth * 0.28;
    const spreadY = frustumHeight * 0.24;
    return [
      new THREE.Vector3(-spreadX,  spreadY,  0.4),  // 0: top left
      new THREE.Vector3(0.0,      spreadY * 1.35, -0.6), // 1: top center
      new THREE.Vector3(spreadX,   spreadY,  0.5),  // 2: top right
      new THREE.Vector3(spreadX,  -spreadY, -0.5),  // 3: bottom right
      new THREE.Vector3(0.0,     -spreadY * 1.35,  0.3), // 4: bottom center
      new THREE.Vector3(-spreadX, -spreadY, -0.4),  // 5: bottom left
    ];
  }, [size.width, size.height, isMobile]);

  // Target positions for the droplets in Phase 2
  const dropletTargets = useMemo(() => {
    const yTop = totalHeight * 0.26;
    const yBot = -totalHeight * 0.26;
    return [
      new THREE.Vector3(colPositions[0], yTop, 0.0),   // 0 -> Col 0 Top
      new THREE.Vector3(colPositions[1], 0.0,  0.0),   // 1 -> Col 1 Mid
      new THREE.Vector3(colPositions[4], yTop, 0.0),   // 2 -> Col 4 Top
      new THREE.Vector3(colPositions[4], yBot, 0.0),   // 3 -> Col 4 Bot
      new THREE.Vector3(colPositions[3], 0.0,  0.0),   // 4 -> Col 3 Mid
      new THREE.Vector3(colPositions[0], yBot, 0.0),   // 5 -> Col 0 Bot
      new THREE.Vector3(colPositions[2], 0.0,  0.0),   // 6 -> Col 2 Mid (center)
    ];
  }, [colPositions, totalHeight]);

  // Droplet Bezier control points (curving outward/inward for organic liquid trajectory)
  const bezierControls = useMemo(() => {
    return [
      new THREE.Vector3(colPositions[0] - 1.4,  totalHeight * 0.40,  0.5),
      new THREE.Vector3(colPositions[1] - 0.8,  totalHeight * 0.32, -0.3),
      new THREE.Vector3(colPositions[4] + 1.4,  totalHeight * 0.40,  0.5),
      new THREE.Vector3(colPositions[4] + 1.4, -totalHeight * 0.40, -0.3),
      new THREE.Vector3(colPositions[3] + 0.8, -totalHeight * 0.32,  0.2),
      new THREE.Vector3(colPositions[0] - 1.4, -totalHeight * 0.40, -0.3),
      new THREE.Vector3(0.0, totalHeight * 0.18, 0.0),
    ];
  }, [colPositions, totalHeight]);

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
          uWaistPinch: { value: 0.28 },
          uHalfHeight: { value: totalHeight * 0.5 },
          uRadius: { value: capsuleRadius },
          uElongation: { value: 0.0 },
          uScaleX: { value: 1.0 },
          uOpacity: { value: 0.0 },
          uRimBoost: { value: 1.0 },
          uBaseColor: { value: new THREE.Color(isLight ? '#1c1a17' : '#090a0f') },
          uRimColor: { value: new THREE.Color(isLight ? '#8c7f68' : '#3b4758') },
          uSpecularColor: { value: new THREE.Color('#ffffff') },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPhase;
          uniform float uWaistPinch;
          uniform float uHalfHeight;
          uniform float uRadius;
          uniform float uElongation;
          uniform float uScaleX;

          varying vec3 vLocalNormal;
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
            vNormX = clamp(pos.x / max(0.001, uRadius), -1.0, 1.0);

            // Waist pinch: maximum pinch at normY = 0, zero at caps normY = +-1
            // Cosine curve: cos(normY * PI / 2) creates smooth dumbbell / twin metaball fusion
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

            vLocalNormal = modNormal;
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

          varying vec3 vLocalNormal;
          varying vec3 vViewNormal;
          varying vec3 vViewPosition;
          varying float vNormY;
          varying float vNormX;

          void main() {
            if (uOpacity < 0.005) discard;

            vec3 norm = normalize(vLocalNormal);
            if (!gl_FrontFacing) norm = -norm;

            // Body volume curvature
            float NdotL = max(norm.z, 0.0);
            vec3 bodyColor = uBaseColor * (0.85 + 0.35 * NdotL);

            // 1. Edge Fresnel rim lighting outlining silhouette cleanly against negative space
            float fresnel = 1.0 - max(norm.z, 0.0);
            float rimPower = pow(fresnel, 2.0) * uRimBoost;
            vec3 rimLight = uRimColor * (rimPower * 1.75);

            // 2. Dual-Lobe Specular Highlights:
            // Slanted anisotropic gloss on upper-right shoulder matching reference image
            vec2 specPos1 = vec2(vNormX - 0.42, vNormY - 0.62);
            float rotX1 = specPos1.x * 0.707 + specPos1.y * 0.707;
            float rotY1 = -specPos1.x * 0.707 + specPos1.y * 0.707;
            float dist1 = (rotX1 * rotX1) * 4.5 + (rotY1 * rotY1) * 1.8;
            float specCore1 = exp(-dist1 * 12.0) * 1.6;
            float specGlow1 = exp(-dist1 * 3.2) * 0.50;
            float spec1 = (specCore1 + specGlow1) * max(norm.z, 0.0);

            // Secondary softer reflection on lower-right
            vec2 specPos2 = vec2(vNormX - 0.44, vNormY + 0.42);
            float rotX2 = specPos2.x * 0.707 + specPos2.y * 0.707;
            float rotY2 = -specPos2.x * 0.707 + specPos2.y * 0.707;
            float dist2 = (rotX2 * rotX2) * 4.8 + (rotY2 * rotY2) * 2.0;
            float specCore2 = exp(-dist2 * 10.0) * 0.70;
            float specGlow2 = exp(-dist2 * 2.8) * 0.28;
            float spec2 = (specCore2 + specGlow2) * max(norm.z, 0.0);

            // 3D Directional Blinn-Phong specular highlight for realistic liquid glass sheen
            vec3 lightDir = normalize(vec3(0.65, 0.75, 0.82));
            vec3 halfV = normalize(lightDir + vec3(0.0, 0.0, 1.0));
            float phong = pow(max(dot(norm, halfV), 0.0), 32.0) * 0.45;

            // Suppress specular in the pinched waist center so the middle stays dark and glassy
            float inWaist = smoothstep(0.38, 0.0, abs(vNormY));
            float waistSuppression = 1.0 - inWaist * 0.90;

            vec3 specular = uSpecularColor * ((spec1 + spec2 + phong) * waistSuppression);
            vec3 color = bodyColor + rimLight + specular;

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
    const baseColor = new THREE.Color(isLight ? '#1c1a17' : '#090a0f');
    const rimColor = new THREE.Color(isLight ? '#8c7f68' : '#3b4758');

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

    // Real-time camera view basis vectors at centerAnchor (zero foreshortening across any camera angle)
    const currLook = new THREE.Vector3().subVectors(centerAnchor, camera.position).normalize();
    const currRight = new THREE.Vector3().crossVectors(currLook, camera.up).normalize();
    const currUp = new THREE.Vector3().crossVectors(currRight, currLook).normalize();

    // -------------------------------------------------------------------------
    // REVERSE MODE: Retract capsules into droplets, then droplets fly to center
    // -------------------------------------------------------------------------
    if (isReversing) {
      reverseTimeRef.current += delta * 1.5;
      const revP = Math.min(1.0, reverseTimeRef.current / 1.15);

      // Phase 1 of reverse (0.0 to 0.35): Columns shrink vertically along Y into round droplets
      const shrinkPhase = THREE.MathUtils.clamp(revP / 0.35, 0.0, 1.0);
      const colElong = 1.0 - easeCubicOut(shrinkPhase);
      const colOpacity = Math.max(0.0, 1.0 - shrinkPhase * 1.6);
      const dropOpacity = THREE.MathUtils.clamp(shrinkPhase * 1.6, 0.0, 1.0);

      columnMaterials.forEach((mat) => {
        mat.uniforms.uElongation.value = colElong;
        mat.uniforms.uOpacity.value = colOpacity;
      });

      // Phase 2 of reverse (0.30 to 1.0): Droplets fly back along Bezier to center [0, 0, 0]
      const flyPhase = THREE.MathUtils.clamp((revP - 0.30) / 0.70, 0.0, 1.0);
      const flyEase = easePower3InOut(flyPhase);
      const mergeShrink = flyPhase > 0.65 ? Math.max(0.0, 1.0 - (flyPhase - 0.65) / 0.35) : 1.0;

      for (let i = 0; i < 7; i++) {
        const mesh = dropletRefs.current[i];
        const mat = dropletMaterials[i];
        if (!mesh || !mat) continue;

        mat.uniforms.uTime.value = t;
        mat.uniforms.uScale.value = 0.45 * mergeShrink;
        mat.uniforms.uOpacity.value = Math.max(0.0, (1.0 - flyPhase) * dropOpacity);

        const targetP = dropletTargets[i];
        const centerP = new THREE.Vector3(0, 0, 0);
        const ctrlP = bezierControls[i];

        // Glide back towards center anchor
        const curLocal = quadBezier(targetP, ctrlP, centerP, flyEase);
        const worldP = centerAnchor
          .clone()
          .addScaledVector(currRight, curLocal.x)
          .addScaledVector(currUp, curLocal.y)
          .addScaledVector(currLook, -curLocal.z);

        mesh.position.copy(worldP);
        mesh.visible = mat.uniforms.uOpacity.value > 0.01;
      }
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
        .addScaledVector(currRight, curLocal.x)
        .addScaledVector(currUp, curLocal.y)
        .addScaledVector(currLook, -curLocal.z);

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

      // Capsule waist pinch: starts at 0.44 (fusing metaball), relaxes to 0.28
      const settledPinch = 0.28 + 0.02 * Math.sin(t * 2.2 + colIndex * 0.85);
      const currentPinch = THREE.MathUtils.lerp(0.44, settledPinch, e3);
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
        .addScaledVector(currRight, posX)
        .addScaledVector(currUp, 0.0)
        .addScaledVector(currLook, 0.0);

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
