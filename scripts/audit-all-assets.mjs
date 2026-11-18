import fs from 'node:fs';
import path from 'node:path';

function readGLBJSON(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    throw new Error(`Not a valid GLB file: ${filePath}`);
  }
  const version = buf.readUInt32LE(4);
  const totalLength = buf.readUInt32LE(8);
  const jsonChunkLength = buf.readUInt32LE(12);
  const jsonChunkType = buf.readUInt32LE(16); // 0x4E4F534A is JSON

  const jsonBuf = buf.subarray(20, 20 + jsonChunkLength);
  const jsonStr = jsonBuf.toString('utf8');
  return JSON.parse(jsonStr);
}

function auditGLB(filePath) {
  const json = readGLBJSON(filePath);
  const relPath = path.relative(process.cwd(), filePath);

  const nodes = json.nodes || [];
  const meshes = json.meshes || [];
  const materials = json.materials || [];
  const skins = json.skins || [];
  const animations = json.animations || [];

  // Named nodes
  const namedNodes = nodes.map((n, i) => ({
    id: i,
    name: n.name || `Node_${i}`,
    hasMesh: n.mesh !== undefined,
    meshName: n.mesh !== undefined && meshes[n.mesh] ? meshes[n.mesh].name : undefined,
    primitivesCount: n.mesh !== undefined && meshes[n.mesh] ? meshes[n.mesh].primitives.length : 0,
    hasSkin: n.skin !== undefined,
    children: n.children || [],
    translation: n.translation,
    rotation: n.rotation,
    scale: n.scale,
  }));

  // Analyze hierarchy: which nodes are top-level or direct children of scene
  const sceneNodeIds = (json.scenes && json.scenes[0] && json.scenes[0].nodes) || [];

  return {
    filePath: relPath,
    fileSizeKB: Math.round(fs.statSync(filePath).size / 1024),
    nodesCount: nodes.length,
    meshesCount: meshes.length,
    materialsCount: materials.length,
    skinsCount: skins.length,
    animationsCount: animations.length,
    sceneRoots: sceneNodeIds,
    animationNames: animations.map((a) => a.name || 'unnamed'),
    skinNames: skins.map((s) => s.name || 'unnamed'),
    namedNodes,
  };
}

const auditFiles = [
  'public/models/home-island.glb',
  'public/models/archive/archive-island.glb',
  'public/models/archive/archive-library.glb',
  'public/models/archive/archive-decorations.glb',
  'public/models/archive/archive-floating-books.glb',
  'public/models/archive/archive-grimoires.glb',
  'public/models/whispering-forest/whispering-forest-island.glb',
  'public/models/whispering-forest/ancient-tree.glb',
  'public/models/whispering-forest/enchanted-pond.glb',
  'public/models/whispering-forest/forest-vegetation.glb',
  'public/models/whispering-forest/forest-decorations.glb',
  'public/models/whispering-forest/forest-waterfall.glb',
  'public/models/whispering-forest/heiter-resting-area.glb',
  'public/models/rune-workshop/island/workshop-island.glb',
  'public/models/rune-workshop/architecture/rune-workshop.glb',
  'public/models/transition/frieren.glb',
  'public/models/transition/himmel.glb',
  'public/models/transition/heiter.glb',
  'public/models/transition/eisen.glb',
];

console.log('=== AUDITING 3D GLB ASSETS FOR EXPLODED-VIEW TRANSITION COMPATIBILITY ===\n');

const results = [];
for (const file of auditFiles) {
  if (fs.existsSync(file)) {
    const res = auditGLB(file);
    results.push(res);
    console.log(`[AUDIT] ${res.filePath}`);
    console.log(`  Size: ${res.fileSizeKB} KB | Nodes: ${res.nodesCount} | Meshes: ${res.meshesCount} | Materials: ${res.materialsCount} | Skins: ${res.skinsCount} | Animations: ${res.animationsCount}`);
    if (res.animationNames.length > 0) {
      console.log(`  Animations (${res.animationNames.length}): ${res.animationNames.slice(0, 5).join(', ')}...`);
    }
    // Print top-level or interesting named nodes
    const topNamed = res.namedNodes.filter((n) => n.name && !n.name.startsWith('Node_'));
    console.log(`  Named Objects (${topNamed.length}): ${topNamed.slice(0, 10).map((n) => n.name).join(', ')}${topNamed.length > 10 ? '...' : ''}`);
    console.log('');
  } else {
    console.log(`[MISSING] ${file}`);
  }
}

fs.writeFileSync('scripts/audit-results.json', JSON.stringify(results, null, 2));
console.log('Detailed results written to scripts/audit-results.json');

