import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../partyMaterials';
import { ModelErrorBoundary } from '../ModelErrorBoundary';

useGLTF.preload('/models/transition/himmel.glb');
useGLTF.preload('/models/transition/frieren.glb');
useGLTF.preload('/models/blue-flower-garden/flowers/flower-wreath.glb');

const CharactersMesh: React.FC = () => {
  const himmelGltf = useGLTF('/models/transition/himmel.glb');
  const frierenGltf = useGLTF('/models/transition/frieren.glb');
  const wreathGltf = useGLTF('/models/blue-flower-garden/flowers/flower-wreath.glb');

  const himmelGroupRef = useRef<THREE.Group>(null);
  const frierenGroupRef = useRef<THREE.Group>(null);
  const himmelMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const frierenMixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Staging Himmel: [-0.48, 0.42, 0.12], yaw +0.15
  useEffect(() => {
    if (!himmelGroupRef.current) return;
    const character = cloneSkeleton(himmelGltf.scene);
    const root = character.getObjectByName('Himmel') || character;

    root.position.set(-0.48, 0.42, 0.12);
    root.rotation.set(0, 0.15, 0);
    root.scale.set(1.0, 1.0, 1.0);

    const palette = createPartyPalette();
    const dressed = palette.dress(root);

    const mixer = new THREE.AnimationMixer(root);
    const clip =
      himmelGltf.animations.find((c) => c.name === 'himmel_idle') ||
      himmelGltf.animations[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }
    himmelMixerRef.current = mixer;

    // Attach Himmel flower wreath
    if (wreathGltf) {
      const wreath = wreathGltf.scene.clone(true);
      wreath.name = 'flower-wreath-himmel';
      wreath.position.set(-0.24, 0.76, 0.35);
      wreath.scale.set(0.85, 0.85, 0.85);
      wreath.rotation.set(0.35, 0.15, -0.2);
      character.add(wreath);
    }

    himmelGroupRef.current.add(character);

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      himmelMixerRef.current = null;
      dressed?.dispose();
      palette.dispose();
      character.removeFromParent();
    };
  }, [himmelGltf, wreathGltf]);

  // Staging Frieren: [0.48, 0.40, 0.08], yaw -0.15
  useEffect(() => {
    if (!frierenGroupRef.current) return;
    const character = cloneSkeleton(frierenGltf.scene);
    const root = character.getObjectByName('Frieren') || character;

    root.position.set(0.48, 0.40, 0.08);
    root.rotation.set(0, -0.15, 0);
    root.scale.set(1.0, 1.0, 1.0);

    const palette = createPartyPalette();
    const dressed = palette.dress(root);

    const mixer = new THREE.AnimationMixer(root);
    const clip =
      frierenGltf.animations.find((c) => c.name === 'frieren_idle') ||
      frierenGltf.animations[0];
    if (clip) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }
    frierenMixerRef.current = mixer;

    // Attach Frieren flower wreath
    if (wreathGltf) {
      const wreath = wreathGltf.scene.clone(true);
      wreath.name = 'flower-wreath-frieren';
      wreath.position.set(0.26, 0.72, 0.32);
      wreath.scale.set(0.8, 0.8, 0.8);
      wreath.rotation.set(0.35, -0.15, 0.2);
      character.add(wreath);
    }

    frierenGroupRef.current.add(character);

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      frierenMixerRef.current = null;
      dressed?.dispose();
      palette.dispose();
      character.removeFromParent();
    };
  }, [frierenGltf, wreathGltf]);

  useFrame((_, delta) => {
    const clamped = Math.min(delta, 0.05);
    if (himmelMixerRef.current) himmelMixerRef.current.update(clamped);
    if (frierenMixerRef.current) frierenMixerRef.current.update(clamped);
  });

  return (
    <group name="GardenPartyCharactersRoot">
      <group ref={himmelGroupRef} name="HimmelRoot" />
      <group ref={frierenGroupRef} name="FrierenRoot" />
    </group>
  );
};

export const GardenPartyCharacters: React.FC = () => {
  return (
    <ModelErrorBoundary fallback={null}>
      <CharactersMesh />
    </ModelErrorBoundary>
  );
};

