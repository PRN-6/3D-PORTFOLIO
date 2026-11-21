import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\scratch\\bubble_pop_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING SOAP BUBBLE POP ISLAND TRANSITION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Load Homepage
  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '01_home_island_initial.png') });
  console.log('Captured 01_home_island_initial.png');

  // 2. Click Projects link to trigger Bubble Pop Transition
  console.log('Clicking a[href="/projects"] link...');
  const clicked = await page.evaluate(() => {
    const link = document.querySelector('a[href="/projects"]');
    if (link) {
      link.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Projects link:', clicked);

  // Capture at 220ms (Bubble Enclosing the Island)
  await new Promise(r => setTimeout(r, 220));
  await page.screenshot({ path: path.join(outDir, '02_bubble_enclosing_island.png') });
  console.log('Captured 02_bubble_enclosing_island.png');

  // Capture at 520ms (Bubble Popped / Sparkling Particle Burst)
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, '03_bubble_popped_burst.png') });
  console.log('Captured 03_bubble_popped_burst.png');

  // Capture at 1200ms (New Island Fully Revealed & Settled)
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(outDir, '04_new_island_revealed.png') });
  console.log('Captured 04_new_island_revealed.png');

  await browser.close();
  console.log('Bubble Pop QA complete!');
}

run().catch(console.error);
