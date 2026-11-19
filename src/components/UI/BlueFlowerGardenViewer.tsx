import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { createPartyPalette } from '../Scene/partyMaterials';
import { Sparkles, Eye, Compass, Heart, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

export type GardenCameraPreset = 'hero' | 'closeup' | 'overview' | 'underside';

interface CameraPresetConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  label: string;
}

const PRESETS: Record<GardenCameraPreset, CameraPresetConfig> = {
  hero: {
    name: 'Hero View',
    icon: Sparkles,
    pos: [0, 1.35, 4.2],
    target: [0, 0.85, 0],
    fov: 40,
    label: 'Himmel & Frieren',
  },
  closeup: {
    name: 'Close-up',
    icon: Heart,
    pos: [0, 1.15, 2.3],
    target: [0, 0.95, 0.1],
    fov: 36,
    label: 'Intimate View',
  },
  overview: {
    name: 'Meadow Overview',
    icon: Compass,
    pos: [0, 7.5, 15.5],
    target: [0, 0.5, 0],
    fov: 38,
    label: 'Full Island',
  },
  underside: {
    name: 'Underside',
    icon: Eye,
    pos: [0, -6.5, 13.0],
    target: [0, -2.5, 0],
    fov: 40,
    label: 'Floating Rocks',
  },
};

// Global in-memory cache for parsed GLTF assets to avoid re-fetching across tab switches
const gltfPromiseCache = new Map<string, Promise<GLTF>>();
function loadCachedGLTF(loader: GLTFLoader, url: string): Promise<GLTF> {
  let promise = gltfPromiseCache.get(url);
  if (!promise) {
    promise = loader.loadAsync(url);
    gltfPromiseCache.set(url, promise);
  }
  return promise;
}

export const BlueFlowerGardenViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState('Conjuring the Eternal Meadow...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<GardenCameraPreset>('hero');

  // Animation & Control References for smooth preset transitions
  const targetCamPos = useRef(new THREE.Vector3(...PRESETS.hero.pos));
  const targetControlsTarget = useRef(new THREE.Vector3(...PRESETS.hero.target));
  const targetFov = useRef(PRESETS.hero.fov);
  const isTransitioningCamera = useRef(false);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Set Camera Preset with smooth damping
  const applyPreset = useCallback((key: GardenCameraPreset) => {
    setActivePreset(key);
    const p = PRESETS[key];
    if (!p) return;

    const isMobile = window.innerWidth < 640;
    // On mobile screens, back out slightly in hero view to preserve character staging
    const adjustedPos: [number, number, number] =
      isMobile && key === 'hero' ? [0, 1.45, 5.0] : p.pos;

    targetCamPos.current.set(...adjustedPos);
    targetControlsTarget.current.set(...p.target);
    targetFov.current = p.fov;
    isTransitioningCamera.current = true;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isDisposed = false;
    let animFrameId: number;
    const mixers: THREE.AnimationMixer[] = [];

    // 1. Scene & Render Engine Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#c2ddfc'); // Dreamy pastel blue sky

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = Math.max(rect.height, 280);

    const isMobile = window.innerWidth < 640;
    const initialPos: [number, number, number] = isMobile
      ? [0, 1.45, 5.0]
      : PRESETS.hero.pos;

    const camera = new THREE.PerspectiveCamera(PRESETS.hero.fov, width / height, 0.1, 150);
    camera.position.set(...initialPos);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (err) {
      console.error('WebGL initialization error in BlueFlowerGardenViewer:', err);
      setTimeout(() => {
        setErrorMessage('WebGL is not supported or encountered an error.');
        setIsLoading(false);
      }, 0);
      return;
    }

    // 2. Smooth OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(...PRESETS.hero.target);
    controls.minDistance = 1.8;
    controls.maxDistance = 18.0;
    controls.maxPolarAngle = Math.PI * 0.92; // Prevent getting stuck fully underneath
    controls.minPolarAngle = 0.15;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Detect user manual interaction to stop automated preset tweening
    controls.addEventListener('start', () => {
      isTransitioningCamera.current = false;
    });

    // 3. Dreamy Atmosphere Lighting (Matches Manifest & Art Direction)
    // Sunlight: Warm golden sunlight illuminating the flower petals
    const sunLight = new THREE.DirectionalLight('#fff5e4', 2.3);
    sunLight.position.set(-7.5, 14.0, 9.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Hemisphere: Sky blue to soft meadow grass green
    const hemiLight = new THREE.HemisphereLight('#d0e5fc', '#52855b', 1.4);
    scene.add(hemiLight);

    // Pink rim light: Backlight creating soft rim around characters and trees
    const pinkRim = new THREE.DirectionalLight('#fadcee', 1.6);
    pinkRim.position.set(9.5, 7.5, -11.0);
    scene.add(pinkRim);

    // Under-bounce: Sky blue bounce illuminating the underside crags and crystals
    const underBounce = new THREE.DirectionalLight('#8ec2fa', 0.8);
    underBounce.position.set(0, -6.5, 7.0);
    scene.add(underBounce);

    // Center floral glow: Soft ethereal bloom amidst the flowers
    const centerGlow = new THREE.PointLight('#aee2ff', 1.2, 8.0, 2);
    centerGlow.position.set(0, 1.2, 0.5);
    scene.add(centerGlow);

    // 4. Load Models & Setup Characters
    const loader = new GLTFLoader();

    async function loadGardenScene() {
      try {
        setLoadProgress('Gathering blue flowers & floating island...');
        
        // 4a. Master Scene (Pre-assembled Island, Meadows, Foliage, Clouds, Motes)
        const masterGltf = await loadCachedGLTF(loader, '/models/blue-flower-garden/blue-flower-garden-complete.glb');
        if (isDisposed) return;

        const gardenScene = masterGltf.scene.clone(true);
        gardenScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => (m.side = THREE.DoubleSide));
              } else {
                mesh.material.side = THREE.DoubleSide;
              }
            }
          }
        });
        scene.add(gardenScene);

        // If master scene contains animated petals/motes clips, attach mixer
        if (masterGltf.animations && masterGltf.animations.length > 0) {
          const gardenMixer = new THREE.AnimationMixer(gardenScene);
          masterGltf.animations.forEach((clip) => {
            gardenMixer.clipAction(clip).play();
          });
          mixers.push(gardenMixer);
        }

        // 4b. Load Himmel & Frieren Character Models
        setLoadProgress('Welcoming Himmel & Frieren...');
        const [himmelGltf, frierenGltf, wreathGltf] = await Promise.all([
          loadCachedGLTF(loader, '/models/transition/himmel.glb'),
          loadCachedGLTF(loader, '/models/transition/frieren.glb'),
          loadCachedGLTF(loader, '/models/blue-flower-garden/flowers/flower-wreath.glb').catch(() => null),
        ]);
        if (isDisposed) return;

        const partyPalette = createPartyPalette();

        // Staging Himmel: [-0.48, 0.42, 0.12], yaw +0.15
        const himmelCloned = cloneSkeleton(himmelGltf.scene);
        const himmelRoot = himmelCloned.getObjectByName('Himmel') || himmelCloned;
        himmelCloned.position.set(-0.48, 0.42, 0.12);
        himmelCloned.rotation.set(0, 0.15, 0);
        himmelCloned.scale.set(1.0, 1.0, 1.0);
        scene.add(himmelCloned);

        if (partyPalette && himmelRoot) {
          try {
            partyPalette.dress(himmelRoot);
          } catch (e) {
            console.warn('Cel-shading dress skipped for Himmel:', e);
          }
        }

        if (himmelGltf.animations && himmelGltf.animations.length > 0) {
          const himmelMixer = new THREE.AnimationMixer(himmelRoot);
          const himmelClip =
            himmelGltf.animations.find((c) => c.name === 'himmel_idle') ||
            himmelGltf.animations[0];
          if (himmelClip) {
            himmelMixer.clipAction(himmelClip).play();
            mixers.push(himmelMixer);
          }
        }

        // Staging Frieren: [0.48, 0.40, 0.08], yaw -0.15
        const frierenCloned = cloneSkeleton(frierenGltf.scene);
        const frierenRoot = frierenCloned.getObjectByName('Frieren') || frierenCloned;
        frierenCloned.position.set(0.48, 0.40, 0.08);
        frierenCloned.rotation.set(0, -0.15, 0);
        frierenCloned.scale.set(1.0, 1.0, 1.0);
        scene.add(frierenCloned);

        if (partyPalette && frierenRoot) {
          try {
            partyPalette.dress(frierenRoot);
          } catch (e) {
            console.warn('Cel-shading dress skipped for Frieren:', e);
          }
        }

        if (frierenGltf.animations && frierenGltf.animations.length > 0) {
          const frierenMixer = new THREE.AnimationMixer(frierenRoot);
          const frierenClip =
            frierenGltf.animations.find((c) => c.name === 'frieren_idle') ||
            frierenGltf.animations[0];
          if (frierenClip) {
            frierenMixer.clipAction(frierenClip).play();
            mixers.push(frierenMixer);
          }
        }

        // 4c. Flower Wreaths held in their hands (Matching Reference Artwork)
        if (wreathGltf) {
          const wHimmel = wreathGltf.scene.clone(true);
          wHimmel.position.set(-0.24, 0.76, 0.35);
          wHimmel.scale.set(0.85, 0.85, 0.85);
          wHimmel.rotation.set(0.35, 0.15, -0.2);
          scene.add(wHimmel);

          const wFrieren = wreathGltf.scene.clone(true);
          wFrieren.position.set(0.26, 0.72, 0.32);
          wFrieren.scale.set(0.8, 0.8, 0.8);
          wFrieren.rotation.set(0.35, -0.15, 0.2);
          scene.add(wFrieren);
        }

        setIsLoading(false);
      } catch (err: unknown) {
        if (!isDisposed) {
          console.error('Error loading Blue Flower Garden assets:', err);
          setErrorMessage('Could not load 3D Garden assets. Please check your connection.');
          setIsLoading(false);
        }
      }
    }

    loadGardenScene();

    // 5. Render Loop with Smooth Camera Transitions
    let prevTime = performance.now();

    function renderLoop(currentTime: number) {
      if (isDisposed) return;
      animFrameId = requestAnimationFrame(renderLoop);

      const delta = Math.min((currentTime - prevTime) / 1000, 0.05);
      prevTime = currentTime;

      // Update character and environment animation mixers
      for (let i = 0; i < mixers.length; i++) {
        mixers[i].update(delta);
      }

      // Smooth camera interpolation toward selected preset
      if (isTransitioningCamera.current) {
        camera.position.lerp(targetCamPos.current, 0.08);
        controls.target.lerp(targetControlsTarget.current, 0.08);

        if (Math.abs(camera.fov - targetFov.current) > 0.1) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov.current, 0.08);
          camera.updateProjectionMatrix();
        }

        // Snap when close enough
        if (
          camera.position.distanceTo(targetCamPos.current) < 0.02 &&
          controls.target.distanceTo(targetControlsTarget.current) < 0.02
        ) {
          camera.position.copy(targetCamPos.current);
          controls.target.copy(targetControlsTarget.current);
          camera.fov = targetFov.current;
          camera.updateProjectionMatrix();
          isTransitioningCamera.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animFrameId = requestAnimationFrame(renderLoop);

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Cleanup on unmount
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      controls.dispose();

      // Dispose Three.js objects
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <div
      data-testid="blue-flower-garden-section"
      className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a1224] via-[#0d1b33] to-[#070d1a] border border-sky-500/30 shadow-[0_12px_45px_rgba(2,132,199,0.2)] my-5"
    >
      {/* 1. SECTION HEADER BANNER */}
      <div className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-sky-950/60 border-b border-sky-500/20 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-sky-300" />
              <span>Level 05: The Eternal Meadow</span>
            </span>
          </div>
          <h3 className="font-fantasy text-base sm:text-lg font-bold text-sky-100 tracking-wide mt-1">
            Blue Flower Garden — Himmel &amp; Frieren
          </h3>
          <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">
            An endless floating field of Nemophila blossoms, preserving a cherished memory of companionship.
          </p>
        </div>

        {/* Camera Preset Quick Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {(Object.keys(PRESETS) as GardenCameraPreset[]).map((key) => {
            const p = PRESETS[key];
            const Icon = p.icon;
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                title={p.label}
                aria-label={p.name}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => applyPreset('hero')}
            title="Reset View"
            aria-label="Reset Camera"
            className="p-1 sm:p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. 3D INTERACTIVE CANVAS CONTAINER */}
      <div
        ref={containerRef}
        className="relative w-full h-[320px] sm:h-[400px] md:h-[450px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Subtle Floating Interactive Hint Pill (Fades after load) */}
        {!isLoading && !errorMessage && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-sky-200 font-mono tracking-wide shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>Interactive 3D • Drag to orbit • Pinch to zoom</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070e1c]/80 backdrop-blur-md text-sky-200 transition-opacity duration-300">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-3" />
            <p className="text-xs sm:text-sm font-medium tracking-wide animate-pulse font-mono">
              {loadProgress}
            </p>
            <span className="text-[10px] text-sky-400/60 font-mono mt-1">
              Loading 3D meadow &amp; animated party members
            </span>
          </div>
        )}

        {/* Error Fallback */}
        {errorMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#0a1224]/95 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Reload Scene
            </button>
          </div>
        )}
      </div>

      {/* 3. SECTION FOOTER INFO PILL */}
      <div className="px-4 sm:px-6 py-2.5 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-sky-400">✦</span>
          <span>Original Characters: Himmel &amp; Frieren (Active Idle Animations)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 hidden md:inline">Nemophila Caerulea Meadow</span>
          <span className="text-sky-400/90 font-semibold">18 Modular GLB Assets</span>
        </div>
      </div>
    </div>
  );
};
