import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

export interface SceneReadyState {
  isReady: boolean;
  progress: number;
  markCompiled: () => void;
}

/**
 * useSceneReady
 *
 * Centralized Asset-Readiness Gate:
 * 1. Tracks every Three.js asset load (GLTF, textures, HDR) via THREE.DefaultLoadingManager
 * 2. Awaits document.fonts.ready for pristine typography rendering
 * 3. Awaits renderer.compile(scene, camera) shader/geometry warmup pass to eliminate frame drops
 * 4. Locks document scroll (overflow: hidden) while isReady === false
 */
export function useSceneReady(): SceneReadyState {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const assetsLoadedRef = useRef(false);
  const fontsLoadedRef = useRef(false);
  const compiledRef = useRef(false);
  const timerFiredRef = useRef(false);

  // Check if all readiness conditions are satisfied
  const checkReadiness = useCallback(() => {
    if (timerFiredRef.current) return;

    const assetsDone = assetsLoadedRef.current;
    const fontsDone = fontsLoadedRef.current;
    const compiledDone = compiledRef.current;

    if (assetsDone && fontsDone && compiledDone) {
      timerFiredRef.current = true;
      setProgress(100);
      setIsReady(true);
    }
  }, []);

  // Callback to signal single WebGL compile warm-up pass completion
  const markCompiled = useCallback(() => {
    if (!compiledRef.current) {
      compiledRef.current = true;
      checkReadiness();
    }
  }, [checkReadiness]);

  useEffect(() => {
    // 1. Lock document scrolling while assets initialize
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 2. Track fonts readiness
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready
        .then(() => {
          fontsLoadedRef.current = true;
          checkReadiness();
        })
        .catch(() => {
          fontsLoadedRef.current = true;
          checkReadiness();
        });
    } else {
      fontsLoadedRef.current = true;
    }

    // 3. Track THREE.DefaultLoadingManager
    const prevOnStart = THREE.DefaultLoadingManager.onStart;
    const prevOnProgress = THREE.DefaultLoadingManager.onProgress;
    const prevOnLoad = THREE.DefaultLoadingManager.onLoad;
    const prevOnError = THREE.DefaultLoadingManager.onError;

    THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
      assetsLoadedRef.current = false;
      if (prevOnStart) prevOnStart(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
      if (total > 0) {
        const pct = Math.round((loaded / total) * 100);
        setProgress((prev) => Math.max(prev, pct));
      }
      if (prevOnProgress) prevOnProgress(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      assetsLoadedRef.current = true;
      setProgress(100);
      checkReadiness();
      if (prevOnLoad) prevOnLoad();
    };

    THREE.DefaultLoadingManager.onError = (url) => {
      console.warn(`[Three.js Loader] Error loading asset: ${url}`);
      if (prevOnError) prevOnError(url);
    };

    // If no assets were queued or assets already cached, mark ready
    const immediateCheckTimer = setTimeout(() => {
      assetsLoadedRef.current = true;
      checkReadiness();
    }, 700);

    // 4. Safety fallback timeout: prevent permanently stuck preloader
    const safetyTimeout = setTimeout(() => {
      if (!timerFiredRef.current) {
        assetsLoadedRef.current = true;
        fontsLoadedRef.current = true;
        compiledRef.current = true;
        timerFiredRef.current = true;
        setProgress(100);
        setIsReady(true);
      }
    }, 4500);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(immediateCheckTimer);
      clearTimeout(safetyTimeout);
      THREE.DefaultLoadingManager.onStart = prevOnStart;
      THREE.DefaultLoadingManager.onProgress = prevOnProgress;
      THREE.DefaultLoadingManager.onLoad = prevOnLoad;
      THREE.DefaultLoadingManager.onError = prevOnError;
    };
  }, [checkReadiness]);

  // Restore scroll once isReady is true
  useEffect(() => {
    if (isReady) {
      document.body.style.overflow = '';
    }
  }, [isReady]);

  return {
    isReady,
    progress,
    markCompiled,
  };
}
