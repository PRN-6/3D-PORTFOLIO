import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

// The source model is read-only. Character geometry, materials, textures and
// inverse bind matrices are copied byte-for-byte into self-contained GLBs.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(project, 'public/models/transition');
fs.mkdirSync(output, { recursive: true });
const source = fs.readFileSync(path.join(project, 'public/models/home-island.glb'));
const jsonLength = source.readUInt32LE(12);
const original = JSON.parse(source.subarray(20, 20 + jsonLength));
const originalBinary = source.subarray(28 + jsonLength);
const names = ['Frieren', 'Himmel', 'Heiter', 'Eisen'];
const deg = Math.PI / 180;
const vec = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rotation = (x = 0, y = 0, z = 0) =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler(x * deg, y * deg, z * deg, 'YXZ'));
const smooth = x => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const rise = (t, from, to) => smooth((t - from) / (to - from));
const parents = new Map();
original.nodes.forEach((node, index) => node.children?.forEach(child => parents.set(child, index)));
const read = index => {
  const accessor = original.accessors[index], view = original.bufferViews[accessor.bufferView];
  const count = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[accessor.type];
  const start = view.byteOffset + (accessor.byteOffset ?? 0);
  const values = [];
  const bytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  for (let i = 0; i < accessor.count; i++) {
    const row = [];
    for (let j = 0; j < count; j++) {
      const offset = start + i * (view.byteStride ?? count * bytes) + j * bytes;
      row.push(accessor.componentType === 5126 ? originalBinary.readFloatLE(offset)
        : bytes === 1 ? originalBinary.readUInt8(offset)
        : bytes === 2 ? originalBinary.readUInt16LE(offset) : originalBinary.readUInt32LE(offset));
    }
    values.push(row);
  }
  return values;
};

class GLB {
  constructor() {
    this.json = { asset: { version: '2.0', generator: 'Hero’s Home transition asset tools' },
      scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], skins: [], materials: [],
      animations: [], textures: [], images: [], samplers: [], accessors: [], bufferViews: [], buffers: [] };
    this.parts = [];
    this.length = 0;
  }
  view(bytes, options = {}) {
    const padding = (4 - this.length % 4) % 4;
    if (padding) { this.parts.push(Buffer.alloc(padding)); this.length += padding; }
    const index = this.json.bufferViews.length;
    this.json.bufferViews.push({ buffer: 0, byteOffset: this.length, byteLength: bytes.length, ...options });
    this.parts.push(bytes); this.length += bytes.length;
    return index;
  }
  accessor(values, type, componentType = 5126, target) {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const array = componentType === 5125 ? new Uint32Array(values.flat()) : new Float32Array(values.flat());
    const min = Array(size).fill(Infinity), max = Array(size).fill(-Infinity);
    Array.from(array).forEach((n, i) => { min[i % size] = Math.min(min[i % size], n); max[i % size] = Math.max(max[i % size], n); });
    const bufferView = this.view(Buffer.from(array.buffer), target ? { target } : {});
    const index = this.json.accessors.length;
    this.json.accessors.push({ bufferView, componentType, type, count: array.length / size, min, max });
    return index;
  }
  save(filename) {
    const binary = Buffer.concat([...this.parts, Buffer.alloc((4 - this.length % 4) % 4)]);
    this.json.buffers = [{ byteLength: binary.length }];
    const text = Buffer.from(JSON.stringify(this.json));
    const json = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 32)]);
    const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + json.length + binary.length, 8);
    header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(path.join(output, filename), Buffer.concat([header, json, binHeader, binary]));
  }
}

function extractCharacter(name) {
  const asset = new GLB(), data = asset.json;
  const rootIndex = original.nodes.findIndex(n => n.name === name);
  if (rootIndex < 0) throw new Error('Missing character ' + name);
  const mapping = new Map(), copies = new Map();
  function copyItem(kind, index) {
    const key = kind + index;
    if (copies.has(key)) return copies.get(key);
    const object = structuredClone(original[kind][index]);
    const target = data[kind].length;
    copies.set(key, target);
    data[kind].push(object);
    if (kind === 'accessors') object.bufferView = copyItem('bufferViews', object.bufferView);
    if (kind === 'bufferViews') {
      const view = original.bufferViews[index];
      data.bufferViews.pop();
      const options = { ...view }; delete options.buffer; delete options.byteOffset; delete options.byteLength;
      asset.view(originalBinary.subarray(view.byteOffset, view.byteOffset + view.byteLength), options);
    }
    if (kind === 'images') object.bufferView = copyItem('bufferViews', object.bufferView);
    if (kind === 'textures') {
      object.source = copyItem('images', object.source);
      if (object.sampler !== undefined) object.sampler = copyItem('samplers', object.sampler);
    }
    if (kind === 'materials') {
      const texture = object.pbrMetallicRoughness?.baseColorTexture;
      if (texture) texture.index = copyItem('textures', texture.index);
    }
    if (kind === 'meshes') for (const primitive of object.primitives) {
      primitive.indices = copyItem('accessors', primitive.indices);
      primitive.material = copyItem('materials', primitive.material);
      for (const key of Object.keys(primitive.attributes)) primitive.attributes[key] = copyItem('accessors', primitive.attributes[key]);
    }
    return target;
  }
  function visit(index) {
    mapping.set(index, data.nodes.length);
    const node = structuredClone(original.nodes[index]);
    data.nodes.push(node);
    node.children?.forEach(visit);
  }
  visit(rootIndex);
  for (const index of mapping.values()) {
    const node = data.nodes[index];
    if (node.children) node.children = node.children.map(child => mapping.get(child));
    if (node.mesh !== undefined) node.mesh = copyItem('meshes', node.mesh);
    if (node.skin !== undefined) {
      const sourceSkin = original.skins[node.skin];
      node.skin = data.skins.length;
      data.skins.push({ ...sourceSkin, skeleton: mapping.get(sourceSkin.skeleton),
        joints: sourceSkin.joints.map(j => mapping.get(j)), inverseBindMatrices: copyItem('accessors', sourceSkin.inverseBindMatrices) });
    }
  }
  data.nodes[0].translation = [0, 0, 0]; data.nodes[0].rotation = [0, 0, 0, 1];
  data.scenes[0].nodes = [0];
  data.nodes[0].extras = { ...data.nodes[0].extras, transitionAsset: true, units: 'metres', forward: '+Z' };
  const skinIndex = original.nodes.find(n => n.name === name + 'Costume').skin;
  const skin = original.skins[skinIndex];
  const matrices = read(skin.inverseBindMatrices);
  const joints = new Map();
  skin.joints.forEach((index, i) => {
    const key = original.nodes[index].name.slice(name.length);
    const rest = new THREE.Matrix4().fromArray(matrices[i]).invert();
    joints.set(key, { index, target: mapping.get(index), position: vec().setFromMatrixPosition(rest),
      parent: original.nodes[parents.get(index)].name.slice(name.length) });
  });
  const hip = joints.get('Pelvis').position.y;
  const idle = original.animations.find(a => a.name === name + '_Idle');
  const idleChannels = idle.channels.map(channel => ({
    key: original.nodes[channel.target.node].name.slice(name.length),
    property: channel.target.path,
    times: read(idle.samplers[channel.sampler].input).map(row => row[0]),
    values: read(idle.samplers[channel.sampler].output),
  }));
  function neutral(seconds = 0) {
    const pose = {};
    for (const [key, joint] of joints) {
      const node = original.nodes[joint.index];
      pose[key] = { rotation: new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
        translation: vec().fromArray(node.translation ?? [0, 0, 0]), scale: vec().fromArray(node.scale ?? [1, 1, 1]) };
    }
    for (const { key, property, times, values } of idleChannels) {
      let end = times.findIndex(time => time >= seconds);
      if (end < 0) end = times.length - 1;
      const start = Math.max(0, end - 1);
      const amount = start === end ? 0 : (seconds - times[start]) / (times[end] - times[start]);
      const target = pose[key][property];
      target.fromArray(values[start]);
      const next = target.clone().fromArray(values[end]);
      if (property === 'rotation') target.slerp(next, amount);
      else target.lerp(next, amount);
    }
    return pose;
  }
  return { asset, joints, name, hip, neutral };
}

function blend(a, b, weight) {
  const result = {};
  for (const key of Object.keys(a)) result[key] = {
    rotation: a[key].rotation.clone().slerp(b[key].rotation, weight),
    translation: a[key].translation.clone().lerp(b[key].translation, weight),
    scale: a[key].scale.clone().lerp(b[key].scale, weight),
  };
  return result;
}

function performancePose(actor, kind, time = 0) {
  const { name, joints, hip } = actor;
  const pose = actor.neutral();
  const mage = name === 'Frieren', hero = name === 'Himmel', priest = name === 'Heiter', dwarf = name === 'Eisen';
  const airborne = kind === 'fall' || kind === 'magic';
  const phase = time * Math.PI * 2;
  const sway = Math.sin(phase), swing = Math.cos(phase);
  const crouch = kind === 'crouch';
  const pelvisHeight = crouch ? hip - .12 : airborne ? hip - .018 : hip - .025;
  pose.Pelvis.translation.set(0, pelvisHeight, 0);
  pose.Spine.rotation.copy(rotation(airborne ? (hero ? -10 : dwarf ? 13 : priest ? -5 : 3) : crouch ? 14 : 2,
    airborne ? (dwarf ? 2 : 5) * sway : 0, airborne ? (priest ? 5 : 2) * swing : 0));
  pose.Head.rotation.copy(rotation(airborne ? (mage ? 10 : hero ? 8 : -3) : crouch ? -7 : -2, 3 * sway, priest && airborne ? -5 : 0));
  for (const [side, sign] of [['R', -1], ['L', 1]]) {
    const thigh = joints.get('Thigh' + side).position;
    const knee = joints.get('Calf' + side).position;
    const ankle = joints.get('Foot' + side).position;
    const upper = thigh.y - knee.y, lower = knee.y - ankle.y;
    const z = (crouch ? .025 : .012) * sign;
    const y = pelvisHeight - ankle.y;
    const distance = Math.min(upper + lower - .0001, Math.hypot(y, z));
    const alpha = Math.atan2(z, y) + Math.acos(THREE.MathUtils.clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
    const bend = Math.PI - Math.acos(THREE.MathUtils.clamp((upper * upper + lower * lower - distance * distance) / (2 * upper * lower), -1, 1));
    pose['Thigh' + side].rotation.copy(rotation(-alpha / deg, sign * 3));
    pose['Calf' + side].rotation.copy(rotation(bend / deg));
    pose['Foot' + side].rotation.copy(rotation((alpha - bend) / deg));
    if (airborne) {
      pose['Thigh' + side].rotation.copy(rotation((dwarf ? -27 : hero ? -25 + sign * 14 : mage ? -13 : -22) + 5 * Math.sin(phase + sign), sign * (priest ? 13 : 7)));
      pose['Calf' + side].rotation.copy(rotation((hero ? 42 + sign * 18 : mage ? 22 : 43) + 7 * Math.cos(phase + sign)));
      pose['Foot' + side].rotation.copy(rotation(-6 + 4 * sway));
    }
    let arm = crouch ? 26 : -20, elbow = crouch ? -20 : -27, spread = sign * 12;
    if (airborne) {
      arm = mage ? -23 : hero ? -48 + sign * 13 : priest ? -53 : -28;
      elbow = mage ? -44 : priest ? -57 : -38;
      spread = sign * (mage ? 22 : hero ? 37 : priest ? 49 : 18);
      arm += (priest ? 7 : 3) * Math.sin(phase + sign * .7);
      elbow += 4 * Math.cos(phase + sign * .8);
    }
    if (kind === 'magic') { arm = side === 'L' ? -98 : -66; elbow = side === 'L' ? -34 : -52; spread = sign * 20; }
    pose['Arm' + side].rotation.copy(rotation(arm, -sign * 9, spread));
    pose['Forearm' + side].rotation.copy(rotation(elbow));
    pose['Hand' + side].rotation.copy(rotation(5, 0, -sign * 4));
    if (pose['Drape' + side]) {
      pose['Drape' + side].scale.set(1, 1, 1);
      pose['Drape' + side].rotation.copy(rotation(airborne ? -24 + 6 * Math.sin(phase + sign) : crouch ? 9 : 3, sign * 5, sign * (airborne ? 9 : 1)));
    }
    if (mage) {
      pose['Tail' + side].rotation.copy(rotation(airborne ? -20 + 5 * Math.sin(phase + sign * .4) : -3, 0, sign * (airborne ? 9 : 2)));
      pose['TailTip' + side].rotation.copy(rotation(airborne ? -17 + 7 * Math.sin(phase - .6 + sign * .4) : -3, 0, sign * 3));
    }
    pose['Eye' + side].scale.set(1, 1, 1);
  }
  // The long cassock has dedicated cloth controls in the existing rig.
  for (let index = 0; priest && index < 8; index++) {
    const angle = index * Math.PI / 4;
    for (const layer of ['Fold', 'Hem']) {
      const key = layer + index;
      if (!pose[key]) continue;
      pose[key].rotation.identity();
      pose[key].translation.copy(joints.get(key).position).sub(joints.get('Pelvis').position);
      const amount = layer === 'Hem' ? 1 : .55;
      pose[key].translation.add(vec(Math.sin(angle) * (airborne ? .07 : .035) * amount,
        (airborne ? .055 + .012 * Math.sin(phase + angle) : hip - pelvisHeight) * amount,
        Math.cos(angle) * (airborne ? .06 : .035) * amount));
    }
  }
  if (mage) {
    pose.Book.translation.set(-.157, .041, -.002);
    pose.Book.rotation.copy(rotation(87, -66));
    pose.CoverL.rotation.copy(rotation(0, 0, 85)); pose.CoverR.rotation.copy(rotation(0, 0, -85));
    pose.TurningPage.scale.setScalar(.0001);
  }
  attachProps(actor, pose);
  return pose;
}

function attachProps(actor, pose) {
  const positions = {}, rotations = {};
  for (const [key, joint] of actor.joints) {
    const p = pose[key], parent = joint.parent;
    rotations[key] = parent in rotations ? rotations[parent].clone().multiply(p.rotation) : p.rotation.clone();
    positions[key] = parent in positions ? p.translation.clone().applyQuaternion(rotations[parent]).add(positions[parent]) : p.translation.clone();
  }
  const mage = actor.name === 'Frieren', priest = actor.name === 'Heiter';
  const hand = mage ? 'HandL' : 'HandR';
  const tool = pose.Tool;
  tool.rotation.copy(rotation(mage ? 2 : priest ? -4 : 20, priest ? -18 : 0, mage ? -18 : priest ? 0 : 24));
  const palm = positions[hand].clone().add(vec(0, -.018, .017).applyQuaternion(rotations[hand]));
  if (priest) palm.sub(vec(.098, 0, 0).applyQuaternion(tool.rotation));
  tool.translation.copy(palm).sub(positions.Pelvis);
}

const durations = { idle: 5.2, jump: 1.25, fall: 2.4, landing_prepare: 1.4, landing: 1.1, magic_land: 2.8 };
function samplePose(actor, clip, seconds) {
  const u = seconds / durations[clip], idle = actor.neutral();
  const fall = () => performancePose(actor, 'fall', 0);
  const ready = () => performancePose(actor, 'ready');
  let pose;
  if (clip === 'idle') return actor.neutral(seconds);
  if (clip === 'fall') return performancePose(actor, 'fall', u);
  if (clip === 'jump') {
    const low = performancePose(actor, 'crouch');
    pose = u < .36 ? blend(idle, low, rise(u, 0, .36))
      : blend(low, fall(), rise(u, .36, .86));
  }
  if (clip === 'landing_prepare') pose = blend(fall(), ready(), smooth(u));
  if (clip === 'landing') {
    const impact = performancePose(actor, 'crouch');
    pose = u < .22 ? blend(ready(), impact, rise(u, 0, .22))
      : blend(impact, idle, rise(u, .22, .94));
  }
  if (clip === 'magic_land') {
    const casting = performancePose(actor, 'magic', .12 * Math.sin(Math.PI * u));
    pose = u < .28 ? blend(fall(), casting, rise(u, 0, .28))
      : blend(casting, ready(), rise(u, .74, 1));
  }
  // Re-solve the prop grip after blending rotations so there is no independent
  // interpolation arc between the small hand and its weapon or mug.
  if (!(clip === 'jump' && u === 0) && !(clip === 'landing' && u >= .94)) attachProps(actor, pose);
  return pose;
}

const manifest = { version: 1, units: 'metres', up: '+Y', forward: '+Z', rootMotion: 'External root translation. Clips animate the skeleton around an origin at the soles.',
  source: '/models/home-island.glb', characters: {}, effects: '/models/transition/frieren-magic.glb', showcase: '/models/transition/project-display.glb' };
for (const name of names) {
  const actor = extractCharacter(name), { asset, joints } = actor;
  const clips = ['idle', 'jump', 'fall', 'landing_prepare', 'landing'];
  if (name === 'Frieren') clips.push('magic_land');
  const slug = name.toLowerCase();
  for (const clip of clips) {
    const duration = durations[clip];
    const count = Math.ceil(duration * 24);
    const times = Array.from({ length: count + 1 }, (_, i) => i * duration / count);
    const poses = times.map(time => samplePose(actor, clip, time));
    const input = asset.accessor(times, 'SCALAR'), samplers = [], channels = [];
    for (const [key, joint] of joints) for (const [property, type] of [['rotation', 'VEC4'], ['translation', 'VEC3'], ['scale', 'VEC3']]) {
      const values = poses.map(pose => pose[key][property].toArray());
      if (property === 'rotation') for (let i = 1; i < values.length; i++) {
        if (values[i].reduce((sum, x, k) => sum + x * values[i - 1][k], 0) < 0) values[i] = values[i].map(x => -x);
      }
      // Constant bindings are retained so every clip restores all affected joints.
      const constant = values.every(row => row.every((x, i) => Math.abs(x - values[0][i]) < 1e-6));
      const valuesIndex = asset.accessor(constant ? [values[0], values.at(-1)] : values, type);
      const sampler = samplers.length;
      samplers.push({ input: constant ? asset.accessor([0, duration], 'SCALAR') : input, output: valuesIndex, interpolation: 'LINEAR' });
      channels.push({ sampler, target: { node: joint.target, path: property } });
    }
    asset.json.animations.push({ name: slug + '_' + clip, samplers, channels,
      extras: { loop: clip === 'fall' || clip === 'idle', rootMotion: 'external', takeoff: clip === 'jump' ? .52 : undefined } });
  }
  const neutral = actor.neutral();
  for (const [key, joint] of joints) {
    const node = asset.json.nodes[joint.target];
    node.translation = neutral[key].translation.toArray(); node.rotation = neutral[key].rotation.toArray(); node.scale = neutral[key].scale.toArray();
  }
  asset.save(slug + '.glb');
  const sourceImage = original.images.find(image => image.name === name + 'ExpressionAtlas');
  const view = original.bufferViews[sourceImage.bufferView];
  fs.writeFileSync(path.join(output, slug + '-expressions.png'), originalBinary.subarray(view.byteOffset, view.byteOffset + view.byteLength));
  manifest.characters[slug] = { url: '/models/transition/' + slug + '.glb', texture: slug + '-expressions.png',
    root: name, clips: Object.fromEntries(clips.map(clip => [clip, { name: slug + '_' + clip, duration: durations[clip], loop: clip === 'fall' || clip === 'idle' }])) };
  console.log(name, asset.json.animations.length, 'clips', (fs.statSync(path.join(output, slug + '.glb')).size / 1e6).toFixed(2), 'MB');
}

function material(asset, name, color, metalness = 0, roughness = .5, emission, alpha = 1) {
  const c = new THREE.Color(color);
  const value = { name, pbrMetallicRoughness: { baseColorFactor: [...c.toArray(), alpha], metallicFactor: metalness, roughnessFactor: roughness } };
  if (emission) value.emissiveFactor = new THREE.Color(emission).toArray();
  if (alpha < 1) { value.alphaMode = 'BLEND'; value.doubleSided = true; }
  asset.json.materials.push(value);
  return asset.json.materials.length - 1;
}
function mesh(asset, name, geometry, material, position = [0, 0, 0], options = {}) {
  const attributes = {};
  for (const [source, target, type] of [['position', 'POSITION', 'VEC3'], ['normal', 'NORMAL', 'VEC3'], ['uv', 'TEXCOORD_0', 'VEC2']]) {
    const attribute = geometry.getAttribute(source);
    if (attribute) attributes[target] = asset.accessor(Array.from(attribute.array), type, 5126, 34962);
  }
  const primitive = { attributes, material };
  if (geometry.index) primitive.indices = asset.accessor(Array.from(geometry.index.array), 'SCALAR', 5125, 34963);
  const index = asset.json.nodes.length;
  asset.json.nodes.push({ name, mesh: asset.json.meshes.length, translation: position, ...options });
  asset.json.meshes.push({ name, primitives: [primitive] });
  asset.json.scenes[0].nodes.push(index);
  geometry.dispose();
  return index;
}
function roundedBox(width, height, depth, radius) {
  const shape = new THREE.Shape(), x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius); shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius); shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - radius, steps: 1, bevelEnabled: true,
    bevelSegments: 3, bevelSize: radius / 2, bevelThickness: radius / 2, curveSegments: 7 });
  geometry.translate(0, 0, -depth / 2 + radius / 2);
  return geometry;
}

const display = new GLB();
const shell = material(display, 'Graphite anodized housing', '#171b27', .68, .31);
const rim = material(display, 'Brushed titanium bevel', '#626a83', .82, .26);
const inset = material(display, 'Recessed ink backing', '#090e19', .24, .43);
const glass = material(display, 'Project preview replacement surface', '#182237', .14, .30);
const accent = material(display, 'Quiet violet seam', '#5c518f', .4, .3, '#31214d');
const brass = material(display, 'Satin champagne feet', '#8f7d5e', .8, .4);
mesh(display, 'DisplayHousing', roundedBox(5.6, 3.8, .65, .11), shell, [0, 2.25, 0]);
mesh(display, 'TitaniumInnerBezel', roundedBox(5.38, 3.58, .10, .07), rim, [0, 2.25, .315]);
mesh(display, 'DeepInset', roundedBox(5.25, 3.45, .065, .05), inset, [0, 2.25, .375]);
mesh(display, 'PreviewWell', roundedBox(4.90, 2.82, .045, .04), accent, [0, 2.51, .414]);
const preview = new THREE.PlaneGeometry(4.76, 2.6775);
mesh(display, 'ProjectPreview', preview, glass, [0, 2.54, .442], { extras: { replaceMaterial: true, aspectRatio: '16:9', width: 4.76, height: 2.6775, uvOrigin: 'bottom-left' } });
mesh(display, 'CaptionSurface', roundedBox(4.90, .45, .034, .018), inset, [0, .82, .421]);
for (const [name, position, extras] of [
  ['ProjectTitleAnchor', [-2.32, .91, .447], { width: 4.64, height: .14, align: 'left' }],
  ['ProjectDescriptionAnchor', [-2.32, .73, .447], { width: 4.64, height: .11, align: 'left' }],
  ['NextModuleAnchor', [6.4, 0, 0], {}],
]) { display.json.scenes[0].nodes.push(display.json.nodes.length); display.json.nodes.push({ name, translation: position, extras }); }
const placeholderText = JSON.parse(fs.readFileSync(path.join(project, 'scripts/assets/showcase-placeholder-outlines.json'), 'utf8'));
display.json.extensionsUsed = ['KHR_materials_unlit'];
for (const label of placeholderText) {
  const outline = new THREE.ShapePath();
  for (const [command, ...coordinates] of label.commands) {
    if (command === 'closePath') outline.currentPath.closePath();
    else outline[command](...coordinates);
  }
  const geometry = new THREE.ShapeGeometry(outline.toShapes(), 8);
  geometry.scale(label.size, label.size, 1);
  const color = label.name === 'DummyProjectTitle' ? '#f0e6d6' : '#b5bed3';
  const paint = material(display, label.name + 'Paint', color);
  display.json.materials[paint].extensions = { KHR_materials_unlit: {} };
  const index = mesh(display, label.name, geometry, paint, [0, 0, .003], {
    extras: { placeholder: true, text: label.text },
  });
  display.json.scenes[0].nodes = display.json.scenes[0].nodes.filter(node => node !== index);
  display.json.nodes.find(node => node.name === label.anchor).children = [index];
}
for (const sign of [-1, 1]) {
  mesh(display, 'Support' + sign, roundedBox(.14, .50, .40, .032), shell, [sign * 2.05, .31, -.07]);
  mesh(display, 'Foot' + sign, roundedBox(.58, .10, .94, .035), brass, [sign * 2.05, .05, -.07]);
}
mesh(display, 'RecessedLowerLight', roundedBox(3.92, .014, .012, .003), accent, [0, .49, .434]);
display.save('project-display.glb');

const magic = new GLB();
const gold = material(magic, 'Warm glyph', '#e9d4a4', 0, 1, '#e9d4a4', .72);
const violet = material(magic, 'Pale violet energy', '#c9b4f0', 0, 1, '#a78ee6', .46);
const field = material(magic, 'Transparent protection field', '#c6b7ef', 0, 1, '#82759e', .075);
function ringGeometry(radius, width, segments = 128) {
  const geometry = new THREE.RingGeometry(radius - width / 2, radius + width / 2, segments);
  geometry.rotateX(-Math.PI / 2); return geometry;
}
mesh(magic, 'LandingField', new THREE.CircleGeometry(2.10, 96).rotateX(-Math.PI / 2), field, [0, .015, 0]);
mesh(magic, 'OuterEnergyRing', ringGeometry(2.08, .013), violet, [0, .026, 0]);
mesh(magic, 'InnerEnergyRing', ringGeometry(1.88, .009), gold, [0, .032, 0]);
mesh(magic, 'SpellRing', ringGeometry(1.16, .010), gold, [0, .039, 0]);
const pieces = [];
function line(a, b, thickness) {
  const direction = b.clone().sub(a), geometry = new THREE.CylinderGeometry(thickness, thickness, direction.length(), 5);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(vec(0, 1, 0), direction.normalize()));
  geometry.translate(...a.clone().add(b).multiplyScalar(.5).toArray()); return geometry;
}
for (let index = 0; index < 12; index++) {
  const angle = index * Math.PI / 6;
  const a = vec(1.43 * Math.cos(angle), .045, 1.43 * Math.sin(angle));
  const b = vec(1.56 * Math.cos(angle + .035), .045, 1.56 * Math.sin(angle + .035));
  const c = vec(1.69 * Math.cos(angle), .045, 1.69 * Math.sin(angle));
  pieces.push(line(a, b, .006), line(b, c, .006));
}
for (let i = 0; i < 6; i++) pieces.push(line(vec(1.15 * Math.cos(i * Math.PI / 3), .045, 1.15 * Math.sin(i * Math.PI / 3)),
  vec(1.15 * Math.cos((i + 2) * Math.PI / 3), .045, 1.15 * Math.sin((i + 2) * Math.PI / 3)), .004));
const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
mesh(magic, 'CircularGlyph', mergeGeometries(pieces), gold);
pieces.forEach(g => g.dispose());
magic.save('frieren-magic.glb');
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Showcase, magic geometry, textures and manifest exported.');

