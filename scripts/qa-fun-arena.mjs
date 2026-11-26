// Production route checks; writes only to the requested, task-specific output directory.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out=path.resolve(process.env.QA_OUT || 'docs/audit/fun-grand-arena/after/interaction');
const base=process.env.QA_URL || 'http://127.0.0.1:5187';
fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sceneReady=page=>page.waitForFunction(()=>
 !document.querySelector('[data-testid="preloader-overlay"]') &&
 window.__THREE_SCENE__?.getObjectByName('Demon_ChargingHalo'),{timeout:60000});
async function press(page,text){
 const button=await page.evaluateHandle(label=>[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()===label),text);
 if(!button.asElement())throw new Error('Missing button: '+text);
 await button.asElement().click();await button.dispose();
}
const pose=page=>page.evaluate(()=>{
 const scene=window.__THREE_SCENE__;
 return ['Battle_Demon','Demon_Cape','Demon_CastingForearm','Demon_Braid_L','Demon_ChargingHalo','Demon_Runewave'].map(name=>{
  const node=scene?.getObjectByName(name);
  return {name,p:node?.position.toArray(),q:node?.quaternion.toArray(),s:node?.scale.toArray()};
 });
});
try{
 for(const mobile of [false,true])for(const theme of ['light','dark']){
  const context=await browser.createBrowserContext();const page=await context.newPage();
  const row={mobile,theme,errors:[],warnings:[],failures:[]};results.push(row);
  page.on('pageerror',error=>row.errors.push(error.stack));
  page.on('console',msg=>{if(msg.type()==='error')row.errors.push(msg.text());if(msg.type()==='warn')row.warnings.push(msg.text());});
  page.on('response',response=>{if(response.status()>=400)row.failures.push({url:response.url(),status:response.status()});});
  await page.setViewport({width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  await page.evaluateOnNewDocument(value=>localStorage.setItem('prinson_portfolio_theme',value),theme);
  try{
   await page.goto(base+'/fun',{waitUntil:'networkidle0',timeout:60000});await sceneReady(page);await wait(1500);
   row.layout=await page.evaluate(()=>{
    const card=document.querySelector('.ring-card'),stage=document.querySelector('.ring-stage');
    const b=card?.getBoundingClientRect();
    return {canvasCount:document.querySelectorAll('canvas').length,heading:document.querySelector('#ring-title')?.textContent,
     overflow:document.documentElement.scrollWidth>innerWidth,card:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null,
     stageHeight:stage?.getBoundingClientRect().height,download:document.querySelector('.ring-caption a')?.getAttribute('href')};
   });
   await page.screenshot({path:path.join(out,`${mobile?'mobile':'desktop'}-${theme}.png`)});
   if(process.env.QA_INSPECT==='1'){
    fs.writeFileSync(path.join(out,`${mobile?'mobile':'desktop'}-${theme}.html`),await page.content());
    continue;
   }
   await press(page,'Pause battle');await wait(100);const paused=await pose(page);await wait(400);
   row.pauseStill=JSON.stringify(paused)===JSON.stringify(await pose(page));
   await press(page,'Resume battle');await wait(500);row.resumes=JSON.stringify(paused)!==JSON.stringify(await pose(page));
   const camera=()=>page.evaluate(()=>window.__THREE_CAMERA__?.position.toArray());
   const original=await camera();const rect=await page.$eval('canvas',el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};});
   await page.mouse.move(rect.x+rect.w*.5,rect.y+rect.h*.5);await page.mouse.down();
   await page.mouse.move(rect.x+rect.w*.72,rect.y+rect.h*.57,{steps:12});await page.mouse.up();await wait(400);
   row.orbits=JSON.stringify(original)!==JSON.stringify(await camera());
   await press(page,'Reset view');await wait(800);
   row.resets=(await camera()).every((v,i)=>Math.abs(v-original[i])<.01);
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await wait(200);
   const reduced=await pose(page);await wait(450);row.reducedStill=JSON.stringify(reduced)===JSON.stringify(await pose(page));
   row.reducedControl=await page.$eval('.battle-controls button',el=>el.disabled&&el.textContent.includes('Motion reduced'));
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
   await page.keyboard.press('Escape');await wait(1200);
   row.escapeCloses=await page.evaluate(()=>location.pathname==='/'&&!document.querySelector('.ring-overlay')&&document.querySelectorAll('canvas').length===1);
   await page.goBack();await sceneReady(page);row.backReopens=await page.$('.ring-overlay')!==null;
   await page.goForward();await wait(500);row.forwardCloses=await page.evaluate(()=>location.pathname==='/'&&!document.querySelector('.ring-overlay'));
   const resources=[];
   for(let i=0;i<3;i++){
    await page.goBack();await sceneReady(page);await wait(350);
    resources.push(await page.evaluate(()=>window.__THREE_STATS__));
    await page.goForward();await wait(350);
   }
   row.reopenResources=resources;
   row.passed=!row.errors.length&&!row.failures.length&&row.layout.canvasCount===1&&!row.layout.overflow&&
    row.pauseStill&&row.resumes&&row.orbits&&row.resets&&row.reducedStill&&row.reducedControl&&row.escapeCloses&&row.backReopens&&row.forwardCloses;
  }catch(error){row.failure=error.stack;row.passed=false;}
  finally{
   console.log(JSON.stringify(row));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({browser:await browser.version(),base,results},null,2)+'\n');
   await context.close();
  }
 }
 if(results.some(row=>row.passed===false))process.exitCode=1;
}finally{await browser.close();}
