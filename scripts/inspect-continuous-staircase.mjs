import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\staircase_qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspectStaircase() {
  console.log('--- STARTING CONTINUOUS STAIRCASE 4-VIEW INSPECTION ---');
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
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.toString()));

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Initial State before transition
  console.log('Capturing Initial Hero Home State...');
  await page.screenshot({ path: path.join(outDir, '00_hero_home_initial.png') });

  // 2. Trigger START ADVENTURE
  console.log('Triggering START ADVENTURE...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // -------------------------------------------------------------------------
  // VIEW 1: A view of the staircase starting at Hero's Home
  // -------------------------------------------------------------------------
  console.log('Setting up View 1: Staircase starting at Hero Home...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.22;
    window.__FORCE_CAM_POSE__ = {
      pos: [13.0, 9.5, 12.5],
      target: [5.0, 2.5, 1.5]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '01_staircase_starting_at_hero_home.png') });
  console.log('Saved 01_staircase_starting_at_hero_home.png');

  // -------------------------------------------------------------------------
  // VIEW 2: A full view showing the staircase connecting the two destinations
  // -------------------------------------------------------------------------
  console.log('Setting up View 2: Full view connecting the two destinations...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.50;
    window.__FORCE_CAM_POSE__ = {
      pos: [29.0, 1.0, 21.0],
      target: [0.0, 0.0, 0.0]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_staircase_full_connecting_view.png') });
  console.log('Saved 02_staircase_full_connecting_view.png');

  // -------------------------------------------------------------------------
  // VIEW 3: A view of the staircase reaching the Archive
  // -------------------------------------------------------------------------
  console.log('Setting up View 3: Staircase reaching the Archive...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.88;
    window.__FORCE_CAM_POSE__ = {
      pos: [-6.8, 5.2, 11.2],
      target: [-0.5, 1.8, 6.2]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '03_staircase_reaching_archive.png') });
  console.log('Saved 03_staircase_reaching_archive.png');

  // -------------------------------------------------------------------------
  // VIEW 4: A screenshot of the completed transition
  // -------------------------------------------------------------------------
  console.log('Setting up View 4: Completed transition at Archive...');
  await page.evaluate(() => {
    delete window.__FORCE_TRANSITION_PROGRESS__;
    delete window.__FORCE_CAM_POSE__;
  });
  // Wait for natural completion into ARCHIVE_WORLD
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(outDir, '04_completed_transition_archive.png') });
  console.log('Saved 04_completed_transition_archive.png');

  // -------------------------------------------------------------------------
  // MOBILE VIEWPORT VERIFICATION (390x844)
  // -------------------------------------------------------------------------
  console.log('\n--- TESTING MOBILE VIEWPORT (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const mobileStartBtn = await mobilePage.waitForSelector('button[aria-label="Start Adventure"]');
  await mobileStartBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // Set mobile connecting view
  await mobilePage.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.50;
    window.__FORCE_CAM_POSE__ = {
      pos: [18.0, 7.0, 14.0],
      target: [0.0, 3.5, 0.0]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await mobilePage.screenshot({ path: path.join(outDir, '05_mobile_staircase_connecting_view.png') });
  console.log('Saved 05_mobile_staircase_connecting_view.png');

  // Release and settle at Archive
  await mobilePage.evaluate(() => {
    delete window.__FORCE_TRANSITION_PROGRESS__;
    delete window.__FORCE_CAM_POSE__;
  });
  await new Promise(r => setTimeout(r, 6000));
  await mobilePage.screenshot({ path: path.join(outDir, '06_mobile_archive_settled.png') });
  console.log('Saved 06_mobile_archive_settled.png');

  await browser.close();
  console.log('--- ALL 4 REQUIRED VIEWS CAPTURED SUCCESSFULLY ---');
}

inspectStaircase().catch(err => {
  console.error('INSPECTION FAILED:', err);
  process.exit(1);
});
