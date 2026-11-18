import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Desktop Transition Test
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click START ADVENTURE
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  console.log('Clicked START ADVENTURE');

  // Wait for transition duration (5.5s + settle)
  await new Promise(r => setTimeout(r, 7000));

  await page.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/scratch/archive_current_settled_desktop.png' });
  console.log('Saved archive desktop settled screenshot');

  // Also query camera pose
  const camInfo = await page.evaluate(() => {
    const debug = window.__THREE_STATS__;
    const canvas = document.querySelector('canvas');
    return {
      stats: debug,
    };
  });
  console.log('Stats:', camInfo);

  // 2. Mobile Transition Test
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 401, height: 843, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await mobilePage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 7000));

  await mobilePage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/scratch/archive_current_settled_mobile.png' });
  console.log('Saved archive mobile settled screenshot');

  await browser.close();
})();
