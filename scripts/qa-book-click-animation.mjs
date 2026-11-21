import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\book_click_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING STAGED BOOK CLICK ANIMATION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Navigate to Archive island (/projects)
  console.log('Navigating to http://127.0.0.1:5175/projects ...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  await page.screenshot({ path: path.join(outDir, '01_island_default.png') });
  console.log('Captured 01_island_default.png');

  // 2. Click a grimoire book on the island (Grimoire 5 at x: 680, y: 450)
  console.log('Clicking book on canvas...');
  await page.mouse.click(680, 450);

  // 3D model ascending up out of the screen!
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, '02_island_ascending_up.png') });
  console.log('Captured 02_island_ascending_up.png');

  // Passing through the top edge
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(outDir, '03_island_near_top_exit.png') });
  console.log('Captured 03_island_near_top_exit.png');

  // Fully cleared out of the screen
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(outDir, '04_island_fully_cleared_sky.png') });
  console.log('Captured 04_island_fully_cleared_sky.png');

  // 3. Dismiss modal (Escape key) -> Brings 3D model back down!
  console.log('Closing modal via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1400));

  await page.screenshot({ path: path.join(outDir, '05_island_restored_down.png') });
  console.log('Captured 05_island_restored_down.png');

  console.log('Staged QA Book Click test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
