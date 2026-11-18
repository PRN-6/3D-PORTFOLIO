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
  const completedRef = useRef(false);

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
    if (!seq || completedRef.current) return;

    seq.update(delta * 1.1);
    const t = seq.time;

    // Follow the characters as they leap off the island into the sky
    if (t < 0.6) {
      // Crouch and push off
      camera.position.lerp(new THREE.Vector3(2.5, 6.2, 4.2), delta * 3.0);
      camera.lookAt(new THREE.Vector3(0, 5.0, 1.2));
    } else if (t < 1.7) {
      // Leap forward and upward into the night sky
      camera.position.lerp(new THREE.Vector3(1.8, 4.8, 6.5), delta * 4.0);
      camera.lookAt(new THREE.Vector3(0, 3.8, 3.5));
    } else {
      // Transition smoothly into Project Universe where they enter from above!
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef} name="CinematicTransitionRoot">
      {/* Night Sky Background */}
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#04050a', 20, 80]} />

      {/* Cosmic Stars */}
      <Stars radius={250} depth={60} count={1800} factor={4.5} saturation={0.9} fade speed={1.5} />

      {/* Bursting Starlight Particles */}
      <Sparkles count={55} scale={[18, 12, 18]} size={3.0} speed={0.5} color="#cdb8ff" opacity={0.7} />

      {/* Lighting */}
      <directionalLight position={[8, 16, 10]} intensity={1.3} color="#a6c5ff" />
      <ambientLight intensity={0.5} color="#1e2540" />
      <directionalLight position={[-8, 6, -8]} intensity={1.1} color="#818cf8" />
    </group>
  );
};
