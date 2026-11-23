import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\typography_qa';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function testTypography() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2200));

  // Inspect font sizes, heights, lineHeights, and bounding boxes
  const metrics = await page.evaluate(() => {
    const prinson = document.querySelector('[data-testid="prinson-text"]');
    const royal = document.querySelector('[data-testid="royal-text"]');
    const pSpan = prinson?.querySelector('span');
    const rSpan = royal?.querySelector('span');
    return {
      window: { width: window.innerWidth, height: window.innerHeight },
      prinsonContainer: prinson?.getBoundingClientRect(),
      royalContainer: royal?.getBoundingClientRect(),
      pSpanRect: pSpan?.getBoundingClientRect(),
      rSpanRect: rSpan?.getBoundingClientRect(),
      pSpanComputed: pSpan ? {
        fontSize: window.getComputedStyle(pSpan).fontSize,
        lineHeight: window.getComputedStyle(pSpan).lineHeight,
      } : null,
      rSpanComputed: rSpan ? {
        fontSize: window.getComputedStyle(rSpan).fontSize,
        lineHeight: window.getComputedStyle(rSpan).lineHeight,
      } : null,
    };
  });
  console.log('Typography metrics:', JSON.stringify(metrics, null, 2));

  // Capture desktop screenshot
  await page.screenshot({ path: path.join(outDir, '01_desktop_home_typography.png') });
  console.log('Captured 01_desktop_home_typography.png');

  // Mobile screenshot
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '02_mobile_home_typography.png') });
  console.log('Captured 02_mobile_home_typography.png');

  await browser.close();
  console.log('Done typography QA!');
}

testTypography().catch(err => {
  console.error('Typography QA Error:', err);
  process.exit(1);
});

