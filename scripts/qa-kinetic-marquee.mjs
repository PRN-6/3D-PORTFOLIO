import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\marquee_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING KINETIC MARQUEE TRAVEL LOOP TYPOGRAPHY ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Initial State (t = 0s)
  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '01_marquee_initial.png') });
  console.log('Captured 01_marquee_initial.png');

  // 2. Capture at t = 1.8s to visually prove traveling motion
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(outDir, '02_marquee_after_1800ms.png') });
  console.log('Captured 02_marquee_after_1800ms.png');

  // 3. Switch to Light Mode and capture
  console.log('Toggling light mode...');
  await page.evaluate(() => {
    // Look for theme toggle button (contains sun or moon or 'light' / 'dark')
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent?.includes('light') || b.textContent?.includes('dark'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_marquee_light_mode.png') });
  console.log('Captured 03_marquee_light_mode.png');

  console.log('Marquee QA complete!');
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
