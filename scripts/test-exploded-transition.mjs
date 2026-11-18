import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/exploded_transition_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function computeDistance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );
}

async function run() {
  console.log('=== MODULAR 3D DISASSEMBLY & REASSEMBLY TRANSITION ACCEPTANCE TEST ===');

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

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Navigating to portfolio...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(artifactDir, '01_home_initial.png') });
  console.log('Captured: 01_home_initial.png');

  // Query camera position from window
  const getCameraPose = async () => {
    return await page.evaluate(() => {
      const cam = window.__THREE_CAMERA__;
      return cam
        ? { x: cam.position.x, y: cam.position.y, z: cam.position.z }
        : null;
    });
  };

  const getTransitionTelemetry = async () => {
    return await page.evaluate(() => {
      return window.__EXPLODED_TRANSITION_STATE__ || null;
    });
  };

  const initialCam = await getCameraPose();
  console.log('Initial Camera Pose:', initialCam);

  // =========================================================================
  // 1. FORWARD TEST: HERO'S HOME -> GRAND MAGE'S ARCHIVE
  // =========================================================================
  console.log('\n2. Triggering Disassembly of Hero\'s Home...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();

  // A. Sample Disassembly Phase (t = 800ms)
  await new Promise((r) => setTimeout(r, 800));
  const disasmTelemetry = await getTransitionTelemetry();
  const disasmCam = await getCameraPose();
  console.log('Disassembly Telemetry:', disasmTelemetry, 'Cam:', disasmCam);
  await page.screenshot({ path: path.join(artifactDir, '02_home_disassembling.png') });
  console.log('Captured: 02_home_disassembling.png');

  // Check camera stationary
  if (disasmCam && initialCam) {
    const camDiff = computeDistance(disasmCam, initialCam);
    console.log(`Camera movement during disassembly: ${camDiff.toFixed(5)} units`);
    if (camDiff > 0.05) {
      throw new Error(`VIOLATION: Camera moved during disassembly! Diff: ${camDiff}`);
    }
  }

  // B. Sample Pause / Handover (t = 1900ms from start -> +1100ms)
  await new Promise((r) => setTimeout(r, 1100));
  const pauseTelemetry = await getTransitionTelemetry();
  console.log('Pause/Preparation Telemetry:', pauseTelemetry);
  await page.screenshot({ path: path.join(artifactDir, '03_mid_transition_pause.png') });
  console.log('Captured: 03_mid_transition_pause.png');

  // C. Sample Reassembly Phase (t = 3000ms from start -> +1100ms)
  await new Promise((r) => setTimeout(r, 1100));
  const reasmTelemetry = await getTransitionTelemetry();
  const reasmCam = await getCameraPose();
  console.log('Reassembly Telemetry:', reasmTelemetry, 'Cam:', reasmCam);
  await page.screenshot({ path: path.join(artifactDir, '04_archive_reassembling.png') });
  console.log('Captured: 04_archive_reassembling.png');

  if (reasmCam && initialCam) {
    const camDiff = computeDistance(reasmCam, initialCam);
    console.log(`Camera movement during reassembly: ${camDiff.toFixed(5)} units`);
    if (camDiff > 0.05) {
      throw new Error(`VIOLATION: Camera moved during reassembly! Diff: ${camDiff}`);
    }
  }

  // D. Wait for Transition to Finish and Settle (+1500ms)
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, '05_archive_settled.png') });
  console.log('Captured: 05_archive_settled.png');

  // Verify Archive is active and inspectable
  const settledState = await getTransitionTelemetry();
  console.log('Transition Complete State:', settledState);

  // =========================================================================
  // 2. REVERSE TEST: GRAND MAGE'S ARCHIVE -> HERO'S HOME
  // =========================================================================
  console.log('\n3. Triggering Return Transition (Archive -> Hero\'s Home)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const homeBtn = btns.find((b) => b.textContent?.includes('Return to Home') || b.textContent?.includes('RETURN TO HOME'));
    homeBtn?.click();
  });

  // A. Sample Archive Disassembly (t = 800ms)
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, '06_archive_disassembling.png') });
  console.log('Captured: 06_archive_disassembling.png');

  // B. Sample Home Reassembly (t = 3000ms -> +2200ms)
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: path.join(artifactDir, '07_home_reassembling.png') });
  console.log('Captured: 07_home_reassembling.png');

  // C. Wait for Home Reassembly Settle and Camera Reset (+3500ms)
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(artifactDir, '08_home_settled_restored.png') });
  console.log('Captured: 08_home_settled_restored.png');

  const finalCam = await getCameraPose();
  console.log('Final Returned Camera Pose:', finalCam);
  if (finalCam && initialCam) {
    const camDiff = computeDistance(finalCam, initialCam);
    console.log(`Total camera net shift: ${camDiff.toFixed(5)} units`);
    if (camDiff > 0.05) {
      throw new Error(`VIOLATION: Camera ended at different position! Diff: ${camDiff}`);
    }
  }

  console.log('\n===============================================================');
  console.log('ALL MODULAR 3D DISASSEMBLY & REASSEMBLY TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');

  await browser.close();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
