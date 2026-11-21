import puppeteer from 'puppeteer-core';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\bubble_pop_qa';

async function testAll() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // 1. Load Products (Workshop) directly
  console.log('Navigating to Products (Workshop)...');
  await page.goto('http://127.0.0.1:5175/products', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '05_products_workshop_revealed.png') });

  // 2. Click About Me (Forest)
  console.log('Navigating to About Me (Forest)...');
  await page.evaluate(() => {
    const link = document.querySelector('a[href="/about"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(outDir, '06_about_forest_revealed.png') });

  console.log('All destinations verified!');
  await browser.close();
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});
