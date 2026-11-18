import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const output = path.resolve('public/models/whispering-forest');
fs.mkdirSync(output,{recursive:true});


class GLB {
  constructor() {
    this.json = { asset: { version: '2.0', generator: 'Heroâ€™s Home transition asset tools' },
      scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], skins: [], materials: [],
      animations: [], textures: [], images: [], samplers: [], accessors: [], bufferViews: [], buffers: [] };
    this.parts = [];
    this.length = 0;
  }
  view(bytes, options = {}) {
    const padding = (4 - this.length % 4) % 4;
    if (padding) { this.parts.push(Buffer.alloc(padding)); this.length += padding; }
    const index = this.json.bufferViews.length;
    this.json.bufferViews.push({ buffer: 0, byteOffset: this.length, byteLength: bytes.length, ...options });
    this.parts.push(bytes); this.length += bytes.length;
    return index;
  }
  accessor(values, type, componentType = 5126, target) {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const array = componentType === 5125 ? new Uint32Array(values.flat()) : new Float32Array(values.flat());
    const min = Array(size).fill(Infinity), max = Array(size).fill(-Infinity);
    Array.from(array).forEach((n, i) => { min[i % size] = Math.min(min[i % size], n); max[i % size] = Math.max(max[i % size], n); });
    const bufferView = this.view(Buffer.from(array.buffer), target ? { target } : {});
    const index = this.json.accessors.length;
    this.json.accessors.push({ bufferView, componentType, type, count: array.length / size, min, max });
    return index;
  }
  save(filename) {
    this.json.asset.generator = 'Whispering Forest asset tools';
    for (const [key, value] of Object.entries(this.json)) {
      if (Array.isArray(value) && value.length === 0) delete this.json[key];
    }
    for (const node of this.json.nodes) {
      if (node.children?.length === 0) delete node.children;
    }
    const binary = Buffer.concat([...this.parts, Buffer.alloc((4 - this.length % 4) % 4)]);
    this.json.buffers = [{ byteLength: binary.length }];
    const text = Buffer.from(JSON.stringify(this.json));
    const json = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 32)]);
    const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + json.length + binary.length, 8);
    header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(path.join(output, filename), Buffer.concat([header, json, binHeader, binary]));
  }
}


const palette = {
 leaf:['#38734d',0,1], leafLight:['#709356',0,1], leafDark:['#224c3e',0,1], bark:['#5b473c',0,.95], barkLight:['#8b6e4c',0,.9], water:['#347b92',.18,.24,'#133e4f'], foam:['#afe6e4',0,.55,'#4b9cbd'], pink:['#c29ab4',0,.7],
 stone:['#54617c',0,.92], edge:['#8e9ab2',0,.8], dark:['#29354f',0,.94], grass:['#426b48',0,1],
 moss:['#8aab62',0,1], wood:['#634b3f',0,.8], gold:['#b99a61',.62,.38], paper:['#dbcfb5',0,.9],
 teal:['#347e8f',.15,.55], violet:['#715389',.12,.55], red:['#874d60',0,.7], blue:['#405c91',0,.65],
 green:['#4d7163',0,.68], leather:['#88724d',0,.72], glow:['#95e4ee',0,.4,'#70d9ed'],
 rune:['#a7a0ff',0,.5,'#8877ed'], flame:['#ffe2a0',0,.5,'#ffd485'],
};
let seed=728;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const v=(...a)=>new T.Vector3(...a);
class Asset {
 constructor(){this.glb=new GLB();this.roots=[];this.parts=new Map();this.materials={};
 for(const [name,[color,metallicFactor,roughnessFactor,emission]] of Object.entries(palette)){
  const material={name,pbrMetallicRoughness:{baseColorFactor:[...new T.Color(color).toArray(),1],metallicFactor,roughnessFactor}};
  if(emission)material.emissiveFactor=new T.Color(emission).toArray();
  this.materials[name]=this.glb.json.materials.length;this.glb.json.materials.push(material);
 }}
 group(name,position=[0,0,0],extras={}) {
  const id=this.glb.json.nodes.length;this.glb.json.nodes.push({name,translation:position,extras,children:[]});
  this.glb.json.scenes[0].nodes.push(id);return id;
 }
 add(root,geometry,mat,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  geometry.applyMatrix4(new T.Matrix4().compose(v(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),v(...scale)));
  if(geometry.index)geometry=geometry.toNonIndexed();
  geometry.deleteAttribute('uv1');const key=root+'|'+mat;
  if(!this.parts.has(key))this.parts.set(key,[]);
  this.parts.get(key).push(geometry);
 }
 box(root,p,s,mat,rotation=[0,0,0]){this.add(root,new T.BoxGeometry(...s),mat,p,rotation)}
 rod(root,a,b,r,mat,sides=8){
  const av=v(...a),bv=v(...b),d=bv.clone().sub(av);
  const g=new T.CylinderGeometry(r,r,d.length(),sides);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0,1,0),d.normalize()));
  this.add(root,g,mat,av.add(bv).multiplyScalar(.5).toArray());
 }
 ring(root,p,r,t,mat,rotation=[Math.PI/2,0,0]){this.add(root,new T.TorusGeometry(r,t,6,64),mat,p,rotation)}
 animate(root,name,duration,amplitude=.15){
  const input=this.glb.accessor(Array.from({length:33},(_,i)=>i*duration/32),'SCALAR');
  const origin=this.glb.json.nodes[root].translation;
  const positions=[],rotations=[];
  for(let i=0;i<=32;i++){const t=i/32*Math.PI*2;positions.push([origin[0],origin[1]+Math.sin(t)*amplitude,origin[2]]);
   rotations.push(new T.Quaternion().setFromEuler(new T.Euler(.045*Math.sin(t),.13*Math.sin(t),.04*Math.cos(t))).toArray());}
  this.glb.json.animations.push({name,samplers:[{input,output:this.glb.accessor(positions,'VEC3'),interpolation:'LINEAR'},{input,output:this.glb.accessor(rotations,'VEC4'),interpolation:'LINEAR'}],
   channels:[{sampler:0,target:{node:root,path:'translation'}},{sampler:1,target:{node:root,path:'rotation'}}]});
 }
 save(filename){
  if(process.argv.length>2&&!process.argv.slice(2).includes(filename)){this.parts.forEach(list=>list.forEach(g=>g.dispose()));this.parts.clear();return;}
  for(const name of ['stone','wood']){
   if(![...this.parts.keys()].some(key=>key.endsWith('|'+name)))continue;
   const raw=fs.readFileSync(path.join(output,'textures',name+'.png'));
   const image=this.glb.json.images.length;
   this.glb.json.images.push({name:name+'Grain',mimeType:'image/png',bufferView:this.glb.view(raw)});
   const texture=this.glb.json.textures.length;
   this.glb.json.textures.push({source:image});
   this.glb.json.materials[this.materials[name]].pbrMetallicRoughness.baseColorTexture={index:texture};
  }
  for(const [key,geometries]of this.parts){
   const [parent,mat]=key.split('|');const merged=mergeGeometries(geometries);const g=mergeVertices(merged);merged.dispose();
   // Vertex welding can collapse microscopic bank fragments; omit zero-area faces.
   const index=[],pa=g.attributes.position,va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3();
   for(let i=0;i<g.index.count;i+=3){const ia=g.index.getX(i),ib=g.index.getX(i+1),ic=g.index.getX(i+2);va.fromBufferAttribute(pa,ia);vb.fromBufferAttribute(pa,ib);vc.fromBufferAttribute(pa,ic);if(vb.sub(va).cross(vc.sub(va)).lengthSq()>1e-16)index.push(ia,ib,ic);}
   g.setIndex(index);
   const attributes={};
   for(const [key,semantic,type]of [['position','POSITION','VEC3'],['normal','NORMAL','VEC3'],['uv','TEXCOORD_0','VEC2']]){
    if(g.attributes[key])attributes[semantic]=this.glb.accessor(Array.from(g.attributes[key].array),type,5126,34962);
   }
   const id=this.glb.json.nodes.length;
   this.glb.json.nodes.push({name:this.glb.json.nodes[+parent].name+'_'+mat,mesh:this.glb.json.meshes.length});
   this.glb.json.nodes[+parent].children.push(id);
   this.glb.json.meshes.push({primitives:[{attributes,indices:this.glb.accessor(Array.from(g.index.array),'SCALAR',5125,34963),material:this.materials[mat]}]});
   g.dispose();geometries.forEach(g=>g.dispose());
  }
  this.parts.clear();this.glb.save(filename);
  console.log(filename,(fs.statSync(path.join(output,filename)).size/1e6).toFixed(2)+' MB',this.glb.json.meshes.length+' material batches');
 }
}
function rock(a,root,p,s,mat,detail=0){a.add(root,new T.IcosahedronGeometry(1,detail),mat,p,[rnd(),rnd(),rnd()],s)}
function crystal(a,root,p,s,mat='glow'){
 const g=new T.CylinderGeometry(0,.16,1,5);a.add(root,g,mat,[p[0],p[1]+s*.46,p[2]],[.13,.4,.2],[s,s,s]);
 a.add(root,new T.CylinderGeometry(.16,.11,.55,5),mat,[p[0],p[1]-.30*s,p[2]],[.13,.4,.2],[s,s,s]);
}
function arch(a,root,x,y,z,width,height,mat='edge',rotation=0){
 const points=[];
 for(let i=0;i<=24;i++){const t=i/24;points.push([x+Math.cos(rotation)*width*(t-.5),y+height-width*Math.sqrt(.75)+Math.sqrt(Math.max(0,width*width-(Math.abs(width*(t-.5))+width*.5)**2)),z-Math.sin(rotation)*width*(t-.5)])}
 for(let i=0;i<24;i++)a.rod(root,points[i],points[i+1],.085,mat,6);
 for(const side of [-1,1])a.rod(root,[x+Math.cos(rotation)*width*.5*side,y,z-Math.sin(rotation)*width*.5*side],
 [x+Math.cos(rotation)*width*.5*side,y+height-width*Math.sqrt(.75),z-Math.sin(rotation)*width*.5*side],.085,mat);
}
function book(a,root,p,size,color,open=false){
 const [w,h,d]=size;
 if(!open){
 a.box(root,p,[w*.91,h*.89,d], 'paper');
 for(const sign of [-1,1])a.box(root,[p[0],p[1],p[2]+sign*(d*.5+.018)],[w,h,.038],color);
 a.box(root,[p[0]-w*.5+.028,p[1],p[2]],[.056,h,d+.065],color);
 for(const yy of [-.33,.33])a.box(root,[p[0]-w*.5-.002,p[1]+yy*h,p[2]],[.015,.026,d+.073],'gold');
 for(const sign of [-1,1])a.box(root,[p[0]+sign*w*.34,p[1],p[2]+d*.5+.040],[.012,h*.78,.008],'gold');
 a.box(root,[p[0],p[1]+h*.36,p[2]+d*.5+.040],[w*.68,.013,.009],'gold');
 a.box(root,[p[0],p[1]-h*.36,p[2]+d*.5+.040],[w*.68,.013,.009],'gold');
 }else{
 for(const sign of [-1,1]){
 a.box(root,[p[0]+sign*w*.24,p[1],p[2]],[w*.48,.045,d],color,[0,0,sign*.12]);
 a.box(root,[p[0]+sign*w*.24,p[1]+.039,p[2]],[w*.45,.037,d*.94],'paper',[0,0,sign*.12]);
 for(let j=0;j<6;j++)a.box(root,[p[0]+sign*w*.24,p[1]+.068,p[2]-d*.30+j*d*.11],[w*.31,.003,.008],'wood',[0,0,sign*.12]);
 }}
}
function glyph(a,root,x,y,z,r,index){
 const points=5+index;
 a.ring(root,[x,y,z],r,.007,index%2?'rune':'glow',[0,0,0]);
 for(let i=0;i<points;i++){
 const t=i/points*Math.PI*2,b=(i+2)/points*Math.PI*2;
 a.rod(root,[x+Math.cos(t)*r*.78,y+Math.sin(t)*r*.78,z],[x+Math.cos(b)*r*.78,y+Math.sin(b)*r*.78,z],.005,index%2?'rune':'glow',5);
 }
}
// Forest geometry, authored in metres in an island-local coordinate system.
const PI=Math.PI,TAU=PI*2;
const colors=['teal','green','violet','blue','red','leather'];
const H=(x,z)=>.25+1.25*Math.exp(-((x-4)**2/10+(z+3.5)**2/9))+.10*Math.sin(x*.6)*Math.cos(z*.5);
const streamX=z=>-3.1+.34*Math.sin(z*.9);
const pondInside=(x,z)=>((x+3.2)/2.15)**2+((z-2.25)/1.50)**2<1;
const channel=(x,z)=>z>2.2&&Math.abs(x-streamX(z))<.46;
function surface(positions){
 const clean=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<positions.length;i+=9){a.fromArray(positions,i);b.fromArray(positions,i+3);c.fromArray(positions,i+6);if(b.sub(a).cross(c.sub(a)).lengthSq()>1e-16)clean.push(...positions.slice(i,i+9));}
 positions=clean;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
 const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]*.35,positions[i+2]*.35);
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
function tube(a,root,points,radii,mat,sides=10){
 const curve=new T.CatmullRomCurve3(points.map(p=>v(...p))),frames=curve.computeFrenetFrames(24,false),p=[];
 const rings=[];
 for(let i=0;i<=24;i++){const u=i/24,center=curve.getPoint(u),index=u*(radii.length-1),lo=Math.floor(index),r=T.MathUtils.lerp(radii[lo],radii[Math.min(lo+1,radii.length-1)],index-lo);
 rings.push(Array.from({length:sides},(_,j)=>center.clone().addScaledVector(frames.normals[i],Math.cos(j/sides*TAU)*r).addScaledVector(frames.binormals[i],Math.sin(j/sides*TAU)*r).toArray()));}
 for(let i=0;i<24;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides;p.push(...rings[i][j],...rings[i+1][j],...rings[i][k],...rings[i][k],...rings[i+1][j],...rings[i+1][k]);}
 for(let i=0;i<p.length;i+=9)for(let k=0;k<3;k++)[p[i+3+k],p[i+6+k]]=[p[i+6+k],p[i+3+k]];
 const g=surface(p);g.computeVertexNormals();a.add(root,g,mat);
}
function foliage(a,root,p,s,color='leaf',detail=1){rock(a,root,p,s,color,detail)}
function flower(a,root,x,y,z,glowing=true){
 a.rod(root,[x,y,z],[x,y+.19,z],.009,'leafDark',5);
 for(let i=0;i<5;i++){const t=i/5*TAU;foliage(a,root,[x+.042*Math.cos(t),y+.20,z+.042*Math.sin(t)],[.036,.024,.040],glowing?'glow':'pink',0);}
}
function mushroom(a,root,x,y,z,size=.2,color='rune'){
 a.add(root,new T.CylinderGeometry(size*.12,size*.17,size*.85,7),'paper',[x,y+size*.42,z]);
 a.add(root,new T.SphereGeometry(size*.57,10,6,0,TAU,0,PI/2),color,[x,y+size*.85,z],[0,0,0],[1,.65,1]);
 for(let i=0;i<3;i++)foliage(a,root,[x+(rnd()-.5)*size*.6,y+size*1.13,z+(rnd()-.5)*size*.6],[size*.055,size*.02,size*.055],'paper',0);
}
function lantern(a,root,x,y,z,size=.3){
 a.box(root,[x,y,z],[size*.62,size,size*.62],'flame');
 for(const dx of [-1,1])for(const dz of [-1,1])a.rod(root,[x+dx*size*.36,y-size*.54,z+dz*size*.36],[x+dx*size*.36,y+size*.54,z+dz*size*.36],size*.04,'gold',5);
 for(const yy of [-.56,.56])a.box(root,[x,y+size*yy,z],[size*.83,size*.10,size*.83],'wood');
 a.add(root,new T.ConeGeometry(size*.63,size*.40,4),'gold',[x,y+size*.79,z],[0,PI/4,0]);
 a.ring(root,[x,y+size*1.11,z],size*.11,size*.026,'gold',[0,0,0]);
}
function smallTree(a,root,x,y,z,size=1){
 tube(a,root,[[x,y,z],[x+.10*size,y+1.6*size,z],[x-.10*size,y+3.4*size,z+.08*size]],[.22*size,.16*size,.06*size],'bark',8);
 for(let i=0;i<5;i++){const t=i*2.4,r=(i? .68:.05)*size;
 tube(a,root,[[x,y+1.5*size,z],[x+Math.cos(t)*r*.8,y+2.5*size,z+Math.sin(t)*r*.8],[x+Math.cos(t)*r,y+(2.7+i*.18)*size,z+Math.sin(t)*r]],[.12*size,.06*size,.02*size],'bark',6);
 foliage(a,root,[x+Math.cos(t)*r,y+(2.6+i*.23)*size,z+Math.sin(t)*r],[1.0*size,.70*size,.85*size],['leaf','leafLight','leafDark'][i%3],1);}
}
const island=new Asset(),land=island.group('ForestTerrain',[0,0,0],{collision:'terrain'});
const N=96,R=24,rad=t=>9.3+.78*Math.sin(t*3+.3)+.47*Math.sin(t*7-.4);
let streamEnd=6;
for(let z=6;z<10;z+=.002){const x=streamX(z);if(Math.hypot(x,z/.88)>rad(Math.atan2(z/.88,x)))break;streamEnd=z;}
// Cut real bank boundaries into triangles instead of dropping whole triangles.
const cuts=[Array.from({length:64},(_,i)=>{const t=i/64*TAU;return[-3.2+2.15*Math.cos(t),2.25+1.50*Math.sin(t)]})];
for(let z=2.2;z<streamEnd+.3;z+=.2)cuts.push([[streamX(z)-.44,z],[streamX(z)+.44,z],[streamX(z+.2)+.44,z+.2],[streamX(z+.2)-.44,z+.2]]);
const cutBounds=cuts.map(poly=>({poly,minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),minZ:Math.min(...poly.map(p=>p[1])),maxZ:Math.max(...poly.map(p=>p[1]))}));
function subtractConvex(poly,cut){
 let inside=poly;const outside=[];
 for(let i=0;i<cut.length&&inside.length>=3;i++){
  const a=cut[i],b=cut[(i+1)%cut.length],signed=p=>(b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  const clip=keep=>{const result=[];for(let j=0;j<inside.length;j++){const p=inside[j],q=inside[(j+1)%inside.length],dp=signed(p),dq=signed(q),ip=keep?dp>=0:dp<=0,iq=keep?dq>=0:dq<=0;if(ip)result.push(p);if(ip!==iq){const t=dp/(dp-dq),x=p[0]+t*(q[0]-p[0]),z=p[2]+t*(q[2]-p[2]);result.push([x,H(x,z),z]);}}return result;};
  const removed=clip(false);if(removed.length>=3)outside.push(removed);inside=clip(true);
 }
 return outside;
}
const top=[];
for(let ring=0;ring<R;ring++)for(let i=0;i<N;i++){
 const point=(ri,ii)=>{const t=ii/N*TAU,r=rad(t)*ri/R,x=Math.cos(t)*r,z=Math.sin(t)*r*.88;return [x,H(x,z),z]};
 const a=point(ring,i),b=point(ring+1,i),c=point(ring+1,i+1),d=point(ring,i+1);
 for(const tri of [[a,c,b],[a,d,c]]){
 let pieces=[tri];
 for(const cut of cutBounds){
  if(tri.every(p=>p[0]<cut.minX)||tri.every(p=>p[0]>cut.maxX)||tri.every(p=>p[2]<cut.minZ)||tri.every(p=>p[2]>cut.maxZ))continue;
  pieces=pieces.flatMap(piece=>subtractConvex(piece,cut.poly));
 }
 for(const piece of pieces)for(let j=1;j<piece.length-1;j++)top.push(...piece[0],...piece[j],...piece[j+1]);
 }
}
island.add(land,surface(top),'grass');
for(let layer=0;layer<5;layer++){
 const pos=[];const point=(i,l)=>{const t=i/N*TAU,s=1-l*.155,r=rad(t)*s;return [Math.cos(t)*r,-l*1.13+(l===0?H(Math.cos(t)*r,Math.sin(t)*r*.88):.14*Math.sin(i*1.7)),Math.sin(t)*r*.88]};
 for(let i=0;i<N;i++){const a=point(i,layer),b=point(i+1,layer),c=point(i,layer+1),d=point(i+1,layer+1);pos.push(...a,...b,...c,...b,...d,...c);
 if(layer===4)pos.push(...c,...d,0,-6.8,0);}
 island.add(land,surface(pos),layer%2?'dark':'stone');
}
for(let i=0;i<55;i++){const t=rnd()*TAU,y=-.5-rnd()*4.7,r=rad(t)*(1+y*.12);
 rock(island,land,[Math.cos(t)*r,y,Math.sin(t)*r*.88],[.4+rnd()*.7,.35+rnd()*.6,.40+rnd()*.5],i%3?'stone':'dark',0);}
for(let i=0;i<20;i++){const t=i/20*TAU,r=rad(t);
 tube(island,land,[[Math.cos(t)*r*.95,H(Math.cos(t)*r*.95,Math.sin(t)*r*.84),Math.sin(t)*r*.84],[Math.cos(t)*r*.95,-.8,Math.sin(t)*r*.85],[Math.cos(t)*r*.8,-2.2,Math.sin(t)*r*.73]],[.11,.075,.016],'bark',6);
 for(let j=0;j<7;j++)foliage(island,land,[Math.cos(t)*(r*.96-j*.12),-.2-j*.21,Math.sin(t)*(r*.84-j*.10)],[.15,.07,.12],j%2?'moss':'leaf',0);
 crystal(island,land,[Math.cos(t)*r*.64,-2.7-rnd(),Math.sin(t)*r*.56],.45+rnd()*.8,i%3?'glow':'rune');
}
for(let i=0;i<24;i++){const t=i/24*TAU,r=rad(t)*.91,y=-.55;
 const pts=Array.from({length:5},(_,k)=>[Math.cos(t+.015*Math.sin(k))*r*(1-k*.045),y-k*.23,Math.sin(t+.015*Math.sin(k))*r*.88*(1-k*.045)]);
 for(let j=0;j<4;j++)island.rod(land,pts[j],pts[j+1],.018,'dark',4);
}
for(let i=0;i<8;i++){const t=i*2.4,r=11+rnd()*1.6,id=island.group('ForestFloatingStone_'+i,[Math.cos(t)*r,-1.5+rnd()*3,Math.sin(t)*r*.88]);
 rock(island,id,[0,0,0],[.35+rnd()*.5,.50,.4],'stone');foliage(island,id,[0,.36,0],[.4,.12,.4],'moss');island.animate(id,'FloatingStoneDrift_'+i,7+i,.12);}
island.group('ForestArrivalAnchor',[.8,H(.8,6.3)+.1,6.3],{clearRadius:1.0});
island.save('whispering-forest-island.glb');

const tree=new Asset(),trunk=tree.group('AncientTree');
tube(tree,trunk,[[0,0,0],[-.25,1.3,0],[.20,2.7,.12],[-.22,4,.0],[.2,5.4,.15]],[1.05,.85,.65,.48,.27],'bark',14);
for(let i=0;i<12;i++){
 const t=i/12*TAU;
 tube(tree,trunk,[[Math.cos(t)*.3,1.2,Math.sin(t)*.3],[Math.cos(t)*1.2,.25,Math.sin(t)*1.2],[Math.cos(t)*2.5,.03,Math.sin(t)*2.3]],[.34,.24,.03],'bark',8);
 tube(tree,trunk,[[Math.cos(t)*.93,.25,Math.sin(t)*.93],[Math.cos(t+.15)*.73,1.8,Math.sin(t+.15)*.73],[Math.cos(t)*.65,2.7,Math.sin(t)*.65]],[.04,.055,.018],i%3?'barkLight':'dark',5);
}
for(let i=0;i<10;i++){
 const t=i*2.4,y=2.7+(i%4)*.55,r=2.7+(i%3)*.52;
 const end=[Math.cos(t)*r,y+2.2,Math.sin(t)*r];
 tube(tree,trunk,[[0,y,0],[Math.cos(t)*1.0,y+.2,Math.sin(t)],[Math.cos(t)*2.2,y+1.1,Math.sin(t)*2.2],end],[.35,.28,.17,.055],'bark',10);
 for(let j=0;j<3;j++){
 const ex=end[0]+Math.cos(t+j*2.1)*.75,ez=end[2]+Math.sin(t+j*2.1)*.7;
 foliage(tree,trunk,[ex,end[1]+j*.22,ez],[1.65,.85,1.45],['leafDark','leaf','leafLight'][(i+j)%3],2);
 if(j===1&&i%2===0){tree.rod(trunk,[ex,end[1]-.2,ez],[ex,end[1]-1.45,ez],.017,'gold',5);lantern(tree,trunk,ex,end[1]-1.65,ez,.30);}
 }
}
foliage(tree,trunk,[0,7.1,0],[1.9,.95,1.8],'leafLight',2);
glyph(tree,trunk,0,1.65,.83,.30,2);
for(let i=0;i<18;i++){const t=i*2.4,r=1.2+rnd()*1.4;mushroom(tree,trunk,Math.cos(t)*r,.04,Math.sin(t)*r,.18+rnd()*.22,i%2?'glow':'rune');}
for(let i=0;i<8;i++){const t=i*2.4;crystal(tree,trunk,[Math.cos(t)*1.6,.15,Math.sin(t)*1.6],.35);}
tree.save('ancient-tree.glb');
const treePosition=[.7,H(.7,-2.6),-2.6];

const vegetation=new Asset(),grove=vegetation.group('ForestVegetation');
for(let i=0;i<22;i++){
 const t=.05+i/22*TAU,r=6.3+rnd()*1.6,x=Math.cos(t)*r,z=Math.sin(t)*r*.86;
 if(z>3.3&&x<2.8&&x>-6)continue;
 if(pondInside(x,z)||channel(x,z))continue;
 smallTree(vegetation,grove,x,H(x,z),z,.63+rnd()*.42);
}
for(let i=0;i<180;i++){
 const t=rnd()*TAU,r=3+rnd()*5.2,x=Math.cos(t)*r,z=Math.sin(t)*r*.86;
 if(pondInside(x,z)||channel(x,z)||Math.abs(x)<1.15&&z>1.1)continue;
 if(i%6===0)foliage(vegetation,grove,[x,H(x,z)+.25,z],[.45,.30,.40],i%2?'leaf':'moss',1);
 else for(let j=0;j<3;j++)vegetation.add(grove,new T.ConeGeometry(.025,.19+rnd()*.17,3),'moss',[x+(j-1)*.06,H(x,z)+.14,z],[.2,rnd()*TAU,.1]);
 if(i%9===0)flower(vegetation,grove,x,H(x,z),z);
 if(i%11===0)mushroom(vegetation,grove,x,H(x,z),z,.18,'rune');
}
vegetation.save('forest-vegetation.glb');

const water=new Asset(),pond=water.group('EnchantedPond',[0,0,0],{water:true});
const waterMat=water.glb.json.materials[water.materials.water];waterMat.pbrMetallicRoughness.baseColorFactor[3]=.86;waterMat.alphaMode='BLEND';waterMat.doubleSided=true;
water.add(pond,new T.CircleGeometry(1,64).rotateX(-PI/2),'water',[-3.2,.13,2.25],[0,0,0],[2.18,1,1.52]);
water.add(pond,new T.CircleGeometry(1,64).rotateX(-PI/2),'dark',[-3.2,-.14,2.25],[0,0,0],[2.2,1,1.55]);
for(let i=0;i<40;i++){const t=i/40*TAU,x=-3.2+2.22*Math.cos(t),z=2.25+1.57*Math.sin(t);
 rock(water,pond,[x,.17,z],[.17+rnd()*.10,.13,.16+rnd()*.08],i%3?'stone':'moss',1);
 if(i%4===0)flower(water,pond,x,.20,z);
}
for(let i=0;i<9;i++){const t=rnd()*TAU,r=rnd(),x=-3.2+1.65*r*Math.cos(t),z=2.25+1.1*r*Math.sin(t);
 water.add(pond,new T.CircleGeometry(.15,10).rotateX(-PI/2),'leaf',[x,.145,z]);
 if(i%3===0)flower(water,pond,x,.15,z);
}
for(let i=0;i<4;i++){
 const id=water.group('PondRipple_'+i,[-3.2+(rnd()-.5)*2,.153+i*.002,2.25+(rnd()-.5)]);
 water.ring(id,[0,0,0],.19+i*.12,.006,'foam');
 const times=[0,1,2,3,4],values=[.75,.9,1.1,.9,.75].map(x=>[x,1,x]);
 water.glb.json.animations.push({name:'PondRipplePulse_'+i,samplers:[{input:water.glb.accessor(times,'SCALAR'),output:water.glb.accessor(values,'VEC3'),interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:id,path:'scale'}}]});
}
const stream=[];
for(let i=0;i<36;i++){const z=2.9+i/36*(streamEnd-2.9),next=2.9+(i+1)/36*(streamEnd-2.9),a=[streamX(z)-.45,.125,z],b=[streamX(z)+.45,.125,z],c=[streamX(next)-.45,.125,next],d=[streamX(next)+.45,.125,next];stream.push(...a,...c,...b,...b,...c,...d);
 for(const sign of [-1,1]){const x=streamX(z)+sign*.50;rock(water,pond,[x,H(x,z)-.05,z],[.10,.10,.13],i%4?'stone':'moss',0);}
}
water.add(pond,surface(stream),'water');
water.save('enchanted-pond.glb');

const fall=new Asset(),sheet=fall.group('ForestWaterfall',[0,0,0],{water:true,flowDirection:'-Y',uvScroll:[0,-.22]});
const waterfallX=streamX(streamEnd);
const veil=[];
for(let i=0;i<30;i++){const y=.13-i*.28,z=streamEnd+.24*(1-Math.exp(-i*.2));const yn=y-.28,zn=streamEnd+.24*(1-Math.exp(-(i+1)*.2));
 const a=[waterfallX-.44,y,z],b=[waterfallX+.44,y,z],c=[waterfallX-.44,yn,zn],d=[waterfallX+.44,yn,zn];veil.push(...a,...c,...b,...b,...c,...d);}
fall.add(sheet,surface(veil),'water');
fall.glb.json.materials[fall.materials.water].doubleSided=true;
for(let i=0;i<7;i++){
 const id=fall.group('WaterFlowRibbon_'+i,[waterfallX-.34+i*.11,.1,streamEnd+.27]);
 for(let j=0;j<12;j++)fall.rod(id,[0,-j*.66,0],[.015*Math.sin(j),-j*.66-.34,0],.009,i%2?'foam':'glow',5);
 const times=[0,.1,3.9,4],pos=times.map(t=>[waterfallX-.34+i*.11,.1-(t===4?0:t/4*.66),streamEnd+.27]);
 const input=fall.glb.accessor(times,'SCALAR');
 fall.glb.json.animations.push({name:'WaterFlow_'+i,samplers:[{input,output:fall.glb.accessor(pos,'VEC3'),interpolation:'LINEAR'},{input,output:fall.glb.accessor([[0,0,0],[1,1,1],[1,1,1],[0,0,0]],'VEC3'),interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:id,path:'translation'}},{sampler:1,target:{node:id,path:'scale'}}]});
}
fall.save('forest-waterfall.glb');

const rest=new Asset(),restRoot=rest.group('HeiterRestingArea');
for(const z of [-.24,-.08,.08,.24])rest.box(restRoot,[0,.43,z],[1.85,.10,.13],'wood');
for(const y of [.70,.90])rest.box(restRoot,[0,y,-.29],[1.88,.14,.08],'wood');
for(const x of [-.77,.77]){rest.rod(restRoot,[x,0,-.22],[x,1.05,-.22],.055,'wood');rest.rod(restRoot,[x,0,.22],[x,.45,.22],.055,'wood');rest.rod(restRoot,[x,.67,-.28],[x,.67,.36],.04,'gold');}
rest.add(restRoot,new T.CylinderGeometry(.42,.42,.09,16),'wood',[1.18,.52,.15]);
rest.rod(restRoot,[1.18,0,.15],[1.18,.5,.15],.09,'wood');
for(let i=0;i<3;i++){const t=i/3*TAU;rest.rod(restRoot,[1.18,.15,.15],[1.18+.30*Math.cos(t),.04,.15+.30*Math.sin(t)],.04,'wood');}
book(rest,restRoot,[1.18,.63,.15],[.35,.09,.25],'green',true);
rest.add(restRoot,new T.CylinderGeometry(.055,.045,.13,10),'gold',[1.43,.65,.19]);
lantern(rest,restRoot,-1.2,1.1,.0,.25);rest.rod(restRoot,[-1.2,0,0],[-1.2,1.5,0],.035,'wood');
for(let i=0;i<9;i++){const t=i*2.4;mushroom(rest,restRoot,Math.cos(t)*1.35,0,Math.sin(t)*.65,.14+rnd()*.12);if(i%2===0)flower(rest,restRoot,Math.cos(t)*1.5,0,Math.sin(t)*.9);}
rest.group('HeiterIdleAnchor',[-.08,0,.70],{asset:'/models/transition/heiter.glb',clip:'heiter_idle',forward:'+Z'});
rest.group('HeiterSeatAnchor',[0,.09,0],{animationSource:'/models/home-island.glb',clip:'Heiter_Drink',restoreSourceBoneDefaults:true,seatHeight:.48});
rest.save('heiter-resting-area.glb');
const restingPosition=[-5.5,H(-5.5,1.0),1.0];

const about=new Asset(),story=about.group('ForestStoryPlatform');
about.add(story,new T.CylinderGeometry(1.6,1.75,.19,12),'stone',[0,.08,0]);
about.ring(story,[0,.18,0],1.47,.022,'gold');
about.add(story,new T.CylinderGeometry(.37,.53,.80,8),'stone',[0,.56,0]);
about.box(story,[0,1.0,0],[.94,.13,.65],'edge');
const biography=about.group('BiographyBook',[0,1.12,0],{interactionTarget:true,contentId:'about-me',contentSource:'website'});
book(about,biography,[0,0,0],[.82,.08,.52],'violet',true);
glyph(about,biography,0,.07,.28,.12,2);
about.group('AboutModalFocusAnchor',[0,1.2,.8]);
for(const sign of [-1,1])about.rod(story,[sign*.57,.18,-1.1],[sign*.57,1.9,-1.1],.06,'wood');
about.box(story,[0,1.35,-1.11],[1.22,.84,.09],'wood');
about.box(story,[0,1.36,-1.047],[1.04,.67,.008],'paper');
about.box(story,[.85,.75,-.65],[.60,.08,.35],'wood');
for(let i=0;i<3;i++)about.box(story,[.66+i*.13,.92,-.65],[.10,.28,.23],colors[i%6]??'green');
about.box(story,[-.95,.71,-.42],[.70,.08,.48],'wood');
for(const x of [-1.22,-.68])for(const z of [-.58,-.26])about.rod(story,[x,.18,z],[x,.69,z],.035,'wood');
about.box(story,[-.95,.76,-.42],[.46,.009,.32],'paper');
for(const x of [-1.18,-.72])about.add(story,new T.CylinderGeometry(.035,.035,.36,10),'paper',[x,.79,-.42],[PI/2,0,0]);
for(let i=0;i<3;i++){const id=about.group('FloatingStoryPage_'+i,[-.7+i*.7,1.9+i*.23,-.2]);about.box(id,[0,0,0],[.22,.28,.008],'paper',[.15,0,.12]);about.animate(id,'StoryPageDrift_'+i,7+i,.09);}
about.save('about-interaction-assets.glb');
const storyPosition=[1.35,H(1.35,.5)+.01,.5];

const details=new Asset(),paths=details.group('ForestPathways');
const route=[v(.8,0,6.3),v(.2,0,4.3),v(1.3,0,2.4),v(1.35,0,.8),v(.0,0,-.5),v(-2.0,0,-.3),v(-4.8,0,.2),v(-5.5,0,1.2)];
const curve=new T.CatmullRomCurve3(route);
for(let i=0;i<55;i++){const p=curve.getPoint(i/54),t=curve.getTangent(i/54),angle=Math.atan2(t.x,t.z);
 for(const side of [-1,1]){const x=p.x+Math.cos(angle)*side*.24,z=p.z-Math.sin(angle)*side*.24;details.box(paths,[x,H(x,z)+.09,z],[.42,.10,.36],i%3?'stone':'edge',[0,angle+.07*Math.sin(i),0]);}
 if(i%11===0){const x=p.x+.85,z=p.z;details.rod(paths,[x,H(x,z),z],[x,H(x,z)+1.05,z],.032,'wood');lantern(details,paths,x,H(x,z)+.82,z,.20);}
}
const bridgeZ=4.75;
for(let i=0;i<15;i++){const x=streamX(bridgeZ)-1.3+i*.19,y=.27+.27*Math.sin(i/14*PI);details.box(paths,[x,y,bridgeZ],[.20,.12,1.14],'wood');}
for(const side of [-1,1]){
 let prev;for(let i=0;i<=7;i++){const x=streamX(bridgeZ)-1.3+i*.38,y=.35+.27*Math.sin(i/7*PI);
 details.rod(paths,[x,y,bridgeZ+side*.53],[x,y+.65,bridgeZ+side*.53],.035,'wood');if(prev)details.rod(paths,prev,[x,y+.65,bridgeZ+side*.53],.028,'gold');prev=[x,y+.65,bridgeZ+side*.53];}
}
for(const p of [[3.9,3.9],[-6,-1.0],[3.5,-.3]]){const y=H(...p);rock(details,paths,[p[0],y+.45,p[1]],[.25,.62,.18],'stone',1);glyph(details,paths,p[0],y+.57,p[1]+.17,.12,1);}
// A short stepped spur follows the eastern hill; its risers track terrain height.
for(let i=0;i<8;i++){const z=.8-i*.30,y=H(3.7,z)+.08;details.box(paths,[3.7,y-.07,z],[.92,.14,.31],i%3?'stone':'edge');}
for(let i=0;i<6;i++){const x=1.8+i*.32,z=.8;details.box(paths,[x,H(x,z)+.06,z],[.30,.10,.55],i%2?'stone':'moss');}
details.save('forest-decorations.glb');

const effects=new Asset(),flies=effects.group('ForestFireflies'),leaves=effects.group('DriftingLeaves'),spirits=effects.group('WoodlandSpirits');
for(let i=0;i<45;i++){const x=-6+rnd()*12,z=-3+rnd()*9;foliage(effects,flies,[x,H(x,z)+.5+rnd()*1.9,z],[.017,.017,.017],i%3?'flame':'glow',0);}
for(let i=0;i<18;i++){const x=-4+rnd()*8,z=-4+rnd()*7;foliage(effects,leaves,[x,1.4+rnd()*3,z],[.07,.015,.035],i%3?'leafLight':'pink',0);}
for(let i=0;i<3;i++){
 const x=-2.8+i*2.4,z=-.9+i*.6;
 foliage(effects,spirits,[x,1.4+i*.3,z],[.12,.18,.10],'glow',1);
 for(const side of [-1,1])foliage(effects,spirits,[x+side*.045,1.43+i*.3,z+.089],[.014,.02,.008],'dark',0);
}
effects.animate(flies,'FireflyDrift',11,.14);effects.animate(leaves,'LeafDrift',13,.22);effects.animate(spirits,'SpiritDrift',9,.18);
for(let i=0;i<12;i++){const t=i*2.4;foliage(effects,leaves,[.7+Math.cos(t)*2.8,5.2+(i%3)*.6,-2.6+Math.sin(t)*2.8],[.055,.03,.08],'glow',0);}
effects.save('forest-effects.glb');



const connections=[];
function connection(name,width,run,rise,make,exit=[0,rise,run],yaw=0){
 const a=new Asset(),root=a.group(name,[0,0,0],{module:true,width,run,rise,forward:'+Z'});
 make(a,root);
 a.group('Entry',[0,0,0],{socket:'walkingSurface',forward:'+Z'});
 const end=a.group('Exit',exit,{socket:'walkingSurface',forward:'+Z'});
 a.glb.json.nodes[end].rotation=new T.Quaternion().setFromAxisAngle(v(0,1,0),yaw).toArray();
 const file=name+'.glb';a.save(file);
 connections.push({file,width,run,rise,entry:[0,0,0],exit,exitYaw:yaw});
}
function straightStairs(a,root,width,steps,rise,depth){
 for(let i=0;i<steps;i++){
  a.box(root,[0,(i+.5)*rise,(i+.5)*depth],[width,rise,depth+.008],'stone');
  a.box(root,[0,(i+1)*rise+.006,(i+.5)*depth],[width+.02,.012,depth*.92],'edge');
 }
 for(const side of [-1,1]){
  for(let i=0;i<=steps;i+=2)a.rod(root,[side*width*.49,i*rise,i*depth],[side*width*.49,i*rise+.85,i*depth],.035,'gold');
  a.rod(root,[side*width*.49,.85,0],[side*width*.49,steps*rise+.85,steps*depth],.045,'stone');
 }
}
connection('stairs-straight',1.6,3.2,1.6,(a,r)=>straightStairs(a,r,1.6,8,.2,.4));
connection('stairs-ceremonial',3.4,4.8,2.0,(a,r)=>{straightStairs(a,r,3.4,10,.2,.48);for(const s of [-1,1]){a.box(r,[s*1.8,.6,.18],[.35,1.2,.36],'stone');crystal(a,r,[s*1.8,1.25,.18],.4);}});
connection('stairs-small',1.4,1.35,.6,(a,r)=>straightStairs(a,r,1.4,3,.2,.45));
function curvedSteps(a,root,angle,steps,rise,R,width){
 for(let i=0;i<steps;i++){
  const aa=i/steps*angle,bb=(i+1)/steps*angle,shape=new T.Shape();
  const point=(t,r)=>[R-r*Math.cos(t),-r*Math.sin(t)];
  shape.moveTo(...point(aa,R-width*.5));
  for(let j=0;j<=4;j++)shape.lineTo(...point(aa+(bb-aa)*j/4,R+width*.5));
  for(let j=4;j>=0;j--)shape.lineTo(...point(aa+(bb-aa)*j/4,R-width*.5));
  shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:rise,bevelEnabled:false,steps:1});g.rotateX(-PI/2);
  a.add(root,g,i%2?'stone':'edge',[0,i*rise,0]);
  for(const side of [-1,1]){
   const radius=R+side*width*.5,x=R-radius*Math.cos(aa),z=radius*Math.sin(aa),xn=R-radius*Math.cos(bb),zn=radius*Math.sin(bb);
   a.rod(root,[x,(i+1)*rise,z],[x,(i+1)*rise+.8,z],.027,'gold');
   a.rod(root,[x,(i+1)*rise+.8,z],[xn,(i+2)*rise+.8,zn],.035,'stone');
  }
 }
}
connection('stairs-curved',1.5,3.46,1.8,(a,r)=>curvedSteps(a,r,PI/2,10,.18,2.2,1.5),[2.2,1.8,2.2],PI/2);
connection('stairs-spiral',1.3,12.57,4.32,(a,r)=>curvedSteps(a,r,TAU,24,.18,2.0,1.3),[0,4.32,0],TAU);
function bridge(a,root,width,length,stone=false,curve=false){
 let previous=[];
 const steps=Math.ceil(length/.24);
 const section=u=>{const t=curve?u*PI/2:0,x=curve?length*(1-Math.cos(t))/1.57:0,z=curve?length*Math.sin(t)/1.57:u*length,y=.35*Math.sin(PI*u);return[-1,1].map(sign=>[x+Math.cos(t)*sign*width*.5,y,z-Math.sin(t)*sign*width*.5]);};
 for(let i=0;i<=steps;i++){
  const u=i/steps,t=u*PI/2,x=curve?length*(1-Math.cos(t))/1.57:0,z=curve?length*Math.sin(t)/1.57:u*length,y=.35*Math.sin(PI*u);
  if(i<steps){
   const [l,r]=section(i/steps),[ln,rn]=section((i+1)/steps),down=p=>[p[0],p[1]-.14,p[2]],lb=down(l),rb=down(r),lnb=down(ln),rnb=down(rn);
   const faces=[l,ln,r,r,ln,rn,lb,rb,lnb,rb,rnb,lnb,l,lb,ln,lb,lnb,ln,r,rn,rb,rb,rn,rnb,l,r,lb,lb,r,rb,ln,lnb,rn,rn,lnb,rnb];
   a.add(root,surface(faces.flat()),stone?'stone':'wood');
   if(!stone)a.rod(root,[l[0],l[1]+.002,l[2]],[r[0],r[1]+.002,r[2]],.006,'barkLight',4);
  }
  for(const side of [-1,1]){
   const p=[x+Math.cos(curve?t:0)*side*width*.49,y+.8,z-Math.sin(curve?t:0)*side*width*.49];
   if(i%3===0)a.rod(root,[p[0],y,p[2]],p,.035,stone?'edge':'wood');
   if(previous[side+1])a.rod(root,previous[side+1],p,.04,stone?'stone':'gold');
   previous[side+1]=p;
  }
 }
}
connection('bridge-wooden',1.8,4,0,(a,r)=>bridge(a,r,1.8,4));
connection('bridge-stone',2.2,4.8,0,(a,r)=>bridge(a,r,2.2,4.8,true));
connection('bridge-curved',1.7,4.7,0,(a,r)=>bridge(a,r,1.7,4.7,false,true),[4.7/1.57,0,4.7/1.57],PI/2);
connection('walkway-narrow',1.1,3,0,(a,r)=>{for(let i=0;i<12;i++)a.box(r,[0,-.07,(i+.5)*.25],[1.1,.14,.24],'wood');});
for(const [name,size]of [['platform-small',1.8],['platform-medium',3.2],['platform-large',4.8],['stepping-stone',.8],['platform-decorative',2.6]]){
 connection(name,size,size,0,(a,r)=>{
 a.add(r,new T.CylinderGeometry(size*.5,size*.43,.25,8),'stone',[0,-.125,size*.5]);
 a.add(r,new T.ConeGeometry(size*.43,size*.65,7),'dark',[0,-size*.325-.25,size*.5],[PI,0,0]);
 a.ring(r,[0,.012,size*.5],size*.43,.02,name==='platform-decorative'?'rune':'gold');
 },[0,0,size]);
}
connection('detail-arch',2.4,.4,0,(a,r)=>{arch(a,r,0,0,.2,2.4,3.3);for(const s of [-1,1])a.box(r,[s*1.2,.12,.2],[.45,.24,.5],'stone');});
connection('detail-pillar',.7,.7,0,(a,r)=>{a.add(r,new T.CylinderGeometry(.19,.25,2.7,8),'stone',[0,1.35,.35]);for(const y of [.10,2.6])a.box(r,[0,y,.35],[.65,.18,.65],'edge');});
connection('detail-railing',.12,2,0,(a,r)=>{for(let i=0;i<5;i++)a.rod(r,[0,0,i*.5],[0,.9,i*.5],.025,'gold');a.rod(r,[0,.92,0],[0,.92,2],.042,'wood');});
connection('detail-lantern',.55,.55,0,(a,r)=>{a.rod(r,[0,0,.275],[0,1.55,.275],.045,'wood');lantern(a,r,0,1.2,.275,.28);});
connection('detail-crystal-light',.65,.65,0,(a,r)=>{rock(a,r,[0,.13,.325],[.34,.16,.32],'stone');crystal(a,r,[0,.45,.325],.75);});
connection('detail-runestone',.7,.4,0,(a,r)=>{rock(a,r,[0,.65,.2],[.35,.75,.22],'stone',1);glyph(a,r,0,.85,.42,.18,2);});
const files=[
 ['whispering-forest-island.glb',[0,0,0]],
 ['ancient-tree.glb',treePosition],['forest-vegetation.glb',[0,0,0]],['enchanted-pond.glb',[0,0,0]],
 ['forest-waterfall.glb',[0,0,0]],['heiter-resting-area.glb',restingPosition],
 ['about-interaction-assets.glb',storyPosition],['forest-decorations.glb',[0,0,0]],['forest-effects.glb',[0,0,0]]
].map(([file,position])=>({file,position}));
if(process.argv.length===2)fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:1,units:'metres',up:'+Y',forward:'+Z',islandOrigin:'Local terrain origin only; final world placement belongs to Antigravity.',files,connections,
 heiter:{file:'/models/transition/heiter.glb',clip:'heiter_idle',anchor:'HeiterIdleAnchor',optionalSeated:{source:'/models/home-island.glb',clip:'Heiter_Drink',anchor:'HeiterSeatAnchor'}},
 interaction:{node:'BiographyBook',contentId:'about-me',actualContent:'provided by website'}},null,2)+'\n');


