import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGardenRuntime } from './garden-runtime.mjs';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor('#b7cedb');
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#b7cedb', 45, 95);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 150);
camera.position.set(24, 18, 32);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .6, 0); controls.enableDamping = true; controls.minDistance = 8; controls.maxDistance = 85;
scene.add(new THREE.HemisphereLight('#e5f2ff','#9aa5c3',1.4));
const sun = new THREE.DirectionalLight('#fff1d7', 2.1); sun.position.set(-12,20,12); scene.add(sun);
const rim = new THREE.DirectionalLight('#c3c8ff',1.4); rim.position.set(8,8,-14); scene.add(rim);
const bounce = new THREE.DirectionalLight('#b4c5f5',1.8); bounce.position.set(0,-8,12); scene.add(bounce);
const draco = new DRACOLoader().setDecoderPath('/draco/gltf/');
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('./blue-flower-garden.glb');
scene.add(gltf.scene);
const runtime = createGardenRuntime(gltf.scene,gltf.animations);
await renderer.compileAsync(scene,camera);
let last = performance.now(), paused = false;
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);
function view(name){
  const mobile=innerWidth<600;
  if(name==='detail'){camera.position.set(12,9,15);controls.target.set(0,.5,-1);}
  else if(name==='underside'){camera.position.set(18,-5,22);controls.target.set(0,-1.2,0);}
  else{camera.position.set(...(mobile?[40,21,58]:[24,13,32]));controls.target.set(0,.6,0);}
  controls.update();
}
view('overview');
window.__GARDEN__={scene:gltf.scene,runtime,renderer,camera,view,pause(v=true){paused=v;},stats(){return{...renderer.info.render,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}};
renderer.setAnimationLoop(now=>{const delta=(now-last)/1000;last=now;if(!paused)runtime.update(delta);controls.update();renderer.render(scene,camera);});
const metadata = await fetch('./manifest.json').then(r=>r.json());
document.getElementById('status').textContent=`4,200 blossoms · ${metadata.triangles.toLocaleString()} triangles · drag to orbit`;
window.__GARDEN_READY__=true;
