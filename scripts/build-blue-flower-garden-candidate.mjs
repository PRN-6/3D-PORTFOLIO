// Deterministic standalone candidate. Writes only artifacts/blue-flower-garden/.
// Uses the repository's existing Three.js, glTF Transform and Draco dependencies.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as T from 'three';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import { draco as compress, dedup, weld } from '@gltf-transform/functions';
import draco from 'draco3dgltf';

const out = path.resolve('artifacts/blue-flower-garden');
fs.mkdirSync(out, { recursive: true });
let seed = 61429;
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a, b) => a + (b - a) * rand();
const color = hex => new T.Color(hex);
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('Blue Flower Garden');
const root = doc.createNode('BlueFlowerGarden_Candidate').setExtras({ units: 'metres', up: '+Y', forward: '+Z', heroZone: { center: [0, .42, .1], radius: 1.8, maxFlowerY: .62 }, runtimeHelper: 'garden-runtime.mjs', artDirection: 'Cinematic anime fantasy meadow; original procedural geometry' });
scene.addChild(root);
root.addChild(doc.createNode('Himmel_StagingAnchor').setTranslation([-.48,.42,.1]));
root.addChild(doc.createNode('Frieren_StagingAnchor').setTranslation([.48,.42,.1]));
const emissiveExtension = doc.createExtension(KHRMaterialsEmissiveStrength);
function material(name, roughness, metal = 0) { return doc.createMaterial(name).setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(roughness).setMetallicFactor(metal); }
const materials = [material('Living moss and meadow', .95), material('Weathered karst and ruins', .88, .05), material('Twisted cedar bark', .94), material('Nemophila and wisteria petals', .92).setDoubleSided(true), material('Golden radiant stamens', .7), material('Celestial mana crystal', .25, .15), material('Pastel horizon clouds', .98).setAlphaMode('BLEND').setBaseColorFactor([1, 1, 1, .88]), material('Wind petals and mana motes', .92).setAlphaMode('BLEND').setDoubleSided(true)];
materials[4].setEmissiveFactor(color('#F8CD36').toArray()).setExtension('KHR_materials_emissive_strength', emissiveExtension.createEmissiveStrength().setEmissiveStrength(.7));
materials[5].setEmissiveFactor(color('#75DDF6').toArray()).setExtension('KHR_materials_emissive_strength', emissiveExtension.createEmissiveStrength().setEmissiveStrength(1.4));
materials[7].setEmissiveFactor([1, 1, 1]);
// Tiny embedded emissive mask: first pixel glows for motes, second stays dark for petals.
function crc32(bytes) { let crc = 0xffffffff; for (const b of bytes) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, bytes) { const data = Buffer.concat([Buffer.from(type), bytes]), h = Buffer.alloc(4), c = Buffer.alloc(4); h.writeUInt32BE(bytes.length); c.writeUInt32BE(crc32(data)); return Buffer.concat([h, data, c]); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from([0,117,221,246,255,0,0,0,255]))), chunk('IEND', Buffer.alloc(0))]);
materials[7].setEmissiveTexture(doc.createTexture('Particle emission mask').setMimeType('image/png').setImage(png));

const bones = [], pivots = [], runtime = { schemaVersion: 1, petals: [], motes: [], crystalSpins: [], flowerCount: 4200, shrubCount: 24, seed: 61429 };
function bone(name, pivot = [0,0,0], parent = null, extras = {}) {
  const n = doc.createNode(name).setTranslation(pivot).setExtras(extras);
  (parent === null ? root : bones[parent]).addChild(n);
  const world = parent === null ? pivot : pivot.map((v, i) => v + pivots[parent][i]);
  bones.push(n); pivots.push(world); return bones.length - 1;
}
bone('StaticRoot');
class Batch {
  constructor(name, mat) { this.name = name; this.mat = mat; this.p = []; this.n = []; this.c = []; this.uv = []; this.j = []; this.w = []; this.i = []; }
  add(g, matrix = new T.Matrix4(), tint = '#ffffff', joint = 0, uvOverride = null) {
    const pos = g.getAttribute('position'); if (!g.getAttribute('normal')) g.computeVertexNormals();
    const normals = g.getAttribute('normal'), normalMatrix = new T.Matrix3().getNormalMatrix(matrix), start = this.p.length / 3;
    const v = new T.Vector3(), n = new T.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(matrix); n.fromBufferAttribute(normals, k).applyMatrix3(normalMatrix).normalize();
      this.p.push(v.x,v.y,v.z); this.n.push(n.x,n.y,n.z);
      const co = typeof tint === 'function' ? tint(v, k) : color(tint);
      this.c.push(co.r, co.g, co.b, 1); this.uv.push(...(uvOverride || [0,0])); this.j.push(joint,0,0,0); this.w.push(1,0,0,0);
    }
    if (g.index) for (const idx of g.index.array) this.i.push(idx + start);
    else for (let k = 0; k < pos.count; k++) this.i.push(start + k);
    g.dispose();
  }
}
const batches = materials.map((m, i) => new Batch(['Meadow','Karst_Ruins','Cedar_Bark','Blossoms','Golden_Stamens','Mana_Crystals','Horizon_Clouds','Drifting_Particles'][i], m));
const matrix = (p, s = [1,1,1], r = [0,0,0]) => new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(...s));
function geo(vertices, indices) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices.flat(),3)); if(indices)g.setIndex(indices); g.computeVertexNormals(); return g; }
function ico(batch, p, s, tint, detail = 0, joint = 0) { batches[batch].add(new T.IcosahedronGeometry(1,detail), matrix(p,s,[range(-.2,.2),range(0,Math.PI),range(-.2,.2)]),tint,joint); }
function tube(batch, points, radius, segments, sides, tint, joint = 0) { batches[batch].add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))),segments,radius,sides,false),new T.Matrix4(),tint,joint); }
const height = (x,z) => { const r=Math.hypot(x,z-.1); if(r<=1.85)return .42; const t=T.MathUtils.clamp((r-1.85)/7.3,0,1); return .42-.27*t*t+.025*Math.sin(x*1.7)*Math.sin(z*1.3)*Math.sin(Math.PI*t); };
function terrain() {
  const v=[[0,.42,.1]], ix=[], segments=96, rings=10;
  for(let j=1;j<=rings;j++)for(let k=0;k<segments;k++){const a=k/segments*Math.PI*2; const r=j/rings*(9.05+.18*Math.sin(5*a)+.12*Math.sin(9*a)); const x=Math.sin(a)*r,z=Math.cos(a)*r; v.push([x,height(x,z),z]);}
  for(let k=0;k<segments;k++)ix.push(0,1+k,1+(k+1)%segments);
  for(let j=1;j<rings;j++)for(let k=0;k<segments;k++){const a=1+(j-1)*segments+k,b=1+(j-1)*segments+(k+1)%segments,c=a+segments,d=b+segments;ix.push(a,c,b,b,c,d);}
  batches[0].add(geo(v,ix),new T.Matrix4(),p=>color('#3E8446').lerp(color('#529E5A'),.2+.65*Math.exp(-(p.x*p.x+p.z*p.z)/18)));
  // Irregular, closed, terraced karst shell; no coplanar duplicate underside.
  const levels=[[9.08,.14],[8.65,-.55],[7.8,-1.25],[5.4,-2.05],[2.5,-2.9],[.05,-3.8]], rv=[], ri=[];
  for(let l=0;l<levels.length;l++)for(let k=0;k<64;k++){const a=k/64*Math.PI*2,r=levels[l][0]*(1+.035*Math.sin(k*1.9+l));rv.push([Math.sin(a)*r,levels[l][1]+(l&&l<5?.12*Math.sin(k*2.7+l):0),Math.cos(a)*r]);}
  for(let l=0;l<5;l++)for(let k=0;k<64;k++){const a=l*64+k,b=l*64+(k+1)%64;ri.push(a,a+64,b,b,a+64,b+64);}
  ri.push(...Array.from({length:62},(_,k)=>[320,321+k,322+k]).flat());
  const shell=geo(rv,ri).toNonIndexed(); shell.computeVertexNormals();
  batches[1].add(shell,new T.Matrix4(),p=>color('#282D3B').lerp(color('#3B4459'),T.MathUtils.clamp((p.y+3.8)/4.2,0,1)).multiplyScalar(.9+.15*Math.sin(p.x*1.8+p.z*2.1)));
  for(let k=0;k<52;k++){const a=k/52*Math.PI*2,r=8.75; ico(1,[Math.sin(a)*r,-.12,Math.cos(a)*r],[range(.26,.52),range(.25,.43),range(.3,.65)],'#637775'); ico(0,[Math.sin(a)*r,.18,Math.cos(a)*r],[.35,.1,.45],'#679566');}
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2,r=range(3.5,7),top=-.8,bottom=range(-3.7,-2.5); const g=new T.ConeGeometry(range(.3,.65),top-bottom,6,1); batches[1].add(g,matrix([Math.sin(a)*r,(top+bottom)/2,Math.cos(a)*r],[1,1,1],[Math.PI,0,.12]),'#3B4459');}
}
terrain();
const swayBones=[];
for(let s=0;s<12;s++)swayBones.push(bone(`MeadowWind_${s}`,[0,.4,0]));
const flowerColors=['#3B7EF8','#60ABF8','#9485F5','#FFFFFF'];
const distributions=[2100,1050,630,420];
const colors=distributions.flatMap((n,i)=>Array(n).fill(flowerColors[i]));
for(let i=colors.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]];}
const flowerRecords=[];
function blossom(x,y,z,size,tint,joint,stem=true) {
  const vertices=[],indices=[]; const yaw=rand()*Math.PI*2;
  for(let p=0;p<5;p++){
    const a=yaw+p*Math.PI*2/5,base=vertices.length;
    for(const [r,ang,h] of [[.17,0,0],[.6,-.49,.12],[1,-.28,.27],[1,.28,.27],[.6,.49,.12]])vertices.push([x+Math.sin(a+ang)*r*size,y+h*size,z+Math.cos(a+ang)*r*size]);
    indices.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+4);
  }
  batches[3].add(geo(vertices,indices),new T.Matrix4(),(_,i)=>color(tint).lerp(color('#effaff'),i%5===0?.68:.06),joint);
  const center=[[x-size*.16,y+.015,z],[x,y+.018,z-size*.16],[x+size*.16,y+.015,z],[x,y+.018,z+size*.16]];
  batches[4].add(geo(center,[0,3,2,0,2,1]),new T.Matrix4(),'#F8CD36',joint);
  if(stem)batches[0].add(geo([[x-.012,height(x,z),z],[x+.012,height(x,z),z],[x+.009,y,z],[x-.009,y,z]],[0,1,2,0,2,3]),new T.Matrix4(),'#41744c',joint);
}
for(let i=0;i<4200;i++){
  let x,z; do{const a=rand()*Math.PI*2,r=Math.sqrt(rand())*8.55; x=Math.sin(a)*r;z=Math.cos(a)*r;}while((Math.abs(x)<.65&&z>5.9)||(Math.hypot(x-2.2,z-.8)<.7));
  const hero=Math.hypot(x,z-.1)<1.8; const y=height(x,z)+(hero?range(.045,.12):range(.12,.29)); const size=hero?range(.055,.09):range(.105,.18);
  const joint=hero?0:swayBones[Math.floor((Math.atan2(x,z)+Math.PI)/(2*Math.PI)*12)%12];
  blossom(x,y,z,size,colors[i],joint);flowerRecords.push({x,y,z,maxY:y+size*.27,hero});
}
// Clover / wild grass undergrowth, gathered into the meadow draw call.
for(let k=0;k<1250;k++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*8.55,x=Math.sin(a)*r,z=Math.cos(a)*r,y=height(x,z),h=Math.hypot(x,z-.1)<1.8?.07:range(.08,.2),joint=swayBones[k%12];
  for(let b=0;b<3;b++){const az=a+b*2.094,w=.025; batches[0].add(geo([[x-w,y,z],[x+w,y,z],[x+Math.sin(az)*.08,y+h,z+Math.cos(az)*.08]],[0,2,1]),new T.Matrix4(),k%3?'#6d9c67':'#7ca276',joint);}
}
// Twenty-four edge shrubs, with small colored flower flecks.
for(let k=0;k<150;k++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*8.3,x=Math.sin(a)*r,z=Math.cos(a)*r,y=height(x,z)+.028,j=swayBones[k%12];
  for(let leaf=0;leaf<3;leaf++){const az=a+leaf*Math.PI*2/3;const point=(radius,angle)=>[x+Math.sin(angle)*radius,y,z+Math.cos(angle)*radius];batches[0].add(geo([[x,y,z],point(.07,az-.65),point(.12,az),point(.07,az+.65)],[0,1,2,0,2,3]),new T.Matrix4(),'#82aa79',j);}
}
for(let k=0;k<24;k++){const a=k/24*Math.PI*2,r=7.8,x=Math.sin(a)*r,z=Math.cos(a)*r,j=swayBones[k%12];ico(0,[x,.45,z],[range(.36,.6),range(.28,.43),range(.32,.54)],k%2?'#527f63':'#71966c',1,j);for(let f=0;f<5;f++)blossom(x+range(-.3,.3),range(.65,.83),z+range(-.25,.25),.08,flowerColors[(k+f)%4],j,false);}
const treePositions=[[0,.4,-6.5],[-4.2,.4,-4.8],[4.5,.4,-4.5]],branchBones=[];
for(let t=0;t<3;t++){
  const [x,y,z]=treePositions[t],sign=t===1?-1:1;
  // Multiple tapering paths give bark ribs and a wind-twisted silhouette.
  const trunk=[[x,y,z],[x+.22*sign,1.3,z+.12],[x-.18*sign,2.15,z],[x+.22*sign,3,z-.25],[x+.45*sign,3.75,z-.1]];
  tube(2,trunk,.23,24,7,'#655a60');
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2; tube(2,[[x+Math.sin(a)*1.2,.33,z+Math.cos(a)*1.1],[x+Math.sin(a)*.4,.48,z+Math.cos(a)*.4],[x,1.1,z]],.08,8,5,'#786b70');}
  for(let k=0;k<6;k++){
    const a=k/6*Math.PI*2+t*.7,p=[x+.1,2.1+(k%3)*.4,z],end=[x+Math.sin(a)*range(1.1,1.9),3.1+(k%3)*.4,z+Math.cos(a)*range(.9,1.6)];
    const j=bone(`Tree_${t}_Branch_${k}`,p);branchBones.push(j);
    tube(2,[p,[p[0]+Math.sin(a)*.65,p[1]+.55,p[2]+Math.cos(a)*.55],end],.075,10,5,'#82757c',j);
    const canopyTint=k%2?'#b8a3df':'#89bbd5';
    for(let c=0;c<2;c++){
      const g=new T.IcosahedronGeometry(1,1);const pos=g.attributes.position;
      for(let v=0;v<pos.count;v++){const px=pos.getX(v),py=pos.getY(v),pz=pos.getZ(v),f=1+.12*Math.sin(px*11+py*7+pz*13);pos.setXYZ(v,px*f,py*f,pz*f);}g.computeVertexNormals();
      batches[3].add(g,matrix([end[0]+c*.3,end[1]+.16+c*.18,end[2]-c*.12],c?[.62,.28,.57]:[1.0,.4,.9]),p=>color(canopyTint).lerp(color('#e5d8f6'),T.MathUtils.clamp((p.y-end[1])*.45,0,.45)),j);
    }
    // Hanging wisteria racemes provide fine tiered silhouette rather than large spheres.
    for(let h=0;h<3;h++){const px=end[0]+range(-.55,.55),pz=end[2]+range(-.5,.5);for(let b=0;b<3;b++)ico(3,[px+.04*Math.sin(b),end[1]-.12-b*.16,pz],[.13-b*.025,.16,.11-b*.02],h%2?'#9d9cdb':'#c4abe0',0,j);}
  }
}
// South landing and East arch: pale, chipped stone with ivy, kept away from hero circle.
for(let k=0;k<5;k++)batches[1].add(new T.BoxGeometry(1.9,.12,.46),matrix([0,.26-k*.09,7.4+k*.38]),k%2?'#969c9d':'#b3b6a9');
for(const x of [1.55,2.85])for(let k=0;k<5;k++)batches[1].add(new T.BoxGeometry(.34,.33,.42),matrix([x,.61+k*.33,.8],[1,1,1],[0,0,range(-.04,.04)]),'#a4ada5');
for(let k=0;k<9;k++){const a=k/8*Math.PI; batches[1].add(new T.BoxGeometry(.3,.34,.44),matrix([2.2+Math.cos(a)*.65,2.1+Math.sin(a)*.65,.8],[1,1,1],[0,0,a-Math.PI/2]),'#b8bcb0');}
batches[1].add(new T.CylinderGeometry(.46,.52,.24,8),matrix([2.2,.51,.8]),'#a2aaa0');
for(let k=0;k<26;k++){const a=k*.65,x=1.55+Math.sin(a)*.17,y=.55+k*.065;ico(0,[x,y,.99],[.09,.05,.13],'#527b69');}
function crystal(p,size,joint=0,axis=[0,1,0]){const v=[],ix=[];for(const [r,y] of [[.22,0],[.3,.65]])for(let k=0;k<5;k++)v.push([Math.sin(k/5*Math.PI*2)*size*r,y*size,Math.cos(k/5*Math.PI*2)*size*r]);v.push([0,size,0]);for(let k=0;k<5;k++){const n=(k+1)%5;ix.push(k,k+5,n,n,k+5,n+5,k+5,10,n+5);}const m=new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...axis).normalize()),new T.Vector3(1,1,1));batches[5].add(geo(v,ix),m,'#84E5FF',joint);}
for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.25,r=7.4;crystal([Math.sin(a)*r,-1.2,Math.cos(a)*r],range(.85,1.05),0,[Math.sin(a),-.35,Math.cos(a)]);}
const orbitBones=[];
for(let k=0;k<8;k++){
  const a=k/8*Math.PI*2+.2,r=range(10.3,11.6),p=[Math.sin(a)*r,range(-1.25,.95),Math.cos(a)*r];
  const j=bone(`Satellite_${k}`,p);orbitBones.push(j);
  ico(1,p,[range(.45,.95),range(.4,.7),range(.4,.8)],k%2?'#546078':'#3B4459',1,j);
  ico(0,[p[0],p[1]+.32,p[2]],[.42,.12,.4],'#719779',0,j);
  const c=bone(`SatelliteCrystal_${k}`,[0,.28,0],j);runtime.crystalSpins.push({name:bones[c].getName(),period:12});
  crystal([p[0],p[1]+.28,p[2]],.5,c);
}
// Horizon crescent with front opening: radius 14–18 m, bottom above 1.5 m.
for(let k=0;k<14;k++){
  const a=-Math.PI*.6+k/13*Math.PI*1.2,r=range(15.5,16.2),x=Math.sin(a)*r,z=-Math.cos(a)*r,y=range(2.4,4.1);
  for(let l=0;l<3;l++)ico(6,[x+(l-1)*.75,y+(l===1?.35:0),z],[range(1,1.4),range(.42,.68),range(.6,.9)],p=>color('#FDE2EE').lerp(color('#FFFFFF'),T.MathUtils.clamp((p.y-1.5)/4,0,1)),1);
}
const particleBones=[];
for(let k=0;k<64;k++){
  const phase=k/64,p=[Math.cos(phase*Math.PI*2)*(2+6*phase),.8+2.4*phase,Math.sin(phase*Math.PI*2)*(2+6*phase)];
  const j=bone(`Petal_${String(k).padStart(2,'0')}`,p);particleBones.push(j);runtime.petals.push({name:bones[j].getName(),phase,joint:j});
  const s=range(.055,.11);batches[7].add(geo([[-s,0,0],[0,.02,-s*.6],[s,0,0],[s*.35,-.01,s],[0,-.015,s*.65]],[0,1,2,0,2,4,2,3,4]),matrix(p,[1,1,1],[range(0,2),range(0,6),range(0,2)]),flowerColors[k%4],j,[.75,.5]);
}
for(let k=0;k<40;k++){
  const p=[range(-7.5,7.5),range(.8,3),range(-7.5,7.5)],j=bone(`Mote_${String(k).padStart(2,'0')}`,p);runtime.motes.push({name:bones[j].getName(),phase:k/40,joint:j});
  ico(7,p,[.026,.045,.026],'#c9f5ff',0,j);
  // Set only these vertices to the luminous half of the emission mask.
  const b=batches[7];for(let v=b.uv.length-120;v<b.uv.length;v+=2){b.uv[v]=.25;b.uv[v+1]=.5;}
}

const skin=doc.createSkin('Garden_Rigid_Batch_Rig').setSkeleton(bones[0]);
// All moving bones must descend from the skeleton root for portable skin loading.
for(let i=1;i<bones.length;i++)if(bones[i].getParentNode()===root){root.removeChild(bones[i]);bones[0].addChild(bones[i]);}
const ibm=[];for(let i=0;i<bones.length;i++){skin.addJoint(bones[i]);ibm.push(...new T.Matrix4().makeTranslation(-pivots[i][0],-pivots[i][1],-pivots[i][2]).elements);}
const accessor=(name,type,array)=>doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
skin.setInverseBindMatrices(accessor('Inverse bind matrices','MAT4',new Float32Array(ibm)));
let tris=0;
for(const b of batches){
  const prim=doc.createPrimitive().setMaterial(b.mat)
    .setAttribute('POSITION',accessor(b.name+'_positions','VEC3',new Float32Array(b.p)))
    .setAttribute('NORMAL',accessor(b.name+'_normals','VEC3',new Float32Array(b.n)))
    .setAttribute('COLOR_0',accessor(b.name+'_colors','VEC4',new Float32Array(b.c)))
    .setAttribute('TEXCOORD_0',accessor(b.name+'_uv','VEC2',new Float32Array(b.uv)))
    .setAttribute('JOINTS_0',accessor(b.name+'_joints','VEC4',new Uint16Array(b.j)))
    .setAttribute('WEIGHTS_0',accessor(b.name+'_weights','VEC4',new Float32Array(b.w)))
    .setIndices(accessor(b.name+'_indices','SCALAR',new Uint32Array(b.i)));
  const mesh=doc.createMesh(b.name).addPrimitive(prim);
  root.addChild(doc.createNode(b.name).setMesh(mesh).setSkin(skin).setExtras({batch:b.name,castShadow: !['Horizon_Clouds','Drifting_Particles'].includes(b.name)}));
  tris+=b.i.length/3;
}
const times=Array.from({length:73},(_,i)=>i/12),input=accessor('Six second loop times','SCALAR',new Float32Array(times));
function channel(clip,joint,property,fn){const values=times.flatMap(fn);const output=accessor(`${bones[joint].getName()}_${property}` ,property==='rotation'?'VEC4':'VEC3',new Float32Array(values));const sampler=doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');clip.addSampler(sampler).addChannel(doc.createAnimationChannel().setSampler(sampler).setTargetNode(bones[joint]).setTargetPath(property));}
const breeze=doc.createAnimation('Island_Idle_Breeze').setExtras({loop:'REPEAT',duration:6});
for(const j of [...swayBones,...branchBones])channel(breeze,j,'rotation',t=>new T.Quaternion().setFromEuler(new T.Euler(.018*Math.sin(t*Math.PI+j),.008*Math.sin(t*Math.PI+j),.035*Math.sin(t*Math.PI+j*.7))).toArray());
const orbit=doc.createAnimation('Floating_Orbit_Crystals').setExtras({loop:'REPEAT',duration:6,axialRotation:'Runtime helper: continuous 12-second spin, not reset at clip boundary'});
for(const [k,j] of orbitBones.entries())channel(orbit,j,'translation',t=>pivots[j].map((v,i)=>v+(i===1?.18*Math.sin(t/6*Math.PI*2+k*.8):0)));
const drift=doc.createAnimation('Petal_Wind_Drift').setExtras({loop:'REPEAT',duration:6,materialAnimation:'Runtime helper: per-petal vertex alpha and emissive pulse; standard glTF cannot key material properties'});
// Scale fades hide the wrap in generic viewers; the helper adds true vertex-alpha fades.
for(const [k,j] of particleBones.entries()){
  channel(drift,j,'translation',t=>{const u=(t/6+k/64)%1,a=u*Math.PI*2,r=2+6*u;return[Math.cos(a)*r,.8+2.4*u,Math.sin(a)*r];});
  channel(drift,j,'scale',t=>{const u=(t/6+k/64)%1,s=Math.min(1,u/.12,(1-u)/.12);return[s,s,s];});
  channel(drift,j,'rotation',t=>new T.Quaternion().setFromEuler(new T.Euler(Math.sin(t/6*Math.PI*2+k)*.4,t/6*Math.PI*2,.35)).toArray());
}
for(const m of runtime.motes)channel(drift,m.joint,'scale',t=>{const s=1+.2*Math.sin(t/6*Math.PI*2+m.phase*Math.PI*2);return[s,s,s];});
runtime.mesh='Drifting_Particles';root.setExtras({...root.getExtras(),runtime});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco.createEncoderModule(),'draco3d.decoder':await draco.createDecoderModule()});
await doc.transform(weld(),dedup(),compress({method:'edgebreaker',encodeSpeed:5,decodeSpeed:5,quantizePosition:16,quantizeNormal:10,quantizeColor:8,quantizeTexcoord:12}));
await io.write(path.join(out,'blue-flower-garden.glb'),doc);
const metadata={generator:'scripts/build-blue-flower-garden-candidate.mjs',seed:61429,triangles:tris,primitives:8,materialCount:8,joints:bones.length,flowerCount:4200,flowerDistribution:distributions,heroFlowers:flowerRecords.filter(f=>f.hero).length,heroFlowerMaxY:Math.max(...flowerRecords.filter(f=>f.hero).map(f=>f.maxY)),treePositions,shrubs:24,satellites:8,underbellyGeodes:6,petals:64,motes:40,clips:doc.getRoot().listAnimations().map(a=>({name:a.getName(),duration:6})),coordinates:{up:'+Y',forward:'+Z',terrainCrest:.42,stalactiteTip:-3.8,endpointSpan:4.22},bytes:fs.statSync(path.join(out,'blue-flower-garden.glb')).size,drawCallScope:'8 model color-pass submissions with transparent materials forceSinglePass; shadows/postprocessing add passes. Full behavior requires garden-runtime.mjs.',limitations:['Hero characters are staging anchors, not included meshes.','Standard glTF has no loop flag, depthWrite or material-property animation; runtime helper applies these.','Sky cloud extent is excluded from the island core dimensions.']};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(metadata,null,2)+'\n');
if(tris<75000||tris>110000||metadata.heroFlowerMaxY>.62)throw new Error('Budget or hero clearance validation failed: '+JSON.stringify(metadata));
console.log(JSON.stringify(metadata,null,2));
