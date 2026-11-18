import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as THREE from 'three';
const folder=path.resolve('public/models/whispering-forest');
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const report=[];
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const expected=[...manifest.files,...manifest.connections].map(a=>a.file).sort();
assert(JSON.stringify(fs.readdirSync(folder).filter(name=>name.endsWith('.glb')).sort())===JSON.stringify(expected),'GLB inventory differs from manifest');
for(const file of fs.readdirSync(folder).filter(name=>name.endsWith('.glb')).sort()){
 const raw=fs.readFileSync(path.join(folder,file));
 assert(raw.readUInt32LE(0)===0x46546c67&&raw.readUInt32LE(4)===2&&raw.readUInt32LE(8)===raw.length,file+': header');
 const jsonLength=raw.readUInt32LE(12),g=JSON.parse(raw.subarray(20,20+jsonLength).toString()),binary=raw.subarray(28+jsonLength);
 assert(binary.length===g.buffers[0].byteLength,file+': buffer length');
 assert(!(g.skins?.length),file+': environment must not embed a replacement character');
 for(const view of g.bufferViews)assert((view.byteOffset??0)%4===0&&(view.byteOffset??0)+view.byteLength<=binary.length,file+': view bounds');
 const arrays=g.accessors.map((a,index)=>{
  const view=g.bufferViews[a.bufferView],size=widths[a.type],bytes=a.componentType===5126||a.componentType===5125?4:0;
  assert(bytes>0&&size&&Number.isInteger(a.count),file+': accessor '+index);
  const start=(view.byteOffset??0)+(a.byteOffset??0);
  assert((a.byteOffset??0)+a.count*size*bytes<=view.byteLength,file+': accessor bounds');
  const values=Array.from({length:a.count*size},(_,i)=>a.componentType===5126?binary.readFloatLE(start+i*4):binary.readUInt32LE(start+i*4));
  assert(values.every(Number.isFinite),file+': nonfinite accessor');
  for(let k=0;k<size;k++){const vals=values.filter((_,i)=>i%size===k);assert(Math.abs(Math.min(...vals)-a.min[k])<1e-4&&Math.abs(Math.max(...vals)-a.max[k])<1e-4,file+': accessor bounds mismatch');}
  return values;
 });
 let triangles=0,degenerate=0;
 const usedMaterials=new Set();
 for(const texture of g.textures??[])assert(g.images?.[texture.source],file+': texture image link');
 for(const image of g.images??[]){
  const view=g.bufferViews[image.bufferView];assert(view&&image.mimeType==='image/png'&&!image.uri,file+': embedded PNG image');
  const png=binary.subarray(view.byteOffset,view.byteOffset+view.byteLength);assert(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file+': PNG signature');
  assert(png.readUInt32BE(16)===256&&png.readUInt32BE(20)===256,file+': texture dimensions');
 }
 for(const material of g.materials){const pbr=material.pbrMetallicRoughness;assert(pbr&&pbr.baseColorFactor.every(n=>Number.isFinite(n)&&n>=0&&n<=1),file+': base colour');if(pbr.baseColorTexture)assert(g.textures?.[pbr.baseColorTexture.index],file+': material texture link');}
 for(const mesh of g.meshes)for(const p of mesh.primitives){
  const positions=arrays[p.attributes.POSITION],indices=arrays[p.indices];
  assert(indices.length%3===0&&indices.every(i=>i<positions.length/3),file+': index range');
  assert(p.attributes.NORMAL!==undefined&&p.attributes.TEXCOORD_0!==undefined,file+': normals and UV required');
  assert(g.materials[p.material],file+': primitive material link');
  usedMaterials.add(p.material);triangles+=indices.length/3;
  const va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
  for(let i=0;i<indices.length;i+=3){va.fromArray(positions,indices[i]*3);vb.fromArray(positions,indices[i+1]*3);vc.fromArray(positions,indices[i+2]*3);if(vb.sub(va).cross(vc.sub(va)).lengthSq()<1e-16)degenerate++;}
 }
 const box=new THREE.Box3(),walk=(id,parent)=>{
  const n=g.nodes[id],matrix=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(n.translation??[0,0,0]),new THREE.Quaternion().fromArray(n.rotation??[0,0,0,1]),new THREE.Vector3().fromArray(n.scale??[1,1,1]));
  matrix.premultiply(parent);
  if(n.mesh!==undefined)for(const p of g.meshes[n.mesh].primitives){const positions=arrays[p.attributes.POSITION];for(let i=0;i<positions.length;i+=3)box.expandByPoint(new THREE.Vector3().fromArray(positions,i).applyMatrix4(matrix));}
  for(const child of n.children??[])walk(child,matrix);
 };
 g.scenes[g.scene??0].nodes.forEach(id=>walk(id,new THREE.Matrix4()));
 const animations=(g.animations??[]).map(clip=>{
  for(const sampler of clip.samplers){const times=arrays[sampler.input];assert(times.every((n,i)=>i===0||n>times[i-1]),file+': key order');assert(g.accessors[sampler.output].count===times.length,file+': channel size');}
  return {name:clip.name,duration:Math.max(...clip.samplers.map(s=>arrays[s.input].at(-1)))};
 });
 assert(degenerate===0,file+': degenerate triangles');
 report.push({file,sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length,dimensions:box.getSize(new THREE.Vector3()).toArray().map(v=>+v.toFixed(3)),bounds:{min:box.min.toArray(),max:box.max.toArray()},triangles,degenerateTriangles:degenerate,drawBatches:g.meshes.length,embeddedTextures:(g.images??[]).length,materials:[...usedMaterials].map(i=>g.materials[i].name),animations});
}
const heiter=fs.readFileSync('public/models/transition/heiter.glb');
const heiterHash=crypto.createHash('sha256').update(heiter).digest('hex');
assert(heiterHash==='c12f31fcabe2d662b12c2f80f3102398d4a753a6f3a90664c7039f1191e83b7c','Heiter differs from the preserved source hash');
const heiterJson=JSON.parse(heiter.subarray(20,20+heiter.readUInt32LE(12)).toString());
assert(heiterJson.animations.some(a=>a.name==='heiter_idle'),'Missing actual Heiter idle');
const result={validatedAt:new Date().toISOString(),assetCount:report.length,bytes:report.reduce((n,a)=>n+a.bytes,0),validation:'Manifest inventory, GLB v2 headers, buffer ranges, finite accessors, declared bounds, normals, UVs, index ranges, no degenerate triangles, animation time order and value counts, transformed mesh bounds, embedded PNG headers and dimensions, material/texture/image links, preserved Heiter hash.',heiter:{path:'/models/transition/heiter.glb',sha256:heiterHash,unchanged:true,skins:heiterJson.skins.length,clips:heiterJson.animations.map(a=>a.name)},assets:report};
fs.writeFileSync(path.join(folder,'asset-dimensions.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({assetCount:result.assetCount,bytes:result.bytes,triangles:report.reduce((n,a)=>n+a.triangles,0),degenerate:report.filter(a=>a.degenerateTriangles).map(a=>({file:a.file,count:a.degenerateTriangles}))}));

