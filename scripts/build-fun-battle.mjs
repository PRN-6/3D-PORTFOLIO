// Original battle diorama; preserves all source party GLBs and the archived sunset model.
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import { mergeDocuments, unpartition, dedup, weld, draco as compress } from '@gltf-transform/functions';
import draco from 'draco3dgltf';

// Candidates are separate from the original; pass an explicit path to export another variant.
const output=process.argv[2] || 'public/models/fun/demon-battle-grand-arena.glb';
const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene('The Scales of Battle');
const root=doc.createNode('DemonBattle_Diorama');scene.addChild(root);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule(),'draco3d.encoder':await draco.createEncoderModule()});
const emission=doc.createExtension(KHRMaterialsEmissiveStrength);
const painted=doc.createMaterial('Painted stone and costumes').setMetallicFactor(0).setRoughnessFactor(.86).setDoubleSided(true);
const gold=doc.createMaterial('Antique gold').setMetallicFactor(.65).setRoughnessFactor(.32);
const cloth=doc.createMaterial('Demon velvet and hair').setMetallicFactor(0).setRoughnessFactor(.78).setDoubleSided(true);
const skin=doc.createMaterial('Porcelain skin').setMetallicFactor(0).setRoughnessFactor(.85);
const blue=doc.createMaterial('Azure spelllight').setBaseColorFactor([.15,.7,1,1]).setEmissiveFactor([.12,.6,1]).setExtension('KHR_materials_emissive_strength',emission.createEmissiveStrength().setEmissiveStrength(2.2));
const rose=doc.createMaterial('Demon spelllight').setBaseColorFactor([.8,.1,.45,1]).setEmissiveFactor([.8,.05,.35]).setExtension('KHR_materials_emissive_strength',emission.createEmissiveStrength().setEmissiveStrength(1.5));
const ward=doc.createMaterial('Blessing light').setBaseColorFactor([1,.8,.3,1]).setEmissiveFactor([.8,.5,.12]);
const buckets=new Map();
const q=(x=0,y=0,z=0)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z)).toArray();
function group(name,parent=root,p=[0,0,0],rotation=[0,0,0]){const n=doc.createNode(name).setTranslation(p).setRotation(q(...rotation));parent.addChild(n);return n;}
function add(node,g,p=[0,0,0],scale=[1,1,1],hex='#ffffff',mat=painted,rot=[0,0,0]){
 g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));
 if(g.index)g=g.toNonIndexed();for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);
 const c=new T.Color(hex),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));
 const key=node.getName()+':'+mat.getName();if(!buckets.has(key))buckets.set(key,{node,mat,geometries:[]});buckets.get(key).geometries.push(g);
}
const ball=(n,p,s,c,m=painted)=>add(n,new T.SphereGeometry(1,12,8),p,s,c,m);
const box=(n,p,s,c,m=painted,rot=[0,0,0])=>add(n,new T.BoxGeometry(1,1,1),p,s,c,m,rot);
function rod(n,a,b,r,c,m=painted){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const g=new T.CylinderGeometry(r,r,v.length(),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));add(n,g,a.map((v,i)=>(v+b[i])/2),[1,1,1],c,m);}
function curve(n,points,r,c,m=painted){add(n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,6,false),[0,0,0],[1,1,1],c,m);}
function ring(n,p,r,t,c,m=gold,rot=[-Math.PI/2,0,0]){add(n,new T.TorusGeometry(r,t,5,48),p,[1,1,1],c,m,rot);}
let seed=911;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const terrain=group('Ruined_Battle_Block');
// A broad, irregular floating courtyard. The party keeps its original proportions.
add(terrain,new T.CylinderGeometry(1, .88, 1.1, 48),[0,-.58,0],[5.65,1,4.5],'#51465f');
add(terrain,new T.CylinderGeometry(1,1,.18,48),[0,-.1,0],[5.6,1,4.45],'#798575');
for(let row=0;row<18;row++)for(let col=0;col<23;col++){
 const x=-5.06+col*.46,z=-3.91+row*.46;
 if((x/5.35)**2+(z/4.18)**2>1)continue;
 const edge=(x/4.8)**2+(z/3.6)**2>1;
 if(edge&&rnd()<.24)continue;
 box(terrain,[x,.025+rnd()*.008,z],[.442,.05,.442],['#929d98','#a4aaa2','#b6b6a5','#818e89'][Math.floor(rnd()*4)]);
}
// Rocky cutaway, roots and moss break up the silhouette without extra runtime meshes.
for(let i=0;i<65;i++){
 const a=i/65*Math.PI*2,x=Math.cos(a)*5.38,z=Math.sin(a)*4.22;
 add(terrain,new T.IcosahedronGeometry(1,0),[x,-.45-rnd()*.32,z],[.4+rnd()*.24,.4+rnd()*.45,.36],i%3?'#665973':'#827487');
 ball(terrain,[x,.015,z],[.32,.065,.23],i%2?'#637f69':'#7d936e');
 if(i%5===0)curve(terrain,[[x,.06,z],[x*1.02,-.25,z*1.02],[x*.99,-.7,z*1.05]],.035,'#6e7961');
}
const ruins=group('Ancient_Courtyard_Arches');
function pillar(x,z,h){
 box(ruins,[x,.13,z],[.76,.26,.76],'#7d8488');
 for(let k=0;k<Math.floor(h/.27);k++)box(ruins,[x,.32+k*.27,z],[.48,.25,.5],k%3?'#aaa6aa':'#8a8b97');
 box(ruins,[x,h+.2,z],[.7,.18,.7],'#c6bdbb');
 for(const dx of [-.14,.14])box(ruins,[x+dx,h*.5+.2,z+.26],[.035,h-.3,.025],'#c1b7ad');
}
// Open arches along the far edge frame the action without hiding the characters.
for(const [cx,cz] of [[-2.65,-3.05],[.1,-3.65],[2.85,-3.05]]){
 const h=2.25;pillar(cx-.91,cz,h);pillar(cx+.91,cz,h);
 for(let i=0;i<13;i++){
  const a=(i+.5)/13*Math.PI;
  box(ruins,[cx+Math.cos(a)*.91,h+.18+Math.sin(a)*.91,cz],[.24,.38,.5],i%3?'#aaa4ad':'#c4b9b8',painted,[0,0,a-Math.PI/2]);
 }
 box(ruins,[cx,h+1.2,cz],[.3,.43,.62],'#d2c2b0');
}
pillar(-4.6,-.9,1.5);pillar(4.55,-.75,1.1);
for(let i=0;i<10;i++)box(ruins,[-4.1+i*.9,.24,-3.55],[.7,.38,.34],'#878791');
for(let i=0;i<40;i++){
 const a=rnd()*Math.PI*2,x=Math.cos(a)*(4.2+rnd()*.85),z=Math.sin(a)*(3.35+rnd()*.35);
 add(terrain,new T.DodecahedronGeometry(.13+rnd()*.19),[x,.13,z],[1,.65,1],'#b1aaa6',painted,[rnd(),rnd(),0]);
}
// Foreground entrance, inset rings, and overgrown corners establish human scale.
for(let k=0;k<3;k++)box(terrain,[0,-.03-k*.16,4.03+k*.26],[2.8+k*.2,.18,.7],'#a0a29b');
ring(terrain,[0,.059,0],2.85,.018,'#c9b993');ring(terrain,[0,.06,0],2.98,.012,'#c9b993');
for(let i=0;i<28;i++){
 const a=i/28*Math.PI*2;
 box(terrain,[Math.sin(a)*2.92,.06,Math.cos(a)*2.92],[.04,.014,.09],'#cebd95',painted,[0,a,0]);
}
const foliage=group('Courtyard_Overgrowth');
for(const [x,z] of [[-4.5,1.6],[4.4,1.6],[-3.7,-2.7],[3.9,-2.4],[-2.9,3.25],[3.2,3.05]]){
 for(let i=0;i<7;i++){
  const px=x+(rnd()-.5)*.8,pz=z+(rnd()-.5)*.55;
  add(foliage,new T.IcosahedronGeometry(1,1),[px,.14+rnd()*.08,pz],[.24,.22,.22],i%2?'#779a7a':'#496b63');
  for(let j=0;j<3;j++){
   const bx=px+(rnd()-.5)*.26,bz=pz+(rnd()-.5)*.26,h=.25+rnd()*.22;
   rod(foliage,[bx,.08,bz],[bx,h,bz],.012,'#526e61');
   ball(foliage,[bx,h,bz],[.04,.055,.04],j%2?'#b9c8e5':'#dad1ec');
  }
 }
}
const flames=[];
for(const x of [-3.7,3.7]){
 const z=.55;box(ruins,[x,.12,z],[.6,.24,.6],'#737784');
 add(ruins,new T.CylinderGeometry(.17,.24,.65,8),[x,.55,z],[1,1,1],'#9793a0');
 add(ruins,new T.CylinderGeometry(.32,.17,.22,8),[x,.97,z],[1,1,1],'#b1a499',gold);
 const flame=group('Courtyard_Witchflame_'+flames.length,root,[x,1.19,z]);
 add(flame,new T.IcosahedronGeometry(.18,1),[0,0,0],[.7,1.6,.7],'#ffffff',blue);flames.push(flame);
}
const runes=group('Demon_Runic_Platform',root,[1.2,.065,-.7]);
ring(runes,[0,0,0],.86,.013,'#ffffff',rose);ring(runes,[0,.002,0],.71,.008,'#ffffff',rose);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(runes,[Math.sin(a)*.79,.004,Math.cos(a)*.79],[.035,.006,.08],'#ffffff',rose,[0,a,0]);}

// Reference-inspired original demon sculpt: pink braids, ivory horns, corset, magenta mantle and scales.
const demon=group('Battle_Demon',root,[1.2,.08,-.7],[0,-.5,0]);
demon.setScale([.88,.88,.88]);
const body=group('Demon_Body',demon);
for(const side of [-1,1]){
 const x=side*.095;ball(body,[x,.13,.035],[.075,.16,.08],'#24263f',cloth);ball(body,[x,.035,.075],[.08,.055,.14],'#26253e',cloth);
 add(body,new T.CylinderGeometry(.07,.055,.25,10),[x,.35,0],[1,1,1],'#26253e',cloth);
 add(body,new T.CylinderGeometry(.075,.07,.16,10),[x,.555,0],[1,1,1],'#f7e8e4',skin);
 ring(body,[x,.47,0],.071,.012,'#f0e7eb',painted);ring(body,[x,.395,0],.068,.008,'#e8dce7',painted);
 ball(body,[x,.635,0],[.085,.11,.085],'#eee6e7');
 curve(body,[[x-.045,.15,.095],[x,.42,.07],[x+.045,.15,.095]],.007,'#b7a286',gold);
}
add(body,new T.LatheGeometry([new T.Vector2(.14,.65),new T.Vector2(.11,.79),new T.Vector2(.18,.98),new T.Vector2(.13,1.07)],14),[0,0,0],[1,1,.7],'#29253e',cloth);
add(body,new T.LatheGeometry([new T.Vector2(.25,.52),new T.Vector2(.20,.60),new T.Vector2(.14,.72)],20),[0,0,0],[1,1,.8],'#483049',cloth);
ring(body,[0,.71,0],.145,.016,'#d4b27d',gold);
for(const s of [-1,1])curve(body,[[s*.13,.72,.07],[s*.18,.61,.12],[s*.23,.53,.08]],.01,'#d4b27d',gold);
ball(body,[0,1.07,0],[.075,.11,.075],'#fae6d5',skin);
for(const side of [-1,1])curve(body,[[side*.14,1,.075],[side*.11,.9,.10],[side*.025,.86,.10],[side*.075,.76,.09],[0,.69,.10]],.008,'#efe4d7');
ring(body,[0,1.095,0],.079,.014,'#f0ce83',gold);
curve(body,[[-.1,1.055,.08],[0,.97,.12],[.1,1.055,.08]],.014,'#e5c681',gold);
ball(body,[0,1.005,.13],[.03,.045,.013],'#ecd188',gold);
const cape=group('Demon_Cape',demon,[0,.91,-.09]);
for(const side of [-1,1]){
 const p=[],idx=[];for(let y=0;y<=9;y++)for(let x=0;x<=5;x++){const t=y/9,u=x/5;p.push(side*(.08+u*(.16+t*.36)), -t*.77, -.04-.10*Math.sin(u*Math.PI)-t*.19+.045*Math.sin(u*9+t*6));}
 for(let y=0;y<9;y++)for(let x=0;x<5;x++){const a=y*6+x;idx.push(a,a+6,a+1,a+1,a+6,a+7);}
 const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();add(cape,g,[0,0,0],[1,1,1],side<0?'#a33973':'#b44780',cloth);
 curve(cape,[[side*.24,0,-.04],[side*.36,-.3,-.18],[side*.5,-.58,-.22],[side*.6,-.77,-.26]],.009,'#e3bf91',gold);
 ball(body,[side*.18,1.025,-.035],[.12,.07,.13],'#763b65',cloth);
}
const head=group('Demon_Head',demon,[0,1.27,0]);
ball(head,[0,0,0],[.183,.22,.16],'#f9e7d8',skin);
ball(head,[0,.12,-.055],[.21,.175,.178],'#c776b3',cloth);
const braids=[];
for(const side of [-1,1]){
 ball(head,[side*.18,-.035,-.075],[.07,.20,.12],'#b66ca7',cloth);
 ball(head,[side*.185,-.04,0],[.055,.035,.025],'#f2d5cc',skin);
 const braid=group('Demon_Braid_'+(side<0?'L':'R'),head,[side*.2,-.14,.025]);braids.push(braid);
 for(let k=0;k<8;k++)ball(braid,[side*.012*Math.sin(k*2),-k*.045,0],[.037-k*.0017,.034,.032-k*.0015],k%2?'#d79bc4':'#ac6095',cloth);
 ring(braid,[0,-.34,0],.023,.009,'#e6c185',gold);
 // Layered bangs leave the eyes visible.
 for(let k=0;k<3;k++)curve(head,[[side*(.04+k*.045),.18,.07],[side*(.04+k*.04),.11,.155],[side*(.015+k*.05),.035+(k%2)*.03,.163]],.026,'#ca7cb8',cloth);
 // Almond eyes sit in the face, with narrow crimson irises and separate brows.
 ball(head,[side*.071,-.005,.145],[.042,.026,.012],'#43293f');ball(head,[side*.071,-.008,.154],[.034,.019,.006],'#fff6ed');ball(head,[side*.068,-.008,.160],[.014,.018,.004],'#ae3b64');ball(head,[side*.067,-.008,.164],[.006,.015,.002],'#2d1d33');ball(head,[side*.063,0,.167],[.004,.005,.002],'#fffaf4');
 curve(head,[[side*.11,.017,.151],[side*.073,.027,.158],[side*.034,.017,.154]],.004,'#3a2b45');
 curve(head,[[side*.11,.055,.141],[side*.073,.065,.149],[side*.038,.05,.151]],.005,'#884a78',cloth);
 const points=[[side*.15,.17,-.04],[side*.29,.25,-.07],[side*.33,.4,-.09],[side*.28,.56,-.035],[side*.22,.66,.035]];
 const line=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),verts=[],inds=[];
 for(let k=0;k<=20;k++){const t=k/20,v=line.getPoint(t),tan=line.getTangent(t),u=new T.Vector3(0,0,1).cross(tan).normalize(),w=tan.clone().cross(u);const radius=.06*(1-t)+.002;for(let s=0;s<8;s++){const point=v.clone().addScaledVector(u,Math.cos(s/8*Math.PI*2)*radius).addScaledVector(w,Math.sin(s/8*Math.PI*2)*radius);verts.push(...point.toArray());}}
 for(let k=0;k<20;k++)for(let s=0;s<8;s++){const a=k*8+s,b=k*8+(s+1)%8;inds.push(a,b,a+8,b,b+8,a+8);}
 const horn=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(verts,3));horn.setIndex(inds);horn.computeVertexNormals();add(head,horn,[0,0,0],[1,1,1],'#e8d6af');
 for(const t of [.2,.4,.6]){const pos=line.getPoint(t);ball(head,pos.toArray(),[.045*(1-t),.012,.05*(1-t)],'#988c70');}
}
ball(head,[0,-.055,.177],[.013,.018,.016],'#efcfbc',skin);
curve(head,[[-.034,-.105,.16],[0,-.114,.173],[.034,-.103,.16]],.004,'#895869');
const leftArm=group('Demon_LeftArm',demon,[-.17,1.01,0]);
rod(leftArm,[0,0,0],[-.13,-.17,.01],.046,'#f9e7d8',skin);
const forearm=group('Demon_CastingForearm',leftArm,[-.13,-.17,.01]);
ball(forearm,[0,0,0],[.046,.046,.046],'#f9e7d8',skin);
rod(forearm,[0,0,0],[-.09,-.18,.09],.038,'#29243f',cloth);ball(forearm,[-.1,-.2,.1],[.042,.046,.028],'#29243f',cloth);
for(let i=0;i<4;i++)curve(forearm,[[-.13+i*.018,-.22,.11],[-.15+i*.02,-.26,.14],[-.15+i*.02,-.28,.16]],.007,'#f3dfd2',skin);
const rightArm=group('Demon_RightArm',demon,[.17,1.01,0]);
rod(rightArm,[0,0,0],[.17,-.1,.015],.046,'#f9e7d8',skin);rod(rightArm,[.17,-.1,.015],[.25,.02,.1],.043,'#29243f',cloth);ball(rightArm,[.25,.025,.1],[.06,.055,.04],'#29243f',cloth);
const scales=group('Demon_GoldenScales',rightArm,[.25,-.015,.12]);
ring(scales,[0,-.04,0],.035,.008,'#dec583',gold,[0,0,0]);rod(scales,[0,-.08,0],[0,-.22,0],.009,'#dec583',gold);rod(scales,[-.23,-.20,0],[.23,-.20,0],.009,'#dec583',gold);
for(const s of [-1,1]){rod(scales,[s*.22,-.20,0],[s*.22-.055,-.43,0],.004,'#d8c180',gold);rod(scales,[s*.22,-.20,0],[s*.22+.055,-.43,0],.004,'#d8c180',gold);add(scales,new T.SphereGeometry(.075,12,5,0,Math.PI*2,Math.PI/2,Math.PI/2),[s*.22,-.43,0],[1,.4,1],'#cdb879',gold);ring(scales,[s*.22,-.43,0],.075,.006,'#ead193');}

const actorConfigs=[['Frieren',[-1.55,.075,1.1],2.15,'frieren_cast'],['Himmel',[-.75,.075,-.65],1.5,'himmel_sword_form'],['Eisen',[.05,.075,1.15],2.6,'eisen_axe'],['Heiter',[-2,.075,-.7],1.4,'heiter_idle']];
const wrappers=[];
for(const [name,position,yaw,clipName] of actorConfigs){
 const source=await io.read(`public/models/transition/${name.toLowerCase()}.glb`);
 for(const clip of [...source.getRoot().listAnimations()])if(clip.getName()!==clipName)clip.dispose();
 const mapped=mergeDocuments(doc,source),imported=mapped.get(source.getRoot().getDefaultScene()||source.getRoot().listScenes()[0]);
 const holder=group('Battle_'+name,root,position,[0,yaw,0]);holder.setScale([.82,.82,.82]);wrappers.push(holder);
 for(const child of [...imported.listChildren()])holder.addChild(child);imported.dispose();
}
// Export effects with the battle so the download remains a complete animated diorama.
const spell=group('Frieren_AzureBolt');ball(spell,[0,0,0],[.09,.09,.22],'#ffffff',blue);ring(spell,[0,0,0],.14,.012,'#ffffff',blue,[0,0,0]);
const counter=group('Demon_RoseBolt');ball(counter,[0,0,0],[.12,.10,.16],'#ffffff',rose);
const blessing=group('Heiter_ProtectiveWard',root,[-1.65,.8,-.25],[0,.4,0]);ring(blessing,[0,0,0],.41,.012,'#ffffff',ward,[0,0,0]);ring(blessing,[0,0,0],.34,.006,'#ffffff',ward,[0,0,0]);
const impact=group('Spell_Impact',root,[.8,1.0,-.45]);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;rod(impact,[Math.cos(a)*.1,Math.sin(a)*.1,0],[Math.cos(a)*.23,Math.sin(a)*.23,0],.008,'#ffffff',blue);}
const slash=group('Himmel_SwordArc',root,[.1,.8,-.7]);add(slash,new T.TorusGeometry(.48,.014,5,28,Math.PI*1.15),[0,0,0],[1,1,1],'#ffffff',blue,[0,.3,-.5]);
const arenaSigil=group('Party_Sigil',root,[-1.55,.075,1.1]);ring(arenaSigil,[0,0,0],.43,.009,'#ffffff',blue);
for(let i=0;i<8;i++){const a=i*Math.PI/4;box(arenaSigil,[Math.sin(a)*.43,0,Math.cos(a)*.43],[.04,.008,.055],'#ffffff',blue,[0,a,0]);}
// All secondary motion and spells are embedded in the downloadable GLB.
const charge=group('Demon_ChargingHalo',demon,[0,.9,-.15]);
ring(charge,[0,0,0],.61,.012,'#ffffff',rose,[0,0,0]);
for(let i=0;i<8;i++){
 const a=i*Math.PI/4;
 add(charge,new T.OctahedronGeometry(.055),[Math.cos(a)*.61,Math.sin(a)*.61,0],[1,1.6,.4],'#ffffff',rose,[0,0,a]);
}
const shockwave=group('Demon_Runewave',root,[1.2,.08,-.7]);
ring(shockwave,[0,0,0],1,.018,'#ffffff',rose);
ring(shockwave,[0,.015,0],.91,.007,'#ffffff',rose);
const motes=group('Demon_OrbitingEmbers',demon,[0,.8,0]);
for(let i=0;i<10;i++){
 const a=i/10*Math.PI*2;
 add(motes,new T.OctahedronGeometry(.025),[Math.cos(a)*.6,.35*Math.sin(a*2),Math.sin(a)*.6],[1,1.7,1],'#ffffff',rose);
}
const acc=(name,type,array)=>doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
for(const {node,mat,geometries} of buckets.values()){
 const g=mergeGeometries(geometries);const primitive=doc.createPrimitive().setMaterial(mat).setAttribute('POSITION',acc(node.getName()+'_pos','VEC3',g.attributes.position.array)).setAttribute('NORMAL',acc(node.getName()+'_norm','VEC3',g.attributes.normal.array)).setAttribute('COLOR_0',acc(node.getName()+'_color','VEC3',g.attributes.color.array));
 const mesh=doc.createMesh(node.getName()+'_mesh').addPrimitive(primitive);node.addChild(doc.createNode(node.getName()+'_'+mat.getName()).setMesh(mesh));
}
const times=Array.from({length:193},(_,i)=>i/24),input=acc('Eight second battle','SCALAR',new Float32Array(times));
const choreography=doc.createAnimation('Party_vs_Demon').setExtras({duration:8,loop:'REPEAT'});
function track(node,prop,fn){const sampler=doc.createAnimationSampler().setInterpolation('LINEAR').setInput(input).setOutput(acc(node.getName()+'_'+prop,prop==='rotation'?'VEC4':'VEC3',new Float32Array(times.flatMap(fn))));choreography.addSampler(sampler).addChannel(doc.createAnimationChannel().setSampler(sampler).setTargetNode(node).setTargetPath(prop));}
const pulse=(t,start,length)=>t>=start&&t<=start+length?Math.sin((t-start)/length*Math.PI):0;
track(wrappers[1],'translation',t=>[-.75+.65*pulse(t,1,2),.075,-.65]);
track(wrappers[2],'translation',t=>[.05+.38*pulse(t,3.4,2),.075,1.15-.58*pulse(t,3.4,2)]);
const casting=t=>pulse(t,4.5,2.5);
track(demon,'translation',t=>[1.2+.12*pulse(t,2.4,.6),.08+.32*casting(t),-.7]);
track(demon,'rotation',t=>q(-.1*pulse(t,2.4,.6),-.5-.18*casting(t),.06*pulse(t,2.4,.6)));
track(cape,'rotation',t=>q(-.06-.17*casting(t)+.045*Math.sin(t*Math.PI),.07*Math.sin(t*Math.PI/2),.05*Math.sin(t*Math.PI/2)));
track(head,'rotation',t=>q(-.12*casting(t),.12*Math.sin(t*Math.PI/4),.035*Math.sin(t*Math.PI/2)));
track(rightArm,'rotation',t=>q(-.3*casting(t),.12*casting(t),.22*casting(t)));
track(leftArm,'rotation',t=>q(-.65*casting(t),-.2*casting(t),-.8*casting(t)));
track(forearm,'rotation',t=>q(-.65*casting(t),0,.12*casting(t)));
track(scales,'rotation',t=>q(.08*Math.sin(t*Math.PI/2),0,.16*Math.sin(t*Math.PI/2)-.2*casting(t)));
braids.forEach((braid,i)=>track(braid,'rotation',t=>q(.12*Math.sin(t*Math.PI/2+i)+.2*casting(t),0,.09*Math.sin(t*Math.PI/2+i))));
track(runes,'rotation',t=>q(0,t*Math.PI/4,0));
track(charge,'rotation',t=>q(0,0,-t*Math.PI/2));
track(charge,'scale',t=>{const s=casting(t);return[s,s,s];});
track(shockwave,'scale',t=>{const s=pulse(t,5.6,1.3)*2.4;return[s,1,s];});
track(motes,'rotation',t=>q(0,t*Math.PI/2,0));
track(motes,'scale',t=>{const s=.7+.4*casting(t);return[s,s,s];});
flames.forEach((flame,i)=>{
 track(flame,'scale',t=>[1,.9+.12*Math.sin(t*Math.PI*2+i),1]);
 track(flame,'rotation',t=>q(0,t*Math.PI/2,0));
});
track(spell,'translation',t=>{const u=T.MathUtils.clamp((t-1.6)/1.1,0,1);return[-1.35+2.5*u,1.0+.12*Math.sin(u*Math.PI),.9-1.5*u];});
track(spell,'scale',t=>{const s=pulse(t,1.6,1.1);return[s,s,s];});
track(counter,'translation',t=>{const u=T.MathUtils.clamp((t-5.5)/1.25,0,1);return[1.05-2.6*u,1.1-.25*u,-.5+.35*u];});
track(counter,'scale',t=>{const s=pulse(t,5.5,1.25);return[s,s,s];});
track(impact,'scale',t=>{const s=pulse(t,2.55,.45);return[s,s,s];});
track(slash,'scale',t=>{const s=pulse(t,1.3,1.25);return[s,s,s];});
track(slash,'rotation',t=>q(0,.3,-.5-t*Math.PI/4));
track(blessing,'scale',t=>{const s=.86+.14*Math.sin(t*Math.PI/2);return[s,s,s];});
const heiterArm=doc.getRoot().listNodes().find(n=>n.getName()==='HeiterArmR');
if(heiterArm)track(heiterArm,'rotation',t=>q(-.9-.2*pulse(t,5.4,1.4),0,-.2));
await doc.transform(unpartition(),weld(),dedup(),compress({method:'edgebreaker',encodeSpeed:5,decodeSpeed:5,quantizePosition:14,quantizeNormal:10,quantizeColor:8}));
fs.mkdirSync(path.dirname(output),{recursive:true});
await io.write(output,doc);
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,nodes:doc.getRoot().listNodes().length,meshes:doc.getRoot().listMeshes().length,animations:doc.getRoot().listAnimations().map(a=>a.getName())},null,2));
