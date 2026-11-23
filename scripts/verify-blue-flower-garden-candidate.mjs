import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out=path.resolve('artifacts/blue-flower-garden/previews');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={generatedAt:new Date().toISOString(),browser:await browser.version(),errors:[],views:[]};
try{
  const page=await browser.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto((process.env.GARDEN_PREVIEW_URL||'http://127.0.0.1:5188/artifacts/blue-flower-garden/preview.html'),{waitUntil:'networkidle0',timeout:60000});
  await page.waitForFunction(()=>window.__GARDEN_READY__,{timeout:60000});
  report.validation=await page.evaluate(async()=>{
    const g=window.__GARDEN__,checks=[];g.pause();
    const snapshots=[];
    for(const t of [0,1.5,3,5.999,6,12]){
      g.runtime.setTime(t);
      const nodes=[];g.scene.traverse(o=>{if(o.isBone)nodes.push({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray()});});
      snapshots.push({t,nodes});
      checks.push(nodes.every(n=>[...n.p,...n.q,...n.s].every(Number.isFinite)));
    }
    g.runtime.setTime(2.5);
    let primitives=0,triangles=0,vertices=0,finite=true,weights=true;
    g.scene.traverse(o=>{if(!o.isMesh)return;primitives++;const geo=o.geometry;triangles+=(geo.index?.count||geo.attributes.position.count)/3;vertices+=geo.attributes.position.count;for(const n of geo.attributes.position.array)if(!Number.isFinite(n))finite=false;const w=geo.attributes.skinWeight;for(let k=0;k<w.count;k++)if(Math.abs(w.getX(k)+w.getY(k)+w.getZ(k)+w.getW(k)-1)>.001)weights=false;});
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const initialStats=g.stats();
    const gl=g.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return{primitives,triangles,vertices,finite,weights,animationPosesFinite:checks.every(Boolean),stats:initialStats,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,poses:snapshots};
  });
  for(const [name,width,height,view] of [['overview',1440,1000,'overview'],['detail',1440,1000,'detail'],['underside',1440,1000,'underside'],['mobile',390,844,'overview']]){
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.evaluate(v=>{window.__GARDEN__.view(v);window.__GARDEN__.runtime.setTime(2.5);},view);
    await new Promise(r=>setTimeout(r,400));
    const stats=await page.evaluate(()=>window.__GARDEN__.stats());
    await page.screenshot({path:path.join(out,name+'.png')});report.views.push({name,width,height,stats});
  }
  report.passed=report.errors.length===0&&report.validation.primitives===8&&report.validation.triangles>=75000&&report.validation.triangles<=110000&&report.validation.finite&&report.validation.weights&&report.validation.animationPosesFinite&&report.views.every(v=>v.stats.calls<=8);
  report.frameSample=await page.evaluate(async()=>{
    const g=window.__GARDEN__;g.pause(false);const intervals=[];let last=performance.now();const start=last;
    await new Promise(resolve=>{function sample(t){intervals.push(t-last);last=t;if(t-start<5000)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});
    intervals.shift();intervals.sort((a,b)=>a-b);g.pause();
    return{viewport:'390x844 on desktop GPU, not physical phone',durationMs:5000,p50Ms:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)],maxMs:intervals.at(-1)};
  });
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,validation:{...report.validation,poses:'saved in verification.json'}},null,2));
  if(!report.passed)process.exitCode=1;
}finally{await browser.close();}
