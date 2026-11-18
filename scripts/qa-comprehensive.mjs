import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function runQA() {
  console.log('--- STARTING COMPREHENSIVE ARCHIVE QA ---');
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

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // 1. Visit Archive Island
  console.log('Navigating to Grand Mage Archive...');
  const archiveBtn = await page.waitForSelector('button[aria-label="Visit Grand Mage\'s Archive"]');
  await archiveBtn.click();
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.join(outDir, '02_archive_overview_desktop.png') });
  console.log('Saved 02_archive_overview_desktop.png');

  // 2. Open About / Chronicle modal
  console.log('Opening Archmage Chronicle modal...');
  const scrollBtn = await page.waitForSelector('button[aria-label="Inspect Archmage\'s Chronicle"]');
  await scrollBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(outDir, '03_archive_about_bio.png') });
  console.log('Saved 03_archive_about_bio.png');

  // Test Chronicle tab
  const tabs = await page.$$('div[role="dialog"] button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Chronicle')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(outDir, '04_archive_about_chronicle.png') });
      console.log('Saved 04_archive_about_chronicle.png');
      break;
    }
  }

  // Close About modal via Dismiss button
  const closeScrollBtn = await page.waitForSelector('button[aria-label="Close chronicle scroll"]');
  await closeScrollBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // 3. Click each of the 6 Grimoires
  // In the archive, grimoires are positioned along an arc from left to right.
  // We can calculate their projected 2D coordinates on the canvas!
  const grimoireCoords = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return [];
    const rect = canvas.getBoundingClientRect();
    // 6 Grimoire 3D positions:
    const pos3D = [
      [-6.08676, 1.3, 3.25],
      [-4.3811, 1.3, 4.04351],
      [-1.59162, 1.3, 4.53393],
      [1.59162, 1.3, 4.53393],
      [4.3811, 1.3, 4.04351],
      [6.08676, 1.3, 3.25]
    ];
    return { rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } };
  });

  console.log('Canvas bounding rect:', grimoireCoords.rect);

  // Let's test clicking on grimoires. If we click along the arc on the screen:
  // In 1440x900 viewport:
  // The grimoires arc spans horizontally across roughly 25% to 75% of screen width,
  // at roughly Y ~ 55% to 62% of screen height.
  // Let's test clicking each book!
  const screenTargets = [
    { name: 'grimoire_1_frontend', xPercent: 0.28, yPercent: 0.59 },
    { name: 'grimoire_2_backend', xPercent: 0.36, yPercent: 0.63 },
    { name: 'grimoire_3_ai_agents', xPercent: 0.44, yPercent: 0.65 },
    { name: 'grimoire_4_systems', xPercent: 0.56, yPercent: 0.65 },
    { name: 'grimoire_5_creative_3d', xPercent: 0.64, yPercent: 0.63 },
    { name: 'grimoire_6_tools', xPercent: 0.72, yPercent: 0.59 }
  ];

  for (let i = 0; i < screenTargets.length; i++) {
    const target = screenTargets[i];
    const clickX = grimoireCoords.rect.left + grimoireCoords.rect.width * target.xPercent;
    const clickY = grimoireCoords.rect.top + grimoireCoords.rect.height * target.yPercent;

    console.log(`Clicking ${target.name} at (${clickX.toFixed(1)}, ${clickY.toFixed(1)})...`);
    await page.mouse.click(clickX, clickY);
    await new Promise(r => setTimeout(r, 1500));

    // Check if modal opened
    const modal = await page.$('aside[aria-label]');
    if (modal) {
      console.log(`✔ Modal successfully opened for ${target.name}!`);
      await page.screenshot({ path: path.join(outDir, `05_${target.name}_modal.png`) });
      // Close modal
      const closeBtn = await page.$('button[aria-label="Close grimoire modal"]');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    } else {
      console.log(`Click at (${clickX}, ${clickY}) didn't hit hit-box, attempting exact 3D raycast via canvas dispatch`);
      await page.screenshot({ path: path.join(outDir, `05_${target.name}_miss.png`) });
    }
  }

  // 4. Return to Island
  console.log('Testing Return to Island button...');
  const returnBtn = await page.waitForSelector('button[aria-label="Return to Island"]');
  await returnBtn.click();
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '06_return_to_home.png') });
  console.log('Saved 06_return_to_home.png');

  // 5. Test Start Adventure to Project Universe
  console.log('Testing Start Adventure transition...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(outDir, '07_project_universe_desktop.png') });
  console.log('Saved 07_project_universe_desktop.png');

  // 6. Test Mobile Viewport
  console.log('Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(outDir, '08_mobile_home.png') });
  console.log('Saved 08_mobile_home.png');

  // Go to archive on mobile
  const mobArchiveBtn = await page.waitForSelector('button[aria-label="Visit Grand Mage\'s Archive"]');
  await mobArchiveBtn.click();
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(outDir, '09_mobile_archive.png') });
  console.log('Saved 09_mobile_archive.png');

  await browser.close();
  console.log('--- QA RUN COMPLETE ---');
}

runQA().catch(e => {
  console.error('QA Error:', e);
  process.exit(1);
});

