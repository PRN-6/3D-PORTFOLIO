import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\scratch\\fluid_stretch_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  
  console.log('Navigating to http://127.0.0.1:5175/papercraft.html...');
  await page.goto('http://127.0.0.1:5175/papercraft.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Set scrubber progress to 0.35 (mid-flight: trees & characters as stretched smooth sticks)
  await page.evaluate(() => {
    const scrubber = document.getElementById('scrubber');
    scrubber.value = '0.35';
    scrubber.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '01_stretched_sticks_p035.png') });
  console.log('Captured 01_stretched_sticks_p035.png');

  // Set scrubber progress to 0.65 (trees forming shape, characters in flight)
  await page.evaluate(() => {
    const scrubber = document.getElementById('scrubber');
    scrubber.value = '0.65';
    scrubber.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '02_forming_shapes_p065.png') });
  console.log('Captured 02_forming_shapes_p065.png');

  // Set scrubber progress to 1.0 (fully formed and assembled)
  await page.evaluate(() => {
    const scrubber = document.getElementById('scrubber');
    scrubber.value = '1.0';
    scrubber.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_fully_formed_frame60.png') });
  console.log('Captured 03_fully_formed_frame60.png');

  await browser.close();
  console.log('QA Screenshots complete!');
}

run().catch(console.error);
