import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyLife } from './partyLife';
import { members } from './partySchedule';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PlaceholderIsland } from './PlaceholderIsland';

export interface EnvironmentLoaderProps {
  active?: boolean;
  modelPath?: string;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onStatusChange?: (status: 'checking' | 'loading' | 'loaded' | 'fallback') => void;
}

/**
 * Finds the meaningful named object by walking up the hierarchy
 * (ignores generic default names like Scene, Object_2, etc. when possible)
 */
function getInteractiveName(target: THREE.Object3D): string {
  let curr: THREE.Object3D | null = target;
  while (curr) {
    if (curr.userData.interactionTarget && curr.name) return curr.name;
    curr = curr.parent;
  }
  curr = target;
  while (curr) {
    if (curr.name && curr.name !== 'Scene' && curr.name !== '') {
      return curr.name;
    }
    curr = curr.parent;
  }
  return target.name || 'unnamed_object';
}

/**
 * Actual GLTF Loader component loaded within Suspense & ModelErrorBoundary
 */
const ModelScene: React.FC<{
  active: boolean;
  path: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onLoaded?: () => void;
}> = ({
  active,
  path,
  position,
  scale,
  rotation,
  onSelectObject,
  onHoverObject,
  onLoaded,
}) => {
  const gltf = useGLTF(path);
  const moving = !useReducedMotion() && active;

  // Clone scene so multiple instances don't mutate the cached GLTF
  const clonedScene = useMemo(() => {
    const clone = cloneSkeleton(gltf.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child instanceof THREE.SkinnedMesh && child.parent?.userData.partyMember) {
        // Include the raised staff and the full axe swing in picking and culling.
        child.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.8, 0), 1.75);
      }
    });
    return clone;
  }, [gltf.scene]);

  const world = useThree(state => state.scene);
  const party = useRef<ReturnType<typeof createPartyLife>>(undefined);
  useEffect(() => {
    party.current = createPartyLife(clonedScene, world, gltf.animations);
    return () => {
      party.current?.dispose();
      party.current = undefined;
    };
  }, [clonedScene, world, gltf.animations]);
  const flames = useMemo(() => [1, 2, 3].flatMap(index => {
    const node = clonedScene.getObjectByName('HearthFlame' + index);
    return node ? [{ node, rest: node.rotation.z, phase: index * 0.8 }] : [];
  }), [clonedScene]);
  const windTime = useRef(0);
  useFrame((_, delta) => {
    if (!moving) return;
    const step = Math.min(delta, 0.1);
    party.current?.update(step);
    windTime.current += step;
    // The GLB animates flame height. A shared gust bends the tips in sequence.
    for (const { node, rest, phase } of flames) {
      node.rotation.z = rest + 0.10 * Math.sin(windTime.current * 2.3 + phase)
        + 0.035 * Math.sin(windTime.current * 5.7 + phase);
    }
  });

  const ambientClips = useMemo(() => gltf.animations.filter(clip =>
    !members.some(name => clonedScene.getObjectByName(name)?.userData.partyMember && clip.name.startsWith(name + '_'))
  ), [gltf.animations, clonedScene]);
  const { actions, mixer } = useAnimations(ambientClips, clonedScene);
  useEffect(() => {
    mixer.timeScale = moving ? 1 : 0;
  }, [mixer, moving]);
  useEffect(() => {
    const loops = Object.values(actions).filter(action => action !== null);
    loops.forEach(action => action.reset().play());
    return () => loops.forEach(action => action.stop());
  }, [actions]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const name = getInteractiveName(e.object);
    onHoverObject?.(name);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHoverObject?.(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const name = getInteractiveName(e.object);
    onSelectObject?.(name, e.point);
  };

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={scale}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
};

// Module-level cache so verified models never flash placeholder on remount
const modelAvailabilityCache: Record<string, boolean> = {
  '/models/home-island.glb': true,
};

/**
 * Reusable EnvironmentLoader:
 * - Checks model availability first to prevent unhandled 404 network crashes
 * - Falls back cleanly to PlaceholderIsland if file is missing or corrupted
 * - Supports position, scale, rotation and interactive object events
 */
export const EnvironmentLoader: React.FC<EnvironmentLoaderProps> = ({
  active = true,
  modelPath = SCENE_CONFIG.modelPath,
  position = SCENE_CONFIG.modelTransform.position,
  scale = SCENE_CONFIG.modelTransform.scale,
  rotation = SCENE_CONFIG.modelTransform.rotation,
  onSelectObject,
  onHoverObject,
  onStatusChange,
}) => {
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(
    modelAvailabilityCache[modelPath] ?? true
  );

  useEffect(() => {
    let isCancelled = false;
    onStatusChange?.('checking');

    // Probe model URL with a lightweight fetch to check if the file is in public/
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (isCancelled) return;
        // Verify response is successful and not an HTML SPA fallback (404 returning index.html)
        const contentType = res.headers.get('content-type') || '';
        const isOk = res.ok && !contentType.includes('text/html');
        modelAvailabilityCache[modelPath] = isOk;
        setModelAvailable(isOk);
        onStatusChange?.(isOk ? 'loading' : 'fallback');
      })
      .catch(() => {
        if (!isCancelled) {
          modelAvailabilityCache[modelPath] = false;
          setModelAvailable(false);
          onStatusChange?.('fallback');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [modelPath, onStatusChange]);

  const fallbackPlaceholder = (
    <PlaceholderIsland
      position={position}
      scale={scale}
      onSelectObject={onSelectObject}
      onHoverObject={onHoverObject}
    />
  );

  // If check in progress or file not available, show placeholder
  if (modelAvailable === null || !modelAvailable) {
    return fallbackPlaceholder;
  }

  return (
    <ModelErrorBoundary
      fallback={fallbackPlaceholder}
      onError={() => onStatusChange?.('fallback')}
    >
      <Suspense fallback={fallbackPlaceholder}>
        <ModelScene
          active={active}
          path={modelPath}
          position={position}
          scale={scale}
          rotation={rotation}
          onSelectObject={onSelectObject}
          onHoverObject={onHoverObject}
          onLoaded={() => onStatusChange?.('loaded')}
        />
      </Suspense>
    </ModelErrorBoundary>
  );
};
