import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out=path.resolve(process.env.QA_OUT||'docs/qa/fun-battle');fs.mkdirSync(out,{recursive:true});
const before=process.env.QA_BEFORE==='1';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={browser:await browser.version(),before,results:[]};
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1});
  await page.goto((process.env.QA_URL||'http://127.0.0.1:5190')+'/fun',{waitUntil:'networkidle0',timeout:60000});
  await page.waitForFunction(()=>!document.querySelector('[data-testid="preloader-overlay"]')&&window.__THREE_STATS__?.calls>0,{timeout:60000});
  await new Promise(r=>setTimeout(r,2500));
  const info=await page.evaluate(async()=>{
   const stamps=[];let last=performance.now();const start=last;
   await new Promise(resolve=>{function frame(t){stamps.push(t-last);last=t;if(t-start<3000)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   stamps.shift();stamps.sort((a,b)=>a-b);
   return{stats:window.__THREE_STATS__,p95Ms:stamps[Math.floor(stamps.length*.95)],maxMs:stamps.at(-1),canvases:document.querySelectorAll('canvas').length,heading:document.querySelector('#ring-title')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,names:window.__THREE_SCENE__?.children.map(n=>n.name),battle:!!window.__THREE_SCENE__?.getObjectByName('DemonBattle_Diorama')};
  });
  await page.screenshot({path:path.join(out,(mobile?'mobile':'desktop')+'.png')});
  if(!before){
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   await new Promise(r=>setTimeout(r,200));
   const pose=await page.evaluate(()=>window.__THREE_SCENE__?.getObjectByName('Battle_Demon')?.position.toArray());
   await new Promise(r=>setTimeout(r,400));
   info.reducedMotionStill=await page.evaluate(p=>JSON.stringify(window.__THREE_SCENE__?.getObjectByName('Battle_Demon')?.position.toArray())===JSON.stringify(p),pose);
   await page.keyboard.press('Escape');await new Promise(r=>setTimeout(r,1500));
   info.closeReturnedHome=await page.evaluate(()=>location.pathname==='/'&&!document.querySelector('.ring-overlay')&&document.querySelectorAll('canvas').length===1);
   info.passed=info.battle&&info.canvases===1&&!info.overflow&&info.reducedMotionStill&&info.closeReturnedHome&&errors.length===0;
   if(!info.passed)process.exitCode=1;
  }
  report.results.push({mobile,...info,errors});console.log(JSON.stringify(report.results.at(-1)));await page.close();
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
