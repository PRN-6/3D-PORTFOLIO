// Scrub the exported choreography in the actual app, with playback paused.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const out=process.env.QA_OUT || 'docs/audit/fun-grand-arena/after/poses';
const {tracks}=JSON.parse(fs.readFileSync('docs/audit/fun-grand-arena/after/quality.json','utf8'));
fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.goto((process.env.QA_URL || 'http://127.0.0.1:5187')+'/fun',{waitUntil:'networkidle0'});
 await page.waitForFunction(()=>!document.querySelector('[data-testid="preloader-overlay"]')&&window.__THREE_SCENE__?.getObjectByName('Demon_ChargingHalo'));
 for(const frame of [0,48,138,192]){
  await page.evaluate(({tracks,frame})=>{
   for(const track of tracks){
    const node=window.__THREE_SCENE__.getObjectByName(track.node),size=track.path==='rotation'?4:3;
    const value=track.values.slice(frame*size,(frame+1)*size);
    if(track.path==='rotation')node.quaternion.fromArray(value);else if(track.path==='translation')node.position.fromArray(value);else node.scale.fromArray(value);
   }
   window.__THREE_SCENE__.updateMatrixWorld(true);
  },{tracks,frame});
  await new Promise(resolve=>setTimeout(resolve,200));
  if(frame===138)await page.screenshot({path:path.join(out,'courtyard-casting.png')});
  await page.evaluate(()=>{
   window.__THREE_SCENE__.getObjectByName('DemonBattle_Diorama').position.set(-1.2,0,.7);
   window.__THREE_CAMERA__.position.set(0,2.4,4.6);
  });
  await new Promise(resolve=>setTimeout(resolve,200));
  await page.screenshot({path:path.join(out,`demon-${frame/24}s.png`)});
  await page.evaluate(()=>{
   window.__THREE_SCENE__.getObjectByName('DemonBattle_Diorama').position.set(0,0,0);
   window.__THREE_CAMERA__.position.set(15.4*.45,15.4*.46,15.4*.78);
  });
 }
}finally{await browser.close();}
