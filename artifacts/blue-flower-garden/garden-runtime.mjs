import * as THREE from 'three';

/** Attach to an owned SkeletonUtils clone. Does not change shared loader geometry/materials. */
export function createGardenRuntime(scene, clips, { shadows = false, reducedMotion = false } = {}) {
  const garden = scene.getObjectByName('BlueFlowerGarden_Candidate');
  if (!garden?.userData.runtime) throw new Error('Expected the generated Blue Flower Garden candidate.');
  const data = garden.userData.runtime;
  const ownedMaterials = new Set();
  const originalMaterials = new Map();
  const meshes = [];
  const particleMesh = scene.getObjectByName(data.mesh);
  scene.traverse(object => {
    if (!object.isMesh) return;
    meshes.push(object);
    originalMaterials.set(object, object.material);
    object.material = object.material.clone();
    ownedMaterials.add(object.material);
    object.material.forceSinglePass = true;
    object.castShadow = shadows && object.userData.castShadow === true;
    object.receiveShadow = shadows && object.name !== 'Horizon_Clouds';
    // Rig animation covers a large known domain; avoid rest-pose-only frustum clipping.
    object.frustumCulled = false;
    if (object.name === 'Horizon_Clouds') object.material.depthWrite = true;
    if (object.name === data.mesh) object.material.depthWrite = false;
  });
  const originalGeometry = particleMesh.geometry;
  particleMesh.geometry = originalGeometry.clone();
  const colors = particleMesh.geometry.getAttribute('color');
  const joints = particleMesh.geometry.getAttribute('skinIndex');
  const particleIndices = new Map(data.petals.map(p => [p.joint, []]));
  for (let i = 0; i < joints.count; i++) particleIndices.get(joints.getX(i))?.push(i);
  const petals = data.petals.map(p => ({ ...p, node: scene.getObjectByName(p.name), indices: particleIndices.get(p.joint) }));
  const crystals = data.crystalSpins.map(p => ({ ...p, node: scene.getObjectByName(p.name) }));
  const mixer = new THREE.AnimationMixer(scene);
  const actions = clips.map(clip => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  let elapsed = 0, disposed = false;
  function setTime(time) {
    if (disposed) return;
    elapsed = Math.max(0, time);
    const t = reducedMotion ? 0 : elapsed;
    mixer.setTime(t);
    for (const c of crystals) c.node.rotation.y = (t / c.period * Math.PI * 2) % (Math.PI * 2);
    for (const p of petals) {
      const u = (t / 6 + p.phase) % 1, angle = u * Math.PI * 2, radius = 2 + 6 * u;
      p.node.position.set(Math.cos(angle) * radius, .8 + 2.4 * u, Math.sin(angle) * radius);
      const fade = THREE.MathUtils.smoothstep(u, 0, .12) * (1 - THREE.MathUtils.smoothstep(u, .85, 1));
      for (const index of p.indices) colors.setW(index, fade);
    }
    colors.needsUpdate = true;
    particleMesh.material.emissiveIntensity = .6 + .6 * (1 - Math.cos(t / 6 * Math.PI * 2));
    scene.updateMatrixWorld(true);
  }
  setTime(0);
  return {
    mixer, actions, setTime,
    update(delta) { if (!reducedMotion) setTime(elapsed + Math.min(Math.max(0, delta), .05)); },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction(); mixer.uncacheRoot(scene);
      particleMesh.geometry.dispose(); particleMesh.geometry = originalGeometry;
      ownedMaterials.forEach(material => material.dispose());
      originalMaterials.forEach((material, mesh) => { mesh.material = material; });
      const skeletons = new Set(meshes.filter(m => m.isSkinnedMesh).map(m => m.skeleton));
      skeletons.forEach(skeleton => skeleton.dispose());
    },
  };
}
