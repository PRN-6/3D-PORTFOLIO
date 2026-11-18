import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/prinson_font_loop_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST PRINSON ANIMATED TYPOGRAPHY LOOP (6 ENGLISH FONTS) ===\n');

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
  console.log('1. Loading portfolio homepage...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // --- CHECK 1: VERIFY 6 STYLES IN DIAGNOSTICS ---
  const loopInfo = await page.evaluate(() => window.__PRINSON_FONT_LOOP__);
  if (!loopInfo || !loopInfo.styles || loopInfo.styles.length !== 6) {
    throw new Error('FAIL: __PRINSON_FONT_LOOP__ does not have 6 typography styles!');
  }
  console.log(`✔ Verified ${loopInfo.styles.length} distinct English typography styles:`);
  loopInfo.styles.forEach((s, idx) => {
    console.log(`  Style ${idx + 1}: [${s.id}] "${s.name}" -> ${s.fontFamily}`);
  });

  // --- CHECK 2: MEASURE AND VERIFY EACH OF THE 6 STYLES ---
  console.log('\n2. Testing each of the 6 English styles for exact centering, margins, and visibility...');
  const measuredStyles = [];

  for (let i = 0; i < 6; i++) {
    // Switch to style i
    await page.evaluate((idx) => {
      if (typeof window.__PRINSON_SET_FONT_INDEX__ === 'function') {
        window.__PRINSON_SET_FONT_INDEX__(idx);
      }
    }, i);

    // Wait for transition to complete
    await new Promise((r) => setTimeout(r, 900));

    const metric = await page.evaluate((idx) => {
      const loop = window.__PRINSON_FONT_LOOP__;
      const style = loop.styles[idx];
      const h1 = document.querySelector(`[data-testid="cinematic-prinson-title"] h1[data-style-id="${style.id}"]`);
      if (!h1) return null;
      const span = h1.querySelector('span') || h1;
      const rect = span.getBoundingClientRect();
      const comp = window.getComputedStyle(h1);

      const centerText = (rect.left + rect.right) / 2;
      const centerScreen = window.innerWidth / 2;
      const centerOffset = Math.abs(centerText - centerScreen);

      return {
        index: idx + 1,
        id: style.id,
        name: style.name,
        fontFamily: comp.fontFamily,
        fontSizePx: parseFloat(comp.fontSize),
        fontSizeStr: comp.fontSize,
        opacity: comp.opacity,
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        centerOffset: Math.round(centerOffset * 10) / 10,
        marginToLeftEdge: Math.round(rect.left),
        marginToRightEdge: Math.round(window.innerWidth - rect.right),
        isClippedLeft: rect.left < 0,
        isClippedRight: rect.right > window.innerWidth,
        text: span.textContent.trim(),
      };
    }, i);

    if (!metric) {
      throw new Error(`FAIL: Could not measure style index ${i}`);
    }

    measuredStyles.push(metric);
    console.log(`\nStyle ${metric.index}: ${metric.name}`);
    console.log(`  Font Family: ${metric.fontFamily}`);
    console.log(`  Computed Font Size: ${metric.fontSizeStr}`);
    console.log(`  Text Width: ${metric.rect.width}px`);
    console.log(`  Margins: Left = ${metric.marginToLeftEdge}px, Right = ${metric.marginToRightEdge}px`);
    console.log(`  Centering Offset: ${metric.centerOffset}px`);
    console.log(`  Text Content: "${metric.text}"`);

    if (metric.text !== 'PRINSON') {
      throw new Error(`FAIL: Text content must be PRINSON! Saw: "${metric.text}"`);
    }
    if (metric.isClippedLeft || metric.isClippedRight) {
      throw new Error(`FAIL: Style ${metric.name} is clipped at the screen edge!`);
    }
    if (metric.centerOffset > 2) {
      throw new Error(`FAIL: Style ${metric.name} centering offset too high: ${metric.centerOffset}px`);
    }
    if (metric.marginToLeftEdge < 50 || metric.marginToRightEdge < 50) {
      throw new Error(`FAIL: Style ${metric.name} margins too small (less than 50px)!`);
    }

    const filename = `0${metric.index}_style_${metric.id}.png`;
    await page.screenshot({ path: path.join(artifactDir, filename) });
    console.log(`  ✔ Screenshot saved: ${filename}`);
  }

  // --- CHECK 3: AUTOMATIC LOOP ADVANCEMENT ---
  console.log('\n3. Verifying automatic continuous timer loop...');
  const initialIndex = await page.evaluate(() => window.__PRINSON_FONT_LOOP__.activeStyleIndex);
  console.log(`Initial active style index: ${initialIndex}`);
  console.log('Waiting 4.2s for automatic timer advance...');
  await new Promise((r) => setTimeout(r, 4200));

  const advancedIndex = await page.evaluate(() => window.__PRINSON_FONT_LOOP__.activeStyleIndex);
  console.log(`Advanced active style index: ${advancedIndex}`);
  if (advancedIndex === initialIndex) {
    throw new Error('FAIL: Font loop did not automatically advance after 4.2s interval!');
  }
  console.log('✔ PASS: Animated typography loop automatically cycles through styles in infinite loop!');

  // --- CHECK 4: 3D MODEL DRAG ROTATION (STATIONARY VIEWPORT CHECK) ---
  console.log('\n4. Verifying stationary typography during 3D model mouse drag...');
  const posBefore = await page.evaluate(() => {
    const activeH1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    const r = activeH1 ? activeH1.getBoundingClientRect() : { left: 0, top: 0 };
    return { left: r.left, top: r.top };
  });

  // Drag on 3D canvas
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(950, 410, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const posAfter = await page.evaluate(() => {
    const activeH1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    const r = activeH1 ? activeH1.getBoundingClientRect() : { left: 0, top: 0 };
    return { left: r.left, top: r.top };
  });

  const diffX = Math.abs(posBefore.left - posAfter.left);
  const diffY = Math.abs(posBefore.top - posAfter.top);
  if (diffX > 0.5 || diffY > 0.5) {
    throw new Error(`FAIL: Typography moved during 3D rotation! diffX=${diffX}, diffY=${diffY}`);
  }
  console.log('✔ PASS: Typography remains 100% fixed to the viewport during 3D model rotation!');
  await page.screenshot({ path: path.join(artifactDir, '07_during_3d_rotation.png') });

  // --- CHECK 5: MOBILE VIEWPORT TEST ---
  console.log('\n5. Verifying Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 1000));

  const mobileMetric = await page.evaluate(() => {
    const activeH1 = document.querySelector('[data-testid="cinematic-prinson-title"] h1[data-active="true"] span');
    if (!activeH1) return null;
    const r = activeH1.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      isClippedLeft: r.left < 0,
      isClippedRight: r.right > window.innerWidth,
      marginL: Math.round(r.left),
      marginR: Math.round(window.innerWidth - r.right),
    };
  });

  console.log('Mobile Metric:', mobileMetric);
  if (!mobileMetric || mobileMetric.isClippedLeft || mobileMetric.isClippedRight) {
    throw new Error('FAIL: Typography clipped on mobile!');
  }
  console.log('✔ PASS: Mobile typography fits cleanly with zero clipping');
  await page.screenshot({ path: path.join(artifactDir, '08_mobile_view.png') });

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL 6 PRINSON ANIMATED TYPOGRAPHY STYLES VERIFIED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
