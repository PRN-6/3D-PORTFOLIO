import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\flower_garden_inspect_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- INSPECTING FLOWER GARDEN 3D MODEL ON /about ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else {
      consoleLogs.push(msg.text());
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('Navigating directly to http://127.0.0.1:5175/about ...');
  await page.goto('http://127.0.0.1:5175/about', { waitUntil: 'networkidle0' });
  
  // Wait for preloader & transition settle
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '01_about_desktop_light.png') });
  console.log('Captured 01_about_desktop_light.png');

  // Toggle theme to dark mode
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent?.includes('light') || b.textContent?.includes('dark'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_about_desktop_dark.png') });
  console.log('Captured 02_about_desktop_dark.png');

  // Mobile viewport test (390x844)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_about_mobile.png') });
  console.log('Captured 03_about_mobile.png');

  console.log('\n--- Console Errors (' + consoleErrors.length + ') ---');
  consoleErrors.forEach(err => console.log('ERROR:', err));

  console.log('\n--- Filtered Console Logs ---');
  consoleLogs.filter(l => l.includes('Garden') || l.includes('Model') || l.includes('Loading') || l.includes('Ready') || l.includes('THREE')).slice(0, 20).forEach(l => console.log('LOG:', l));

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);

