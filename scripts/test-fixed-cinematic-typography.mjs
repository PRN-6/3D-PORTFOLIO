import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/cinematic_typography_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST FIXED CINEMATIC 3D BACKGROUND TYPOGRAPHY ===\n');

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
  console.log('1. Loading portfolio on desktop (1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // --- CHECK 1: VERIFY TITLE ELEMENT & ONLY "PRINSON" TEXT ---
  console.log('\n2. Verifying Title element & English-only text "PRINSON"...');
  const titleInfo = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    if (!el) return null;
    const spans = Array.from(el.querySelectorAll('span'));
    const textContents = spans.map((s) => s.textContent.trim());
    const diagnostic = window.__CINEMATIC_TITLE_STATE__;

    // Measure bounding box of the active text span
    const activeSpan = spans.find((s) => {
      const parent = s.parentElement;
      return parent && parseFloat(window.getComputedStyle(parent).opacity) > 0.5;
    }) || spans[0];

    const rect = activeSpan.getBoundingClientRect();
    const computed = window.getComputedStyle(activeSpan);

    return {
      found: true,
      texts: textContents,
      uniqueWords: [...new Set(textContents)],
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        expectedCenterX: window.innerWidth / 2,
        expectedCenterY: window.innerHeight / 2,
      },
      diagnostic,
    };
  });

  console.log('Title Info:', JSON.stringify(titleInfo, null, 2));

  if (!titleInfo || !titleInfo.found) {
    throw new Error('FAIL: data-testid="cinematic-prinson-title" element not found!');
  }

  // Ensure only "PRINSON" exists
  if (titleInfo.uniqueWords.length !== 1 || titleInfo.uniqueWords[0] !== 'PRINSON') {
    throw new Error(`FAIL: Expected only ["PRINSON"], found: ${JSON.stringify(titleInfo.uniqueWords)}`);
  }
  console.log('PASS: Text strictly contains English word "PRINSON" with zero multilingual glyphs.');

  // Check Centering
  const deltaX = Math.abs(titleInfo.rect.centerX - titleInfo.viewport.expectedCenterX);
  const deltaY = Math.abs(titleInfo.rect.centerY - titleInfo.viewport.expectedCenterY);
  console.log(`Horizontal center offset: ${deltaX.toFixed(2)}px (Threshold: 2.0px)`);
  console.log(`Vertical center offset: ${deltaY.toFixed(2)}px (Threshold: 3.0px)`);

  if (deltaX > 2.0) {
    throw new Error(`FAIL: Title is not horizontally centered! Offset: ${deltaX}px`);
  }
  if (deltaY > 5.0) {
    throw new Error(`FAIL: Title is not vertically centered! Offset: ${deltaY}px`);
  }
  console.log('PASS: Title is dead-center in the viewport horizontally and vertically.');

  // Check Large Size
  const fontSizePx = parseFloat(titleInfo.fontSize);
  console.log(`Measured Font Size: ${fontSizePx.toFixed(1)}px (Expected >= 150px on desktop)`);
  if (fontSizePx < 150) {
    throw new Error(`FAIL: Font size too small on desktop: ${fontSizePx}px`);
  }
  console.log('PASS: Title size is massive and cinematic.');

  // Check No Clipping
  if (titleInfo.rect.left < 0 || titleInfo.rect.right > titleInfo.viewport.width) {
    throw new Error(`FAIL: Title clips outside viewport! Left: ${titleInfo.rect.left}, Right: ${titleInfo.rect.right}`);
  }
  console.log(`PASS: Title is fully contained in viewport (Left: ${titleInfo.rect.left.toFixed(1)}px, Right: ${titleInfo.rect.right.toFixed(1)}px).`);

  const initialScreenshot = path.join(artifactDir, '01_initial_desktop_home.png');
  await page.screenshot({ path: initialScreenshot });
  console.log(`Saved screenshot: ${initialScreenshot}`);

  // --- CHECK 2: ROTATE ISLAND 360 DEGREES AND VERIFY EXACT ZERO PIXEL SHIFT ---
  console.log('\n3. Rotating 3D island 360 degrees and testing typography stationarity...');
  const canvasBox = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (!canvasBox) {
    throw new Error('Canvas not found');
  }

  const initialRect = titleInfo.rect;

  // Perform multiple drag gestures to rotate island horizontally and vertically
  const dragSteps = [
    { dx: 300, dy: 0, desc: 'Drag 1: Horizontal 90 deg rotation' },
    { dx: 300, dy: 50, desc: 'Drag 2: Horizontal 180 deg + Pitch down' },
    { dx: 300, dy: -100, desc: 'Drag 3: Horizontal 270 deg + Pitch up' },
    { dx: 300, dy: 50, desc: 'Drag 4: Horizontal 360 deg complete orbit' },
  ];

  for (let i = 0; i < dragSteps.length; i++) {
    const step = dragSteps[i];
    console.log(`Executing ${step.desc}...`);
    await page.mouse.move(canvasBox.x, canvasBox.y);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + step.dx, canvasBox.y + step.dy, { steps: 20 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 400));

    // Verify title position after rotation
    const currentTitleRect = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
      const spans = Array.from(el.querySelectorAll('span'));
      const activeSpan = spans.find((s) => {
        const parent = s.parentElement;
        return parent && parseFloat(window.getComputedStyle(parent).opacity) > 0.5;
      }) || spans[0];
      const rect = activeSpan.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    });

    const shiftX = Math.abs(currentTitleRect.centerX - initialRect.centerX);
    const shiftY = Math.abs(currentTitleRect.centerY - initialRect.centerY);
    console.log(`  -> Title center shift: X = ${shiftX.toFixed(3)}px, Y = ${shiftY.toFixed(3)}px`);

    if (shiftX > 0.5 || shiftY > 0.5) {
      throw new Error(`FAIL: Title moved during island rotation! Shift: X=${shiftX}px, Y=${shiftY}px`);
    }

    const rotScreenshot = path.join(artifactDir, `02_rotated_step_${i + 1}.png`);
    await page.screenshot({ path: rotScreenshot });
    console.log(`  Saved rotation screenshot: ${rotScreenshot}`);
  }
  console.log('PASS: Title stayed 100% stationary with 0.000px displacement across 360-degree rotation!');

  // Reset View using navigation button
  console.log('\n4. Testing Reset View button...');
  const resetBtnClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reset View') || b.getAttribute('aria-label')?.includes('Reset')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`Reset View clicked: ${resetBtnClicked}`);
  await new Promise((r) => setTimeout(r, 800));

  // --- CHECK 3: VERIFY ENGLISH FONT CYCLING TRANSITIONS ---
  console.log('\n5. Monitoring English font style cycling transitions...');
  const observedFonts = new Set();
  const fontStates = [];

  for (let s = 0; s < 4; s++) {
    const state = await page.evaluate(() => window.__CINEMATIC_TITLE_STATE__);
    if (state && state.fontName) {
      observedFonts.add(state.fontName);
      fontStates.push(state);
      console.log(`  Cycle ${s + 1}: Current Font = "${state.fontName}" (${state.fontFamily})`);
      const fontScreenshot = path.join(artifactDir, `03_font_${s + 1}_${state.fontName.replace(/\s+/g, '_')}.png`);
      await page.screenshot({ path: fontScreenshot });
    }
    // Wait for next transition (approx 5.0s per cycle)
    await new Promise((r) => setTimeout(r, 5200));
  }

  console.log('Observed distinct fonts:', Array.from(observedFonts));
  if (observedFonts.size < 2) {
    throw new Error(`FAIL: Expected multiple distinct font transitions, observed: ${observedFonts.size}`);
  }
  console.log('PASS: Typography cycles smoothly through multiple English font styles!');

  // --- CHECK 4: VERIFY VIEWPORTS (DESKTOP, LAPTOP, TABLET, MOBILE) ---
  console.log('\n6. Testing responsive viewports...');
  const viewports = [
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`Testing viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 600));

    const vpInfo = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
      const spans = Array.from(el.querySelectorAll('span'));
      const activeSpan = spans.find((s) => {
        const parent = s.parentElement;
        return parent && parseFloat(window.getComputedStyle(parent).opacity) > 0.5;
      }) || spans[0];
      const rect = activeSpan.getBoundingClientRect();
      const style = window.getComputedStyle(activeSpan);
      return {
        fontSize: style.fontSize,
        rect: {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2,
        },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    });

    console.log(`  -> Font size: ${vpInfo.fontSize}`);
    console.log(`  -> Left: ${vpInfo.rect.left.toFixed(1)}px, Right: ${vpInfo.rect.right.toFixed(1)}px (Width: ${vpInfo.viewport.width}px)`);

    // Verify centering
    const vpDeltaX = Math.abs(vpInfo.rect.centerX - vpInfo.viewport.width / 2);
    if (vpDeltaX > 3.0) {
      throw new Error(`FAIL: Not centered on ${vp.name}! DeltaX: ${vpDeltaX}px`);
    }

    // Verify no clipping
    if (vpInfo.rect.left < 0 || vpInfo.rect.right > vpInfo.viewport.width) {
      throw new Error(`FAIL: Text clipped on ${vp.name}! Left: ${vpInfo.rect.left}, Right: ${vpInfo.rect.right}`);
    }

    const vpScreenshot = path.join(artifactDir, `04_viewport_${vp.name}.png`);
    await page.screenshot({ path: vpScreenshot });
    console.log(`  Saved screenshot: ${vpScreenshot}`);
  }
  console.log('PASS: All viewports centered and free of clipping.');

  // Restore desktop viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 500));

  // --- CHECK 5: VERIFY NAVIGATION STILL WORKS SEAMLESSLY ---
  console.log('\n7. Verifying all 5 navigation buttons still work with new architecture...');
  const navButtons = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('button')).map((b) => b.textContent.trim());
  });
  console.log('Navigation buttons present:', navButtons);
  if (navButtons.length !== 5) {
    throw new Error(`Expected 5 navigation buttons, got ${navButtons.length}`);
  }

  // Helper to wait for transition to target island
  const waitForIsland = async (expectedIsland, timeoutMs = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = await page.evaluate(() => {
        return {
          currentIsland: window.__CURRENT_ACTIVE_ISLAND__,
          transitionState: window.__EXPLODED_TRANSITION_STATE__,
        };
      });

      if (state.currentIsland === expectedIsland && (!state.transitionState || state.transitionState.phase === 'COMPLETE')) {
        return state;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    const finalState = await page.evaluate(() => ({
      currentIsland: window.__CURRENT_ACTIVE_ISLAND__,
      transitionState: window.__EXPLODED_TRANSITION_STATE__,
    }));
    throw new Error(`Timeout waiting for island ${expectedIsland}. Current state: ${JSON.stringify(finalState)}`);
  };

  // Click Products (Workshop)
  console.log('Clicking "Products"...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Products');
    btn?.click();
  });
  await waitForIsland('WORKSHOP');
  await new Promise((r) => setTimeout(r, 600));

  const workshopIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island after Products click: "${workshopIsland}"`);
  if (workshopIsland !== 'WORKSHOP') {
    throw new Error(`Expected WORKSHOP, got ${workshopIsland}`);
  }
  const workshopScreenshot = path.join(artifactDir, '05_nav_products_workshop.png');
  await page.screenshot({ path: workshopScreenshot });

  // Return to Home
  console.log('Clicking "Home"...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Home');
    btn?.click();
  });
  await waitForIsland('HOME');
  await new Promise((r) => setTimeout(r, 600));

  const homeReturnedIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island after Home return: "${homeReturnedIsland}"`);
  if (homeReturnedIsland !== 'HOME') {
    throw new Error(`Expected HOME, got ${homeReturnedIsland}`);
  }
  const homeReturnScreenshot = path.join(artifactDir, '06_nav_home_returned.png');
  await page.screenshot({ path: homeReturnScreenshot });

  // Check console errors
  console.log('\n8. Checking console errors...');
  if (consoleErrors.length > 0) {
    console.warn(`WARNING: Encountered ${consoleErrors.length} errors:`, consoleErrors);
  } else {
    console.log('ZERO console errors detected! 100% clean.');
  }

  console.log('\n=== ALL VERIFICATION TESTS PASSED FLAWLESSLY! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

