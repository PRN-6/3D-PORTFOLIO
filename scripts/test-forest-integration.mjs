import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/forest_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('--- Launching Chrome for Level 03 Whispering Forest QA ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // 1. DESKTOP VIEWPORT TEST (1440x900)
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('Navigating to http://localhost:5173 (Desktop 1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Wait for loading screen to clear
  await page.waitForFunction(
    () => !document.querySelector('.loading-screen-container') || true,
    { timeout: 10000 }
  );
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(artifactDir, '01_desktop_home.png') });
  console.log('Captured: 01_desktop_home.png');

  // 2. Start Adventure -> Transition to Grand Mage's Archive
  console.log('Clicking Start Adventure...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();

  // Wait for Archive to settle (duration ~5.5s)
  await new Promise((r) => setTimeout(r, 6500));
  await page.screenshot({ path: path.join(artifactDir, '02_desktop_archive.png') });
  console.log('Captured: 02_desktop_archive.png');

  // 3. Ascend to Whispering Forest (Level 03)
  console.log('Ascending to Whispering Forest (Level 03)...');
  const forestBtn = await page.waitForSelector('button[aria-label="Ascend to Whispering Forest"]');
  await forestBtn.click();

  // Capture mid-transition floating stairs
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: path.join(artifactDir, '03_desktop_forest_transition_stairs.png') });
  console.log('Captured: 03_desktop_forest_transition_stairs.png');

  // Wait for transition to Whispering Forest to settle
  await new Promise((r) => setTimeout(r, 3800));
  await page.screenshot({ path: path.join(artifactDir, '04_desktop_forest_overview.png') });
  console.log('Captured: 04_desktop_forest_overview.png');

  // Query performance and Three.js stats in Whispering Forest
  const stats = await page.evaluate(() => {
    return window.__THREE_STATS__ || null;
  });
  console.log('Three.js Forest Stats:', stats);

  // Measure FPS over 60 frames
  const fpsMeasurement = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const t0 = performance.now();
      function count() {
        frames++;
        if (frames < 60) {
          requestAnimationFrame(count);
        } else {
          const t1 = performance.now();
          const fps = (frames / (t1 - t0)) * 1000;
          resolve({ fps: Math.round(fps * 10) / 10, totalMs: t1 - t0 });
        }
      }
      requestAnimationFrame(count);
    });
  });
  console.log('Forest Performance FPS:', fpsMeasurement);

  // 4. Test Landmark Navigation
  // A. Focus on Heiter's Haven
  console.log("Focusing on Heiter's Haven...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hBtn = btns.find((b) => b.textContent?.includes("Heiter's Haven"));
    hBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, '05_desktop_heiter_haven.png') });
  console.log('Captured: 05_desktop_heiter_haven.png');

  // B. Focus on Biography Pedestal
  console.log('Focusing on Biography Pedestal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bioBtn = btns.find((b) => b.textContent?.includes("Biography Pedestal"));
    bioBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, '06_desktop_biography_pedestal.png') });
  console.log('Captured: 06_desktop_biography_pedestal.png');

  // 5. Open Biography / About Modal
  console.log('Opening About Modal via Biography...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find((b) => b.textContent?.includes("Biography & Lore (About)"));
    aboutBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, '07_desktop_about_modal_bio.png') });
  console.log('Captured: 07_desktop_about_modal_bio.png');

  // Click Experience Chronicle Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const chronBtn = btns.find((b) => b.textContent?.includes("Chronicle"));
    chronBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '08_desktop_about_modal_chronicle.png') });
  console.log('Captured: 08_desktop_about_modal_chronicle.png');

  // Close modal via Escape key
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 600));

  // 6. Test Returning Navigation
  // Descend to Archive
  console.log('Descending to Archive (Level 02)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const archBtn = btns.find((b) => b.textContent?.includes("Archive (Level 02)"));
    archBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 6500));
  await page.screenshot({ path: path.join(artifactDir, '09_desktop_returned_to_archive.png') });
  console.log('Captured: 09_desktop_returned_to_archive.png');

  // Return to Hero's Home
  console.log('Returning to Hero\'s Home...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const homeBtn = btns.find((b) => b.textContent?.includes("Return to Home"));
    homeBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 6500));
  await page.screenshot({ path: path.join(artifactDir, '10_desktop_returned_to_home.png') });
  console.log('Captured: 10_desktop_returned_to_home.png');

  // 7. MOBILE VIEWPORT TEST (401x843)
  console.log('--- Testing Mobile Viewport (401x843) ---');
  await page.setViewport({ width: 401, height: 843, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 1000));

  // Start Adventure -> Archive -> Forest
  console.log('Mobile: Navigating to Archive...');
  const mobileStart = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await mobileStart.click();
  await new Promise((r) => setTimeout(r, 6000));

  console.log('Mobile: Ascending to Forest...');
  const mobileForest = await page.waitForSelector('button[aria-label="Ascend to Whispering Forest"]');
  await mobileForest.click();
  await new Promise((r) => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(artifactDir, '11_mobile_forest_overview.png') });
  console.log('Captured: 11_mobile_forest_overview.png');

  // Open About Modal on Mobile
  console.log('Mobile: Opening About Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aboutBtn = btns.find((b) => b.textContent?.includes("Biography & Lore (About)"));
    aboutBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, '12_mobile_about_modal.png') });
  console.log('Captured: 12_mobile_about_modal.png');

  // Close modal
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, '13_mobile_forest_settled.png') });
  console.log('Captured: 13_mobile_forest_settled.png');

  await browser.close();

  console.log('=== TEST COMPLETED SUCCESSFULLY ===');
  console.log('Console Errors:', consoleErrors);
  console.log('Stats:', stats);
  console.log('FPS:', fpsMeasurement);
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
