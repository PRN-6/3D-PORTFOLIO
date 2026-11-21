import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\reverse_bubble_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING FULL REVERSE BUBBLE ANIMATION SEQUENCE ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Navigate to Archive island (/projects)
  console.log('1. Navigating to http://127.0.0.1:5175/projects ...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  await page.screenshot({ path: path.join(outDir, '01_initial_island.png') });
  console.log('Captured 01_initial_island.png');

  // 2. Click a grimoire book on the island (Grimoire at x: 680, y: 450)
  console.log('2. Clicking book on canvas to trigger forward bubble sequence...');
  await page.mouse.click(680, 450);

  // Wait for forward sequence to complete:
  // forming (0.7s) + sealed (0.2s) + release (1.6s) + pop cascade (1.2s) = ~3.7s
  await new Promise(r => setTimeout(r, 4200));
  await page.screenshot({ path: path.join(outDir, '02_books_revealed_and_floating.png') });
  console.log('Captured 02_books_revealed_and_floating.png');

  // 3. TRIGGER REVERSE RETURN: Press Escape (or click close X)
  console.log('3. Triggering reverse return (Escape key)...');
  await page.keyboard.press('Escape');

  // R1: Books shrink back down into the 6 bubbles (at ~250ms)
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, '03_reverse_books_reforming_into_6_bubbles.png') });
  console.log('Captured 03_reverse_books_reforming_into_6_bubbles.png');

  // R2: 6 bubbles flying back towards center while main center bubble grows (at ~900ms)
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(outDir, '04_reverse_bubbles_flying_inward_main_growing.png') });
  console.log('Captured 04_reverse_bubbles_flying_inward_main_growing.png');

  // R3: All 6 bubbles merged, main bubble fully sealed at scale 1.0 (at ~1600ms)
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(outDir, '05_reverse_main_bubble_sealed.png') });
  console.log('Captured 05_reverse_main_bubble_sealed.png');

  // R4: Main bubble tearing open from bottom-right, revealing island model (at ~2000ms)
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '06_reverse_main_bubble_tearing_open.png') });
  console.log('Captured 06_reverse_main_bubble_tearing_open.png');

  // R5: Clean restoration back to Archive Island model (at ~2800ms)
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '07_restored_back_to_archive_island.png') });
  console.log('Captured 07_restored_back_to_archive_island.png');

  console.log('Reverse Bubble Animation QA test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
