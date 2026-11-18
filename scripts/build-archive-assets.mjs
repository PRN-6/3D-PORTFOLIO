import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const output = path.resolve('public/models/archive');
fs.mkdirSync(output,{recursive:true});


class GLB {
  constructor() {
    this.json = { asset: { version: '2.0', generator: 'Hero’s Home transition asset tools' },
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
    this.json.asset.generator = 'Grand Mage Archive asset tools';
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
 stone:['#54617c',0,.92], edge:['#8e9ab2',0,.8], dark:['#29354f',0,.94], grass:['#496b66',0,1],
 moss:['#759384',0,1], wood:['#503b40',0,.8], gold:['#b99a61',.62,.38], paper:['#dbcfb5',0,.9],
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
const island=new Asset(),terrain=island.group('ArchiveIsland',[0,0,0],{collision:'terrain',units:'metres'});
const n=64,angles=Array.from({length:n},(_,i)=>i/n*Math.PI*2),radii=angles.map(t=>8.5+.64*Math.sin(t*3)+.47*Math.sin(t*7+1));
for(let level=0;level<4;level++){
 const top=-level*1.25,bottom=-(level+1)*1.25;
 const upper=1-level*.17,lower=1-(level+1)*.17;
 const positions=[];
 for(let i=0;i<n;i++){
 const j=(i+1)%n;
 const point=(k,y,s)=>[Math.cos(angles[k])*radii[k]*s,y+(level?Math.sin(k*2.7)*.18:0),Math.sin(angles[k])*radii[k]*s*.84];
 const a=point(i,top,upper),b=point(j,top,upper),c=point(i,bottom,lower),d=point(j,bottom,lower);
 positions.push(...a,...c,...b,...b,...c,...d);
 if(level===0)positions.push(0,.005,0,...a,...b);
 if(level===3)positions.push(...c,0,-6.5,0,...d);
 }
 for(let i=0;i<positions.length;i+=9)for(let k=0;k<3;k++)[positions[i+3+k],positions[i+6+k]]=[positions[i+6+k],positions[i+3+k]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
 g.setAttribute('uv',new T.Float32BufferAttribute(Array(positions.length/3*2).fill(0),2));
 island.add(terrain,g,level===0?'stone':level%2?'dark':'stone');
}
const shoreline=new T.Shape();
angles.forEach((t,i)=>{const x=Math.cos(t)*radii[i]*.994,z=-Math.sin(t)*radii[i]*.84*.994;if(i===0)shoreline.moveTo(x,z);else shoreline.lineTo(x,z);});
shoreline.closePath();
const sod=new T.ExtrudeGeometry(shoreline,{depth:.16,bevelEnabled:false,steps:1});sod.rotateX(-Math.PI/2);
island.add(terrain,sod,'grass',[0,-.09,0]);
for(let i=0;i<115;i++){const angle=rnd()*Math.PI*2,r=6.4+rnd()*2;
 rock(island,terrain,[Math.cos(angle)*r,-.02,Math.sin(angle)*r*.80],[.26+rnd()*.52,.09,.20+rnd()*.35],i%3?'moss':'grass');}
for(let i=0;i<55;i++){const t=rnd()*Math.PI*2,r=5+rnd()*3;
 rock(island,terrain,[Math.cos(t)*r,-.6-rnd()*3.3,Math.sin(t)*r*.77],[.55+rnd(),.65+rnd(),.5+rnd()*.7],i%2?'dark':'stone');}
for(let i=0;i<22;i++){const t=i/22*Math.PI*2;
 crystal(island,terrain,[Math.cos(t)*6.1,-1.4-rnd()*2.4,Math.sin(t)*5],.5+rnd()*1.6,i%3?'glow':'rune');}
for(let z=2.4;z<6.7;z+=.46)for(let x=-.8;x<=.8;x+=.55)
 island.box(terrain,[x+.12*(rnd()-.5),.13,z],[.50,.10,.40],rnd()>.5?'edge':'stone',[0,.10*(rnd()-.5),0]);
for(let i=0;i<110;i++){
 const t=rnd()*Math.PI*2,r=6.6+rnd()*1.2,x=Math.cos(t)*r,z=Math.sin(t)*r*.83;
 if(z>2.6&&Math.abs(x)<1.2)continue;
 for(let j=0;j<3;j++){
 const h=.12+rnd()*.22,xx=x+(rnd()-.5)*.12;
 island.add(terrain,new T.ConeGeometry(.025,h,3),'moss',[xx,.08+h/2,z],[.18,rnd()*6,.18]);
 }
}
for(let i=0;i<14;i++){
 const t=i/14*Math.PI*2,r=7.4;
 for(let k=0;k<9;k++){
 const y=-k*.22,x=Math.cos(t)*(r-k*.15)+.06*Math.sin(k),z=Math.sin(t)*(r-k*.15)*.84;
 if(k>0)island.rod(terrain,[x,y,z],[x+.05,y+.22,z],.018,'moss',5);
 rock(island,terrain,[x+.04*Math.cos(k),y,z],[.13,.07,.12],'grass',1);
 }
}
island.group('ArchiveLandingAnchor',[0,.21,6],{forward:'+Z',clearRadius:1.1});
for(let i=0;i<9;i++){const t=i*2.4,r=9.2+rnd()*2;
 const id=island.group('FloatingRock_'+i,[Math.cos(t)*r,-1+rnd()*3,Math.sin(t)*r*.8]);
 rock(island,id,[0,0,0],[.4+rnd()*.5,.45+rnd()*.5,.3+rnd()*.4],'stone');
 crystal(island,id,[0,.4,0],.4);
 island.animate(id,'ArchiveRockDrift_'+i,7+i*.4,.15);
}
island.save('archive-island.glb');

const library=new Asset(),structure=library.group('GrandLibrary');
library.box(structure,[0,.16,-1],[11,.25,7.4],'dark');
for(let x=-5.2;x<5.5;x+=.52)library.box(structure,[x,.30,-1],[.49,.10,7.2],'wood');
for(const z of [-4.55,2.55])library.box(structure,[0,.35,z],[11.2,.12,.16],'gold');
for(let level=0;level<2;level++){
 const floor=.36+level*3.25;
 if(level){
 library.box(structure,[0,floor-.15,-3.35],[11,.25,2.55],'wood');
 library.box(structure,[4.8,floor-.15,-.4],[1.35,.25,3.65],'wood');
 for(let x=-5.3;x<3.6;x+=.45)library.rod(structure,[x,floor,-2.05],[x,floor+.75,-2.05],.025,'gold');
 library.rod(structure,[-5.4,floor+.78,-2.05],[3.6,floor+.78,-2.05],.045,'wood');
 }
 for(const x of [-4.4,-2.2,0,2.2,4.4]){
  library.box(structure,[x,floor+1.25,-4.22],[2.05,2.5,.14],'dark');
  for(const sign of [-1,1])library.box(structure,[x+sign*1.01,floor+1.25,-3.91],[.12,2.6,.66],'wood');
  for(let row=0;row<5;row++){
   const y=floor+.08+row*.49;library.box(structure,[x,y,-3.93],[2.1,.085,.68],'wood');
   library.box(structure,[x,y+.015,-3.57],[2.1,.027,.027],'gold');
   let offset=-.89;
   while(offset<.88){const w=.075+rnd()*.10,h=.25+rnd()*.17;
    book(library,structure,[x+offset+w*.5,y+.06+h*.5,-3.88],[w,h,.31],['teal','red','violet','green','blue','leather'][Math.floor(rnd()*6)]);
    offset+=w+.018;
   }
  }
  arch(library,structure,x,floor,-4.27,2.16,2.86,'edge');
 }
}
for(const x of [-5.65,5.65])for(const z of [-4.5,-1.1,2.4]){
 library.add(structure,new T.CylinderGeometry(.19,.26,6.25,8),'stone',[x,3.36,z]);
 for(const y of [.39,3.48,6.48]){library.box(structure,[x,y,z],[.68,.18,.68],'edge');library.add(structure,new T.CylinderGeometry(.34,.24,.21,8),'gold',[x,y+.16,z]);}
 library.add(structure,new T.ConeGeometry(.42,.9,8),'dark',[x,7.02,z]);
}
for(const x of [-5.65,5.65]){
 for(const z of [-2.8,.65])arch(library,structure,x,.48,z,3.3,6.05,'edge',Math.PI/2);
}
arch(library,structure,0,3.55,-4.58,11.25,5.55,'edge');
arch(library,structure,0,3.55,-4.64,10.75,5.22,'gold');
for(const x of [-3.65,0,3.65]){
 arch(library,structure,x,6.0,-4.45,2.38,2.2,'gold');
 glyph(library,structure,x,7.1,-4.43,.53,x===0?1:3);
}
const stair=library.group('SpiralStaircase',[3.9,.36,.25],{collision:'stairSteps',steps:34,rise:3.25});
library.rod(stair,[0,0,0],[0,4.1,0],.13,'gold');
for(let i=0;i<35;i++){
 const angle=i/34*Math.PI*2,y=i/34*3.25;
 library.box(stair,[Math.cos(angle)*.65,y,Math.sin(angle)*.65],[1.25,.10,.27],'wood',[0,-angle,0]);
 const x=Math.cos(angle)*1.21,z=Math.sin(angle)*1.21;
 library.rod(stair,[x,y,z],[x,y+.80,z],.021,'gold',6);
 if(i>0){const b=(i-1)/34*Math.PI*2;library.rod(stair,[Math.cos(b)*1.21,(i-1)/34*3.25+.8,Math.sin(b)*1.21],[x,y+.8,z],.037,'edge');}
}
library.group('UpperGalleryAnchor',[0,3.61,-3.0]);
library.group('FrierenReadAnchor',[-1.25,.36,.25],{character:'/models/transition/frieren.glb',animation:'Frieren_Read',animationSource:'/models/home-island.glb',rotationY:0,seatSurfaceY:.795});
library.group('FrierenStandAnchor',[-1.25,.36,1.75],{animation:'Frieren_Idle'});
library.save('archive-library.glb');

const decorations=new Asset(),room=decorations.group('ArchiveReadingFurniture');
const cx=-1.25,cz=.25,floor=.36;
decorations.box(room,[cx,floor+.435,cz],[.64,.11,.59],'wood');
decorations.box(room,[cx,floor+.51,cz],[.58,.075,.53],'violet');
decorations.box(room,[cx,floor+.91,cz-.29],[.66,.91,.12],'wood');
decorations.box(room,[cx,floor+.98,cz-.215],[.51,.55,.025],'violet');
for(const x of [-.27,.27])for(const z of [-.23,.23])decorations.rod(room,[cx+x,floor,cz+z],[cx+x,floor+.43,cz+z],.043,'wood');
for(const x of [-.37,.37])decorations.rod(room,[cx+x,floor+.69,cz-.20],[cx+x,floor+.69,cz+.31],.043,'gold');
const deskz=1.18;const desk=decorations.group('ReadingDesk',[0,-.22,.26]);
decorations.box(desk,[cx,1.12,deskz],[2.38,.15,.90],'wood');
decorations.box(desk,[cx,1.207,deskz],[2.24,.025,.81],'leather');
for(const x of [-1,1])for(const z of [-.32,.32])decorations.rod(desk,[cx+x,.36,deskz+z],[cx+x,1.1,deskz+z],.075,'wood');
decorations.box(desk,[cx,.85,deskz-.34],[2.24,.22,.13],'wood');
book(decorations,desk,[cx+.57,1.25,deskz],[.68,.07,.45],'blue',true);
for(let i=0;i<3;i++)decorations.box(desk,[cx-.76,1.28+i*.09,deskz],[.43,.075,.31],i%2?'red':'paper',[0,i*.17,0]);
for(const x of [-.7,.7])decorations.add(desk,new T.CylinderGeometry(.035,.035,.48,10),'paper',[cx+x,1.29,deskz+.28],[0,0,Math.PI/2]);
for(const pos of [[-4,.36,-1],[1.8,.36,-1.1],[-3.8,.36,2.0]]){
 decorations.add(room,new T.CylinderGeometry(.34,.44,.13,8),'edge',pos);
 crystal(decorations,room,[pos[0],pos[1]+.45,pos[2]],.65);
}
for(const pos of [[0,4.65,-.6],[-3.4,3.8,.55],[3.1,5.4,-2.2]]){
 const chandelier=decorations.group('CandleChandelier_'+pos[0],pos);
 decorations.ring(chandelier,[0,0,0],.73,.045,'gold');
 for(let i=0;i<8;i++){
  const t=i/8*Math.PI*2,x=Math.cos(t)*.73,z=Math.sin(t)*.73;
  decorations.add(chandelier,new T.CylinderGeometry(.055,.055,.24,8),'paper',[x,.14,z]);
  decorations.add(chandelier,new T.SphereGeometry(.046,8,6),'flame',[x,.31,z],[0,0,0],[.65,1.5,.65]);
  if(i%2===0)decorations.rod(chandelier,[x,0,z],[0,.6,0],.014,'gold',5);
 }
 decorations.animate(chandelier,'CandleChandelierDrift_'+pos[0],9,.07);
 const json=decorations.glb.json;json.extensionsUsed=['KHR_lights_punctual'];json.extensions??={};json.extensions.KHR_lights_punctual??={lights:[]};
 const index=json.extensions.KHR_lights_punctual.lights.length;
 json.extensions.KHR_lights_punctual.lights.push({type:'point',color:[1,.69,.30],intensity:8,range:6});
 const node=json.nodes.length;json.nodes.push({name:'WarmCandleLight',translation:[0,.4,0],extensions:{KHR_lights_punctual:{light:index}}});json.nodes[chandelier].children.push(node);
}
const motes=decorations.group('ArchiveMotes');
for(let i=0;i<45;i++)rock(decorations,motes,[-5+rnd()*10,.6+rnd()*6,-3.5+rnd()*5.5],[.014,.014,.014],i%3?'glow':'rune');
decorations.animate(motes,'ArchiveMotesDrift',9,.12);
decorations.save('archive-decorations.glb');

const categories=['Frontend Magic','Backend Alchemy','AI and Autonomous Agents','Systems and Programming','3D and Creative Technology','Tools and Technologies'];
const colors=['teal','green','violet','blue','red','leather'];
const grimoires=new Asset();
const metadata=[];
function grimoire(a,index,position){
 const id=a.group('Grimoire_'+(index+1),position,{interactionTarget:true,category:categories[index],contentId:['frontend','backend','ai-agents','systems','creative-3d','tools'][index]});
 book(a,id,[0,0,0],[.48,.66,.17],colors[index]);
 glyph(a,id,0,0,.137,.14,index);
 for(const s of [-1,1])a.box(id,[s*.23,.31,.11],[.06,.06,.02],'gold');
 a.animate(id,'GrimoireHover_'+(index+1),6+index*.7,.09);
 return id;
}
for(let i=0;i<6;i++){
 const t=-Math.PI*.90+i*Math.PI*.16,x=6.4*Math.cos(t),z=3.25+1.35*Math.sin(i*Math.PI/5);
 grimoire(grimoires,i,[x,1.30,z]);
 const pedestal=grimoires.group('GrimoirePedestal_'+i,[x,0,z]);
 grimoires.add(pedestal,new T.CylinderGeometry(.40,.55,.14,8),'stone',[0,.11,0]);
 grimoires.add(pedestal,new T.CylinderGeometry(.28,.34,.70,8),'dark',[0,.51,0]);
 grimoires.ring(pedestal,[0,.87,0],.32,.022,'gold');
 const separate=new Asset();grimoire(separate,i,[0,0,0]);const filename='grimoire-'+['frontend','backend','ai-agents','systems','creative-3d','tools'][i]+'.glb';separate.save(filename);
 metadata.push({category:categories[i],node:'Grimoire_'+(i+1),file:filename,position:[x,1.30,z]});
}
grimoires.save('archive-grimoires.glb');
const floating=new Asset();
for(let i=0;i<8;i++){
 const p=[-3.7+(i%4)*2.0,1.9+(i%3)*.72,-1.4+Math.floor(i/4)*2.1];
 const id=floating.group('FloatingBook_'+i,p,{interactionTarget:true,open:i%2===0});
 book(floating,id,[0,0,0],[.60,.46,.36],colors[i%6],i%2===0);
 floating.animate(id,'FloatingBookDrift_'+i,6+i*.47,.12);
 if(i%2===0){
 const page=floating.group('TurningPage_'+i,[0,.08,0]);
 floating.glb.json.scenes[0].nodes.pop();floating.glb.json.nodes[id].children.push(page);
 floating.box(page,[.14,0,0],[.28,.004,.33],'paper');
 const input=floating.glb.accessor([0,1,2,3,4,5,6],'SCALAR');
 const rotations=[0,.1,.3,1.3,2.5,3.0,0].map(a=>new T.Quaternion().setFromAxisAngle(v(0,0,1),a).toArray());
 floating.glb.json.animations.push({name:'BookPageTurn_'+i,samplers:[{input,output:floating.glb.accessor(rotations,'VEC4'),interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:page,path:'rotation'}}]});
 }
}
floating.save('archive-floating-books.glb');
for(const open of [true,false]){
 const individual=new Asset();
 const root=individual.group(open?'FloatingOpenBook':'FloatingClosedBook',[0,0,0],{interactionTarget:true,open});
 book(individual,root,[0,0,0],[.60,.46,.36],open?'violet':'teal',open);
 individual.animate(root,'BookHover',7,.10);
 individual.save(open?'floating-open-book.glb':'floating-closed-book.glb');
}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({units:'metres',up:'+Y',forward:'+Z',assemblyOrigin:[0,0,0],files:['archive-island.glb','archive-library.glb','archive-decorations.glb','archive-grimoires.glb','archive-floating-books.glb'],grimoires:metadata,reuse:{character:'/models/transition/frieren.glb',magic:'/models/transition/frieren-magic.glb',readingClip:{file:'/models/home-island.glb',name:'Frieren_Read'}}},null,2));


