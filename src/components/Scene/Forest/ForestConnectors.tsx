import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ModelErrorBoundary } from '../ModelErrorBoundary';
import { FOREST_CONNECTOR_FILES } from '../../../assets3d/forestAssets';

// Preload all 20 Connector & Detail modules
FOREST_CONNECTOR_FILES.forEach((file) => {
  useGLTF.preload(`/models/whispering-forest/${file}`);
});

interface ConnectorInstanceProps {
  name?: string;
  file: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

const ConnectorInstance: React.FC<ConnectorInstanceProps> = ({
  name,
  file,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  const gltf = useGLTF(`/models/whispering-forest/${file}`);

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
        child.castShadow = false;
      }
    });
    return clone;
  }, [gltf.scene]);

  const nodeName = name || file.replace('.glb', '');

  return (
    <group
      name={nodeName}
      position={position}
      rotation={rotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      <primitive object={scene} />
    </group>
  );
};

/**
 * ForestConnectors
 * Integrates all 20 connector & detail modules into Level 03:
 * - Grand Ceremonial Entrance Gateway at the arrival threshold
 * - Natural Stone & Wooden Bridges spanning the stream and pond
 * - Stepping stones across the water ripple path
 * - Elevated scenic canopy lookouts, spiral stairs, and decorative lanterns/crystals/runestones
 */
export const ForestConnectors: React.FC = () => {
  return (
    <group name="ForestConnectorsRoot">
      <ModelErrorBoundary fallback={null}>
        {/* 1. CEREMONIAL ARRIVAL GATEWAY (At ForestArrivalAnchor [0.8, 0.2, 6.3]) */}
        <Suspense fallback={null}>
          {/* Floating Decorative Arrival Landing where floating stairs meet island */}
          <ConnectorInstance name="platform-decorative" file="platform-decorative.glb" position={[0.8, 0.0, 7.8]} />

          {/* Fantasy Pointed Arch over entrance threshold */}
          <ConnectorInstance name="detail-arch" file="detail-arch.glb" position={[0.8, 0.1, 6.8]} />

          {/* Flanking Gateway Pillars */}
          <ConnectorInstance name="detail-pillar-1" file="detail-pillar.glb" position={[-0.65, 0.1, 6.8]} />
          <ConnectorInstance name="detail-pillar-2" file="detail-pillar.glb" position={[2.25, 0.1, 6.8]} />

          {/* Entrance Welcome Lanterns */}
          <ConnectorInstance name="detail-lantern-1" file="detail-lantern.glb" position={[-0.65, 0.0, 7.8]} />
          <ConnectorInstance name="detail-lantern-2" file="detail-lantern.glb" position={[2.25, 0.0, 7.8]} />

          {/* Ancient Runestone with Glowing Inscription */}
          <ConnectorInstance name="detail-runestone" file="detail-runestone.glb" position={[-0.95, 0.1, 6.8]} rotation={[0, 0.35, 0]} />

          {/* Emissive Forest Crystal Cluster */}
          <ConnectorInstance name="detail-crystal-light" file="detail-crystal-light.glb" position={[2.55, 0.1, 6.8]} rotation={[0, -0.4, 0]} />
        </Suspense>

        {/* 2. ENCHANTED POND & STREAM CONNECTIONS */}
        <Suspense fallback={null}>
          {/* Stone Bridge spanning stream */}
          <ConnectorInstance name="bridge-stone" file="bridge-stone.glb" position={[-3.0, 0.18, 3.8]} rotation={[0, 0.45, 0]} />

          {/* Wooden Bridge crossing pond outlet */}
          <ConnectorInstance name="bridge-wooden" file="bridge-wooden.glb" position={[2.2, 0.35, -1.0]} rotation={[0, -0.6, 0]} />

          {/* Curved Bridge following the water embankment */}
          <ConnectorInstance name="bridge-curved" file="bridge-curved.glb" position={[-4.5, 0.22, -1.2]} rotation={[0, 1.2, 0]} />

          {/* Stepping Stones across the shallow water ripple path */}
          <ConnectorInstance name="stepping-stone-1" file="stepping-stone.glb" position={[-2.0, 0.13, 2.0]} />
          <ConnectorInstance name="stepping-stone-2" file="stepping-stone.glb" position={[-1.4, 0.13, 1.6]} />
          <ConnectorInstance name="stepping-stone-3" file="stepping-stone.glb" position={[-0.8, 0.13, 1.2]} />
        </Suspense>

        {/* 3. ANCIENT TREE CANOPY OBSERVATION DECK & STAIRWAYS */}
        <Suspense fallback={null}>
          {/* Grand Ceremonial Stairs leading up eastern terrace toward the ancient tree */}
          <ConnectorInstance name="stairs-ceremonial" file="stairs-ceremonial.glb" position={[4.8, 0.22, 0.5]} rotation={[0, -0.4, 0]} />

          {/* Straight stair up the mossy slope */}
          <ConnectorInstance name="stairs-straight" file="stairs-straight.glb" position={[3.5, 0.45, -2.5]} rotation={[0, -0.3, 0]} />

          {/* Full-turn Spiral Staircase ascending to high canopy lookout */}
          <ConnectorInstance name="stairs-spiral" file="stairs-spiral.glb" position={[5.8, 0.38, -4.6]} />

          {/* Large Panoramic Observation Platform at top of spiral stair */}
          <ConnectorInstance name="platform-large" file="platform-large.glb" position={[5.8, 4.70, -4.6]} />

          {/* Railing protecting the observation deck */}
          <ConnectorInstance name="detail-railing" file="detail-railing.glb" position={[5.8, 4.72, -3.2]} />

          {/* Curved Stair leading around the back trunk */}
          <ConnectorInstance name="stairs-curved" file="stairs-curved.glb" position={[-1.6, 0.32, -3.8]} rotation={[0, -1.1, 0]} />

          {/* Narrow Planked Walkway along the root terrace */}
          <ConnectorInstance name="walkway-narrow" file="walkway-narrow.glb" position={[-4.8, 0.28, -1.6]} rotation={[0, 0.8, 0]} />

          {/* Small 3-step elevation transition to Heiter's haven */}
          <ConnectorInstance name="stairs-small" file="stairs-small.glb" position={[-5.3, 0.22, 0.1]} rotation={[0, 0.2, 0]} />

          {/* Medium and small scenic landings */}
          <ConnectorInstance name="platform-medium" file="platform-medium.glb" position={[-7.2, 0.22, 1.8]} />
          <ConnectorInstance name="platform-small" file="platform-small.glb" position={[4.2, 0.32, 3.4]} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
};
