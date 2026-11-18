import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Transition to Archive
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 6500));

  const boundsInfo = await page.evaluate(() => {
    const debug = window.__THREE_DEBUG__ || (window.__THREE_SCENE__ ? window.__THREE_SCENE__ : null);
    const canvas = document.querySelector('canvas');
    // We can traverse scene to find ArchiveIsland group
    // In THREE scene:
    let archiveGroup = null;
    const r3f = canvas?.__r3f;
    let scene = null;
    if (r3f) {
      scene = r3f.root.getState().scene;
    }
    
    // If not on canvas, check scene from window if available
    return { hasScene: !!scene };
  });

  console.log('Bounds info:', boundsInfo);
  await browser.close();
})();
