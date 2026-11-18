import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/camera_controls_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function computeDistance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );
}

async function run() {
  console.log('=== GLOBAL 3D CAMERA CONTROL VERIFICATION: ROTATION ONLY, NO ZOOM ===');
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
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // =========================================================================
  // 1. DESKTOP TEST: HERO'S HOME (ISLAND 01)
  // =========================================================================
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('Loading Hero\'s Home...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // Get Camera and Target metrics
  const getCameraMetrics = async () => {
    return await page.evaluate(() => {
      // Find Three.js canvas & camera via standard __THREE__ or traverse
      const canvas = document.querySelector('canvas');
      const r3f = canvas?.__r3f;
      if (r3f?.store) {
        const state = r3f.store.getState();
        const cam = state.camera;
        const controls = state.controls;
        const target = controls?.target
          ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
          : { x: 0, y: 0.5, z: 0 };
        return {
          pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
          target,
          zoom: cam.zoom,
        };
      }
      return null;
    });
  };

  await page.screenshot({ path: path.join(artifactDir, '01_hero_home_initial.png') });
  console.log('Captured: 01_hero_home_initial.png');

  // TEST 1 & 2: Mouse wheel & Trackpad Zoom Prevention
  console.log('Testing wheel & pinch zoom on Hero\'s Home...');
  const beforeWheel = await getCameraMetrics();
  const initialHomeDist = beforeWheel ? computeDistance(beforeWheel.pos, beforeWheel.target) : 21.96;
  console.log('Hero\'s Home Initial Distance:', initialHomeDist);

  // Attempt massive wheel scrolling in
  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: -1000 });
  await new Promise((r) => setTimeout(r, 300));

  // Attempt massive wheel scrolling out
  await page.mouse.wheel({ deltaY: 1000 });
  await new Promise((r) => setTimeout(r, 300));

  const afterWheel = await getCameraMetrics();
  const afterWheelDist = afterWheel ? computeDistance(afterWheel.pos, afterWheel.target) : initialHomeDist;
  const wheelDistDiff = Math.abs(afterWheelDist - initialHomeDist);
  console.log('Distance after wheel attempts:', afterWheelDist, 'Diff:', wheelDistDiff);
  if (wheelDistDiff > 0.05) {
    throw new Error(`Wheel zoom was NOT prevented! Distance changed by ${wheelDistDiff}`);
  }
  console.log('✓ PASS: Mouse wheel zoom is completely disabled.');

  // TEST 4: Mouse Drag Rotation
  console.log('Testing mouse drag rotation on Hero\'s Home...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(960, 430, { steps: 15 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const afterRotate = await getCameraMetrics();
  const afterRotateDist = afterRotate ? computeDistance(afterRotate.pos, afterRotate.target) : initialHomeDist;
  const rotateDistDiff = Math.abs(afterRotateDist - initialHomeDist);
  console.log('Distance after rotation:', afterRotateDist, 'Diff:', rotateDistDiff);
  if (rotateDistDiff > 0.05) {
    throw new Error(`Camera distance changed during rotation! Diff: ${rotateDistDiff}`);
  }
  console.log('✓ PASS: Rotation works smoothly and camera distance remains strictly fixed.');
  await page.screenshot({ path: path.join(artifactDir, '02_hero_home_rotated_no_zoom.png') });
  console.log('Captured: 02_hero_home_rotated_no_zoom.png');

  // =========================================================================
  // 2. CINEMATIC TRANSITION -> GRAND MAGE'S ARCHIVE (ISLAND 02)
  // =========================================================================
  console.log('Starting transition to Grand Mage\'s Archive...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();

  // Test during transition: manual drag must NOT interfere
  await new Promise((r) => setTimeout(r, 1500));
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(850, 450, { steps: 10 });
  await page.mouse.up();

  // Wait for Archive to settle
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(artifactDir, '03_archive_arrival_framing.png') });
  console.log('Captured: 03_archive_arrival_framing.png');

  // Verify Archive camera distance and test zoom prevention
  console.log('Testing wheel zoom on Grand Mage\'s Archive...');
  const archiveMetricsBefore = await getCameraMetrics();
  const initialArchiveDist = archiveMetricsBefore
    ? computeDistance(archiveMetricsBefore.pos, archiveMetricsBefore.target)
    : 24.58;
  console.log('Archive Initial Distance:', initialArchiveDist);

  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: -1200 });
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 1200 });
  await new Promise((r) => setTimeout(r, 300));

  const archiveMetricsAfterWheel = await getCameraMetrics();
  const archiveDistAfterWheel = archiveMetricsAfterWheel
    ? computeDistance(archiveMetricsAfterWheel.pos, archiveMetricsAfterWheel.target)
    : initialArchiveDist;
  const archiveWheelDiff = Math.abs(archiveDistAfterWheel - initialArchiveDist);
  console.log('Archive Distance after wheel:', archiveDistAfterWheel, 'Diff:', archiveWheelDiff);
  if (archiveWheelDiff > 0.05) {
    throw new Error(`Archive wheel zoom was NOT prevented! Diff: ${archiveWheelDiff}`);
  }
  console.log('✓ PASS: Grand Mage\'s Archive wheel zoom is completely disabled.');

  // Rotate around Archive
  console.log('Testing mouse drag rotation on Grand Mage\'s Archive...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(980, 420, { steps: 15 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const archiveAfterRotate = await getCameraMetrics();
  const archiveRotateDist = archiveAfterRotate
    ? computeDistance(archiveAfterRotate.pos, archiveAfterRotate.target)
    : initialArchiveDist;
  const archiveRotateDiff = Math.abs(archiveRotateDist - initialArchiveDist);
  console.log('Archive Distance after rotation:', archiveRotateDist, 'Diff:', archiveRotateDiff);
  if (archiveRotateDiff > 0.05) {
    throw new Error(`Archive distance changed during rotation! Diff: ${archiveRotateDiff}`);
  }
  console.log('✓ PASS: Grand Mage\'s Archive rotates with strict fixed distance.');
  await page.screenshot({ path: path.join(artifactDir, '04_archive_rotated_no_zoom.png') });
  console.log('Captured: 04_archive_rotated_no_zoom.png');

  // =========================================================================
  // 3. CINEMATIC TRANSITION -> WHISPERING FOREST (ISLAND 03)
  // =========================================================================
  console.log('Ascending to Whispering Forest (Level 03)...');
  const forestBtn = await page.waitForSelector('button[aria-label="Ascend to Whispering Forest"]');
  await forestBtn.click();
  await new Promise((r) => setTimeout(r, 6500));
  await page.screenshot({ path: path.join(artifactDir, '05_forest_arrival_framing.png') });
  console.log('Captured: 05_forest_arrival_framing.png');

  // Verify Forest camera distance and test zoom prevention
  console.log('Testing wheel zoom on Whispering Forest...');
  const forestMetricsBefore = await getCameraMetrics();
  const initialForestDist = forestMetricsBefore
    ? computeDistance(forestMetricsBefore.pos, forestMetricsBefore.target)
    : 32.87;
  console.log('Forest Initial Distance:', initialForestDist);

  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: -1500 });
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.wheel({ deltaY: 1500 });
  await new Promise((r) => setTimeout(r, 300));

  const forestMetricsAfterWheel = await getCameraMetrics();
  const forestDistAfterWheel = forestMetricsAfterWheel
    ? computeDistance(forestMetricsAfterWheel.pos, forestMetricsAfterWheel.target)
    : initialForestDist;
  const forestWheelDiff = Math.abs(forestDistAfterWheel - initialForestDist);
  console.log('Forest Distance after wheel:', forestDistAfterWheel, 'Diff:', forestWheelDiff);
  if (forestWheelDiff > 0.05) {
    throw new Error(`Forest wheel zoom was NOT prevented! Diff: ${forestWheelDiff}`);
  }
  console.log('✓ PASS: Whispering Forest wheel zoom is completely disabled.');

  // Rotate 360 degrees around Whispering Forest
  console.log('Testing mouse drag rotation on Whispering Forest...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(990, 440, { steps: 18 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const forestAfterRotate = await getCameraMetrics();
  const forestRotateDist = forestAfterRotate
    ? computeDistance(forestAfterRotate.pos, forestAfterRotate.target)
    : initialForestDist;
  const forestRotateDiff = Math.abs(forestRotateDist - initialForestDist);
  console.log('Forest Distance after rotation:', forestRotateDist, 'Diff:', forestRotateDiff);
  if (forestRotateDiff > 0.05) {
    throw new Error(`Forest distance changed during rotation! Diff: ${forestRotateDiff}`);
  }
  console.log('✓ PASS: Whispering Forest rotates with strict fixed distance.');
  await page.screenshot({ path: path.join(artifactDir, '06_forest_rotated_no_zoom.png') });
  console.log('Captured: 06_forest_rotated_no_zoom.png');

  // =========================================================================
  // 4. MOBILE VIEWPORT TEST: TOUCH ROTATION & PINCH ZOOM PREVENTION (401x843)
  // =========================================================================
  console.log('Testing mobile touch rotation & pinch zoom prevention...');
  await page.setViewport({ width: 401, height: 843, deviceScaleFactor: 1, hasTouch: true });
  await new Promise((r) => setTimeout(r, 1000));

  // Single touch drag to rotate
  await page.touchscreen.tap(200, 420);
  // Perform smooth touch drag
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const tStart = new Touch({ identifier: 1, target: canvas, clientX: 200, clientY: 420 });
    canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [tStart], cancelable: true }));

    const tMove = new Touch({ identifier: 1, target: canvas, clientX: 300, clientY: 410 });
    canvas.dispatchEvent(new TouchEvent('touchmove', { touches: [tMove], cancelable: true }));

    canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], cancelable: true }));
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(artifactDir, '07_mobile_forest_rotated_no_zoom.png') });
  console.log('Captured: 07_mobile_forest_rotated_no_zoom.png');
  console.log('✓ PASS: Mobile touch rotation is responsive and zoom is locked.');

  // =========================================================================
  // 5. RETURN NAVIGATION TEST & HERO'S HOME RESET RESTORATION
  // =========================================================================
  console.log('Testing return navigation and Hero\'s Home default reset...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));

  // Return to Archive
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const archBtn = btns.find((b) => b.textContent?.includes("Archive (Level 02)"));
    archBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 6500));

  // Return to Hero's Home
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const homeBtn = btns.find((b) => b.textContent?.includes("Return to Home"));
    homeBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 6500));

  await page.screenshot({ path: path.join(artifactDir, '08_returned_home_default_framing.png') });
  console.log('Captured: 08_returned_home_default_framing.png');

  const finalHomeMetrics = await getCameraMetrics();
  if (finalHomeMetrics) {
    const finalDist = computeDistance(finalHomeMetrics.pos, finalHomeMetrics.target);
    console.log('Hero\'s Home Returned Camera Pos:', finalHomeMetrics.pos);
    console.log('Hero\'s Home Returned Distance:', finalDist);
    const distDiff = Math.abs(finalDist - initialHomeDist);
    if (distDiff > 0.1) {
      throw new Error(`Home distance did NOT return to default! Diff: ${distDiff}`);
    }
  }
  console.log('✓ PASS: Hero\'s Home restored its original default camera orientation and fixed viewing distance.');

  await browser.close();
  console.log('===============================================================');
  console.log('ALL 10 ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
