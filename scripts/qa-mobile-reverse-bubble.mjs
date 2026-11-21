import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\mobile_reverse_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING MOBILE REVERSE BUBBLE SEQUENCE (390x844) ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  // 1. Click book on mobile to trigger forward sequence
  console.log('Clicking book on mobile canvas...');
  await page.mouse.click(186, 481);
  await new Promise(r => setTimeout(r, 4200));
  await page.screenshot({ path: path.join(outDir, '01_mobile_books_revealed.png') });

  // 2. Click close X button on mobile
  console.log('Clicking close X button to trigger reverse return...');
  await page.keyboard.press('Escape');

  // R1: 6 books shrink, 6 bubbles reform on mobile
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, '02_mobile_reverse_bubbles_reformed.png') });

  // R2: bubbles flying inward towards center
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(outDir, '03_mobile_reverse_bubbles_merging.png') });

  // R3: main bubble tearing open / revealing island
  await new Promise(r => setTimeout(r, 1100));
  await page.screenshot({ path: path.join(outDir, '04_mobile_restored.png') });

  console.log('Mobile reverse test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('Mobile QA error:', err);
  process.exit(1);
});
