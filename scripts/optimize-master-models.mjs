import { NodeIO } from '@gltf-transform/core';
import { draco, prune, dedup } from '@gltf-transform/functions';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';

async function main() {
  console.log('=== Draco Compressing Master Islands & High-Poly Assets ===');

  const encoderModule = await draco3d.createEncoderModule();
  const decoderModule = await draco3d.createDecoderModule();
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.encoder': encoderModule,
      'draco3d.decoder': decoderModule,
    });

  const targets = [
    // Blue Flower Garden
    { path: 'public/models/blue-flower-garden/blue-flower-garden-complete.glb', maxMB: 4.0 },
    { path: 'public/models/blue-flower-garden/flowers/dense-flower-meadow.glb', maxMB: 3.5 },
    { path: 'public/models/blue-flower-garden/island/flower-garden-island.glb', maxMB: 1.0 },
    { path: 'public/models/blue-flower-garden/environment/dreamy-clouds.glb', maxMB: 0.2 },
    { path: 'public/models/blue-flower-garden/flowers/foreground-flowers-detailed.glb', maxMB: 0.5 },
    { path: 'public/models/blue-flower-garden/island/floating-rocks.glb', maxMB: 0.15 },
    { path: 'public/models/blue-flower-garden/vegetation/flowering-trees.glb', maxMB: 0.15 },
    { path: 'public/models/blue-flower-garden/vegetation/garden-shrubs.glb', maxMB: 0.15 },
    { path: 'public/models/blue-flower-garden/effects/floating-petals.glb', maxMB: 0.2 },
    { path: 'public/models/blue-flower-garden/effects/magical-motes.glb', maxMB: 0.2 },

    // Core Islands
    { path: 'public/models/home-island.glb', maxMB: 3.0 },
    { path: 'public/models/archive/archive-library.glb', maxMB: 1.5 },
    { path: 'public/models/archive/archive-island.glb', maxMB: 1.0 },
  ];

  for (const t of targets) {
    if (!fs.existsSync(t.path)) {
      console.warn(`[SKIP] File not found: ${t.path}`);
      continue;
    }

    const origSize = fs.statSync(t.path).size;
    const doc = await io.read(t.path);

    await doc.transform(
      dedup(),
      prune(),
      draco({
        quantizePositionBits: 14,
        quantizeNormalBits: 10,
        quantizeTexcoordBits: 12,
        quantizeGenericBits: 10,
      })
    );

    const binary = await io.writeBinary(doc);
    fs.writeFileSync(t.path, binary);

    const sizeMB = (binary.length / (1024 * 1024)).toFixed(2);
    const origMB = (origSize / (1024 * 1024)).toFixed(2);
    const ratio = (((origSize - binary.length) / origSize) * 100).toFixed(0);

    console.log(`[Draco] ${t.path.padEnd(55)} ${origMB.padStart(6)} MB -> ${sizeMB.padStart(5)} MB (-${ratio}%)`);
    if (binary.length > t.maxMB * 1024 * 1024) {
      console.warn(`[ALERT] ${t.path} exceeds budget (${t.maxMB} MB): ${sizeMB} MB`);
    }
  }

  console.log('=== Master Models Compression Completed Successfully ===\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
