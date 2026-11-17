import * as THREE from 'three';
import { DAY_LENGTH, members, sampleWalk, schedules, speakerAt } from './partySchedule';
import type { Beat, Member } from './partySchedule';
import { createPartyPalette } from './partyMaterials';
import { dayNightManager } from '../../config/dayNightState';

const { smoothstep, damp, clamp } = THREE.MathUtils;
const turn = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

function animateMember(name: Member, root: THREE.Object3D, clips: THREE.AnimationClip[], palette: ReturnType<typeof createPartyPalette>) {
  const mixer = new THREE.AnimationMixer(root);
  const paint = palette.dress(root);
  const eyelid = root.getObjectByName(name + 'EyeL');
  const cadence = members.indexOf(name) * .63;
  const actions = new Map<string, THREE.AnimationAction>();
  for (const clip of clips) {
    if (clip.name.startsWith(name + '_')) actions.set(clip.name.slice(name.length + 1), mixer.clipAction(clip));
  }
  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const head = root.getObjectByName(name + 'Head');
  const baseGaze = new THREE.Quaternion();
  const eyeTurn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let gaze = 0;
  let angle = 0;
  let initialized = false;
  let current: THREE.AnimationAction | undefined;
  let currentBeat: Beat | undefined;
  const lastGroundSample = new THREE.Vector3(Infinity, 0, Infinity);
  let groundHeight = 0;
  const itinerary = schedules[name];

  function update(t: number, delta: number, floor: (x: number, z: number) => number) {
    const beat = itinerary.find(b => t >= b.start && t < b.end)!;
    const elapsed = t - beat.start;
    const remaining = beat.end - t;
    let label: string = beat.action;
    let yaw: number;
    let rate = 1;
    if (beat.action === 'Walk') {
      rate = sampleWalk(beat, t, position, tangent);
      yaw = Math.atan2(tangent.x, tangent.z);
    } else {
      const station = beat.station;
      yaw = station.facing;
      const seat = station.seatDepth ?? 0;
      const startBlend = beat.start === 0 ? 1 : smoothstep(elapsed, .35, 1.38);
      const endBlend = beat.end === DAY_LENGTH ? 1 : smoothstep(remaining, .15, 1.18);
      const seated = startBlend * endBlend;
      const offset = seat * (1 - seated);
      position.set(station.at[0] + Math.sin(yaw)*offset, 0, station.at[1] + Math.cos(yaw)*offset);
      if (beat.action === 'Gather') label = speakerAt(t) === name ? 'Speak' : 'Listen';
      if (beat.action === 'Talk' && name === 'Himmel' && Math.floor(t/3)%2 === 0) label = 'Watch';
      if (beat.action === 'Talk' && name === 'Heiter' && Math.floor(t/3)%2 !== 0) label = 'Watch';
      if (seat && ((beat.start !== 0 && elapsed < .35) || (beat.end !== DAY_LENGTH && remaining < 1.18))) label = 'Idle';
    }
    angle = initialized ? angle + turn(angle, yaw) * (1 - Math.exp(-delta*8.5)) : yaw;
    root.rotation.set(0, angle, 0);
    if (currentBeat !== beat || position.distanceToSquared(lastGroundSample) > .004) {
      groundHeight = floor(position.x, position.z);
      lastGroundSample.copy(position);
    }
    root.position.y = initialized ? damp(root.position.y, groundHeight, 22, delta) : groundHeight;
    root.position.x = position.x;
    root.position.z = position.z;
    const next = actions.get(label);
    if (!next) throw new Error('Missing party animation ' + name + '_' + label);
    if (next !== current) {
      const fade = label === 'Walk' || current?.getClip().name.endsWith('_Walk') ? .32 : .84;
      next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      if (label !== 'Walk') next.time = members.indexOf(name) * .63;
      if (current) current.crossFadeTo(next, fade, false);
      current = next;
    }
    next.timeScale = rate;
    if (head) head.quaternion.copy(baseGaze);
    mixer.update(delta);
    const speaking = label === 'Talk' || label === 'Speak';
    const phrase = Math.sin(t * 10.7 + cadence) + .48 * Math.sin(t * 16.3 - cadence);
    const smiling = label === 'Listen' && Math.sin(t * .92 + cadence * 3) > .94;
    paint?.setExpression((eyelid?.scale.y ?? 1) < .53 ? 'blink' :
      smiling ? 'smile' : speaking && phrase > .12 ? 'speaking' : 'neutral');
    if (head) baseGaze.copy(head.quaternion);
    initialized = true;
    currentBeat = beat;
  }

  function look(t: number, delta: number, party: Map<Member, THREE.Object3D>) {
    if (!head || !currentBeat) return;
    let target: THREE.Object3D | undefined;
    if (currentBeat.action === 'Gather') {
      const speaker = speakerAt(t);
      target = party.get(speaker === name ? members[(members.indexOf(name) + 1 + Math.floor(t/4)%2)%4] : speaker);
    } else if (currentBeat.action === 'Watch') {
      target = party.get(Math.floor(t/5)%2 === 0 ? 'Himmel' : 'Eisen');
    } else if (currentBeat.action === 'Talk') target = party.get(name === 'Himmel' ? 'Heiter' : 'Himmel');
    const direction = target ? Math.atan2(target.position.x - root.position.x, target.position.z - root.position.z) : angle;
    gaze = damp(gaze, clamp(turn(angle, direction), -.48, .48), 3.2, delta);
    head.quaternion.copy(baseGaze).multiply(eyeTurn.setFromAxisAngle(up, gaze));
  }
  return { update, look, dispose() { mixer.stopAllAction(); mixer.uncacheRoot(root); paint?.dispose(); } };
}

function daylight(scene: THREE.Scene, parent: THREE.Object3D) {
  const settings = [
    ['HomeSun', '#a6c5ff', 1.1],     // Silvery moonlight
    ['HomeAmbient', '#1e2540', 0.6],  // Cool nocturnal ambient
    ['HomeRim', '#818cf8', 1.4],      // Twilight rim highlight
    ['HomeSky', '#312e81', 0.5],      // Celestial bounce
  ] as const;
  const lights = settings.flatMap(([name, night, level]) => {
    const light = scene.getObjectByName(name) as THREE.Light | undefined;
    return light ? [{ light, night: new THREE.Color(night), level }] : [];
  });

  // Find house window, gate lantern and hearth materials
  const lampMats: THREE.MeshStandardMaterial[] = [];
  parent.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = (child as THREE.Mesh).material;
      const list = Array.isArray(m) ? m : [m];
      for (const mat of list) {
        if (mat && mat.name === 'LamplightAndEmbers' && !lampMats.includes(mat as THREE.MeshStandardMaterial)) {
          lampMats.push(mat as THREE.MeshStandardMaterial);
        }
      }
    }
  });

  const fire = new THREE.PointLight('#ff9d42', 5.5, 9, 2);
  fire.name = 'CampfireGlow';
  fire.position.set(2.58, .69, 2.88);
  parent.add(fire);
  return {
    update(t: number) {
      // Locked permanently to night
      for (const { light, night, level } of lights) {
        light.color.copy(night);
        light.intensity = level;
      }
      fire.intensity = 5.2 * (1 + .053 * Math.sin(t * 5.4) + .036 * Math.sin(t * 8.8));

      // Warm glowing windows in the cottage and bright campfire embers (always on at night)
      const glow = 2.7 * (1 + 0.04 * Math.sin(t * 4.2));
      for (const mat of lampMats) {
        mat.emissiveIntensity = glow;
      }
    },
    dispose() {
      for (const mat of lampMats) { mat.emissiveIntensity = 1.0; }
      fire.removeFromParent();
      fire.dispose();
    },
  };
}

function spell(staff: THREE.Object3D) {
  // A small open seal forms around the staff gem as Frieren extends her arm.
  const vertices: number[] = [];
  const line = (a: number, b: number, radius: number) => vertices.push(
    radius*Math.cos(a), radius*Math.sin(a), 0, radius*Math.cos(b), radius*Math.sin(b), 0,
  );
  for (let i = 0; i < 48; i++) line(i*Math.PI/24, (i+1)*Math.PI/24, .22);
  for (let i = 0; i < 6; i++) line(i*Math.PI/3, (i+2)*Math.PI/3, .18);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.LineBasicMaterial({ color: '#b6f5ea', transparent: true, depthWrite: false, toneMapped: false });
  const seal = new THREE.LineSegments(geometry, material);
  seal.position.y = .741;
  staff.add(seal);
  const casting = schedules.Frieren.find(beat => beat.action === 'Cast')!;
  return {
    update(t: number) {
      const elapsed = t - casting.start;
      const fade = smoothstep(elapsed, .5, 1.7) * (1 - smoothstep(t, casting.end-1.1, casting.end));
      seal.visible = fade > .001;
      seal.rotation.z = t*.67;
      seal.scale.setScalar((.75 + .24*Math.sin(elapsed*1.37)) * fade);
      material.opacity = .9*fade;
    },
    dispose() { seal.removeFromParent(); geometry.dispose(); material.dispose(); },
  };
}

export function createPartyLife(model: THREE.Object3D, scene: THREE.Scene, clips: THREE.AnimationClip[]) {
  const party = new Map<Member, THREE.Object3D>();
  for (const name of members) {
    const root = model.getObjectByName(name);
    if (!root?.userData.partyMember) return;
    party.set(name, root);
  }
  const palette = createPartyPalette();
  const actors = members.map(name => animateMember(name, party.get(name)!, clips, palette));
  const light = daylight(scene, model);
  const magic = spell(model.getObjectByName('FrierenTool')!);
  const surfaces = ['WaystonePath', 'PracticeYard', 'PorchAndOakDoor'].map(name => model.getObjectByName(name)).filter((o): o is THREE.Object3D => !!o);
  const ray = new THREE.Raycaster();
  ray.ray.direction.set(0,-1,0);
  const origin = new THREE.Vector3();
  const hits: THREE.Intersection[] = [];
  model.updateWorldMatrix(true, true);
  function floor(x: number, z: number) {
    model.localToWorld(origin.set(x,.32,z));
    ray.ray.origin.copy(origin);
    hits.length = 0;
    ray.intersectObjects(surfaces, true, hits);
    return hits.length ? Math.max(0, model.worldToLocal(origin.copy(hits[0].point)).y) : 0;
  }
  let time = 0;
  function update(delta: number) {
    time = (time + delta) % DAY_LENGTH;
    dayNightManager.updateTime(time);
    for (const actor of actors) actor.update(time, delta, floor);
    for (const actor of actors) actor.look(time, delta, party);
    light.update(time);
    magic.update(time);
  }
  update(0);
  return { update, dispose() { actors.forEach(a => a.dispose()); palette.dispose(); light.dispose(); magic.dispose(); } };
}

