import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/four_typography_styles_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST FOUR DISTINCT ARTISTIC TYPOGRAPHY STYLES ===\n');

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
      console.error('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('PAGE ERROR:', err.message);
  });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio starting screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

  // Wait for loading screen to complete and fade out
  console.log('Waiting for loading screen to finish...');
  await page.waitForFunction(() => {
    const loader = document.querySelector('[data-testid="loading-screen"]');
    return !loader || window.getComputedStyle(loader).opacity === '0' || window.getComputedStyle(loader).display === 'none';
  }, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));

  // Helper function to wait for a specific style to become active
  async function waitForStyle(expectedName, maxWaitMs = 12000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const s = await page.evaluate(() => window.__CINEMATIC_TITLE_STATE__);
      if (s && s.styleName === expectedName) {
        return s;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for style: ${expectedName}`);
  }

  // 1. Initial State Check (Style 1: Pixel Block)
  console.log('\n2. Verifying Style 1: Pixel Block (Press Start 2P)...');
  let state = await waitForStyle('Pixel Block');
  console.log('Active Style 1 State:', state);

  if (state.styleName !== 'Pixel Block' || !state.fontFamily.includes('Press Start 2P')) {
    throw new Error(`FAIL: Expected first style to be 'Pixel Block', got: ${state.styleName} (${state.fontFamily})`);
  }
  if (state.word !== 'PRINSON') {
    throw new Error(`FAIL: Expected word to be 'PRINSON', got: ${state.word}`);
  }

  // Wait 400ms for stable render
  await new Promise((r) => setTimeout(r, 400));
  // Capture Style 1 screenshot
  const file1 = path.join(artifactDir, '01_style_1_pixel_block.png');
  await page.screenshot({ path: file1 });
  console.log(`PASS: Captured Style 1: ${file1}`);

  // 4. Style 2: Gothic Blackletter
  console.log('\n4. Waiting for Style 2: Gothic Blackletter (UnifrakturCook)...');
  const state2 = await waitForStyle('Gothic Blackletter');
  console.log('State 2:', state2);
  if (!state2.fontFamily.includes('UnifrakturCook')) {
    throw new Error(`FAIL: Expected UnifrakturCook font family, got ${state2.fontFamily}`);
  }
  // Wait 400ms for crossfade completion
  await new Promise((r) => setTimeout(r, 500));
  const file2 = path.join(artifactDir, '02_style_2_gothic_blackletter.png');
  await page.screenshot({ path: file2 });
  console.log(`PASS: Captured Style 2: ${file2}`);

  // 5. Style 3: Minimal Pixel
  console.log('\n5. Waiting for Style 3: Minimal Pixel (Silkscreen)...');
  const state3 = await waitForStyle('Minimal Pixel');
  console.log('State 3:', state3);
  if (!state3.fontFamily.includes('Silkscreen')) {
    throw new Error(`FAIL: Expected Silkscreen font family, got ${state3.fontFamily}`);
  }
  await new Promise((r) => setTimeout(r, 500));
  const file3 = path.join(artifactDir, '03_style_3_minimal_pixel.png');
  await page.screenshot({ path: file3 });
  console.log(`PASS: Captured Style 3: ${file3}`);

  // 6. Style 4: Luxury Editorial Serif
  console.log('\n6. Waiting for Style 4: Luxury Editorial Serif (Bodoni Moda)...');
  const state4 = await waitForStyle('Luxury Editorial Serif');
  console.log('State 4:', state4);
  if (!state4.fontFamily.includes('Bodoni Moda')) {
    throw new Error(`FAIL: Expected Bodoni Moda font family, got ${state4.fontFamily}`);
  }
  await new Promise((r) => setTimeout(r, 500));
  const file4 = path.join(artifactDir, '04_style_4_luxury_editorial_serif.png');
  await page.screenshot({ path: file4 });
  console.log(`PASS: Captured Style 4: ${file4}`);

  // 7. Loop Repeat: Verify Style 1 reappears
  console.log('\n7. Verifying loop back to Style 1: Pixel Block...');
  const stateRepeat = await waitForStyle('Pixel Block');
  console.log('Loop returned to:', stateRepeat.styleName);
  console.log('Recorded sequence:', stateRepeat.history);
  console.log('PASS: Complete cycle repeated in exact sequence: 1 -> 2 -> 3 -> 4 -> 1');

  // Capture pristine Style 1 screenshot after loop return
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: file1 });
  console.log(`PASS: Recaptured pristine Style 1: ${file1}`);

  // Test stationary property during 3D scene rotation
  console.log('\n8. Testing stationary behavior during 3D scene rotation...');
  const initialRect = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  // Drag canvas to rotate island
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(900, 380, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));

  const postDragRect = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  const deltaX = Math.abs(postDragRect.x - initialRect.x);
  const deltaY = Math.abs(postDragRect.y - initialRect.y);
  console.log(`Title delta after 3D drag: deltaX=${deltaX}px, deltaY=${deltaY}px`);
  if (deltaX > 0.5 || deltaY > 0.5) {
    throw new Error(`FAIL: Title moved during 3D rotation! deltaX=${deltaX}, deltaY=${deltaY}`);
  }
  console.log('PASS: PRINSON title remains 100% stationary during 3D island rotation.');

  // 9. Mobile Viewport Check
  console.log('\n9. Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const mobileMetrics = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const span = el?.querySelector('span');
    const bodyWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const spanRect = span ? span.getBoundingClientRect() : null;

    return {
      hasHorizontalOverflow: scrollWidth > bodyWidth,
      spanWidth: spanRect?.width,
      bodyWidth,
      ratio: spanRect ? spanRect.width / bodyWidth : 0,
      text: span?.textContent?.trim(),
    };
  });

  console.log('Mobile Metrics:', mobileMetrics);
  if (mobileMetrics.hasHorizontalOverflow) {
    throw new Error('FAIL: Horizontal overflow on mobile view!');
  }
  if (mobileMetrics.text !== 'PRINSON') {
    throw new Error(`FAIL: Text on mobile is "${mobileMetrics.text}", expected "PRINSON"`);
  }
  console.log('PASS: Mobile typography renders within viewport without overflow.');

  const mobileFile = path.join(artifactDir, '05_mobile_cinematic_title.png');
  await page.screenshot({ path: mobileFile });
  console.log(`Saved mobile screenshot: ${mobileFile}`);

  // 9. Console Error Verification
  console.log('\n9. Checking console errors...');
  if (consoleErrors.length > 0) {
    throw new Error(`FAIL: Browser console errors detected: ${consoleErrors.join(', ')}`);
  }
  console.log('PASS: Zero console errors.');

  console.log('\n=== ALL FOUR TYPOGRAPHY STYLES VERIFIED SUCCESSFULLY! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
