import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPartyPalette } from '/src/components/Scene/partyMaterials.ts';

const scene=new THREE.Scene();
scene.background=new THREE.Color('#111a2c');
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.05,180);
camera.position.set(0,10.5,24);camera.lookAt(0,.8,0);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
document.body.append(renderer.domElement);
const key=new THREE.DirectionalLight('#d2d6f1',2.3);key.position.set(-7,12,12);
scene.add(key,new THREE.HemisphereLight('#c5c8e6','#343340',1.3));
const rim=new THREE.DirectionalLight('#a6a0e3',1.5);rim.position.set(9,7,-6);scene.add(rim);
const under=new THREE.DirectionalLight('#818ebd',.6);under.position.set(0,-5,8);scene.add(under);
const manifest=await(await fetch('./manifest.json')).json();
for(const spec of manifest.suggestedLights){const light=new THREE.PointLight(spec.color,spec.intensity,spec.distance,2);light.position.fromArray(spec.position);scene.add(light);}
const loader=new GLTFLoader(),mixers=[],modules=[];
const templates=await Promise.all(manifest.assets.map(async spec=>({spec,gltf:await loader.loadAsync('./'+spec.file)})));
for(const {spec,gltf} of templates)for(const placement of spec.placements){
 const root=gltf.scene.clone(true);
 root.position.fromArray(placement.position);
 if(placement.rotation)root.rotation.fromArray([...placement.rotation,'XYZ']);
 if(placement.scale)root.scale.fromArray(placement.scale);
 scene.add(root);
 const mixer=new THREE.AnimationMixer(root);gltf.animations.forEach(c=>mixer.clipAction(c).play());mixers.push(mixer);
 modules.push({file:spec.file,root,animations:gltf.animations});
}
const hero=await loader.loadAsync(manifest.eisen.file),eisen=hero.scene.getObjectByName('Eisen');
eisen.position.fromArray(manifest.eisen.position);eisen.rotation.y=manifest.eisen.yaw;
scene.add(hero.scene);
const palette=createPartyPalette();palette.dress(eisen);
const actor=new THREE.AnimationMixer(eisen);actor.clipAction(hero.animations.find(c=>c.name===manifest.eisen.clip)).play();mixers.push(actor);
let paused=false,previous=performance.now();
function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!paused)mixers.forEach(m=>m.update(dt));renderer.render(scene,camera);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.workshopPreview={scene,camera,renderer,modules,mixers,eisen,templates,manifest,
 pause(){paused=true;mixers.forEach(m=>m.setTime(1.5));},
 shot(position,target){camera.position.fromArray(position);camera.lookAt(...target);renderer.render(scene,camera);},
};

