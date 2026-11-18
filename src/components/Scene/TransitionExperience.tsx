import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Stars, Sparkles } from '@react-three/drei';
import { createTransitionSequence, type TransitionName } from '../../assets3d/transitionSequence';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

interface TransitionExperienceProps {
  onComplete: () => void;
}

export const TransitionExperience: React.FC<TransitionExperienceProps> = ({
  onComplete,
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const sequenceRef = useRef<ReturnType<typeof createTransitionSequence>>(undefined);

  // Load transition GLBs
  const frierenGltf = useGLTF('/models/transition/frieren.glb') as unknown as GLTF;
  const himmelGltf = useGLTF('/models/transition/himmel.glb') as unknown as GLTF;
  const heiterGltf = useGLTF('/models/transition/heiter.glb') as unknown as GLTF;
  const eisenGltf = useGLTF('/models/transition/eisen.glb') as unknown as GLTF;
  const magicGltf = useGLTF('/models/transition/frieren-magic.glb') as unknown as GLTF;

  useEffect(() => {
    const characters: Record<TransitionName, GLTF> = {
      Frieren: frierenGltf,
      Himmel: himmelGltf,
      Heiter: heiterGltf,
      Eisen: eisenGltf,
    };

    const seq = createTransitionSequence(characters, magicGltf);
    sequenceRef.current = seq;

    if (groupRef.current) {
      groupRef.current.add(seq.group);
    }

    return () => {
      seq.dispose();
      sequenceRef.current = undefined;
    };
  }, [frierenGltf, himmelGltf, heiterGltf, eisenGltf, magicGltf]);

  useFrame((_, delta) => {
    const seq = sequenceRef.current;
    if (!seq) return;

    seq.update(delta);
    const t = seq.time;

    // Cinematic camera choreography matching the characters' leap
    if (t < 1.4) {
      // Leap preparation & push off island
      const u = t / 1.4;
      camera.position.lerp(new THREE.Vector3(2.8, 6.2, 4.0), u * 0.1);
      camera.lookAt(new THREE.Vector3(0, 4.8, 1.2));
    } else if (t < 5.2) {
      // Airborne freefall following them through the night sky
      const targetCam = new THREE.Vector3(2.2, 3.8, 8.5);
      camera.position.lerp(targetCam, Math.min(delta * 2.5, 0.2));
      camera.lookAt(new THREE.Vector3(0, 2.5, 3.5));
    } else if (t < 8.0) {
      // Frieren magic glyph deployment & deceleration
      const targetCam = new THREE.Vector3(0.5, 2.2, 11.2);
      camera.position.lerp(targetCam, Math.min(delta * 3.2, 0.25));
      camera.lookAt(new THREE.Vector3(0, 1.5, 5.5));
    } else if (t < 9.1) {
      // Soft landing & glide to Project Universe viewpoint
      const finalCam = new THREE.Vector3(0, 2.8, 14.0);
      camera.position.lerp(finalCam, Math.min(delta * 4.0, 0.25));
      camera.lookAt(new THREE.Vector3(0, 2.0, 0));
    } else {
      // Transition finished
      onComplete();
    }
  });

  return (
    <group ref={groupRef} name="CinematicTransitionRoot">
      {/* Deep Space Background Atmosphere */}
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#04050a', 20, 80]} />

      {/* Brilliant Cosmic Starfield */}
      <Stars radius={250} depth={60} count={1800} factor={4.5} saturation={0.9} fade speed={1.5} />

      {/* Floating Magic Dust Particles */}
      <Sparkles count={60} scale={[20, 14, 20]} size={3.0} speed={0.4} color="#cdb8ff" opacity={0.65} />

      {/* Night Key Light */}
      <directionalLight position={[8, 16, 10]} intensity={1.2} color="#a6c5ff" />
      <ambientLight intensity={0.5} color="#1e2540" />
      <directionalLight position={[-8, 6, -8]} intensity={1.0} color="#818cf8" />
    </group>
  );
};
