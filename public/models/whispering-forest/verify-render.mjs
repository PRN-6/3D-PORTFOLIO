import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const output = path.resolve('public/models/whispering-forest');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if(message.type()==='error') errors.push(message.text()); });
  page.on('response', response => { if(response.status()>=400)errors.push(response.status()+' '+response.url()); });
  await page.goto('http://127.0.0.1:4185/models/whispering-forest/preview.html');
  await page.waitForFunction(() => !!window.forestPreview, { timeout: 120000 });
  await page.evaluate(() => {window.forestPreview.pause();window.forestPreview.mixers.forEach(m=>m.setTime(1.5));});
  for(const [name,position,target] of [
    ['forest-overview',[19,15,23],[0,1,0]],
    ['forest-tree',[-9,8,11],[.7,3.2,-2.6]],
    ['forest-pond',[-13,9,14],[-3.7,.3,3.1]],
    ['forest-heiter',[-2.0,3.1,4.5],[-5.5,1.0,1.2]],
    ['forest-about',[1.3,2.9,3.8],[1.35,1.25,.5]],
    ['forest-underside',[17,-6,23],[0,-2,0]],
  ]) {
    await page.evaluate((position,target) => window.forestPreview.shot(position,target),position,target);
    await page.screenshot({ path: path.join(output,'previews',name+'.png') });
  }
  const result = await page.evaluate(async () => {
    const view=window.forestPreview;
    let valid=true,triangles=0,meshes=0,decodedTextures=0;
    const checkTextures=root=>root.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material)){if(m.map){if(!(m.map.image?.width>0))throw Error('Undecoded texture: '+m.name);decodedTextures++;}}});
    checkTextures(view.scene);
    const seen=new Set();
    for(let i=0;i<180;i++)view.mixers.forEach(mixer=>mixer.update(1/24));
    view.scene.updateMatrixWorld(true);
    view.scene.traverse(o=>{
      if(!o.matrixWorld.elements.every(Number.isFinite))valid=false;
      if(o.isMesh){meshes++;if(!seen.has(o.geometry)){seen.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}}
    });
    const target=view.scene.getObjectByName('BiographyBook'),p=target.getWorldPosition(view.camera.position.clone());
    const THREE=await import('/node_modules/.vite/deps/three.js');
    const origin=p.clone().add(new THREE.Vector3(0,2,.3));
    const hit=new THREE.Raycaster(origin,p.clone().sub(origin).normalize()).intersectObject(target,true).length>0;
    const manifest=await(await fetch('./manifest.json')).json();
    const connections=[];
    const kit=new THREE.Group();
    window.forestKit=kit;
    for(const entry of manifest.connections){
      const asset=await view.loader.loadAsync('./'+entry.file);
      checkTextures(asset.scene);
      const start=asset.scene.getObjectByName('Entry').position.toArray(),end=asset.scene.getObjectByName('Exit').position.toArray();
      if(start.some((v,i)=>Math.abs(v-entry.entry[i])>1e-5)||end.some((v,i)=>Math.abs(v-entry.exit[i])>1e-5))throw Error('Socket mismatch: '+entry.file);
      const exitRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),entry.exitYaw);
      if(asset.scene.getObjectByName('Exit').quaternion.angleTo(exitRotation)>1e-5)throw Error('Socket direction mismatch: '+entry.file);
      asset.scene.updateMatrixWorld(true);
      let surfaceSamples=0;
      if(entry.file.startsWith('stairs-')||entry.file.startsWith('bridge-')){
        const n=entry.file==='stairs-spiral.glb'?24:entry.file==='stairs-curved.glb'?10:entry.file==='stairs-straight.glb'?8:entry.file==='stairs-small.glb'?3:entry.file==='stairs-ceremonial.glb'?10:24;
        for(let i=0;i<n;i++){
          const u=(i+.5)/n,curved=entry.file.includes('curved')||entry.file.includes('spiral'),angle=entry.file.includes('spiral')?Math.PI*2:Math.PI/2,R=entry.file==='stairs-spiral.glb'?2:entry.file==='stairs-curved.glb'?2.2:4.7/1.57;
          const x=curved?R*(1-Math.cos(u*angle)):0,z=curved?R*Math.sin(u*angle):u*entry.run;
          const expected=entry.file.startsWith('stairs-')?(i+1)/n*entry.rise:.35*Math.sin(Math.PI*u);
          for(const side of [-.32,0,.32]){
            const yaw=curved?u*angle:0,offset=side*entry.width;
            const hits=new THREE.Raycaster(new THREE.Vector3(x+Math.cos(yaw)*offset,20,z-Math.sin(yaw)*offset),new THREE.Vector3(0,-1,0)).intersectObject(asset.scene,true);
            if(!hits.length||Math.abs(hits[0].point.y-expected)>.025)throw Error('Walking surface gap: '+entry.file+' sample '+i+' side '+side);
            surfaceSamples++;
          }
        }
      }
      const index=connections.length;
      asset.scene.position.set((index%4-1.5)*8,0,Math.floor(index/4)*8);
      kit.add(asset.scene);
      connections.push({file:entry.file,entry:start,exit:end,surfaceSamples});
    }
    return {valid,triangles,meshes,biographyHit:hit,decodedTextureBindings:decodedTextures,drawCalls:view.renderer.info.render.calls,connections};
  });
  await page.evaluate(async()=>{
    const v=window.forestPreview,THREE=await import('/node_modules/.vite/deps/three.js');
    const scene=new THREE.Scene();scene.background=v.scene.background;
    v.scene.children.filter(o=>o.isLight).forEach(o=>scene.add(o.clone()));
    scene.add(window.forestKit);v.camera.position.set(37,42,61);v.camera.lookAt(0,0,15);
    // The animation loop renders the main scene; temporarily use the kit scene.
    window.forestOriginal=v.scene.children.filter(o=>!o.isLight);window.forestOriginal.forEach(o=>o.visible=false);
    v.scene.add(window.forestKit);v.renderer.render(v.scene,v.camera);
  });
  await page.screenshot({path:path.join(output,'previews','forest-connections.png')});
  await page.evaluate(()=>{const v=window.forestPreview;v.scene.remove(window.forestKit);window.forestOriginal.forEach(o=>o.visible=true);});
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>window.forestPreview.shot([36,28,44],[0,.5,0]));
  await page.screenshot({path:path.join(output,'previews','forest-mobile.png')});
  result.mobileViewport={width:390,height:844,deviceScaleFactor:1};
  result.verifiedAt=new Date().toISOString();
  result.browser=await browser.version();
  result.renderer='Headless Chrome, SwiftShader; visual viewport check, not a physical-device FPS benchmark';
  result.assetHashes=Object.fromEntries(fs.readdirSync(output).filter(f=>f.endsWith('.glb')).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex')]));
  result.errors=errors;
  if(errors.length||!result.valid||!result.biographyHit)throw Error(JSON.stringify({errors,result}));
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({ ...result,connections:result.connections.length,errors }));
} finally { await browser.close(); }

