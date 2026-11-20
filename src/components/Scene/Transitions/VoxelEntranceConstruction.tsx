import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { DestinationId } from './explodedConfig';
import { ISLAND_DISPLAY_TRANSFORMS } from './explodedConfig';

export interface VoxelEntranceConstructionProps {
  activeIslandId: DestinationId;
  targetGroupRef: React.RefObject<THREE.Group | null>;
  onComplete?: () => void;
  enabled?: boolean;
}

interface VoxelData {
  targetPos: THREE.Vector3;
  targetRotY: number; // 0, PI/2, PI, 3PI/2
  fallHeight: number; // 2.5 - 4.0
  color: THREE.Color;
  baseColor: THREE.Color;
  tierProgress: number; // 0..1
  normalizedY: number; // 0..1
  startTime: number;
  flightDuration: number;
  impactTime: number;
  handoverStartTime: number;
  wasFlashing: boolean;
}

interface MeshRevealEntry {
  object: THREE.Object3D;
  originalScale: THREE.Vector3;
  normalizedY: number;
}

function easeBackOut(p: number, s = 1.6): number {
  const p1 = p - 1;
  return 1 + (s + 1) * p1 * p1 * p1 + s * p1 * p1;
}

/**
 * Extracts a representative dominant material color from a mesh and its name.
 */
function getMeshDominantColor(mesh: THREE.Mesh): THREE.Color {
  const col = new THREE.Color();
  const nameLower = (mesh.name + ' ' + (mesh.parent?.name || '')).toLowerCase();

  // 1. Direct material color if available and distinct
  if (mesh.material) {
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if ((mat as any).color && (mat as any).color.isColor) {
      col.copy((mat as any).color);
      if (col.getHex() !== 0xffffff && col.getHex() !== 0x000000 && col.getHex() !== 0xcccccc) {
        return col;
      }
    }
  }

  // 2. Stylistic vibrant voxel palette based on semantic mesh taxonomy
  if (nameLower.includes('meadow') || nameLower.includes('grass') || nameLower.includes('crop') || nameLower.includes('yard')) {
    col.set('#46a853'); // Lush green meadow
  } else if (nameLower.includes('shrub') || nameLower.includes('leaf') || nameLower.includes('ivy')) {
    col.set('#2f9e44'); // Vibrant shrubbery
  } else if (nameLower.includes('tree') || nameLower.includes('fir')) {
    if (nameLower.includes('blossom') || nameLower.includes('cherry')) {
      col.set('#60a5fa');
    } else {
      col.set('#1e7e34'); // Pine foliage
    }
  } else if (nameLower.includes('bark') || nameLower.includes('wood') || nameLower.includes('timber') || nameLower.includes('fence') || nameLower.includes('door') || nameLower.includes('seat')) {
    col.set('#a0522d'); // Rich warm wood
  } else if (nameLower.includes('shingle') || nameLower.includes('roof') || nameLower.includes('gable')) {
    col.set('#2563eb'); // Deep blue roof tiles
  } else if (nameLower.includes('wall') || nameLower.includes('house') || nameLower.includes('cottage') || nameLower.includes('porch')) {
    col.set('#d4b886'); // Warm timber plaster
  } else if (nameLower.includes('path') || nameLower.includes('waystone') || nameLower.includes('cobble')) {
    col.set('#cbd5e1'); // Cobblestone path
  } else if (nameLower.includes('chimney') || nameLower.includes('stone') || nameLower.includes('rock') || nameLower.includes('cliff') || nameLower.includes('foundation')) {
    col.set('#64748b'); // Crisp cliff slate
  } else if (nameLower.includes('flower') || nameLower.includes('petal') || nameLower.includes('wreath') || nameLower.includes('wildflower')) {
    if (nameLower.includes('cyan') || nameLower.includes('blue1')) col.set('#38bdf8');
    else if (nameLower.includes('violet') || nameLower.includes('lila')) col.set('#818cf8');
    else if (nameLower.includes('lavender')) col.set('#c084fc');
    else if (nameLower.includes('pink')) col.set('#f472b6');
    else if (nameLower.includes('white')) col.set('#ffffff');
    else col.set('#3b82f6');
  } else if (nameLower.includes('himmel')) {
    col.set('#38bdf8'); // Himmel hero blue
  } else if (nameLower.includes('frieren')) {
    col.set('#f8fafc'); // Frieren white robe
  } else if (nameLower.includes('heiter') || nameLower.includes('eisen')) {
    col.set('#f59e0b');
  } else if (nameLower.includes('fire') || nameLower.includes('flame') || nameLower.includes('ember') || nameLower.includes('lantern')) {
    col.set('#f97316'); // Glowing orange fire
  } else if (nameLower.includes('cloud')) {
    col.set('#f1f5f9');
  } else {
    col.set('#6b7280');
  }

  return col;
}

export const VoxelEntranceConstruction: React.FC<VoxelEntranceConstructionProps> = ({
  activeIslandId,
  targetGroupRef,
  onComplete,
  enabled = true,
}) => {
  const containerRef = useRef<THREE.Group>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const hasSampledRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const isCompleteRef = useRef(false);

  const voxelsRef = useRef<VoxelData[]>([]);
  const meshRevealsRef = useRef<MeshRevealEntry[]>([]);

  // Reusable Three.js math objects for useFrame
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const flashColor = useMemo(() => new THREE.Color('#ffffff'), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instancedMeshRef.current) {
        instancedMeshRef.current.geometry.dispose();
        if (Array.isArray(instancedMeshRef.current.material)) {
          instancedMeshRef.current.material.forEach((m) => m.dispose());
        } else {
          instancedMeshRef.current.material.dispose();
        }
      }
    };
  }, []);

  useFrame((state) => {
    if (!enabled || isCompleteRef.current) return;

    const group = targetGroupRef.current;
    if (!group) return;

    // -------------------------------------------------------------------------
    // STEP 1: Wait until meshes are loaded, then perform Instanced Voxel Sampling
    // -------------------------------------------------------------------------
    if (!hasSampledRef.current) {
      let meshCount = 0;
      group.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshCount++;
      });

      if (meshCount < 3) {
        // Keep hidden while awaiting GLTF unpack
        group.visible = false;
        return;
      }

      // 1. Initial Empty State (t = 0.0s – 0.45s): keep parent group visible so its lights stay active,
      // but hide individual loaded meshes for zero 3D geometry visible yet.
      group.visible = true;
      hasSampledRef.current = true;
      startTimeRef.current = state.clock.getElapsedTime();

      // Sample meshes to construct voxel definitions
      group.updateMatrixWorld(true);
      const invGroupMatrix = new THREE.Matrix4().copy(group.matrixWorld).invert();

      const S = 0.52; // Voxel grid step
      const voxelMap = new Map<string, { pos: THREE.Vector3; color: THREE.Color }>();
      const meshList: MeshRevealEntry[] = [];

      group.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;

        // Skip transparent invisible hitbox meshes
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (mat.transparent && mat.opacity === 0 && !mat.depthWrite) return;
        }

        const nameLower = mesh.name.toLowerCase();
        // Ignore sky dome, distant background spheres, or interaction triggers
        if (nameLower.includes('skydome') || nameLower.includes('trigger') || nameLower.includes('hitbox')) {
          return;
        }

        mesh.updateMatrixWorld(true);
        const toGroupMatrix = new THREE.Matrix4().multiplyMatrices(invGroupMatrix, mesh.matrixWorld);

        // Record mesh for Phase 4 Handover scale-in
        meshList.push({
          object: mesh,
          originalScale: mesh.scale.clone(),
          normalizedY: 0, // Will calibrate after minY / maxY bounds
        });

        // Initialize mesh hidden & zero-scale for clean initial empty state
        mesh.visible = false;
        mesh.scale.set(0, 0, 0);

        const meshCol = getMeshDominantColor(mesh);
        const geom = mesh.geometry;
        if (!geom) return;

        // Bounding box surface/volume sampling
        if (!geom.boundingBox) geom.computeBoundingBox();
        const bbox = geom.boundingBox;
        if (bbox) {
          const dx = bbox.max.x - bbox.min.x;
          const dy = bbox.max.y - bbox.min.y;
          const dz = bbox.max.z - bbox.min.z;

          const stepsX = Math.max(1, Math.min(5, Math.ceil(dx / S)));
          const stepsY = Math.max(1, Math.min(5, Math.ceil(dy / S)));
          const stepsZ = Math.max(1, Math.min(5, Math.ceil(dz / S)));

          const p = new THREE.Vector3();
          for (let ix = 0; ix <= stepsX; ix++) {
            for (let iy = 0; iy <= stepsY; iy++) {
              for (let iz = 0; iz <= stepsZ; iz++) {
                // Shell sampling (surface cubes)
                const isSurface =
                  ix === 0 || ix === stepsX ||
                  iy === 0 || iy === stepsY ||
                  iz === 0 || iz === stepsZ;

                if (isSurface) {
                  p.set(
                    bbox.min.x + (ix / stepsX) * dx,
                    bbox.min.y + (iy / stepsY) * dy,
                    bbox.min.z + (iz / stepsZ) * dz
                  ).applyMatrix4(toGroupMatrix);

                  const gx = Math.round(p.x / S) * S;
                  const gy = Math.round(p.y / S) * S;
                  const gz = Math.round(p.z / S) * S;
                  const key = `${gx.toFixed(2)},${gy.toFixed(2)},${gz.toFixed(2)}`;

                  if (!voxelMap.has(key)) {
                    voxelMap.set(key, {
                      pos: new THREE.Vector3(gx, gy, gz),
                      color: meshCol.clone(),
                    });
                  }
                }
              }
            }
          }
        }
      });

      const rawVoxels = Array.from(voxelMap.values());
      if (rawVoxels.length === 0) {
        // Fallback: restore meshes and finish
        group.visible = true;
        meshList.forEach((m) => m.object.scale.copy(m.originalScale));
        isCompleteRef.current = true;
        onComplete?.();
        return;
      }

      // Compute Y min/max for tier sorting and handover normalization
      let minY = Infinity;
      let maxY = -Infinity;
      rawVoxels.forEach((v) => {
        if (v.pos.y < minY) minY = v.pos.y;
        if (v.pos.y > maxY) maxY = v.pos.y;
      });
      const spanY = Math.max(0.1, maxY - minY);

      // Calibrate normalizedY for real meshes
      meshList.forEach((m) => {
        const objPos = new THREE.Vector3();
        m.object.getWorldPosition(objPos).applyMatrix4(invGroupMatrix);
        m.normalizedY = THREE.MathUtils.clamp((objPos.y - minY) / spanY, 0, 1);
      });
      meshRevealsRef.current = meshList;

      // Sort voxel instances: bottom-to-top (y ascending), then center-outward
      rawVoxels.sort((a, b) => {
        const yDiff = a.pos.y - b.pos.y;
        if (Math.abs(yDiff) > 0.12) {
          return yDiff;
        }
        const distA = a.pos.x * a.pos.x + a.pos.z * a.pos.z;
        const distB = b.pos.x * b.pos.x + b.pos.z * b.pos.z;
        return distA - distB;
      });

      // Cap at optimal count for maximum fidelity & 60fps performance
      const maxVoxels = 800;
      const sampledVoxels =
        rawVoxels.length > maxVoxels
          ? rawVoxels.filter((_, idx) => idx % Math.ceil(rawVoxels.length / maxVoxels) === 0)
          : rawVoxels;

      const N = sampledVoxels.length;
      const FLIGHT_DURATION = 0.38; // Duration of each voxel falling down

      const voxelDefinitions: VoxelData[] = sampledVoxels.map((sv, i) => {
        const tierProgress = N > 1 ? i / (N - 1) : 0;
        const normalizedY = THREE.MathUtils.clamp((sv.pos.y - minY) / spanY, 0, 1);
        const startTime = 0.45 + tierProgress * 0.92; // 0.45s – 1.37s spawn window
        const impactTime = startTime + FLIGHT_DURATION;
        const handoverStartTime = 1.35 + normalizedY * 0.45; // 1.35s – 1.80s handover start
        const fallHeight = 2.5 + ((i * 37) % 15) * 0.10; // 2.5 - 4.0 units above
        const targetRotY = ((i * 3) % 4) * (Math.PI / 2); // Random 90° rotation

        return {
          targetPos: sv.pos,
          targetRotY,
          fallHeight,
          color: sv.color.clone(),
          baseColor: sv.color.clone(),
          tierProgress,
          normalizedY,
          startTime,
          flightDuration: FLIGHT_DURATION,
          impactTime,
          handoverStartTime,
          wasFlashing: false,
        };
      });

      voxelsRef.current = voxelDefinitions;

      // Build single GPU-friendly THREE.InstancedMesh of low-poly cubes
      const cubeSize = S * 0.94;
      const boxGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const boxMat = new THREE.MeshStandardMaterial({
        roughness: 0.48,
        metalness: 0.08,
        flatShading: true,
      });

      const instMesh = new THREE.InstancedMesh(boxGeo, boxMat, N);
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;

      // Initialize all instances at scale = 0
      tempMatrix.makeScale(0, 0, 0);
      for (let i = 0; i < N; i++) {
        instMesh.setMatrixAt(i, tempMatrix);
        instMesh.setColorAt(i, voxelDefinitions[i].baseColor);
      }
      instMesh.instanceMatrix.needsUpdate = true;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;

      instancedMeshRef.current = instMesh;
      if (containerRef.current) {
        containerRef.current.add(instMesh);
      }

      if (typeof window !== 'undefined') {
        (window as any).__VOXEL_ENTRANCE_STATE__ = {
          phase: 'EMPTY',
          elapsed: 0,
          voxelCount: N,
          activeIsland: activeIslandId,
          isComplete: false,
        };
      }
      return;
    }

    // -------------------------------------------------------------------------
    // STEP 2: Animation Timeline (t = 0.0s to 2.10s+)
    // -------------------------------------------------------------------------
    if (startTimeRef.current === null) return;
    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const instMesh = instancedMeshRef.current;
    const voxels = voxelsRef.current;
    if (!instMesh || voxels.length === 0) return;

    let needsColorUpdate = false;

    // Phase classification for diagnostics & telemetry
    let currentPhase: 'EMPTY' | 'VOXEL_SPAWN' | 'HANDOVER' | 'COMPLETE' = 'EMPTY';
    if (elapsed >= 2.10) {
      currentPhase = 'COMPLETE';
    } else if (elapsed >= 1.35) {
      currentPhase = 'HANDOVER';
    } else if (elapsed >= 0.45) {
      currentPhase = 'VOXEL_SPAWN';
    }

    // =========================================================================
    // PHASE A: Staggered Block-Build Spawn (t = 0.45s – 1.75s)
    // =========================================================================
    if (elapsed < 0.45) {
      // Empty state: keep individual meshes hidden while scene & lights remain active
      meshRevealsRef.current.forEach((m) => {
        m.object.visible = false;
        m.object.scale.set(0, 0, 0);
      });
    } else {
      for (let i = 0; i < voxels.length; i++) {
        const v = voxels[i];

        if (elapsed < v.startTime) {
          // Not yet spawned
          tempMatrix.makeScale(0, 0, 0);
          instMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        // Flight progress in [0, 1]
        const flightProg = THREE.MathUtils.clamp(
          (elapsed - v.startTime) / v.flightDuration,
          0,
          1
        );
        const flightEase = easeBackOut(flightProg, 1.6);

        // Position: fly down from fallHeight above to exact target coordinates
        const curY = v.targetPos.y + v.fallHeight * (1.0 - THREE.MathUtils.clamp(flightEase, 0, 1.25));
        tempPos.set(v.targetPos.x, curY, v.targetPos.z);

        // Rotation: spinning from targetRotY + PI down to targetRotY
        const curRotY = v.targetRotY + (1.0 - flightProg) * Math.PI;
        tempEuler.set(0, curRotY, 0);
        tempQuat.setFromEuler(tempEuler);

        // Base spawn scale with back.out overshoot
        let scaleVal = Math.max(0, flightEase);

        // Emissive Lock-In Flash at impact (impactTime ± 0.12s)
        const timeSinceImpact = elapsed - v.impactTime;
        if (timeSinceImpact >= -0.04 && timeSinceImpact <= 0.14) {
          const flashProgress = 1.0 - Math.abs(timeSinceImpact) / 0.14;
          tempColor.copy(v.baseColor).lerp(flashColor, flashProgress * 0.75);
          tempColor.multiplyScalar(1.0 + flashProgress * 0.9);
          instMesh.setColorAt(i, tempColor);
          v.wasFlashing = true;
          needsColorUpdate = true;
        } else if (v.wasFlashing) {
          instMesh.setColorAt(i, v.baseColor);
          v.wasFlashing = false;
          needsColorUpdate = true;
        }

        // =====================================================================
        // PHASE B: Smooth Handover — shrink voxel cubes to scale = 0 (t = 1.35s – 2.10s)
        // =====================================================================
        if (elapsed >= v.handoverStartTime) {
          const SHRINK_DURATION = 0.28;
          const shrinkProg = THREE.MathUtils.clamp(
            (elapsed - v.handoverStartTime) / SHRINK_DURATION,
            0,
            1
          );
          const shrinkEase = easeBackOut(1.0 - shrinkProg, 1.2);
          scaleVal *= Math.max(0, shrinkEase);
        }

        tempScale.set(scaleVal, scaleVal, scaleVal);
        tempMatrix.compose(tempPos, tempQuat, tempScale);
        instMesh.setMatrixAt(i, tempMatrix);
      }

      instMesh.instanceMatrix.needsUpdate = true;
      if (needsColorUpdate && instMesh.instanceColor) {
        instMesh.instanceColor.needsUpdate = true;
      }
    }

    // =========================================================================
    // PHASE C: Handover to Real Island Meshes (t = 1.35s – 2.10s)
    // =========================================================================
    if (elapsed >= 1.35) {
      group.visible = true;
      const meshList = meshRevealsRef.current;
      const REVEAL_DURATION = 0.32;

      for (let m = 0; m < meshList.length; m++) {
        const entry = meshList[m];
        const meshStartTime = 1.35 + entry.normalizedY * 0.42;

        if (elapsed < meshStartTime) {
          entry.object.visible = false;
          entry.object.scale.set(0, 0, 0);
        } else {
          entry.object.visible = true;
          const prog = THREE.MathUtils.clamp((elapsed - meshStartTime) / REVEAL_DURATION, 0, 1);
          const s = Math.max(0, easeBackOut(prog, 1.4));
          entry.object.scale.copy(entry.originalScale).multiplyScalar(s);
        }
      }
    }

    // =========================================================================
    // PHASE D: Cleanup & Completion (t = 2.10s+)
    // =========================================================================
    if (elapsed >= 2.10 && !isCompleteRef.current) {
      isCompleteRef.current = true;

      // 1. Ensure all meshes are 100% visible and restored to exact original scale
      group.visible = true;
      meshRevealsRef.current.forEach((entry) => {
        entry.object.visible = true;
        entry.object.scale.copy(entry.originalScale);
      });

      // 2. Dispose of temporary voxel InstancedMesh geometry and material immediately
      if (instancedMeshRef.current) {
        instancedMeshRef.current.geometry.dispose();
        if (Array.isArray(instancedMeshRef.current.material)) {
          instancedMeshRef.current.material.forEach((m) => m.dispose());
        } else {
          instancedMeshRef.current.material.dispose();
        }
        instancedMeshRef.current.removeFromParent();
        instancedMeshRef.current = null;
      }

      if (typeof window !== 'undefined') {
        (window as any).__VOXEL_ENTRANCE_STATE__ = {
          phase: 'COMPLETE',
          elapsed,
          voxelCount: voxels.length,
          activeIsland: activeIslandId,
          isComplete: true,
        };
        (window as any).__VOXEL_ENTRANCE_COMPLETE__ = true;
      }

      onComplete?.();
    } else {
      if (typeof window !== 'undefined') {
        (window as any).__VOXEL_ENTRANCE_STATE__ = {
          phase: currentPhase,
          elapsed,
          voxelCount: voxels.length,
          activeIsland: activeIslandId,
          isComplete: false,
        };
      }
    }
  });

  const islandTransform = ISLAND_DISPLAY_TRANSFORMS[activeIslandId] || ISLAND_DISPLAY_TRANSFORMS.HOME;

  return (
    <group
      ref={containerRef}
      name="VoxelEntranceConstructionContainer"
      position={islandTransform.position}
      scale={islandTransform.scale}
    >
      {/* Dynamic Construction Illumination: Ensures voxel cubes are vibrantly lit in all themes */}
      <ambientLight intensity={1.8} color="#ffffff" />
      <directionalLight position={[10, 18, 12]} intensity={2.2} color="#fffcf5" castShadow={false} />
      <directionalLight position={[-10, 8, -10]} intensity={1.2} color="#93c5fd" castShadow={false} />
    </group>
  );
};
