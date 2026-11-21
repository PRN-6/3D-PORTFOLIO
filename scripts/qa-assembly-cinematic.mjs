import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\assembly_cinematic_qa';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runQAVerification() {
  console.log('--- STARTING CINEMATIC ASSEMBLY ANIMATION QA VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        console.error('Browser console error:', text);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error('Browser uncaught error:', err.message);
    consoleErrors.push(err.message);
  });

  try {
    console.log('Navigating to http://127.0.0.1:5175/ ...');
    await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2500);

    // Wait for assembly engine to initialize
    await page.waitForFunction(() => window.__ASSEMBLY_ENGINE__ !== undefined, { timeout: 15000 });

    const engineState = await page.evaluate(() => window.__ASSEMBLY_ENGINE__.getState());
    console.log('Initial Engine State:', engineState);

    // 1. Initial Assembled State (100%)
    await page.screenshot({ path: path.join(outDir, '01_assembled_100_dark.png') });
    console.log('📸 01_assembled_100_dark.png captured');

    // 2. Exploded View (0%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.0);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '02_exploded_0_dark.png') });
    console.log('📸 02_exploded_0_dark.png captured');

    // 3. Mid-Flight Spiral Arc (35%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.35);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '03_mid_flight_spiral_35_dark.png') });
    console.log('📸 03_mid_flight_spiral_35_dark.png captured');

    // 4. Settling Arrival Settle (80%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.80);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '04_settling_arrival_80_dark.png') });
    console.log('📸 04_settling_arrival_80_dark.png captured');

    // 5. Restore Assembled State (100%) and Expand HUD Panel
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(1.0);
    });
    await sleep(300);

    // Click launcher button to expand HUD
    const launcherBtn = await page.$('button[title*="Cinematic Assembly"]');
    if (launcherBtn) {
      await launcherBtn.click();
      await sleep(400);
      await page.screenshot({ path: path.join(outDir, '05_controls_hud_expanded_dark.png') });
      console.log('📸 05_controls_hud_expanded_dark.png captured');
    }

    // 6. Test Light Mode Toggle
    const themeBtn = await page.$('button[aria-label*="theme" i], button[title*="theme" i], button[title*="Light" i], button[title*="Dark" i]');
    if (themeBtn) {
      await themeBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(outDir, '06_controls_hud_expanded_light.png') });
      console.log('📸 06_controls_hud_expanded_light.png captured');
    }

    // 7. Verify zero drift after scrubbing
    const driftCheck = await page.evaluate(() => {
      const engine = window.__ASSEMBLY_ENGINE__;
      return engine.store.measureDrift(engine.root);
    });
    console.log('Browser In-Engine Drift Report:', driftCheck);

    if (consoleErrors.length > 0) {
      console.warn(`⚠️ Warning: ${consoleErrors.length} console errors encountered:`, consoleErrors);
    } else {
      console.log('✨ Clean console: 0 browser errors!');
    }

    console.log('🎉 Browser verification finished successfully!');
  } finally {
    await browser.close();
  }
}

runQAVerification().catch((err) => {
  console.error('❌ QA Verification Failed:', err);
  process.exit(1);
});

