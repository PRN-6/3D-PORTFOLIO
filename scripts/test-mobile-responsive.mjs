import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/destination_transition_qa';

async function testMobile() {
  console.log('=== MOBILE RESPONSIVENESS QA TEST ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(artifactDir, '07_mobile_starting_screen.png') });
  console.log('Captured: 07_mobile_starting_screen.png');

  // Verify no horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile horizontal overflow detected:', hasOverflow);

  // Click Blue Flower Garden to check modal on mobile
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Blue Flower Garden')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(artifactDir, '08_mobile_garden_modal.png') });
  console.log('Captured: 08_mobile_garden_modal.png');

  await browser.close();
  console.log('Mobile QA test completed successfully.');
}

testMobile().catch(console.error);

