import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 401, height: 843, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Project Showcase'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 4500));
  
  const cubeDetails = await page.evaluate(() => {
    const debug = window.__THREE_DEBUG__;
    if (!debug) return { error: 'No __THREE_DEBUG__' };
    const { scene, camera, size } = debug;

    const showcaseGroup = scene.getObjectByName('CubeShowcaseGroup');

    const cubes = [];
    if (showcaseGroup) {
      for (let i = 0; i < showcaseGroup.children.length; i++) {
        const child = showcaseGroup.children[i];
        cubes.push({
          index: i,
          position: [
            parseFloat(child.position.x.toFixed(2)),
            parseFloat(child.position.y.toFixed(2)),
            parseFloat(child.position.z.toFixed(2))
          ],
          scale: [
            parseFloat(child.scale.x.toFixed(2)),
            parseFloat(child.scale.y.toFixed(2)),
            parseFloat(child.scale.z.toFixed(2))
          ],
        });
      }
    }

    return {
      size,
      cameraPos: [
        parseFloat(camera.position.x.toFixed(2)),
        parseFloat(camera.position.y.toFixed(2)),
        parseFloat(camera.position.z.toFixed(2))
      ],
      cameraFov: camera.fov,
      cubes
    };
  });

  console.log(JSON.stringify(cubeDetails, null, 2));
  await browser.close();
})();
