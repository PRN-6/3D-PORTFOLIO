import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/voxel_entrance_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== VERIFYING VOXEL / BLOCK-BUILD CONSTRUCTION ENTRANCE ANIMATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  try {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // =========================================================================
    // TEST 1: HOME ISLAND ENTRANCE ANIMATION (http://localhost:5173/)
    // =========================================================================
    console.log('1. Loading Home page http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });

    // Stage A: Initial Empty State (t = 0.25s)
    await new Promise((r) => setTimeout(r, 250));
    const stateA = await page.evaluate(() => (window).__VOXEL_ENTRANCE_STATE__);
    console.log('Stage A (Empty State):', stateA);
    await page.screenshot({ path: path.join(artifactDir, '01_home_stage_a_empty_typography.png') });
    console.log('✓ Captured 01_home_stage_a_empty_typography.png');

    // Stage B: Voxel Spawn Flight (t = 0.95s)
    await new Promise((r) => setTimeout(r, 700));
    const stateB = await page.evaluate(() => (window).__VOXEL_ENTRANCE_STATE__);
    console.log('Stage B (Voxel Spawn):', stateB);
    await page.screenshot({ path: path.join(artifactDir, '02_home_stage_b_voxel_cubes_flying_in.png') });
    console.log('✓ Captured 02_home_stage_b_voxel_cubes_flying_in.png');

    // Stage C: Handover Phase (t = 1.65s)
    await new Promise((r) => setTimeout(r, 700));
    const stateC = await page.evaluate(() => (window).__VOXEL_ENTRANCE_STATE__);
    console.log('Stage C (Handover Phase):', stateC);
    await page.screenshot({ path: path.join(artifactDir, '03_home_stage_c_handover_to_real_island.png') });
    console.log('✓ Captured 03_home_stage_c_handover_to_real_island.png');

    // Stage D: Completed State (t = 2.4s)
    await new Promise((r) => setTimeout(r, 750));
    const stateD = await page.evaluate(() => ({
      state: (window).__VOXEL_ENTRANCE_STATE__,
      isComplete: (window).__VOXEL_ENTRANCE_COMPLETE__,
    }));
    console.log('Stage D (Complete):', stateD);
    await page.screenshot({ path: path.join(artifactDir, '04_home_stage_d_construction_complete.png') });
    console.log('✓ Captured 04_home_stage_d_construction_complete.png');

    // =========================================================================
    // TEST 2: LEVEL 05 BLUE FLOWER GARDEN ENTRANCE (/about)
    // =========================================================================
    console.log('\n2. Testing Level 05 Blue Flower Garden entrance on /about ...');
    await page.goto('http://localhost:5173/about', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });

    // Mid-construction on /about (t = 1.1s)
    await new Promise((r) => setTimeout(r, 1100));
    const aboutStateMid = await page.evaluate(() => (window).__VOXEL_ENTRANCE_STATE__);
    console.log('About Me mid-construction state:', aboutStateMid);
    await page.screenshot({ path: path.join(artifactDir, '05_about_garden_voxel_construction.png') });
    console.log('✓ Captured 05_about_garden_voxel_construction.png');

    // Completed on /about (t = 2.5s)
    await new Promise((r) => setTimeout(r, 1400));
    const aboutStateFinal = await page.evaluate(() => ({
      state: (window).__VOXEL_ENTRANCE_STATE__,
      isComplete: (window).__VOXEL_ENTRANCE_COMPLETE__,
    }));
    console.log('About Me final state:', aboutStateFinal);
    await page.screenshot({ path: path.join(artifactDir, '06_about_garden_settled_real_island.png') });
    console.log('✓ Captured 06_about_garden_settled_real_island.png');

    // =========================================================================
    // TEST 3: VERIFY ROUTE TRANSITIONS WORK CLEANLY AFTER VOXEL ENTRANCE
    // =========================================================================
    console.log('\n3. Verifying route transition back to Home works normally...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactDir, '07_home_after_navigation_transition.png') });
    console.log('✓ Captured 07_home_after_navigation_transition.png');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n--- Console Errors Audit ---');
  console.log('Total errors:', consoleErrors.length);
  if (consoleErrors.length === 0) {
    console.log('🌟 ZERO CONSOLE ERRORS! 🌟');
  } else {
    console.log('Errors:', consoleErrors);
  }
}

run();
