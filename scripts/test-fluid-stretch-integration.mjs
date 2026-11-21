import * as THREE from 'three';
import { FluidStretchFlightAnimator } from '../src/animation/FluidStretchFlightAnimator.ts';

console.log('=== RUNNING FLUID STRETCH FLIGHT INTEGRATION TESTS ===\n');

const testEntities = [
  { name: 'MainTree', origPos: new THREE.Vector3(5.5, 0, -3.2), origScale: new THREE.Vector3(1.2, 1.2, 1.2) },
  { name: 'WindwardFir', origPos: new THREE.Vector3(-6.2, 0, 4.1), origScale: new THREE.Vector3(1.0, 1.0, 1.0) },
  { name: 'YoungFir', origPos: new THREE.Vector3(7.1, 0, 5.0), origScale: new THREE.Vector3(0.8, 0.8, 0.8) },
  { name: 'Frieren', origPos: new THREE.Vector3(-1.5, 0.2, 2.0), origScale: new THREE.Vector3(1.0, 1.0, 1.0) },
  { name: 'Himmel', origPos: new THREE.Vector3(1.8, 0.2, 1.5), origScale: new THREE.Vector3(1.0, 1.0, 1.0) },
  { name: 'Heiter', origPos: new THREE.Vector3(-2.8, 0.2, -1.2), origScale: new THREE.Vector3(1.0, 1.0, 1.0) },
  { name: 'Eisen', origPos: new THREE.Vector3(3.0, 0.2, -2.5), origScale: new THREE.Vector3(1.0, 1.0, 1.0) },
];

let allPassed = true;

for (const entity of testEntities) {
  const origRot = new THREE.Quaternion(0, 0, 0, 1);
  const snapshot = {
    name: entity.name,
    localPosition: entity.origPos.clone(),
    localQuaternion: origRot.clone(),
    localScale: entity.origScale.clone(),
    worldPosition: entity.origPos.clone(),
    worldQuaternion: origRot.clone(),
    worldScale: entity.origScale.clone(),
    visible: true,
  };

  const obj = new THREE.Object3D();
  obj.name = entity.name;

  // Test 1: Dispersed Far Away (t = 0)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.0);
  const distFar = obj.position.distanceTo(entity.origPos);
  if (distFar < 10.0) {
    console.error(`FAIL: ${entity.name} is not far away at t = 0 (distance = ${distFar.toFixed(2)})`);
    allPassed = false;
  }

  // Test 2: Stretched Smooth Stick in Mid-Flight (t = 0.50)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.5);
  const stretchRatio = obj.scale.y / (entity.origScale.y * (obj.scale.x / entity.origScale.x));
  const sParallel = obj.scale.y / entity.origScale.y;
  const sPerp = obj.scale.x / entity.origScale.x;
  console.log(
    `[${entity.name}] Mid-flight (t=0.50) -> Long Stretch: ${sParallel.toFixed(2)}x, Radial Thinning: ${sPerp.toFixed(2)}x (Elongation Ratio: ${stretchRatio.toFixed(1)}x)`
  );
  if (sParallel < 3.5 || sPerp > 0.40) {
    console.error(`FAIL: ${entity.name} is not stretched into a stick at mid-flight!`);
    allPassed = false;
  }

  // Test 3: Blossoming into Shape (t = 0.85)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.85);
  const sPar85 = obj.scale.y / entity.origScale.y;
  const sPerp85 = obj.scale.x / entity.origScale.x;
  console.log(`[${entity.name}] Approach (t=0.85)   -> Forming Shape: ${sPar85.toFixed(2)}x / ${sPerp85.toFixed(2)}x`);

  // Test 4: Fully Formed Touchdown (t = 1.0)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 1.0);
  const posDrift = obj.position.distanceTo(entity.origPos);
  const scaleDiff = Math.abs(obj.scale.x - entity.origScale.x) +
                    Math.abs(obj.scale.y - entity.origScale.y) +
                    Math.abs(obj.scale.z - entity.origScale.z);

  if (posDrift > 0.00001 || scaleDiff > 0.00001) {
    console.error(`FAIL: ${entity.name} has drift at t = 1.0! PosDrift: ${posDrift}, ScaleDiff: ${scaleDiff}`);
    allPassed = false;
  } else {
    console.log(`[${entity.name}] Arrival (t=1.00)    -> Touchdown exact, 0 drift (Pos: ${posDrift.toFixed(6)}, Scale: ${scaleDiff.toFixed(6)})\n`);
  }
}

if (!allPassed) {
  console.error('TEST SUITE FAILED');
  process.exit(1);
} else {
  console.log('ALL FLUID STRETCH FLIGHT TESTS PASSED (7/7 ENTITIES VERIFIED)');
}
