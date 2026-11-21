import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\mobile_bubble_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING MOBILE BUBBLE ANIMATION (390x844) ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 1. Navigate to Archive island (/projects)
  console.log('Navigating to http://127.0.0.1:5175/projects on mobile...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  await page.screenshot({ path: path.join(outDir, '01_mobile_archive_initial.png') });
  console.log('Captured 01_mobile_archive_initial.png');

  // 2. Click Grimoire 5 on canvas at exact 2D coordinates (x: 186, y: 481)
  console.log('Clicking Grimoire 5 at (186, 481)...');
  await page.mouse.click(186, 481);

  // 1. Mobile bubble forming over model (350ms)
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(outDir, '02_mobile_bubble_forming.png') });
  console.log('Captured 02_mobile_bubble_forming.png');

  // 2. Mobile bubble fully sealed (500ms more -> 850ms)
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_mobile_bubble_sealed.png') });
  console.log('Captured 03_mobile_bubble_sealed.png');

  // 3. Mobile main bubble shrinking while releasing small bubbles (850ms more -> 1700ms)
  await new Promise(r => setTimeout(r, 850));
  await page.screenshot({ path: path.join(outDir, '04_mobile_bubble_releasing_and_shrinking.png') });
  console.log('Captured 04_mobile_bubble_releasing_and_shrinking.png');

  // 4. Mobile small bubbles floating in vertical serpentine cascade (1100ms more -> 2800ms)
  await new Promise(r => setTimeout(r, 1100));
  await page.screenshot({ path: path.join(outDir, '05_mobile_bubbles_floating.png') });
  console.log('Captured 05_mobile_bubbles_floating.png');

  // 5. Dismiss via Escape
  console.log('Tapping Return to Island...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '06_mobile_restored.png') });
  console.log('Captured 06_mobile_restored.png');

  console.log('Mobile QA test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
