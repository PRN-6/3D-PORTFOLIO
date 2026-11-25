// Original battle diorama; preserves all source party GLBs and the archived sunset model.
import fs from 'node:fs';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import { mergeDocuments, unpartition, dedup, weld, draco as compress } from '@gltf-transform/functions';
import draco from 'draco3dgltf';

const output='public/models/fun/demon-battle.glb';
const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene('The Scales of Battle');
const root=doc.createNode('DemonBattle_Diorama');scene.addChild(root);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule(),'draco3d.encoder':await draco.createEncoderModule()});
const emission=doc.createExtension(KHRMaterialsEmissiveStrength);
const painted=doc.createMaterial('Painted stone and costumes').setRoughnessFactor(.86).setDoubleSided(true);
const gold=doc.createMaterial('Antique gold').setMetallicFactor(.65).setRoughnessFactor(.32);
const cloth=doc.createMaterial('Demon velvet and hair').setRoughnessFactor(.78).setDoubleSided(true);
const skin=doc.createMaterial('Porcelain skin').setRoughnessFactor(.85);
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
box(terrain,[0,-.44,0],[5.6,.85,4.25],'#3e394e');
box(terrain,[0,-.07,0],[5.72,.16,4.34],'#697179');
for(let row=0;row<10;row++)for(let col=0;col<13;col++){
 const x=-2.62+col*.435,z=-1.94+row*.43;
 box(terrain,[x,.027+rnd()*.012,z],[.419,.045,.414],['#9c9b96','#858d91','#a5a49b','#79858a'][Math.floor(rnd()*4)]);
}
// Cutaway soil strata, roots, moss and broken battlements give the compact world a readable silhouette.
for(let i=0;i<44;i++){const a=i/44*Math.PI*2,x=Math.cos(a)*2.8,z=Math.sin(a)*2.12;add(terrain,new T.IcosahedronGeometry(1,0),[x,-.35-rnd()*.28,z],[.25,.25+rnd()*.2,.24],i%3?'#4c435c':'#6f6178');ball(terrain,[x,.06,z],[.2,.045,.16],'#667c66');}
for(const [x,z,h] of [[-2.25,-1.55,1.35],[2.35,-1.65,1.7],[2.48,1.55,.7]]){
 for(let k=0;k<Math.floor(h/.22);k++)box(terrain,[x,.13+k*.22,z],[.32,.2,.34],k%2?'#828093':'#a6a0ac');
 box(terrain,[x,h,z],[.45,.13,.45],'#bbb0bb');
}
for(let i=0;i<14;i++)box(terrain,[-2.4+i*.37,.15,-2.02],[.3,.17,.27],'#74717e');
for(let i=0;i<23;i++){const x=-2.5+rnd()*5,z=-1.8+rnd()*3.6;if(Math.hypot(x-1.1,z+.65)<1.3)continue;add(terrain,new T.IcosahedronGeometry(.1+rnd()*.09,0),[x,.1,z],[1,.6,1],'#b1aab0');}
const runes=group('Demon_Runic_Platform',root,[1.2,.065,-.7]);
ring(runes,[0,0,0],.86,.013,'#ffffff',rose);ring(runes,[0,.002,0],.71,.008,'#ffffff',rose);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(runes,[Math.sin(a)*.79,.004,Math.cos(a)*.79],[.035,.006,.08],'#ffffff',rose,[0,a,0]);}

// Reference-inspired original demon sculpt: pink braids, ivory horns, corset, magenta mantle and scales.
const demon=group('Battle_Demon',root,[1.2,.08,-.7],[0,-.5,0]);
const body=group('Demon_Body',demon);
for(const side of [-1,1]){
 const x=side*.095;ball(body,[x,.13,.035],[.075,.16,.08],'#24263f',cloth);ball(body,[x,.035,.075],[.08,.055,.14],'#26253e',cloth);
 add(body,new T.CylinderGeometry(.07,.055,.25,10),[x,.35,0],[1,1,1],'#26253e',cloth);
 add(body,new T.CylinderGeometry(.075,.07,.16,10),[x,.555,0],[1,1,1],'#f7e8e4',skin);
 ring(body,[x,.47,0],.071,.012,'#f0e7eb',painted);ring(body,[x,.395,0],.068,.008,'#e8dce7',painted);
 box(body,[x,.635,0],[.16,.15,.17],'#eee6e7');
}
add(body,new T.LatheGeometry([new T.Vector2(.14,.65),new T.Vector2(.11,.79),new T.Vector2(.18,.98),new T.Vector2(.13,1.07)],14),[0,0,0],[1,1,.7],'#29253e',cloth);
ball(body,[0,1.07,0],[.075,.11,.075],'#fae6d5',skin);
for(const side of [-1,1])curve(body,[[side*.14,1,.075],[side*.11,.9,.10],[side*.025,.86,.10],[side*.075,.76,.09],[0,.69,.10]],.008,'#efe4d7');
ring(body,[0,1.095,0],.079,.014,'#f0ce83',gold);
curve(body,[[-.1,1.055,.08],[0,.97,.12],[.1,1.055,.08]],.014,'#e5c681',gold);
ball(body,[0,1.005,.13],[.03,.045,.013],'#ecd188',gold);
const cape=group('Demon_Cape',demon,[0,.91,-.09]);
for(const side of [-1,1]){
 const p=[],idx=[];for(let y=0;y<=9;y++)for(let x=0;x<=5;x++){const t=y/9,u=x/5;p.push(side*(.11+u*(.12+t*.36)), -t*.82, -.02-.10*Math.sin(u*Math.PI)-t*.07+.035*Math.sin(u*9+t*6));}
 for(let y=0;y<9;y++)for(let x=0;x<5;x++){const a=y*6+x;idx.push(a,a+6,a+1,a+1,a+6,a+7);}
 const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();add(cape,g,[0,0,0],[1,1,1],side<0?'#a33973':'#b44780',cloth);
}
const head=group('Demon_Head',demon,[0,1.27,0]);
ball(head,[0,0,0],[.205,.23,.17],'#f9e7d8',skin);
ball(head,[0,.13,-.055],[.23,.17,.18],'#c776b3',cloth);
for(const side of [-1,1]){
 ball(head,[side*.205,-.035,-.065],[.095,.21,.13],'#b66ca7',cloth);
 for(let k=0;k<6;k++)ball(head,[side*(.20+.016*Math.sin(k*2)),-.17-k*.047,.025],[.043,.04,.039],k%2?'#cb87bd':'#b565a4',cloth);
 // Layered bangs leave the eyes visible.
 for(let k=0;k<3;k++)curve(head,[[side*(.04+k*.045),.18,.07],[side*(.04+k*.04),.11,.155],[side*(.015+k*.05),.035+(k%2)*.03,.163]],.026,'#ca7cb8',cloth);
 ball(head,[side*.076,-.01,.153],[.048,.052,.015],'#30283f');ball(head,[side*.076,-.009,.165],[.038,.041,.011],'#f8f4ed');ball(head,[side*.075,-.014,.177],[.024,.031,.006],'#385d7a');ball(head,[side*.073,-.012,.182],[.011,.024,.004],'#202339');ball(head,[side*.066,.001,.186],[.008,.009,.003],'#fffaf4');
 curve(head,[[side*.12,.035,.169],[side*.075,.043,.178],[side*.033,.032,.167]],.005,'#3a2b45');
 const points=[[side*.155,.16,-.04],[side*.28,.25,-.065],[side*.31,.39,-.06],[side*.235,.52,-.04],[side*.19,.59,0]];
 const line=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),verts=[],inds=[];
 for(let k=0;k<=20;k++){const t=k/20,v=line.getPoint(t),tan=line.getTangent(t),u=new T.Vector3(0,0,1).cross(tan).normalize(),w=tan.clone().cross(u);const radius=.06*(1-t)+.002;for(let s=0;s<8;s++){const point=v.clone().addScaledVector(u,Math.cos(s/8*Math.PI*2)*radius).addScaledVector(w,Math.sin(s/8*Math.PI*2)*radius);verts.push(...point.toArray());}}
 for(let k=0;k<20;k++)for(let s=0;s<8;s++){const a=k*8+s,b=k*8+(s+1)%8;inds.push(a,b,a+8,b,b+8,a+8);}
 const horn=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(verts,3));horn.setIndex(inds);horn.computeVertexNormals();add(head,horn,[0,0,0],[1,1,1],'#e8e0bc');
 for(const t of [.2,.4,.6]){const pos=line.getPoint(t);ball(head,pos.toArray(),[.045*(1-t),.012,.05*(1-t)],'#988c70');}
}
ball(head,[0,-.055,.177],[.013,.018,.016],'#efcfbc',skin);
curve(head,[[-.034,-.105,.16],[0,-.114,.173],[.034,-.103,.16]],.004,'#895869');
const leftArm=group('Demon_LeftArm',demon,[-.17,1.01,0]);
rod(leftArm,[0,0,0],[-.13,-.17,.01],.046,'#f9e7d8',skin);rod(leftArm,[-.13,-.17,.01],[-.22,-.35,.1],.045,'#29243f',cloth);ball(leftArm,[-.23,-.37,.11],[.045,.065,.035],'#29243f',cloth);
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
 const holder=group('Battle_'+name,root,position,[0,yaw,0]);wrappers.push(holder);
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
const acc=(name,type,array)=>doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
for(const {node,mat,geometries} of buckets.values()){
 const g=mergeGeometries(geometries);const primitive=doc.createPrimitive().setMaterial(mat).setAttribute('POSITION',acc(node.getName()+'_pos','VEC3',g.attributes.position.array)).setAttribute('NORMAL',acc(node.getName()+'_norm','VEC3',g.attributes.normal.array)).setAttribute('COLOR_0',acc(node.getName()+'_color','VEC3',g.attributes.color.array));
 const mesh=doc.createMesh(node.getName()+'_mesh').addPrimitive(primitive);node.addChild(doc.createNode(node.getName()+'_'+mat.getName()).setMesh(mesh));
}
const times=Array.from({length:97},(_,i)=>i/12),input=acc('Eight second battle','SCALAR',new Float32Array(times));
const choreography=doc.createAnimation('Party_vs_Demon').setExtras({duration:8,loop:'REPEAT'});
function track(node,prop,fn){const sampler=doc.createAnimationSampler().setInterpolation('LINEAR').setInput(input).setOutput(acc(node.getName()+'_'+prop,prop==='rotation'?'VEC4':'VEC3',new Float32Array(times.flatMap(fn))));choreography.addSampler(sampler).addChannel(doc.createAnimationChannel().setSampler(sampler).setTargetNode(node).setTargetPath(prop));}
const pulse=(t,start,length)=>t>=start&&t<=start+length?Math.sin((t-start)/length*Math.PI):0;
track(wrappers[1],'translation',t=>[-.75+.65*pulse(t,1,2),.075,-.65]);
track(wrappers[2],'translation',t=>[.05+.38*pulse(t,3.4,2),.075,1.15-.58*pulse(t,3.4,2)]);
track(demon,'translation',t=>[1.2+.08*pulse(t,2.4,.6),.08+.035*Math.sin(t*Math.PI/4),-.7]);
track(cape,'rotation',t=>q(.035*Math.sin(t*Math.PI/2),0,.05*Math.sin(t*Math.PI/2)));
track(head,'rotation',t=>q(0,.1*Math.sin(t*Math.PI/4),.035*Math.sin(t*Math.PI/2)));
track(rightArm,'rotation',t=>q(-.18*pulse(t,5.1,1.5),0,-.16*pulse(t,5.1,1.5)));
track(leftArm,'rotation',t=>q(-.45*pulse(t,5.1,1.5),0,-.25*pulse(t,5.1,1.5)));
track(scales,'rotation',t=>q(0,0,.12*Math.sin(t*Math.PI/2)));
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
await io.write(output,doc);
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,nodes:doc.getRoot().listNodes().length,meshes:doc.getRoot().listMeshes().length,animations:doc.getRoot().listAnimations().map(a=>a.getName())},null,2));
