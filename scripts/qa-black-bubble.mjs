import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\black_bubble_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING FULL BLACK SWEEPING BUBBLE TRANSITION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Initial State (Home Island)
  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '01_initial_state.png') });
  console.log('Captured 01_initial_state.png');

  // 2. Click Projects link to trigger Black Bubble Transition
  console.log('Clicking a[href="/projects"] link...');
  await page.evaluate(() => {
    const link = document.querySelector('a[href="/projects"]');
    if (link) link.click();
  });

  // Capture at 380ms: Black Bubble Forming (sweeping across model like reference image)
  await new Promise(r => setTimeout(r, 380));
  await page.screenshot({ path: path.join(outDir, '02_black_bubble_forming_half.png') });
  console.log('Captured 02_black_bubble_forming_half.png');

  // Capture at 760ms (380 + 380): Full Black Bubble Sealed (100% solid black sphere)
  await new Promise(r => setTimeout(r, 380));
  await page.screenshot({ path: path.join(outDir, '03_black_bubble_fully_sealed.png') });
  console.log('Captured 03_black_bubble_fully_sealed.png');

  // Capture at 1010ms (760 + 250): Black Bubble Tearing Open (mid-rupture peeling open)
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, '04_black_bubble_tearing_open.png') });
  console.log('Captured 04_black_bubble_tearing_open.png');

  // Capture at 1600ms (1010 + 590): New Island Fully Revealed and Settled
  await new Promise(r => setTimeout(r, 590));
  await page.screenshot({ path: path.join(outDir, '05_new_island_revealed.png') });
  console.log('Captured 05_new_island_revealed.png');

  console.log('QA run complete!');
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
