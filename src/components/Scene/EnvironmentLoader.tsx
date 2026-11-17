import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyLife } from './partyLife';
import { members } from './partySchedule';
import { SCENE_CONFIG } from '../../config/sceneConfig';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { PlaceholderIsland } from './PlaceholderIsland';

export interface EnvironmentLoaderProps {
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
  path: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  onSelectObject?: (name: string, point?: THREE.Vector3) => void;
  onHoverObject?: (name: string | null) => void;
  onLoaded?: () => void;
}> = ({
  path,
  position,
  scale,
  rotation,
  onSelectObject,
  onHoverObject,
  onLoaded,
}) => {
  const gltf = useGLTF(path);

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
  useFrame((_, delta) => party.current?.update(Math.min(delta, .10)));

  const ambientClips = useMemo(() => gltf.animations.filter(clip =>
    !members.some(name => clonedScene.getObjectByName(name)?.userData.partyMember && clip.name.startsWith(name + '_'))
  ), [gltf.animations, clonedScene]);
  const { actions } = useAnimations(ambientClips, clonedScene);
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

/**
 * Reusable EnvironmentLoader:
 * - Checks model availability first to prevent unhandled 404 network crashes
 * - Falls back cleanly to PlaceholderIsland if file is missing or corrupted
 * - Supports position, scale, rotation and interactive object events
 */
export const EnvironmentLoader: React.FC<EnvironmentLoaderProps> = ({
  modelPath = SCENE_CONFIG.modelPath,
  position = SCENE_CONFIG.modelTransform.position,
  scale = SCENE_CONFIG.modelTransform.scale,
  rotation = SCENE_CONFIG.modelTransform.rotation,
  onSelectObject,
  onHoverObject,
  onStatusChange,
}) => {
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);

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
        setModelAvailable(isOk);
        onStatusChange?.(isOk ? 'loading' : 'fallback');
      })
      .catch(() => {
        if (!isCancelled) {
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
