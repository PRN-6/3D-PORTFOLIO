import * as THREE from 'three';

console.log('Testing On-The-Spot "Created Out of Nothing" Genesis Kinematics...');

/**
 * On-The-Spot Genesis Kinematics:
 * Element is created right on its spot out of nothing (scale 0 at base).
 * Shoots up as a stretched smooth stick/spindle, and at the apex blooms into its full 3D shape.
 */
function evaluateSpotCreation(origPos, origRot, origScale, t, liftHeight = 2.5) {
  if (t <= 0.00001) {
    return {
      pos: origPos.clone(),
      rot: origRot.clone(),
      scale: new THREE.Vector3(0.0001, 0.0001, 0.0001),
      visible: false,
    };
  }

  if (t >= 0.99999) {
    return {
      pos: origPos.clone(),
      rot: origRot.clone(),
      scale: origScale.clone(),
      visible: true,
    };
  }

  // Phase 1: Shoot up out of nothing as a stretched stick (t in [0, 0.65])
  // Phase 2: Bloom & expand laterally into full 3D shape (t in [0.65, 0.88])
  // Phase 3: Touchdown impact squash & harmonic settle (t in [0.88, 1.0])

  let sY = 1.0;
  let sXZ = 1.0;
  let currentY = origPos.y;

  if (t < 0.65) {
    // Emerges from zero-point on the spot: shoots upward
    const shootT = t / 0.65;
    const easedShoot = Math.sin(shootT * Math.PI * 0.5); // fast rise
    currentY = origPos.y + liftHeight * (1.0 - Math.pow(1.0 - shootT, 2));

    // Stretched stick / spindle: long vertical height, thin width
    sY = Math.min(3.6, shootT * 4.0);
    sXZ = Math.max(0.05, Math.min(0.28, shootT * 0.35));
  } else if (t < 0.88) {
    // Apex reached: bloom & expand into true 3D shape
    const bloomT = (t - 0.65) / 0.23;
    const smoothBloom = bloomT * bloomT * (3.0 - 2.0 * bloomT);

    currentY = origPos.y + liftHeight * (1.0 - smoothBloom) * 0.35;
    sY = THREE.MathUtils.lerp(3.6, 0.90, smoothBloom);  // contract length
    sXZ = THREE.MathUtils.lerp(0.28, 1.15, smoothBloom); // blossom width & details
  } else {
    // Settle & rebound onto the surface
    const settleT = (t - 0.88) / 0.12;
    const decay = Math.exp(-8.0 * settleT);
    const osc = Math.cos(settleT * Math.PI * 4.0);

    currentY = origPos.y;
    sY = 1.0 - 0.10 * decay * osc;
    sXZ = 1.0 + 0.06 * decay * osc;
  }

  const pos = new THREE.Vector3(origPos.x, currentY, origPos.z);
  const scale = new THREE.Vector3(
    origScale.x * sXZ,
    origScale.y * sY,
    origScale.z * sXZ
  );

  return { pos, rot: origRot.clone(), scale, visible: true, sY, sXZ };
}

const origPos = new THREE.Vector3(5.5, 0, -3.2);
const origScale = new THREE.Vector3(1, 1, 1);
const origRot = new THREE.Quaternion(0, 0, 0, 1);

console.log('--- PROGRESSION OF "ON THE SPOT CREATION" ---');
for (const step of [0.0, 0.1, 0.3, 0.5, 0.65, 0.75, 0.88, 0.95, 1.0]) {
  const res = evaluateSpotCreation(origPos, origRot, origScale, step);
  console.log(
    `t=${step.toFixed(2)} | ` +
    `Visible: ${res.visible} | ` +
    `Height: ${res.sY?.toFixed(2) || '0.00'}x | Width: ${res.sXZ?.toFixed(2) || '0.00'}x | ` +
    `Pos Y: ${res.pos.y.toFixed(2)}`
  );
}

const atZero = evaluateSpotCreation(origPos, origRot, origScale, 0.0);
if (atZero.visible) throw new Error('Must be invisible at t=0');

const atEnd = evaluateSpotCreation(origPos, origRot, origScale, 1.0);
if (atEnd.pos.distanceTo(origPos) > 0.00001 || Math.abs(atEnd.scale.y - 1.0) > 0.00001) {
  throw new Error('Must have 0 drift at t=1.0');
}

console.log('\nSUCCESS: On-the-spot creation kinematics verified!');
