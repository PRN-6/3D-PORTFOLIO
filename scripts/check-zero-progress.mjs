import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\scratch\\fluid_stretch_qa';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  
  await page.goto('http://127.0.0.1:5175/papercraft.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Set scrubber progress to 0.00
  await page.evaluate(() => {
    const scrubber = document.getElementById('scrubber');
    scrubber.value = '0.0';
    scrubber.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '00_progress_zero.png') });
  console.log('Captured 00_progress_zero.png');

  await browser.close();
}

run().catch(console.error);
