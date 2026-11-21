import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\scratch\\spot_creation_qa';
fs.mkdirSync(outDir, { recursive: true });

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

  const steps = [
    { p: '0.00', name: '01_nothing_there_p00.png' },
    { p: '0.18', name: '02_bedrock_and_frame_p18.png' },
    { p: '0.42', name: '03_spot_sticks_emerging_p42.png' },
    { p: '0.70', name: '04_blooming_into_shapes_p70.png' },
    { p: '1.00', name: '05_fully_created_model_p100.png' }
  ];

  for (const step of steps) {
    await page.evaluate((val) => {
      const scrubber = document.getElementById('scrubber');
      scrubber.value = val;
      scrubber.dispatchEvent(new Event('input'));
    }, step.p);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, step.name) });
    console.log(`Captured ${step.name}`);
  }

  await browser.close();
  console.log('Spot creation QA complete!');
}

run().catch(console.error);
