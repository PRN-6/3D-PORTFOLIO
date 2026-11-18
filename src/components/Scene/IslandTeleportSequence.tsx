import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from './partyMaterials';

interface IslandTeleportSequenceProps {
  onComplete: () => void;
  onFlashProgress?: (intensity: number) => void;
}

export const IslandTeleportSequence: React.FC<IslandTeleportSequenceProps> = ({
  onComplete,
  onFlashProgress,
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Load Frieren and magic circle models
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const magicGltf = useGLTF('/models/transition/frieren-magic.glb');

  // Clone Frieren with cel-shading palette
  const { frierenScene, frierenMixer } = useMemo(() => {
    const clone = cloneSkeleton(frierenGltf.scene);
    const root = clone.getObjectByName('Frieren');
    const palette = createPartyPalette();
    if (root) {
      palette.dress(root);
    }
    const mixer = new THREE.AnimationMixer(clone);
    const magicClip = frierenGltf.animations.find((c) => c.name === 'frieren_magic_land');
    if (magicClip) {
      const action = mixer.clipAction(magicClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    }
    return { frierenScene: clone, frierenMixer: mixer };
  }, [frierenGltf]);

  // Clone magic circle
  const magicCircle = useMemo(() => {
    const clone = magicGltf.scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.Material).clone();
        mat.transparent = true;
        mat.depthWrite = false;
        mesh.material = mat;
      }
    });
    return clone;
  }, [magicGltf]);

  // Swirling rune & magic particles vortex around the island
  const particles = useMemo(() => {
    const count = 160;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new THREE.Color('#ffe2a2');
    const violet = new THREE.Color('#cdb8ff');

    for (let i = 0; i < count; i++) {
      const color = i % 2 === 0 ? gold : violet;
      color.toArray(colors, i * 3);

      const angle = (i / count) * Math.PI * 6;
      const radius = 4.2 + (i % 5) * 0.45;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = -1.5 + (i / count) * 6.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geo, mat);
  }, []);

  // Staff light and magic circle light
  const staffLightRef = useRef<THREE.PointLight>(null);
  const circleLightRef = useRef<THREE.PointLight>(null);
  const auraLightRef = useRef<THREE.PointLight>(null);

  // Position Frieren near the front courtyard / campfire facing forward
  useEffect(() => {
    frierenScene.position.set(1.4, 0.42, 2.6);
    frierenScene.rotation.set(0, -0.6, 0);
    frierenScene.scale.set(1.1, 1.1, 1.1);
  }, [frierenScene]);

  // Initial camera transition state
  const initialCamPos = useMemo(() => camera.position.clone(), [camera]);

  useFrame((state, delta) => {
    if (completedRef.current) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;

    frierenMixer.update(delta * 1.15);

    // Camera smoothly glides to an epic dramatic angle framing the entire island and Frieren
    const camTarget = new THREE.Vector3(7.2, 5.2, 8.8);
    const camLookAt = new THREE.Vector3(0.5, 1.6, 1.0);
    const camT = Math.min(elapsed / 2.0, 1.0);
    camera.position.lerpVectors(initialCamPos, camTarget, camT * 0.85);
    camera.lookAt(camLookAt);

    // 1. Magical circle beneath the island expands & glows
    if (magicCircle) {
      // Scale up rapidly from 0 to 14.5
      const circleScale = THREE.MathUtils.smoothstep(elapsed, 0.2, 1.5) * 14.5;
      magicCircle.scale.set(circleScale, circleScale, circleScale);
      magicCircle.position.set(0, -1.8, 0);
      magicCircle.rotation.y += delta * 0.65;

      const circleOpacity = THREE.MathUtils.smoothstep(elapsed, 0.2, 1.0);
      magicCircle.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.opacity = circleOpacity;
          mat.emissive = new THREE.Color('#c084fc');
          mat.emissiveIntensity = THREE.MathUtils.lerp(0.5, 2.5, Math.min(elapsed / 2.0, 1.0));
        }
      });
    }

    // 2. Staff tip glow & circle lights
    if (staffLightRef.current) {
      const staffIntensity = THREE.MathUtils.smoothstep(elapsed, 0.3, 1.8) * 3.5;
      staffLightRef.current.intensity = staffIntensity;
    }
    if (circleLightRef.current) {
      const circleIntensity = THREE.MathUtils.smoothstep(elapsed, 0.4, 1.8) * 4.5;
      circleLightRef.current.intensity = circleIntensity;
    }
    if (auraLightRef.current) {
      const auraIntensity = THREE.MathUtils.smoothstep(elapsed, 0.8, 2.4) * 6.0;
      auraLightRef.current.intensity = auraIntensity;
    }

    // 3. Swirling particle vortex animation
    if (particles) {
      const mat = particles.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.smoothstep(elapsed, 0.4, 1.6) * 0.85;

      const pos = particles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const count = arr.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = 1.8 + (i % 3) * 0.4;
        let y = arr[i * 3 + 1] + delta * speed;
        if (y > 6.5) y = -1.8;
        arr[i * 3 + 1] = y;

        // Spiral rotation
        const currentAngle = Math.atan2(arr[i * 3 + 2], arr[i * 3]);
        const radius = Math.sqrt(arr[i * 3] * arr[i * 3] + arr[i * 3 + 2] * arr[i * 3 + 2]);
        const newAngle = currentAngle + delta * (1.2 + (i % 4) * 0.3);
        arr[i * 3] = Math.cos(newAngle) * radius;
        arr[i * 3 + 2] = Math.sin(newAngle) * radius;
      }
      pos.needsUpdate = true;
    }

    // 4. Teleportation flash progress (starts at 2.2s, peaks at 2.9s)
    const flashProgress = THREE.MathUtils.smoothstep(elapsed, 2.1, 2.9);
    onFlashProgress?.(flashProgress);

    // 5. Completion transition at 2.95s
    if (elapsed >= 2.95 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef} name="IslandTeleportExperience">
      {/* Frieren casting pose with staff raised */}
      <primitive object={frierenScene} />

      {/* Staff tip crystal light */}
      <pointLight
        ref={staffLightRef}
        position={[1.4, 1.6, 2.5]}
        color="#ffe2a2"
        distance={6}
        decay={2}
        intensity={0}
      />

      {/* Under-island magical circle */}
      <primitive object={magicCircle} />

      {/* Under-island upward magical circle light */}
      <pointLight
        ref={circleLightRef}
        position={[0, -1.2, 0]}
        color="#cdb8ff"
        distance={15}
        decay={1.8}
        intensity={0}
      />

      {/* Expanding mystical aura enveloping entire island */}
      <pointLight
        ref={auraLightRef}
        position={[0, 2.5, 0]}
        color="#c084fc"
        distance={22}
        decay={1.5}
        intensity={0}
      />

      {/* Swirling rune & magic particles vortex */}
      <primitive object={particles} />
    </group>
  );
};
