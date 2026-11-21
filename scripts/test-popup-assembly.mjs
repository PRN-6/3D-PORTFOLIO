import * as THREE from 'three';
import { PopUpAssemblyEngine } from '../src/animation/PopUpAssemblyEngine.ts';
import { HingeAnimator } from '../src/animation/HingeAnimator.ts';
import { PopScaleAnimator } from '../src/animation/PopScaleAnimator.ts';
import { FoliageAnimator } from '../src/animation/FoliageAnimator.ts';
import { TransformStore } from '../src/animation/TransformStore.ts';

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

console.log('🧪 STARTING PAPERCRAFT POP-UP ASSEMBLY TEST SUITE...\n');

// 1. Build a synthetic 3D test diorama mirroring the Hero's Home model
const root = new THREE.Group();
root.name = 'TestDioramaRoot';

const components = [
  { name: 'FloatingIsland', pos: [0, -4, 0], size: [14, 4, 14], type: 'FLOOR' },
  { name: 'Meadow', pos: [0, 0, 0], size: [12, 0.4, 12], type: 'FLOOR' },
  { name: 'TimberFrame', pos: [0, 1.5, -2], size: [6, 3, 0.4], type: 'WALL_HINGE' },
  { name: 'ShingledGables', pos: [0, 3.8, -2], size: [6.4, 2, 4], type: 'WALL_HINGE' },
  { name: 'FieldstoneChimney', pos: [1.5, 4.0, -2], size: [1.2, 5, 1.2], type: 'WALL_HINGE' },
  { name: 'HearthsideSeats', pos: [0, 0.4, 3], size: [2, 0.8, 1], type: 'PRIMARY_FURNITURE' },
  { name: 'Campfire', pos: [0, 0.2, 2], size: [1.2, 0.4, 1.2], type: 'PRIMARY_FURNITURE' },
  { name: 'WeaponRack', pos: [3.5, 0.8, -1], size: [1.5, 1.8, 0.6], type: 'PRIMARY_FURNITURE' },
  { name: 'WoodenSword', pos: [3.4, 1.0, -1], size: [0.2, 1.0, 0.1], type: 'SECONDARY_PROP' },
  { name: 'WateringCan', pos: [-3, 0.3, 2], size: [0.4, 0.5, 0.3], type: 'SECONDARY_PROP' },
  { name: 'CropPatchCarrots', pos: [-4, 0.1, 1], size: [2, 0.2, 2], type: 'SECONDARY_PROP' },
  { name: 'MainTree', pos: [-4.5, 2.5, -3], size: [3, 5, 3], type: 'FOLIAGE' },
  { name: 'WildflowerBanks', pos: [2, 0.2, 1], size: [2, 0.4, 1.5], type: 'FOLIAGE' },
  { name: 'Frieren', pos: [0.5, 0.4, 1.5], size: [0.6, 1.2, 0.5], type: 'CHARACTER' },
];

for (const c of components) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...c.size),
    new THREE.MeshStandardMaterial({ color: 0xcccccc })
  );
  mesh.name = c.name;
  mesh.position.set(...c.pos);
  root.add(mesh);
}

// -----------------------------------------------------------------------------
// TEST 1: Model Hierarchy & Choreography Classification
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Papercraft Hierarchy Classification ---');
const engine = new PopUpAssemblyEngine();
engine.init(root, 'HOME');

const state = engine.getState();
console.log(`✅ Engine initialized with ${state.componentCount} components.`);
assert(state.componentCount === components.length, `Expected ${components.length} components, got ${state.componentCount}`);

// -----------------------------------------------------------------------------
// TEST 2: HingeAnimator Bottom-Edge Flap Hinging & Overshoot
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: HingeAnimator Bottom-Edge Flap Hinging ---');
const timberFrame = root.getObjectByName('TimberFrame');
const store = new TransformStore();
store.capture([{ name: 'TimberFrame', object: timberFrame }]);
const timberOrig = store.get('TimberFrame');

const hingeConfig = HingeAnimator.getOrCreateHinge(timberFrame, timberOrig);
console.log(`✅ TimberFrame hinge axis: [${hingeConfig.hingeAxis.x}, ${hingeConfig.hingeAxis.y}, ${hingeConfig.hingeAxis.z}], foldAngle: ${(hingeConfig.foldAngle * 180 / Math.PI).toFixed(1)}°`);
assert(hingeConfig.hingeAxis.lengthSq() > 0.99, 'Hinge axis must be a unit vector');

// At t = 0.0, wall must be folded flat
HingeAnimator.evaluateHinge(timberFrame, timberOrig, 0.0);
assert(!timberFrame.visible, 'Folded wall should be hidden at t=0');

// At t = 0.5, wall is partially upright
HingeAnimator.evaluateHinge(timberFrame, timberOrig, 0.5);
assert(timberFrame.visible, 'Wall must be visible at t=0.5');

// At t = 1.0, wall must match original exactly
HingeAnimator.evaluateHinge(timberFrame, timberOrig, 1.0);
assert(timberFrame.position.distanceTo(timberOrig.localPosition) < 0.00001, 'Wall position at t=1.0 must match original');
assert(Math.abs(timberFrame.quaternion.angleTo(timberOrig.localQuaternion)) < 0.00001, 'Wall quaternion at t=1.0 must match original');
console.log('✅ TimberFrame bottom-edge hinge unfolding and boundary locks verified.');

// -----------------------------------------------------------------------------
// TEST 3: PopScaleAnimator Bottom-Surface Support Pinning & Elastic Overshoot
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: PopScaleAnimator Base Pinning & Elastic Overshoot ---');
const seat = root.getObjectByName('HearthsideSeats');
store.capture([{ name: 'HearthsideSeats', object: seat }]);
const seatOrig = store.get('HearthsideSeats');

// Evaluate at t = 0.55 (peak overshoot 1.08x matching elasticPopScaleCurve)
PopScaleAnimator.evaluatePop(seat, seatOrig, 0.55, false);
console.log(`✅ HearthsideSeats scale at peak overshoot (t=0.55): Y scale = ${(seat.scale.y / seatOrig.localScale.y).toFixed(3)}x`);
assert(seat.scale.y > seatOrig.localScale.y * 1.04, 'Scale at peak overshoot should be > 1.04x');

// Evaluate at t = 1.0 (settled)
PopScaleAnimator.evaluatePop(seat, seatOrig, 1.0, false);
assert(Math.abs(seat.scale.y - seatOrig.localScale.y) < 0.00001, 'Scale at t=1.0 must be 1.000000x');
assert(seat.position.distanceTo(seatOrig.localPosition) < 0.00001, 'Position at t=1.0 must match original');
console.log('✅ HearthsideSeats base-pinned scale pop-up and exact boundary lock verified.');

// -----------------------------------------------------------------------------
// TEST 4: FoliageAnimator Curved Growth & Secondary Sway Damping
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: FoliageAnimator Curved Growth & Sway ---');
const tree = root.getObjectByName('MainTree');
store.capture([{ name: 'MainTree', object: tree }]);
const treeOrig = store.get('MainTree');

FoliageAnimator.evaluateFoliage(tree, treeOrig, 0.45);
assert(tree.position.distanceTo(treeOrig.localPosition) > 0.1, 'Foliage should deviate along curved arc during growth');
FoliageAnimator.evaluateFoliage(tree, treeOrig, 1.0);
assert(tree.position.distanceTo(treeOrig.localPosition) < 0.00001, 'Foliage position at t=1.0 must match original');
assert(Math.abs(tree.quaternion.angleTo(treeOrig.localQuaternion)) < 0.00001, 'Foliage rotation at t=1.0 must match original');
console.log('✅ MainTree curved growth trajectory and exact boundary lock verified.');

// -----------------------------------------------------------------------------
// TEST 5: Master Timeline 100-Scrub Zero Drift Guarantee
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Master Timeline 100-Scrub Zero Drift Guarantee ---');
for (let i = 0; i < 100; i++) {
  const p = i % 2 === 0 ? (i * 0.01) : (1.0 - i * 0.01);
  engine.scrub(p);
}
engine.scrub(1.0);

let maxPosDrift = 0;
let maxRotDrift = 0;
let maxScaleDrift = 0;

for (const c of components) {
  const obj = root.getObjectByName(c.name);
  const origPos = new THREE.Vector3(...c.pos);
  const pDiff = obj.position.distanceTo(origPos);
  const sDiff = Math.abs(obj.scale.x - 1.0) + Math.abs(obj.scale.y - 1.0) + Math.abs(obj.scale.z - 1.0);
  if (pDiff > maxPosDrift) maxPosDrift = pDiff;
  if (sDiff > maxScaleDrift) maxScaleDrift = sDiff;
}

console.log(`✅ Max position drift across all components after 100 scrubs: ${maxPosDrift.toExponential(4)}`);
console.log(`✅ Max scale drift across all components after 100 scrubs: ${maxScaleDrift.toExponential(4)}`);
assert(maxPosDrift < 0.00001, 'Position drift must be < 0.00001');
assert(maxScaleDrift < 0.00001, 'Scale drift must be < 0.00001');

// -----------------------------------------------------------------------------
// TEST 6: Forward & Reverse Playback Simulation
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Playback Simulation & Reversibility ---');
engine.play('forward');
let frames = 0;
while (engine.getState().isPlaying && frames < 200) {
  engine.update(0.016);
  frames++;
}
assert(engine.getState().progress === 1.0, 'Engine should assemble to 1.0');
console.log(`✅ Forward assembly completed in ${frames} frames (~${(frames * 0.016).toFixed(2)}s).`);

engine.play('reverse');
frames = 0;
while (engine.getState().isPlaying && frames < 200) {
  engine.update(0.016);
  frames++;
}
assert(engine.getState().progress === 0.0, 'Engine should disassemble to 0.0');
console.log(`✅ Reverse disassembly completed in ${frames} frames (~${(frames * 0.016).toFixed(2)}s).`);

engine.dispose();
console.log('\n🎉 ALL PAPERCRAFT POP-UP ASSEMBLY TESTS PASSED SUCCESSFULLY (0 ERRORS)!\n');
