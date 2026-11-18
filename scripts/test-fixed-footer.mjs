import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/fixed_footer_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST FIXED BOTTOM FOOTER (DESKTOP & MOBILE) ===\n');

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

  // 1. DESKTOP TEST
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio on Desktop (1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('2. Inspecting Footer DOM & Elements...');
  const footerData = await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="portfolio-footer"]');
    if (!footer) return null;

    const links = Array.from(footer.querySelectorAll('nav[aria-label="Social Links"] a')).map((a) => ({
      name: a.getAttribute('aria-label'),
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
    }));

    const counterEl = footer.querySelector('[data-testid="footer-copyright-counter"]');
    const counterText = counterEl ? counterEl.textContent?.trim() : null;

    const rect = footer.getBoundingClientRect();
    const style = window.getComputedStyle(footer);

    return {
      exists: true,
      position: style.position,
      bottom: style.bottom,
      pointerEvents: style.pointerEvents,
      links,
      counterText,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };
  });

  console.log('Footer Data:', JSON.stringify(footerData, null, 2));

  if (!footerData || !footerData.exists) {
    throw new Error('FAIL: Footer element not found in DOM!');
  }

  if (footerData.position !== 'fixed') {
    throw new Error(`FAIL: Expected fixed positioning, got ${footerData.position}`);
  }

  if (footerData.pointerEvents !== 'none') {
    throw new Error(`FAIL: Expected pointer-events: none on wrapper, got ${footerData.pointerEvents}`);
  }

  // Validate Social Links
  const expectedLinks = [
    { name: 'GitHub', href: 'https://github.com/PRN-6' },
    { name: 'LinkedIn', href: 'https://linkedin.com/in/prins' },
    { name: 'Email', href: 'mailto:prins.engineering@outlook.com' },
    { name: 'Spotify', href: 'https://open.spotify.com' },
  ];

  if (footerData.links.length !== 4) {
    throw new Error(`FAIL: Expected 4 social links, found ${footerData.links.length}`);
  }

  expectedLinks.forEach((exp, idx) => {
    const act = footerData.links[idx];
    if (act.name !== exp.name || act.href !== exp.href) {
      throw new Error(`FAIL: Link ${idx} mismatch. Expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`);
    }
  });
  console.log('PASS: All 4 social links present with exact URLs.');

  // Validate Copyright and Visitor Text
  console.log(`Copyright & Counter string: "${footerData.counterText}"`);
  const copyrightPattern = /©\s*2026\s*•\s*vis:\s*\d+/;
  if (!copyrightPattern.test(footerData.counterText)) {
    throw new Error(`FAIL: Copyright text "${footerData.counterText}" does not match pattern "© 2026 • vis: [number]"`);
  }
  console.log('PASS: Copyright and visitor count text properly formatted.');

  // Check 3D Rotation Stationary Behavior
  console.log('3. Testing stationary behavior during 3D scene mouse drag...');
  const initialRect = footerData.rect;

  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(850, 400, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 600));

  const postDragRect = await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="portfolio-footer"]');
    if (!footer) return null;
    const r = footer.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  const deltaX = Math.abs(postDragRect.x - initialRect.x);
  const deltaY = Math.abs(postDragRect.y - initialRect.y);
  console.log(`Footer movement delta after 3D drag: deltaX=${deltaX}px, deltaY=${deltaY}px`);

  if (deltaX > 0.5 || deltaY > 0.5) {
    throw new Error(`FAIL: Footer shifted during 3D rotation! deltaX=${deltaX}, deltaY=${deltaY}`);
  }
  console.log('PASS: Footer remained 100% stationary during 3D island rotation.');

  // Desktop Screenshot
  const desktopScreenshot = path.join(artifactDir, '01_desktop_footer.png');
  await page.screenshot({ path: desktopScreenshot });
  console.log(`Saved screenshot: ${desktopScreenshot}`);

  // 2. MOBILE TEST
  console.log('\n4. Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const mobileMetrics = await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="portfolio-footer"]');
    const socialNav = footer?.querySelector('nav[aria-label="Social Links"]');
    const counter = footer?.querySelector('[data-testid="footer-copyright-counter"]');

    const bodyWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    const socialRect = socialNav ? socialNav.getBoundingClientRect() : null;
    const counterRect = counter ? counter.getBoundingClientRect() : null;

    return {
      hasOverflow: scrollWidth > bodyWidth,
      socialLeft: socialRect?.left,
      counterRight: counterRect ? bodyWidth - counterRect.right : null,
      gapBetween: counterRect && socialRect ? counterRect.left - socialRect.right : 0,
    };
  });

  console.log('Mobile Metrics:', mobileMetrics);

  if (mobileMetrics.hasOverflow) {
    throw new Error('FAIL: Horizontal overflow detected on mobile!');
  }
  if (mobileMetrics.gapBetween < 10) {
    throw new Error(`FAIL: Insufficient gap between social links and counter on mobile (${mobileMetrics.gapBetween}px)`);
  }
  console.log('PASS: Mobile footer renders cleanly without overflow or overlap.');

  // Mobile Screenshot
  const mobileScreenshot = path.join(artifactDir, '02_mobile_footer.png');
  await page.screenshot({ path: mobileScreenshot });
  console.log(`Saved screenshot: ${mobileScreenshot}`);

  // 3. PERSISTENT VISITOR COUNTER TEST
  console.log('\n5. Testing Visitor Counter Persistence across page refresh...');
  const initialVisCount = await page.evaluate(() => {
    return localStorage.getItem('prinson_portfolio_visits');
  });
  console.log(`Initial stored visits: ${initialVisCount}`);

  // Refresh page (same session, counter should remain same)
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const sameSessionVisCount = await page.evaluate(() => {
    return localStorage.getItem('prinson_portfolio_visits');
  });
  console.log(`Visits after refresh in same session: ${sameSessionVisCount}`);
  if (initialVisCount !== sameSessionVisCount) {
    throw new Error(`FAIL: Same session should preserve count, changed from ${initialVisCount} to ${sameSessionVisCount}`);
  }

  // Clear session storage to simulate new session
  await page.evaluate(() => {
    sessionStorage.removeItem('prinson_session_active');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const newSessionVisCount = await page.evaluate(() => {
    return localStorage.getItem('prinson_portfolio_visits');
  });
  console.log(`Visits after new session: ${newSessionVisCount}`);
  if (parseInt(newSessionVisCount, 10) !== parseInt(initialVisCount, 10) + 1) {
    throw new Error(`FAIL: New session should increment visits from ${initialVisCount} to ${parseInt(initialVisCount, 10) + 1}`);
  }
  console.log('PASS: Visitor counter accurately increments once per session and persists.');

  // Console Errors Check
  console.log('\n6. Checking console errors...');
  if (consoleErrors.length > 0) {
    throw new Error(`FAIL: Encountered browser console errors: ${consoleErrors.join(', ')}`);
  }
  console.log('PASS: Zero console errors.');

  console.log('\n=== ALL FOOTER TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
