import * as THREE from 'three';
import { FluidStretchFlightAnimator } from '../src/animation/FluidStretchFlightAnimator.ts';

console.log('=== RUNNING ON-THE-SPOT 3D CREATION INTEGRATION TESTS ===\n');

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

  // Test 1: Nothing There at t = 0 (Out of Nothing)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.0);
  if (obj.visible || obj.scale.y > 0.001) {
    console.error(`FAIL: ${entity.name} is visible at t = 0! Must be invisible / nothing there.`);
    allPassed = false;
  }

  // Test 2: Created on the spot as a stretched smooth stick (t = 0.50)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.5);
  const sParallel = obj.scale.y / entity.origScale.y;
  const sPerp = obj.scale.x / entity.origScale.x;
  console.log(
    `[${entity.name}] On-the-spot creation (t=0.50) -> Stretched Stick: Height ${sParallel.toFixed(2)}x, Width ${sPerp.toFixed(2)}x`
  );
  if (sParallel < 2.5 || sPerp > 0.40) {
    console.error(`FAIL: ${entity.name} is not a stretched stick on the spot!`);
    allPassed = false;
  }

  // Test 3: Blossoming into Shape (t = 0.85)
  FluidStretchFlightAnimator.evaluateFlight(obj, snapshot, 0.85);
  const sPar85 = obj.scale.y / entity.origScale.y;
  const sPerp85 = obj.scale.x / entity.origScale.x;
  console.log(`[${entity.name}] Forming Shape (t=0.85)        -> Blossom: ${sPar85.toFixed(2)}x / ${sPerp85.toFixed(2)}x`);

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
    console.log(`[${entity.name}] Formed at Rest (t=1.00)       -> 0 drift exact (Pos: ${posDrift.toFixed(6)}, Scale: ${scaleDiff.toFixed(6)})\n`);
  }
}

if (!allPassed) {
  console.error('TEST SUITE FAILED');
  process.exit(1);
} else {
  console.log('ALL ON-THE-SPOT 3D CREATION TESTS PASSED (7/7 ENTITIES VERIFIED)');
}
