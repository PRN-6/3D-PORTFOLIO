import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\book_click_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING BOOK CLICK ANIMATION (CAM DOWN, MODEL UP, BOOKS FLOATING) ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Navigate to Archive island (/projects)
  console.log('Navigating to http://127.0.0.1:5175/projects ...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  await page.screenshot({ path: path.join(outDir, '01_archive_before_click.png') });
  console.log('Captured 01_archive_before_click.png');

  // 2. Click a grimoire book on the island.
  // We can raycast by clicking the canvas near the front pedestal arc:
  console.log('Attempting to click book on canvas...');
  // Let's click at the front-left pedestal (approx x: 535, y: 445 in 1280x720)
  // And let's also try multiple points along the grimoire arc
  const clickCoords = [
    { x: 390, y: 460 }, // Front-left grimoire
    { x: 440, y: 470 }, // Left grimoire 2
    { x: 500, y: 480 }, // Left-center grimoire 3
    { x: 680, y: 450 }, // Right grimoire 5
  ];

  let modalOpened = false;
  for (const pt of clickCoords) {
    console.log(`Clicking at (${pt.x}, ${pt.y})...`);
    await page.mouse.click(pt.x, pt.y);
    await new Promise(r => setTimeout(r, 500));
    modalOpened = await page.evaluate(() => {
      return !!document.querySelector('aside[role="dialog"], [aria-label*="Grimoire"]');
    });
    if (modalOpened) {
      console.log(`Grimoire modal opened after click at (${pt.x}, ${pt.y})!`);
      break;
    }
  }

  // If raycast click didn't hit in headless, let's trigger via three.js scene or test hook if needed
  if (!modalOpened) {
    console.log('Trying fallback click via direct raycast trigger in page...');
    modalOpened = await page.evaluate(() => {
      // Find canvas and dispatch custom pointer events
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      // Raycast across a 5x5 grid in the lower center
      const rect = canvas.getBoundingClientRect();
      for (let dx = -150; dx <= 150; dx += 40) {
        for (let dy = 20; dy <= 120; dy += 25) {
          const evt = new PointerEvent('click', {
            clientX: rect.left + rect.width / 2 + dx,
            clientY: rect.top + rect.height / 2 + dy,
            bubbles: true,
          });
          canvas.dispatchEvent(evt);
        }
      }
      return !!document.querySelector('[aria-label*="Grimoire"]');
    });
  }

  // Allow the dramatic animation to play out (camera descends down, model rises up, books float)
  console.log('Waiting 1500ms for camera down and model up animation...');
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, '02_archive_book_clicked_model_up_cam_down.png') });
  console.log('Captured 02_archive_book_clicked_model_up_cam_down.png');

  // Check modal presence
  const modalInfo = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return {
      hasAside: !!aside,
      title: document.querySelector('aside h2, aside [aria-label]')?.textContent || 'none',
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('aria-label') || b.textContent),
    };
  });
  console.log('Modal status:', modalInfo);

  // 3. Dismiss modal (Close button or Escape)
  console.log('Closing modal via Escape key...');
  await page.keyboard.press('Escape');
  // Wait 1500ms for camera to return up and model to return down
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, '03_archive_book_closed_restored.png') });
  console.log('Captured 03_archive_book_closed_restored.png');

  console.log('QA Book Click test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
