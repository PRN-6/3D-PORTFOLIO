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

  await page.screenshot({ path: path.join(outDir, '01_archive_island_initial.png') });
  console.log('Captured 01_archive_island_initial.png');

  // 2. Click a grimoire book on the island (Grimoire 5 at x: 680, y: 450)
  console.log('Clicking book on canvas...');
  await page.mouse.click(680, 450);

  // 1. Black liquid bubble forms and wraps over model (250ms)
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, '02_bubble_forming_over_model.png') });
  console.log('Captured 02_bubble_forming_over_model.png');

  // 2. Sealed bubble sinks down, camera follows it down, marquee fades out (800ms)
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(outDir, '03_bubble_descending_with_camera.png') });
  console.log('Captured 03_bubble_descending_with_camera.png');

  // 3. Bubble tears open at bottom page (800ms)
  await new Promise(r => setTimeout(r, 850));
  await page.screenshot({ path: path.join(outDir, '04_bubble_tearing_at_new_page.png') });
  console.log('Captured 04_bubble_tearing_at_new_page.png');

  // 4. Arrived at new page: floating books on clean black background (600ms)
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '05_new_page_clean_background.png') });
  console.log('Captured 05_new_page_clean_background.png');

  // 5. Dismiss modal (Escape key) -> Returns camera and island back up!
  console.log('Closing modal via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, '06_restored_back_to_island.png') });
  console.log('Captured 06_restored_back_to_island.png');

  console.log('Staged QA Book Click test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
