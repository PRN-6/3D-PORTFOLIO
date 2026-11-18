import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createPartyPalette } from '../components/Scene/partyMaterials';

export const transitionNames = ['Frieren', 'Himmel', 'Heiter', 'Eisen'] as const;
export type TransitionName = typeof transitionNames[number];
export const TRANSITION_DURATION = 9.1;
const { clamp, smoothstep, lerp } = THREE.MathUtils;
const formations = [[-.72, .56], [.71, .48], [-.67, -.70], [.77, -.66]] as const;

function descentHeight(time: number) {
  if (time <= .52) return 5;
  if (time < 1.65) return 5 + 1.2 * Math.sin((time - .52) / 1.13 * Math.PI / 2);
  if (time < 5.2) {
    const u = (time - 1.65) / 3.55;
    return (2 * u ** 3 - 3 * u ** 2 + 1) * 6.2
      + (-2 * u ** 3 + 3 * u ** 2) * 2
      + (u ** 3 - u ** 2) * 3.55 * -1.5;
  }
  const u = clamp((time - 5.2) / 2.8, 0, 1);
  const velocity = -1.5;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * 2
    + (u ** 3 - 2 * u ** 2 + u) * 2.8 * velocity;
}

function makeParticles() {
  const count = 40;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const violet = new THREE.Color('#cdb8ff'), gold = new THREE.Color('#ffe2a2');
  for (let i = 0; i < count; i++) (i % 3 ? gold : violet).toArray(colors, i * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexColors: true, uniforms: { opacity: { value: 0 } },
    vertexShader: [
      'varying vec3 glow;',
      'void main() {',
      'glow = color;',
      'vec4 view = modelViewMatrix * vec4(position, 1.);',
      'gl_Position = projectionMatrix * view;',
      'gl_PointSize = clamp(95. / max(1., -view.z), 2., 16.);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform float opacity;',
      'varying vec3 glow;',
      'void main() {',
      'float distance = length(gl_PointCoord - .5) * 2.;',
      'float alpha = pow(max(0., 1. - distance), 2.) * opacity;',
      'gl_FragColor = vec4(glow, alpha);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}',
    ].join('\n'),
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'SoftMagicParticles';
  points.frustumCulled = false;
  return {
    object: points,
    update(time: number, opacity: number) {
      material.uniforms.opacity.value = opacity * .78;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399963 + time * (.10 + i % 3 * .012);
        const radius = .45 + 1.48 * ((i * 17 % 41) / 41);
        const cycle = ((time * .20 + i * .137) % 1 + 1) % 1;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = .06 + .82 * cycle;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}

/**
 * Add group to the caller's scene. Call update(delta) or seek(seconds).
 * Camera, world and navigation belong to the caller. Cached input GLTFs can
 * be reused. Only cloned materials and playback resources are disposed here.
 */
export function createTransitionSequence(
  characters: Record<TransitionName, GLTF>,
  magicAsset: GLTF,
) {
  const group = new THREE.Group();
  group.name = 'HomeToShowcaseTransition';
  const palette = createPartyPalette();
  const actors = transitionNames.map((name, index) => {
    const asset = characters[name];
    const model = cloneSkeleton(asset.scene);
    const root = model.getObjectByName(name);
    if (!root) throw new Error('Missing transition root ' + name);
    model.traverse(object => {
      if ((object as THREE.Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
      if ((object as THREE.SkinnedMesh).isSkinnedMesh) object.frustumCulled = false;
    });
    group.add(model);
    const mixer = new THREE.AnimationMixer(root);
    const paint = palette.dress(root);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const clip of asset.animations) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.paused = true;
      action.play();
      action.setEffectiveWeight(0);
      actions.set(clip.name.slice(name.length + 1), action);
    }
    return { root, mixer, actions, paint, index, name };
  });
  const effect = magicAsset.scene.clone(true);
  const effectMaterials: Array<{ material: THREE.Material; opacity: number }> = [];
  effect.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const material = (mesh.material as THREE.Material).clone();
    material.depthWrite = false;
    mesh.material = material;
    mesh.castShadow = false;
    mesh.renderOrder = 2;
    effectMaterials.push({ material, opacity: material.opacity });
  });
  const particles = makeParticles();
  effect.add(particles.object);
  const glow = new THREE.PointLight('#e4d1ff', 0, 6, 2);
  glow.position.y = .38;
  effect.add(glow);
  group.add(effect);
  let time = 0;
  let disposed = false;

  function seek(seconds: number) {
    if (disposed) return;
    time = clamp(Number.isFinite(seconds) ? seconds : 0, 0, TRANSITION_DURATION);
    const height = Math.max(0, descentHeight(time));
    const travel = 6 * smoothstep(time, .52, 4.15);
    for (const actor of actors) {
      const phases = actor.name === 'Frieren'
        ? [{ start: 0, name: 'jump' }, { start: 1.25, name: 'fall' }, { start: 5.2, name: 'magic_land' }, { start: 8, name: 'landing' }, { start: 9.1, name: 'idle' }]
        : [{ start: 0, name: 'jump' }, { start: 1.25, name: 'fall' }, { start: 6.6, name: 'landing_prepare' }, { start: 8, name: 'landing' }, { start: 9.1, name: 'idle' }];
      const active = phases.findLastIndex(phase => time >= phase.start);
      const phase = phases[active];
      const fade = active === 0 ? 1 : smoothstep(time - phase.start, 0, .20);
      for (const action of actor.actions.values()) action.setEffectiveWeight(0);
      function sample(name: string, elapsed: number, weight: number) {
        const action = actor.actions.get(name);
        if (!action) throw new Error('Missing transition clip ' + actor.name + '_' + name);
        const duration = action.getClip().duration;
        action.time = name === 'fall' || name === 'idle' ? elapsed % duration : Math.min(elapsed, duration);
        action.setEffectiveWeight(weight);
      }
      sample(phase.name, time - phase.start, fade);
      if (fade < 1) {
        const previous = phases[active - 1];
        sample(previous.name, time - previous.start, 1 - fade);
      }
      actor.mixer.update(0);
      const freefall = smoothstep(time, 1.3, 2.1) * (1 - smoothstep(time, 5.2, 7.3));
      const drift = Math.sin(time * .84 + actor.index) * .09 * freefall;
      actor.root.position.set(formations[actor.index][0] + drift, height,
        travel + formations[actor.index][1] + .07 * Math.cos(time + actor.index) * freefall);
      actor.root.rotation.set(
        Math.sin(time * .66 + actor.index) * .035 * freefall,
        Math.sin(time * .63 + actor.index * 1.7) * .13 * freefall,
        Math.sin(time * .71 + actor.index) * .055 * freefall,
      );
      const blink = (time + actor.index * .81) % 3.7 > 3.56;
      actor.paint?.setExpression(blink ? 'blink' :
        actor.name === 'Heiter' && time > 1.25 && time < 6.8 ? 'speaking' : 'neutral');
    }
    const strength = smoothstep(time, 5.15, 5.85) * (1 - smoothstep(time, 8.4, 9.1));
    effect.visible = strength > .001;
    effect.position.y = height + .006;
    effect.position.z = travel;
    effect.rotation.y = time * .11;
    effect.scale.setScalar(lerp(.85, 1, smoothstep(time, 5.15, 6.6)));
    effectMaterials.forEach(({ material, opacity }) => { material.opacity = opacity * strength; });
    particles.update(time, strength);
    glow.intensity = 1.3 * strength;
    group.updateMatrixWorld(true);
  }
  seek(0);
  return {
    group, duration: TRANSITION_DURATION, seek,
    update(delta: number) { seek(time + Math.max(0, Number.isFinite(delta) ? delta : 0)); },
    get time() { return time; },
    dispose() {
      if (disposed) return;
      disposed = true;
      actors.forEach(actor => {
        actor.mixer.stopAllAction();
        actor.mixer.uncacheRoot(actor.root);
        actor.paint?.dispose();
        actor.root.traverse(object => {
          const mesh = object as THREE.SkinnedMesh;
          if (mesh.isSkinnedMesh) mesh.skeleton.dispose();
        });
      });
      palette.dispose();
      particles.dispose();
      effectMaterials.forEach(({ material }) => material.dispose());
      glow.dispose();
      group.removeFromParent();
    },
  };
}

