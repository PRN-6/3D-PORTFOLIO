import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const outputDir = path.resolve('public/models/blue-flower-garden');
fs.mkdirSync(outputDir, { recursive: true });

['island', 'flowers', 'vegetation', 'environment', 'effects', 'previews'].forEach(sub => {
  fs.mkdirSync(path.join(outputDir, sub), { recursive: true });
});

/**
 * Robust binary GLB (glTF 2.0) writer
 */
class GLB {
  constructor() {
    this.json = {
      asset: { version: '2.0', generator: 'Level 05: Blue Flower Garden 3D Asset Tool' },
      scene: 0,
      scenes: [{ nodes: [] }],
      nodes: [],
      meshes: [],
      skins: [],
      materials: [],
      animations: [],
      textures: [],
      images: [],
      samplers: [],
      accessors: [],
      bufferViews: [],
      buffers: []
    };
    this.parts = [];
    this.length = 0;
  }

  view(bytes, options = {}) {
    const padding = (4 - this.length % 4) % 4;
    if (padding) {
      this.parts.push(Buffer.alloc(padding));
      this.length += padding;
    }
    const index = this.json.bufferViews.length;
    this.json.bufferViews.push({ buffer: 0, byteOffset: this.length, byteLength: bytes.length, ...options });
    this.parts.push(bytes);
    this.length += bytes.length;
    return index;
  }

  accessor(values, type, componentType = 5126, target) {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const array = componentType === 5125 ? new Uint32Array(values.flat()) : new Float32Array(values.flat());
    const min = Array(size).fill(Infinity);
    const max = Array(size).fill(-Infinity);
    Array.from(array).forEach((n, i) => {
      min[i % size] = Math.min(min[i % size], n);
      max[i % size] = Math.max(max[i % size], n);
    });
    const bufferView = this.view(Buffer.from(array.buffer), target ? { target } : {});
    const index = this.json.accessors.length;
    this.json.accessors.push({ bufferView, componentType, type, count: array.length / size, min, max });
    return index;
  }

  save(relativePath) {
    const filePath = path.join(outputDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    for (const [key, value] of Object.entries(this.json)) {
      if (Array.isArray(value) && value.length === 0) delete this.json[key];
    }
    for (const node of this.json.nodes) {
      if (node.children?.length === 0) delete node.children;
    }

    const binary = Buffer.concat([...this.parts, Buffer.alloc((4 - this.length % 4) % 4)]);
    this.json.buffers = [{ byteLength: binary.length }];
    const text = Buffer.from(JSON.stringify(this.json));
    const json = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 32)]);

    const header = Buffer.alloc(20);
    header.writeUInt32LE(0x46546c67, 0); // 'glTF'
    header.writeUInt32LE(2, 4);          // version 2
    header.writeUInt32LE(28 + json.length + binary.length, 8);
    header.writeUInt32LE(json.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16); // 'JSON'

    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binary.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

    fs.writeFileSync(filePath, Buffer.concat([header, json, binHeader, binary]));
  }
}

/**
 * Dreamy Pastel Color Palette for Blue Flower Garden
 */
const palette = {
  // Flowers - Vibrant Shades of Blue, Cyan, Lavender, Violet, White & Pink
  flowerBlue1:      ['#3b7ef8', 0, 0.92],              // Vivid Nemophila Sky Blue
  flowerBlue2:      ['#235ed9', 0, 0.90],              // Deep Royal Blue
  flowerCyan:       ['#60abf8', 0, 0.92],              // Bright Pastel Cyan
  flowerLavender:   ['#9485f5', 0, 0.92],              // Soft Dreamy Lavender
  flowerViolet:     ['#664fd4', 0, 0.90],              // Royal Violet Accent
  flowerWhite:      ['#ffffff', 0, 0.85],              // Pure Star White
  flowerPink:       ['#f7bdd8', 0, 0.92],              // Delicate Blush Pink
  flowerCenterGold: ['#f8cd36', 0.1, 0.55, '#ffdc42'], // Golden Yellow Stamen with subtle glow
  flowerCenterWhite:['#ffffff', 0, 0.8],               // White throat gradient ring

  // Stems & Leaves
  stemGreen:        ['#367843', 0, 0.95],              // Slender Green Stem
  leafGreen:        ['#42884d', 0, 0.92],              // Fresh Flower Leaf
  darkLeaf:         ['#235830', 0, 0.95],              // Undergrowth Deep Green

  // Island Terrain & Meadow
  meadowGrass:      ['#3e8446', 0, 0.95],              // Lush Vibrant Grass Surface
  meadowSunny:      ['#529e5a', 0, 0.95],              // Sunlit Crest Grass
  meadowSoil:       ['#4a3628', 0, 0.95],              // Rich Fantasy Soil
  rockSurface:      ['#4b546a', 0, 0.90],              // Fantasy Rock Slate
  rockHighlight:    ['#7a87a2', 0, 0.85],              // Rock Ridge Light
  rockDark:         ['#282d3b', 0, 0.95],              // Deep Underside Stalactite

  // Vegetation
  treeBark:         ['#584233', 0, 0.95],              // Gnarled Cedar Trunk
  treeBlossomBlue:  ['#88a5e3', 0, 0.95],              // Pastel Flowering Canopy
  treeBlossomLila:  ['#aa9be6', 0, 0.95],              // Soft Wisteria Accent
  shrubGreen:       ['#448250', 0, 0.95],              // Garden Shrub

  // Atmosphere, Clouds & Crystals
  cloudWhite:       ['#ffffff', 0, 0.98],              // Fluffy Cloud Top
  cloudPink:        ['#fde2ee', 0, 0.98],              // Cloud Sunlight Blush
  cloudLavender:    ['#dad3eb', 0, 0.98],              // Cloud Lavender Shadow
  manaCrystal:      ['#84e5ff', 0.2, 0.3, '#75ddf6'],  // Glowing Mana Crystal
  manaCrystalGlow:  ['#aff1ff', 0.1, 0.2, '#9eecff'],  // Core Crystal Brightness
  goldDetail:       ['#c9a85d', 0.6, 0.35],            // Metallic Accent
};

let rngSeed = 54821;
const rnd = () => {
  rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0;
  return rngSeed / 4294967296;
};
const v = (...a) => new T.Vector3(...a);

class Asset {
  constructor() {
    this.glb = new GLB();
    this.roots = [];
    this.parts = new Map();
    this.materials = {};

    for (const [name, [color, metallicFactor, roughnessFactor, emission]] of Object.entries(palette)) {
      const material = {
        name,
        pbrMetallicRoughness: {
          baseColorFactor: [...new T.Color(color).toArray(), 1],
          metallicFactor: metallicFactor ?? 0,
          roughnessFactor: roughnessFactor ?? 1
        }
      };
      if (emission) {
        material.emissiveFactor = new T.Color(emission).toArray();
      }
      if (
        name.startsWith('flower') ||
        name.startsWith('leaf') ||
        name.startsWith('stem') ||
        name === 'darkLeaf' ||
        name.startsWith('cloud')
      ) {
        material.doubleSided = true;
      }
      this.materials[name] = this.glb.json.materials.length;
      this.glb.json.materials.push(material);
    }
  }

  group(name, position = [0, 0, 0], extras = {}, parent = null, rotation = null) {
    const id = this.glb.json.nodes.length;
    const node = { name, translation: position, extras, children: [] };
    if (rotation) {
      const q = new T.Quaternion().setFromEuler(new T.Euler(...rotation));
      node.rotation = [q.x, q.y, q.z, q.w];
    }
    this.glb.json.nodes.push(node);
    if (parent === null) {
      this.glb.json.scenes[0].nodes.push(id);
    } else {
      this.glb.json.nodes[parent].children.push(id);
    }
    return id;
  }

  add(root, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    geometry.applyMatrix4(
      new T.Matrix4().compose(
        v(...position),
        new T.Quaternion().setFromEuler(new T.Euler(...rotation)),
        v(...scale)
      )
    );
    if (geometry.index) geometry = geometry.toNonIndexed();
    geometry.deleteAttribute('uv1');
    const key = root + '|' + mat;
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(geometry);
  }

  box(root, p, s, mat, rotation = [0, 0, 0]) {
    this.add(root, new T.BoxGeometry(...s), mat, p, rotation);
  }

  rod(root, a, b, r, mat, sides = 6) {
    const av = v(...a), bv = v(...b), d = bv.clone().sub(av);
    const g = new T.CylinderGeometry(r, r, d.length(), sides);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0, 1, 0), d.normalize()));
    this.add(root, g, mat, av.add(bv).multiplyScalar(0.5).toArray());
  }

  ring(root, p, r, t, mat, rotation = [Math.PI / 2, 0, 0]) {
    this.add(root, new T.TorusGeometry(r, t, 5, 24), mat, p, rotation);
  }

  animateFloat(root, name, duration = 3.5, amplitude = 0.12, rotAmp = 0.08) {
    const input = this.glb.accessor(Array.from({ length: 33 }, (_, i) => i * duration / 32), 'SCALAR');
    const origin = this.glb.json.nodes[root].translation || [0, 0, 0];
    const positions = [], rotations = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32 * Math.PI * 2;
      positions.push([origin[0], origin[1] + Math.sin(t) * amplitude, origin[2]]);
      rotations.push(
        new T.Quaternion().setFromEuler(
          new T.Euler(rotAmp * Math.sin(t * 1.5), rotAmp * 1.8 * Math.cos(t), rotAmp * 0.8 * Math.sin(t))
        ).toArray()
      );
    }
    this.glb.json.animations.push({
      name,
      samplers: [
        { input, output: this.glb.accessor(positions, 'VEC3'), interpolation: 'LINEAR' },
        { input, output: this.glb.accessor(rotations, 'VEC4'), interpolation: 'LINEAR' }
      ],
      channels: [
        { sampler: 0, target: { node: root, path: 'translation' } },
        { sampler: 1, target: { node: root, path: 'rotation' } }
      ]
    });
  }

  save(relativePath) {
    for (const [key, geometries] of this.parts) {
      const [parent, mat] = key.split('|');
      const merged = mergeGeometries(geometries);
      const g = mergeVertices(merged);
      merged.dispose();

      const index = [], pa = g.attributes.position, va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3();
      for (let i = 0; i < g.index.count; i += 3) {
        const ia = g.index.getX(i), ib = g.index.getX(i + 1), ic = g.index.getX(i + 2);
        va.fromBufferAttribute(pa, ia);
        vb.fromBufferAttribute(pa, ib);
        vc.fromBufferAttribute(pa, ic);
        if (vb.sub(va).cross(vc.sub(va)).lengthSq() > 1e-16) {
          index.push(ia, ib, ic);
        }
      }
      g.setIndex(index);

      const attributes = {};
      for (const [attrName, semantic, type] of [
        ['position', 'POSITION', 'VEC3'],
        ['normal', 'NORMAL', 'VEC3'],
        ['uv', 'TEXCOORD_0', 'VEC2']
      ]) {
        if (g.attributes[attrName]) {
          attributes[semantic] = this.glb.accessor(Array.from(g.attributes[attrName].array), type, 5126, 34962);
        }
      }

      const id = this.glb.json.nodes.length;
      this.glb.json.nodes.push({
        name: this.glb.json.nodes[+parent].name + '_' + mat,
        mesh: this.glb.json.meshes.length
      });
      this.glb.json.nodes[+parent].children.push(id);
      this.glb.json.meshes.push({
        primitives: [{
          attributes,
          indices: this.glb.accessor(Array.from(g.index.array), 'SCALAR', 5125, 34963),
          material: this.materials[mat]
        }]
      });

      g.dispose();
      geometries.forEach(geo => geo.dispose());
    }

    const used = [...new Set(this.glb.json.meshes.flatMap(m => m.primitives.map(p => p.material)))];
    for (const m of this.glb.json.meshes) {
      for (const p of m.primitives) {
        p.material = used.indexOf(p.material);
      }
    }
    this.glb.json.materials = used.map(i => this.glb.json.materials[i]);

    this.parts.clear();
    this.glb.save(relativePath);
    const size = (fs.statSync(path.join(outputDir, relativePath)).size / 1024).toFixed(1);
    console.log(`[Asset Saved] ${relativePath.padEnd(42)} ${size.padStart(7)} KB (${this.glb.json.meshes.length} mesh batches)`);
  }
}

// ============================================================================
// Procedural Geometry & Terrain Functions
// ============================================================================

/**
 * Organic meadow topography elevation
 */
function terrainHeight(x, z) {
  const d2 = x * x + z * z;
  const knoll = 0.45 * Math.exp(-d2 / 18);
  const waves = 0.14 * Math.sin(x * 0.42) * Math.cos(z * 0.42) + 0.08 * Math.sin(x * 0.75 + z * 0.35);
  const edgeFall = Math.max(0, (Math.sqrt(d2) - 6.8) * 0.09);
  return knoll + waves - edgeFall;
}

/**
 * Island perimeter radius at polar angle theta
 */
function islandRadius(theta) {
  return 8.8 + 0.75 * Math.sin(theta * 3 + 0.4) + 0.45 * Math.cos(theta * 5 - 0.6) - 0.3 * Math.sin(theta * 2);
}

function makeRock(asset, root, p, s, mat = 'rockSurface', detail = 0) {
  const rot = [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI];
  asset.add(root, new T.IcosahedronGeometry(1, detail), mat, p, rot, s);
}

function makeCrystal(asset, root, p, s = 0.5, mat = 'manaCrystal') {
  const rot = [0.15 + rnd() * 0.2, rnd() * Math.PI * 2, 0.15 + rnd() * 0.2];
  const top = new T.CylinderGeometry(0, s * 0.22, s * 0.9, 5);
  asset.add(root, top, mat, [p[0], p[1] + s * 0.45, p[2]], rot);
  const base = new T.CylinderGeometry(s * 0.22, s * 0.15, s * 0.5, 5);
  asset.add(root, base, 'manaCrystalGlow', [p[0], p[1] - s * 0.22, p[2]], rot);
}

/**
 * Ultra-Lush Blue Flower with broad basal leaves and 5 flared petals (Low-Poly Stylized Blossom)
 */
function addLushFlower(asset, root, x, z, scale = 1.0, colorKey = 'flowerBlue1') {
  const y = terrainHeight(x, z);
  const stemH = (0.18 + rnd() * 0.10) * scale;
  const leanX = (rnd() - 0.35) * 0.04 * scale;
  const leanZ = (rnd() - 0.35) * 0.04 * scale;

  // 1. Basal Rosette Leaves (6 triangles)
  const leafPositions = [];
  const leafCount = 3;
  const rLeaf = 0.095 * scale;
  for (let l = 0; l < leafCount; l++) {
    const angle = (l / leafCount) * Math.PI * 2 + rnd() * 0.4;
    const aL = angle - 0.42;
    const aR = angle + 0.42;
    const lx = x + Math.cos(aL) * rLeaf * 0.6;
    const lz = z + Math.sin(aL) * rLeaf * 0.6;
    const tx = x + Math.cos(angle) * rLeaf;
    const tz = z + Math.sin(angle) * rLeaf;
    const rx = x + Math.cos(aR) * rLeaf * 0.6;
    const rz = z + Math.sin(aR) * rLeaf * 0.6;
    const ly = y + 0.012 * scale;
    const ty = y + 0.022 * scale;

    leafPositions.push(
      x, y + 0.008 * scale, z,
      lx, ly, lz,
      tx, ty, tz,
      x, y + 0.008 * scale, z,
      tx, ty, tz,
      rx, ly, rz
    );
  }
  const leafGeo = new T.BufferGeometry();
  leafGeo.setAttribute('position', new T.Float32BufferAttribute(leafPositions, 3));
  leafGeo.computeVertexNormals();
  asset.add(root, leafGeo, 'darkLeaf');

  // 2. Slender Green Stem (6 triangles)
  const stemGeo = new T.CylinderGeometry(0.006 * scale, 0.008 * scale, stemH, 3, 1, true);
  asset.add(root, stemGeo, 'stemGreen', [x + leanX * 0.5, y + stemH * 0.5, z + leanZ * 0.5], [leanZ * 2, 0, -leanX * 2]);

  // 3. 5-Petal Nemophila Blossom (10 triangles)
  const headPos = [x + leanX, y + stemH, z + leanZ];
  const rotY = rnd() * Math.PI * 2;
  const tiltX = (rnd() - 0.5) * 0.22;
  const tiltZ = (rnd() - 0.5) * 0.22;
  const petalPositions = [];
  const petalCount = 5;
  const rTip = 0.115 * scale;
  const rSide = 0.082 * scale;
  const delta = (Math.PI / petalCount) * 0.72;

  for (let i = 0; i < petalCount; i++) {
    const theta = (i / petalCount) * Math.PI * 2;
    const lx = Math.cos(theta - delta) * rSide;
    const lz = Math.sin(theta - delta) * rSide;
    const ly = 0.016 * scale;
    const tx = Math.cos(theta) * rTip;
    const tz = Math.sin(theta) * rTip;
    const ty = 0.028 * scale;
    const rx = Math.cos(theta + delta) * rSide;
    const rz = Math.sin(theta + delta) * rSide;
    const ry = 0.016 * scale;

    petalPositions.push(
      0, 0, 0,
      lx, ly, lz,
      tx, ty, tz,
      0, 0, 0,
      tx, ty, tz,
      rx, ry, rz
    );
  }
  const petalGeo = new T.BufferGeometry();
  petalGeo.setAttribute('position', new T.Float32BufferAttribute(petalPositions, 3));
  petalGeo.computeVertexNormals();
  asset.add(root, petalGeo, colorKey, headPos, [tiltX, rotY, tiltZ]);

  // 4. Golden / White Center Eye (5 triangles)
  const centerPositions = [];
  const sides = 5;
  const rCenter = 0.036 * scale;
  const eyeY = 0.020 * scale;
  for (let i = 0; i < sides; i++) {
    const a1 = (i / sides) * Math.PI * 2;
    const a2 = ((i + 1) / sides) * Math.PI * 2;
    centerPositions.push(
      0, eyeY + 0.005 * scale, 0,
      Math.cos(a1) * rCenter, eyeY, Math.sin(a1) * rCenter,
      Math.cos(a2) * rCenter, eyeY, Math.sin(a2) * rCenter
    );
  }
  const centerGeo = new T.BufferGeometry();
  centerGeo.setAttribute('position', new T.Float32BufferAttribute(centerPositions, 3));
  centerGeo.computeVertexNormals();
  asset.add(root, centerGeo, 'flowerCenterGold', headPos, [tiltX, rotY, tiltZ]);
}

/**
 * Detailed Large Foreground Flower (matching reference image foreground)
 */
function addDetailedForegroundFlower(asset, root, x, y, z, scale = 1.0, colorKey = 'flowerBlue1') {
  const stemH = 0.44 * scale;
  const curveMid = [x + 0.06 * scale, y + stemH * 0.5, z - 0.04 * scale];
  const headPos = [x + 0.09 * scale, y + stemH, z - 0.06 * scale];

  // Curved Stem segments
  asset.rod(root, [x, y, z], curveMid, 0.016 * scale, 'stemGreen', 6);
  asset.rod(root, curveMid, headPos, 0.014 * scale, 'stemGreen', 6);

  // Broad realistic leaves
  for (const sign of [-1, 1]) {
    const lPos = [x + sign * 0.1 * scale, y + stemH * 0.38, z];
    const leafGeo = new T.BoxGeometry(0.11 * scale, 0.012 * scale, 0.20 * scale);
    asset.add(root, leafGeo, 'leafGreen', lPos, [0.35, sign * 0.85, sign * 0.45]);
  }

  // 5 Sculpted Petals with cup curvature
  const petalCount = 5;
  const petalR = 0.15 * scale;
  const headRot = [-0.32, rnd() * Math.PI * 2, 0.22];

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const px = headPos[0] + Math.cos(angle) * petalR * 0.65;
    const pz = headPos[2] + Math.sin(angle) * petalR * 0.65;
    const py = headPos[1] + 0.03 * scale;

    const petalGeo = new T.SphereGeometry(petalR * 0.62, 7, 5);
    asset.add(
      root,
      petalGeo,
      colorKey,
      [px, py, pz],
      [headRot[0], angle, headRot[2] + 0.38],
      [1.2, 0.22, 1.65]
    );
  }

  // White inner throat ring
  asset.add(
    root,
    new T.CylinderGeometry(petalR * 0.44, petalR * 0.36, 0.018 * scale, 8),
    'flowerCenterWhite',
    [headPos[0], headPos[1] + 0.034 * scale, headPos[2]],
    headRot
  );

  // Golden stamen cluster with protruding stamens
  asset.add(
    root,
    new T.SphereGeometry(petalR * 0.34, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.65),
    'flowerCenterGold',
    [headPos[0], headPos[1] + 0.044 * scale, headPos[2]],
    headRot
  );

  // Individual delicate golden stamen filaments
  for (let s = 0; s < 6; s++) {
    const sAngle = (s / 6) * Math.PI * 2;
    const stamenTip = [
      headPos[0] + Math.cos(sAngle) * 0.035 * scale,
      headPos[1] + (0.055 + rnd() * 0.02) * scale,
      headPos[2] + Math.sin(sAngle) * 0.035 * scale
    ];
    asset.rod(root, headPos, stamenTip, 0.0035 * scale, 'goldDetail', 4);
    asset.add(root, new T.SphereGeometry(0.007 * scale, 4, 4), 'flowerCenterGold', stamenTip);
  }
}

/**
 * Flower Bouquet / Wreath (held by Himmel & Frieren in reference image)
 */
function makeFlowerBouquet(asset, root, p, radius = 0.20) {
  // Broad green foliage base
  for (let l = 0; l < 6; l++) {
    const lAngle = (l / 6) * Math.PI * 2;
    asset.add(
      root,
      new T.BoxGeometry(0.08, 0.01, 0.16),
      'leafGreen',
      [p[0] + Math.cos(lAngle) * 0.12, p[1] - 0.04, p[2] + Math.sin(lAngle) * 0.12],
      [0.4, lAngle, 0.2]
    );
  }

  // Clustered blue blossoms
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * Math.sqrt(rnd());
    const bx = p[0] + Math.cos(angle) * r;
    const bz = p[2] + Math.sin(angle) * r;
    const by = p[1] + (rnd() - 0.3) * 0.06;

    const flowerColor = ['flowerBlue1', 'flowerCyan', 'flowerLavender', 'flowerWhite'][i % 4];
    const flowerGeo = new T.SphereGeometry(0.045, 6, 4);
    asset.add(root, flowerGeo, flowerColor, [bx, by, bz], [rnd(), rnd(), rnd()], [1.2, 0.45, 1.3]);
    asset.add(root, new T.SphereGeometry(0.015, 4, 3), 'flowerCenterGold', [bx, by + 0.018, bz]);
  }
}

/**
 * Fantasy Flowering Tree with gnarled trunk & voluminous pastel blossom canopy
 */
function makeFloweringTree(asset, root, x, y, z, size = 1.0, foliageColor = 'treeBlossomBlue') {
  const trunkH = 3.8 * size;
  const midY = y + trunkH * 0.52;
  const topY = y + trunkH;

  // Gnarled cedar trunk
  asset.rod(root, [x, y, z], [x + 0.18 * size, midY, z - 0.12 * size], 0.32 * size, 'treeBark', 8);
  asset.rod(root, [x + 0.18 * size, midY, z - 0.12 * size], [x - 0.12 * size, topY, z + 0.08 * size], 0.24 * size, 'treeBark', 7);

  // Roots flared into soil
  for (let i = 0; i < 4; i++) {
    const rAngle = (i / 4) * Math.PI * 2;
    const rx = x + Math.cos(rAngle) * 0.7 * size;
    const rz = z + Math.sin(rAngle) * 0.7 * size;
    asset.rod(root, [x, y + 0.35 * size, z], [rx, y - 0.12 * size, rz], 0.14 * size, 'treeBark', 6);
  }

  // Twisting Branches
  const branches = [
    { dir: [1.3, 0.85, -0.7], s: 0.14 },
    { dir: [-1.2, 0.95, 0.8], s: 0.13 },
    { dir: [0.35, 1.25, 1.4], s: 0.12 },
    { dir: [-0.7, 1.35, -1.1], s: 0.12 },
  ];

  branches.forEach(b => {
    const end = [x + b.dir[0] * size, topY + b.dir[1] * size, z + b.dir[2] * size];
    asset.rod(root, [x, topY - 0.2 * size, z], end, b.s * size, 'treeBark', 6);

    // Billowing pastel blossom foliage cloud clusters
    const foliageClusterGeo = new T.SphereGeometry(1.35 * size, 7, 5);
    asset.add(
      root,
      foliageClusterGeo,
      foliageColor,
      [end[0], end[1] + 0.45 * size, end[2]],
      [rnd() * 0.2, rnd() * Math.PI, rnd() * 0.2],
      [1.35, 0.95, 1.25]
    );

    // Soft secondary blossom puff
    asset.add(
      root,
      new T.SphereGeometry(0.95 * size, 6, 4),
      foliageColor === 'treeBlossomBlue' ? 'treeBlossomLila' : 'flowerLavender',
      [end[0] + 0.35 * size, end[1] + 0.85 * size, end[2] - 0.25 * size],
      [rnd() * 0.2, rnd() * Math.PI, rnd() * 0.2],
      [1.15, 0.9, 1.15]
    );
  });

  // Central majestic crown dome
  asset.add(
    root,
    new T.SphereGeometry(1.85 * size, 8, 6),
    foliageColor,
    [x, topY + 1.35 * size, z],
    [0.1, 0.5, 0],
    [1.45, 1.0, 1.4]
  );
}

/**
 * Towering Cumulus Cloud Bank (Constrained to Perimeter r >= 11.0, y in [-2.0, 4.0])
 */
function makeCloudBank(asset, root, center, scale = 1.0, width = 8.0, height = 4.5) {
  const [cx, cy, cz] = center;
  const puffCount = 8;

  for (let i = 0; i < puffCount; i++) {
    const u = (i / (puffCount - 1)) - 0.5;
    let px = cx + u * width * scale;
    let py = cy + Math.sin((i / (puffCount - 1)) * Math.PI) * height * scale + (rnd() - 0.5) * 0.4 * scale;
    let pz = cz + (rnd() - 0.5) * 1.5 * scale;

    // Enforce perimeter constraints: distance from center >= 11.0, altitude y in [-2.0, 3.8]
    const horizDist = Math.hypot(px, pz);
    if (horizDist < 11.2) {
      const pushFactor = 11.4 / Math.max(0.1, horizDist);
      px *= pushFactor;
      pz *= pushFactor;
    }
    py = Math.max(-2.0, Math.min(3.8, py));

    const r = (1.8 + Math.sin((i / (puffCount - 1)) * Math.PI) * 2.0 + rnd() * 0.5) * scale;

    // 1. Bright Sunlit Cloud Top
    asset.add(
      root,
      new T.SphereGeometry(r, 6, 4),
      'cloudWhite',
      [px, py, pz],
      [rnd() * 0.2, rnd() * Math.PI, 0],
      [1.25, 1.0, 1.15]
    );

    // 2. Warm Sunlight Blush (mid-lower cloud body)
    asset.add(
      root,
      new T.SphereGeometry(r * 0.88, 5, 4),
      'cloudPink',
      [px + 0.25 * scale, py - r * 0.28, pz + 0.25 * scale],
      [0, rnd() * Math.PI, 0],
      [1.3, 0.85, 1.2]
    );

    // 3. Lavender Atmospheric Shadow Underside
    asset.add(
      root,
      new T.SphereGeometry(r * 0.82, 5, 4),
      'cloudLavender',
      [px - 0.15 * scale, py - r * 0.60, pz - 0.25 * scale],
      [0, rnd() * Math.PI, 0],
      [1.35, 0.7, 1.25]
    );
  }
}

// ============================================================================
// BUILD PIPELINE EXECUTION
// ============================================================================

console.log('--- Generating Level 05: Blue Flower Garden Assets (Optimized) ---');

// 1. MAIN FLOATING ISLAND (island/flower-garden-island.glb)
{
  const asset = new Asset();
  const islandNode = asset.group('FlowerGardenIsland', [0, 0, 0], { level: 5, type: 'FloatingIsland' });

  // Top surface meadow mesh (WINDING ORDER FIX: Normals point UPWARDS (+Y))
  const rings = 32;
  const segments = 64;
  const meadowPositions = [];

  for (let r = 0; r < rings; r++) {
    const fr0 = r / rings;
    const fr1 = (r + 1) / rings;

    for (let s = 0; s < segments; s++) {
      const t0 = (s / segments) * Math.PI * 2;
      const t1 = ((s + 1) / segments) * Math.PI * 2;

      const rad0_0 = fr0 * islandRadius(t0);
      const rad0_1 = fr0 * islandRadius(t1);
      const rad1_0 = fr1 * islandRadius(t0);
      const rad1_1 = fr1 * islandRadius(t1);

      const p00 = [Math.cos(t0) * rad0_0, terrainHeight(Math.cos(t0) * rad0_0, Math.sin(t0) * rad0_0), Math.sin(t0) * rad0_0];
      const p01 = [Math.cos(t1) * rad0_1, terrainHeight(Math.cos(t1) * rad0_1, Math.sin(t1) * rad0_1), Math.sin(t1) * rad0_1];
      const p10 = [Math.cos(t0) * rad1_0, terrainHeight(Math.cos(t0) * rad1_0, Math.sin(t0) * rad1_0), Math.sin(t0) * rad1_0];
      const p11 = [Math.cos(t1) * rad1_1, terrainHeight(Math.cos(t1) * rad1_1, Math.sin(t1) * rad1_1), Math.sin(t1) * rad1_1];

      // Counter-clockwise winding: normals face UP towards sky
      meadowPositions.push(...p00, ...p01, ...p10);
      meadowPositions.push(...p01, ...p11, ...p10);
    }
  }

  const meadowGeo = new T.BufferGeometry();
  meadowGeo.setAttribute('position', new T.Float32BufferAttribute(meadowPositions, 3));
  meadowGeo.computeVertexNormals();
  asset.add(islandNode, meadowGeo, 'meadowGrass');

  // Substrate Soil Band around outer rim (normals face outward)
  const rimPositions = [];
  for (let s = 0; s < segments; s++) {
    const t0 = (s / segments) * Math.PI * 2;
    const t1 = ((s + 1) / segments) * Math.PI * 2;
    const rad0 = islandRadius(t0);
    const rad1 = islandRadius(t1);

    const x0 = Math.cos(t0) * rad0, z0 = Math.sin(t0) * rad0, y0 = terrainHeight(x0, z0);
    const x1 = Math.cos(t1) * rad1, z1 = Math.sin(t1) * rad1, y1 = terrainHeight(x1, z1);

    const soilY0 = y0 - 0.75;
    const soilY1 = y1 - 0.75;

    rimPositions.push(x0, y0, z0, x1, y1, z1, x0, soilY0, z0);
    rimPositions.push(x1, y1, z1, x1, soilY1, z1, x0, soilY0, z0);
  }
  const rimGeo = new T.BufferGeometry();
  rimGeo.setAttribute('position', new T.Float32BufferAttribute(rimPositions, 3));
  rimGeo.computeVertexNormals();
  asset.add(islandNode, rimGeo, 'meadowSoil');

  // Solid, Continuous Rocky Underside tapering to jagged stalactites
  const undersideRings = 16;
  const underPositions = [];
  const maxDepth = -6.8;

  for (let ur = 0; ur < undersideRings; ur++) {
    const fu0 = ur / undersideRings;
    const fu1 = (ur + 1) / undersideRings;

    const y0 = -0.75 - fu0 * fu0 * (Math.abs(maxDepth) - 0.75);
    const y1 = -0.75 - fu1 * fu1 * (Math.abs(maxDepth) - 0.75);

    const shrink0 = Math.pow(1.0 - fu0, 0.72);
    const shrink1 = Math.pow(1.0 - fu1, 0.72);

    for (let s = 0; s < segments; s++) {
      const t0 = (s / segments) * Math.PI * 2;
      const t1 = ((s + 1) / segments) * Math.PI * 2;

      // Continuous craggy displacement without ring seams
      const crag0 = 1.0 + 0.14 * Math.sin(t0 * 7 + ur * 1.2);
      const crag1 = 1.0 + 0.14 * Math.sin(t1 * 7 + ur * 1.2);
      const cragNext0 = 1.0 + 0.14 * Math.sin(t0 * 7 + (ur + 1) * 1.2);
      const cragNext1 = 1.0 + 0.14 * Math.sin(t1 * 7 + (ur + 1) * 1.2);

      const r0_0 = islandRadius(t0) * shrink0 * crag0;
      const r0_1 = islandRadius(t1) * shrink0 * crag1;
      const r1_0 = islandRadius(t0) * shrink1 * cragNext0;
      const r1_1 = islandRadius(t1) * shrink1 * cragNext1;

      const p00 = [Math.cos(t0) * r0_0, y0, Math.sin(t0) * r0_0];
      const p01 = [Math.cos(t1) * r0_1, y0, Math.sin(t1) * r0_1];
      const p10 = [Math.cos(t0) * r1_0, y1, Math.sin(t0) * r1_0];
      const p11 = [Math.cos(t1) * r1_1, y1, Math.sin(t1) * r1_1];

      // Normals face OUTWARD / DOWNWARD
      underPositions.push(...p00, ...p10, ...p01);
      underPositions.push(...p01, ...p10, ...p11);
    }
  }

  const underGeo = new T.BufferGeometry();
  underGeo.setAttribute('position', new T.Float32BufferAttribute(underPositions, 3));
  underGeo.computeVertexNormals();
  asset.add(islandNode, underGeo, 'rockSurface');

  // Stalactite spires hanging beneath the island
  const spires = [
    { pos: [0, -6.6, 0], s: [1.2, 3.2, 1.2], mat: 'rockDark' },
    { pos: [-2.2, -4.5, 1.5], s: [0.8, 2.5, 0.8], mat: 'rockDark' },
    { pos: [2.8, -4.2, -1.8], s: [0.9, 2.8, 0.9], mat: 'rockDark' },
    { pos: [-1.5, -3.8, -2.6], s: [0.75, 2.2, 0.75], mat: 'rockDark' },
    { pos: [1.8, -3.5, 2.4], s: [0.7, 2.0, 0.7], mat: 'rockDark' },
  ];
  spires.forEach(sp => {
    makeRock(asset, islandNode, sp.pos, sp.s, sp.mat, 0);
  });

  // Perimeter rock outcrops and cliff ledges
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const r = islandRadius(angle) - 0.2;
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;
    const ry = terrainHeight(rx, rz) - 0.15;
    makeRock(asset, islandNode, [rx, ry, rz], [0.65 + rnd() * 0.4, 0.38 + rnd() * 0.3, 0.65 + rnd() * 0.4], 'rockHighlight', 0);
  }

  // Baked empty locators for Himmel, Frieren, and Biography interaction marker
  asset.group('Locator_Himmel', [-0.48, 0.42, 0.12], { yaw: 0.15 }, islandNode, [0, 0.15, 0]);
  asset.group('Locator_Frieren', [0.48, 0.40, 0.08], { yaw: -0.15 }, islandNode, [0, -0.15, 0]);
  asset.group('Locator_Biography', [0, 0.45, 1.8], {}, islandNode);

  asset.save('island/flower-garden-island.glb');
}

// 2. SATELLITE FLOATING ROCKS & GLOWING MANA CRYSTALS (island/floating-rocks.glb)
{
  const asset = new Asset();
  const root = asset.group('FloatingRocksGroup', [0, 0, 0]);

  const satelliteRocks = [
    { pos: [-9.5, -2.4, 3.2], s: [1.2, 1.5, 1.1], cScale: 0.8 },
    { pos: [9.8, -2.8, -2.5], s: [1.4, 1.8, 1.3], cScale: 0.9 },
    { pos: [-6.8, -4.2, -7.5], s: [1.0, 1.4, 0.9], cScale: 0.7 },
    { pos: [7.2, -3.8, 6.8], s: [1.1, 1.3, 1.0], cScale: 0.75 },
    { pos: [-3.5, -5.8, 4.5], s: [0.8, 1.1, 0.8], cScale: 0.6 },
    { pos: [4.2, -5.5, -4.2], s: [0.9, 1.2, 0.85], cScale: 0.65 },
    { pos: [0.5, -7.2, 1.8], s: [0.75, 1.0, 0.7], cScale: 0.55 },
    { pos: [-8.2, -1.8, -4.8], s: [1.0, 1.2, 0.95], cScale: 0.7 },
  ];

  satelliteRocks.forEach((rockData, idx) => {
    const rockNode = asset.group(`FloatingRock_${idx}`, rockData.pos, {}, root);
    makeRock(asset, rockNode, [0, 0, 0], rockData.s, 'rockSurface', 0);
    makeCrystal(asset, rockNode, [0, rockData.s[1] * 0.45, 0], rockData.cScale, 'manaCrystal');
    makeCrystal(asset, rockNode, [rockData.s[0] * 0.25, rockData.s[1] * 0.35, rockData.s[2] * 0.2], rockData.cScale * 0.7, 'manaCrystalGlow');
    asset.animateFloat(rockNode, `RockFloat_${idx}`, 4.0 + idx * 0.5, 0.15, 0.06);
  });

  asset.save('island/floating-rocks.glb');
}

// 3. ULTRA-DENSE FLOWER MEADOW (flowers/dense-flower-meadow.glb)
// 3,600 lush flowers with broad basal leaves and flared blossoms covering the entire island
{
  const asset = new Asset();
  const meadowNode = asset.group('DenseFlowerMeadow', [0, 0, 0]);

  const flowerPaletteKeys = [
    'flowerBlue1',     // 42% Vivid Nemophila Sky Blue
    'flowerBlue1',
    'flowerBlue2',     // 12% Deep Royal Blue
    'flowerCyan',      // 22% Pastel Cyan
    'flowerCyan',
    'flowerLavender',  // 14% Soft Dreamy Lavender
    'flowerViolet',    // 6% Royal Violet Accent
    'flowerWhite',     // 6% White Star Blossom
    'flowerPink'       // 4% Delicate Blush Pink
  ];

  const totalFlowers = 3600;
  for (let i = 0; i < totalFlowers; i++) {
    const theta = rnd() * Math.PI * 2;
    const maxR = islandRadius(theta) - 0.32;
    const r = Math.sqrt(rnd()) * maxR;

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    // Leave exact footprint of Himmel and Frieren clean
    const distToHimmel = Math.hypot(x - (-0.48), z - 0.12);
    const distToFrieren = Math.hypot(x - 0.48, z - 0.08);
    if (distToHimmel < 0.20 || distToFrieren < 0.20) continue;

    const colorKey = flowerPaletteKeys[Math.floor(rnd() * flowerPaletteKeys.length)];
    const scale = 0.9 + rnd() * 0.45;
    addLushFlower(asset, meadowNode, x, z, scale, colorKey);
  }

  asset.save('flowers/dense-flower-meadow.glb');
}

// 4. DETAILED FOREGROUND FLOWERS (flowers/foreground-flowers-detailed.glb)
// 48 prominent blossoms in the front camera view (matching reference image 1)
{
  const asset = new Asset();
  const fgNode = asset.group('ForegroundFlowersDetailed', [0, 0, 0]);

  const fgCount = 48;
  for (let i = 0; i < fgCount; i++) {
    const x = -3.4 + rnd() * 6.8;
    const z = 2.8 + rnd() * 2.2;
    const y = terrainHeight(x, z);

    const fgColors = ['flowerBlue1', 'flowerCyan', 'flowerLavender', 'flowerWhite'];
    const colorKey = fgColors[i % fgColors.length];
    const scale = 1.15 + rnd() * 0.5;

    addDetailedForegroundFlower(asset, fgNode, x, y, z, scale, colorKey);
  }

  asset.save('flowers/foreground-flowers-detailed.glb');
}

// 5. MODULAR FLOWER CLUSTERS, SINGLES & BOUQUET
{
  // Cluster A: Sky Blue & Cyan (24 flowers)
  {
    const asset = new Asset();
    const root = asset.group('FlowerCluster_BlueCyan', [0, 0, 0]);
    for (let i = 0; i < 24; i++) {
      const angle = rnd() * Math.PI * 2;
      const dist = Math.sqrt(rnd()) * 0.65;
      const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
      const color = i % 3 === 0 ? 'flowerCyan' : 'flowerBlue1';
      addLushFlower(asset, root, x, z, 0.95 + rnd() * 0.35, color);
    }
    asset.save('flowers/flower-cluster-a.glb');
  }

  // Cluster B: Lavender, Violet & Pink (24 flowers)
  {
    const asset = new Asset();
    const root = asset.group('FlowerCluster_LavenderPink', [0, 0, 0]);
    for (let i = 0; i < 24; i++) {
      const angle = rnd() * Math.PI * 2;
      const dist = Math.sqrt(rnd()) * 0.65;
      const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
      const color = ['flowerLavender', 'flowerViolet', 'flowerPink', 'flowerWhite'][i % 4];
      addLushFlower(asset, root, x, z, 0.95 + rnd() * 0.35, color);
    }
    asset.save('flowers/flower-cluster-b.glb');
  }

  // Single Flowers
  {
    const asset = new Asset();
    const root = asset.group('SingleFlower_Blue', [0, 0, 0]);
    addLushFlower(asset, root, 0, 0, 1.25, 'flowerBlue1');
    asset.save('flowers/flower-single-blue.glb');
  }
  {
    const asset = new Asset();
    const root = asset.group('SingleFlower_Lavender', [0, 0, 0]);
    addLushFlower(asset, root, 0, 0, 1.25, 'flowerLavender');
    asset.save('flowers/flower-single-lavender.glb');
  }
  {
    const asset = new Asset();
    const root = asset.group('SingleFlower_White', [0, 0, 0]);
    addLushFlower(asset, root, 0, 0, 1.25, 'flowerWhite');
    asset.save('flowers/flower-single-white.glb');
  }

  // Flower Bouquet (held by Himmel & Frieren in reference image)
  {
    const asset = new Asset();
    const root = asset.group('FlowerWreath', [0, 0, 0]);
    makeFlowerBouquet(asset, root, [0, 0.15, 0], 0.22);
    asset.save('flowers/flower-wreath.glb');
  }
}

// 6. VEGETATION: FLOWERING TREES, SHRUBS & GRASS PATCHES
{
  // Flowering Trees
  {
    const asset = new Asset();
    const root = asset.group('FloweringTrees', [0, 0, 0]);

    const treePlacements = [
      { pos: [-6.8, terrainHeight(-6.8, -4.8), -4.8], s: 1.2, col: 'treeBlossomBlue' },
      { pos: [6.5, terrainHeight(6.5, -4.0), -4.0], s: 1.3, col: 'treeBlossomLila' },
      { pos: [-3.5, terrainHeight(-3.5, -7.5), -7.5], s: 1.1, col: 'treeBlossomBlue' },
    ];

    treePlacements.forEach(tp => {
      makeFloweringTree(asset, root, tp.pos[0], tp.pos[1], tp.pos[2], tp.s, tp.col);
    });

    asset.save('vegetation/flowering-trees.glb');
  }

  // Garden Shrubs
  {
    const asset = new Asset();
    const root = asset.group('GardenShrubs', [0, 0, 0]);

    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + 0.15;
      const r = islandRadius(angle) - 0.7 - rnd() * 0.8;
      const sx = Math.cos(angle) * r, sz = Math.sin(angle) * r, sy = terrainHeight(sx, sz);
      const s = 0.55 + rnd() * 0.45;
      asset.add(root, new T.SphereGeometry(s, 6, 5), 'shrubGreen', [sx, sy + s * 0.4, sz], [0, rnd() * Math.PI, 0], [1.2, 0.7, 1.1]);

      for (let b = 0; b < 6; b++) {
        const bAngle = rnd() * Math.PI * 2;
        const bx = sx + Math.cos(bAngle) * s * 0.75, bz = sz + Math.sin(bAngle) * s * 0.75, by = sy + s * 0.7 + rnd() * 0.1;
        asset.add(root, new T.SphereGeometry(0.045, 4, 3), b % 2 === 0 ? 'flowerWhite' : 'flowerCyan', [bx, by, bz]);
      }
    }

    asset.save('vegetation/garden-shrubs.glb');
  }

  // Grass Patches
  {
    const asset = new Asset();
    const root = asset.group('GrassPatches', [0, 0, 0]);

    for (let i = 0; i < 180; i++) {
      const theta = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * (islandRadius(theta) - 0.5);
      const gx = Math.cos(theta) * r, gz = Math.sin(theta) * r, gy = terrainHeight(gx, gz);

      for (let b = 0; b < 3; b++) {
        const bAngle = b * 2.1 + rnd() * 0.4;
        const bH = 0.16 + rnd() * 0.1;
        asset.add(
          root,
          new T.ConeGeometry(0.02, bH, 3),
          'meadowSunny',
          [gx + Math.cos(bAngle) * 0.03, gy + bH * 0.5, gz + Math.sin(bAngle) * 0.03],
          [0.25, bAngle, 0.2]
        );
      }
    }

    asset.save('vegetation/grass-patches.glb');
  }
}

// 7. ENVIRONMENT: TOWERING DREAMY CUMULUS CLOUDS & SKY DOME
{
  // Towering Anime Cumulus Clouds (reproducing the magnificent backdrop of reference image 1)
  {
    const asset = new Asset();
    const root = asset.group('DreamyClouds', [0, 0, 0]);

    const cloudBanks = [
      // Perimeter clouds behind island at r >= 11.5, altitude y in [-0.5, 3.5]
      { center: [0, 2.0, -13.0], scale: 1.25, width: 10.0, height: 3.5 },
      { center: [0, 3.2, -16.0], scale: 1.45, width: 12.0, height: 3.8 },
      { center: [-12.0, 1.8, -8.0], scale: 1.2, width: 8.5, height: 3.2 },
      { center: [12.0, 1.8, -7.5], scale: 1.2, width: 8.5, height: 3.2 },
      { center: [-8.0, 2.8, -17.5], scale: 1.4, width: 11.0, height: 3.5 },
      { center: [8.0, 2.8, -17.5], scale: 1.4, width: 11.0, height: 3.5 },
    ];

    cloudBanks.forEach(cb => {
      makeCloudBank(asset, root, cb.center, cb.scale, cb.width, cb.height);
    });

    asset.save('environment/dreamy-clouds.glb');
  }

  // Soft Horizon Sky Dome
  {
    const asset = new Asset();
    const root = asset.group('SkyDome', [0, 0, 0]);

    const skyRadius = 45;
    const domeGeo = new T.SphereGeometry(skyRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    domeGeo.scale(-1, 1, 1);
    asset.add(root, domeGeo, 'cloudWhite', [0, -4, 0]);

    asset.save('environment/sky-dome.glb');
  }
}

// 8. EFFECTS: FLOATING PETALS & MAGICAL MOTES
{
  // Floating Petals
  {
    const asset = new Asset();
    const root = asset.group('FloatingPetalsGroup', [0, 0, 0]);

    const petalColors = ['flowerBlue1', 'flowerCyan', 'flowerLavender', 'flowerWhite'];
    for (let i = 0; i < 75; i++) {
      const px = -6.5 + rnd() * 13.0;
      const pz = -5.0 + rnd() * 11.0;
      const py = terrainHeight(px, pz) + 0.35 + rnd() * 2.2;

      const pNode = asset.group(`Petal_${i}`, [px, py, pz], {}, root);
      const col = petalColors[i % petalColors.length];

      const pGeo = new T.SphereGeometry(0.048, 5, 4);
      asset.add(pNode, pGeo, col, [0, 0, 0], [rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI], [1.2, 0.15, 1.6]);
      asset.animateFloat(pNode, `PetalDrift_${i}`, 3.0 + (i % 5) * 0.6, 0.18, 0.12);
    }

    asset.save('effects/floating-petals.glb');
  }

  // Magical Motes
  {
    const asset = new Asset();
    const root = asset.group('MagicalMotesGroup', [0, 0, 0]);

    for (let i = 0; i < 60; i++) {
      const mx = -5.5 + rnd() * 11.0;
      const mz = -4.5 + rnd() * 9.5;
      const my = terrainHeight(mx, mz) + 0.25 + rnd() * 1.5;

      const mNode = asset.group(`Mote_${i}`, [mx, my, mz], {}, root);
      const mGeo = new T.SphereGeometry(0.024, 4, 3);
      asset.add(mNode, mGeo, 'flowerCenterGold', [0, 0, 0]);
      asset.animateFloat(mNode, `MoteFloat_${i}`, 2.5 + (i % 4) * 0.8, 0.08, 0.04);
    }

    asset.save('effects/magical-motes.glb');
  }
}

// 9. COMPLETE PRE-ASSEMBLED MASTER ASSET (blue-flower-garden-complete.glb)
{
  const asset = new Asset();
  const gardenRoot = asset.group('BlueFlowerGarden_Complete', [0, 0, 0], {
    level: 5,
    title: 'Blue Flower Garden',
    characters: ['Himmel', 'Frieren']
  });

  // A. Island Terrain (Winding order strictly +Y)
  const islandNode = asset.group('IslandTerrain', [0, 0, 0], {}, gardenRoot);
  const rings = 28, segments = 56;
  const positions = [];
  for (let r = 0; r < rings; r++) {
    const fr0 = r / rings, fr1 = (r + 1) / rings;
    for (let s = 0; s < segments; s++) {
      const t0 = (s / segments) * Math.PI * 2, t1 = ((s + 1) / segments) * Math.PI * 2;
      const rad0_0 = fr0 * islandRadius(t0), rad0_1 = fr0 * islandRadius(t1);
      const rad1_0 = fr1 * islandRadius(t0), rad1_1 = fr1 * islandRadius(t1);
      const p00 = [Math.cos(t0) * rad0_0, terrainHeight(Math.cos(t0) * rad0_0, Math.sin(t0) * rad0_0), Math.sin(t0) * rad0_0];
      const p01 = [Math.cos(t1) * rad0_1, terrainHeight(Math.cos(t1) * rad0_1, Math.sin(t1) * rad0_1), Math.sin(t1) * rad0_1];
      const p10 = [Math.cos(t0) * rad1_0, terrainHeight(Math.cos(t0) * rad1_0, Math.sin(t0) * rad1_0), Math.sin(t0) * rad1_0];
      const p11 = [Math.cos(t1) * rad1_1, terrainHeight(Math.cos(t1) * rad1_1, Math.sin(t1) * rad1_1), Math.sin(t1) * rad1_1];
      positions.push(...p00, ...p01, ...p10, ...p01, ...p11, ...p10);
    }
  }
  const meadowGeo = new T.BufferGeometry();
  meadowGeo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  meadowGeo.computeVertexNormals();
  asset.add(islandNode, meadowGeo, 'meadowGrass');

  // Soil rim
  const rimPositions = [];
  for (let s = 0; s < segments; s++) {
    const t0 = (s / segments) * Math.PI * 2, t1 = ((s + 1) / segments) * Math.PI * 2;
    const rad0 = islandRadius(t0), rad1 = islandRadius(t1);
    const x0 = Math.cos(t0) * rad0, z0 = Math.sin(t0) * rad0, y0 = terrainHeight(x0, z0);
    const x1 = Math.cos(t1) * rad1, z1 = Math.sin(t1) * rad1, y1 = terrainHeight(x1, z1);
    const soilY0 = y0 - 0.75, soilY1 = y1 - 0.75;
    rimPositions.push(x0, y0, z0, x1, y1, z1, x0, soilY0, z0, x1, y1, z1, x1, soilY1, z1, x0, soilY0, z0);
  }
  const rimGeo = new T.BufferGeometry();
  rimGeo.setAttribute('position', new T.Float32BufferAttribute(rimPositions, 3));
  rimGeo.computeVertexNormals();
  asset.add(islandNode, rimGeo, 'meadowSoil');

  // Underside rock
  const underPositions = [];
  for (let ur = 0; ur < 12; ur++) {
    const fu0 = ur / 12, fu1 = (ur + 1) / 12;
    const y0 = -0.75 - fu0 * fu0 * 5.8, y1 = -0.75 - fu1 * fu1 * 5.8;
    const shrink0 = Math.pow(1 - fu0, 0.72), shrink1 = Math.pow(1 - fu1, 0.72);
    for (let s = 0; s < segments; s++) {
      const t0 = (s / segments) * Math.PI * 2, t1 = ((s + 1) / segments) * Math.PI * 2;
      const crag0 = 1.0 + 0.12 * Math.sin(t0 * 6 + ur);
      const crag1 = 1.0 + 0.12 * Math.sin(t1 * 6 + ur);
      const cragNext0 = 1.0 + 0.12 * Math.sin(t0 * 6 + (ur + 1));
      const cragNext1 = 1.0 + 0.12 * Math.sin(t1 * 6 + (ur + 1));
      const r0_0 = islandRadius(t0) * shrink0 * crag0, r0_1 = islandRadius(t1) * shrink0 * crag1;
      const r1_0 = islandRadius(t0) * shrink1 * cragNext0, r1_1 = islandRadius(t1) * shrink1 * cragNext1;
      underPositions.push(Math.cos(t0) * r0_0, y0, Math.sin(t0) * r0_0, Math.cos(t0) * r1_0, y1, Math.sin(t0) * r1_0, Math.cos(t1) * r0_1, y0, Math.sin(t1) * r0_1);
      underPositions.push(Math.cos(t1) * r0_1, y0, Math.sin(t1) * r0_1, Math.cos(t0) * r1_0, y1, Math.sin(t0) * r1_0, Math.cos(t1) * r1_1, y1, Math.sin(t1) * r1_1);
    }
  }
  const underGeo = new T.BufferGeometry();
  underGeo.setAttribute('position', new T.Float32BufferAttribute(underPositions, 3));
  underGeo.computeVertexNormals();
  asset.add(islandNode, underGeo, 'rockSurface');

  // Underside spires & rim rocks
  makeRock(asset, islandNode, [0, -6.5, 0], [1.2, 3.2, 1.2], 'rockDark', 0);
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const r = islandRadius(angle) - 0.2;
    makeRock(asset, islandNode, [Math.cos(angle) * r, terrainHeight(Math.cos(angle) * r, Math.sin(angle) * r) - 0.1, Math.sin(angle) * r], [0.6, 0.32, 0.6], 'rockHighlight', 0);
  }

  // B. Dense Flower Meadow (3,200 flowers in master build)
  const flowersNode = asset.group('DenseFlowerMeadow', [0, 0, 0], {}, gardenRoot);
  const flowerPaletteKeys = ['flowerBlue1', 'flowerBlue1', 'flowerBlue2', 'flowerCyan', 'flowerCyan', 'flowerLavender', 'flowerViolet', 'flowerWhite', 'flowerPink'];
  for (let i = 0; i < 3200; i++) {
    const theta = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (islandRadius(theta) - 0.32);
    const x = Math.cos(theta) * r, z = Math.sin(theta) * r;
    if (Math.hypot(x - (-0.48), z - 0.12) < 0.20 || Math.hypot(x - 0.48, z - 0.08) < 0.20) continue;
    const colorKey = flowerPaletteKeys[Math.floor(rnd() * flowerPaletteKeys.length)];
    addLushFlower(asset, flowersNode, x, z, 0.9 + rnd() * 0.45, colorKey);
  }

  // C. Foreground Detailed Flowers (36 flowers)
  const fgNode = asset.group('ForegroundFlowers', [0, 0, 0], {}, gardenRoot);
  for (let i = 0; i < 36; i++) {
    const x = -3.4 + rnd() * 6.8;
    const z = 2.8 + rnd() * 2.2;
    const y = terrainHeight(x, z);
    const colorKey = ['flowerBlue1', 'flowerCyan', 'flowerLavender', 'flowerWhite'][i % 4];
    addDetailedForegroundFlower(asset, fgNode, x, y, z, 1.15 + rnd() * 0.45, colorKey);
  }

  // D. Flowering Trees (3 trees)
  const treesNode = asset.group('FloweringTrees', [0, 0, 0], {}, gardenRoot);
  makeFloweringTree(asset, treesNode, -6.8, terrainHeight(-6.8, -4.8), -4.8, 1.2, 'treeBlossomBlue');
  makeFloweringTree(asset, treesNode, 6.5, terrainHeight(6.5, -4.0), -4.0, 1.3, 'treeBlossomLila');
  makeFloweringTree(asset, treesNode, -3.5, terrainHeight(-3.5, -7.5), -7.5, 1.1, 'treeBlossomBlue');

  // E. Garden Shrubs (16 shrubs)
  const shrubsNode = asset.group('GardenShrubs', [0, 0, 0], {}, gardenRoot);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + 0.2;
    const r = islandRadius(angle) - 0.8;
    const sx = Math.cos(angle) * r, sz = Math.sin(angle) * r, sy = terrainHeight(sx, sz);
    const s = 0.55 + rnd() * 0.4;
    asset.add(shrubsNode, new T.SphereGeometry(s, 6, 5), 'shrubGreen', [sx, sy + s * 0.35, sz], [0, rnd() * Math.PI, 0], [1.2, 0.7, 1.1]);
  }

  // F. Towering Anime Cumulus Clouds (Perimeter r >= 11.5, altitude y in [1.2, 3.5])
  const cloudsNode = asset.group('DreamyClouds', [0, 0, 0], {}, gardenRoot);
  makeCloudBank(asset, cloudsNode, [0, 2.0, -13.0], 1.25, 10.0, 3.5);
  makeCloudBank(asset, cloudsNode, [0, 3.2, -16.0], 1.45, 12.0, 3.8);
  makeCloudBank(asset, cloudsNode, [-12.0, 1.8, -8.0], 1.2, 8.5, 3.2);
  makeCloudBank(asset, cloudsNode, [12.0, 1.8, -7.5], 1.2, 8.5, 3.2);

  // G. Empty Locators & Character Placement Anchor
  asset.group('Locator_Himmel', [-0.48, 0.42, 0.12], { yaw: 0.15 }, gardenRoot, [0, 0.15, 0]);
  asset.group('Locator_Frieren', [0.48, 0.40, 0.08], { yaw: -0.15 }, gardenRoot, [0, -0.15, 0]);
  asset.group('Locator_Biography', [0, 0.45, 1.8], {}, gardenRoot);

  const anchorNode = asset.group('Himmel_Frieren_Anchor', [0, 0.42, 0.10], {
    description: 'Center staging knoll for Himmel and Frieren standing together in the blue flower meadow',
    himmel: { position: [-0.48, 0.0, 0.02], yaw: 0.15 },
    frieren: { position: [0.48, 0.0, -0.02], yaw: -0.15 }
  }, gardenRoot);

  // H. Satellite Floating Rocks with Glowing Mana Crystals
  const satGroup = asset.group('FloatingRocksGroup', [0, 0, 0], {}, gardenRoot);
  const satRocks = [
    { pos: [-9.5, -2.4, 3.2], s: [1.2, 1.5, 1.1], cScale: 0.8 },
    { pos: [9.8, -2.8, -2.5], s: [1.4, 1.8, 1.3], cScale: 0.9 },
    { pos: [-6.8, -4.2, -7.5], s: [1.0, 1.4, 0.9], cScale: 0.7 },
    { pos: [7.2, -3.8, 6.8], s: [1.1, 1.3, 1.0], cScale: 0.75 },
    { pos: [-3.5, -5.8, 4.5], s: [0.8, 1.1, 0.8], cScale: 0.6 },
    { pos: [4.2, -5.5, -4.2], s: [0.9, 1.2, 0.85], cScale: 0.65 },
  ];
  satRocks.forEach((rd, idx) => {
    const rn = asset.group(`FloatingRock_${idx}`, rd.pos, {}, satGroup);
    makeRock(asset, rn, [0, 0, 0], rd.s, 'rockSurface', 0);
    makeCrystal(asset, rn, [0, rd.s[1] * 0.45, 0], rd.cScale, 'manaCrystal');
    asset.animateFloat(rn, `RockFloat_${idx}`, 4.0 + idx * 0.5, 0.15, 0.06);
  });

  // I. Floating Petals & Magical Motes
  const petalsRoot = asset.group('FloatingPetalsGroup', [0, 0, 0], {}, gardenRoot);
  const pColors = ['flowerBlue1', 'flowerCyan', 'flowerLavender', 'flowerWhite'];
  for (let i = 0; i < 28; i++) {
    const angle = rnd() * Math.PI * 2;
    const r = 1.0 + rnd() * 6.5;
    const px = Math.cos(angle) * r, pz = Math.sin(angle) * r, py = 0.4 + rnd() * 2.8;
    const pNode = asset.group(`Petal_${i}`, [px, py, pz], {}, petalsRoot);
    const pColor = pColors[i % pColors.length];
    asset.add(pNode, new T.BoxGeometry(0.045, 0.004, 0.065), pColor, [0, 0, 0], [rnd() * 0.5, rnd() * Math.PI, rnd() * 0.5]);
    asset.animateFloat(pNode, `PetalDrift_${i}`, 3.0 + (i % 5) * 0.6, 0.18, 0.12);
  }

  const motesRoot = asset.group('MagicalMotesGroup', [0, 0, 0], {}, gardenRoot);
  for (let i = 0; i < 36; i++) {
    const angle = rnd() * Math.PI * 2;
    const r = 0.5 + rnd() * 7.0;
    const mx = Math.cos(angle) * r, mz = Math.sin(angle) * r, my = 0.2 + rnd() * 3.2;
    const mNode = asset.group(`Mote_${i}`, [mx, my, mz], {}, motesRoot);
    const mSize = 0.016 + rnd() * 0.024;
    asset.add(mNode, new T.SphereGeometry(mSize, 4, 3), i % 2 === 0 ? 'manaCrystal' : 'flowerCenterGold');
    asset.animateFloat(mNode, `MoteFloat_${i}`, 2.5 + (i % 4) * 0.8, 0.08, 0.04);
  }

  asset.save('blue-flower-garden-complete.glb');
}

console.log('\n=== All Blue Flower Garden 3D Assets Successfully Exported & Optimized! ===');
