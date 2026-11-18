import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\magical_stairs_qa';
fs.mkdirSync(outDir, { recursive: true });

async function inspectMagicalStairs() {
  console.log('--- STARTING MAGICAL FLOATING STAIRS 5-VIEW INSPECTION ---');
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

  // -------------------------------------------------------------------------
  // VIEW 1: Hero's Home with NO giant solid staircase
  // -------------------------------------------------------------------------
  console.log('Capturing View 1: Hero Home with no solid staircase...');
  await page.screenshot({ path: path.join(outDir, '01_hero_home_no_solid_staircase.png') });
  console.log('Saved 01_hero_home_no_solid_staircase.png');

  // Trigger START ADVENTURE
  console.log('Clicking START ADVENTURE button...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();
  await new Promise(r => setTimeout(r, 400));

  // -------------------------------------------------------------------------
  // VIEW 2: First floating step appearing
  // -------------------------------------------------------------------------
  console.log('Setting up View 2: First floating step appearing...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.055;
    window.__FORCE_CAM_POSE__ = {
      pos: [13.0, 5.0, 9.5],
      target: [6.2, 0.7, 2.2]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '02_first_floating_step_appearing.png') });
  console.log('Saved 02_first_floating_step_appearing.png');

  // -------------------------------------------------------------------------
  // VIEW 3: Several transparent steps forming one after another
  // -------------------------------------------------------------------------
  console.log('Setting up View 3: Several transparent steps forming sequentially...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.18;
    window.__FORCE_CAM_POSE__ = {
      pos: [13.5, 6.8, 8.5],
      target: [6.5, 3.8, 0.5]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '03_several_transparent_steps_forming.png') });
  console.log('Saved 03_several_transparent_steps_forming.png');

  // -------------------------------------------------------------------------
  // VIEW 4: Completed floating staircase connecting the two separate islands
  // -------------------------------------------------------------------------
  console.log('Setting up View 4: Completed floating staircase connecting two separate islands...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.52;
    window.__FORCE_CAM_POSE__ = {
      pos: [34.0, 0.5, 22.0],
      target: [0.0, 0.0, 0.0]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '04_completed_floating_staircase_connecting_islands.png') });
  console.log('Saved 04_completed_floating_staircase_connecting_islands.png');

  // -------------------------------------------------------------------------
  // VIEW 5: Grand Mage's Archive arrival view
  // -------------------------------------------------------------------------
  console.log('Setting up View 5: Grand Mages Archive arrival view...');
  await page.evaluate(() => {
    delete window.__FORCE_TRANSITION_PROGRESS__;
    delete window.__FORCE_CAM_POSE__;
  });
  // Wait for natural completion into ARCHIVE_WORLD
  await new Promise(r => setTimeout(r, 6500));
  await page.screenshot({ path: path.join(outDir, '05_archive_arrival_view.png') });
  console.log('Saved 05_archive_arrival_view.png');

  // -------------------------------------------------------------------------
  // MOBILE BONUS: Mobile view of the floating staircase in vertical aspect ratio
  // -------------------------------------------------------------------------
  console.log('\n--- CAPTURING MOBILE VIEW (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const mobileStartBtn = await mobilePage.waitForSelector('button[aria-label="Start Adventure"]');
  await mobileStartBtn.click();
  await new Promise(r => setTimeout(r, 400));

  await mobilePage.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.55;
    window.__FORCE_CAM_POSE__ = {
      pos: [18.0, 5.0, 14.0],
      target: [0.0, 1.5, 0.0]
    };
  });
  await new Promise(r => setTimeout(r, 800));
  await mobilePage.screenshot({ path: path.join(outDir, '06_mobile_floating_stairs_in_sky.png') });
  console.log('Saved 06_mobile_floating_stairs_in_sky.png');

  await browser.close();
  console.log('--- ALL 5 REQUIRED VIEWS + MOBILE CAPTURED SUCCESSFULLY ---');
}

inspectMagicalStairs().catch(err => {
  console.error('INSPECTION FAILED:', err);
  process.exit(1);
});
