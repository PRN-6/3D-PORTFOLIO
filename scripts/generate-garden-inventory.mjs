import fs from 'node:fs';
import path from 'node:path';

const gardenDir = path.resolve('public/models/blue-flower-garden');

function analyzeGlb(relativePath) {
  const fullPath = path.join(gardenDir, relativePath);
  const buf = fs.readFileSync(fullPath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));

  let totalVerts = 0;
  let totalTris = 0;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives || []) {
      if (prim.attributes && prim.attributes.POSITION !== undefined) {
        const posAcc = json.accessors[prim.attributes.POSITION];
        totalVerts += posAcc.count;
        if (posAcc.min && posAcc.max) {
          for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i], posAcc.min[i]);
            max[i] = Math.max(max[i], posAcc.max[i]);
          }
        }
      }
      if (prim.indices !== undefined) {
        const idxAcc = json.accessors[prim.indices];
        totalTris += Math.floor(idxAcc.count / 3);
      }
    }
  }

  const dimensions = [
    parseFloat((max[0] - min[0]).toFixed(3)),
    parseFloat((max[1] - min[1]).toFixed(3)),
    parseFloat((max[2] - min[2]).toFixed(3))
  ];

  return {
    file: relativePath.replace(/\\/g, '/'),
    fileSizeBytes: buf.length,
    fileSizeKB: parseFloat((buf.length / 1024).toFixed(1)),
    vertices: totalVerts,
    triangles: totalTris,
    boundsMin: min.map(n => parseFloat(n.toFixed(3))),
    boundsMax: max.map(n => parseFloat(n.toFixed(3))),
    dimensions,
    materials: (json.materials || []).map(m => m.name),
    nodesCount: (json.nodes || []).length,
    animationsCount: (json.animations || []).length
  };
}

const glbFiles = [
  'island/flower-garden-island.glb',
  'island/floating-rocks.glb',
  'flowers/dense-flower-meadow.glb',
  'flowers/foreground-flowers-detailed.glb',
  'flowers/flower-cluster-a.glb',
  'flowers/flower-cluster-b.glb',
  'flowers/flower-single-blue.glb',
  'flowers/flower-single-lavender.glb',
  'flowers/flower-single-white.glb',
  'flowers/flower-wreath.glb',
  'vegetation/flowering-trees.glb',
  'vegetation/garden-shrubs.glb',
  'vegetation/grass-patches.glb',
  'environment/dreamy-clouds.glb',
  'environment/sky-dome.glb',
  'effects/floating-petals.glb',
  'effects/magical-motes.glb',
  'blue-flower-garden-complete.glb'
];

const inventory = {
  level: 5,
  name: 'Blue Flower Garden (Himmel & Frieren)',
  inspiration: "Frieren: Beyond Journey's End",
  timestamp: new Date().toISOString(),
  totalAssets: glbFiles.length,
  assets: glbFiles.map(f => analyzeGlb(f))
};

fs.writeFileSync(
  path.join(gardenDir, 'asset-inventory.json'),
  JSON.stringify(inventory, null, 2),
  'utf8'
);

console.log('Successfully generated asset-inventory.json!');
console.log(`Audited ${inventory.assets.length} assets.`);
