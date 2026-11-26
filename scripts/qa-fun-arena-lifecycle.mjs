// Exercise interrupted navigation, tab resume, zoom, and the model-load error path.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const out='docs/audit/fun-grand-arena/after/lifecycle.json';
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const report={errors:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5187/fun',{waitUntil:'networkidle0'});
 const ready=()=>page.waitForFunction(()=>!document.querySelector('[data-testid="preloader-overlay"]')&&window.__THREE_SCENE__?.getObjectByName('Demon_ChargingHalo'));
 await ready();
 const position=()=>page.evaluate(()=>window.__THREE_CAMERA__.position.toArray());
 const beforeZoom=await position();await page.mouse.move(700,400);await page.mouse.wheel({deltaY:-400});await wait(400);
 report.zoomWorks=JSON.stringify(beforeZoom)!==JSON.stringify(await position());
 await page.click('[aria-label="Close Fun page"]');await wait(200);await page.goBack();await ready();
 // Same-document history navigation while worlds are still mounting/unmounting.
 for(let i=0;i<5;i++){
  await page.evaluate(()=>history.forward());await wait(90);
  await page.evaluate(()=>history.back());await wait(90);
 }
 await ready();await wait(400);
 report.rapidNavigation=await page.evaluate(()=>location.pathname==='/fun'&&!!document.querySelector('.ring-overlay')&&document.querySelectorAll('canvas').length===1);
 const cdp=await page.createCDPSession();
 await cdp.send('Page.setWebLifecycleState',{state:'frozen'});await wait(1200);
 await cdp.send('Page.setWebLifecycleState',{state:'active'});await wait(400);
 report.tabResume=await page.evaluate(()=>{
  const demon=window.__THREE_SCENE__.getObjectByName('Battle_Demon');
  return [...demon.position.toArray(),...demon.quaternion.toArray()].every(Number.isFinite)&&demon.position.y>=.07&&demon.position.y<=.41;
 });
 await page.close();
 const context=await browser.createBrowserContext(),failed=await context.newPage();
 await failed.setRequestInterception(true);
 failed.on('request',request=>request.url().endsWith('demon-battle-grand-arena.glb')?request.abort():request.continue());
 await failed.goto('http://127.0.0.1:5187/fun',{waitUntil:'networkidle0'});
 await failed.waitForFunction(()=>document.querySelector('.battle-status')?.textContent?.includes('could not load'));
 report.loadFailureMessage=await failed.$eval('.battle-status',el=>el.textContent);
 await failed.keyboard.press('Escape');await wait(400);
 report.loadFailureCloses=await failed.evaluate(()=>location.pathname==='/'&&!document.querySelector('.ring-overlay'));
 await context.close();
 report.passed=report.zoomWorks&&report.rapidNavigation&&report.tabResume&&report.loadFailureCloses&&!report.errors.length;
}catch(error){report.failure=error.stack;report.passed=false;}
finally{await browser.close();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
if(!report.passed)process.exitCode=1;
