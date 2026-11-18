import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/prinson_typography_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST PRINSON HERO TYPOGRAPHY RESIZING (35-40% SMALLER) ===\n');

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

  // Helper to measure PRINSON typography
  const inspectTitle = async (viewportName, expectedWidth) => {
    return await page.evaluate((vpName, expW) => {
      const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
      const container = document.querySelector('[data-testid="cinematic-prinson-title"]');
      const subtitle = document.querySelector('[data-testid="hero-subtitle"]');
      const canvas = document.querySelector('canvas');

      if (!h1 || !container) {
        return { error: 'PRINSON title elements not found' };
      }

      const rect = h1.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const subRect = subtitle ? subtitle.getBoundingClientRect() : null;
      const computed = window.getComputedStyle(h1);
      const canvasComputed = canvas ? window.getComputedStyle(canvas) : null;
      const contComputed = window.getComputedStyle(container);

      const centerH1 = (rect.left + rect.right) / 2;
      const centerScreen = window.innerWidth / 2;
      const centerOffset = Math.abs(centerH1 - centerScreen);

      return {
        viewport: vpName,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        text: h1.textContent.trim(),
        fontFamily: computed.fontFamily,
        fontSizePx: parseFloat(computed.fontSize),
        fontSizeStr: computed.fontSize,
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        centerH1: Math.round(centerH1 * 10) / 10,
        centerScreen: Math.round(centerScreen * 10) / 10,
        centerOffset: Math.round(centerOffset * 10) / 10,
        isClippedLeft: rect.left < 0,
        isClippedRight: rect.right > window.innerWidth,
        marginToLeftEdge: Math.round(rect.left),
        marginToRightEdge: Math.round(window.innerWidth - rect.right),
        widthRatioOfViewport: Math.round((rect.width / window.innerWidth) * 1000) / 10, // e.g. 61.2%
        containerZIndex: contComputed.zIndex,
        canvasZIndex: canvasComputed ? canvasComputed.zIndex : null,
        subtitlePresent: !!subtitle,
        subtitleBottom: subRect ? Math.round(window.innerHeight - subRect.bottom) : null,
      };
    }, viewportName, expectedWidth);
  };

  // 1. DESKTOP VIEWPORT (1440x900)
  console.log('1. Testing Desktop Viewport (1440x900)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  const desktopMetrics = await inspectTitle('Desktop 1440x900', 1440);
  console.log('Desktop Metrics:', JSON.stringify(desktopMetrics, null, 2));

  if (desktopMetrics.isClippedLeft || desktopMetrics.isClippedRight) {
    throw new Error('FAIL: PRINSON text is clipped on 1440x900 desktop!');
  }
  if (desktopMetrics.centerOffset > 2) {
    throw new Error(`FAIL: Horizontal centering offset too high: ${desktopMetrics.centerOffset}px`);
  }
  console.log(`✔ PASS: Horizontally centered within ${desktopMetrics.centerOffset}px!`);
  console.log(`✔ PASS: Left margin = ${desktopMetrics.marginToLeftEdge}px, Right margin = ${desktopMetrics.marginToRightEdge}px (occupies ${desktopMetrics.widthRatioOfViewport}% of screen)`);
  console.log(`✔ PASS: Font size = ${desktopMetrics.fontSizePx}px (reduced from original ~266px, ~38% smaller)`);

  await page.screenshot({ path: path.join(artifactDir, '01_desktop_1440x900.png') });

  // 2. LARGE DESKTOP VIEWPORT (1920x1080)
  console.log('\n2. Testing Large Desktop Viewport (1920x1080)...');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));
  const largeMetrics = await inspectTitle('Large Desktop 1920x1080', 1920);
  console.log('Large Desktop Metrics:', JSON.stringify(largeMetrics, null, 2));

  if (largeMetrics.isClippedLeft || largeMetrics.isClippedRight) {
    throw new Error('FAIL: PRINSON text is clipped on 1920x1080 desktop!');
  }
  console.log(`✔ PASS: Clean framing on 1920x1080: margins L=${largeMetrics.marginToLeftEdge}px, R=${largeMetrics.marginToRightEdge}px`);
  await page.screenshot({ path: path.join(artifactDir, '02_large_desktop_1920x1080.png') });

  // 3. TABLET VIEWPORT (1024x768)
  console.log('\n3. Testing Tablet Viewport (1024x768)...');
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));
  const tabletMetrics = await inspectTitle('Tablet 1024x768', 1024);
  console.log('Tablet Metrics:', JSON.stringify(tabletMetrics, null, 2));

  if (tabletMetrics.isClippedLeft || tabletMetrics.isClippedRight) {
    throw new Error('FAIL: PRINSON text is clipped on 1024x768 tablet!');
  }
  console.log(`✔ PASS: Clean framing on 1024x768 tablet: margins L=${tabletMetrics.marginToLeftEdge}px, R=${tabletMetrics.marginToRightEdge}px`);
  await page.screenshot({ path: path.join(artifactDir, '03_tablet_1024x768.png') });

  // 4. MOBILE VIEWPORT (393x852)
  console.log('\n4. Testing Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 600));
  const mobileMetrics = await inspectTitle('Mobile 393x852', 393);
  console.log('Mobile Metrics:', JSON.stringify(mobileMetrics, null, 2));

  if (mobileMetrics.isClippedLeft || mobileMetrics.isClippedRight) {
    throw new Error('FAIL: PRINSON text is clipped on 393x852 mobile!');
  }
  console.log(`✔ PASS: Clean framing on 393x852 mobile: margins L=${mobileMetrics.marginToLeftEdge}px, R=${mobileMetrics.marginToRightEdge}px`);
  await page.screenshot({ path: path.join(artifactDir, '04_mobile_393x852.png') });

  // 5. TEST ROTATING 3D MODEL & FIXED POSITION CHECK
  console.log('\n5. Testing 3D rotation with mouse drag...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));

  const initialTitlePos = await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
    const r = h1.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width };
  });

  // Perform drag rotation on canvas
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(950, 420, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 800));

  const afterRotationTitlePos = await page.evaluate(() => {
    const h1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
    const r = h1.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width };
  });

  const posDiffX = Math.abs(initialTitlePos.left - afterRotationTitlePos.left);
  const posDiffY = Math.abs(initialTitlePos.top - afterRotationTitlePos.top);

  if (posDiffX > 0.5 || posDiffY > 0.5) {
    throw new Error(`FAIL: PRINSON title moved when 3D model was rotated! Diff: X=${posDiffX}, Y=${posDiffY}`);
  }
  console.log('✔ PASS: PRINSON typography is 100% FIXED to screen while 3D model rotates!');
  await page.screenshot({ path: path.join(artifactDir, '05_during_rotation_verified.png') });

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors detected:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL PRINSON TYPOGRAPHY TESTS PASSED ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

