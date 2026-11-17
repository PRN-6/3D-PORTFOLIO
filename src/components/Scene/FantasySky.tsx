import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vWorldPosition;
  uniform vec3 uZenithNight;
  uniform vec3 uHorizonNight;

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y * 1.8 + 0.1, 0.0, 1.0);

    // Rich nighttime gradient from horizon to zenith
    vec3 nightColor = mix(uHorizonNight, uZenithNight, h);

    // Subtle dark gradient beneath the floating island
    if (dir.y < 0.0) {
      nightColor = mix(nightColor, nightColor * 0.35, clamp(-dir.y * 2.5, 0.0, 1.0));
    }

    gl_FragColor = vec4(nightColor, 1.0);
  }
`;

export const FantasySky: React.FC = () => {
  const cloudsRef = useRef<THREE.Group>(null);

  // Deep night celestial uniforms
  const uniforms = useMemo(
    () => ({
      uZenithNight: { value: new THREE.Color('#050711') },  // Cosmic midnight navy
      uHorizonNight: { value: new THREE.Color('#141128') }, // Mystical dark purple horizon
    }),
    []
  );

  // Night clouds material
  const cloudMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#181b33',
        roughness: 0.95,
        metalness: 0.1,
        transparent: true,
        opacity: 0.42,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Gentle slow drifting of distant clouds
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.008;
    }

    // Ensure scene fog is always locked to deep night atmosphere
    const scene = state.scene;
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.color.set('#0a0c1a');
      scene.fog.near = 25;
      scene.fog.far = 75;
    }
  });

  return (
    <group name="AtmosphereGroup">
      {/* 360-degree Celestial Night Sky Dome */}
      <mesh scale={[-1, 1, 1]} renderOrder={-1000}>
        <sphereGeometry args={[260, 32, 16]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Brilliant Shimmering Starfield */}
      <Stars
        radius={220}
        depth={50}
        count={1600}
        factor={4.5}
        saturation={0.9}
        fade
        speed={1.2}
      />

      {/* Subtle Night Clouds Drifting Far Away */}
      <group ref={cloudsRef}>
        {[
          { pos: [45, 14, -40] as const, scale: [14, 5, 8] as const, rot: 0.2 },
          { pos: [-50, 18, -30] as const, scale: [18, 6, 9] as const, rot: -0.4 },
          { pos: [38, 12, 45] as const, scale: [12, 4, 7] as const, rot: 0.6 },
          { pos: [-42, 15, 38] as const, scale: [16, 5, 8] as const, rot: 0.1 },
          { pos: [10, 22, -60] as const, scale: [22, 7, 11] as const, rot: -0.2 },
          { pos: [-15, 20, 55] as const, scale: [15, 5, 8] as const, rot: 0.5 },
        ].map((c, i) => (
          <Float key={i} speed={0.3} rotationIntensity={0.06} floatIntensity={0.2}>
            <group position={c.pos} rotation={[0, c.rot, 0]}>
              <mesh material={cloudMat} scale={c.scale}>
                <dodecahedronGeometry args={[1, 1]} />
              </mesh>
              <mesh
                material={cloudMat}
                position={[c.scale[0] * 0.35, c.scale[1] * 0.2, 0]}
                scale={[c.scale[0] * 0.7, c.scale[1] * 0.8, c.scale[2] * 0.7]}
              >
                <dodecahedronGeometry args={[1, 1]} />
              </mesh>
            </group>
          </Float>
        ))}
      </group>

      {/* Magical Glowing Fireflies over the Island */}
      <Sparkles
        count={45}
        scale={[18, 5, 18]}
        position={[0, 1.8, 0]}
        size={3.5}
        speed={0.4}
        color="#86efac"
        opacity={0.8}
      />

      {/* Soft Amber Campfire Embers Floating Upward */}
      <Sparkles
        count={25}
        scale={[6, 4, 6]}
        position={[2.58, 1.2, 2.88]}
        size={2.8}
        speed={0.6}
        color="#fde047"
        opacity={0.75}
      />
    </group>
  );
};
