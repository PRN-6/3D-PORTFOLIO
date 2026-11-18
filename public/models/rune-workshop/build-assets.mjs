import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const output = path.resolve('public/models/rune-workshop');
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
    this.json.asset.generator = 'Rune Workshop asset tools';
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
 group(name,position=[0,0,0],extras={},parent=null) {
  const id=this.glb.json.nodes.length;this.glb.json.nodes.push({name,translation:position,extras,children:[]});
  if(parent===null)this.glb.json.scenes[0].nodes.push(id);else this.glb.json.nodes[parent].children.push(id);return id;
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
 ring(root,p,r,t,mat,rotation=[Math.PI/2,0,0]){this.add(root,new T.TorusGeometry(r,t,5,48),mat,p,rotation)}
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
  const used=[...new Set(this.glb.json.meshes.flatMap(m=>m.primitives.map(p=>p.material)))];for(const m of this.glb.json.meshes)for(const p of m.primitives)p.material=used.indexOf(p.material);this.glb.json.materials=used.map(i=>this.glb.json.materials[i]);this.parts.clear();this.glb.save(filename);
  console.log(filename,(fs.statSync(path.join(output,filename)).size/1e6).toFixed(2)+' MB',this.glb.json.meshes.length+' material batches');
 }
}
function rock(a,root,p,s,mat,detail=0){a.add(root,new T.IcosahedronGeometry(1,detail),mat,p,[rnd(),rnd(),rnd()],s)}
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
// Rune Workshop geometry. Local metres; +Y up, +Z toward the front.
const PI=Math.PI,TAU=PI*2;
const assets=[];
function publish(a,file,role,placements=[{position:[0,0,0]}]){
 a.save(file);assets.push({file,role,placements});
}
function surface(p){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();const uv=[];for(let i=0;i<p.length;i+=3)uv.push(p[i]*.3,p[i+2]*.3);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
function bevel(a,root,p,size,mat,cut=.12){
 const [w,h,d]=size,c=Math.min(cut,w*.22,d*.22),shape=new T.Shape();
 const points=[[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];
 shape.moveTo(...points[0]);for(const point of points.slice(1))shape.lineTo(...point);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});g.rotateX(-PI/2);a.add(root,g,mat,p);
}
function quartz(a,root,p,height=.8,mat='glow',tilt=0){
 const g=new T.CylinderGeometry(.12,.17,height*.72,6);a.add(root,g,mat,[p[0],p[1]+height*.36,p[2]],[0,0,tilt]);
 a.add(root,new T.ConeGeometry(.12,height*.28,6),mat,[p[0]-Math.sin(tilt)*height*.50,p[1]+height*.86,p[2]],[0,0,tilt]);
}
function lantern(a,root,x,y,z,s=.35){
 a.box(root,[x,y,z],[s*.65,s,s*.65],'flame');
 for(const dx of [-1,1])for(const dz of [-1,1])a.rod(root,[x+dx*s*.37,y-s*.55,z+dz*s*.37],[x+dx*s*.37,y+s*.55,z+dz*s*.37],s*.055,'gold',5);
 for(const dy of [-1,1])a.box(root,[x,y+dy*s*.53,z],[s*.86,s*.1,s*.86],'dark');
 a.add(root,new T.ConeGeometry(s*.66,s*.45,4),'gold',[x,y+s*.77,z],[0,PI/4,0]);
 a.ring(root,[x,y+s*1.08,z],s*.13,s*.035,'gold',[0,0,0]);
}
function rune(a,root,p,r,mat='rune',flat=false){
 const point=(x,y)=>flat?[p[0]+x,p[1],p[2]+y]:[p[0]+x,p[1]+y,p[2]];
 a.ring(root,p,r,.012,mat,flat?[PI/2,0,0]:[0,0,0]);
 for(let i=0;i<6;i++){const t=i/6*TAU,n=(i+2)/6*TAU;a.rod(root,point(Math.cos(t)*r*.76,Math.sin(t)*r*.76),point(Math.cos(n)*r*.76,Math.sin(n)*r*.76),.008,mat,4);}
 for(let i=0;i<8;i++){const t=i/8*TAU;a.rod(root,point(Math.cos(t)*r*.87,Math.sin(t)*r*.87),point(Math.cos(t)*r*.98,Math.sin(t)*r*.98),.014,'gold',4);}
}
function scroll(a,root,p,s=1){
 a.box(root,p,[.56*s,.018*s,.38*s],'paper');
 for(const side of [-1,1]){a.add(root,new T.CylinderGeometry(.04*s,.04*s,.44*s,10),'paper',[p[0]+side*.28*s,p[1]+.032*s,p[2]],[PI/2,0,0]);a.rod(root,[p[0]+side*.28*s,p[1]+.032*s,p[2]-.25*s],[p[0]+side*.28*s,p[1]+.032*s,p[2]+.25*s],.014*s,'gold',5);}
 for(let i=0;i<4;i++)a.box(root,[p[0],p[1]+.012*s,p[2]-.10*s+i*.065*s],[.27*s,.003*s,.008*s],'wood');
}
function rotate(a,id,name,seconds,axis=[0,1,0]){
 const times=[],qs=[];for(let i=0;i<=32;i++){times.push(i/32*seconds);qs.push(new T.Quaternion().setFromAxisAngle(v(...axis),i/32*TAU).toArray());}
 a.glb.json.animations.push({name,samplers:[{input:a.glb.accessor(times,'SCALAR'),output:a.glb.accessor(qs,'VEC4'),interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:id,path:'rotation'}}]});
}
function foliage(a,root,p,s,mat='moss'){a.add(root,new T.IcosahedronGeometry(1,1),mat,p,[0,rnd()*TAU,.1],s);}

const land=new Asset(),ground=land.group('WorkshopIsland');
const count=80,rad=t=>10.2+.65*Math.sin(3*t+.4)+.50*Math.sin(7*t-.2);
const top=[],rim=[];
for(let i=0;i<count;i++){
 const point=(j,layer)=>{const t=j/count*TAU,r=rad(t)*(1-layer*.17);return[Math.cos(t)*r,.20-layer*1.05+(layer?.15*Math.sin(j*1.3):0),Math.sin(t)*r*.78];};
 const p=point(i,0),q=point(i+1,0);top.push(0,.20,0,...q,...p);
 for(let l=0;l<5;l++){const a=point(i,l),b=point(i+1,l),c=point(i,l+1),d=point(i+1,l+1);const mesh=[];mesh.push(...a,...b,...c,...b,...d,...c);land.add(ground,surface(mesh),l%2?'dark':'stone');if(l===4)rim.push(...c,...d,0,-6,0);}
}
land.add(ground,surface(top),'grass');land.add(ground,surface(rim),'dark');
for(let i=0;i<44;i++){const t=i*2.4,y=-.4-rnd()*3.8,r=rad(t)*(1+y*.14);rock(land,ground,[Math.cos(t)*r,y,Math.sin(t)*r*.78],[.35+rnd()*.5,.3+rnd()*.4,.4+rnd()*.5],i%3?'stone':'dark');}
for(let i=0;i<12;i++){const t=i/12*TAU,r=rad(t)*.92,points=Array.from({length:4},(_,j)=>[Math.cos(t+.025*Math.sin(j))*r*(1-j*.075),-.35-j*.45,Math.sin(t+.025*Math.sin(j))*r*.78*(1-j*.075)]);for(let j=0;j<3;j++)land.rod(ground,points[j],points[j+1],.016,i%2?'rune':'glow',4);if(i%3===0)quartz(land,ground,[Math.cos(t)*r*.7,-2.6,Math.sin(t)*r*.53],.5,'violet');}
for(let i=0;i<6;i++){const t=i*2.4,id=land.group('SatelliteRock_'+i,[Math.cos(t)*(11.2+rnd()),-1-rnd()*2,Math.sin(t)*9]);rock(land,id,[0,0,0],[.45,.6,.4],'stone');foliage(land,id,[0,.4,0],[.3,.09,.3]);land.animate(id,'RockDrift_'+i,10+i,.10);}
land.group('EntryAnchor',[0,.23,7.0],{referenceOnly:true,forward:'+Z'});
const exit=land.group('ExitAnchor',[7,.23,-.4],{referenceOnly:true,forward:'+X'});land.glb.json.nodes[exit].rotation=new T.Quaternion().setFromAxisAngle(v(0,1,0),PI/2).toArray();
publish(land,'island/workshop-island.glb','Organic island, layered underside and reference anchors');

const archi=new Asset(),building=archi.group('RuneWorkshopPavilion');
bevel(archi,building,[0,0,-1.55],[11.6,.18,8.0],'stone',.45);
for(let row=0;row<5;row++)for(let col=0;col<10;col++)archi.box(building,[-5.1+col*1.13,.184,-4.9+row*1.14],[1.09,.025,1.10],(col+row)%3?'stone':'edge');
for(const z of [.78,1.90])for(let col=0;col<10;col++)archi.box(building,[-5.1+col*1.13,.184,z],[1.09,.025,1.08],col%3?'stone':'edge');
for(const side of [-1,1]){
 const cx=side*3.95;
 // Rear wing wall and stone foundation.
 bevel(archi,building,[cx,.18,-4.65],[3.4,.55,.55],'dark');
 for(let y=0;y<7;y++)for(let x=0;x<4;x++)archi.box(building,[cx-1.26+x*.84,(y+.5)*.40+.65,-4.65],[.81,.38,.40],(x+y)%4?'stone':'edge');
 for(const x of [side*2.25,side*5.65])for(const z of [-4.7,-1.7]){
  bevel(archi,building,[x,.18,z],[.65,.38,.65],'edge');
  archi.box(building,[x,2.05,z],[.27,3.35,.27],'wood');
  archi.box(building,[x,3.53,z],[.52,.18,.48],'gold');
  archi.rod(building,[x,2.9,z],[x-side*.62,3.48,z],.08,'wood',4);
 }
 // Timber lintels and steep tiled wing roofs; the central bay stays open.
 for(const z of [-1.7,-4.7])archi.box(building,[cx,3.65,z],[3.8,.24,.24],'wood');
 for(const x of [side*2.25,side*5.65])archi.box(building,[x,3.65,-3.2],[.24,.24,3.4],'wood');
 for(const slope of [-1,1])for(let row=0;row<6;row++)for(let col=0;col<5;col++){
  const dx=(col+.5)*.39,y=4.96-dx*.68,z=-4.98+(row+.5)*.61;
  archi.box(building,[cx+slope*dx,y,z],[.50,.11,.65],(row+col)%3?'blue':'violet',[0,0,-slope*Math.atan(.68)]);
 }
 archi.rod(building,[cx,5.0,-5.1],[cx,5.0,-1.3],.12,'gold',6);
 // Glowing arched rear window and mullions.
 archi.add(building,new T.CircleGeometry(.70,20),'flame',[cx,2.45,-4.42]);
 archi.ring(building,[cx,2.45,-4.4],.73,.09,'wood',[0,0,0]);
 archi.rod(building,[cx-.65,2.45,-4.38],[cx+.65,2.45,-4.38],.035,'wood');
 archi.rod(building,[cx,1.8,-4.38],[cx,3.1,-4.38],.035,'wood');
}
arch(archi,building,0,.2,-4.1,4.2,5.8,'edge');
arch(archi,building,0,.2,-4.12,4.65,6.15,'wood');
for(const x of [-2.1,2.1]){bevel(archi,building,[x,.2,-4.1],[.7,.38,.65],'stone');for(let j=0;j<7;j++)archi.box(building,[x,.68+j*.42,-4.1],[.40,.39,.38],j%2?'stone':'edge');}
archi.ring(building,[0,5.3,-4.08],.58,.08,'gold',[0,0,0]);rune(archi,building,[0,5.3,-3.99],.43,'rune');
archi.box(building,[5.2,4.8,-4.1],[.65,2.6,.65],'stone');bevel(archi,building,[5.2,6.08,-4.1],[.92,.18,.85],'edge');
for(let i=0;i<4;i++)quartz(archi,building,[5.2+(i%2-.5)*.35,6.25,-4.1+(Math.floor(i/2)-.5)*.35],.45,'violet');
publish(archi,'architecture/rune-workshop.glb','Open-front stone and timber workshop, roofs, rear windows and high rune arch',[{position:[0,.2,-.6]}]);

const table=new Asset(),tableRoot=table.group('CentralCraftingTable');
table.add(tableRoot,new T.CylinderGeometry(1.1,1.2,.18,12),'wood',[0,.81,0]);table.ring(tableRoot,[0,.91,0],1.06,.035,'gold');
table.add(tableRoot,new T.CylinderGeometry(.73,.78,.04,12),'dark',[0,.92,0]);rune(table,tableRoot,[0,.95,0],.62,'flame',true);
for(let i=0;i<4;i++){const t=PI/4+i*PI/2,x=Math.cos(t)*.78,z=Math.sin(t)*.78;table.rod(tableRoot,[x,0,z],[x,.76,z],.11,'wood');bevel(table,tableRoot,[x-.02,.08,z],[.28,.10,.28],'gold');}
table.rod(tableRoot,[-.8,.3,0],[.8,.3,0],.055,'gold');
bevel(table,tableRoot,[0,.97,0],[.53,.16,.40],'edge',.09);quartz(table,tableRoot,[0,1.13,0],.52,'teal');
table.group('EisenWorkAnchor',[-2.05,0,1.05],{asset:'/models/transition/eisen.glb',clip:'eisen_idle',yaw:.28,scale:1});
publish(table,'workshop/rune-crafting-table.glb','Central engraved crafting table and workpiece',[{position:[.55,.39,-.5]}]);

const furniture=new Asset(),froot=furniture.group('WorkshopFurnishings');
for(const side of [-1,1]){
 const x=side*3.9,z=-4.6;
 for(const dx of [-1,1])furniture.box(froot,[x+dx*1.05,1.48,z],[.12,2.6,.50],'wood');
 for(const y of [.3,1.03,1.76,2.49])furniture.box(froot,[x,y,z],[2.22,.10,.55],'wood');
 for(let shelf=0;shelf<3;shelf++)for(let item=0;item<5;item++){
  const px=x-.85+item*.39,y=.4+shelf*.73;
  if((item+shelf)%3===0)quartz(furniture,froot,[px,y,z+.02],.32+item*.025,item%2?'rune':'teal');
  else if((item+shelf)%3===1)book(furniture,froot,[px,y+.2,z],[.18,.38,.24],item%2?'violet':'green');
  else {furniture.add(froot,new T.SphereGeometry(.11,8,6),'teal',[px,y+.13,z],[0,0,0],[1,1.2,1]);furniture.add(froot,new T.CylinderGeometry(.045,.045,.12,6),'gold',[px,y+.29,z]);}
 }
 const bx=side*3.8,bz=-2.3;
 bevel(furniture,froot,[bx,.80,bz],[2.25,.14,.86],'wood');
 for(const dx of [-.9,.9])for(const dz of [-.30,.30])furniture.box(froot,[bx+dx,.40,bz+dz],[.11,.80,.11],'wood');
 if(side<0){scroll(furniture,froot,[bx,.96,bz],1.4);book(furniture,froot,[bx-.7,1.05,bz],[.32,.18,.38],'violet');}
 else {furniture.add(froot,new T.CylinderGeometry(.23,.29,.36,8),'dark',[bx+.65,1.08,bz]);quartz(furniture,froot,[bx+.65,1.27,bz],.37,'rune');}
 lantern(furniture,froot,bx+side*.9,1.17,bz,.3);
}
publish(furniture,'workshop/shelves-and-benches.glb','Fitted component shelves, workbenches, books, jars, scrolls and lamps',[{position:[0,.39,-.6]}]);

// Five neutral project slots with deliberately different silhouette families.
const displayPositions=[[-6.4,.2,1.55],[-3.6,.2,4.1],[0,.2,5.15],[3.6,.2,4.1],[6.4,.2,1.55]];
for(let k=0;k<5;k++){
 const a=new Asset(),tag=String(k+1).padStart(2,'0'),root=a.group('ProjectStation_'+tag,[0,0,0],{interactionTarget:true,slotId:'project-slot-'+tag,contentSource:'website'});
 const accent=['rune','flame','glow','rune','glow'][k];
 if(k===0){bevel(a,root,[0,0,0],[1.5,.19,1.45],'dark');bevel(a,root,[0,.19,0],[.92,.42,.88],'stone');bevel(a,root,[0,.61,0],[1.36,.16,1.28],'edge');}
 if(k===1){a.add(root,new T.CylinderGeometry(.69,.80,.22,10),'wood',[0,.11,0]);for(const x of [-.42,.42])a.rod(root,[x,.18,0],[x,.62,0],.10,'gold');bevel(a,root,[0,.56,0],[1.4,.16,1.15],'wood');}
 if(k===2){a.add(root,new T.CylinderGeometry(.52,.78,.64,6),'stone',[0,.32,0]);a.ring(root,[0,.64,0],.56,.035,'gold');}
 if(k===3){bevel(a,root,[0,0,0],[1.65,.18,1.4],'stone');for(const x of [-.55,.55])for(const z of [-.4,.4])a.rod(root,[x,.18,z],[x,.55,z],.07,'wood');bevel(a,root,[0,.55,0],[1.6,.11,1.4],'edge');}
 if(k===4){a.add(root,new T.CylinderGeometry(.60,.8,.18,8),'dark',[0,.09,0]);for(let i=0;i<3;i++){const t=i/3*TAU;a.rod(root,[Math.cos(t)*.55,.18,Math.sin(t)*.55],[Math.cos(t)*.30,.65,Math.sin(t)*.30],.055,'gold');}a.add(root,new T.CylinderGeometry(.45,.50,.13,8),'violet',[0,.62,0]);}
 const art=a.group('Artifact_'+tag,[0,.91,0],{animationPivot:true},root);
 if(k===0){
  a.add(art,new T.OctahedronGeometry(.47),'violet',[0,.15,0],[0,.35,0],[.75,1.4,.60]);
  rune(a,art,[0,.2,.3],.35,'rune');
  for(const sign of [-1,1])a.rod(art,[sign*.4,-.1,0],[sign*.5,.65,0],.045,'gold');
  a.animate(art,'ArtifactFloat_'+tag,8,.07);
 }else if(k===1){
  a.add(art,new T.SphereGeometry(.30,12,8),'teal',[0,.18,0]);
  for(const r of [.40,.56])a.ring(art,[0,.18,0],r,.025,'gold',[PI/3,r,0]);
  for(let j=0;j<12;j++){const t=j/12*TAU;a.box(art,[Math.cos(t)*.44,.18,Math.sin(t)*.44],[.13,.10,.12],'gold',[0,-t,0]);}
  rotate(a,art,'MechanismTurn_'+tag,24);
 }else if(k===2){
  quartz(a,art,[0,-.12,0],1.06,'glow');
  for(let j=0;j<4;j++){const t=j/4*TAU;quartz(a,art,[Math.cos(t)*.35,-.18,Math.sin(t)*.35],.5,j%2?'teal':'violet');}
  a.animate(art,'CrystalFloat_'+tag,9,.06);
 }else if(k===3){
  rock(a,art,[0,0,0],[.65,.24,.50],'stone',0);
  for(const x of [-.3,.3]){a.add(art,new T.CylinderGeometry(.14,.18,.52,8),'edge',[x,.36,0]);a.add(art,new T.ConeGeometry(.25,.32,6),'blue',[x,.77,0]);}
  bevel(a,art,[0,.22,.04],[.48,.28,.40],'stone');a.box(art,[0,.58,.04],[.45,.12,.43],'violet');
  for(const x of [-.3,.3])a.box(art,[x,.39,.145],[.06,.12,.008],'flame');
  a.animate(art,'MiniatureFloat_'+tag,11,.08);
 }else{
  a.add(art,new T.IcosahedronGeometry(.27,1),'glow',[0,.25,0]);
  for(let j=0;j<3;j++)a.ring(art,[0,.25,0],.47+j*.10,.022,j%2?'rune':'gold',[j*PI/3,PI/3,j*.4]);
  rotate(a,art,'ExperimentTurn_'+tag,18,[0,1,0]);
 }
 a.ring(root,[0,.025,0],.84,.012,accent);
 a.group('ProjectInfoAnchor_'+tag,[0,1.8,.12],{slotId:'project-slot-'+tag,contentSource:'website'},root);
 publish(a,'project-displays/station-'+tag+'.glb',['Rune relic','Enchanted mechanism','Crystal construction','Floating miniature architecture','Experimental spell instrument'][k],[{position:displayPositions[k]}]);
}

const toolsA=new Asset(),toolsRoot=toolsA.group('CraftingEquipment');
bevel(toolsA,toolsRoot,[0,0,0],[.63,.08,.40],'wood');
toolsA.rod(toolsRoot,[-.27,.11,0],[.21,.11,.13],.028,'wood');bevel(toolsA,toolsRoot,[.18,.09,.13],[.20,.12,.12],'dark');
for(const z of [-.09,-.02])toolsA.rod(toolsRoot,[-.26,.12,z],[.05,.12,z+.04],.012,'gold',5);
toolsA.add(toolsRoot,new T.CylinderGeometry(.07,.09,.1,10),'gold',[.18,.13,-.1]);scroll(toolsA,toolsRoot,[0,.09,.28],.5);
publish(toolsA,'workshop/crafting-tools.glb','Hammer, tongs, measuring cup and small design scroll',[{position:[3.45,1.34,-2.9]}]);

const rings=new Asset(),ringRoot=rings.group('ArcaneRings');
for(let i=0;i<3;i++){const id=rings.group('RingPivot_'+i,[0,0,0],{axis:'+Y'},ringRoot);rings.ring(id,[0,0,0],.74+i*.15,.018,i%2?'rune':'gold',[PI/2+i*.38,0,i*.22]);for(let j=0;j<8;j++){const t=j/8*TAU;rings.add(id,new T.OctahedronGeometry(.035),'glow',[Math.cos(t)*(.74+i*.15),.03,Math.sin(t)*(.74+i*.15)]);}rotate(rings,id,'RingOrbit_'+i,18+i*7);}
publish(rings,'magical-objects/arcane-rings.glb','Three independently pivoted rotating rings',[{position:[.55,2.25,-.5],scale:[.7,.7,.7]}]);

const sigil=new Asset(),sroot=sigil.group('FloatingRune');
rune(sigil,sroot,[0,0,0],.48);sigil.animate(sroot,'RuneHover',9,.05);
publish(sigil,'magical-objects/rune-symbol.glb','Upright floating rune seal',[{position:[0,3.85,-3.5]}]);

const floor=new Asset(),floorRoot=floor.group('CraftingFloorCircle');
for(const r of [1.60,1.78,2.02])floor.ring(floorRoot,[0,.018,0],r,.012,r===1.78?'gold':'rune');
for(let i=0;i<12;i++){const t=i/12*TAU,x=Math.cos(t)*1.9,z=Math.sin(t)*1.9;floor.rod(floorRoot,[x*.96,.025,z*.96],[x*1.04,.025,z*1.04],.018,'gold',4);}
rune(floor,floorRoot,[0,.022,0],1.22,'rune',true);
publish(floor,'magical-objects/rune-floor-circle.glb','Horizontal opaque emissive floor markings',[{position:[.55,.415,-.5]}]);

const crystals=new Asset(),croot=crystals.group('CrystalCluster');
rock(crystals,croot,[0,.10,0],[.35,.15,.30],'stone');
for(let i=0;i<4;i++){const t=i*2.4;quartz(crystals,croot,[Math.cos(t)*.19,.13,Math.sin(t)*.19],.34+i*.11,i%2?'teal':'rune');}
publish(crystals,'magical-objects/crystal-cluster.glb','Faceted crystal group',[{position:[-6.9,.20,-1.8]},{position:[6.9,.20,-2.1]},{position:[4.8,.20,5.5],scale:[.7,.7,.7]}]);

const parchment=new Asset(),parch=parchment.group('EnchantedScroll');scroll(parchment,parch,[0,0,0],1);parchment.animate(parch,'ScrollDrift',12,.06);
publish(parchment,'magical-objects/enchanted-scroll.glb','Floating rolled parchment',[{position:[-3.2,2.1,-2.9],rotation:[.16,0,.10]}]);

const tome=new Asset(),tomeRoot=tome.group('FloatingTome');book(tome,tomeRoot,[0,0,0],[.65,.10,.48],'violet',true);tome.animate(tomeRoot,'TomeDrift',14,.08);
publish(tome,'magical-objects/floating-tome.glb','Open floating spell book',[{position:[3.55,2.25,-2.8],rotation:[.2,0,-.1]}]);

const curios=new Asset(),curioRoot=curios.group('DecorativeArtifacts');
curios.add(curioRoot,new T.SphereGeometry(.12,10,8),'blue',[-.23,.2,0]);curios.ring(curioRoot,[-.23,.2,0],.17,.018,'gold',[PI/2,.4,0]);
for(const sign of [-1,1])curios.add(curioRoot,new T.ConeGeometry(.12,.18,8),'teal',[.20,.19+sign*.09,0],sign<0?[PI,0,0]:[0,0,0]);
for(const y of [.03,.36])bevel(curios,curioRoot,[.20,y,0],[.30,.03,.30],'gold');
publish(curios,'magical-objects/decorative-artifacts.glb','Small divination sphere and sealed hourglass ornament',[{position:[-4.5,1.34,-2.9]}]);

const lamp=new Asset(),lampRoot=lamp.group('EnchantedLamp');
bevel(lamp,lampRoot,[0,0,0],[.30,.13,.30],'stone');lamp.rod(lampRoot,[0,.13,0],[0,1.1,0],.045,'wood');lantern(lamp,lampRoot,0,1.2,0,.30);
publish(lamp,'decorations/enchanted-lamp.glb','Warm post lamp',[{position:[-7.0,.2,3.7]},{position:[7.0,.2,3.7]},{position:[-2.0,.2,5.8]},{position:[2.0,.2,5.8]}]);

const garden=new Asset(),groot=garden.group('WorkshopLandscaping');
for(let i=0;i<100;i++){const t=rnd()*TAU,r=7.4+rnd()*2,x=Math.cos(t)*r,z=Math.sin(t)*r*.74;if(z>5.8&&Math.abs(x)<2)continue;
 if(i%5===0)rock(garden,groot,[x,.29,z],[.22,.18,.27],i%2?'stone':'moss',0);
 else for(let j=0;j<3;j++)garden.add(groot,new T.ConeGeometry(.025,.18+rnd()*.15,3),'moss',[x+j*.06,.33,z],[.1,rnd()*TAU,.12]);
 if(i%9===0){garden.rod(groot,[x,.2,z],[x,.55,z],.014,'leaf');garden.add(groot,new T.OctahedronGeometry(.06),'rune',[x,.58,z]);}
}
for(const side of [-1,1]){const x=side*7.5,z=-3.6;garden.rod(groot,[x,.2,z],[x,2.8,z],.18,'wood',7);for(let i=0;i<5;i++){const t=i*2.4;foliage(garden,groot,[x+Math.cos(t)*.55,2.6+(i%2)*.45,z+Math.sin(t)*.55],[.9,.7,.8],i%2?'leafDark':'leaf');}}
for(let i=0;i<10;i++){const z=6.7-i*.48;for(const side of [-1,1])garden.box(groot,[side*.29,.245,z],[.49,.07,.42],i%3?'stone':'edge');}
for(const side of [-1,1])for(let i=0;i<2;i++){const x=side*(6.0+i*.5),z=1.4+.10*Math.sin(i);garden.box(groot,[x,.245,z],[.46,.07,.65],'stone',[0,.04*Math.sin(i),0]);}
publish(garden,'decorations/island-landscaping.glb','Sparse plants, two rear trees, stone paths and edge rocks');

const magic=new Asset(),mroot=magic.group('WorkshopMotes');
for(let i=0;i<24;i++){const x=(rnd()-.5)*8,z=-3+rnd()*6;magic.add(mroot,new T.OctahedronGeometry(.015),'flame',[x,.7+rnd()*1.5,z]);}
magic.animate(mroot,'MoteDrift',15,.08);
publish(magic,'magical-objects/workshop-motes.glb','Lightweight opaque animated mote group');

const manifest={version:1,units:'metres',up:'+Y',forward:'+Z',placement:'All positions are island-local, not world coordinates.',assets,
 eisen:{file:'/models/transition/eisen.glb',root:'Eisen',clip:'eisen_idle',position:[-1.5,.39,.55],yaw:.28,scale:1,anchor:'EisenWorkAnchor',sha256:'d69f8fb6c191cbfd160148dbfc2afdb7442ac30f71f06b7ea1229d1be5d04b84'},
 projectStations:displayPositions.map((position,i)=>({slotId:'project-slot-'+String(i+1).padStart(2,'0'),file:'project-displays/station-'+String(i+1).padStart(2,'0')+'.glb',node:'ProjectStation_'+String(i+1).padStart(2,'0'),position,content:'provided by website'})),
 anchors:{entry:{node:'EntryAnchor',position:[0,.23,7],yaw:0},exit:{node:'ExitAnchor',position:[7,.23,-.4],yaw:PI/2}},
 suggestedLights:[{type:'PointLight',position:[.55,2.1,-.5],color:'#ffd79c',intensity:3,distance:7},{type:'PointLight',position:[0,3.5,-3.5],color:'#9fa7fa',intensity:2,distance:7}]};
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');



