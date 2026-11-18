import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function runQA() {
  console.log('Launching Chrome for QA...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait 4 seconds for 3D assets to load and render
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(outDir, '01_home_desktop.png') });
  console.log('Saved 01_home_desktop.png');

  await browser.close();
  console.log('Browser closed.');
}

runQA().catch(e => {
  console.error('QA Error:', e);
  process.exit(1);
});

