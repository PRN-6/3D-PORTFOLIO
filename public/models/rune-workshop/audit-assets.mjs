import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as THREE from 'three';
const folder=path.resolve('public/models/rune-workshop'),manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const assert=(c,m)=>{if(!c)throw Error(m);};
const report=[],widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const exported=[];
function find(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())find(p);else if(e.name.endsWith('.glb'))exported.push(path.relative(folder,p).replaceAll('\\','/'));}}
find(folder);
assert(JSON.stringify(exported.sort())===JSON.stringify(manifest.assets.map(a=>a.file).sort()),'Manifest and actual GLB inventory differ');
for(const spec of manifest.assets){
 const file=spec.file,raw=fs.readFileSync(path.join(folder,file));
 assert(raw.readUInt32LE(0)===0x46546c67&&raw.readUInt32LE(4)===2&&raw.readUInt32LE(8)===raw.length,file+': GLB header');
 const length=raw.readUInt32LE(12),g=JSON.parse(raw.subarray(20,20+length)),bin=raw.subarray(28+length);
 assert(bin.length===g.buffers[0].byteLength&&!g.skins?.length,file+': buffer length / no embedded character');
 for(const bv of g.bufferViews)assert((bv.byteOffset??0)%4===0&&(bv.byteOffset??0)+bv.byteLength<=bin.length,file+': buffer view');
 const arrays=g.accessors.map(a=>{
  const bv=g.bufferViews[a.bufferView],size=widths[a.type],start=(bv.byteOffset??0)+(a.byteOffset??0);
  assert(size&&(a.componentType===5126||a.componentType===5125)&&a.count*size*4+(a.byteOffset??0)<=bv.byteLength,file+': accessor');
  const values=Array.from({length:a.count*size},(_,i)=>a.componentType===5126?bin.readFloatLE(start+i*4):bin.readUInt32LE(start+i*4));assert(values.every(Number.isFinite),file+': finite values');
  for(let j=0;j<size;j++){let min=Infinity,max=-Infinity;for(let i=j;i<values.length;i+=size){min=Math.min(min,values[i]);max=Math.max(max,values[i]);}assert(Math.abs(min-a.min[j])<1e-4&&Math.abs(max-a.max[j])<1e-4,file+': declared bounds');}
  return values;
 });
 for(const tex of g.textures??[])assert(g.images[tex.source],file+': texture/image reference');
 for(const img of g.images??[]){assert(!img.uri&&img.mimeType==='image/png'&&g.bufferViews[img.bufferView],file+': embedded image');const bv=g.bufferViews[img.bufferView],png=bin.subarray(bv.byteOffset,bv.byteOffset+bv.byteLength);assert(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&png.readUInt32BE(16)===256&&png.readUInt32BE(20)===256,file+': PNG dimensions');}
 for(const mat of g.materials){const tex=mat.pbrMetallicRoughness?.baseColorTexture;if(tex)assert(g.textures?.[tex.index],file+': material texture');}
 let triangles=0;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),used=new Set();
 for(const mesh of g.meshes)for(const p of mesh.primitives){
  const pos=arrays[p.attributes.POSITION],indices=arrays[p.indices];
  assert(g.materials[p.material]&&p.attributes.NORMAL!==undefined&&p.attributes.TEXCOORD_0!==undefined,file+': material, normal, UV');
  used.add(p.material);assert(indices.length%3===0&&indices.every(i=>i<pos.length/3),file+': index range');triangles+=indices.length/3;
  for(let i=0;i<indices.length;i+=3){a.fromArray(pos,indices[i]*3);b.fromArray(pos,indices[i+1]*3);c.fromArray(pos,indices[i+2]*3);assert(b.sub(a).cross(c.sub(a)).lengthSq()>1e-16,file+': degenerate triangle');}
 }
 assert(used.size===g.materials.length,file+': unused materials');
 const box=new THREE.Box3();
 function walk(id,parent){
  const n=g.nodes[id],matrix=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(n.translation??[0,0,0]),new THREE.Quaternion().fromArray(n.rotation??[0,0,0,1]),new THREE.Vector3().fromArray(n.scale??[1,1,1]));matrix.premultiply(parent);
  if(n.mesh!==undefined)for(const p of g.meshes[n.mesh].primitives){const positions=arrays[p.attributes.POSITION];for(let i=0;i<positions.length;i+=3)box.expandByPoint(new THREE.Vector3().fromArray(positions,i).applyMatrix4(matrix));}
  for(const child of n.children??[])walk(child,matrix);
 }
 g.scenes[g.scene??0].nodes.forEach(i=>walk(i,new THREE.Matrix4()));
 const animations=(g.animations??[]).map(clip=>{
  for(const sampler of clip.samplers){const times=arrays[sampler.input];assert(times.every((t,i)=>i===0||t>times[i-1])&&g.accessors[sampler.output].count===times.length,file+': animation keys');}
  for(const channel of clip.channels)assert(g.nodes[channel.target.node],file+': animation target');
  return {name:clip.name,duration:Math.max(...clip.samplers.map(s=>arrays[s.input].at(-1))),targets:clip.channels.map(c=>({node:g.nodes[c.target.node].name,path:c.target.path}))};
 });
 report.push({file,role:spec.role,bytes:raw.length,sha256:sha(raw),dimensions:box.getSize(new THREE.Vector3()).toArray().map(v=>+v.toFixed(3)),bounds:{min:box.min.toArray(),max:box.max.toArray()},triangles,drawBatches:g.meshes.length,materials:g.materials.map(m=>m.name),textures:(g.images??[]).length,animations,placements:spec.placements});
}
const baseline=JSON.parse(fs.readFileSync(path.join(folder,'preservation-baseline.json'),'utf8'));
const changed=baseline.filter(entry=>!fs.existsSync(entry.file)||sha(fs.readFileSync(entry.file))!==entry.sha256);
assert(changed.length===0,'Existing assets changed: '+changed.map(e=>e.file).join(', '));
const eisen=fs.readFileSync('public/models/transition/eisen.glb'),eg=JSON.parse(eisen.subarray(20,20+eisen.readUInt32LE(12)));
assert(sha(eisen)===manifest.eisen.sha256&&eg.animations.some(a=>a.name===manifest.eisen.clip),'Eisen source/clip mismatch');
const result={validatedAt:new Date().toISOString(),checks:'Inventory, GLB buffers/accessors/indices, finite data, bounds, normals/UVs, nondegenerate geometry, used materials, embedded PNGs and references, animation keys/targets, preservation hashes.',assetCount:report.length,totalBytes:report.reduce((s,a)=>s+a.bytes,0),totalTriangles:report.reduce((s,a)=>s+a.triangles,0),existingAssetsChecked:baseline.length,existingAssetsUnchanged:true,eisen:{file:manifest.eisen.file,sha256:sha(eisen),skins:eg.skins.length,clips:eg.animations.map(a=>a.name)},assets:report};
fs.writeFileSync(path.join(folder,'asset-inventory.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,assets:report.length}));

