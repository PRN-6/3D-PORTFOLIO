// Read-only GLB/glTF inventory. Run from the repository root; never rewrites assets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import draco from 'draco3dgltf';

const rootDir = path.resolve(process.argv[2] || 'public/models');
const output = process.argv[3];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco.createDecoderModule(),
});
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function triangles(p) {
  const n = (p.getIndices() || p.getAttribute('POSITION'))?.getCount() || 0;
  return p.getMode() === 4 ? Math.floor(n / 3) : [5, 6].includes(p.getMode()) ? Math.max(0, n - 2) : 0;
}
const assets = [];
for (const file of walk(rootDir).filter(f => /\.(glb|gltf)$/i.test(f)).sort()) {
  const bytes = fs.readFileSync(file);
  const item = { path: path.relative(process.cwd(), file).replaceAll('\\', '/'), bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  try {
    const doc = await io.read(file);
    const root = doc.getRoot();
    const primitives = root.listMeshes().flatMap(m => m.listPrimitives());
    const scenes = root.listScenes().map(s => {
      let primitiveInstances = 0, triangleInstances = 0;
      s.traverse(n => { for (const p of n.getMesh()?.listPrimitives() || []) {
        primitiveInstances++; triangleInstances += triangles(p);
      } });
      return { name: s.getName(), bounds: getBounds(s), primitiveInstances, triangleInstances };
    });
    Object.assign(item, {
      extensions: root.listExtensionsUsed().map(e => e.extensionName),
      nodes: root.listNodes().length, meshes: root.listMeshes().length,
      primitives: primitives.length, uniqueMeshTriangles: primitives.reduce((s, p) => s + triangles(p), 0),
      vertices: primitives.reduce((s, p) => s + (p.getAttribute('POSITION')?.getCount() || 0), 0),
      primitivesWithoutNormals: primitives.filter(p => !p.getAttribute('NORMAL')).length,
      primitivesWithMorphTargets: primitives.filter(p => p.listTargets().length).length,
      skins: root.listSkins().map(s => ({ name: s.getName(), joints: s.listJoints().length })),
      materials: root.listMaterials().map(m => ({ name: m.getName(), baseColor: m.getBaseColorFactor(),
        roughness: m.getRoughnessFactor(), metalness: m.getMetallicFactor(), alphaMode: m.getAlphaMode(),
        doubleSided: m.getDoubleSided(), baseColorTexture: !!m.getBaseColorTexture(), normalTexture: !!m.getNormalTexture(),
        occlusionTexture: !!m.getOcclusionTexture(), emissive: m.getEmissiveFactor() })),
      textures: root.listTextures().map(t => ({ name: t.getName(), mime: t.getMimeType(),
        dimensions: t.getSize(), encodedBytes: t.getImage()?.byteLength || 0,
        rgba8MipEstimateBytes: t.getSize() ? Math.ceil(t.getSize()[0] * t.getSize()[1] * 4 * 4 / 3) : null })),
      animations: root.listAnimations().map(a => ({ name: a.getName(), channels: a.listChannels().length,
        missingTargets: a.listChannels().filter(c => !c.getTargetNode()).length,
        duration: Math.max(0, ...a.listSamplers().map(s => s.getInput()?.getMax([])[0] || 0)),
        paths: [...new Set(a.listChannels().map(c => c.getTargetPath()))] })), scenes,
    });
  } catch (error) { item.error = error.message; }
  assets.push(item);
}
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(),
  methodology: 'Decoded using installed glTF Transform and Draco. Unique mesh counts differ from scene node instances; neither is measured draw calls. Bounds are rest-pose bounds. Texture memory is RGBA8+mips estimate, not measured VRAM. External glTF resources are read but file bytes/hash describe the entry file only. EXT_mesh_gpu_instancing multiplicity is not expanded. Not a Khronos conformance validator.',
  totals: { files: assets.length, bytes: assets.reduce((s, a) => s + a.bytes, 0), errors: assets.filter(a => a.error).length }, assets };
if (output) { fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); }
else console.log(JSON.stringify(report, null, 2));
console.error(JSON.stringify(report.totals));
if (report.totals.errors) process.exitCode = 1;
