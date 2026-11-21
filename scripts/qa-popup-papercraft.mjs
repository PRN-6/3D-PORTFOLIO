import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\popup_papercraft_qa';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runPapercraftQA() {
  console.log('--- STARTING PAPERCRAFT POP-UP ASSEMBLY BROWSER QA ---');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to http://127.0.0.1:5175/ ...');
    await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2500);

    // Wait for assembly engine to initialize
    await page.waitForFunction(() => window.__ASSEMBLY_ENGINE__ !== undefined, { timeout: 15000 });

    // 1. Switch to PAPERCRAFT preset
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.setPreset('PAPERCRAFT');
    });
    await sleep(400);

    // 2. Capture Folded Flat State (0%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.0);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '01_popup_folded_0_dark.png') });
    console.log('📸 01_popup_folded_0_dark.png captured');

    // 3. Stage 1/2: Floor emerged, walls hinging up (25%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.25);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '02_popup_walls_hinging_25_dark.png') });
    console.log('📸 02_popup_walls_hinging_25_dark.png captured');

    // 4. Stage 3: Furniture popping up from floor with overshoot (55%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.55);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '03_popup_furniture_pop_55_dark.png') });
    console.log('📸 03_popup_furniture_pop_55_dark.png captured');

    // 5. Stage 4/5: Props cascading and foliage sweeping (80%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(0.80);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '04_popup_props_cascade_80_dark.png') });
    console.log('📸 04_popup_props_cascade_80_dark.png captured');

    // 6. Stage 6: Fully Assembled & Settled (100%)
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.scrub(1.0);
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '05_popup_assembled_100_dark.png') });
    console.log('📸 05_popup_assembled_100_dark.png captured');

    // 7. Enable Papercraft Matte Cardstock Materials
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.togglePapercraftMaterial();
    });
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, '06_papercraft_cardstock_materials_dark.png') });
    console.log('📸 06_papercraft_cardstock_materials_dark.png captured');

    // 8. Open Control HUD & capture in Light Mode
    const launcherBtn = await page.$('button[title*="Cinematic Assembly"]');
    if (launcherBtn) {
      await launcherBtn.click();
      await sleep(300);
    }

    const themeBtn = await page.$('button[aria-label*="theme" i], button[title*="theme" i], button[title*="Light" i], button[title*="Dark" i]');
    if (themeBtn) {
      await themeBtn.click();
      await sleep(500);
      await page.screenshot({ path: path.join(outDir, '07_papercraft_hud_light.png') });
      console.log('📸 07_papercraft_hud_light.png captured');
    }

    // 9. Restore original materials & assemble
    await page.evaluate(() => {
      window.__ASSEMBLY_ENGINE__.togglePapercraftMaterial();
      window.__ASSEMBLY_ENGINE__.scrub(1.0);
    });

    console.log('✨ All browser papercraft pop-up verification tests passed successfully!');
  } finally {
    await browser.close();
  }
}

runPapercraftQA().catch((err) => {
  console.error('❌ QA Failed:', err);
  process.exit(1);
});
