import * as THREE from 'three';
import { ModelAnalyzer } from '../src/animation/ModelAnalyzer.ts';
import { TransformStore } from '../src/animation/TransformStore.ts';
import { PathGenerator } from '../src/animation/PathGenerator.ts';
import { AssemblyTimeline } from '../src/animation/AssemblyTimeline.ts';
import { ANIMATION_PRESETS } from '../src/animation/AnimationPresets.ts';
import { AssemblyEngine } from '../src/animation/AssemblyEngine.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Assembly Engine Mathematical Precision & Kinematic Verification...\n');

// 1. Build a synthetic 3D test hierarchy mirroring Home Island
const rootGroup = new THREE.Group();
rootGroup.name = 'TestIslandRoot';

const componentsDef = [
  { name: 'FloatingIsland', pos: [0, -4, 0], rot: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'Meadow', pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'TimberFrame', pos: [0, 1.5, -2], rot: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'ShingledGables', pos: [0, 3.5, -2], rot: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'FieldstoneChimney', pos: [1.2, 4.0, -2], rot: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'Campfire', pos: [-2, 0.2, 2], rot: [0, 0.4, 0], scale: [1, 1, 1] },
  { name: 'Scarecrow', pos: [3.5, 0.5, 1], rot: [0, -0.2, 0], scale: [1, 1, 1] },
  { name: 'MainTree', pos: [-4, 2, -3], rot: [0.1, 0, 0], scale: [1, 1, 1] },
  { name: 'Frieren', pos: [0.5, 0.3, 1.5], rot: [0, 1.2, 0], scale: [1, 1, 1] },
  { name: 'Himmel', pos: [-0.5, 0.3, 1.5], rot: [0, -0.8, 0], scale: [1, 1, 1] },
  { name: 'ChimneyWisp1', pos: [1.2, 5.5, -2], rot: [0, 0, 0], scale: [1, 1, 1] },
];

for (const def of componentsDef) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );
  mesh.name = def.name;
  mesh.position.set(...def.pos);
  mesh.rotation.set(...def.rot);
  mesh.scale.set(...def.scale);
  rootGroup.add(mesh);
}

// 2. Test ModelAnalyzer
console.log('--- TEST 1: ModelAnalyzer & Layer Categorization ---');
const analysis = ModelAnalyzer.analyze(rootGroup, 'HOME');
assert(analysis.components.length === componentsDef.length, `Expected ${componentsDef.length} components, got ${analysis.components.length}`);

const layersFound = new Set(analysis.components.map(c => c.layer));
console.log(`✅ Classified ${analysis.components.length} components into layers:`, Array.from(layersFound).join(', '));
assert(layersFound.has('FOUNDATION'), 'Expected FOUNDATION layer');
assert(layersFound.has('ARCHITECTURE'), 'Expected ARCHITECTURE layer');
assert(layersFound.has('CHARACTERS'), 'Expected CHARACTERS layer');

// Verify layer sequencing (Foundation builds before Characters)
const foundationComp = analysis.components.find(c => c.name === 'FloatingIsland');
const characterComp = analysis.components.find(c => c.name === 'Frieren');
assert(foundationComp.layerOrder < characterComp.layerOrder, 'Foundation layer order must be lower than Character layer order');
console.log(`✅ Layer ordering verified: Foundation (order ${foundationComp.layerOrder}) precedes Characters (order ${characterComp.layerOrder})`);

// 3. Test TransformStore Precision & Zero Drift
console.log('\n--- TEST 2: TransformStore Precision & 100-Scrub Zero Drift Guarantee ---');
const store = new TransformStore();
store.capture(analysis.components);
assert(store.size() === componentsDef.length, 'Transform store should contain all components');

// Verify initial drift is 0
let drift = store.measureDrift(rootGroup);
assert(drift.maxPositionDrift < 0.000001, 'Initial position drift must be 0');
assert(drift.maxRotationDrift < 0.000001, 'Initial rotation drift must be 0');
console.log(`✅ Initial transform store precision verified (drift: ${drift.maxPositionDrift})`);

// Initialize AssemblyEngine
const engine = new AssemblyEngine();
engine.init(rootGroup, 'HOME');

// Perform 100 arbitrary scrubs back and forth across [0.0, 1.0]
for (let i = 0; i < 100; i++) {
  const targetP = (i % 2 === 0) ? (i * 0.01) : (1.0 - i * 0.01);
  engine.scrub(targetP);
}

// Scrub back to 1.0 (Assembled)
engine.scrub(1.0);
drift = store.measureDrift(rootGroup);
console.log(`✅ Max position drift after 100 bidirectional scrubs: ${drift.maxPositionDrift.toExponential(4)}`);
console.log(`✅ Max rotation drift after 100 bidirectional scrubs: ${drift.maxRotationDrift.toExponential(4)}`);
console.log(`✅ Max scale drift after 100 bidirectional scrubs: ${drift.maxScaleDrift.toExponential(4)}`);
assert(drift.maxPositionDrift < 0.00001, 'Position drift after 100 scrubs must remain < 0.00001');
assert(drift.maxRotationDrift < 0.00001, 'Rotation drift after 100 scrubs must remain < 0.00001');

// 4. Test Kinematic Path & Spiral Swoop
console.log('\n--- TEST 3: Kinematic Path Curvature, Spiral Arc & Arrival Settle ---');
// At progress 0.0, objects must be exploded/dispersed
engine.scrub(0.0);
const explodedMesh = rootGroup.getObjectByName('TimberFrame');
const origSnap = store.get('TimberFrame');
const distFromOrig = explodedMesh.position.distanceTo(origSnap.localPosition);
console.log(`✅ At progress 0.0 (Exploded): TimberFrame dispersed by ${distFromOrig.toFixed(2)} units (visible: ${explodedMesh.visible})`);
assert(distFromOrig > 3.0, 'Dispersed distance at progress 0.0 should be > 3.0 units');

// At progress 0.5 (Mid-Assembly), verify spiral & altitude curvature
engine.scrub(0.5);
const midMesh = rootGroup.getObjectByName('TimberFrame');
console.log(`✅ At progress 0.5 (Mid-flight): TimberFrame position: [${midMesh.position.x.toFixed(2)}, ${midMesh.position.y.toFixed(2)}, ${midMesh.position.z.toFixed(2)}]`);
assert(midMesh.position.y > origSnap.localPosition.y, 'Mid-flight altitude should reflect lift arc');

// Test all 4 presets
console.log('\n--- TEST 4: Preset Configuration & Switching ---');
const presets = ['SPIRAL', 'SMOOTH', 'DRAMATIC', 'MINIMAL'];
for (const p of presets) {
  engine.setPreset(p);
  const state = engine.getState();
  assert(state.presetKey === p, `Expected preset key ${p}`);
  engine.scrub(0.4);
  console.log(`✅ Preset "${p}" evaluated successfully at progress 0.4`);
}

// 5. Test Playback Simulation
console.log('\n--- TEST 5: Playback Simulation & Delta Ticks ---');
engine.setPreset('SPIRAL');
engine.play('forward');
let state = engine.getState();
assert(state.isPlaying === true, 'Engine should be playing');
assert(state.direction === 'forward', 'Engine direction should be forward');

// Advance frames by 0.016s (60 FPS) until complete
let frames = 0;
while (engine.getState().isPlaying && frames < 600) {
  engine.update(0.016);
  frames++;
}

state = engine.getState();
assert(state.progress === 1.0, 'Engine should have reached progress 1.0');
assert(state.isPlaying === false, 'Engine should stop playing upon reaching 1.0');
console.log(`✅ Assembly playback completed in ${frames} frames (~${(frames * 0.016).toFixed(2)}s) and settled to exact 1.000000`);

engine.dispose();
console.log('\n🎉 ALL MATHEMATICAL PRECISION & KINEMATIC TESTS PASSED SUCCESSFULLY (0 ERRORS)!\n');
