import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\book_click_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING BUBBLE RELEASE, SELF-POP, AND 6 REVEALED BOOKS ---');
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

  // 2. Click a grimoire book on the island (Grimoire at x: 680, y: 450)
  console.log('Clicking book on canvas...');
  await page.mouse.click(680, 450);

  // 1. Normal black bubble forming over model (350ms)
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(outDir, '02_normal_bubble_forming.png') });
  console.log('Captured 02_normal_bubble_forming.png');

  // 2. Bubble fully sealed, 3D model disappeared inside (500ms more -> 850ms)
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_bubble_sealed_model_disappeared.png') });
  console.log('Captured 03_bubble_sealed_model_disappeared.png');

  // 3. Main bubble shrinking while releasing small bubbles (850ms more -> 1700ms)
  await new Promise(r => setTimeout(r, 850));
  await page.screenshot({ path: path.join(outDir, '04_bubble_releasing_and_shrinking.png') });
  console.log('Captured 04_bubble_releasing_and_shrinking.png');

  // 4. Main bubble fully shrunk away, 6 bubbles floating in hexagonal ring (950ms more -> 2650ms)
  await new Promise(r => setTimeout(r, 950));
  await page.screenshot({ path: path.join(outDir, '05_bubbles_floating_in_ring.png') });
  console.log('Captured 05_bubbles_floating_in_ring.png');

  // 5. Bubbles self-popping mid-cascade with sparkling bursts (500ms more -> 3150ms)
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '06_bubbles_popping_mid_cascade.png') });
  console.log('Captured 06_bubbles_popping_mid_cascade.png');

  // 6. All 6 bubbles popped, revealing all 6 3D grimoire books floating with glowing rune rings! (1300ms more -> 4450ms)
  await new Promise(r => setTimeout(r, 1300));
  await page.screenshot({ path: path.join(outDir, '07_all_6_books_revealed_and_floating.png') });
  console.log('Captured 07_all_6_books_revealed_and_floating.png');

  // 7. Dismiss (Escape key) -> Returns back to normal island
  console.log('Dismissing via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '08_restored_back_to_island.png') });
  console.log('Captured 08_restored_back_to_island.png');

  console.log('QA Bubble Pop and 6 Revealed Books test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
