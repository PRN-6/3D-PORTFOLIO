import * as THREE from 'three';

console.log('Testing Fluid Stretch Flight Kinematics...');

function createFlightCurve(origPos, archetype = 'PERIMETER_SWOOP') {
  const p = origPos.clone();
  let start, ctrl1, ctrl2;

  if (archetype === 'OVERHEAD_LOOP') {
    start = p.clone().add(new THREE.Vector3(14, 15, -12));
    ctrl1 = p.clone().add(new THREE.Vector3(7, 18, -4));
    ctrl2 = p.clone().add(new THREE.Vector3(2, 6, 1));
  } else if (archetype === 'HELICAL_SPIRAL') {
    start = p.clone().add(new THREE.Vector3(-12, 14, 10));
    ctrl1 = p.clone().add(new THREE.Vector3(-6, 9, -5));
    ctrl2 = p.clone().add(new THREE.Vector3(2, 4, 3));
  } else {
    // PERIMETER_SWOOP
    start = p.clone().add(new THREE.Vector3(-16, 11, -8));
    ctrl1 = p.clone().add(new THREE.Vector3(-8, 14, 6));
    ctrl2 = p.clone().add(new THREE.Vector3(-2, 5, 2));
  }

  return new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, p);
}

function evaluateFluidStretch(curve, origPos, origRot, origScale, t) {
  if (t >= 0.99999) {
    return {
      pos: origPos.clone(),
      rot: origRot.clone(),
      scale: origScale.clone(),
      stretch: 1.0,
      thickness: 1.0,
      visible: true,
    };
  }

  if (t <= 0.00001) {
    return {
      pos: curve.getPoint(0),
      rot: origRot.clone(),
      scale: new THREE.Vector3(0.001, 0.001, 0.001),
      stretch: 0,
      thickness: 0,
      visible: false,
    };
  }

  // Blender F-Curve easing
  const inv = 1 - t;
  const easedT = Math.min(1, 1 - inv * inv * inv * (1 + 2.4 * t));

  const pos = curve.getPoint(easedT);
  const tangent = curve.getTangent(easedT).normalize();

  // Alignment quaternion: align local +Y with tangent
  const qAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  const qFlight = qAlign.clone().multiply(origRot);

  // Stretch & Shape formation curves
  let sParallel = 1.0;
  let sPerp = 1.0;
  let dockFactor = 0.0;

  if (t < 0.70) {
    // Pure Stretched Stick in mid-flight from far away
    sParallel = 3.8;
    sPerp = 0.32; // volume preservation 3.8 * 0.32^2 ~= 0.39 (thin stick)
    dockFactor = 0.0;
  } else if (t < 0.90) {
    // Decelerating & Blossoming into original shape
    const alpha = (t - 0.70) / 0.20;
    const smoothAlpha = alpha * alpha * (3 - 2 * alpha);
    sParallel = THREE.MathUtils.lerp(3.8, 0.88, smoothAlpha); // compress slightly past 1.0
    sPerp = THREE.MathUtils.lerp(0.32, 1.14, smoothAlpha);    // blossom outwards
    dockFactor = smoothAlpha;
  } else {
    // Touchdown rebound & settle
    const settleT = (t - 0.90) / 0.10;
    const decay = Math.exp(-9.0 * settleT);
    const osc = Math.cos(settleT * Math.PI * 4.0);
    sParallel = 1.0 - 0.12 * decay * osc;
    sPerp = 1.0 + 0.08 * decay * osc;
    dockFactor = 1.0;
  }

  // Slerp orientation from flight tangent to rest orientation
  const rot = qFlight.clone().slerp(origRot, dockFactor);

  // Local scale: stretch along local Y (which points along tangent in flight), compress X and Z
  const scale = new THREE.Vector3(
    origScale.x * sPerp,
    origScale.y * sParallel,
    origScale.z * sPerp
  );

  return { pos, rot, scale, stretch: sParallel, thickness: sPerp, visible: true };
}

// Run test
const origPos = new THREE.Vector3(3.2, 0.5, -2.1);
const origRot = new THREE.Quaternion(0, 0, 0, 1);
const origScale = new THREE.Vector3(1, 1, 1);

const curve = createFlightCurve(origPos, 'OVERHEAD_LOOP');

console.log('--- FLIGHT TRAJECTORY SAMPLING ---');
const testSteps = [0.0, 0.25, 0.50, 0.70, 0.80, 0.90, 0.95, 1.0];
for (const step of testSteps) {
  const res = evaluateFluidStretch(curve, origPos, origRot, origScale, step);
  console.log(
    `t=${step.toFixed(2)} | ` +
    `Pos: (${res.pos.x.toFixed(2)}, ${res.pos.y.toFixed(2)}, ${res.pos.z.toFixed(2)}) | ` +
    `Stretch: ${res.stretch.toFixed(2)}x | Thick: ${res.thickness.toFixed(2)}x | ` +
    `Scale: (${res.scale.x.toFixed(2)}, ${res.scale.y.toFixed(2)}, ${res.scale.z.toFixed(2)})`
  );
}

// Verification checks
const atMid = evaluateFluidStretch(curve, origPos, origRot, origScale, 0.5);
if (atMid.stretch < 3.0 || atMid.thickness > 0.45) {
  console.error('FAIL: Mid-flight mesh is not properly stretched into a stick!');
  process.exit(1);
}

const atDock = evaluateFluidStretch(curve, origPos, origRot, origScale, 1.0);
const posDrift = atDock.pos.distanceTo(origPos);
const scaleDrift = Math.abs(atDock.scale.x - 1.0) + Math.abs(atDock.scale.y - 1.0) + Math.abs(atDock.scale.z - 1.0);

console.log(`\nFinal Touchdown Verification:`);
console.log(`Position Drift: ${posDrift.toFixed(6)} (Target: 0.000000)`);
console.log(`Scale Drift: ${scaleDrift.toFixed(6)} (Target: 0.000000)`);

if (posDrift > 0.00001 || scaleDrift > 0.00001) {
  console.error('FAIL: Touchdown drift exceeds tolerance!');
  process.exit(1);
}

console.log('SUCCESS: Fluid stretch flight kinematics verified with 0 drift!');
