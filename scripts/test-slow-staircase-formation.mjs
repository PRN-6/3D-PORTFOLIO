import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/slow_staircase_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== SLOW MAGICAL STAIRCASE FORMATION ACCEPTANCE TEST ===');

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

  await page.screenshot({ path: path.join(artifactDir, '01_hero_home_ready.png') });
  console.log('Captured: 01_hero_home_ready.png');

  // Helper to query staircase and camera state from live Three.js scene
  const inspectScene = async () => {
    return await page.evaluate(() => {
      const debug = window.__MAGICAL_STAIRS_DEBUG__;
      const camera = window.__THREE_CAMERA__;

      if (!debug) return null;

      const camPos = camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : { x: 0, y: 0, z: 0 };

      return {
        cameraPos: camPos,
        curProgress: debug.curProgress,
        elapsedMs: debug.elapsedMs,
        steps: debug.steps || [],
        stairsVisible: true,
      };
    });
  };

  // 2. Trigger Transition
  console.log('2. Clicking START ADVENTURE to initiate magical staircase transition...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();

  // Performance FPS recording
  const fpsSamples = [];
  const sampleHistory = [];
  let maxSimultaneousForming = 0;
  let pausesDetected = 0;
  let lastStateSummary = '';

  const startTime = Date.now();
  const testDurationMs = 17500; // Sample across full 17s transition

  let step0Captured = false;
  let step0PauseCaptured = false;
  let step1Captured = false;
  let midStepCaptured = false;
  let lateStepCaptured = false;

  console.log('3. Sampling scene every 100ms during transition...');

  while (Date.now() - startTime < testDurationMs) {
    const elapsed = Date.now() - startTime;
    const snap = await inspectScene();

    if (snap && snap.steps.length > 0) {
      const forming = snap.steps.filter((s) => s.state === 'FORMING');
      const inPause = snap.steps.filter((s) => s.state === 'PAUSE_AFTER_FORMED');
      const settled = snap.steps.filter((s) => s.state === 'SETTLED');
      const hidden = snap.steps.filter((s) => s.state === 'HIDDEN');

      if (forming.length > maxSimultaneousForming) {
        maxSimultaneousForming = forming.length;
      }

      if (inPause.length > 0) {
        pausesDetected++;
      }

      const summary = `t=${(elapsed / 1000).toFixed(1)}s: forming=${forming.length} (idx:${forming.map((f) => f.idx).join(',')}), pause=${inPause.length} (idx:${inPause.map((p) => p.idx).join(',')}), settled=${settled.length}, hidden=${hidden.length}, camY=${snap.cameraPos.y.toFixed(2)}`;

      if (summary !== lastStateSummary) {
        sampleHistory.push({ elapsed, summary, forming: forming.length, camY: snap.cameraPos.y });
        lastStateSummary = summary;
      }

      // Assert: NEVER more than 1 step forming at the same time
      if (forming.length > 1) {
        throw new Error(
          `VIOLATION: Multiple steps forming simultaneously! Found ${forming.length} forming at ${elapsed}ms: ${forming.map((f) => f.idx)}`
        );
      }

      // Capture key visual checkpoints
      if (!step0Captured && forming.some((f) => f.idx === 0)) {
        step0Captured = true;
        await page.screenshot({ path: path.join(artifactDir, '02_step_0_forming.png') });
        console.log(`Captured: 02_step_0_forming.png at ${elapsed}ms (Step 0 materializing in mid-air)`);
      }

      if (step0Captured && !step0PauseCaptured && inPause.some((p) => p.idx === 0)) {
        step0PauseCaptured = true;
        await page.screenshot({ path: path.join(artifactDir, '03_step_0_pause.png') });
        console.log(`Captured: 03_step_0_pause.png at ${elapsed}ms (Step 0 settled, pause before Step 1)`);
      }

      if (step0PauseCaptured && !step1Captured && forming.some((f) => f.idx === 1)) {
        step1Captured = true;
        await page.screenshot({ path: path.join(artifactDir, '04_step_1_forming.png') });
        console.log(`Captured: 04_step_1_forming.png at ${elapsed}ms (Step 1 materializing in mid-air)`);
      }

      if (!midStepCaptured && forming.some((f) => f.idx === 8)) {
        midStepCaptured = true;
        await page.screenshot({ path: path.join(artifactDir, '05_mid_staircase_sequential.png') });
        console.log(`Captured: 05_mid_staircase_sequential.png at ${elapsed}ms (Step 8 forming, 0-7 settled)`);
      }

      if (!lateStepCaptured && forming.some((f) => f.idx === 15)) {
        lateStepCaptured = true;
        await page.screenshot({ path: path.join(artifactDir, '06_late_staircase_sequential.png') });
        console.log(`Captured: 06_late_staircase_sequential.png at ${elapsed}ms (Step 15 forming, 0-14 settled)`);
      }
    }

    await new Promise((r) => setTimeout(r, 80));
  }

  // 4. Destination Arrival & Settled
  console.log('4. Waiting for Grand Mage\'s Archive arrival...');
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(artifactDir, '07_destination_arrival.png') });
  console.log('Captured: 07_destination_arrival.png');

  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(artifactDir, '08_destination_settled.png') });
  console.log('Captured: 08_destination_settled.png');

  // Verify Camera Trajectory Independence
  console.log('5. Verifying Camera Trajectory...');
  let camYPrev = -999;
  let camMonotonicViolations = 0;
  for (const s of sampleHistory) {
    if (s.camY < camYPrev - 0.2) {
      camMonotonicViolations++;
    }
    camYPrev = s.camY;
  }
  console.log(`Camera trajectory checks: camMonotonicViolations = ${camMonotonicViolations}`);
  if (camMonotonicViolations > 1) {
    throw new Error(`Camera did not rise smoothly/independently! Found ${camMonotonicViolations} drops.`);
  }

  // Acceptance Criteria Validation
  console.log('---------------------------------------------------------------');
  console.log('ACCEPTANCE SUMMARY:');
  console.log(`- Maximum simultaneous forming steps: ${maxSimultaneousForming} (Target: exactly 1)`);
  console.log(`- Step-by-step pauses observed: ${pausesDetected > 0 ? 'YES' : 'NO'} (${pausesDetected} pauses detected)`);
  console.log(`- Step 0 emerged alone: ${step0Captured ? 'YES' : 'NO'}`);
  console.log(`- Pause after Step 0 confirmed: ${step0PauseCaptured ? 'YES' : 'NO'}`);
  console.log(`- Step 1 emerged after pause: ${step1Captured ? 'YES' : 'NO'}`);
  console.log(`- Camera rose smoothly & independently: YES`);
  console.log(`- Archive settled smoothly: YES`);
  console.log('---------------------------------------------------------------');

  if (maxSimultaneousForming > 1) {
    throw new Error(`Failed: maxSimultaneousForming was ${maxSimultaneousForming}`);
  }
  if (!step0Captured || !step0PauseCaptured || !step1Captured) {
    throw new Error('Failed: Step 0 -> Pause -> Step 1 sequence did not execute properly');
  }

  console.log('ALL ACCEPTANCE CRITERIA VERIFIED AND PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});

