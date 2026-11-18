import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { PROJECTS_DATA, type ProjectItem } from '../../data/projectsData';
import { createPartyPalette } from './partyMaterials';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export interface WorldERuneWorkshopProps {
  disableCamera?: boolean;
  onSelectProject?: (project: ProjectItem) => void;
  selectedProject?: ProjectItem | null;
}

// ---------------------------------------------------------------------------
// Preload Assets
// ---------------------------------------------------------------------------
const WORKSHOP_MODELS = [
  'island/workshop-island.glb',
  'architecture/rune-workshop.glb',
  'workshop/rune-crafting-table.glb',
  'workshop/shelves-and-benches.glb',
  'workshop/crafting-tools.glb',
  'magical-objects/arcane-rings.glb',
  'magical-objects/rune-symbol.glb',
  'magical-objects/rune-floor-circle.glb',
  'magical-objects/crystal-cluster.glb',
  'magical-objects/enchanted-scroll.glb',
  'magical-objects/floating-tome.glb',
  'magical-objects/decorative-artifacts.glb',
  'magical-objects/workshop-motes.glb',
  'decorations/enchanted-lamp.glb',
  'decorations/island-landscaping.glb',
  'project-displays/station-01.glb',
  'project-displays/station-02.glb',
  'project-displays/station-03.glb',
  'project-displays/station-04.glb',
  'project-displays/station-05.glb',
];

WORKSHOP_MODELS.forEach((path) => {
  useGLTF.preload(`/models/rune-workshop/${path}`);
});
useGLTF.preload('/models/transition/eisen.glb');
useGLTF.preload('/models/home-island.glb');

// ---------------------------------------------------------------------------
// Modular Workshop Object
// ---------------------------------------------------------------------------
const WorkshopModule: React.FC<{
  file: string;
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}> = ({ file, name, position, rotation = [0, 0, 0], scale = 1 }) => {
  const gltf = useGLTF(`/models/rune-workshop/${file}`);
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    return cloned;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const active = Object.values(actions).filter((a): a is THREE.AnimationAction => a !== null);
    active.forEach((a) => a.reset().fadeIn(0.2).play());
    return () => {
      active.forEach((a) => a.fadeOut(0.2));
    };
  }, [actions]);

  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group ref={groupRef} name={name} position={position} rotation={rotation} scale={s as [number, number, number]}>
      <primitive object={scene} />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Interactive Project Station
// ---------------------------------------------------------------------------
const ProjectStation: React.FC<{
  stationIndex: number;
  file: string;
  position: [number, number, number];
  project: ProjectItem;
  onSelectProject?: (p: ProjectItem) => void;
}> = ({ stationIndex, file, position, project, onSelectProject }) => {
  const gltf = useGLTF(`/models/rune-workshop/${file}`);
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    return cloned;
  }, [gltf.scene]);

  const { actions } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    const active = Object.values(actions).filter((a): a is THREE.AnimationAction => a !== null);
    active.forEach((a) => a.reset().play());
  }, [actions]);

  return (
    <group
      ref={groupRef}
      name={`station-0${stationIndex}`}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectProject) onSelectProject(project);
      }}
    >
      <primitive object={scene} />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Preserved Eisen Model at Crafting Station
// ---------------------------------------------------------------------------
const WorkshopEisen: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const eisenGltf = useGLTF('/models/transition/eisen.glb');
  const homeIslandGltf = useGLTF('/models/home-island.glb');

  const { clonedRoot, dressed } = useMemo(() => {
    const clone = cloneSkeleton(eisenGltf.scene);
    const root = clone.getObjectByName('Eisen') || clone;

    // Restore rest pose
    root.traverse((node) => {
      const original = homeIslandGltf.scene.getObjectByName(node.name);
      if (original && (node as THREE.Bone).isBone) {
        node.position.copy(original.position);
        node.quaternion.copy(original.quaternion);
        node.scale.copy(original.scale);
      }
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    const palette = createPartyPalette();
    const dressed = palette.dress(root);

    return { clonedRoot: clone, dressed };
  }, [eisenGltf.scene, homeIslandGltf.scene]);

  useEffect(() => {
    if (!clonedRoot) return;
    const mixer = new THREE.AnimationMixer(clonedRoot);
    mixerRef.current = mixer;

    const clip =
      homeIslandGltf.animations.find((c) => c.name.toLowerCase().includes('eisen')) ||
      eisenGltf.animations[0];

    if (clip) {
      mixer.clipAction(clip).fadeIn(0.3).play();
    }

    return () => {
      mixer.stopAllAction();
      dressed?.dispose();
    };
  }, [clonedRoot, homeIslandGltf.animations, eisenGltf.animations, dressed]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  return (
    <group
      ref={groupRef}
      name="EisenContainer"
      position={[-1.5, 0.39, 0.55]}
      rotation={[0, 0.28, 0]}
    >
      <primitive object={clonedRoot} />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Master World E Component
// ---------------------------------------------------------------------------
export const WorldE_RuneWorkshop: React.FC<WorldERuneWorkshopProps> = ({
  disableCamera: _disableCamera = false,
  onSelectProject,
}) => {
  return (
    <group name="WorldE_RuneWorkshopRoot" position={[0, 0, 0]}>
      {/* Lighting Scheme verified from preview.js */}
      <directionalLight position={[-7, 12, 12]} intensity={2.0} color="#d2d6f1" castShadow />
      <hemisphereLight args={['#c5c8e6', '#343340', 1.2]} />
      <directionalLight position={[9, 7, -6]} intensity={1.4} color="#a6a0e3" />
      <directionalLight position={[0, -5, 8]} intensity={0.6} color="#818ebd" />

      {/* Warm Table & Forge Glow */}
      <pointLight position={[0.55, 1.8, -0.5]} color="#38bdf8" intensity={2.6} distance={7} decay={2} />
      <pointLight position={[0, 2.5, -3.5]} color="#f59e0b" intensity={2.2} distance={8} decay={2} />
      <pointLight position={[-7, 1.8, 3.7]} color="#fbbf24" intensity={1.5} distance={5} decay={2} />
      <pointLight position={[7, 1.8, 3.7]} color="#fbbf24" intensity={1.5} distance={5} decay={2} />

      <ModelErrorBoundary fallback={null}>
        {/* Island Base Terrain */}
        <WorkshopModule file="island/workshop-island.glb" name="workshop-island" position={[0, 0, 0]} />

        {/* Architecture Pavilion */}
        <WorkshopModule file="architecture/rune-workshop.glb" name="rune-workshop" position={[0, 0.2, -0.6]} />

        {/* Furnishings */}
        <WorkshopModule file="workshop/rune-crafting-table.glb" name="rune-crafting-table" position={[0.55, 0.39, -0.5]} />
        <WorkshopModule file="workshop/shelves-and-benches.glb" name="shelves-and-benches" position={[0, 0.39, -0.6]} />
        <WorkshopModule file="workshop/crafting-tools.glb" name="crafting-tools" position={[3.45, 1.34, -2.9]} />

        {/* Arcane Objects */}
        <WorkshopModule file="magical-objects/arcane-rings.glb" name="arcane-rings" position={[0.55, 2.25, -0.5]} scale={0.7} />
        <WorkshopModule file="magical-objects/rune-symbol.glb" name="rune-symbol" position={[0, 3.85, -3.5]} />
        <WorkshopModule file="magical-objects/rune-floor-circle.glb" name="rune-floor-circle" position={[0.55, 0.415, -0.5]} />
        <WorkshopModule file="magical-objects/enchanted-scroll.glb" name="enchanted-scroll" position={[-3.2, 2.1, -2.9]} rotation={[0.16, 0, 0.1]} />
        <WorkshopModule file="magical-objects/floating-tome.glb" name="floating-tome" position={[3.55, 2.25, -2.8]} rotation={[0.2, 0, -0.1]} />
        <WorkshopModule file="magical-objects/decorative-artifacts.glb" name="decorative-artifacts" position={[-4.5, 1.34, -2.9]} />
        <WorkshopModule file="magical-objects/workshop-motes.glb" name="workshop-motes" position={[0, 0, 0]} />

        {/* Crystals & Decorations */}
        <WorkshopModule file="magical-objects/crystal-cluster.glb" name="crystal-cluster" position={[-6.9, 0.2, -1.8]} />
        <WorkshopModule file="magical-objects/crystal-cluster.glb" name="crystal-cluster-2" position={[6.9, 0.2, -2.1]} />
        <WorkshopModule file="decorations/enchanted-lamp.glb" name="enchanted-lamp" position={[-7, 0.2, 3.7]} />
        <WorkshopModule file="decorations/enchanted-lamp.glb" name="enchanted-lamp-2" position={[7, 0.2, 3.7]} />
        <WorkshopModule file="decorations/island-landscaping.glb" name="island-landscaping" position={[0, 0, 0]} />

        {/* Five Interactive Project Display Stations */}
        <ProjectStation
          stationIndex={1}
          file="project-displays/station-01.glb"
          position={[-6.4, 0.2, 1.55]}
          project={PROJECTS_DATA[0]}
          onSelectProject={onSelectProject}
        />
        <ProjectStation
          stationIndex={2}
          file="project-displays/station-02.glb"
          position={[-3.6, 0.2, 4.1]}
          project={PROJECTS_DATA[1]}
          onSelectProject={onSelectProject}
        />
        <ProjectStation
          stationIndex={3}
          file="project-displays/station-03.glb"
          position={[0, 0.2, 5.15]}
          project={PROJECTS_DATA[2]}
          onSelectProject={onSelectProject}
        />
        <ProjectStation
          stationIndex={4}
          file="project-displays/station-04.glb"
          position={[3.6, 0.2, 4.1]}
          project={PROJECTS_DATA[3]}
          onSelectProject={onSelectProject}
        />
        <ProjectStation
          stationIndex={5}
          file="project-displays/station-05.glb"
          position={[6.4, 0.2, 1.55]}
          project={PROJECTS_DATA[4]}
          onSelectProject={onSelectProject}
        />

        {/* Preserved Eisen Character */}
        <WorkshopEisen />
      </ModelErrorBoundary>
    </group>
  );
};
