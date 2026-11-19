import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Simple inspect script using three and gltf loader in Node if possible, or read json chunk of glb
function inspectGlb(filePath) {
  const buf = fs.readFileSync(filePath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonBuf = buf.subarray(20, 20 + jsonLen);
  const gltf = JSON.parse(jsonBuf.toString('utf8'));
  console.log(`=== Inspecting ${path.basename(filePath)} ===`);
  console.log(`Nodes:`, gltf.nodes?.map(n => n.name));
  console.log(`Meshes:`, gltf.meshes?.map(m => m.name));
  console.log(`Animations:`, gltf.animations?.map(a => a.name));
  console.log(`Materials:`, gltf.materials?.map(m => m.name));
}

inspectGlb('public/models/transition/himmel.glb');
inspectGlb('public/models/transition/frieren.glb');

