import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import { DAY_LENGTH, nightAmount } from './partySchedule';

interface FantasySkyProps {
  time?: number;
}

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
  uniform vec3 uZenithDay;
  uniform vec3 uHorizonDay;
  uniform vec3 uZenithNight;
  uniform vec3 uHorizonNight;
  uniform vec3 uZenithSunset;
  uniform vec3 uHorizonSunset;
  uniform float uNight;
  uniform float uSunset;

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y * 1.8 + 0.1, 0.0, 1.0);

    // Sky colors for each period
    vec3 dayColor = mix(uHorizonDay, uZenithDay, h);
    vec3 sunsetColor = mix(uHorizonSunset, uZenithSunset, h);
    vec3 nightColor = mix(uHorizonNight, uZenithNight, h);

    // Blend day into sunset, then into night
    vec3 transitionColor = mix(dayColor, sunsetColor, uSunset);
    vec3 finalColor = mix(transitionColor, nightColor, uNight);

    // Underneath island soft grounding
    if (dir.y < 0.0) {
      finalColor = mix(finalColor, finalColor * 0.4, clamp(-dir.y * 2.5, 0.0, 1.0));
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const FantasySky: React.FC<FantasySkyProps> = () => {
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  // Dynamic sky uniforms
  const uniforms = useMemo(
    () => ({
      uZenithDay: { value: new THREE.Color('#2563eb') },
      uHorizonDay: { value: new THREE.Color('#93c5fd') },
      uZenithSunset: { value: new THREE.Color('#2e1a47') },
      uHorizonSunset: { value: new THREE.Color('#f97316') },
      uZenithNight: { value: new THREE.Color('#060814') },
      uHorizonNight: { value: new THREE.Color('#191432') },
      uNight: { value: 0.0 },
      uSunset: { value: 0.0 },
    }),
    []
  );

  // Cloud materials that shift tone between day and night
  const cloudMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85,
      }),
    []
  );

  useFrame((state) => {
    // Synchronized with island party clock
    const t = state.clock.getElapsedTime() % DAY_LENGTH;
    const night = nightAmount(t);

    // Sunset peaks around t = 68-74 and sunrise around t = 108-114
    const sunsetPeak =
      Math.exp(-Math.pow((t - 71) / 7.0, 2)) +
      Math.exp(-Math.pow((t - 111) / 6.0, 2));
    const sunset = Math.min(1.0, sunsetPeak * 1.4);

    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uNight.value = night;
      skyMatRef.current.uniforms.uSunset.value = sunset;
    }

    // Dynamic cloud color tinting
    if (cloudMat) {
      const dayCloud = new THREE.Color('#ffffff');
      const sunsetCloud = new THREE.Color('#fcd34d');
      const nightCloud = new THREE.Color('#1e213d');

      const col = dayCloud
        .clone()
        .lerp(sunsetCloud, sunset)
        .lerp(nightCloud, night);
      cloudMat.color.copy(col);
      cloudMat.opacity = THREE.MathUtils.lerp(0.85, 0.45, night);
    }

    // Gentle slow drifting of distant clouds
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.008;
    }

    // Synchronize scene fog with the horizon
    const scene = state.scene;
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      const dayFog = new THREE.Color('#93c5fd');
      const sunsetFog = new THREE.Color('#fdba74');
      const nightFog = new THREE.Color('#0d1022');

      const currentFogColor = dayFog
        .clone()
        .lerp(sunsetFog, sunset)
        .lerp(nightFog, night);
      scene.fog.color.copy(currentFogColor);
      scene.fog.near = THREE.MathUtils.lerp(35, 24, night);
      scene.fog.far = THREE.MathUtils.lerp(100, 72, night);
    }
  });

  return (
    <group name="AtmosphereGroup">
      {/* 360-degree Celestial Sky Dome */}
      <mesh scale={[-1, 1, 1]} renderOrder={-1000}>
        <sphereGeometry args={[260, 32, 16]} />
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Shimmering Starfield (visible at dusk and night) */}
      <Stars
        radius={220}
        depth={50}
        count={1400}
        factor={4}
        saturation={0.8}
        fade
        speed={1}
      />

      {/* Soft Distant Floating Clouds */}
      <group ref={cloudsRef}>
        {[
          { pos: [45, 14, -40] as const, scale: [14, 5, 8] as const, rot: 0.2 },
          { pos: [-50, 18, -30] as const, scale: [18, 6, 9] as const, rot: -0.4 },
          { pos: [38, 12, 45] as const, scale: [12, 4, 7] as const, rot: 0.6 },
          { pos: [-42, 15, 38] as const, scale: [16, 5, 8] as const, rot: 0.1 },
          { pos: [10, 22, -60] as const, scale: [22, 7, 11] as const, rot: -0.2 },
          { pos: [-15, 20, 55] as const, scale: [15, 5, 8] as const, rot: 0.5 },
        ].map((c, i) => (
          <Float key={i} speed={0.4} rotationIntensity={0.08} floatIntensity={0.25}>
            <group position={c.pos} rotation={[0, c.rot, 0]}>
              <mesh material={cloudMat} scale={c.scale}>
                <dodecahedronGeometry args={[1, 1]} />
              </mesh>
              {/* Secondary puff for organic cloud shape */}
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

      {/* Ambient Sun Dust (Daytime) */}
      <Sparkles
        count={35}
        scale={22}
        size={2.2}
        speed={0.25}
        color="#fef08a"
        opacity={0.45}
      />

      {/* Magical Fireflies over the island (Nighttime) */}
      <Sparkles
        count={40}
        scale={[18, 5, 18]}
        position={[0, 1.8, 0]}
        size={3.2}
        speed={0.4}
        color="#86efac"
        opacity={0.65}
      />
    </group>
  );
};
