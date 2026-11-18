import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPartyPalette } from '/src/components/Scene/partyMaterials.ts';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#142032');
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .05, 150);
camera.position.set(19, 15, 23);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();
const moon = new THREE.DirectionalLight('#c4d0ef', 1.8);
moon.position.set(6, 12, 9);
scene.add(moon, new THREE.HemisphereLight('#c4d3ee', '#5c597c', 1.0));
const rim = new THREE.DirectionalLight('#b3a0ec', 1.2);
rim.position.set(-8, 9, -5);
scene.add(rim);
const bounce = new THREE.DirectionalLight('#8baebf', .6);
bounce.position.set(-5, -5, 10);
scene.add(bounce);
const loader = new GLTFLoader();
const manifest = await (await fetch('./manifest.json')).json();
const mixers = [];
const modules = await Promise.all(manifest.files.map(async entry => {
  const gltf = await loader.loadAsync('./' + entry.file);
  gltf.scene.position.fromArray(entry.position);
  scene.add(gltf.scene);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.animations.forEach(clip => mixer.clipAction(clip).play());
  mixers.push(mixer);
  return { ...entry, gltf };
}));
const heiter = await loader.loadAsync('/models/transition/heiter.glb');
const root = heiter.scene.getObjectByName('Heiter');
const resting = modules.find(module => module.file === 'heiter-resting-area.glb').gltf.scene;
scene.updateMatrixWorld(true);
resting.getObjectByName('HeiterIdleAnchor').getWorldPosition(root.position);
root.rotation.y = 1.0;
scene.add(heiter.scene);
const palette = createPartyPalette();
palette.dress(root);
const actor = new THREE.AnimationMixer(root);
actor.clipAction(heiter.animations.find(clip => clip.name === 'heiter_idle')).play();
mixers.push(actor);
for (const position of [[-5.5,1.5,1],[.7,3.8,-2.6]]) {
  const lantern = new THREE.PointLight('#ffd097', 3, 6, 2);
  lantern.position.fromArray(position);
  scene.add(lantern);
}
let previous = performance.now();
let paused = false;
function frame(now) {
  const delta = Math.min(.05, (now - previous) / 1000);
  previous = now;
  if (!paused) mixers.forEach(mixer => mixer.update(delta));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.forestPreview = {
  scene, camera, renderer, modules, loader, controls, mixers,
  pause() { paused = true; },
  shot(position, target) {
    camera.position.fromArray(position);
    controls.target.fromArray(target);
    controls.update();
    renderer.render(scene, camera);
  },
};

