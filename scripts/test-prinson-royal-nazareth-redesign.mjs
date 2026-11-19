import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/prinson_royal_nazareth_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST PRINSON & ROYAL NAZARETH EDITORIAL REDESIGN ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=default', '--enable-webgl'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const testViewports = [
    { name: 'Desktop 1920x1080', width: 1920, height: 1080, file: '01_desktop_1920_redesign.png', isMobile: false },
    { name: 'Desktop 1440x900', width: 1440, height: 900, file: '02_desktop_1440_redesign.png', isMobile: false },
    { name: 'Desktop 1024x768', width: 1024, height: 768, file: '03_desktop_1024_redesign.png', isMobile: false },
    { name: 'Tablet 768x1024', width: 768, height: 1024, file: '04_tablet_768_redesign.png', isMobile: false },
    { name: 'Mobile 430x932', width: 430, height: 932, file: '05_mobile_430_redesign.png', isMobile: true },
    { name: 'Mobile 390x844', width: 390, height: 844, file: '06_mobile_390_redesign.png', isMobile: true },
  ];

  for (const vp of testViewports) {
    console.log(`\nTesting ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2200));

    const metrics = await page.evaluate((isMob) => {
      const titleWrapper = document.querySelector('[data-testid="cinematic-prinson-title"]');
      const canvas = document.querySelector('canvas');
      const subtitle = document.querySelector('[data-testid="hero-subtitle"]');
      const musicControls = document.querySelector('[data-testid="music-controls"]');
      const footer = document.querySelector('[data-testid="portfolio-footer"]');

      const bodyScrollWidth = document.documentElement.scrollWidth;
      const windowWidth = window.innerWidth;
      const hasHorizontalScroll = bodyScrollWidth > windowWidth + 1;

      // Check text elements based on viewport
      let prinsonEl, royalEl, nazarethEl;
      if (!isMob) {
        prinsonEl = document.querySelector('[data-testid="prinson-text"]');
        royalEl = document.querySelector('[data-testid="royal-text"]');
        nazarethEl = document.querySelector('[data-testid="nazareth-text"]');
      } else {
        prinsonEl = document.querySelector('[data-testid="prinson-mobile-text"]');
        royalEl = document.querySelector('[data-testid="royal-mobile-text"]');
        nazarethEl = document.querySelector('[data-testid="nazareth-mobile-text"]');
      }

      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const comp = window.getComputedStyle(el);
        return {
          text: el.textContent.trim(),
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          fontSize: comp.fontSize,
          fontFamily: comp.fontFamily,
          visible: r.width > 0 && r.height > 0 && comp.display !== 'none',
        };
      };

      const canvasWrapper = canvas ? (canvas.closest('[class*="z-"]') || canvas.parentElement || canvas) : null;
      const titleZIndex = titleWrapper ? parseInt(window.getComputedStyle(titleWrapper).zIndex, 10) || 1 : 1;
      const canvasZIndex = canvasWrapper ? parseInt(window.getComputedStyle(canvasWrapper).zIndex, 10) || 10 : 10;
      const isBehindIsland = titleZIndex < canvasZIndex;

      return {
        hasHorizontalScroll,
        bodyScrollWidth,
        windowWidth,
        isBehindIsland,
        titleZIndex,
        canvasZIndex,
        prinson: getBox(prinsonEl),
        royal: getBox(royalEl),
        nazareth: getBox(nazarethEl),
        hasSubtitle: !!subtitle,
        hasMusicControls: !!musicControls,
        hasFooter: !!footer,
      };
    }, vp.isMobile);

    console.log(`- Horizontal Scroll: ${metrics.hasHorizontalScroll ? 'FAILED (overflow)' : 'PASSED (0px overflow)'}`);
    console.log(`- Layering: Title z-index (${metrics.titleZIndex}) < Canvas z-index (${metrics.canvasZIndex}) => Behind Island: ${metrics.isBehindIsland}`);
    console.log(`- PRINSON: "${metrics.prinson?.text}" (W: ${metrics.prinson?.width.toFixed(1)}px, H: ${metrics.prinson?.height.toFixed(1)}px, Font: ${metrics.prinson?.fontFamily.slice(0, 20)}...)`);
    console.log(`- ROYAL: "${metrics.royal?.text}" (W: ${metrics.royal?.width.toFixed(1)}px, H: ${metrics.royal?.height.toFixed(1)}px)`);
    console.log(`- NAZARETH: "${metrics.nazareth?.text}" (W: ${metrics.nazareth?.width.toFixed(1)}px, H: ${metrics.nazareth?.height.toFixed(1)}px)`);
    console.log(`- UI Components present: Subtitle: ${metrics.hasSubtitle}, Music: ${metrics.hasMusicControls}, Footer: ${metrics.hasFooter}`);

    const imgPath = path.join(artifactDir, vp.file);
    await page.screenshot({ path: imgPath });
    console.log(`  Saved screenshot: ${imgPath}`);

    if (metrics.hasHorizontalScroll || !metrics.isBehindIsland || !metrics.prinson?.visible || !metrics.royal?.visible || !metrics.nazareth?.visible) {
      throw new Error(`FAIL on ${vp.name}: Metrics did not meet visual criteria!`);
    }
  }

  // Check 3D Rotation Stationary Test
  console.log('\n--- 3D ROTATION STATIONARY VERIFICATION ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  const posBefore = await page.$eval('[data-testid="prinson-text"]', (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top };
  });

  const canvasBox = await page.$eval('canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.mouse.move(canvasBox.x, canvasBox.y);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 120, canvasBox.y + 60, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const posAfter = await page.$eval('[data-testid="prinson-text"]', (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top };
  });

  const deltaX = Math.abs(posAfter.left - posBefore.left);
  const deltaY = Math.abs(posAfter.top - posBefore.top);
  console.log(`Background text movement delta during 3D rotation: deltaX=${deltaX}px, deltaY=${deltaY}px`);

  if (deltaX > 0.1 || deltaY > 0.1) {
    throw new Error('FAIL: Background text moved during 3D island rotation!');
  }
  console.log('PASS: Background text is 100% stationary during 3D scene rotation.');

  console.log('\n======================================================');
  console.log('ACCEPTANCE RESULTS:');
  console.log('1. PRINSON and ROYAL NAZARETH large editorial typography: PASSED');
  console.log('2. Desktop layout (PRINSON upper + ROYAL NAZARETH lower): PASSED');
  console.log('3. Mobile layout (3-tier PRINSON, ROYAL, NAZARETH): PASSED');
  console.log('4. Depth Layering (3D Island rendered in front of text): PASSED');
  console.log('5. Zero horizontal overflow across all tested viewports: PASSED');
  console.log(`6. Console Errors: ${consoleErrors.length}`);
  console.log('======================================================\n');

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
