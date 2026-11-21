import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\about_page_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING ABOUT PAGE FIXES ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Initial Home Page
  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '01_home_page.png') });
  console.log('Captured 01_home_page.png');

  // 2. Click About Me link to trigger bubble transition to About Page
  console.log('Clicking a[href="/about"] link...');
  await page.evaluate(() => {
    const link = document.querySelector('a[href="/about"]');
    if (link) link.click();
  });

  // Wait for bubble transition to complete (1.8s)
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(outDir, '02_about_page_revealed.png') });
  console.log('Captured 02_about_page_revealed.png');

  // Verify that Blue Flower Garden bar is NOT in the DOM
  const hasGardenBar = await page.evaluate(() => {
    return !!Array.from(document.querySelectorAll('*')).find(
      el => el.textContent && el.textContent.includes('Blue Flower Garden:')
    );
  });
  console.log('Has Blue Flower Garden bottom bar:', hasGardenBar);

  // 3. Toggle Light Mode on About Page
  console.log('Toggling light mode on About page...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent?.includes('light') || b.textContent?.includes('dark'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_about_page_light_mode.png') });
  console.log('Captured 03_about_page_light_mode.png');

  console.log('About page QA complete!');
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

