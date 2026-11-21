import fs from 'node:fs';
import path from 'node:path';

function inspectGLB(filePath) {
  const stats = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  // Read GLB header: magic(4), version(4), length(4)
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') {
    return { error: 'Not a GLB' };
  }
  const version = buffer.readUInt32LE(4);
  const totalLength = buffer.readUInt32LE(8);

  // Chunk 0 (JSON): length(4), type(4)
  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.toString('utf8', 16, 20);
  if (jsonChunkType !== 'JSON') {
    return { error: 'Invalid JSON chunk' };
  }

  const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength);
  const gltf = JSON.parse(jsonString);

  // Collect stats
  const meshes = gltf.meshes || [];
  const nodes = gltf.nodes || [];
  const materials = gltf.materials || [];
  const textures = gltf.textures || [];
  const images = gltf.images || [];
  const animations = gltf.animations || [];
  const skins = gltf.skins || [];
  const extensionsUsed = gltf.extensionsUsed || [];
  const extensionsRequired = gltf.extensionsRequired || [];

  let primitiveCount = 0;
  let totalIndices = 0;

  meshes.forEach((mesh) => {
    (mesh.primitives || []).forEach((p) => {
      primitiveCount++;
      if (p.indices !== undefined && gltf.accessors && gltf.accessors[p.indices]) {
        totalIndices += gltf.accessors[p.indices].count;
      }
    });
  });

  const animDetails = animations.map((a) => ({
    name: a.name || 'unnamed',
    channels: (a.channels || []).length,
  }));

  return {
    filePath: path.relative(process.cwd(), filePath),
    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
    sizeBytes: stats.size,
    nodesCount: nodes.length,
    meshesCount: meshes.length,
    primitivesCount: primitiveCount,
    trianglesEst: Math.round(totalIndices / 3),
    materialsCount: materials.length,
    texturesCount: textures.length,
    imagesCount: images.length,
    animations: animDetails,
    hasSkins: skins.length > 0,
    extensionsUsed,
    extensionsRequired,
    isDraco: extensionsUsed.includes('KHR_draco_mesh_compression'),
    isMeshopt: extensionsUsed.includes('EXT_meshopt_compression'),
  };
}

const targetFiles = [
  'public/models/home-island.glb',
  'public/models/archive/archive-island.glb',
  'public/models/archive/archive-library.glb',
  'public/models/archive/archive-grimoires.glb',
  'public/models/archive/archive-decorations.glb',
  'public/models/archive/archive-floating-books.glb',
  'public/models/transition/himmel.glb',
  'public/models/transition/frieren.glb',
  'public/models/transition/heiter.glb',
  'public/models/transition/eisen.glb',
  'public/models/transition/frieren-magic.glb',
  'public/models/whispering-forest/whispering-forest-island.glb',
  'public/models/whispering-forest/forest-vegetation.glb',
  'public/models/whispering-forest/enchanted-pond.glb',
  'public/models/whispering-forest/heiter-resting-area.glb',
  'public/models/blue-flower-garden/blue-flower-garden-complete.glb',
  'public/models/blue-flower-garden/flowers/dense-flower-meadow.glb',
  'public/models/blue-flower-garden/flowers/foreground-flowers-detailed.glb',
  'public/models/blue-flower-garden/flowers/flower-wreath.glb',
  'public/models/blue-flower-garden/island/flower-garden-island.glb',
  'public/models/blue-flower-garden/island/floating-rocks.glb',
  'public/models/blue-flower-garden/vegetation/flowering-trees.glb',
  'public/models/blue-flower-garden/vegetation/garden-shrubs.glb',
  'public/models/blue-flower-garden/environment/dreamy-clouds.glb',
  'public/models/blue-flower-garden/environment/sky-dome.glb',
  'public/models/blue-flower-garden/effects/floating-petals.glb',
  'public/models/blue-flower-garden/effects/magical-motes.glb',
  'public/models/rune-workshop/island/workshop-island.glb',
  'public/models/rune-workshop/architecture/rune-workshop.glb',
];

console.log('--- 3D ASSETS DEEP AUDIT ---');
const results = [];
for (const file of targetFiles) {
  if (fs.existsSync(file)) {
    try {
      results.push(inspectGLB(file));
    } catch (e) {
      results.push({ filePath: file, error: e.message });
    }
  }
}

console.log(JSON.stringify(results, null, 2));

