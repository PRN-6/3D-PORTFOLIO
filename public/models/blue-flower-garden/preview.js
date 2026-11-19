import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPartyPalette } from '/src/components/Scene/partyMaterials.ts';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c2ddfc');

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 1.25, 4.0);
camera.lookAt(0, 0.95, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.95, 0);
controls.maxPolarAngle = Math.PI * 0.95;

// Suggested Lighting Setup from manifest
const sunLight = new THREE.DirectionalLight('#fff5e4', 2.3);
sunLight.position.set(-7.5, 14.0, 9.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 40;
sunLight.shadow.camera.left = -12;
sunLight.shadow.camera.right = 12;
sunLight.shadow.camera.top = 12;
sunLight.shadow.camera.bottom = -12;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight('#d0e5fc', '#52855b', 1.4);
scene.add(hemiLight);

const pinkRim = new THREE.DirectionalLight('#fadcee', 1.6);
pinkRim.position.set(9.5, 7.5, -11.0);
scene.add(pinkRim);

const underBounce = new THREE.DirectionalLight('#8ec2fa', 0.7);
underBounce.position.set(0, -6.5, 7.0);
scene.add(underBounce);

const centerGlow = new THREE.PointLight('#aee2ff', 1.2, 8.0, 2);
centerGlow.position.set(0, 1.2, 0.5);
scene.add(centerGlow);

const loader = new GLTFLoader();
const mixers = [];
let himmelMesh = null;
let frierenMesh = null;
let isReady = false;

async function initScene() {
  const manifest = await (await fetch('./manifest.json')).json();

  // 1. Load Pre-assembled Master Garden
  console.log('Loading Blue Flower Garden complete master asset...');
  const gardenGltf = await loader.loadAsync('./blue-flower-garden-complete.glb');
  gardenGltf.scene.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.side = THREE.DoubleSide;
    }
  });
  scene.add(gardenGltf.scene);

  if (gardenGltf.animations && gardenGltf.animations.length > 0) {
    const gardenMixer = new THREE.AnimationMixer(gardenGltf.scene);
    gardenGltf.animations.forEach(clip => gardenMixer.clipAction(clip).play());
    mixers.push(gardenMixer);
  }

  // 2. Load Satellite Floating Rocks & Orbiting Mana Crystals
  try {
    const rocksGltf = await loader.loadAsync('./island/floating-rocks.glb');
    rocksGltf.scene.traverse(child => {
      if (child.isMesh && child.material) child.material.side = THREE.DoubleSide;
    });
    scene.add(rocksGltf.scene);
    if (rocksGltf.animations && rocksGltf.animations.length > 0) {
      const rockMixer = new THREE.AnimationMixer(rocksGltf.scene);
      rocksGltf.animations.forEach(clip => rockMixer.clipAction(clip).play());
      mixers.push(rockMixer);
    }
  } catch (err) {
    console.warn('Could not load floating-rocks.glb:', err);
  }

  // 3. Load Floating Petals & Atmospheric Motes
  try {
    const petalsGltf = await loader.loadAsync('./effects/floating-petals.glb');
    scene.add(petalsGltf.scene);
    if (petalsGltf.animations && petalsGltf.animations.length > 0) {
      const petalMixer = new THREE.AnimationMixer(petalsGltf.scene);
      petalsGltf.animations.forEach(clip => petalMixer.clipAction(clip).play());
      mixers.push(petalMixer);
    }

    const motesGltf = await loader.loadAsync('./effects/magical-motes.glb');
    scene.add(motesGltf.scene);
    if (motesGltf.animations && motesGltf.animations.length > 0) {
      const moteMixer = new THREE.AnimationMixer(motesGltf.scene);
      motesGltf.animations.forEach(clip => moteMixer.clipAction(clip).play());
      mixers.push(moteMixer);
    }
  } catch (err) {
    console.warn('Could not load effects:', err);
  }

  // 4. Load Original Himmel Model
  console.log('Loading Himmel character model...');
  const himmelGltf = await loader.loadAsync('/' + manifest.characters.himmel.file);
  const himmelRoot = himmelGltf.scene;
  himmelMesh = himmelRoot.getObjectByName('Himmel') || himmelRoot;
  himmelRoot.position.fromArray(manifest.characters.himmel.position);
  himmelRoot.rotation.fromArray(manifest.characters.himmel.rotation);
  himmelRoot.scale.fromArray(manifest.characters.himmel.scale);
  scene.add(himmelRoot);

  const partyPalette = createPartyPalette();
  if (partyPalette && himmelMesh) {
    try {
      partyPalette.dress(himmelMesh);
    } catch (e) {
      console.warn('Party dress skipped for Himmel:', e);
    }
  }

  if (himmelGltf.animations && himmelGltf.animations.length > 0) {
    const himmelMixer = new THREE.AnimationMixer(himmelMesh);
    const idleClip = himmelGltf.animations.find(c => c.name === manifest.characters.himmel.clip) || himmelGltf.animations[0];
    if (idleClip) {
      himmelMixer.clipAction(idleClip).play();
      mixers.push(himmelMixer);
    }
  }

  // 5. Load Original Frieren Model
  console.log('Loading Frieren character model...');
  const frierenGltf = await loader.loadAsync('/' + manifest.characters.frieren.file);
  const frierenRoot = frierenGltf.scene;
  frierenMesh = frierenRoot.getObjectByName('Frieren') || frierenRoot;
  frierenRoot.position.fromArray(manifest.characters.frieren.position);
  frierenRoot.rotation.fromArray(manifest.characters.frieren.rotation);
  frierenRoot.scale.fromArray(manifest.characters.frieren.scale);
  scene.add(frierenRoot);

  if (partyPalette && frierenMesh) {
    try {
      partyPalette.dress(frierenMesh);
    } catch (e) {
      console.warn('Party dress skipped for Frieren:', e);
    }
  }

  if (frierenGltf.animations && frierenGltf.animations.length > 0) {
    const frierenMixer = new THREE.AnimationMixer(frierenMesh);
    const idleClip = frierenGltf.animations.find(c => c.name === manifest.characters.frieren.clip) || frierenGltf.animations[0];
    if (idleClip) {
      frierenMixer.clipAction(idleClip).play();
      mixers.push(frierenMixer);
    }
  }

  // 6. Attach Flower Bouquets in front of their hands (matching Reference Image 1)
  try {
    const wreathGltfHimmel = await loader.loadAsync('./flowers/flower-wreath.glb');
    const wHimmel = wreathGltfHimmel.scene;
    wHimmel.position.set(-0.24, 0.76, 0.35);
    wHimmel.scale.set(0.85, 0.85, 0.85);
    wHimmel.rotation.set(0.35, 0.15, -0.2);
    scene.add(wHimmel);

    const wreathGltfFrieren = await loader.loadAsync('./flowers/flower-wreath.glb');
    const wFrieren = wreathGltfFrieren.scene;
    wFrieren.position.set(0.26, 0.72, 0.32);
    wFrieren.scale.set(0.80, 0.80, 0.80);
    wFrieren.rotation.set(0.35, -0.15, 0.2);
    scene.add(wFrieren);
  } catch (err) {
    console.warn('Could not load flower wreaths:', err);
  }

  isReady = true;
  console.log('Blue Flower Garden preview initialized successfully!');
}

initScene();

// Render loop
let prevTime = performance.now();
function animate(currentTime) {
  requestAnimationFrame(animate);
  const delta = Math.min((currentTime - prevTime) / 1000, 0.05);
  prevTime = currentTime;

  mixers.forEach(mixer => mixer.update(delta));
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Camera View Presets
const presets = {
  heroFront: { pos: [0, 1.25, 4.0], target: [0, 0.95, 0], fov: 40 },
  overview: { pos: [0, 8.5, 17.5], target: [0, 0.4, 0], fov: 38 },
  romanceCloseUp: { pos: [0, 1.05, 2.2], target: [0, 0.95, 0.1], fov: 36 },
  horizonDistant: { pos: [9.5, 4.2, 12.0], target: [-0.5, 0.8, -1.0], fov: 35 },
  undersideInspection: { pos: [0, -7.5, 14.0], target: [0, -3.0, 0], fov: 40 },
};

function setShot(name) {
  const p = presets[name];
  if (!p) return;
  camera.fov = p.fov;
  camera.updateProjectionMatrix();
  camera.position.fromArray(p.pos);
  controls.target.fromArray(p.target);
  controls.update();
  renderer.render(scene, camera);
}

window.gardenPreview = {
  scene,
  camera,
  renderer,
  controls,
  mixers,
  himmel: () => himmelMesh,
  frieren: () => frierenMesh,
  isReady: () => isReady,
  shot: setShot,
};
