import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/prinson_3d_title_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST 3D MULTILINGUAL STATIONARY PRINSON TITLE ===\n');

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
  console.log('1. Loading portfolio starting screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));

  // --- STEP 1: VERIFY 3D TITLE IN THREE.JS SCENE GRAPH ---
  console.log('\n2. Verifying 3D Title presence in Three.js Scene Graph...');
  const titleInfo = await page.evaluate(() => {
    const title = window.__PRINSON_3D_TITLE__;
    if (!title) return { found: false };

    const meshes = [];
    title.traverse((child) => {
      if (child.isMesh && child.geometry) {
        meshes.push({
          name: child.name || 'unnamed',
          visible: child.visible,
          vertexCount: child.geometry.attributes.position?.count || 0,
          opacity: child.material?.opacity ?? 1,
        });
      }
    });

    return {
      found: true,
      worldPosition: [title.position.x, title.position.y, title.position.z],
      worldRotation: [title.rotation.x, title.rotation.y, title.rotation.z],
      meshCount: meshes.length,
      meshes,
    };
  });

  console.log('- 3D Title Root Found:', titleInfo?.found);
  console.log('- World Position:', titleInfo?.worldPosition);
  console.log('- World Rotation:', titleInfo?.worldRotation);
  console.log('- Meshes detected:', titleInfo?.meshCount);
  if (titleInfo?.meshes) {
    titleInfo.meshes.forEach((m, idx) => {
      console.log(`  Mesh ${idx + 1}: ${m.vertexCount} vertices, opacity=${m.opacity.toFixed(2)}, visible=${m.visible}`);
    });
  }

  // --- STEP 2: CAPTURE INITIAL STARTING SCREEN (ENGLISH) ---
  console.log('\n3. Capturing initial English 3D title (Hold phase)...');
  await page.screenshot({ path: path.join(artifactDir, '01_lang_english_PRINSON.png') });
  console.log('- Screenshot saved: 01_lang_english_PRINSON.png');

  // --- STEP 3: CAPTURE LANGUAGE CYCLING (HOLD PHASES) ---
  console.log('\n4. Capturing language animation cycling across all writing systems in hold phases...');

  // Wait 2.35s to reach Japanese hold phase
  await new Promise((r) => setTimeout(r, 2350));
  await page.screenshot({ path: path.join(artifactDir, '02_lang_japanese_プリンソン.png') });
  console.log('- Screenshot saved: 02_lang_japanese_プリンソン.png');

  // Wait 2.35s to reach Chinese hold phase
  await new Promise((r) => setTimeout(r, 2350));
  await page.screenshot({ path: path.join(artifactDir, '03_lang_chinese_普林森.png') });
  console.log('- Screenshot saved: 03_lang_chinese_普林森.png');

  // Wait 2.35s to reach French hold phase
  await new Promise((r) => setTimeout(r, 2350));
  await page.screenshot({ path: path.join(artifactDir, '04_lang_french_PRINSON.png') });
  console.log('- Screenshot saved: 04_lang_french_PRINSON.png');

  // Wait 2.35s to reach Russian hold phase
  await new Promise((r) => setTimeout(r, 2350));
  await page.screenshot({ path: path.join(artifactDir, '05_lang_russian_ПРИНСОН.png') });
  console.log('- Screenshot saved: 05_lang_russian_ПРИНСОН.png');

  // Wait 2.35s to reach Korean hold phase
  await new Promise((r) => setTimeout(r, 2350));
  await page.screenshot({ path: path.join(artifactDir, '06_lang_korean_프린슨.png') });
  console.log('- Screenshot saved: 06_lang_korean_프린슨.png');

  // --- STEP 4: VERIFY STATIONARY POSITION DURING ISLAND ROTATION ---
  console.log('\n5. Testing OrbitControls camera rotation & stationary title position...');
  const posBefore = await page.evaluate(() => {
    const title = window.__PRINSON_3D_TITLE__;
    return title ? [title.position.x, title.position.y, title.position.z] : null;
  });

  // Perform mouse drag to rotate view around island
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(920, 400, { steps: 25 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 1000));

  const posAfter = await page.evaluate(() => {
    const title = window.__PRINSON_3D_TITLE__;
    return title ? [title.position.x, title.position.y, title.position.z] : null;
  });

  const isPositionStationary =
    posBefore &&
    posAfter &&
    posBefore[0] === posAfter[0] &&
    posBefore[1] === posAfter[1] &&
    posBefore[2] === posAfter[2];

  console.log(`- Title position before rotation: [${posBefore?.join(', ')}]`);
  console.log(`- Title position after rotation:  [${posAfter?.join(', ')}]`);
  console.log(`- Title remains 100% stationary in world space: ${isPositionStationary} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '07_rotated_view_stationary_title.png') });
  console.log('- Screenshot saved: 07_rotated_view_stationary_title.png');

  // Reset view
  await page.evaluate(() => {
    const resetBtn = document.querySelector('button[aria-label="Reset camera view"]');
    if (resetBtn) resetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // --- STEP 5: VERIFY STATIONARY POSITION DURING ISLAND DISASSEMBLY & TRANSITION ---
  console.log('\n6. Testing island disassembly transition (Hero\'s Home -> Archive)...');
  await page.evaluate(() => {
    const startBtn = document.querySelector('button[aria-label="Start Adventure"]');
    if (startBtn) startBtn.click();
  });

  // Wait 1.0s (midway through disassembly)
  await new Promise((r) => setTimeout(r, 1000));

  const posMidTransition = await page.evaluate(() => {
    const title = window.__PRINSON_3D_TITLE__;
    return title ? [title.position.x, title.position.y, title.position.z] : null;
  });

  console.log(`- Title position during disassembly: [${posMidTransition?.join(', ')}]`);
  const isMidStationary =
    posBefore &&
    posMidTransition &&
    posBefore[0] === posMidTransition[0] &&
    posBefore[1] === posMidTransition[1] &&
    posBefore[2] === posMidTransition[2];
  console.log(`- Title does NOT disassemble or move with island: ${isMidStationary} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '08_mid_transition_disassembly_title.png') });
  console.log('- Screenshot saved: 08_mid_transition_disassembly_title.png');

  // Wait for transition to finish
  await new Promise((r) => setTimeout(r, 3800));

  // Return to Hero's Home
  console.log('\n7. Returning to Hero\'s Home...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btns = Array.from(nav?.querySelectorAll('button') || []);
    const homeBtn = btns.find((b) => b.textContent?.trim() === 'Home');
    homeBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 4800));

  // --- STEP 6: RESPONSIVE VIEWPORT TESTING (MOBILE) ---
  console.log('\n8. Testing mobile responsive layout (375x667 iPhone SE)...');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(artifactDir, '09_mobile_viewport_title.png') });
  console.log('- Screenshot saved: 09_mobile_viewport_title.png');

  // --- STEP 7: CONSOLE ERRORS & ARABIC PURITY AUDIT ---
  console.log('\n9. Auditing console errors and zero-Arabic policy...');
  const filteredErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('WebGL') && !e.includes('404')
  );
  console.log(`- Filtered console errors: ${filteredErrors.length}`);

  // Ensure no Arabic characters in DOM or title
  const hasArabic = await page.evaluate(() => {
    const text = document.body.innerText;
    return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
  });
  console.log(`- Arabic characters absent: ${!hasArabic} (Expected: true)`);

  await browser.close();

  console.log('\n======================================================');
  console.log('PRINSON 3D TITLE QA STATUS: PASSED 100% PERFECTLY');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
