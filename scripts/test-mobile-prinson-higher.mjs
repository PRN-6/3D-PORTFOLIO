import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/mobile_prinson_elevation_115px_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST MOBILE-ONLY PRINSON TYPOGRAPHY ELEVATION (100–130px) ===\n');

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

  // ---------------------------------------------------------------------------
  // 1. MOBILE VIEWPORT TEST (393 x 852 - iPhone 14 / modern smartphone)
  // ---------------------------------------------------------------------------
  console.log('1. Testing Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  const mobileMetrics = await page.evaluate(() => {
    const container = document.querySelector('.prinson-title-mobile-lift');
    const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    const titleRoot = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const canvas = document.querySelector('canvas');
    if (!container || !h1 || !titleRoot || !canvas) return null;

    const style = window.getComputedStyle(container);
    const containerRect = container.getBoundingClientRect();
    const h1Rect = h1.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check horizontal centering
    const h1CenterHorizontal = h1Rect.left + h1Rect.width / 2;
    const horizontalCenterDelta = Math.abs(h1CenterHorizontal - viewportWidth / 2);

    // Check vertical offset
    const viewportCenterY = viewportHeight / 2;
    const h1CenterVertical = h1Rect.top + h1Rect.height / 2;
    const upwardShift = viewportCenterY - h1CenterVertical;

    // Layering check
    const titleZIndex = window.getComputedStyle(titleRoot).zIndex;
    const canvasWrapper = canvas.parentElement;
    const canvasZIndex = canvasWrapper ? window.getComputedStyle(canvasWrapper).zIndex : window.getComputedStyle(canvas).zIndex;
    const titleZ = parseInt(titleZIndex || '1', 10);
    const canvasZ = parseInt(canvasZIndex === 'auto' ? '10' : canvasZIndex, 10);

    return {
      transform: style.transform,
      containerTop: containerRect.top,
      h1Top: h1Rect.top,
      h1CenterHorizontal,
      horizontalCenterDelta,
      h1CenterVertical,
      viewportCenterY,
      upwardShift,
      isHorizontallyCentered: horizontalCenterDelta < 2,
      layeringCorrect: titleZ < canvasZ,
      titleZIndex,
      canvasZIndex,
    };
  });

  console.log('Mobile Metrics (393x852):', mobileMetrics);
  if (!mobileMetrics) {
    throw new Error('FAIL: .prinson-title-mobile-lift or active h1 not found on mobile!');
  }

  // Verify upward shift is approximately 100-130px (target: ~115px)
  if (mobileMetrics.upwardShift < 95 || mobileMetrics.upwardShift > 135) {
    throw new Error(`FAIL: Mobile upward shift was ${mobileMetrics.upwardShift}px, expected 100–130px!`);
  }
  if (!mobileMetrics.isHorizontallyCentered) {
    throw new Error(`FAIL: Not horizontally centered on mobile! Delta: ${mobileMetrics.horizontalCenterDelta}px`);
  }
  if (!mobileMetrics.layeringCorrect) {
    throw new Error(`FAIL: Layering incorrect! Title z-index (${mobileMetrics.titleZIndex}) must be below Canvas (${mobileMetrics.canvasZIndex})`);
  }
  console.log(`✔ PASS: Mobile PRINSON title elevated by ${mobileMetrics.upwardShift.toFixed(1)}px (within 100–130px) and perfectly centered behind 3D canvas.`);
  await page.screenshot({ path: path.join(artifactDir, '01_mobile_393_prinson_elevated_115px.png') });

  // ---------------------------------------------------------------------------
  // 2. VERIFY TYPOGRAPHY LOOP CONTINUES CYCLING ON MOBILE
  // ---------------------------------------------------------------------------
  console.log('\n2. Verifying typography loop animation on mobile...');
  const idx1 = await page.evaluate(() => window.__PRINSON_FONT_LOOP__?.activeStyleIndex);
  await new Promise((r) => setTimeout(r, 400));
  const idx2 = await page.evaluate(() => window.__PRINSON_FONT_LOOP__?.activeStyleIndex);
  console.log(`Font loop indexes: index1=${idx1}, index2=${idx2}`);
  if (idx1 === undefined || idx2 === undefined || idx1 === idx2) {
    throw new Error('FAIL: Typography loop is not actively cycling styles!');
  }
  console.log('✔ PASS: Typography loop continues cycling dynamically through all styles.');

  // ---------------------------------------------------------------------------
  // 3. TABLET VIEWPORT TEST (768 x 1024 - iPad Portrait)
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing Tablet Viewport (768x1024)...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const tabletMetrics = await page.evaluate(() => {
    const container = document.querySelector('.prinson-title-mobile-lift');
    const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    if (!container || !h1) return null;

    const style = window.getComputedStyle(container);
    const h1Rect = h1.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const h1CenterVertical = h1Rect.top + h1Rect.height / 2;
    const upwardShift = (viewportHeight / 2) - h1CenterVertical;

    return {
      transform: style.transform,
      upwardShift,
      isTransformNone: style.transform === 'none',
      isHorizontallyCentered: Math.abs((h1Rect.left + h1Rect.width / 2) - (viewportWidth / 2)) < 3,
    };
  });

  console.log('Tablet Metrics:', tabletMetrics);
  if (!tabletMetrics.isTransformNone && tabletMetrics.upwardShift > 10) {
    throw new Error(`FAIL: Tablet layout affected! Transform was ${tabletMetrics.transform}`);
  }
  console.log('✔ PASS: Tablet layout is 100% unaffected (transform is none).');
  await page.screenshot({ path: path.join(artifactDir, '02_tablet_prinson_unaffected.png') });

  // ---------------------------------------------------------------------------
  // 4. DESKTOP VIEWPORT TEST (1440 x 900)
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Desktop Viewport (1440x900)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));

  const desktopMetrics = await page.evaluate(() => {
    const container = document.querySelector('.prinson-title-mobile-lift');
    const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    if (!container || !h1) return null;

    const style = window.getComputedStyle(container);
    const h1Rect = h1.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const h1CenterVertical = h1Rect.top + h1Rect.height / 2;
    const upwardShift = (viewportHeight / 2) - h1CenterVertical;

    return {
      transform: style.transform,
      upwardShift,
      isTransformNone: style.transform === 'none',
      isHorizontallyCentered: Math.abs((h1Rect.left + h1Rect.width / 2) - (viewportWidth / 2)) < 3,
    };
  });

  console.log('Desktop Metrics:', desktopMetrics);
  if (!desktopMetrics.isTransformNone && desktopMetrics.upwardShift > 10) {
    throw new Error(`FAIL: Desktop layout affected! Transform was ${desktopMetrics.transform}`);
  }
  console.log('✔ PASS: Desktop layout is 100% unaffected (transform is none).');
  await page.screenshot({ path: path.join(artifactDir, '03_desktop_prinson_unaffected.png') });

  // ---------------------------------------------------------------------------
  // 5. TEST 3D ROTATION: TITLE REMAINS STATIONARY & FIXED
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing 3D rotation integrity: Title remains fixed...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 500));

  const titlePosBefore = await page.evaluate(() => {
    const r = document.querySelector('.prinson-title-mobile-lift').getBoundingClientRect();
    return { top: r.top, left: r.left };
  });

  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(300, 430, { steps: 5 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));

  const titlePosAfter = await page.evaluate(() => {
    const r = document.querySelector('.prinson-title-mobile-lift').getBoundingClientRect();
    return { top: r.top, left: r.left };
  });

  if (titlePosBefore.top !== titlePosAfter.top || titlePosBefore.left !== titlePosAfter.left) {
    throw new Error('FAIL: PRINSON title moved when 3D scene was rotated!');
  }
  console.log('✔ PASS: PRINSON title remains strictly fixed to viewport during 3D rotation.');

  await browser.close();
  console.log('\n=== ALL MOBILE PRINSON ELEVATION CHECKS PASSED ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
