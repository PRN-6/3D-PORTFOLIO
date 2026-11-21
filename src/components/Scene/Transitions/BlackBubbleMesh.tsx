import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export type BubbleAnimationMode = 'FORMING' | 'SEALED' | 'TEARING';

interface BlackBubbleMeshProps {
  radius?: number;
  progress: number; // 0.0 to 1.0
  mode: BubbleAnimationMode;
  wobbleIntensity?: number;
  position?: [number, number, number];
}

/**
 * BlackBubbleMesh
 *
 * Implements a full black glossy bubble with sweeping spherical cap formation
 * and peeling/tearing puncture animation based on the reference sprite sheet.
 *
 * Visual Features:
 * - Full deep black body (pitch black / obsidian)
 * - Sharp glossy liquid specular highlights (giving rich 3D curvature)
 * - Sweeping spherical cap growth from bottom-right (FORMING: Frame 8 -> 1)
 * - Receding tear puncture peel (TEARING: Frame 1 -> 8)
 * - Thick organic undulating liquid rim contour with glint highlights
 * - Double-sided rendering so the interior cavity is visible while half-formed
 */
export const BlackBubbleMesh: React.FC<BlackBubbleMeshProps> = ({
  radius = 6.0,
  progress,
  mode,
  wobbleIntensity = 0.035,
  position = [0, 0.6, 0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Sweep axis: diagonal vector towards bottom-right (matching reference image)
  const sweepAxis = useMemo(() => new THREE.Vector3(0.55, -0.65, 0.45).normalize(), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: false,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMode: { value: 0 }, // 0: FORMING, 1: SEALED, 2: TEARING
        uSweepAxis: { value: sweepAxis },
        uRadius: { value: radius },
        uWobbleIntensity: { value: wobbleIntensity },
        uBaseColor: { value: new THREE.Color('#050508') }, // Full Deep Black
        uInnerColor: { value: new THREE.Color('#020203') }, // Full Black Cavity
        uRimGlintColor: { value: new THREE.Color('#d4d8e8') }, // Bright liquid tear edge glint
        uSpecularColor: { value: new THREE.Color('#ffffff') }, // Glossy specular highlight
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        varying float vSweepVal;
        varying vec3 vLocalPos;

        uniform vec3 uSweepAxis;
        uniform float uTime;
        uniform float uWobbleIntensity;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          // Fluid surface wobble simulating liquid surface tension
          vec3 pos = position;
          float wobble = sin(pos.x * 2.8 + uTime * 4.5) * cos(pos.y * 3.2 + uTime * 4.0) * sin(pos.z * 2.6 + uTime * 3.8);
          pos += normal * (wobble * uWobbleIntensity * 1.5);

          // Spherical coordinate sweep projection: dot product with sweep axis
          vec3 normPos = normalize(pos);
          float rawSweep = dot(normPos, normalize(uSweepAxis)); // -1.0 to +1.0

          // Organic fluid wavy contour along the tear rim (as in reference sprite)
          float wave = sin(normPos.x * 14.0 + uTime * 6.0) * 0.04
                     + cos(normPos.y * 16.0 + uTime * 5.0) * 0.035
                     + sin(normPos.z * 12.0 + uTime * 4.0) * 0.025;

          // Normalized sweep value from 0.0 to 1.0
          vSweepVal = clamp((rawSweep + 1.0) * 0.5 + wave, 0.0, 1.0);
          vLocalPos = pos;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        varying float vSweepVal;
        varying vec3 vLocalPos;

        uniform float uTime;
        uniform float uProgress;
        uniform int uMode; // 0: FORMING, 1: SEALED, 2: TEARING
        uniform vec3 uBaseColor;
        uniform vec3 uInnerColor;
        uniform vec3 uRimGlintColor;
        uniform vec3 uSpecularColor;

        void main() {
          // ===================================================================
          // 1. SWEEPING TEAR & FORM DISCARD LOGIC
          // ===================================================================
          float isTearEdge = 0.0;
          float edgeWidth = 0.08;

          if (uMode == 0) {
            // FORMING: Sweeps from bottom-right (Frame 8) to fully closed (Frame 1)
            // Progress 0.0 -> 1.0 opens up coverage across the sphere
            float threshold = uProgress * 1.12;
            if (vSweepVal > threshold) {
              discard;
            }
            float distToEdge = threshold - vSweepVal;
            isTearEdge = smoothstep(edgeWidth, 0.0, distToEdge);
          } else if (uMode == 2) {
            // TEARING: Ruptures open from bottom-right (Frame 1 -> 8)
            // Progress 0.0 -> 1.0 eats away coverage across the sphere
            float threshold = uProgress * 1.12;
            if (vSweepVal < threshold) {
              discard;
            }
            float distToEdge = vSweepVal - threshold;
            isTearEdge = smoothstep(edgeWidth, 0.0, distToEdge);
          }
          // (uMode == 1 is SEALED: no discard, complete sphere)

          // ===================================================================
          // 2. SHADING & GLOSS FOR FULL BLACK BUBBLE
          // ===================================================================
          vec3 normal = normalize(vNormal);
          if (!gl_FrontFacing) {
            normal = -normal; // Flip normal for inside cavity
          }

          vec3 viewDir = normalize(vViewPosition);

          // Subtle silver/charcoal Fresnel rim glow to define 3D volume
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          float rimGlow = pow(fresnel, 2.5);

          // Dual sharp glossy liquid specular highlights
          vec3 lightDir1 = normalize(vec3(0.5, 0.9, 0.5));
          vec3 lightDir2 = normalize(vec3(-0.7, 0.6, -0.4));
          vec3 half1 = normalize(lightDir1 + viewDir);
          vec3 half2 = normalize(lightDir2 + viewDir);

          float spec1 = pow(max(dot(normal, half1), 0.0), 90.0) * 1.6;
          float spec2 = pow(max(dot(normal, half2), 0.0), 45.0) * 0.8;
          vec3 specular = uSpecularColor * (spec1 + spec2);

          // Base black body
          vec3 bodyColor = gl_FrontFacing ? uBaseColor : uInnerColor;

          // Liquid tear rim glint (bright stylized double highlight along active tear contour)
          vec3 tearHighlight = uRimGlintColor * (isTearEdge * 2.4);

          // Subtle rim contour light to ensure readability on pitch black backgrounds
          vec3 rimLight = vec3(0.20, 0.22, 0.28) * rimGlow;

          // Composite final glossy black surface
          vec3 finalColor = bodyColor + rimLight + specular + tearHighlight;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [radius, sweepAxis, wobbleIntensity]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uProgress.value = progress;

    let modeVal = 0;
    if (mode === 'SEALED') modeVal = 1;
    else if (mode === 'TEARING') modeVal = 2;
    material.uniforms.uMode.value = modeVal;

    if (meshRef.current) {
      // Gentle breathing fluid wobble
      const t = timeRef.current;
      const s = 1.0 + Math.sin(t * 5.0) * 0.015;
      meshRef.current.scale.set(radius * s, radius * s, radius * s);
    }
  });

  return (
    <mesh ref={meshRef} position={position} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
};
