// Read-only geometry, rig and choreography checks for the exported candidate.
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { Quaternion } from 'three';
import draco from 'draco3dgltf';

const out=process.argv[2] || 'docs/audit/fun-grand-arena/after/quality.json';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const old=await io.read('public/models/fun/demon-battle.glb');
const doc=await io.read('public/models/fun/demon-battle-grand-arena.glb');
function geometry(document){
 const result={triangles:0,degenerateTriangles:0,nonfiniteValues:0,zeroNormals:0,invalidIndices:0,invalidWeightSums:0};
 for(const mesh of document.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  for(const attr of p.listAttributes())for(const value of attr.getArray())if(!Number.isFinite(value))result.nonfiniteValues++;
  const pos=p.getAttribute('POSITION'),norm=p.getAttribute('NORMAL'),weights=p.getAttribute('WEIGHTS_0');
  const indices=p.getIndices()?.getArray() || Array.from({length:pos.getCount()},(_,i)=>i);
  for(let i=0;i<indices.length;i+=3){
   result.triangles++;
   if([indices[i],indices[i+1],indices[i+2]].some(v=>v>=pos.getCount())){result.invalidIndices++;continue;}
   const a=pos.getElement(indices[i],[]),b=pos.getElement(indices[i+1],[]),c=pos.getElement(indices[i+2],[]);
   const u=b.map((v,j)=>v-a[j]),v=c.map((x,j)=>x-a[j]);
   if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-10)result.degenerateTriangles++;
  }
  if(norm)for(let i=0;i<norm.getCount();i++)if(Math.hypot(...norm.getElement(i,[]))<.5)result.zeroNormals++;
  if(weights)for(let i=0;i<weights.getCount();i++)if(Math.abs(weights.getElement(i,[]).reduce((a,b)=>a+b,0)-1)>.001)result.invalidWeightSums++;
 }
 return result;
}
const rigs=document=>document.getRoot().listSkins().map(s=>({name:s.getName(),joints:s.listJoints().map(n=>n.getName()),inverseBindMatrices:Array.from(s.getInverseBindMatrices().getArray())}));
const clips=document=>document.getRoot().listAnimations().filter(a=>a.getName()!=='Party_vs_Demon').map(a=>({name:a.getName(),channels:a.listChannels().map(c=>({node:c.getTargetNode().getName(),path:c.getTargetPath(),input:Array.from(c.getSampler().getInput().getArray()),output:Array.from(c.getSampler().getOutput().getArray())}))}));
const nodes=Object.fromEntries(doc.getRoot().listNodes().map(n=>[n.getName(),n]));
const choreography=doc.getRoot().listAnimations().find(a=>a.getName()==='Party_vs_Demon');
const tracks=choreography.listChannels().map(c=>({node:c.getTargetNode().getName(),path:c.getTargetPath(),times:Array.from(c.getSampler().getInput().getArray()),values:Array.from(c.getSampler().getOutput().getArray())}));
const hiddenReset=new Set(['Frieren_AzureBolt','Demon_RoseBolt']);
const seams=[];
for(const track of tracks){
 const size=track.path==='rotation'?4:3,start=track.values.slice(0,size),end=track.values.slice(-size);
 const delta=track.path==='rotation'?1-Math.abs(new Quaternion(...start).dot(new Quaternion(...end))):Math.max(...start.map((v,i)=>Math.abs(v-end[i])));
 if(delta>1e-5&&!hiddenReset.has(track.node))seams.push({node:track.node,path:track.path,delta});
}
const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
const samples=[];
for(let frame=0;frame<=192;frame++){
 for(const track of tracks){
  const size=track.path==='rotation'?4:3,value=track.values.slice(frame*size,(frame+1)*size),node=nodes[track.node];
  if(track.path==='rotation')node.setRotation(value);else if(track.path==='scale')node.setScale(value);else node.setTranslation(value);
 }
 const current=getBounds(nodes.Battle_Demon);
 for(let i=0;i<3;i++){bounds.min[i]=Math.min(bounds.min[i],current.min[i]);bounds.max[i]=Math.max(bounds.max[i],current.max[i]);}
 if([0,48,96,138,192].includes(frame))samples.push({time:frame/24,demonBounds:current});
}
const report={methodology:'Decoded candidate and original using glTF Transform/Draco. Geometry checks are static; demon bounds sample rigid hierarchy at all 193 authored frames. Hero skinned animated bounds and UV seams are visual checks, not covered by getBounds. Not Khronos conformance validation.',
 before:geometry(old),after:geometry(doc),rigsPreserved:JSON.stringify(rigs(old))===JSON.stringify(rigs(doc)),
 sourceClipsPreserved:JSON.stringify(clips(old))===JSON.stringify(clips(doc)),
 originalTerrainBounds:getBounds(old.getRoot().listNodes().find(n=>n.getName()==='Ruined_Battle_Block')),
 candidateTerrainBounds:getBounds(nodes.Ruined_Battle_Block),demonAnimatedBounds:bounds,samples,unexpectedLoopSeams:seams,tracks};
report.passed=report.rigsPreserved&&report.sourceClipsPreserved&&!seams.length&&
 !report.after.nonfiniteValues&&!report.after.zeroNormals&&!report.after.invalidIndices&&!report.after.invalidWeightSums;
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,tracks:tracks.length},null,2));if(!report.passed)process.exitCode=1;
