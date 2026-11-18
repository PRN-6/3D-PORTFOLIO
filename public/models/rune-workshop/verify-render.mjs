import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const output=path.resolve('public/models/rune-workshop');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();await page.setViewport({width:1500,height:1100,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4185/models/rune-workshop/preview.html');await page.waitForFunction(()=>!!window.workshopPreview,{timeout:120000});await page.evaluate(()=>window.workshopPreview.pause());
 for(const [name,position,target] of [
  ['workshop-front',[0,10.5,24],[0,.8,0]],
  ['workshop-overview',[17,12,24],[0,1,0]],
  ['workshop-interior',[0,5.5,11],[0,1.6,-1.5]],
  ['workshop-eisen',[-3,2.9,4],[-1.4,1.1,.4]],
  ['workshop-displays',[0,7.5,16],[0,1.0,3.4]],
  ['workshop-underside',[16,-5,23],[0,-1.7,0]],
 ]){
  await page.evaluate((p,t)=>window.workshopPreview.shot(p,t),position,target);
  await page.screenshot({path:path.join(output,'previews',name+'.png')});
 }
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),v=window.workshopPreview;
  let finite=true,triangles=0,meshCount=0,decodedTextures=0;
  const geometries=new Set();
  for(let i=0;i<360;i++){v.mixers.forEach(m=>m.update(1/24));v.scene.updateMatrixWorld(true);v.scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))finite=false;});}
  v.scene.traverse(o=>{if(o.isMesh){meshCount++;if(!geometries.has(o.geometry)){geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}for(const m of [].concat(o.material))if(m.map){if(!m.map.image?.width)throw Error('Texture decode failed: '+m.name);decodedTextures++;}}});
  v.shot([0,10.5,24],[0,.8,0]);v.scene.updateMatrixWorld(true);
  function visibility(root,focus){
   const camera=v.camera,box=new THREE.Box3().setFromObject(focus),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),samples=[];
   for(const dx of [-.24,0,.24])for(const dy of [-.22,0,.22]){
    const target=center.clone().add(new THREE.Vector3(dx*size.x,dy*size.y,size.z*.25));
    const ray=new THREE.Raycaster(camera.position,target.clone().sub(camera.position).normalize());
    const hits=ray.intersectObject(v.scene,true).filter(h=>h.object.visible&&h.object.name!=='EisenInk');
    const hit=hits[0];let belongs=false;for(let node=hit?.object;node;node=node.parent)if(node===root)belongs=true;
    samples.push(belongs);
   }
   const projected=center.clone().project(camera);
   return {node:root.name,visibleSamples:samples.filter(Boolean).length,totalSamples:samples.length,screenCenter:projected.toArray(),inFrame:Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z>-1&&projected.z<1};
  }
  const stations=v.manifest.projectStations.map(s=>{const root=v.scene.getObjectByName(s.node),focus=root.getObjectByName('Artifact_'+s.node.slice(-2));const visible=visibility(root,focus);const p=new THREE.Box3().setFromObject(focus).getCenter(new THREE.Vector3());const ray=new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,3,.1)),new THREE.Vector3(0,-1,-.1/3).normalize());return {...visible,raycast:ray.intersectObject(root,true).length>0};});
  const eisenVisibility=visibility(v.eisen,v.eisen.getObjectByName('EisenCostume'));
  const anchors=['EntryAnchor','ExitAnchor','EisenWorkAnchor'].map(name=>{const o=v.scene.getObjectByName(name);return {name,position:o.getWorldPosition(new THREE.Vector3()).toArray()};});
  const building=v.modules.find(m=>m.file==='architecture/rune-workshop.glb').root;
  const floorChecks=[{name:'Eisen feet',x:-1.5,z:.55,y:.39},...Array.from({length:12},(_,i)=>({name:'Crafting circle '+i,x:.55+Math.cos(i/12*Math.PI*2)*2.02,z:-.5+Math.sin(i/12*Math.PI*2)*2.02,y:.415}))].map(p=>{
   const hits=new THREE.Raycaster(new THREE.Vector3(p.x,2,p.z),new THREE.Vector3(0,-1,0)).intersectObject(building,true);
   const height=hits[0]?.point.y,valid=height!==undefined&&Math.abs(height-p.y)<.04;
   if(!valid)throw Error('Floor support missing: '+p.name);
   return {name:p.name,surfaceHeight:height,valid};
  });
  const files=v.templates.map(t=>t.spec.file);
  return{finite,uniqueGeometryTriangles:triangles,meshCount,decodedTextureBindings:decodedTextures,drawCalls:v.renderer.info.render.calls,renderedTriangles:v.renderer.info.render.triangles,stations,eisenVisibility,anchors,floorChecks,files};
 });
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});await page.evaluate(()=>window.workshopPreview.shot([0,28,67],[0,.7,0]));await page.screenshot({path:path.join(output,'previews','workshop-mobile.png')});
 result.mobileViewport={width:390,height:844};result.errors=errors;result.verifiedAt=new Date().toISOString();result.browser=await browser.version();result.renderer='SwiftShader, no physical-device FPS benchmark';
 result.hashes=Object.fromEntries(result.files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex')]));
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({...result,files:result.files.length,hashes:undefined}));
 if(errors.length||!result.finite||result.stations.some(s=>!s.raycast||!s.inFrame||s.visibleSamples<3)||!result.eisenVisibility.inFrame||result.eisenVisibility.visibleSamples<3)throw Error('Workshop verification failed; inspect verification.json');
}finally{await browser.close();}

