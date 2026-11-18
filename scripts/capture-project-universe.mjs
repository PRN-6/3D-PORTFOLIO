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
  
  // Click project showcase button
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Project Showcase'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Project Showcase:', clicked);

  await new Promise(r => setTimeout(r, 4500));
  
  // Also query scene objects or state
  const info = await page.evaluate(() => {
    return {
      stats: window.__THREE_STATS__,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
  console.log('Page info:', info);

  await page.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/scratch/mobile_project_universe_current.png' });
  console.log('Saved screenshot to scratch/mobile_project_universe_current.png');
  await browser.close();
})();
