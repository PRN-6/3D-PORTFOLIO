import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\assembly_cinematic_qa';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testWorkshopAndArchive() {
  console.log('--- TESTING WORKSHOP & ARCHIVE 3D SPLINE RAILS & RESTING STATE ---');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2500);

    // 1. Click "products" navigation link to transition to Workshop Island
    console.log('Navigating to Products (Workshop Island)...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const target = links.find(el => el.textContent && el.textContent.toLowerCase().includes('products'));
      if (target) target.click();
    });

    // Wait for transition to complete
    await sleep(4500);

    // Capture resting assembled Workshop Island
    await page.screenshot({ path: path.join(outDir, '07_workshop_assembled_dark.png') });
    console.log('📸 07_workshop_assembled_dark.png captured');

    // Scrub Workshop to 40% mid-flight
    await page.evaluate(() => {
      if (window.__ASSEMBLY_ENGINE__) {
        window.__ASSEMBLY_ENGINE__.scrub(0.40);
      }
    });
    await sleep(600);
    await page.screenshot({ path: path.join(outDir, '08_workshop_mid_flight_40_dark.png') });
    console.log('📸 08_workshop_mid_flight_40_dark.png captured');

    // Restore Workshop to 100%
    await page.evaluate(() => {
      if (window.__ASSEMBLY_ENGINE__) {
        window.__ASSEMBLY_ENGINE__.scrub(1.0);
      }
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '09_workshop_restored_100_dark.png') });
    console.log('📸 09_workshop_restored_100_dark.png captured');

    console.log('✨ Workshop tests complete!');
  } finally {
    await browser.close();
  }
}

testWorkshopAndArchive().catch(console.error);
