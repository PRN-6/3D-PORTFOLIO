import fs from 'node:fs';
import path from 'node:path';

function readGLBJSON(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    throw new Error(`Not a valid GLB file: ${filePath}`);
  }
  const jsonChunkLength = buf.readUInt32LE(12);
  const jsonBuf = buf.subarray(20, 20 + jsonChunkLength);
  return JSON.parse(jsonBuf.toString('utf8'));
}

function analyzeGLB(filePath) {
  const json = readGLBJSON(filePath);
  const nodes = json.nodes || [];
  const meshes = json.meshes || [];
  const skins = json.skins || [];

  // Map children to parents
  const parentMap = new Map();
  nodes.forEach((n, idx) => {
    if (n.children) {
      n.children.forEach((c) => parentMap.set(c, idx));
    }
  });

  // Find root nodes
  const rootIndices = [];
  nodes.forEach((_, idx) => {
    if (!parentMap.has(idx)) {
      rootIndices.push(idx);
    }
  });

  // Collect node details
  const componentList = [];
  function traverse(idx, depth = 0, pathStr = '') {
    const n = nodes[idx];
    const name = n.name || `Node_${idx}`;
    const curPath = pathStr ? `${pathStr} > ${name}` : name;
    const hasMesh = n.mesh !== undefined;
    const meshName = hasMesh && meshes[n.mesh] ? meshes[n.mesh].name : undefined;
    const hasSkin = n.skin !== undefined;

    componentList.push({
      index: idx,
      name,
      depth,
      path: curPath,
      hasMesh,
      meshName,
      hasSkin,
      translation: n.translation || [0, 0, 0],
      rotation: n.rotation,
      scale: n.scale,
      childrenCount: (n.children || []).length,
    });

    if (n.children) {
      n.children.forEach((c) => traverse(c, depth + 1, curPath));
    }
  }

  rootIndices.forEach((r) => traverse(r, 0, ''));

  return {
    file: path.basename(filePath),
    relPath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    nodesCount: nodes.length,
    meshesCount: meshes.length,
    skinsCount: skins.length,
    components: componentList,
  };
}

console.log('=== ENUMERATING ALL GLB NODES & COMPONENTS ===\n');

// 1. Home Island
const homeData = analyzeGLB('public/models/home-island.glb');
console.log(`Hero's Home: ${homeData.nodesCount} nodes, ${homeData.meshesCount} meshes`);

// 2. Archive
const archiveDir = 'public/models/archive';
const archiveFiles = fs.readdirSync(archiveDir).filter((f) => f.endsWith('.glb'));
const archiveData = archiveFiles.map((f) => analyzeGLB(path.join(archiveDir, f)));
const archiveNodes = archiveData.reduce((acc, d) => acc + d.nodesCount, 0);
console.log(`Grand Mage's Archive: ${archiveFiles.length} files, ${archiveNodes} total nodes`);

// 3. Whispering Forest
const forestDir = 'public/models/whispering-forest';
const forestFiles = fs.readdirSync(forestDir).filter((f) => f.endsWith('.glb'));
const forestData = forestFiles.map((f) => analyzeGLB(path.join(forestDir, f)));
const forestNodes = forestData.reduce((acc, d) => acc + d.nodesCount, 0);
console.log(`Whispering Forest: ${forestFiles.length} files, ${forestNodes} total nodes`);

// 4. Rune Workshop
function findGLBs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findGLBs(full));
    } else if (file.endsWith('.glb')) {
      results.push(full);
    }
  });
  return results;
}
const workshopFiles = findGLBs('public/models/rune-workshop');
const workshopData = workshopFiles.map((f) => analyzeGLB(f));
const workshopNodes = workshopData.reduce((acc, d) => acc + d.nodesCount, 0);
console.log(`Rune Creation Workshop: ${workshopFiles.length} files, ${workshopNodes} total nodes`);

// Save detailed JSON
const inventory = {
  home: homeData,
  archive: archiveData,
  forest: forestData,
  workshop: workshopData,
};
fs.writeFileSync('scripts/all-island-components-inventory.json', JSON.stringify(inventory, null, 2));
console.log('\nSaved full component inventory to scripts/all-island-components-inventory.json');

