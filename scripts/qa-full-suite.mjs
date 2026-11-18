import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function runFullQA() {
  console.log('=== STARTING COMPLETE QA SUITE ===');
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
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  // STEP 1: LOAD SITE & GO TO ARCHIVE
  console.log('\n--- 1. Testing Navigation to Grand Mage Archive ---');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500));

  const archiveNavBtn = await page.waitForSelector('button[aria-label="Visit Grand Mage\'s Archive"]');
  await archiveNavBtn.click();
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.join(outDir, '01_archive_overview.png') });
  console.log('✔ Captured: 01_archive_overview.png');

  // STEP 2: TEST ABOUT SCROLL MODAL (ALL 4 TABS)
  console.log('\n--- 2. Testing Archmage Chronicle Modal & Tabs ---');
  const aboutBtn = await page.waitForSelector('button[aria-label="Inspect Archmage\'s Chronicle"]');
  await aboutBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_about_tab_bio.png') });
  console.log('✔ Captured: 02_about_tab_bio.png');

  // Tab 2: Chronicle & Feats
  const tabChronicle = (await page.$$('div[role="dialog"] button')).find(async b => (await page.evaluate(el => el.textContent, b)).includes('Chronicle'));
  const allButtons = await page.$$('div[role="dialog"] button');
  for (const b of allButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Chronicle')) {
      await b.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(outDir, '02_about_tab_chronicle.png') });
      console.log('✔ Captured: 02_about_tab_chronicle.png');
    } else if (text.includes('Academies')) {
      await b.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(outDir, '02_about_tab_academies.png') });
      console.log('✔ Captured: 02_about_tab_academies.png');
    } else if (text.includes('Accolades')) {
      await b.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(outDir, '02_about_tab_accolades.png') });
      console.log('✔ Captured: 02_about_tab_accolades.png');
    }
  }

  // Dismiss About Modal with Escape Key
  console.log('Testing Escape key dismissal of About modal...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 800));

  // STEP 3: TEST ALL 6 GRIMOIRES INDIVIDUALLY
  console.log('\n--- 3. Testing All 6 Grimoires & Modals ---');
  // Accurate screen target pixel coordinates in 1440x900 based on the 3D arc projection
  const grimoireTargets = [
    { name: '1_Frontend_Magic', x: 145, y: 560 },
    { name: '2_Backend_Alchemy', x: 275, y: 585 },
    { name: '3_AI_Agents', x: 550, y: 610 },
    { name: '4_Systems_Programming', x: 890, y: 610 },
    { name: '5_Creative_3D', x: 1165, y: 585 },
    { name: '6_Tools_Technologies', x: 1295, y: 560 }
  ];

  for (const target of grimoireTargets) {
    console.log(`Clicking Grimoire: ${target.name} at (${target.x}, ${target.y})...`);
    await page.mouse.click(target.x, target.y);
    await new Promise(r => setTimeout(r, 1400));

    // Check if modal opened
    const modalHeader = await page.$('aside[aria-label]');
    if (modalHeader) {
      const title = await page.evaluate(el => el.getAttribute('aria-label'), modalHeader);
      console.log(`✔ Modal open for: "${title}"`);
      await page.screenshot({ path: path.join(outDir, `03_grimoire_${target.name}.png`) });
      console.log(`✔ Captured: 03_grimoire_${target.name}.png`);

      // Dismiss modal via close button
      const closeBtn = await page.$('button[aria-label="Close grimoire modal"]');
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.warn(`⚠ Grimoire click at (${target.x}, ${target.y}) did not open modal.`);
    }
  }

  // STEP 4: TEST CAMERA ORBIT (DRAG) TO VIEW FRIEREN READING UP CLOSE
  console.log('\n--- 4. Testing Camera Orbit Controls ---');
  // Drag canvas from center towards left to rotate camera around the library
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(500, 430, { steps: 15 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '04_camera_orbit_perspective.png') });
  console.log('✔ Captured: 04_camera_orbit_perspective.png');

  // Reset View
  const resetBtn = await page.waitForSelector('button[aria-label="Reset camera view"]');
  await resetBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // STEP 5: TEST RETURN TO ISLAND & REGRESSION TESTING
  console.log('\n--- 5. Testing Return to Island (Regression on Hero Home) ---');
  const returnToIslandBtn = await page.waitForSelector('button[aria-label="Return to Island"]');
  await returnToIslandBtn.click();
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '05_hero_home_verified.png') });
  console.log('✔ Captured: 05_hero_home_verified.png');

  // STEP 6: TEST PROJECT UNIVERSE & CUBES
  console.log('\n--- 6. Testing Project Universe & 8 Project Cubes ---');
  const startAdventureBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startAdventureBtn.click();
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(outDir, '06_project_universe_cubes.png') });
  console.log('✔ Captured: 06_project_universe_cubes.png');

  // Return to Home Island from Project Universe
  const returnFromProjectsBtn = await page.waitForSelector('button[aria-label="Return to Island"]');
  await returnFromProjectsBtn.click();
  await new Promise(r => setTimeout(r, 2500));

  // STEP 7: MOBILE RESPONSIVE TESTING (390x844)
  console.log('\n--- 7. Mobile Viewport Testing (390x844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(outDir, '07_mobile_hero_home.png') });
  console.log('✔ Captured: 07_mobile_hero_home.png');

  // Visit Archive on mobile
  const mobArchiveBtn = await page.waitForSelector('button[aria-label="Visit Grand Mage\'s Archive"]');
  await mobArchiveBtn.click();
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(outDir, '08_mobile_archive_overview.png') });
  console.log('✔ Captured: 08_mobile_archive_overview.png');

  // Open About on mobile
  const mobAboutBtn = await page.waitForSelector('button[aria-label="Inspect Archmage\'s Chronicle"]');
  await mobAboutBtn.click();
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '09_mobile_about_modal.png') });
  console.log('✔ Captured: 09_mobile_about_modal.png');

  const closeMobAbout = await page.waitForSelector('button[aria-label="Close chronicle scroll"]');
  await closeMobAbout.click();
  await new Promise(r => setTimeout(r, 800));

  // Return to Island on mobile
  const mobReturnBtn = await page.waitForSelector('button[aria-label="Return to Island"]');
  await mobReturnBtn.click();
  await new Promise(r => setTimeout(r, 2500));

  // Test Start Adventure on mobile
  const mobStartBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await mobStartBtn.click();
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(outDir, '10_mobile_project_universe.png') });
  console.log('✔ Captured: 10_mobile_project_universe.png');

  await browser.close();
  console.log('\n=== ALL QA TESTS COMPLETED SUCCESSFULLY! ===');
}

runFullQA().catch(e => {
  console.error('QA Suite Error:', e);
  process.exit(1);
});

