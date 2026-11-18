import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function runTransitionQA() {
  console.log('--- STARTING CINEMATIC VERTICAL WORLD TRANSITION QA ---');
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

  // ==========================================
  // PART 1: DESKTOP TRANSITION TEST (1440x900)
  // ==========================================
  console.log('Navigating to http://localhost:5173 on Desktop (1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4500)); // ensure all models are parsed

  // 1. Initial State: Hero's Home
  console.log('Capturing Initial State: Hero Home with START ADVENTURE...');
  await page.screenshot({ path: path.join(outDir, 'transition_01_home_initial.png') });

  // 2. Click START ADVENTURE
  console.log('Triggering START ADVENTURE...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();

  // Phase A: Departure (~0.8s)
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'transition_02_phaseA_departure.png') });
  console.log('Captured transition_02_phaseA_departure.png');

  // Phase B: Staircase Formation & Ascent (~2.2s)
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'transition_03_phaseB_staircase_climb.png') });
  console.log('Captured transition_03_phaseB_staircase_climb.png');

  // Phase C: Archive Arrival from Above (~3.8s)
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'transition_04_phaseC_archive_arrival.png') });
  console.log('Captured transition_04_phaseC_archive_arrival.png');

  // Phase D: Settle at Archive (~5.5s)
  await new Promise(r => setTimeout(r, 1600));
  await page.screenshot({ path: path.join(outDir, 'transition_05_phaseD_archive_settled.png') });
  console.log('Captured transition_05_phaseD_archive_settled.png');

  // 3. Verify Archive Grimoire Interaction
  console.log('Testing Archive Grimoire interaction...');
  const grimoireBtn = await page.$('button[aria-label="Inspect Grimoire of Frontend & Reactive Weaves"]');
  if (grimoireBtn) {
    await grimoireBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'transition_06_archive_grimoire_modal.png') });
    console.log('Captured transition_06_archive_grimoire_modal.png');
    // Close modal via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 800));
  } else {
    // Raycast canvas click
    await page.mouse.click(500, 560);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'transition_06_archive_grimoire_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 800));
  }

  // 4. Test RETURN TO ISLAND (Reverse transition back to Hero's Home)
  console.log('Testing RETURN TO ISLAND...');
  const returnBtn = await page.waitForSelector('button[aria-label="Return to Island"]');
  await returnBtn.click();

  // Reverse transition midway (~2.4s)
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(outDir, 'transition_07_reverse_transition_midway.png') });
  console.log('Captured transition_07_reverse_transition_midway.png');

  // Settle back at Hero's Home (~5.5s total)
  await new Promise(r => setTimeout(r, 3400));
  await page.screenshot({ path: path.join(outDir, 'transition_08_return_home_settled.png') });
  console.log('Captured transition_08_return_home_settled.png');

  // ==========================================
  // PART 2: MOBILE VIEWPORT TEST (390x844)
  // ==========================================
  console.log('\n--- TESTING MOBILE VIEWPORT (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4500));

  await mobilePage.screenshot({ path: path.join(outDir, 'transition_09_mobile_home_initial.png') });
  console.log('Captured transition_09_mobile_home_initial.png');

  // Click START ADVENTURE on mobile
  const mobileStartBtn = await mobilePage.waitForSelector('button[aria-label="Start Adventure"]');
  await mobileStartBtn.click();

  // Capture mobile mid-transition stairs
  await new Promise(r => setTimeout(r, 2200));
  await mobilePage.screenshot({ path: path.join(outDir, 'transition_10_mobile_staircase_transition.png') });
  console.log('Captured transition_10_mobile_staircase_transition.png');

  // Wait for mobile Archive arrival
  await new Promise(r => setTimeout(r, 3200));
  await mobilePage.screenshot({ path: path.join(outDir, 'transition_11_mobile_archive_settled.png') });
  console.log('Captured transition_11_mobile_archive_settled.png');

  await browser.close();
  console.log('--- ALL QA TESTS FINISHED SUCCESSFULLY ---');
}

runTransitionQA().catch(err => {
  console.error('QA FAILED:', err);
  process.exit(1);
});
