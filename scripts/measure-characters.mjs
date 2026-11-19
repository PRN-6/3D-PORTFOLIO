import fs from 'node:fs';
import path from 'node:path';

function getGlbBounds(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  console.log(`\n=== Bounds for ${path.basename(file)} ===`);
  const posAccessor = json.accessors.find(a => a.type === 'VEC3' && a.min && a.max);
  if (posAccessor) {
    console.log('Position Min:', posAccessor.min);
    console.log('Position Max:', posAccessor.max);
    console.log('Size:', posAccessor.max.map((m, i) => m - posAccessor.min[i]));
  }
}

getGlbBounds('public/models/transition/himmel.glb');
getGlbBounds('public/models/transition/frieren.glb');

