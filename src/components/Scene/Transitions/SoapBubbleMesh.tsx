import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SoapBubbleMeshProps {
  radius: number; // Current base radius
  wobbleIntensity?: number;
  opacity?: number;
  position?: [number, number, number];
}

/**
 * SoapBubbleMesh
 *
 * Renders a shimmering, iridescent translucent soap bubble that encloses the 3D model.
 * Features:
 * - Double-sided translucent transmission
 * - Dynamic rainbow Fresnel sheen (cyan, magenta, gold, lavender)
 * - Physical surface wobble simulating fluid surface tension
 * - Dual specular highlights
 */
export const SoapBubbleMesh: React.FC<SoapBubbleMeshProps> = ({
  radius,
  wobbleIntensity = 0.04,
  opacity = 0.85,
  position = [0, 0.5, 0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Custom shader material for authentic iridescent soap bubble sheen
  const bubbleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uColor1: { value: new THREE.Color('#38bdf8') }, // Shimmering Sky Cyan
        uColor2: { value: new THREE.Color('#f472b6') }, // Iridescent Rose Pink
        uColor3: { value: new THREE.Color('#facc15') }, // Golden Flare
        uColor4: { value: new THREE.Color('#c084fc') }, // Lavender Violet
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        uniform float uTime;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          
          // Subtle organic surface wobble
          vec3 pos = position;
          float wobble = sin(pos.x * 3.0 + uTime * 6.0) * cos(pos.y * 3.5 + uTime * 5.0) * sin(pos.z * 3.0 + uTime * 4.0);
          pos += normal * (wobble * 0.045);

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
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel falloff: strong at glancing angles (bubble rim), clear in the center
          float fresnel = 1.0 - abs(dot(normal, viewDir));
          float rim = pow(fresnel, 2.2);

          // Iridescent chromatic swirl based on angle and time
          float angle = dot(normal, vec3(0.0, 1.0, 0.0)) * 2.0 + uTime * 1.5;
          float t = sin(angle) * 0.5 + 0.5;
          float t2 = cos(normal.x * 3.0 + uTime * 2.0) * 0.5 + 0.5;

          vec3 rainbowColor = mix(
            mix(uColor1, uColor2, t),
            mix(uColor3, uColor4, t2),
            fresnel
          );

          // Dual specular highlights (sun + sky reflections)
          vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.4));
          vec3 lightDir2 = normalize(vec3(-0.6, 0.7, -0.4));
          vec3 half1 = normalize(lightDir1 + viewDir);
          vec3 half2 = normalize(lightDir2 + viewDir);
          float spec1 = pow(max(dot(normal, half1), 0.0), 90.0) * 1.8;
          float spec2 = pow(max(dot(normal, half2), 0.0), 60.0) * 0.9;

          // Composite color
          vec3 finalColor = rainbowColor * (0.4 + rim * 0.9) + vec3(spec1 + spec2);

          // Opacity is thin in the center, glowing on the rims
          float finalAlpha = (rim * 0.85 + (spec1 + spec2) * 0.7 + 0.08) * uOpacity;

          gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.95));
        }
      `,
    });
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    bubbleMaterial.uniforms.uTime.value = timeRef.current;
    bubbleMaterial.uniforms.uOpacity.value = opacity;

    if (meshRef.current) {
      // Elastic fluid scale wobbling
      const t = timeRef.current;
      const sx = 1.0 + Math.sin(t * 7.5) * wobbleIntensity;
      const sy = 1.0 + Math.cos(t * 6.5) * (wobbleIntensity * 1.1);
      const sz = 1.0 - Math.sin(t * 8.0) * (wobbleIntensity * 0.9);
      meshRef.current.scale.set(radius * sx, radius * sy, radius * sz);
    }
  });

  return (
    <mesh ref={meshRef} position={position} material={bubbleMaterial}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
};

